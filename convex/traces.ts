/**
 * Trace Span CRUD Operations
 *
 * Internal mutations for recording spans, and admin queries for
 * viewing traces in the dashboard. Spans are written by the traced
 * function builders and read by the admin trace visualization UI.
 */

import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { adminQuery } from "./lib/authorizedFunctions";
import { getRetentionHours } from "./lib/tracing";

// ============================================================================
// INTERNAL MUTATIONS (called by traced function builders)
// ============================================================================

/**
 * Record a trace span.
 *
 * Called automatically by createTracedMutation / createTracedAction
 * when tracing is enabled. Stores the full span data including
 * arguments, results, errors, and auth context.
 *
 * @internal - Not callable from clients
 */
export const recordSpan = internalMutation({
	args: {
		traceId: v.string(),
		spanId: v.string(),
		parentSpanId: v.optional(v.string()),
		requestId: v.optional(v.string()),
		functionName: v.string(),
		functionType: v.string(),
		startTime: v.number(),
		endTime: v.optional(v.number()),
		duration: v.optional(v.number()),
		status: v.string(),
		args: v.optional(v.any()),
		result: v.optional(v.any()),
		error: v.optional(
			v.object({
				message: v.string(),
				stack: v.optional(v.string()),
			})
		),
		authContext: v.optional(
			v.object({
				subject: v.optional(v.string()),
				role: v.optional(v.string()),
				org_id: v.optional(v.string()),
				permissions: v.optional(v.array(v.string())),
			})
		),
		truncated: v.optional(v.boolean()),
	},
	returns: v.id("trace_spans"),
	handler: async (ctx, args) => await ctx.db.insert("trace_spans", {
			traceId: args.traceId,
			spanId: args.spanId,
			parentSpanId: args.parentSpanId,
			requestId: args.requestId,
			functionName: args.functionName,
			functionType: args.functionType,
			startTime: args.startTime,
			endTime: args.endTime,
			duration: args.duration,
			status: args.status,
			args: args.args,
			result: args.result,
			error: args.error,
			authContext: args.authContext,
			truncated: args.truncated,
		}),
});

/**
 * Update a span with completion data.
 *
 * Called after function execution completes to add endTime, duration,
 * result/error, and final status.
 *
 * @internal - Not callable from clients
 */
export const completeSpan = internalMutation({
	args: {
		spanId: v.string(),
		endTime: v.number(),
		duration: v.number(),
		status: v.string(),
		result: v.optional(v.any()),
		error: v.optional(
			v.object({
				message: v.string(),
				stack: v.optional(v.string()),
			})
		),
		truncated: v.optional(v.boolean()),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const span = await ctx.db
			.query("trace_spans")
			.withIndex("by_trace", (q) => q)
			.filter((q) => q.eq(q.field("spanId"), args.spanId))
			.first();

		if (!span) return null;

		await ctx.db.patch(span._id, {
			endTime: args.endTime,
			duration: args.duration,
			status: args.status,
			result: args.result,
			error: args.error,
			truncated: args.truncated ?? span.truncated,
		});

		return null;
	},
});

// ============================================================================
// INTERNAL QUERIES (for cron jobs)
// ============================================================================

/**
 * Get expired spans for cleanup.
 *
 * @internal
 */
export const getExpiredSpans = internalQuery({
	args: {
		cutoffTimestamp: v.number(),
		limit: v.optional(v.number()),
	},
	returns: v.array(v.id("trace_spans")),
	handler: async (ctx, args) => {
		const limit = args.limit ?? 500;
		const spans = await ctx.db
			.query("trace_spans")
			.withIndex("by_start_time", (q) =>
				q.lt("startTime", args.cutoffTimestamp)
			)
			.take(limit);

		return spans.map((s) => s._id);
	},
});

/**
 * Delete expired trace spans.
 *
 * @internal
 */
export const deleteExpiredSpans = internalMutation({
	args: {
		cutoffTimestamp: v.number(),
		limit: v.optional(v.number()),
	},
	returns: v.number(),
	handler: async (ctx, args) => {
		const limit = args.limit ?? 500;
		const spans = await ctx.db
			.query("trace_spans")
			.withIndex("by_start_time", (q) =>
				q.lt("startTime", args.cutoffTimestamp)
			)
			.take(limit);

		for (const span of spans) {
			await ctx.db.delete(span._id);
		}

		return spans.length;
	},
});

/**
 * Cleanup cron handler - deletes traces older than retention period.
 *
 * @internal
 */
export const cleanupExpiredTraces = internalMutation({
	args: {},
	returns: v.number(),
	handler: async (ctx) => {
		const retentionMs = getRetentionHours() * 60 * 60 * 1000;
		const cutoff = Date.now() - retentionMs;
		const limit = 500;

		const spans = await ctx.db
			.query("trace_spans")
			.withIndex("by_start_time", (q) => q.lt("startTime", cutoff))
			.take(limit);

		for (const span of spans) {
			await ctx.db.delete(span._id);
		}

		return spans.length;
	},
});

// ============================================================================
// ADMIN QUERIES (for dashboard UI)
// ============================================================================

/**
 * Get recent traces grouped by traceId.
 *
 * Returns the root span of each trace along with aggregate info
 * (span count, total duration, status).
 */
