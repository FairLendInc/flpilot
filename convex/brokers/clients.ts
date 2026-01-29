import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { AuthorizedMutationCtx, AuthorizedQueryCtx } from "../lib/server";
import { createAuthorizedMutation, createAuthorizedQuery } from "../lib/server";

/**
 * Client Management Functions
 *
 * This file contains Convex queries, mutations, and actions for managing
 * broker-client relationships, including client onboarding, filter configuration,
 * and client lifecycle management.
 */

// ============================================================================
// Queries
// ============================================================================

/**
 * Query to fetch a client onboarding record using invite token
 * Used when a client visits their invite link to begin onboarding
 * This query is unauthenticated for public invite link access
 *
 * NOTE: Currently, invite tokens are not stored. This is a placeholder for future implementation.
 */
export const getClientByEmail = createAuthorizedQuery(
	["any"],
	[],
	false
)({
	args: {
		email: v.string(),
	},
	handler: async (ctx: AuthorizedQueryCtx, args) => {
		// Since broker_clients doesn't have an email field, we need to find the user first
		const user = await ctx.db
			.query("users")
			.withIndex("by_email", (q) => q.eq("email", args.email))
			.first();

		if (!user) {
			return null;
		}

		// Find client records for this user
		const clients = await ctx.db
			.query("broker_clients")
			.withIndex("by_client", (q) => q.eq("clientId", user._id))
			.collect();

		return clients;
	},
});

// ============================================================================
// Types and Helpers
// ============================================================================

/**
 * Generate a unique invite token
 */
function generateInviteToken(): string {
	return crypto.randomUUID();
}

function requireSubjectId(ctx: { subject?: string | null }): Id<"users"> {
	if (!ctx.subject) {
		throw new Error("Authentication required");
	}
	return ctx.subject as Id<"users">;
}

/**
 * Validate filter values against broker constraints
 */
type BrokerFilterConstraints = {
	minLTV?: number;
	maxLTV?: number;
	minLoanAmount?: number;
	maxLoanAmount?: number;
	minInterestRate?: number;
	maxInterestRate?: number;
	allowedPropertyTypes?: string[];
	allowedLocations?: string[];
	allowedRiskProfiles?: Array<"conservative" | "balanced" | "growth">;
};

type BrokerFilterValues = {
	minLTV?: number;
	maxLTV?: number;
	minLoanAmount?: number;
	maxLoanAmount?: number;
	minInterestRate?: number;
	maxInterestRate?: number;
	propertyTypes: string[];
	locations: string[];
	riskProfile: "conservative" | "balanced" | "growth";
};

function validateFiltersAgainstConstraints(
	constraints: BrokerFilterConstraints,
	values: BrokerFilterValues,
	isAdmin: boolean
): { valid: boolean; errors: string[] } {
	const errors: string[] = [];
	const allowedPropertyTypes = constraints.allowedPropertyTypes ?? [];
	const allowedLocations = constraints.allowedLocations ?? [];
	const allowedRiskProfiles = constraints.allowedRiskProfiles ?? [];

	// Admin can bypass all constraints
	if (isAdmin) {
		return { valid: true, errors: [] };
	}

	// Validate LTV constraints
	if (
		constraints.minLTV !== undefined &&
		values.minLTV !== undefined &&
		values.minLTV < constraints.minLTV
	) {
		errors.push(`minLTV must be at least ${constraints.minLTV}%`);
	}
	if (
		constraints.maxLTV !== undefined &&
		values.maxLTV !== undefined &&
		values.maxLTV > constraints.maxLTV
	) {
		errors.push(`maxLTV must be at most ${constraints.maxLTV}%`);
	}

	// Validate loan amount constraints
	if (
		constraints.minLoanAmount !== undefined &&
		values.minLoanAmount !== undefined &&
		values.minLoanAmount < constraints.minLoanAmount
	) {
		errors.push(
			`minLoanAmount must be at least $${constraints.minLoanAmount.toLocaleString()}`
		);
	}
	if (
		constraints.maxLoanAmount !== undefined &&
		values.maxLoanAmount !== undefined &&
		values.maxLoanAmount > constraints.maxLoanAmount
	) {
		errors.push(
			`maxLoanAmount must be at most $${constraints.maxLoanAmount.toLocaleString()}`
		);
	}

	// Validate interest rate constraints
	if (
		constraints.minInterestRate !== undefined &&
		values.minInterestRate !== undefined &&
		values.minInterestRate < constraints.minInterestRate
	) {
		errors.push(
			`minInterestRate must be at least ${constraints.minInterestRate}%`
		);
	}
	if (
		constraints.maxInterestRate !== undefined &&
		values.maxInterestRate !== undefined &&
		values.maxInterestRate > constraints.maxInterestRate
	) {
		errors.push(
			`maxInterestRate must be at most ${constraints.maxInterestRate}%`
		);
	}

	// Validate property types against allowed list
	if (allowedPropertyTypes.length > 0) {
		const invalidTypes = values.propertyTypes.filter(
			(type: string) => !allowedPropertyTypes.includes(type)
		);
		if (invalidTypes.length > 0) {
			errors.push(`Invalid property types: ${invalidTypes.join(", ")}`);
		}
	}

	// Validate locations against allowed list
	if (allowedLocations.length > 0) {
		const invalidLocations = values.locations.filter(
			(loc: string) => !allowedLocations.includes(loc)
		);
		if (invalidLocations.length > 0) {
			errors.push(`Invalid locations: ${invalidLocations.join(", ")}`);
		}
	}

	// Validate risk profile against allowed list
	if (
		allowedRiskProfiles.length > 0 &&
		!allowedRiskProfiles.includes(values.riskProfile)
	) {
		errors.push(`Risk profile ${values.riskProfile} is not allowed`);
	}

	return { valid: errors.length === 0, errors };
}

