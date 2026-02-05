import { v } from "convex/values";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { internalMutation } from "../_generated/server";
import type { AuthorizedMutationCtx, AuthorizedQueryCtx } from "../lib/server";
import { createAuthorizedMutation, createAuthorizedQuery } from "../lib/server";

// Top-level regex constants for better performance
const SUBDOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
const DOMAIN_REGEX =
	/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/;

function requireSubjectId(ctx: unknown): Id<"users"> {
	const subject = (ctx as { subject?: string | null }).subject;
	if (!subject) {
		throw new Error("Authentication required");
	}
	return subject as Id<"users">;
}

// ============================================
// Broker Query Functions
// ============================================

/**
 * Get broker by ID
 * Returns the broker record for a given broker ID
 */
export const getBrokerById = createAuthorizedQuery(["admin"])({
	args: {
		brokerId: v.id("brokers"),
	},
	handler: async (ctx: AuthorizedQueryCtx, args) =>
		await ctx.db.get(args.brokerId),
});

/**
 * Get broker with application data by ID
 * Returns the broker record along with their original onboarding journey data and user info
 */
export const getBrokerWithApplicationData = createAuthorizedQuery(["admin"])({
	args: {
		brokerId: v.id("brokers"),
	},
	handler: async (ctx: AuthorizedQueryCtx, args) => {
		const broker = await ctx.db.get(args.brokerId);

		if (!broker) {
			return null;
		}

		// Fetch the broker user's profile information
		const user = await ctx.db.get(broker.userId);

		// Fetch the original onboarding journey to get application data
		const journey = await ctx.db
			.query("onboarding_journeys")
			.withIndex("by_user", (q) => q.eq("userId", broker.userId))
			.filter((q) => q.eq(q.field("persona"), "broker"))
			.first();

		// Fetch WorkOS organization name if available
		let workosOrgName: string | undefined;
		let workosRole: string | undefined;

		if (broker.workosOrgId) {
			const org = await ctx.db
				.query("organizations")
				.withIndex("byWorkosId", (q) => q.eq("id", broker.workosOrgId))
				.unique();
			if (org) {
				workosOrgName = org.name;
			}

			// Fetch broker's role in the organization if user has WorkOS ID
			if (user?.idp_id) {
				const membership = await ctx.db
					.query("organization_memberships")
					.withIndex("byUserOrganization", (q) =>
						q
							.eq("user_id", user.idp_id)
							.eq("organization_id", broker.workosOrgId)
					)
					.unique();

				if (membership) {
					// Prefer role object, fallback to roles array, then status
					workosRole =
						membership.role?.slug ||
						(membership.roles && membership.roles.length > 0
							? membership.roles[0].slug
							: undefined);
				}
			}
		}

		return {
			...broker,
			user: user
				? {
						firstName: user.first_name,
						lastName: user.last_name,
						email: user.email,
						phone: user.phone,
					}
				: null,
			applicationData: journey?.context?.broker ?? null,
			journeyId: journey?._id ?? null,
			workosOrgName,
			workosRole,
		};
	},
});

/**
 * Get broker by user ID
 * Returns the broker record associated with a specific user
 */
export const getBrokerByUserId = createAuthorizedQuery(["any"])({
	args: {
		userId: v.optional(v.id("users")),
	},
	handler: async (ctx: AuthorizedQueryCtx, args) => {
		// If no userId provided, use current user
		const workOsUser = await ctx.auth.getUserIdentity();
		const user = await ctx.db
			.query("users")
			.withIndex("by_idp_id", (q) => q.eq("idp_id", workOsUser?.subject ?? ""))
			.unique();
		const targetUserId = args.userId ?? user?._id;

		if (!targetUserId) {
			return null;
		}

		const broker = await ctx.db
			.query("brokers")
			.withIndex("by_user", (q) => q.eq("userId", targetUserId))
			.first();

		return broker;
	},
});

/**
 * Get broker by subdomain
 * Returns the broker record for a given subdomain
 */
export const getBrokerBySubdomain = createAuthorizedQuery(["any"])({
	args: {
		subdomain: v.string(),
	},
	handler: async (ctx: AuthorizedQueryCtx, args) => {
		const normalizedSubdomain = args.subdomain.toLowerCase();

		const broker = await ctx.db
			.query("brokers")
			.withIndex("by_subdomain", (q) => q.eq("subdomain", normalizedSubdomain))
			.first();

		return broker;
	},
});

