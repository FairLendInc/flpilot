/**
 * Span lifecycle writer for telemetry.
 *
 * Provides functions to record span start/end events into Convex tables.
 * Used by server wrappers (authMutation, authAction, createAuthorized*)
 * to emit trace data without polluting handler code.
 *
 * NOTE: Queries are read-only in Convex, so query spans are recorded
 * by the client hooks via the recordSpan mutation instead.
 */

import { v } from "convex/values";
import { internal } from "../../_generated/api";
import type { ActionCtx, MutationCtx } from "../../_generated/server";
import { internalMutation } from "../../_generated/server";
import { resolveTelemetryConfig, shouldSample } from "./config";
import type { OtelEnvelope, SpanError, SpanKind } from "./types";
import { generateSpanId, generateTraceId } from "./types";

// ============================================================================
// Internal mutations for span persistence
// ============================================================================

/**
 * Record a completed span. Called from wrappers after handler execution.
 * This is an internal mutation (no auth required) since it's called
 * by the server wrappers themselves, not by end users.
 */
export const writeSpan = internalMutation({
	args: {
		traceId: v.string(),
		spanId: v.string(),
		parentSpanId: v.optional(v.string()),
		functionName: v.string(),
		kind: v.union(
			v.literal("query"),
			v.literal("mutation"),
			v.literal("action"),
			v.literal("internal")
		),
		status: v.union(
			v.literal("started"),
			v.literal("completed"),
			v.literal("error")
		),
		startedAt: v.number(),
		endedAt: v.optional(v.number()),
		durationMs: v.optional(v.number()),
		attributes: v.optional(v.any()),
		payloadRef: v.optional(v.string()),
		error: v.optional(
			v.object({
				message: v.string(),
				code: v.optional(v.string()),
				stack: v.optional(v.string()),
			})
		),
	},
	handler: async (ctx, args) => {
		await ctx.db.insert("trace_spans", args);
	},
});

/**
 * Upsert a trace run record. Creates on first span, updates on completion.
 */
export const upsertTraceRun = internalMutation({
	args: {
		traceId: v.string(),
		requestId: v.optional(v.string()),
		rootFunction: v.string(),
		status: v.union(
			v.literal("started"),
			v.literal("completed"),
			v.literal("error")
		),
		startedAt: v.number(),
		endedAt: v.optional(v.number()),
		durationMs: v.optional(v.number()),
		environment: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("trace_runs")
			.withIndex("by_traceId", (q) => q.eq("traceId", args.traceId))
			.unique();

		if (existing) {
			await ctx.db.patch(existing._id, {
				status: args.status,
				endedAt: args.endedAt,
				durationMs: args.durationMs,
				spanCount: (existing.spanCount ?? 0) + 1,
			});
		} else {
			await ctx.db.insert("trace_runs", {
				...args,
				spanCount: 1,
			});
		}
	},
});

/**
 * Record a span from client-side (for query spans that can't self-record).
 * This is a public internal mutation called by client hooks.
 */
export const recordClientSpan = internalMutation({
	args: {
		traceId: v.string(),
		spanId: v.string(),
		parentSpanId: v.optional(v.string()),
		functionName: v.string(),
		kind: v.union(
			v.literal("query"),
			v.literal("mutation"),
			v.literal("action"),
			v.literal("internal")
		),
		status: v.union(
			v.literal("started"),
			v.literal("completed"),
			v.literal("error")
		),
		startedAt: v.number(),
		endedAt: v.optional(v.number()),
		durationMs: v.optional(v.number()),
		error: v.optional(
			v.object({
				message: v.string(),
				code: v.optional(v.string()),
				stack: v.optional(v.string()),
			})
		),
	},
	handler: async (ctx, args) => {
		await ctx.db.insert("trace_spans", args);
	},
});

// ============================================================================
// In-process span helpers (for use inside mutation/action wrappers)
// ============================================================================

export type SpanContext = {
	traceId: string;
	spanId: string;
	parentSpanId?: string;
	requestId?: string;
	sampled: boolean;
	functionName: string;
	kind: SpanKind;
	startedAt: number;
	attributes?: Record<string, unknown>;
};

/**
 * Begin a span from an incoming OTel envelope (or create a new root span).
 * Returns the span context to be used for recording completion.
 */
export function beginSpan(
	functionName: string,
	kind: SpanKind,
	envelope?: OtelEnvelope
): SpanContext {
	const config = resolveTelemetryConfig();
	const sampled = envelope?.sampled ?? shouldSample(config);

	return {
		traceId: envelope?.traceId ?? generateTraceId(),
		spanId: envelope?.spanId ?? generateSpanId(),
		parentSpanId: envelope?.parentSpanId,
		requestId: envelope?.requestId,
		sampled,
		functionName,
		kind,
		startedAt: Date.now(),
	};
}

/**
 * End a span and write it to the database (for mutations/actions only).
 * For queries, use the client-side recordClientSpan path instead.
 */
export async function endSpan(
	ctx: MutationCtx,
	span: SpanContext,
	error?: SpanError
): Promise<void> {
	if (!span.sampled) return;

	const endedAt = Date.now();
	const durationMs = endedAt - span.startedAt;
	const status = error ? "error" : "completed";

	// Write span directly (we're in a mutation context)
	await ctx.db.insert("trace_spans", {
		traceId: span.traceId,
		spanId: span.spanId,
		parentSpanId: span.parentSpanId,
		functionName: span.functionName,
		kind: span.kind,
		status,
		startedAt: span.startedAt,
		endedAt,
		durationMs,
		attributes: span.attributes,
		error,
	});

	// Upsert the trace run
	const config = resolveTelemetryConfig();
	const existing = await ctx.db
		.query("trace_runs")
		.withIndex("by_traceId", (q) => q.eq("traceId", span.traceId))
		.unique();

	if (existing) {
		await ctx.db.patch(existing._id, {
			status,
			endedAt,
			durationMs: endedAt - existing.startedAt,
			spanCount: (existing.spanCount ?? 0) + 1,
		});
	} else {
		await ctx.db.insert("trace_runs", {
			traceId: span.traceId,
			requestId: span.requestId,
			rootFunction: span.functionName,
			status,
			startedAt: span.startedAt,
			endedAt,
			durationMs,
			environment: config.environment,
			spanCount: 1,
		});
	}
}

/**
 * End a span in an action context by scheduling writes.
 * Actions can't write to the DB directly, so we schedule internal mutations.
 */
export async function endSpanFromAction(
	ctx: ActionCtx,
	span: SpanContext,
	error?: SpanError
): Promise<void> {
	if (!span.sampled) return;

	const endedAt = Date.now();
	const durationMs = endedAt - span.startedAt;
	const status = error ? "error" : "completed";
	const config = resolveTelemetryConfig();

	// Schedule span write via internal API reference
	ctx.scheduler.runAfter(0, internal.lib.telemetry.spanWriter.writeSpan, {
		traceId: span.traceId,
		spanId: span.spanId,
		parentSpanId: span.parentSpanId,
		functionName: span.functionName,
		kind: span.kind,
		status,
		startedAt: span.startedAt,
		endedAt,
		durationMs,
		attributes: span.attributes,
		error,
	});

	// Schedule trace run upsert via internal API reference
	ctx.scheduler.runAfter(0, internal.lib.telemetry.spanWriter.upsertTraceRun, {
		traceId: span.traceId,
		requestId: span.requestId,
		rootFunction: span.functionName,
		status,
		startedAt: span.startedAt,
		endedAt,
		durationMs,
		environment: config.environment,
	});
}