/**
 * Get FAIRLEND broker (default broker for clients without a broker)
 */
async function getFairlendBroker(
	ctx: QueryCtx | MutationCtx
): Promise<Id<"brokers"> | null> {
	const fairlend = await ctx.db
		.query("brokers")
		.withIndex("by_subdomain", (q) => q.eq("subdomain", "fairlend"))
		.first();
	return fairlend?._id ?? null;
}

// ============================================================================
// Query Implementations
// ============================================================================

/**
 * Query to fetch client details with filters
 */
export const getClientWithFilters = createAuthorizedQuery([
	"broker_member",
	"broker_admin",
	"any",
])({
	args: {
		clientBrokerId: v.id("broker_clients"),
	},
	handler: async (ctx: AuthorizedQueryCtx, args) => {
		const client = await ctx.db.get(args.clientBrokerId);

		if (!client) {
			throw new Error("Client not found");
		}

		// Verify the requesting user is the client's broker
		const subjectId = requireSubjectId(ctx);
		const broker = await ctx.db
			.query("brokers")
			.withIndex("by_user", (q) => q.eq("userId", subjectId))
			.first();
		if (ctx.role !== "admin" && client.brokerId !== broker?._id) {
			throw new Error("Unauthorized to access this client");
		}

		return client;
	},
});

/**
 * Query to list all clients for a broker with optional filters and pagination
 */
export const listBrokerClients = createAuthorizedQuery([
	"broker_member",
	"broker_admin",
])({
	args: {
		// Filters
		status: v.optional(
			v.union(
				v.literal("invited"),
				v.literal("in_progress"),
				v.literal("pending_approval"),
				v.literal("approved"),
				v.literal("rejected")
			)
		),
		// Pagination
		pagination: v.optional(
			v.object({
				limit: v.number(),
				cursor: v.optional(v.string()), // Cursor for pagination
			})
		),
	},
	handler: async (ctx: AuthorizedQueryCtx, args) => {
		const subjectId = requireSubjectId(ctx);
		const broker = await ctx.db
			.query("brokers")
			.withIndex("by_user", (q) => q.eq("userId", subjectId))
			.first();

		if (!broker) {
			throw new Error("Broker not found");
		}

		// Apply status filter if provided
		const limit = args.pagination?.limit ?? 50;
		const clients = args.status
			? await ctx.db
					.query("broker_clients")
					.withIndex("by_broker_status", (q) =>
						q
							.eq("brokerId", broker._id)
							.eq("onboardingStatus", args.status ?? "invited")
					)
					.take(limit)
			: await ctx.db
					.query("broker_clients")
					.withIndex("by_broker", (q) => q.eq("brokerId", broker._id))
					.take(limit);

		return {
			clients,
			hasMore: clients.length === limit,
		};
	},
});

