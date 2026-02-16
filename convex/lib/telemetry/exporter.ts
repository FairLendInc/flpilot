/**
 * OTLP Exporter for trace data.
 *
 * Convex action that reads unexported trace runs + spans from the database,
 * transforms them into OTLP-compatible JSON payloads, and POSTs them to
 * the configured OTLP endpoint.
 *
 * Compatible with both SigNoz and Grafana Tempo (standard OTLP/HTTP).
 */

import { v } from "convex/values";
import { internal } from "../../_generated/api";
import {
	internalAction,
	internalMutation,
	internalQuery,
} from "../../_generated/server";
import { resolveTelemetryConfig } from "./config";

// ============================================================================
// Constants
// ============================================================================

const EXPORT_BATCH_SIZE = 50;
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1000;

// ============================================================================
// Internal query: fetch unexported trace runs
// ============================================================================

export const getUnexportedRuns = internalQuery({
	args: {
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const limit = args.limit ?? EXPORT_BATCH_SIZE;
		return await ctx.db
			.query("trace_runs")
			.withIndex("by_exported", (q) => q.eq("exportedAt", undefined))
			.filter((q) =>
				q.and(
					q.neq(q.field("status"), "started"),
					q.eq(q.field("exportError"), undefined)
				)
			)
			.take(limit);
	},
});

// ============================================================================
// Internal query: fetch spans for a trace
// ============================================================================

export const getSpansForTrace = internalQuery({
	args: {
		traceId: v.string(),
	},
	handler: async (ctx, args) =>
		await ctx.db
			.query("trace_spans")
			.withIndex("by_traceId", (q) => q.eq("traceId", args.traceId))
			.collect(),
});

// ============================================================================
// Internal mutation: mark trace as exported
// ============================================================================

export const markExported = internalMutation({
	args: {
		traceRunId: v.id("trace_runs"),
		exportedAt: v.number(),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.traceRunId, {
			exportedAt: args.exportedAt,
		});
	},
});

// ============================================================================
// Internal mutation: mark trace export as failed (dead-letter)
// ============================================================================

export const markExportFailed = internalMutation({
	args: {
		traceRunId: v.id("trace_runs"),
		error: v.string(),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.traceRunId, {
			exportError: args.error,
		});
	},
});

// ============================================================================
// OTLP JSON transformation
// ============================================================================

type SpanRecord = {
	traceId: string;
	spanId: string;
	parentSpanId?: string;
	functionName: string;
	kind: string;
	status: string;
	startedAt: number;
	endedAt?: number;
	durationMs?: number;
	attributes?: Record<string, unknown>;
	error?: { message: string; code?: string; stack?: string };
};

function spanToOtlp(
	span: SpanRecord,
	serviceName: string,
	environment: string
) {
	const startTimeUnixNano = span.startedAt * 1_000_000; // ms → ns
	const endTimeUnixNano = (span.endedAt ?? span.startedAt) * 1_000_000;

	const otelStatus =
		span.status === "error"
			? { code: 2, message: span.error?.message ?? "error" } // STATUS_CODE_ERROR
			: { code: 1 }; // STATUS_CODE_OK

	const attributes: Array<{
		key: string;
		value: { stringValue?: string; intValue?: string };
	}> = [
		{ key: "convex.function.name", value: { stringValue: span.functionName } },
		{ key: "convex.function.kind", value: { stringValue: span.kind } },
		{ key: "service.name", value: { stringValue: serviceName } },
		{ key: "deployment.environment", value: { stringValue: environment } },
	];

	if (span.error) {
		attributes.push({
			key: "exception.message",
			value: { stringValue: span.error.message },
		});
		if (span.error.code) {
			attributes.push({
				key: "exception.type",
				value: { stringValue: span.error.code },
			});
		}
	}

	// Add custom attributes
	if (span.attributes && typeof span.attributes === "object") {
		for (const [key, val] of Object.entries(span.attributes)) {
			if (typeof val === "string") {
				attributes.push({ key, value: { stringValue: val } });
			} else if (typeof val === "number") {
				attributes.push({ key, value: { intValue: String(val) } });
			}
		}
	}

	return {
		traceId: span.traceId,
		spanId: span.spanId,
		parentSpanId: span.parentSpanId || "",
		name: span.functionName,
		kind: 1, // SPAN_KIND_INTERNAL
		startTimeUnixNano: String(startTimeUnixNano),
		endTimeUnixNano: String(endTimeUnixNano),
		attributes,
		status: otelStatus,
	};
}

