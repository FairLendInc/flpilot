import { v } from "convex/values";
import { internalQuery } from "../_generated/server";

export const getBrokerExists = internalQuery({
	args: {
		brokerId: v.id("brokers"),
	},
	returns: v.boolean(),
	handler: async (ctx, args) => {
		const broker = await ctx.db.get(args.brokerId);
		return broker !== null;
	},
});

export const getCommissionRateHistory = internalQuery({
	args: {
		brokerId: v.id("brokers"),
	},
	returns: v.array(
		v.object({
			effectiveAt: v.string(),
			newRate: v.number(),
		})
	),
	handler: async (ctx, args) => {
		const entries = await ctx.db
			.query("broker_rate_history")
			.withIndex("by_broker_type", (q) =>
				q.eq("brokerId", args.brokerId).eq("type", "commission")
			)
			.collect();

		return entries.map((entry) => ({
			effectiveAt: entry.effectiveAt,
			newRate: entry.newRate,
		}));
	},
});

export const getBrokerCommission = internalQuery({
	args: {
		brokerId: v.id("brokers"),
	},
	returns: v.object({
		ratePercentage: v.number(),
	}),
	handler: async (ctx, args) => {
		const broker = await ctx.db.get(args.brokerId);
		if (!broker) {
			throw new Error("Broker not found");
		}
		return broker.commission;
	},
});
