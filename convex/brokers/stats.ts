import { v } from "convex/values";
import { createAuthorizedQuery } from "../lib/server";

// ============================================
// Broker Analytics and Statistics
// ============================================

/**
 * Get broker dashboard statistics
 * Returns KPIs for broker dashboard (AUM, client count, deal volume, commissions)
 */
export const getBrokerDashboardStats = createAuthorizedQuery(["any"])({
	args: {
		brokerId: v.id("brokers"),
		timeRange: v.optional(
			v.union(
				v.literal("30d"),
				v.literal("90d"),
				v.literal("1y"),
				v.literal("all")
			)
		),
	},
	handler: async (ctx, args) => {
		const broker = await ctx.db.get(args.brokerId);

		if (!broker) {
			throw new Error("Broker not found");
		}

		// Ensure user owns this broker or is admin
		if (
			(ctx as any).subject !== broker.userId &&
			!(ctx as any).roles?.includes("admin")
		) {
			return null;
		}

		// Calculate time range filter
		const now = new Date();
		let startDate: Date;

		switch (args.timeRange) {
			case "30d":
				startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
				break;
			case "90d":
				startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
				break;
			case "1y":
				startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
				break;
			default:
				startDate = new Date(0); // Beginning of time
				break;
		}

		// Get broker clients
		const clients = await ctx.db
			.query("broker_clients")
			.withIndex("by_broker", (q) => q.eq("brokerId", args.brokerId))
			.filter((q) => q.eq(q.field("onboardingStatus"), "approved"))
			.collect();

		const totalClients = clients.length;
		const newClients = clients.filter(
			(c) => new Date(c.approvedAt || c.createdAt) >= startDate
		).length;

		// Note: AUM, deal volume, and commissions will be populated
		// once we implement the Formance ledger integration
		// For now, return placeholder structure

		return {
			brokerId: args.brokerId,
			timeRange: args.timeRange ?? "all",
			periodStart: startDate.toISOString(),
			periodEnd: now.toISOString(),
			clients: {
				total: totalClients,
				new: newClients,
				active: totalClients, // All approved clients are considered active
			},
			assets: {
				totalAUM: 0, // To be calculated from Formance ledger
				periodGrowth: 0, // To be calculated
			},
			deals: {
				totalVolume: 0, // To be calculated from ownership ledger
				dealCount: 0,
				periodVolume: 0,
				periodDealCount: 0,
			},
			commissions: {
				pending: 0, // To be calculated from commission ledger
				available: 0,
				totalEarned: 0,
				periodEarned: 0,
			},
			updatedAt: now.toISOString(),
		};
	},
});

/**
 * Get broker commission totals
 * Returns commission totals for a broker across all time periods
 */
export const getBrokerCommissionTotal = createAuthorizedQuery(["any"])({
	args: {
		brokerId: v.id("brokers"),
	},
	handler: async (ctx, args) => {
		const broker = await ctx.db.get(args.brokerId);

		if (!broker) {
			throw new Error("Broker not found");
		}

		// Ensure user owns this broker or is admin
		if (
			(ctx as any).subject !== broker.userId &&
			!(ctx as any).roles?.includes("admin")
		) {
			return null;
		}

		// Note: Commission totals will be populated from Formance ledger
		// For now, return placeholder structure

		return {
			brokerId: args.brokerId,
			defaultCommissionRate: broker.commission.ratePercentage,
			returnAdjustmentPercentage: broker.commission.returnAdjustmentPercentage,
			totals: {
				pending: 0,
				available: 0,
				totalEarned: 0,
				lastCalculated: new Date().toISOString(),
			},
			recentHistory: [], // Will be populated from ledger queries
		};
	},
});

/**
 * Get broker client list with filters
 * Returns paginated list of broker clients
 */