/**
 * Query to fetch comprehensive client details
 */
export const getClientDetail = createAuthorizedQuery([
	"broker_member",
	"broker_admin",
])({
	args: {
		clientBrokerId: v.id("broker_clients"),
	},
	handler: async (ctx: AuthorizedQueryCtx, args) => {
		const client = await ctx.db.get(args.clientBrokerId);

		if (!client) {
			throw new Error("Client not found");
		}

		// Verify the requesting user is the client's broker
		const subjectId = requireSubjectId(ctx);
		const userBroker = await ctx.db
			.query("brokers")
			.withIndex("by_user", (q) => q.eq("userId", subjectId))
			.first();
		if (ctx.role !== "admin" && client.brokerId !== userBroker?._id) {
			throw new Error("Unauthorized to access this client");
		}

		// Fetch broker details
		const broker = await ctx.db.get(client.brokerId);

		// Fetch client user details
		const clientUser = await ctx.db.get(client.clientId);

		return {
			client,
			broker,
			clientUser,
		};
	},
});

// ============================================================================
// Mutation Implementations
// ============================================================================

/**
 * Mutation to create a client onboarding invite
 */
export const createClientOnboarding = createAuthorizedMutation([
	"broker_admin",
])({
	args: {
		clientEmail: v.string(),
		clientName: v.string(),
		filters: v.object({
			constraints: v.object({
				minLTV: v.optional(v.number()),
				maxLTV: v.optional(v.number()),
				minLoanAmount: v.optional(v.number()),
				maxLoanAmount: v.optional(v.number()),
				minInterestRate: v.optional(v.number()),
				maxInterestRate: v.optional(v.number()),
				allowedPropertyTypes: v.optional(v.array(v.string())),
				allowedLocations: v.optional(v.array(v.string())),
				allowedRiskProfiles: v.optional(
					v.array(
						v.union(
							v.literal("conservative"),
							v.literal("balanced"),
							v.literal("growth")
						)
					)
				),
			}),
			values: v.object({
				minLTV: v.optional(v.number()),
				maxLTV: v.optional(v.number()),
				minLoanAmount: v.optional(v.number()),
				maxLoanAmount: v.optional(v.number()),
				minInterestRate: v.optional(v.number()),
				maxInterestRate: v.optional(v.number()),
				propertyTypes: v.array(v.string()),
				locations: v.array(v.string()),
				riskProfile: v.union(
					v.literal("conservative"),
					v.literal("balanced"),
					v.literal("growth")
				),
			}),
		}),
	},
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const subjectId = requireSubjectId(ctx);
		// Get broker record for current user
		const broker = await ctx.db
			.query("brokers")
			.withIndex("by_user", (q) => q.eq("userId", subjectId))
			.first();

		if (!broker) {
			throw new Error("Broker not found");
		}

		// Validate initial values against constraints
		const validation = validateFiltersAgainstConstraints(
			args.filters.constraints,
			args.filters.values,
			ctx.role === "admin"
		);

		if (!validation.valid) {
			throw new Error(
				`Invalid filter configuration: ${validation.errors.join(", ")}`
			);
		}

		// Check if client email already exists as a user
		const existingUser = await ctx.db
			.query("users")
			.withIndex("by_email", (q) => q.eq("email", args.clientEmail))
			.first();

		let clientId: Id<"users">;

		if (existingUser) {
			// Check if this user is already a client of this broker
			const clientClients = await ctx.db
				.query("broker_clients")
				.withIndex("by_broker", (q) => q.eq("brokerId", broker._id))
				.collect();

			const existingClient = clientClients.find(
				(c) => c.clientId === existingUser._id
			);

			if (existingClient) {
				throw new Error("This user is already a client of your brokerage");
			}

			clientId = existingUser._id;
		} else {
			// Create a placeholder user record (will be filled in during onboarding)
			// This is a simplified approach - in production, you might want a different flow
			throw new Error(
				"User must exist before creating client onboarding. Please have them sign up first."
			);
		}

		// Create client onboarding record
		const now = new Date().toISOString();
		const clientBrokerId = await ctx.db.insert("broker_clients", {
			brokerId: broker._id,
			clientId,
			workosOrgId: "", // Will be filled by WorkOS provisioning action
			filters: args.filters,
			onboardingStatus: "invited",
			invitedAt: now,
			approvedAt: undefined,
			createdAt: now,
			updatedAt: now,
		});

		// TODO: Schedule WorkOS client org provisioning via action
		// await ctx.scheduler.runAfter(0, internal.brokers.clients.provisionClientWorkosOrg, {
		//   clientBrokerId,
		//   brokerOrgId: broker.workosOrgId,
		//   clientEmail: args.clientEmail,
		//   clientName: args.clientName,
		// });

		return {
			clientBrokerId,
			inviteToken: generateInviteToken(), // In production, store this separately
		};
	},
});

