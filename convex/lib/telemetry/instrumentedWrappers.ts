/**
 * Instrumented Convex wrappers — DEPRECATED.
 *
 * The auth wrappers in `convex/lib/server.ts` now include OTel tracing
 * natively. These exports are kept as aliases for backward compatibility.
 *
 * Use `createAuthorizedQuery/Mutation/Action` from `../server` instead.
 */

import {
	createAuthorizedAction,
	createAuthorizedMutation,
	createAuthorizedQuery,
	type TelemetryCtx,
} from "../server";
import type { OtelEnvelope } from "./types";
import { generateSpanId } from "./types";

// ============================================================================
// Re-export TelemetryCtx (used by barrel exports)
// ============================================================================

export type { TelemetryCtx };

// ============================================================================
// Propagation helper (still useful — not deprecated)
// ============================================================================

/**
 * Create a child OTel envelope for propagation to internal calls.
 * Use this when calling ctx.runQuery/runMutation/runAction from
 * within a traced handler.
 *
 * Example:
 *   const childEnvelope = createPropagationEnvelope(ctx);
 *   await ctx.runMutation(internal.myFn, { ...args, _otel: childEnvelope });
 */
export function createPropagationEnvelope(ctx: {
	_telemetry?: TelemetryCtx["_telemetry"];
}): OtelEnvelope | undefined {
	if (!ctx._telemetry?.sampled) return;
	return {
		traceId: ctx._telemetry.traceId,
		spanId: generateSpanId(),
		parentSpanId: ctx._telemetry.spanId,
		requestId: ctx._telemetry.requestId,
		sampled: ctx._telemetry.sampled,
	};
}

// ============================================================================
// Deprecated aliases — use createAuthorized* from ../server instead
// ============================================================================

/**
 * @deprecated Use `createAuthorizedQuery` from `../server` instead.
 * The auth wrappers now include telemetry natively.
 */
export const createTracedAuthorizedQuery = createAuthorizedQuery;

/**
 * @deprecated Use `createAuthorizedMutation` from `../server` instead.
 * The auth wrappers now include telemetry natively.
 */
export const createTracedAuthorizedMutation = createAuthorizedMutation;

/**
 * @deprecated Use `createAuthorizedAction` from `../server` instead.
 * The auth wrappers now include telemetry natively.
 */
export const createTracedAuthorizedAction = createAuthorizedAction;

/**
 * @deprecated Use `createAuthorizedQuery([], [], true)` from `../server` instead.
 */
export const tracedQuery = createAuthorizedQuery([], [], true);

/**
 * @deprecated Use `createAuthorizedMutation([], [], true)` from `../server` instead.
 */
export const tracedMutation = createAuthorizedMutation([], [], true);

/**
 * @deprecated Use `createAuthorizedAction([], [], true)` from `../server` instead.
 */
export const tracedAction = createAuthorizedAction([], [], true);
