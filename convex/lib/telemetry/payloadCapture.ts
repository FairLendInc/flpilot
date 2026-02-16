/**
 * Payload capture service for dev-mode trace inspection.
 *
 * Captures args/context/state/result/error snapshots as JSON blobs,
 * applies redaction and size limits, and stores them in trace_payloads.
 */

import { v } from "convex/values";
import type { MutationCtx } from "../../_generated/server";
import { internalMutation } from "../../_generated/server";
import { resolveTelemetryConfig } from "./config";
import type { PayloadKind } from "./types";
import { generatePayloadRef } from "./types";

// ============================================================================
// Redaction
// ============================================================================

/**
 * Deep-redact sensitive keys from an object.
 * Returns a new object with matching keys replaced by "[REDACTED]".
 */
export function redactPayload(
	data: unknown,
	redactedKeys: string[]
): { result: unknown; wasRedacted: boolean } {
	const keySet = new Set(redactedKeys.map((k) => k.toLowerCase()));
	let wasRedacted = false;

	function walk(value: unknown): unknown {
		if (value === null || value === undefined) return value;

		if (Array.isArray(value)) {
			return value.map(walk);
		}

		if (typeof value === "object") {
			const result: Record<string, unknown> = {};
			for (const [key, val] of Object.entries(
				value as Record<string, unknown>
			)) {
				if (keySet.has(key.toLowerCase())) {
					result[key] = "[REDACTED]";
					wasRedacted = true;
				} else {
					result[key] = walk(val);
				}
			}
			return result;
		}

		return value;
	}

	const result = walk(data);
	return { result, wasRedacted };
}

// ============================================================================
// Size accounting & truncation
// ============================================================================

/**
 * Serialize payload to JSON with size limit enforcement.
 * If the serialized payload exceeds maxBytes, it's truncated with a marker.
 */
export function serializeWithLimit(
	data: unknown,
	maxBytes: number
): { content: string; sizeBytes: number; truncated: boolean } {
	let content: string;
	try {
		content = JSON.stringify(data);
	} catch {
		content = JSON.stringify({ _error: "payload not serializable" });
	}

	const sizeBytes = new TextEncoder().encode(content).length;

	if (sizeBytes <= maxBytes) {
		return { content, sizeBytes, truncated: false };
	}

	// Truncate and add marker
	const truncatedContent = JSON.stringify({
		_truncated: true,
		_originalSizeBytes: sizeBytes,
		_maxSizeBytes: maxBytes,
		_preview: content.substring(0, Math.min(1024, maxBytes)),
	});

	return {
		content: truncatedContent,
		sizeBytes: new TextEncoder().encode(truncatedContent).length,
		truncated: true,
	};
}

// ============================================================================
// Capture & store
// ============================================================================

/**
 * Capture a payload snapshot: redact, serialize, and store in trace_payloads.
 * Returns the payloadRef for linking from the span record.
 *
 * Only captures when telemetry is enabled and capturePayloads is true.
 * Returns undefined if capture is skipped.
 */
export async function capturePayload(
	ctx: MutationCtx,
	opts: {
		traceId: string;
		spanId: string;
		kind: PayloadKind;
		data: unknown;
	}
): Promise<string | undefined> {
	const config = resolveTelemetryConfig();

	if (!(config.enabled && config.capturePayloads)) {
		return;
	}

	const { result: redacted, wasRedacted } = redactPayload(
		opts.data,
		config.redactedKeys
	);

	const { content, sizeBytes } = serializeWithLimit(
		redacted,
		config.maxPayloadSizeBytes
	);

	const payloadRef = generatePayloadRef();

	await ctx.db.insert("trace_payloads", {
		payloadRef,
		traceId: opts.traceId,
		spanId: opts.spanId,
		kind: opts.kind,
		content,
		sizeBytes,
		redacted: wasRedacted,
		createdAt: Date.now(),
	});

	return payloadRef;
}

// ============================================================================
// Internal mutation: write payload from action context (via scheduler)
// ============================================================================

export const writePayload = internalMutation({
	args: {
		payloadRef: v.string(),
		traceId: v.string(),
		spanId: v.string(),
		kind: v.union(
			v.literal("args"),
			v.literal("context"),
			v.literal("state"),
			v.literal("result"),
			v.literal("error")
		),
		content: v.string(),
		sizeBytes: v.number(),
		redacted: v.boolean(),
	},
	handler: async (ctx, args) => {
		await ctx.db.insert("trace_payloads", {
			...args,
			createdAt: Date.now(),
		});
	},
});