export const getBrokerClientList = createAuthorizedQuery(["any"])({
	args: {
		brokerId: v.id("brokers"),
		status: v.optional(
			v.union(
				v.literal("invited"),
				v.literal("in_progress"),
				v.literal("pending_approval"),
				v.literal("approved"),
				v.literal("rejected")
			)
		),
		limit: v.optional(v.number()),
		cursor: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const broker = await ctx.db.get(args.brokerId);

		if (!broker) {
			throw new Error("Broker not found");
		}

		// Ensure user owns this broker or is admin
		if (
			(ctx as any).subject !== broker.userId &&
			!(ctx as any).roles?.includes("admin")
		) {
			return { clients: [], nextCursor: null };
		}

		const limit = Math.min(args.limit ?? 50, 100); // Max 100 per page
		let query: any = ctx.db
			.query("broker_clients")
			.withIndex("by_broker", (q) => q.eq("brokerId", args.brokerId));

		// Filter by status if provided
		if (args.status) {
			query = query.filter((q: any) =>
				q.eq(q.field("onboardingStatus"), args.status)
			);
		}

		// Pagination logic
		const clients: any[] = [];
		const cursorLimit = args.cursor ? limit + 1 : limit;
		let hasNext = false;
		let nextCursor: string | null = null;

		// Collect clients with cursor/pagination
		const allClients = (await query.collect()) as any[];

		if (args.cursor) {
			const cursorIndex = allClients.findIndex(
				(c: any) => c._id.toString() === args.cursor
			);
			if (cursorIndex !== -1) {
				const paginatedClients = allClients.slice(
					cursorIndex + 1,
					cursorIndex + 1 + cursorLimit
				);
				if (paginatedClients.length > limit) {
					hasNext = true;
					nextCursor = paginatedClients[limit - 1]._id.toString();
					clients.push(...paginatedClients.slice(0, limit));
				} else {
					clients.push(...paginatedClients);
				}
			}
		} else if (allClients.length > limit) {
			hasNext = true;
			nextCursor = allClients[limit - 1]._id.toString();
			clients.push(...allClients.slice(0, limit));
		} else {
			clients.push(...allClients);
		}

		// Enhance client data with user information
		const enrichedClients = await Promise.all(
			clients.map(async (client) => {
				// Note: Client user information will need to be fetched from users table
				// once we have a users table schema
				return {
					...client,
					// Placeholder for user data
					userName: `Client ${client._id}`,
					userEmail: `client${client._id}@example.com`,
				};
			})
		);

		return {
			clients: enrichedClients,
			pagination: {
				limit,
				nextCursor,
				hasNext,
				total: allClients.length,
			},
		};
	},
});

/**
 * Get broker growth metrics over time
 * Returns time-series data for AUM, clients, and commissions
 */
export const getBrokerGrowthMetrics = createAuthorizedQuery(["any"])({
	args: {
		brokerId: v.id("brokers"),
		period: v.optional(
			v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("yearly"))
		),
	},
	handler: async (ctx, args) => {
		const broker = await ctx.db.get(args.brokerId);

		if (!broker) {
			throw new Error("Broker not found");
		}

		// Ensure user owns this broker or is admin
		if (
			(ctx as any).subject !== broker.userId &&
			!(ctx as any).roles?.includes("admin")
		) {
			return { metrics: [] };
		}

		// Note: Growth metrics will be calculated from ledger data
		// For now, return placeholder structure

		const period = args.period ?? "monthly";
		const now = new Date();
		const monthCount = 12; // Show last 12 months by default
		const startDate = new Date(
			now.getFullYear(),
			now.getMonth() - monthCount,
			1
		);

		// Generate placeholder time series
		const metrics: any[] = [];
		for (let i = 0; i < monthCount; i++) {
			const date = new Date(
				startDate.getFullYear(),
				startDate.getMonth() + i,
				1
			);

			metrics.push({
				period: date.toISOString().slice(0, 7), // YYYY-MM
				clients: {
					total: 0,
					new: 0,
					churn: 0,
				},
				assets: {
					aum: 0,
					growth: 0,
				},
				commissions: {
					earned: 0,
					paid: 0,
				},
			});
		}

		return {
			brokerId: args.brokerId,
			period,
			startDate: startDate.toISOString(),
			endDate: now.toISOString(),
			metrics,
		};
	},
});

/**
 * Get broker activity log
 * Returns recent activity for the broker (deals, commissions, etc.)
 */
export const getBrokerActivityLog = createAuthorizedQuery(["any"])({
	args: {
		brokerId: v.id("brokers"),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const broker = await ctx.db.get(args.brokerId);

		if (!broker) {
			throw new Error("Broker not found");
		}

		// Ensure user owns this broker or is admin
		if (
			(ctx as any).subject !== broker.userId &&
			!(ctx as any).roles?.includes("admin")
		) {
			return { activities: [] };
		}

		const limit = Math.min(args.limit ?? 20, 100);

		// Note: Activity log will be generated from ledger events and audit logs
		// For now, return placeholder structure

		const now = new Date();
		const activities: any[] = [];

		// Add client onboarding activities from broker_clients
		const clients = await ctx.db
			.query("broker_clients")
			.withIndex("by_broker", (q) => q.eq("brokerId", args.brokerId))
			.collect();

		clients.forEach((client) => {
			activities.push({
				id: crypto.randomUUID(),
				type: "client_onboarding",
				event: client.onboardingStatus,
				clientId: client._id,
				description: `Client ${client._id} status: ${client.onboardingStatus}`,
				timestamp: client.createdAt,
			});
		});

		// Add commission rate changes from broker_rate_history
		const rateHistory = await ctx.db
			.query("broker_rate_history")
			.withIndex("by_broker", (q) => q.eq("brokerId", args.brokerId))
			.collect();

		rateHistory.forEach((history) => {
			activities.push({
				id: crypto.randomUUID(),
				type: "rate_change",
				rateType: history.type,
				description: `${history.type} changed from ${history.oldRate}% to ${history.newRate}%`,
				timestamp: history.effectiveAt,
			});
		});

		// Sort by timestamp descending
		(activities as any[]).sort(
			(a: any, b: any) =>
				new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
		);

		return {
			activities: activities.slice(0, limit),
			total: activities.length,
			timestamp: now.toISOString(),
		};
	},
});