export const getRecentTraces = adminQuery({
	args: {
		limit: v.optional(v.number()),
		functionNameFilter: v.optional(v.string()),
		statusFilter: v.optional(v.string()),
	},
	returns: v.array(
		v.object({
			traceId: v.string(),
			rootFunctionName: v.string(),
			rootFunctionType: v.string(),
			startTime: v.number(),
			duration: v.optional(v.number()),
			status: v.string(),
			spanCount: v.number(),
			hasErrors: v.boolean(),
			requestId: v.optional(v.string()),
		})
	),
	handler: async (ctx, args) => {
		const limit = args.limit ?? 50;

		// Get recent spans ordered by time
		const recentSpans = await ctx.db
			.query("trace_spans")
			.withIndex("by_start_time")
			.order("desc")
			.take(limit * 10); // Fetch more to account for multi-span traces

		// Group by traceId
		const traceMap = new Map<
			string,
			{
				spans: typeof recentSpans;
				rootSpan: (typeof recentSpans)[number] | null;
			}
		>();

		for (const span of recentSpans) {
			if (!traceMap.has(span.traceId)) {
				traceMap.set(span.traceId, { spans: [], rootSpan: null });
			}
			const entry = traceMap.get(span.traceId);
			if (!entry) continue;
			entry.spans.push(span);

			// Root span = no parent
			if (!span.parentSpanId) {
				entry.rootSpan = span;
			}
		}

		// Build summary for each trace
		type TraceSummary = {
			traceId: string;
			rootFunctionName: string;
			rootFunctionType: string;
			startTime: number;
			duration: number | undefined;
			status: string;
			spanCount: number;
			hasErrors: boolean;
			requestId: string | undefined;
		};
		const traces: TraceSummary[] = [];
		for (const [traceId, { spans, rootSpan }] of traceMap) {
			const root = rootSpan ?? spans[0];
			if (!root) continue;

			// Apply filters
			if (
				args.functionNameFilter &&
				!root.functionName
					.toLowerCase()
					.includes(args.functionNameFilter.toLowerCase())
			) {
				continue;
			}
			if (args.statusFilter && root.status !== args.statusFilter) {
				continue;
			}

			const hasErrors = spans.some((s) => s.status === "error");

			traces.push({
				traceId,
				rootFunctionName: root.functionName,
				rootFunctionType: root.functionType,
				startTime: root.startTime,
				duration: root.duration,
				status: hasErrors ? "error" : root.status,
				spanCount: spans.length,
				hasErrors,
				requestId: root.requestId,
			});
		}

		// Sort by start time desc and limit
		traces.sort((a, b) => b.startTime - a.startTime);
		return traces.slice(0, limit);
	},
});

/**
 * Get all spans for a specific trace.
 *
 * Returns all spans ordered by start time, allowing the UI to
 * reconstruct the full call tree.
 */
export const getTraceSpans = adminQuery({
	args: {
		traceId: v.string(),
	},
	returns: v.array(
		v.object({
			_id: v.id("trace_spans"),
			_creationTime: v.number(),
			traceId: v.string(),
			spanId: v.string(),
			parentSpanId: v.optional(v.string()),
			requestId: v.optional(v.string()),
			functionName: v.string(),
			functionType: v.string(),
			startTime: v.number(),
			endTime: v.optional(v.number()),
			duration: v.optional(v.number()),
			status: v.string(),
			args: v.optional(v.any()),
			result: v.optional(v.any()),
			error: v.optional(
				v.object({
					message: v.string(),
					stack: v.optional(v.string()),
				})
			),
			authContext: v.optional(
				v.object({
					subject: v.optional(v.string()),
					role: v.optional(v.string()),
					org_id: v.optional(v.string()),
					permissions: v.optional(v.array(v.string())),
				})
			),
			truncated: v.optional(v.boolean()),
		})
	),
	handler: async (ctx, args) => {
		const spans = await ctx.db
			.query("trace_spans")
			.withIndex("by_trace", (q) => q.eq("traceId", args.traceId))
			.collect();

		// Sort by start time ascending for tree construction
		spans.sort((a, b) => a.startTime - b.startTime);

		return spans;
	},
});

/**
 * Get a single span by spanId with full payload.
 */
export const getSpanDetail = adminQuery({
	args: {
		spanId: v.string(),
	},
	returns: v.union(
		v.object({
			_id: v.id("trace_spans"),
			_creationTime: v.number(),
			traceId: v.string(),
			spanId: v.string(),
			parentSpanId: v.optional(v.string()),
			requestId: v.optional(v.string()),
			functionName: v.string(),
			functionType: v.string(),
			startTime: v.number(),
			endTime: v.optional(v.number()),
			duration: v.optional(v.number()),
			status: v.string(),
			args: v.optional(v.any()),
			result: v.optional(v.any()),
			error: v.optional(
				v.object({
					message: v.string(),
					stack: v.optional(v.string()),
				})
			),
			authContext: v.optional(
				v.object({
					subject: v.optional(v.string()),
					role: v.optional(v.string()),
					org_id: v.optional(v.string()),
					permissions: v.optional(v.array(v.string())),
				})
			),
			truncated: v.optional(v.boolean()),
		}),
		v.null()
	),
	handler: async (ctx, args) => {
		const span = await ctx.db
			.query("trace_spans")
			.withIndex("by_trace", (q) => q)
			.filter((q) => q.eq(q.field("spanId"), args.spanId))
			.first();

		return span ?? null;
	},
});
