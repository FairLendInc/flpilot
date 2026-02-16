/**
 * Trace dashboard query functions.
 *
 * Powers the admin trace dashboard at /dashboard/admin/traces.
 * All queries require admin role.
 */

import { v } from "convex/values";
import { createAuthorizedQuery } from "../server";

const adminQuery = createAuthorizedQuery(["admin"]);

/**
 * List recent trace runs with optional status filter.
 */
export const listTraceRuns = adminQuery({
	args: {
		status: v.optional(
			v.union(v.literal("started"), v.literal("completed"), v.literal("error"))
		),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const limit = args.limit ?? 50;

		if (args.status) {
			return await ctx.db
				.query("trace_runs")
				.withIndex("by_status", (q) => q.eq("status", args.status!))
				.order("desc")
				.take(limit);
		}

		return await ctx.db
			.query("trace_runs")
			.withIndex("by_startedAt")
			.order("desc")
			.take(limit);
	},
});

/**
 * Get a single trace run by traceId.
 */
export const getTraceRun = adminQuery({
	args: {
		traceId: v.string(),
	},
	handler: async (ctx, args) =>
		await ctx.db
			.query("trace_runs")
			.withIndex("by_traceId", (q) => q.eq("traceId", args.traceId))
			.unique(),
});

/**
 * Get all spans for a trace, ordered by start time.
 */
export const getTraceSpans = adminQuery({
	args: {
		traceId: v.string(),
	},
	handler: async (ctx, args) =>
		await ctx.db
			.query("trace_spans")
			.withIndex("by_traceId_startedAt", (q) => q.eq("traceId", args.traceId))
			.collect(),
});

/**
 * Get payloads for a specific span.
 */
export const getSpanPayloads = adminQuery({
	args: {
		traceId: v.string(),
		spanId: v.string(),
	},
	handler: async (ctx, args) =>
		await ctx.db
			.query("trace_payloads")
			.withIndex("by_traceId_spanId", (q) =>
				q.eq("traceId", args.traceId).eq("spanId", args.spanId)
			)
			.collect(),
});

/**
 * Get a single payload by its reference key.
 */
export const getPayloadByRef = adminQuery({
	args: {
		payloadRef: v.string(),
	},
	handler: async (ctx, args) =>
		await ctx.db
			.query("trace_payloads")
			.withIndex("by_payloadRef", (q) => q.eq("payloadRef", args.payloadRef))
			.unique(),
});