/**
 * Mutation to save client profile during onboarding
 */
export const saveClientProfile = createAuthorizedMutation([
	"broker_member",
	"broker_admin",
	"any",
])({
	args: {
		clientBrokerId: v.id("broker_clients"),
		profile: v.object({
			firstName: v.string(),
			lastName: v.string(),
			dateOfBirth: v.string(), // ISO date
			address: v.object({
				street: v.string(),
				city: v.string(),
				state: v.string(),
				zip: v.string(),
				country: v.string(),
			}),
			phoneNumber: v.string(),
		}),
	},
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const client = await ctx.db.get(args.clientBrokerId);

		if (!client) {
			throw new Error("Client not found");
		}

		// Verify authorization - client can update their own profile
		const subjectId = requireSubjectId(ctx);
		if (
			ctx.role !== "admin" &&
			subjectId.toString() !== client.clientId.toString()
		) {
			throw new Error("Unauthorized to update this client profile");
		}

		// Update client user record with profile information
		await ctx.db.patch(client.clientId, {
			first_name: args.profile.firstName,
			last_name: args.profile.lastName,
			updated_at: new Date().toISOString(),
		});

		// Update client onboarding status if still in invited state
		if (client.onboardingStatus === "invited") {
			await ctx.db.patch(args.clientBrokerId, {
				onboardingStatus: "in_progress",
				updatedAt: new Date().toISOString(),
			});
		}

		return { success: true };
	},
});

/**
 * Mutation to submit client onboarding for broker approval
 */
export const submitClientForApproval = createAuthorizedMutation([
	"broker_member",
	"broker_admin",
	"any",
])({
	args: {
		clientBrokerId: v.id("broker_clients"),
	},
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const client = await ctx.db.get(args.clientBrokerId);

		if (!client) {
			throw new Error("Client not found");
		}

		// Verify authorization
		const subjectId = requireSubjectId(ctx);
		if (
			ctx.role !== "admin" &&
			subjectId.toString() !== client.clientId.toString()
		) {
			throw new Error("Unauthorized to submit this client");
		}

		// Validate client is in in_progress state
		if (client.onboardingStatus !== "in_progress") {
			throw new Error(
				`Cannot submit client with status '${client.onboardingStatus}'. Expected 'in_progress'.`
			);
		}

		// Update status to pending_approval
		await ctx.db.patch(args.clientBrokerId, {
			onboardingStatus: "pending_approval",
			updatedAt: new Date().toISOString(),
		});

		// TODO: Send notification to broker

		return { success: true };
	},
});

/**
 * Mutation to approve a client
 */
export const approveClient = createAuthorizedMutation(["broker_admin"])({
	args: {
		clientBrokerId: v.id("broker_clients"),
	},
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const client = await ctx.db.get(args.clientBrokerId);

		if (!client) {
			throw new Error("Client not found");
		}

		// Verify broker owns this client
		const subjectId = requireSubjectId(ctx);
		const broker = await ctx.db
			.query("brokers")
			.withIndex("by_user", (q) => q.eq("userId", subjectId))
			.first();
		if (!broker || client.brokerId !== broker._id) {
			throw new Error("You can only approve clients under your brokerage");
		}

		// Validate client is in pending_approval state
		if (client.onboardingStatus !== "pending_approval") {
			throw new Error(
				`Cannot approve client with status '${client.onboardingStatus}'. Expected 'pending_approval'.`
			);
		}

		const now = new Date().toISOString();

		// Update status to approved
		await ctx.db.patch(args.clientBrokerId, {
			onboardingStatus: "approved",
			approvedAt: now,
			updatedAt: now,
		});

		// TODO: Call WorkOS action to assign investor role
		// await ctx.runAction(internal.brokers.workos.assignClientRole, {
		//   workosOrgId: client.workosOrgId,
		//   userId: client.clientId,
		//   role: "investor_full",
		// });

		// TODO: Send confirmation to client

		return { success: true, approvedAt: now };
	},
});

