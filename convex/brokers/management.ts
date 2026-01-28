import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { createAuthorizedMutation, createAuthorizedQuery } from "../lib/server";

// ============================================
// Broker Query Functions
// ============================================

/**
 * Get broker by user ID
 * Returns the broker record associated with a specific user
 */
export const getBrokerByUserId = createAuthorizedQuery(["any"])({
	args: {
		userId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// If no userId provided, use current user
		const targetUserId = args.userId ?? (ctx as any).subject;

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
	handler: async (ctx, args) => {
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
	handler: async (ctx, args) => {
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
 */
export const listBrokers = createAuthorizedQuery(["admin"])({
	args: {
		status: v.optional(
			v.union(v.literal("active"), v.literal("suspended"), v.literal("revoked"))
		),
	},
	handler: async (ctx, args) => {
		let query = ctx.db.query("brokers");

		if (args.status) {
			query = (ctx.db.query("brokers") as any).withIndex(
				"by_status",
				(q: any) => q.eq("status", args.status!)
			);
		}

		const brokers = await query.collect();

		// Sort by createdAt descending
		return (brokers as any[]).sort(
			(a: any, b: any) =>
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
		returnAdjustmentPercentage: v.number(),
	},
	handler: async (ctx, args) => {
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
				returnAdjustmentPercentage: args.returnAdjustmentPercentage,
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
	handler: async (ctx, args) => {
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
	handler: async (ctx, args) => {
		const broker = await ctx.db.get(args.brokerId);

		if (!broker) {
			throw new Error("Broker not found");
		}

		// Ensure user owns this broker
		if (broker.userId !== (ctx as any).subject) {
			throw new Error(
				"Unauthorized: You can only update your own broker record"
			);
		}

		const now = new Date().toISOString();

		// Update configuration
		await ctx.db.patch(args.brokerId, {
			branding: {
				...(broker.branding as any),
				primaryColor: args.branding?.primaryColor,
				secondaryColor: args.branding?.secondaryColor,
			},
			updatedAt: now,
		});

		return { brokerId: args.brokerId, updatedAt: now };
	},
});

/**
 * Suspend broker
 * Temporarily disables broker access (reversible)
 */
export const suspendBroker = createAuthorizedMutation(["admin"])({
	args: {
		brokerId: v.id("brokers"),
		reason: v.string(),
	},
	handler: async (ctx, args) => {
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
	handler: async (ctx, args) => {
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
 */
export const reactivateBroker = createAuthorizedMutation(["admin"])({
	args: {
		brokerId: v.id("brokers"),
	},
	handler: async (ctx, args) => {
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

		return { brokerId: args.brokerId, reactivatedAt: now };
	},
});

/**
 * Update broker commission rates
 * Updates the commission and return adjustment rates for a broker
 */
export const updateBrokerCommissionRates = createAuthorizedMutation(["admin"])({
	args: {
		brokerId: v.id("brokers"),
		commissionRate: v.optional(v.number()),
		returnAdjustmentPercentage: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const broker = await ctx.db.get(args.brokerId);

		if (!broker) {
			throw new Error("Broker not found");
		}

		const now = new Date().toISOString();
		const commissionChanges: any = {};

		// Track changes for history
		if (
			args.commissionRate !== undefined &&
			args.commissionRate !== (broker.commission as any).ratePercentage
		) {
			commissionChanges.ratePercentage = {
				old: (broker.commission as any).ratePercentage,
				new: args.commissionRate,
			};

			// Record commission rate history
			await ctx.db.insert("broker_rate_history", {
				brokerId: args.brokerId,
				type: "commission",
				oldRate: (broker.commission as any).ratePercentage,
				newRate: args.commissionRate,
				effectiveAt: now,
				changedBy: (ctx as any).subject,
				createdAt: now,
			});
		}

		if (
			args.returnAdjustmentPercentage !== undefined &&
			args.returnAdjustmentPercentage !==
				(broker.commission as any).returnAdjustmentPercentage
		) {
			commissionChanges.returnAdjustmentPercentage = {
				old: (broker.commission as any).returnAdjustmentPercentage,
				new: args.returnAdjustmentPercentage,
			};

			// Record return adjustment history
			await ctx.db.insert("broker_rate_history", {
				brokerId: args.brokerId,
				type: "return_adjustment",
				oldRate: (broker.commission as any).returnAdjustmentPercentage,
				newRate: args.returnAdjustmentPercentage,
				effectiveAt: now,
				changedBy: (ctx as any).subject,
				createdAt: now,
			});
		}

		// Update broker commission
		const updatedCommission = {
			...(broker.commission as any),
			...(args.commissionRate !== undefined && {
				ratePercentage: args.commissionRate,
			}),
			...(args.returnAdjustmentPercentage !== undefined && {
				returnAdjustmentPercentage: args.returnAdjustmentPercentage,
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
 * Returns historical changes to commission and return adjustment rates
 */
export const getBrokerRateHistory = createAuthorizedQuery(["any"])({
	args: {
		brokerId: v.id("brokers"),
		type: v.optional(
			v.union(v.literal("commission"), v.literal("return_adjustment"))
		),
	},
	handler: async (ctx, args) => {
		let query: any = ctx.db
			.query("broker_rate_history")
			.withIndex("by_broker", (q) => q.eq("brokerId", args.brokerId));

		if (args.type) {
			query = query.filter((q: any) => q.eq(q.field("type"), args.type));
		}

		const history = await query.collect();

		// Sort by createdAt descending (most recent first)
		return history.sort(
			(a: any, b: any) =>
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
		);
	},
});
