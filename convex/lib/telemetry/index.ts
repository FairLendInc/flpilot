/**
 * Telemetry module barrel export.
 *
 * Primary usage — auth wrappers now include telemetry natively:
 *   import { createAuthorizedMutation } from "../server";
 *
 * For trace propagation in internal calls:
 *   import { createPropagationEnvelope } from "./telemetry";
 *
 * The createTracedAuthorized* and traced* exports are deprecated aliases.
 */

// Config
export { resolveTelemetryConfig, shouldSample } from "./config";
export type { TelemetryCtx } from "./instrumentedWrappers";
// Propagation helper (not deprecated)
// Deprecated aliases (use createAuthorized* from ../server instead)
export {
	createPropagationEnvelope,
	/** @deprecated */ createTracedAuthorizedAction,
	/** @deprecated */ createTracedAuthorizedMutation,
	/** @deprecated */ createTracedAuthorizedQuery,
	/** @deprecated */ tracedAction,
	/** @deprecated */ tracedMutation,
	/** @deprecated */ tracedQuery,
} from "./instrumentedWrappers";
export type { SpanContext } from "./spanWriter";
// Span writer
export { beginSpan, endSpan, endSpanFromAction } from "./spanWriter";
// Types
export type {
	CapturedPayload,
	OtelEnvelope,
	PayloadKind,
	SamplingMode,
	SpanError,
	SpanKind,
	SpanStatus,
	TelemetryConfig,
	TraceStatus,
} from "./types";
// ID generators
export {
	createChildEnvelope,
	createRootEnvelope,
	generatePayloadRef,
	generateRequestId,
	generateSpanId,
	generateTraceId,
} from "./types";
