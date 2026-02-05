import { v } from "convex/values";
import { BROKER_ASSETS } from "../lib/brokerLedger";
import type { AuthorizedQueryCtx } from "../lib/server";
import { createAuthorizedQuery } from "../lib/server";

/**
 * Broker Commission Management Queries
 *
 * This file contains Convex queries for managing broker commissions
 * and client return adjustments.
 */

// ============================================================================
// Queries
// ============================================================================

/**
 * Query to get broker's commission balance
 * Returns current commission balance from Formance ledger
 */
export const getBrokerCommissionBalance = createAuthorizedQuery([
	"broker_member",
	"broker_admin",
	"admin",
])({
	args: {
		brokerId: v.id("brokers"),
	},
	handler: async () => {
		// This query would need to cache the balance from the ledger
		// For now, return a placeholder - actual balance check requires action
		return {
			balance: 0,
			currency: BROKER_ASSETS.cad,
			lastUpdated: null,
		};
	},
});

/**
 * Query to get broker's commission history
 * Returns paginated list of commission transactions
 */
export const getBrokerCommissionHistory = createAuthorizedQuery([
	"broker_member",
	"broker_admin",
	"admin",
])({
	args: {
		brokerId: v.id("brokers"),
		pagination: v.optional(
			v.object({
				limit: v.number(),
				cursor: v.optional(v.string()),
			})
		),
		dateRange: v.optional(
			v.object({
				after: v.optional(v.string()), // ISO date
				before: v.optional(v.string()), // ISO date
			})
		),
	},
	handler: async (_ctx, _args) => {
		// This query would need to retrieve cached history from database
		// For now, return a placeholder - actual history requires action
		return {
			transactions: [],
			totalCount: 0,
			hasMore: false,
		};
	},
});

/**
 * Query to get broker reconciliation status
 * Returns reconciliation report showing expected vs. actual balances
 */
export const getBrokerReconciliationStatus = createAuthorizedQuery([
	"broker_member",
	"broker_admin",
	"admin",
])({
	args: {
		brokerId: v.id("brokers"),
	},
	handler: async (ctx: AuthorizedQueryCtx, args) => {
		// Check if broker exists
		const broker = await ctx.db.get(args.brokerId);

		if (!broker) {
			throw new Error("Broker not found");
		}

		// Verify authorization
		const isBroker = ctx.org_id === args.brokerId.toString();
		const isAdmin = ctx.role === "admin";

		if (!(isAdmin || isBroker)) {
			throw new Error("Unauthorized to access this broker's reconciliation");
		}

		// This query would need to retrieve cached reconciliation data
		// For now, return a placeholder - actual reconciliation requires action
		return {
			lastReconciledAt: null,
			status: "pending" as const,
			discrepancy: 0,
		};
	},
});

/**
 * Query to get commission summary for a broker
 * Aggregates commission data for dashboard display
 */
export const getBrokerCommissionSummary = createAuthorizedQuery([
	"broker_member",
	"broker_admin",
	"admin",
])({
	args: {
		brokerId: v.id("brokers"),
		timeRange: v.optional(
			v.union(
				v.literal("7d"),
				v.literal("30d"),
				v.literal("90d"),
				v.literal("all")
			)
		),
	},
	handler: async (ctx: AuthorizedQueryCtx, args) => {
		// Check if broker exists
		const broker = await ctx.db.get(args.brokerId);

		if (!broker) {
			throw new Error("Broker not found");
		}

		// Verify authorization
		const isBroker = ctx.org_id === args.brokerId.toString();
		const isAdmin = ctx.role === "admin";

		if (!(isAdmin || isBroker)) {
			throw new Error(
				"Unauthorized to access this broker's commission summary"
			);
		}

		// TODO: Aggregate commission data from database
		// For now, return placeholder data
		return {
			totalCommissions: 0,
			totalVolume: 0,
			averageCommissionRate: broker.commission.ratePercentage,
			transactionCount: 0,
			timeRange: args.timeRange ?? "all",
		};
	},
});