function buildOtlpPayload(
	spans: SpanRecord[],
	serviceName: string,
	environment: string
) {
	return {
		resourceSpans: [
			{
				resource: {
					attributes: [
						{ key: "service.name", value: { stringValue: serviceName } },
						{
							key: "deployment.environment",
							value: { stringValue: environment },
						},
					],
				},
				scopeSpans: [
					{
						scope: { name: "flpilot-otel", version: "1.0.0" },
						spans: spans.map((s) => spanToOtlp(s, serviceName, environment)),
					},
				],
			},
		],
	};
}

// ============================================================================
// Export action: batch export with retry/backoff
// ============================================================================

/**
 * Main exporter action. Reads unexported traces, transforms to OTLP,
 * and POSTs to the configured endpoint with retry/backoff.
 *
 * Designed to be called by a cron job or manually triggered.
 */
export const exportTraces = internalAction({
	args: {},
	handler: async (
		ctx
	): Promise<{
		exported: number;
		failed?: number;
		total?: number;
		skipped?: string;
	}> => {
		const config = resolveTelemetryConfig();

		if (!config.otlpEndpoint) {
			return { exported: 0, skipped: "no OTLP endpoint configured" };
		}

		// Fetch unexported runs
		const runs = await ctx.runQuery(
			internal.lib.telemetry.exporter.getUnexportedRuns,
			{ limit: EXPORT_BATCH_SIZE }
		);

		if (runs.length === 0) {
			return { exported: 0 };
		}

		let exported = 0;
		let failed = 0;

		for (const run of runs) {
			const spans = await ctx.runQuery(
				internal.lib.telemetry.exporter.getSpansForTrace,
				{ traceId: run.traceId }
			);

			if (spans.length === 0) {
				// Mark as exported even if no spans (avoid re-processing)
				await ctx.runMutation(internal.lib.telemetry.exporter.markExported, {
					traceRunId: run._id,
					exportedAt: Date.now(),
				});
				exported++;
				continue;
			}

			const payload = buildOtlpPayload(
				spans as SpanRecord[],
				config.serviceName,
				config.environment
			);

			// Retry loop with exponential backoff
			let success = false;
			let lastError = "";

			for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
				try {
					const headers: Record<string, string> = {
						"Content-Type": "application/json",
						...(config.otlpHeaders ?? {}),
					};

					const response = await fetch(`${config.otlpEndpoint}/v1/traces`, {
						method: "POST",
						headers,
						body: JSON.stringify(payload),
					});

					if (response.ok) {
						success = true;
						break;
					}

					lastError = `HTTP ${response.status}: ${await response.text().catch(() => "unknown")}`;
				} catch (err) {
					lastError = err instanceof Error ? err.message : String(err);
				}

				// Exponential backoff before retry
				if (attempt < MAX_RETRIES - 1) {
					const delay = BASE_RETRY_DELAY_MS * 2 ** attempt;
					await new Promise((resolve) => setTimeout(resolve, delay));
				}
			}

			if (success) {
				await ctx.runMutation(internal.lib.telemetry.exporter.markExported, {
					traceRunId: run._id,
					exportedAt: Date.now(),
				});
				exported++;
			} else {
				// Dead-letter: mark as failed so it won't be retried
				await ctx.runMutation(
					internal.lib.telemetry.exporter.markExportFailed,
					{
						traceRunId: run._id,
						error: `Export failed after ${MAX_RETRIES} attempts: ${lastError}`,
					}
				);
				failed++;
			}
		}

		return { exported, failed, total: runs.length };
	},
});
