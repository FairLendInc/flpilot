/**
 * Shared telemetry types for OTel tracing.
 *
 * These types define the trace context envelope that flows between
 * client hooks and server wrappers, plus span lifecycle event shapes.
 */

// ============================================================================
// Trace Context Envelope (client → server propagation)
// ============================================================================

/**
 * The `_otel` envelope attached to Convex calls by client hooks.
 * Server wrappers consume this to continue/create trace context.
 */
export type OtelEnvelope = {
	traceId: string;
	spanId: string;
	parentSpanId?: string;
	requestId?: string;
	/** Server function name for span labeling (e.g., "mortgages.getMortgage") */
	functionName?: string;
	sampled: boolean;
	debugMode?: boolean;
};

// ============================================================================
// Span Types
// ============================================================================

export type SpanKind = "query" | "mutation" | "action" | "internal";

export type SpanStatus = "started" | "completed" | "error";

export type TraceStatus = "started" | "completed" | "error";

export type SpanError = {
	message: string;
	code?: string;
	stack?: string;
};

// ============================================================================
// Payload Types
// ============================================================================

export type PayloadKind = "args" | "context" | "state" | "result" | "error";

export type CapturedPayload = {
	payloadRef: string;
	traceId: string;
	spanId: string;
	kind: PayloadKind;
	content: string; // JSON-serialized
	sizeBytes: number;
	redacted: boolean;
};

// ============================================================================
// Sampling Modes
// ============================================================================

export type SamplingMode = "off" | "errors-only" | "full-dev" | "rate-based";

// ============================================================================
// Telemetry Config Shape
// ============================================================================

export type TelemetryConfig = {
	enabled: boolean;
	samplingMode: SamplingMode;
	/** Rate for rate-based sampling (0.0-1.0). Only used when samplingMode is "rate-based". */
	samplingRate: number;
	/** Whether to capture full payloads (args, results, etc.) */
	capturePayloads: boolean;
	/** Max payload size in bytes before truncation */
	maxPayloadSizeBytes: number;
	/** Keys to always redact from captured payloads */
	redactedKeys: string[];
	/** Retention period for trace data in milliseconds */
	retentionMs: number;
	/** OTLP exporter endpoint (if configured) */
	otlpEndpoint?: string;
	/** OTLP exporter headers (e.g., auth tokens) */
	otlpHeaders?: Record<string, string>;
	/** Service name for OTel resource attributes */
	serviceName: string;
	/** Current environment label */
	environment: string;
};

// ============================================================================
// ID Generation Helpers
// ============================================================================

/**
 * Generate a random hex string of the given byte length.
 * Uses Math.random (sufficient for trace IDs - not crypto).
 */
function randomHex(bytes: number): string {
	const chars = "0123456789abcdef";
	let result = "";
	for (let i = 0; i < bytes * 2; i++) {
		result += chars[Math.floor(Math.random() * 16)];
	}
	return result;
}

/** Generate a 32-char hex trace ID (OTel standard: 16 bytes). */
export function generateTraceId(): string {
	return randomHex(16);
}

/** Generate a 16-char hex span ID (OTel standard: 8 bytes). */
export function generateSpanId(): string {
	return randomHex(8);
}

/** Generate a unique payload reference key. */
export function generatePayloadRef(): string {
	return `pld_${randomHex(12)}`;
}

/** Generate a request ID for correlation. */
export function generateRequestId(): string {
	return `req_${randomHex(8)}`;
}

// ============================================================================
// Envelope Helpers
// ============================================================================

/**
 * Create a new root OTel envelope (no parent).
 */
export function createRootEnvelope(
	sampled: boolean,
	debugMode?: boolean,
	functionName?: string
): OtelEnvelope {
	return {
		traceId: generateTraceId(),
		spanId: generateSpanId(),
		requestId: generateRequestId(),
		functionName,
		sampled,
		debugMode,
	};
}

/**
 * Create a child envelope from a parent envelope.
 */
export function createChildEnvelope(parent: OtelEnvelope): OtelEnvelope {
	return {
		traceId: parent.traceId,
		spanId: generateSpanId(),
		parentSpanId: parent.spanId,
		requestId: parent.requestId,
		functionName: parent.functionName,
		sampled: parent.sampled,
		debugMode: parent.debugMode,
	};
}
