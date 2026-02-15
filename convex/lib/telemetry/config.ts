/**
 * Telemetry configuration module.
 *
 * Reads environment variables to control sampling, payload capture,
 * redaction, retention, and OTLP export behavior.
 *
 * All env vars are optional - sensible defaults are applied.
 */

import type { SamplingMode, TelemetryConfig } from "./types";

// ============================================================================
// Defaults
// ============================================================================

const DEFAULT_SAMPLING_MODE: SamplingMode = "off";
const DEFAULT_SAMPLING_RATE = 1.0;
const DEFAULT_MAX_PAYLOAD_SIZE_BYTES = 64 * 1024; // 64 KB
const _DEFAULT_RETENTION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const DEFAULT_SERVICE_NAME = "flpilot";
const DEFAULT_ENVIRONMENT = "development";

/** Keys that are always redacted regardless of config. */
const ALWAYS_REDACTED_KEYS = [
	"password",
	"secret",
	"token",
	"accessToken",
	"refreshToken",
	"apiKey",
	"api_key",
	"authorization",
	"cookie",
	"ssn",
	"sin",
	"creditCard",
	"credit_card",
	"bankAccount",
	"bank_account",
	"accountNumber",
	"account_number",
	"transitNumber",
	"transit_number",
	"institutionNumber",
	"institution_number",
];

// ============================================================================
// Config Resolution
// ============================================================================

function parseSamplingMode(value: string | undefined): SamplingMode {
	const valid: SamplingMode[] = [
		"off",
		"errors-only",
		"full-dev",
		"rate-based",
	];
	if (value && valid.includes(value as SamplingMode)) {
		return value as SamplingMode;
	}
	return DEFAULT_SAMPLING_MODE;
}

function parseFloatSafe(value: string | undefined, fallback: number): number {
	if (!value) return fallback;
	const parsed = Number.parseFloat(value);
	return Number.isNaN(parsed) ? fallback : parsed;
}

function parseIntSafe(value: string | undefined, fallback: number): number {
	if (!value) return fallback;
	const parsed = Number.parseInt(value, 10);
	return Number.isNaN(parsed) ? fallback : parsed;
}

function parseHeaders(
	value: string | undefined
): Record<string, string> | undefined {
	if (!value) return;
	try {
		return JSON.parse(value) as Record<string, string>;
	} catch {
		// Fallback: treat as comma-separated key=value pairs
		const headers: Record<string, string> = {};
		for (const pair of value.split(",")) {
			const [key, ...rest] = pair.split("=");
			if (key?.trim() && rest.length > 0) {
				headers[key.trim()] = rest.join("=").trim();
			}
		}
		return Object.keys(headers).length > 0 ? headers : undefined;
	}
}

/**
 * Resolve telemetry config from environment variables.
 *
 * Environment variables:
 * - OTEL_ENABLED - "true" to enable telemetry (default: "false")
 * - OTEL_SAMPLING_MODE - "off" | "errors-only" | "full-dev" | "rate-based"
 * - OTEL_SAMPLING_RATE - 0.0-1.0 for rate-based sampling
 * - OTEL_CAPTURE_PAYLOADS - "true" to capture full payloads in dev
 * - OTEL_MAX_PAYLOAD_SIZE - max payload size in bytes
 * - OTEL_REDACTED_KEYS - comma-separated additional keys to redact
 * - OTEL_RETENTION_DAYS - retention period in days
 * - OTEL_EXPORTER_OTLP_ENDPOINT - OTLP endpoint URL
 * - OTEL_EXPORTER_OTLP_HEADERS - JSON or key=value,key=value headers
 * - OTEL_SERVICE_NAME - service name for resource attributes
 * - OTEL_ENVIRONMENT - environment label (e.g., "production", "staging")
 */
export function resolveTelemetryConfig(): TelemetryConfig {
	const enabled = process.env.OTEL_ENABLED === "true";
	const samplingMode = parseSamplingMode(process.env.OTEL_SAMPLING_MODE);
	const samplingRate = parseFloatSafe(
		process.env.OTEL_SAMPLING_RATE,
		DEFAULT_SAMPLING_RATE
	);
	const capturePayloads = process.env.OTEL_CAPTURE_PAYLOADS === "true";
	const maxPayloadSizeBytes = parseIntSafe(
		process.env.OTEL_MAX_PAYLOAD_SIZE,
		DEFAULT_MAX_PAYLOAD_SIZE_BYTES
	);

	const extraRedactedKeys = process.env.OTEL_REDACTED_KEYS
		? process.env.OTEL_REDACTED_KEYS.split(",")
				.map((k) => k.trim())
				.filter(Boolean)
		: [];
	const redactedKeys = [...ALWAYS_REDACTED_KEYS, ...extraRedactedKeys];

	const retentionDays = parseIntSafe(process.env.OTEL_RETENTION_DAYS, 7);
	const retentionMs = retentionDays * 24 * 60 * 60 * 1000;

	const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || undefined;
	const otlpHeaders = parseHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS);

	const serviceName = process.env.OTEL_SERVICE_NAME || DEFAULT_SERVICE_NAME;
	const environment = process.env.OTEL_ENVIRONMENT || DEFAULT_ENVIRONMENT;

	return {
		enabled,
		samplingMode,
		samplingRate,
		capturePayloads,
		maxPayloadSizeBytes,
		redactedKeys,
		retentionMs,
		otlpEndpoint,
		otlpHeaders,
		serviceName,
		environment,
	};
}

/**
 * Determine whether a given request should be sampled based on config.
 */
export function shouldSample(
	config: TelemetryConfig,
	isError?: boolean
): boolean {
	if (!config.enabled) return false;

	switch (config.samplingMode) {
		case "off":
			return false;
		case "errors-only":
			return isError === true;
		case "full-dev":
			return true;
		case "rate-based":
			return Math.random() < config.samplingRate;
		default:
			return false;
	}
}
