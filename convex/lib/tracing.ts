/**
 * Core Tracing Primitives
 *
 * Provides trace context creation, propagation, and safe serialization
 * for the observability framework. Designed for Convex serverless functions
 * where there is no shared global state between function invocations.
 *
 * Usage:
 *   import { createTraceContext, type TraceContext } from "./lib/tracing";
 *
 *   const trace = createTraceContext("deals.createDeal", "mutation");
 *   // Pass trace._trace to child function calls for propagation
 */

import { v } from "convex/values";

// ============================================================================
// CONFIGURATION
// ============================================================================

/** Maximum serialized span size before truncation (bytes). Convex docs max at 1MB. */
const MAX_SPAN_SIZE_BYTES = 900_000; // 900KB - leave headroom for Convex overhead

/** Environment-based tracing toggle */
export function isTracingEnabled(): boolean {
	return process.env.TRACING_ENABLED === "true";
}

/** Retention period in hours (default 24h) */
export function getRetentionHours(): number {
	const val = process.env.TRACING_RETENTION_HOURS;
	return val ? Number.parseInt(val, 10) : 24;
}

// ============================================================================
// TYPES
// ============================================================================

/**
 * Trace context that propagates through function call chains.
 * Pass this as `_trace` in function arguments to link child spans to parents.
 */
export type TraceContext = {
	traceId: string;
	spanId: string;
	parentSpanId?: string;
	requestId?: string;
};

/**
 * Full span data recorded to the trace_spans table.
 */
export type SpanData = {
	traceId: string;
	spanId: string;
	parentSpanId?: string;
	requestId?: string;
	functionName: string;
	functionType: string;
	startTime: number;
	endTime?: number;
	duration?: number;
	status: "started" | "completed" | "error";
	args?: unknown;
	result?: unknown;
	error?: { message: string; stack?: string };
	authContext?: {
		subject?: string;
		role?: string;
		org_id?: string;
		permissions?: string[];
	};
	truncated?: boolean;
};

/**
 * Convex validator for the optional _trace argument field.
 * Add this to your function args to accept trace context propagation.
 */
export const traceContextValidator = v.optional(
	v.object({
		traceId: v.string(),
		spanId: v.string(),
		parentSpanId: v.optional(v.string()),
		requestId: v.optional(v.string()),
	})
);

// ============================================================================
// TRACE CONTEXT CREATION
// ============================================================================

/** Generate a random UUID-like ID for spans and traces */
function generateId(): string {
	// Use a simple random hex string (crypto.randomUUID may not be available in all Convex runtimes)
	const segments: string[] = [];
	for (let i = 0; i < 4; i += 1) {
		segments.push(
			Math.floor(Math.random() * 0xffffffff)
				.toString(16)
				.padStart(8, "0")
		);
	}
	return segments.join("-");
}

/**
 * Create a new trace context for a function invocation.
 *
 * If a parent trace context is provided (from `_trace` argument), the new span
 * inherits the traceId and sets parentSpanId. Otherwise creates a new root trace.
 *
 * @param functionName - The name of the function being traced (e.g., "deals.createDeal")
 * @param functionType - "query" | "mutation" | "action"
 * @param parentTrace - Optional parent trace context for propagation
 * @returns A new TraceContext for this span
 */
export function createTraceContext(
	_functionName: string,
	_functionType: string,
	parentTrace?: TraceContext
): TraceContext {
	const spanId = generateId();

	if (parentTrace) {
		return {
			traceId: parentTrace.traceId,
			spanId,
			parentSpanId: parentTrace.spanId,
			requestId: parentTrace.requestId,
		};
	}

	return {
		traceId: generateId(),
		spanId,
	};
}

/**
 * Build the _trace object to pass to child function calls.
 * This is what you include in the args when calling a child traced function.
 */
export function propagateTrace(ctx: TraceContext): TraceContext {
	return {
		traceId: ctx.traceId,
		spanId: ctx.spanId,
		parentSpanId: ctx.parentSpanId,
		requestId: ctx.requestId,
	};
}

// ============================================================================
// SAFE SERIALIZATION
// ============================================================================

/**
 * Safely serialize a value for storage, with size-aware truncation.
 *
 * If the serialized JSON exceeds MAX_SPAN_SIZE_BYTES, the value is replaced
 * with a truncation marker. This prevents Convex document size limit errors
 * while still recording the span.
 *
 * @returns An object with the serialized value and whether truncation occurred
 */
export function safeSerialize(value: unknown): {
	data: unknown;
	truncated: boolean;
} {
	if (value === undefined || value === null) {
		return { data: value, truncated: false };
	}

	try {
		const serialized = JSON.stringify(value);
		if (serialized.length > MAX_SPAN_SIZE_BYTES) {
			// Attempt a shallow summary: keep top-level keys with type info
			if (typeof value === "object" && value !== null) {
				const summary: Record<string, string> = {
					"[TRUNCATED]": `Original size: ${serialized.length} bytes`,
				};
				for (const [key, val] of Object.entries(value)) {
					const valStr = JSON.stringify(val);
					if (valStr && valStr.length > 1000) {
						summary[key] = `[${typeof val}: ${valStr.length} bytes]`;
					} else {
						summary[key] = valStr ?? String(val);
					}
				}
				return { data: summary, truncated: true };
			}
			return {
				data: `[TRUNCATED: ${serialized.length} bytes]`,
				truncated: true,
			};
		}
		// Value fits - return the original (not the string, Convex handles serialization)
		return { data: value, truncated: false };
	} catch {
		return {
			data: "[SERIALIZATION_ERROR: circular reference or non-serializable value]",
			truncated: true,
		};
	}
}

/**
 * Build a complete SpanData object from a trace context and execution metadata.
 */
export function buildSpanData(opts: {
	trace: TraceContext;
	functionName: string;
	functionType: string;
	startTime: number;
	endTime?: number;
	status: "started" | "completed" | "error";
	args?: unknown;
	result?: unknown;
	error?: Error;
	authContext?: SpanData["authContext"];
}): SpanData {
	const { data: argsData, truncated: argsTruncated } = safeSerialize(opts.args);
	const { data: resultData, truncated: resultTruncated } = safeSerialize(
		opts.result
	);

	const span: SpanData = {
		traceId: opts.trace.traceId,
		spanId: opts.trace.spanId,
		parentSpanId: opts.trace.parentSpanId,
		requestId: opts.trace.requestId,
		functionName: opts.functionName,
		functionType: opts.functionType,
		startTime: opts.startTime,
		status: opts.status,
	};

	if (opts.endTime !== undefined) {
		span.endTime = opts.endTime;
		span.duration = opts.endTime - opts.startTime;
	}

	if (opts.args !== undefined) {
		span.args = argsData;
	}

	if (opts.result !== undefined) {
		span.result = resultData;
	}

	if (opts.error) {
		span.error = {
			message: opts.error.message,
			stack: opts.error.stack,
		};
	}

	if (opts.authContext) {
		span.authContext = opts.authContext;
	}

	if (argsTruncated || resultTruncated) {
		span.truncated = true;
	}

	return span;
}