/**
 * Get broker by WorkOS organization ID
 * Returns the broker associated with a WorkOS org
 */
export const getBrokerByWorkosOrgId = createAuthorizedQuery(["any"])({
	args: {
		workosOrgId: v.string(),
	},
	handler: async (ctx: AuthorizedQueryCtx, args) => {
		const broker = await ctx.db
			.query("brokers")
			.withIndex("by_workos_org", (q) => q.eq("workosOrgId", args.workosOrgId))
			.first();

		return broker;
	},
});

/**
 * List all brokers with optional status filter
 * Admin-only access for broker management
 * Returns broker data enriched with user name for display fallback
 */
export const listBrokers = createAuthorizedQuery(["admin"])({
	args: {
		status: v.optional(
			v.union(v.literal("active"), v.literal("suspended"), v.literal("revoked"))
		),
	},
	handler: async (ctx: AuthorizedQueryCtx, args) => {
		const brokers = args.status
			? await ctx.db
					.query("brokers")
					.withIndex("by_status", (q) =>
						q.eq("status", args.status ?? "active")
					)
					.collect()
			: await ctx.db.query("brokers").collect();

		// Enrich brokers with user data for display name fallback
		const enrichedBrokers = await Promise.all(
			brokers.map(async (broker) => {
				const user = await ctx.db.get(broker.userId);
				return {
					...broker,
					// Add user info for display name fallback
					userName: user
						? `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
							user.email
						: null,
				};
			})
		);

		// Sort by createdAt descending
		return enrichedBrokers.sort(
			(a, b) =>
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
		);
	},
});

// ============================================
// Broker Management Mutations
// ============================================

/**
 * Create broker record (called during approval)
 * Internal mutation triggered by approveBrokerOnboarding
 */
export const createBrokerRecord = createAuthorizedMutation(["admin"])({
	args: {
		userId: v.string(),
		subdomain: v.string(),
		commissionRate: v.number(),
	},
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const now = new Date().toISOString();
		const normalizedSubdomain = args.subdomain.toLowerCase();

		// Create broker record
		const brokerId = await ctx.db.insert("brokers", {
			userId: args.userId as Id<"users">,
			workosOrgId: "", // Will be set by WorkOS provisioning
			subdomain: normalizedSubdomain,
			branding: {
				logoStorageId: undefined,
				primaryColor: "#3b82f6",
				secondaryColor: "#64748b",
			},
			commission: {
				ratePercentage: args.commissionRate,
			},
			status: "active",
			approvedAt: now,
			createdAt: now,
			updatedAt: now,
		});

		return { brokerId, subdomain: normalizedSubdomain };
	},
});

/**
 * Update broker WorkOS organization ID
 * Internal mutation called after WorkOS provisioning
 */
export const updateBrokerOrgId = createAuthorizedMutation(["admin"])({
	args: {
		brokerId: v.id("brokers"),
		workosOrgId: v.string(),
	},
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const broker = await ctx.db.get(args.brokerId);

		if (!broker) {
			throw new Error("Broker not found");
		}

		const now = new Date().toISOString();

		await ctx.db.patch(args.brokerId, {
			workosOrgId: args.workosOrgId,
			updatedAt: now,
		});

		return { brokerId: args.brokerId, workosOrgId: args.workosOrgId };
	},
});

/**
 * Update broker WorkOS organization ID by broker user ID (internal only)
 */
export const updateBrokerOrgIdInternal = internalMutation({
	args: {
		brokerUserId: v.string(),
		workosOrgId: v.string(),
	},
	handler: async (ctx, args) => {
		const broker = await ctx.db
			.query("brokers")
			.withIndex("by_user", (q) =>
				q.eq("userId", args.brokerUserId as Id<"users">)
			)
			.first();

		if (!broker) {
			throw new Error("Broker not found");
		}

		const now = new Date().toISOString();

		await ctx.db.patch(broker._id, {
			workosOrgId: args.workosOrgId,
			updatedAt: now,
		});

		return { brokerId: broker._id, workosOrgId: args.workosOrgId };
	},
});

/**
 * Link broker WorkOS organization ID if applicable (for webhook auto-sync)
 * Called when organization_membership.created webhook fires
 * Only links if user is a broker AND workosOrgId is currently empty
 */
export const linkBrokerWorkosOrgIfNeeded = internalMutation({
	args: {
		workosUserId: v.string(),
		workosOrgId: v.string(),
	},
	handler: async (ctx, args) => {
		// Find user by WorkOS ID (idp_id)
		const user = await ctx.db
			.query("users")
			.withIndex("by_idp_id", (q) => q.eq("idp_id", args.workosUserId))
			.unique();

		if (!user) {
			console.log("linkBrokerWorkosOrgIfNeeded: User not found", {
				workosUserId: args.workosUserId,
			});
			return { linked: false, reason: "user_not_found" };
		}

		// Find broker by user ID
		const broker = await ctx.db
			.query("brokers")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.first();

		if (!broker) {
			// Not a broker, nothing to do
			return { linked: false, reason: "not_a_broker" };
		}

		// Only link if workosOrgId is empty
		if (broker.workosOrgId && broker.workosOrgId.length > 0) {
			console.log("linkBrokerWorkosOrgIfNeeded: Broker already has org", {
				brokerId: broker._id,
				existingOrgId: broker.workosOrgId,
				newOrgId: args.workosOrgId,
			});
			return { linked: false, reason: "already_linked" };
		}

		const now = new Date().toISOString();

		await ctx.db.patch(broker._id, {
			workosOrgId: args.workosOrgId,
			updatedAt: now,
		});

		console.log("linkBrokerWorkosOrgIfNeeded: Auto-linked broker to org", {
			brokerId: broker._id,
			workosOrgId: args.workosOrgId,
			userId: user._id,
		});

		return { linked: true, brokerId: broker._id };
	},
});

/**
 * Update broker configuration (profile and branding)
 * Allows brokers to manage their profile and appearance
 */
export const updateBrokerConfiguration = createAuthorizedMutation(["any"])({
	args: {
		brokerId: v.id("brokers"),
		branding: v.optional(
			v.object({
				logoUrl: v.optional(v.string()),
				primaryColor: v.optional(v.string()),
				secondaryColor: v.optional(v.string()),
			})
		),
	},
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const broker = await ctx.db.get(args.brokerId);

		if (!broker) {
			throw new Error("Broker not found");
		}

		// Ensure user owns this broker
		if (broker.userId !== ctx.subject) {
			throw new Error(
				"Unauthorized: You can only update your own broker record"
			);
		}

		const now = new Date().toISOString();

		// Update configuration
		await ctx.db.patch(args.brokerId, {
			branding: {
				...broker.branding,
				primaryColor:
					args.branding?.primaryColor ?? broker.branding.primaryColor,
				secondaryColor:
					args.branding?.secondaryColor ?? broker.branding.secondaryColor,
			},
			updatedAt: now,
		});

		return { brokerId: args.brokerId, updatedAt: now };
	},
});

/**
 * Suspend broker
 * Temporarily disables broker access (reversible)
 * Also suspends the WorkOS organization to prevent access
 */
export const suspendBroker = createAuthorizedMutation(["admin"])({
	args: {
		brokerId: v.id("brokers"),
		reason: v.string(),
	},
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const broker = await ctx.db.get(args.brokerId);

		if (!broker) {
			throw new Error("Broker not found");
		}

		if (broker.status === "suspended") {
			throw new Error("Broker is already suspended");
		}

		const now = new Date().toISOString();

		await ctx.db.patch(args.brokerId, {
			status: "suspended",
			updatedAt: now,
		});

		// Schedule WorkOS organization suspension
		if (broker.workosOrgId) {
			await ctx.scheduler.runAfter(
				0,
				internal.brokers.workos.suspendBrokerOrganization,
				{
					brokerOrgId: broker.workosOrgId,
				}
			);
		}

		return { brokerId: args.brokerId, suspendedAt: now };
	},
});

/**
 * Revoke broker access
 * Permanently disables broker access (irreversible)
 */
export const revokeBroker = createAuthorizedMutation(["admin"])({
	args: {
		brokerId: v.id("brokers"),
		reason: v.string(),
	},
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const broker = await ctx.db.get(args.brokerId);

		if (!broker) {
			throw new Error("Broker not found");
		}

		if (broker.status === "revoked") {
			throw new Error("Broker is already revoked");
		}

		const now = new Date().toISOString();

		await ctx.db.patch(args.brokerId, {
			status: "revoked",
			updatedAt: now,
		});

		return { brokerId: args.brokerId, revokedAt: now };
	},
});

/**
 * Reactivate suspended broker
 * Restores broker access from suspended state
 * Also reactivates the WorkOS organization membership
 */
export const reactivateBroker = createAuthorizedMutation(["admin"])({
	args: {
		brokerId: v.id("brokers"),
	},
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const broker = await ctx.db.get(args.brokerId);

		if (!broker) {
			throw new Error("Broker not found");
		}

		if (broker.status !== "suspended") {
			throw new Error("Only suspended brokers can be reactivated");
		}

		const now = new Date().toISOString();

		await ctx.db.patch(args.brokerId, {
			status: "active",
			updatedAt: now,
		});

		// Schedule WorkOS organization reactivation
		if (broker.workosOrgId) {
			// Get the broker user's WorkOS ID
			const brokerUser = await ctx.db.get(broker.userId);
			if (brokerUser?.idp_id) {
				await ctx.scheduler.runAfter(
					0,
					internal.brokers.workos.reactivateBrokerOrganization,
					{
						brokerOrgId: broker.workosOrgId,
						brokerWorkosUserId: brokerUser.idp_id,
					}
				);
			}
		}

		return { brokerId: args.brokerId, reactivatedAt: now };
	},
});

/**
 * Update broker commission rates
 * Updates the commission rate for a broker
 */
export const updateBrokerCommissionRates = createAuthorizedMutation(["admin"])({
	args: {
		brokerId: v.id("brokers"),
		commissionRate: v.optional(v.number()),
	},
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const broker = await ctx.db.get(args.brokerId);

		if (!broker) {
			throw new Error("Broker not found");
		}

		const now = new Date().toISOString();
		const commissionChanges: Record<string, { old: number; new: number }> = {};

		// Track changes for history
		if (
			args.commissionRate !== undefined &&
			args.commissionRate !== broker.commission.ratePercentage
		) {
			commissionChanges.ratePercentage = {
				old: broker.commission.ratePercentage,
				new: args.commissionRate,
			};

			// Record commission rate history
			await ctx.db.insert("broker_rate_history", {
				brokerId: args.brokerId,
				type: "commission",
				oldRate: broker.commission.ratePercentage,
				newRate: args.commissionRate,
				effectiveAt: now,
				changedBy: requireSubjectId(ctx),
				createdAt: now,
			});
		}

		// Update broker commission
		const updatedCommission = {
			...broker.commission,
			...(args.commissionRate !== undefined && {
				ratePercentage: args.commissionRate,
			}),
		};

		await ctx.db.patch(args.brokerId, {
			commission: updatedCommission,
			updatedAt: now,
		});

		return {
			brokerId: args.brokerId,
			commission: updatedCommission,
			changes: commissionChanges,
		};
	},
});

/**
 * Get broker rate history
 * Returns historical changes to commission rates
 */
export const getBrokerRateHistory = createAuthorizedQuery(["any"])({
	args: {
		brokerId: v.id("brokers"),
		type: v.optional(v.literal("commission")),
	},
	handler: async (ctx: AuthorizedQueryCtx, args) => {
		const history = args.type
			? await ctx.db
					.query("broker_rate_history")
					.withIndex("by_broker", (q) => q.eq("brokerId", args.brokerId))
					.filter((q) => q.eq(q.field("type"), args.type))
					.collect()
			: await ctx.db
					.query("broker_rate_history")
					.withIndex("by_broker", (q) => q.eq("brokerId", args.brokerId))
					.collect();

		// Sort by createdAt descending (most recent first)
		return history.sort(
			(a, b) =>
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
		);
	},
});

// ============================================
// Broker Profile Edit Mutations
// ============================================

/**
 * Reserved subdomains that cannot be used
 */
const RESERVED_SUBDOMAINS = [
	"www",
	"api",
	"admin",
	"app",
	"dashboard",
	"portal",
	"login",
	"auth",
	"help",
	"support",
	"docs",
	"status",
	"mail",
	"email",
	"static",
	"cdn",
	"assets",
	"fairlend",
	"flpilot",
];

/**
 * Validate subdomain format
 */
function validateSubdomainFormat(subdomain: string): {
	valid: boolean;
	errors: string[];
	normalized: string;
} {
	const errors: string[] = [];
	const normalized = subdomain.toLowerCase().trim();

	// Check length (3-63 characters)
	if (normalized.length < 3) {
		errors.push("Subdomain must be at least 3 characters");
	}
	if (normalized.length > 63) {
		errors.push("Subdomain must be at most 63 characters");
	}

	// Check format (alphanumeric and hyphens only)
	if (!SUBDOMAIN_REGEX.test(normalized)) {
		errors.push(
			"Subdomain must start and end with a letter or number, and contain only letters, numbers, and hyphens"
		);
	}

	// Check for consecutive hyphens
	if (normalized.includes("--")) {
		errors.push("Subdomain cannot contain consecutive hyphens");
	}

	// Check reserved names
	if (RESERVED_SUBDOMAINS.includes(normalized)) {
		errors.push("This subdomain is reserved");
	}

	return { valid: errors.length === 0, errors, normalized };
}

/**
 * Update broker subdomain
 * Admin-only mutation to change a broker's subdomain
 */
export const updateBrokerSubdomain = createAuthorizedMutation(["admin"])({
	args: {
		brokerId: v.id("brokers"),
		subdomain: v.string(),
	},
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const broker = await ctx.db.get(args.brokerId);

		if (!broker) {
			throw new Error("Broker not found");
		}

		// Validate format
		const formatValidation = validateSubdomainFormat(args.subdomain);
		if (!formatValidation.valid) {
			throw new Error(
				`Invalid subdomain: ${formatValidation.errors.join(", ")}`
			);
		}

		const normalizedSubdomain = formatValidation.normalized;

		// Check if subdomain is the same
		if (normalizedSubdomain === broker.subdomain) {
			return { brokerId: args.brokerId, subdomain: broker.subdomain };
		}

		// Check availability (excluding current broker)
		const existingBroker = await ctx.db
			.query("brokers")
			.withIndex("by_subdomain", (q) => q.eq("subdomain", normalizedSubdomain))
			.first();

		if (existingBroker && existingBroker._id !== args.brokerId) {
			throw new Error("This subdomain is already in use by another broker");
		}

		// Check pending journeys
		const pendingJourney = await ctx.db
			.query("onboarding_journeys")
			.filter((q) =>
				q.and(
					q.eq(q.field("persona"), "broker"),
					q.neq(q.field("status"), "approved"),
					q.neq(q.field("status"), "rejected")
				)
			)
			.collect();

		const subdomainInPending = pendingJourney.some(
			(j) =>
				j.context?.broker?.proposedSubdomain?.toLowerCase() ===
				normalizedSubdomain
		);

		if (subdomainInPending) {
			throw new Error("This subdomain is reserved by a pending application");
		}

		const now = new Date().toISOString();

		// Update broker subdomain
		await ctx.db.patch(args.brokerId, {
			subdomain: normalizedSubdomain,
			updatedAt: now,
		});

		// Schedule WorkOS organization name update if applicable
		if (broker.workosOrgId) {
			await ctx.scheduler.runAfter(
				0,
				internal.brokers.workos.updateBrokerOrganization,
				{
					brokerOrgId: broker.workosOrgId,
					subdomain: normalizedSubdomain,
				}
			);
		}

		return {
			brokerId: args.brokerId,
			oldSubdomain: broker.subdomain,
			newSubdomain: normalizedSubdomain,
		};
	},
});

/**
 * Update broker custom domain
 * Admin-only mutation to set a custom domain for a broker
 */
export const updateBrokerCustomDomain = createAuthorizedMutation(["admin"])({
	args: {
		brokerId: v.id("brokers"),
		customDomain: v.optional(v.string()),
	},
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const broker = await ctx.db.get(args.brokerId);

		if (!broker) {
			throw new Error("Broker not found");
		}

		// If clearing the custom domain
		if (!args.customDomain) {
			await ctx.db.patch(args.brokerId, {
				customDomain: undefined,
				updatedAt: new Date().toISOString(),
			});
			return { brokerId: args.brokerId, customDomain: null };
		}

		const domain = args.customDomain.toLowerCase().trim();

		// Basic domain validation
		if (!DOMAIN_REGEX.test(domain)) {
			throw new Error("Invalid domain format");
		}

		// Check if domain is already in use
		const existingBroker = await ctx.db
			.query("brokers")
			.filter((q) => q.eq(q.field("customDomain"), domain))
			.first();

		if (existingBroker && existingBroker._id !== args.brokerId) {
			throw new Error("This domain is already in use by another broker");
		}

		await ctx.db.patch(args.brokerId, {
			customDomain: domain,
			updatedAt: new Date().toISOString(),
		});

		// TODO: Add logic to configure Vercel/WorkOS custom domain if needed

		return { brokerId: args.brokerId, customDomain: domain };
	},
});

/**
 * Update broker profile
 * Admin-only mutation to update broker branding and profile information
 */
export const updateBrokerProfile = createAuthorizedMutation(["admin"])({
	args: {
		brokerId: v.id("brokers"),
		branding: v.optional(
			v.object({
				brandName: v.optional(v.string()),
				primaryColor: v.optional(v.string()),
				secondaryColor: v.optional(v.string()),
				logoStorageId: v.optional(v.id("_storage")),
			})
		),
	},
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const broker = await ctx.db.get(args.brokerId);

		if (!broker) {
			throw new Error("Broker not found");
		}

		const now = new Date().toISOString();

		// Merge branding fields
		const updatedBranding = {
			...broker.branding,
			...(args.branding?.brandName !== undefined && {
				brandName: args.branding.brandName,
			}),
			...(args.branding?.primaryColor !== undefined && {
				primaryColor: args.branding.primaryColor,
			}),
			...(args.branding?.secondaryColor !== undefined && {
				secondaryColor: args.branding.secondaryColor,
			}),
			...(args.branding?.logoStorageId !== undefined && {
				logoStorageId: args.branding.logoStorageId,
			}),
		};

		await ctx.db.patch(args.brokerId, {
			branding: updatedBranding,
			updatedAt: now,
		});

		// Update WorkOS organization name if brand name changed
		if (args.branding?.brandName && broker.workosOrgId) {
			await ctx.scheduler.runAfter(
				0,
				internal.brokers.workos.updateBrokerOrganization,
				{
					brokerOrgId: broker.workosOrgId,
					name: args.branding.brandName,
				}
			);
		}

		return { brokerId: args.brokerId, branding: updatedBranding };
	},
});

// ============================================
// Broker Deletion
// ============================================

/**
 * Delete broker with full cleanup
 * Permanently deletes a broker and reassigns all clients to FAIRLEND
 * Requires typing the subdomain to confirm (safety measure)
 */
export const deleteBrokerWithCleanup = createAuthorizedMutation(["admin"])({
	args: {
		brokerId: v.id("brokers"),
		confirmSubdomain: v.string(),
	},
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const broker = await ctx.db.get(args.brokerId);

		if (!broker) {
			throw new Error("Broker not found");
		}

		// Verify confirmation matches subdomain
		if (args.confirmSubdomain.toLowerCase() !== broker.subdomain) {
			throw new Error(
				"Confirmation subdomain does not match. Please type the exact subdomain to confirm deletion."
			);
		}

		// Get FAIRLEND broker for client reassignment
		const fairlendBroker = await ctx.db
			.query("brokers")
			.withIndex("by_subdomain", (q) => q.eq("subdomain", "fairlend"))
			.first();

		if (!fairlendBroker) {
			throw new Error(
				"FAIRLEND broker not found. Cannot delete broker without a fallback for clients."
			);
		}

		// Prevent deleting FAIRLEND itself
		if (broker.subdomain === "fairlend") {
			throw new Error("Cannot delete the FAIRLEND broker");
		}

		// Get all clients for this broker
		const clients = await ctx.db
			.query("broker_clients")
			.withIndex("by_broker", (q) => q.eq("brokerId", args.brokerId))
			.collect();

		const now = new Date().toISOString();

		// Reassign all clients to FAIRLEND
		for (const client of clients) {
			await ctx.db.patch(client._id, {
				brokerId: fairlendBroker._id,
				updatedAt: now,
			});
		}

		// Schedule WorkOS organization deletion
		if (broker.workosOrgId) {
			await ctx.scheduler.runAfter(
				0,
				internal.brokers.workos.deleteBrokerOrganization,
				{
					brokerOrgId: broker.workosOrgId,
				}
			);
		}

		// Delete logo from storage if exists
		if (broker.branding.logoStorageId) {
			await ctx.storage.delete(broker.branding.logoStorageId);
		}

		// Delete the broker record
		// Note: broker_rate_history is kept for audit purposes
		await ctx.db.delete(args.brokerId);

		return {
			success: true,
			deletedBrokerId: args.brokerId,
			deletedSubdomain: broker.subdomain,
			clientsReassigned: clients.length,
			deletedAt: now,
		};
	},
});
