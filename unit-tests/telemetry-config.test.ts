/**
 * 7.2 (continued) + 5.4 Unit test sampling controls and config resolution.
 */
import { afterEach, describe, expect, it } from "vitest";
import {
	resolveTelemetryConfig,
	shouldSample,
} from "../convex/lib/telemetry/config";
import type { TelemetryConfig } from "../convex/lib/telemetry/types";

function makeConfig(overrides: Partial<TelemetryConfig> = {}): TelemetryConfig {
	return {
		enabled: true,
		samplingMode: "full-dev",
		samplingRate: 1.0,
		capturePayloads: false,
		maxPayloadSizeBytes: 65536,
		redactedKeys: [],
		retentionMs: 604800000,
		serviceName: "test",
		environment: "test",
		...overrides,
	};
}

describe("shouldSample", () => {
	it("returns false when telemetry is disabled", () => {
		const config = makeConfig({ enabled: false, samplingMode: "full-dev" });
		expect(shouldSample(config)).toBe(false);
	});

	it("returns false in off mode", () => {
		const config = makeConfig({ samplingMode: "off" });
		expect(shouldSample(config)).toBe(false);
	});

	it("returns true in full-dev mode", () => {
		const config = makeConfig({ samplingMode: "full-dev" });
		expect(shouldSample(config)).toBe(true);
	});

	it("returns true for errors in errors-only mode", () => {
		const config = makeConfig({ samplingMode: "errors-only" });
		expect(shouldSample(config, true)).toBe(true);
	});

	it("returns false for non-errors in errors-only mode", () => {
		const config = makeConfig({ samplingMode: "errors-only" });
		expect(shouldSample(config, false)).toBe(false);
		expect(shouldSample(config)).toBe(false);
	});

	it("respects rate in rate-based mode", () => {
		const config = makeConfig({
			samplingMode: "rate-based",
			samplingRate: 1.0,
		});
		// 100% rate should always sample
		expect(shouldSample(config)).toBe(true);

		const zeroConfig = makeConfig({
			samplingMode: "rate-based",
			samplingRate: 0.0,
		});
		// 0% rate should never sample
		expect(shouldSample(zeroConfig)).toBe(false);
	});
});

describe("resolveTelemetryConfig", () => {
	afterEach(() => {
		// Clean up env vars
		for (const key of [
			"OTEL_ENABLED",
			"OTEL_SAMPLING_MODE",
			"OTEL_SAMPLING_RATE",
			"OTEL_CAPTURE_PAYLOADS",
			"OTEL_MAX_PAYLOAD_SIZE",
			"OTEL_REDACTED_KEYS",
			"OTEL_RETENTION_DAYS",
			"OTEL_EXPORTER_OTLP_ENDPOINT",
			"OTEL_EXPORTER_OTLP_HEADERS",
			"OTEL_SERVICE_NAME",
			"OTEL_ENVIRONMENT",
		]) {
			delete process.env[key];
		}
	});

	it("returns defaults when no env vars are set", () => {
		const config = resolveTelemetryConfig();
		expect(config.enabled).toBe(false);
		expect(config.samplingMode).toBe("off");
		expect(config.samplingRate).toBe(1.0);
		expect(config.capturePayloads).toBe(false);
		expect(config.maxPayloadSizeBytes).toBe(65536);
		expect(config.serviceName).toBe("flpilot");
		expect(config.environment).toBe("development");
		expect(config.otlpEndpoint).toBeUndefined();
	});

	it("reads OTEL_ENABLED", () => {
		process.env.OTEL_ENABLED = "true";
		expect(resolveTelemetryConfig().enabled).toBe(true);
	});

	it("reads OTEL_SAMPLING_MODE", () => {
		process.env.OTEL_SAMPLING_MODE = "errors-only";
		expect(resolveTelemetryConfig().samplingMode).toBe("errors-only");
	});

	it("falls back to default for invalid sampling mode", () => {
		process.env.OTEL_SAMPLING_MODE = "invalid";
		expect(resolveTelemetryConfig().samplingMode).toBe("off");
	});

	it("reads OTEL_REDACTED_KEYS and merges with defaults", () => {
		process.env.OTEL_REDACTED_KEYS = "mySecret,myToken";
		const config = resolveTelemetryConfig();
		expect(config.redactedKeys).toContain("password"); // always-redacted
		expect(config.redactedKeys).toContain("mySecret"); // user-added
		expect(config.redactedKeys).toContain("myToken"); // user-added
	});

	it("reads OTEL_RETENTION_DAYS and converts to ms", () => {
		process.env.OTEL_RETENTION_DAYS = "30";
		const config = resolveTelemetryConfig();
		expect(config.retentionMs).toBe(30 * 24 * 60 * 60 * 1000);
	});

	it("parses JSON OTLP headers", () => {
		process.env.OTEL_EXPORTER_OTLP_HEADERS = '{"Authorization":"Bearer abc"}';
		const config = resolveTelemetryConfig();
		expect(config.otlpHeaders).toEqual({ Authorization: "Bearer abc" });
	});

	it("parses key=value OTLP headers", () => {
		process.env.OTEL_EXPORTER_OTLP_HEADERS =
			"Authorization=Bearer abc,X-Custom=value";
		const config = resolveTelemetryConfig();
		expect(config.otlpHeaders).toEqual({
			Authorization: "Bearer abc",
			"X-Custom": "value",
		});
	});
});