/**
 * Mutation to reject a client
 */
export const rejectClient = createAuthorizedMutation(["broker_admin"])({
	args: {
		clientBrokerId: v.id("broker_clients"),
		reason: v.string(),
	},
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const client = await ctx.db.get(args.clientBrokerId);

		if (!client) {
			throw new Error("Client not found");
		}

		// Verify broker owns this client
		const subjectId = requireSubjectId(ctx);
		const broker = await ctx.db
			.query("brokers")
			.withIndex("by_user", (q) => q.eq("userId", subjectId))
			.first();
		if (!broker || client.brokerId !== broker._id) {
			throw new Error("You can only reject clients under your brokerage");
		}

		const now = new Date().toISOString();

		// Update status to rejected with reason
		await ctx.db.patch(args.clientBrokerId, {
			onboardingStatus: "rejected",
			updatedAt: now,
			// Add reason to communication timeline
		});

		// TODO: Add rejection entry to communication timeline
		// TODO: Send notification to client

		return { success: true, rejectedAt: now };
	},
});

/**
 * Mutation to update client filters
 */
export const updateClientFilters = createAuthorizedMutation([
	"broker_member",
	"broker_admin",
])({
	args: {
		clientBrokerId: v.id("broker_clients"),
		filters: v.object({
			values: v.object({
				minLTV: v.optional(v.number()),
				maxLTV: v.optional(v.number()),
				minLoanAmount: v.optional(v.number()),
				maxLoanAmount: v.optional(v.number()),
				minInterestRate: v.optional(v.number()),
				maxInterestRate: v.optional(v.number()),
				propertyTypes: v.array(v.string()),
				locations: v.array(v.string()),
				riskProfile: v.union(
					v.literal("conservative"),
					v.literal("balanced"),
					v.literal("growth")
				),
			}),
		}),
	},
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const client = await ctx.db.get(args.clientBrokerId);

		if (!client) {
			throw new Error("Client not found");
		}

		// Verify authorization
		const subjectId = requireSubjectId(ctx);
		const broker = await ctx.db
			.query("brokers")
			.withIndex("by_user", (q) => q.eq("userId", subjectId))
			.first();
		const isClient = subjectId.toString() === client.clientId.toString();
		const isBrokerAdmin =
			ctx.role === "broker_admin" && client.brokerId === broker?._id;
		const isAdmin = ctx.role === "admin";

		if (!(isAdmin || isBrokerAdmin || isClient)) {
			throw new Error("Unauthorized to update this client's filters");
		}

		// Validate against constraint
		const validation = validateFiltersAgainstConstraints(
			client.filters.constraints,
			args.filters.values,
			isAdmin
		);

		if (!validation.valid) {
			throw new Error(`Invalid filter values: ${validation.errors.join(", ")}`);
		}

		// Update filters while keeping constraints intact
		const now = new Date().toISOString();
		await ctx.db.patch(args.clientBrokerId, {
			filters: {
				constraints: client.filters.constraints,
				values: args.filters.values,
			},
			updatedAt: now,
		});

		return { success: true };
	},
});

/**
 * Mutation to switch a client from one broker to another
 */
export const switchClientBroker = createAuthorizedMutation(["admin"])({
	args: {
		clientBrokerId: v.id("broker_clients"),
		newBrokerId: v.id("brokers"),
		reason: v.string(),
	},
	handler: async (ctx, args) => {
		const client = await ctx.db.get(args.clientBrokerId);
		const newBroker = await ctx.db.get(args.newBrokerId);

		if (!client) {
			throw new Error("Client not found");
		}

		if (!newBroker) {
			throw new Error("New broker not found");
		}

		if (newBroker.status !== "active") {
			throw new Error("Cannot assign client to inactive broker");
		}

		// TODO: Remove client from old broker's WorkOS org
		// TODO: Add client to new broker's WorkOS org

		const now = new Date().toISOString();
		await ctx.db.patch(args.clientBrokerId, {
			brokerId: args.newBrokerId,
			updatedAt: now,
		});

		// TODO: Log audit trail
		// TODO: Notify both brokers and client

		return { success: true, switchedAt: now };
	},
});

/**
 * Mutation to revoke a client from a broker
 */
export const revokeClient = createAuthorizedMutation(["broker_admin"])({
	args: {
		clientBrokerId: v.id("broker_clients"),
		reason: v.string(),
	},
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const client = await ctx.db.get(args.clientBrokerId);

		if (!client) {
			throw new Error("Client not found");
		}

		// Verify broker owns this client
		const subjectId = requireSubjectId(ctx);
		const broker = await ctx.db
			.query("brokers")
			.withIndex("by_user", (q) => q.eq("userId", subjectId))
			.first();
		if (!broker || client.brokerId !== broker._id) {
			throw new Error("You can only revoke clients under your brokerage");
		}

		// Get FAIRLEND broker (default)
		const fairlendBrokerId = await getFairlendBroker(ctx);

		if (!fairlendBrokerId) {
			throw new Error("FAIRLEND broker not found. Cannot revoke client.");
		}

		// TODO: Remove client from broker's WorkOS org
		// TODO: Move client to FAIRLEND's WorkOS org (or remove investor role)

		const now = new Date().toISOString();
		await ctx.db.patch(args.clientBrokerId, {
			brokerId: fairlendBrokerId,
			updatedAt: now,
		});

		// TODO: Log audit trail
		// TODO: Notify client and admin

		return { success: true, revokedAt: now };
	},
});

// ============================================================================
// Internal Mutations
// ============================================================================

/**
 * Internal mutation to update client with WorkOS org ID
 */
export const updateClientWorkosOrg = createAuthorizedMutation(["admin"])({
	args: {
		clientBrokerId: v.id("broker_clients"),
		workosOrgId: v.string(),
		workosUserId: v.string(),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.clientBrokerId, {
			workosOrgId: args.workosOrgId,
			// TODO: Store workosUserId somewhere - maybe in users table or broker_clients
			updatedAt: new Date().toISOString(),
		});

		return { success: true };
	},
});

/**
 * Internal mutation to create client broker record
 */
export const createClientBrokerRecord = createAuthorizedMutation(["admin"])({
	args: {
		brokerId: v.id("brokers"),
		clientId: v.id("users"),
		workosOrgId: v.string(),
		filters: v.object({
			constraints: v.object({
				minLTV: v.optional(v.number()),
				maxLTV: v.optional(v.number()),
				minLoanAmount: v.optional(v.number()),
				maxLoanAmount: v.optional(v.number()),
				minInterestRate: v.optional(v.number()),
				maxInterestRate: v.optional(v.number()),
				allowedPropertyTypes: v.optional(v.array(v.string())),
				allowedLocations: v.optional(v.array(v.string())),
				allowedRiskProfiles: v.optional(
					v.array(
						v.union(
							v.literal("conservative"),
							v.literal("balanced"),
							v.literal("growth")
						)
					)
				),
			}),
			values: v.object({
				minLTV: v.optional(v.number()),
				maxLTV: v.optional(v.number()),
				minLoanAmount: v.optional(v.number()),
				maxLoanAmount: v.optional(v.number()),
				minInterestRate: v.optional(v.number()),
				maxInterestRate: v.optional(v.number()),
				propertyTypes: v.array(v.string()),
				locations: v.array(v.string()),
				riskProfile: v.union(
					v.literal("conservative"),
					v.literal("balanced"),
					v.literal("growth")
				),
			}),
		}),
	},
	handler: async (ctx, args) => {
		const now = new Date().toISOString();
		const clientBrokerId = await ctx.db.insert("broker_clients", {
			brokerId: args.brokerId,
			clientId: args.clientId,
			workosOrgId: args.workosOrgId,
			filters: args.filters,
			onboardingStatus: "invited",
			invitedAt: now,
			createdAt: now,
			updatedAt: now,
		});

		return { clientBrokerId };
	},
});
