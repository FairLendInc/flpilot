// @vitest-environment node
/**
 * Tracing Framework Tests
 *
 * Tests for the core tracing primitives including:
 * - TraceContext creation and propagation
 * - Safe serialization with truncation
 * - Span data building
 * - Span CRUD operations
 */

import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { internal } from "../_generated/api";
import {
	buildSpanData,
	createTraceContext,
	propagateTrace,
	safeSerialize,
} from "../lib/tracing";
import schema from "../schema";

// @ts-ignore
const modules = import.meta.glob("../**/*.{ts,js,tsx,jsx}", { eager: false });
const createTest = () => convexTest(schema, modules);

// ============================================================================
// TraceContext Creation
// ============================================================================

describe("createTraceContext", () => {
	test("creates a root trace context with unique IDs", () => {
		const ctx = createTraceContext("deals.createDeal", "mutation");

		expect(ctx.traceId).toBeDefined();
		expect(ctx.spanId).toBeDefined();
		expect(ctx.traceId).not.toBe(ctx.spanId);
		expect(ctx.parentSpanId).toBeUndefined();
		expect(ctx.requestId).toBeUndefined();
	});

	test("creates a child trace context inheriting traceId", () => {
		const parent = createTraceContext("deals.createDeal", "mutation");
		const child = createTraceContext("ownership.transfer", "mutation", parent);

		expect(child.traceId).toBe(parent.traceId);
		expect(child.spanId).not.toBe(parent.spanId);
		expect(child.parentSpanId).toBe(parent.spanId);
	});

	test("propagates requestId from parent", () => {
		const parent = createTraceContext("deals.createDeal", "mutation");
		parent.requestId = "req-123";
		const child = createTraceContext("ownership.transfer", "mutation", parent);

		expect(child.requestId).toBe("req-123");
	});

	test("generates unique span IDs across multiple calls", () => {
		const ids = new Set<string>();
		for (let i = 0; i < 100; i += 1) {
			const ctx = createTraceContext("test", "mutation");
			ids.add(ctx.spanId);
		}
		expect(ids.size).toBe(100);
	});
});

// ============================================================================
// propagateTrace
// ============================================================================

describe("propagateTrace", () => {
	test("returns a clean trace context for child propagation", () => {
		const parent = createTraceContext("deals.createDeal", "mutation");
		parent.requestId = "req-abc";

		const propagated = propagateTrace(parent);

		expect(propagated.traceId).toBe(parent.traceId);
		expect(propagated.spanId).toBe(parent.spanId);
		expect(propagated.requestId).toBe("req-abc");
	});
});

// ============================================================================
// safeSerialize
// ============================================================================

describe("safeSerialize", () => {
	test("passes through small objects unchanged", () => {
		const data = { name: "test", value: 42 };
		const { data: result, truncated } = safeSerialize(data);

		expect(result).toEqual(data);
		expect(truncated).toBe(false);
	});

	test("handles null and undefined", () => {
		expect(safeSerialize(null)).toEqual({ data: null, truncated: false });
		expect(safeSerialize(undefined)).toEqual({
			data: undefined,
			truncated: false,
		});
	});

	test("handles primitive values", () => {
		expect(safeSerialize("hello")).toEqual({
			data: "hello",
			truncated: false,
		});
		expect(safeSerialize(42)).toEqual({ data: 42, truncated: false });
		expect(safeSerialize(true)).toEqual({ data: true, truncated: false });
	});

	test("truncates oversized objects with summary", () => {
		// Create an object that exceeds 900KB
		const largeObj: Record<string, string> = {};
		for (let i = 0; i < 1000; i += 1) {
			largeObj[`key_${i}`] = "x".repeat(1000);
		}

		const { data: result, truncated } = safeSerialize(largeObj);

		expect(truncated).toBe(true);
		expect(result).toBeDefined();
		// Should have a [TRUNCATED] key
		expect((result as Record<string, string>)["[TRUNCATED]"]).toContain(
			"bytes"
		);
	});

	test("handles circular references gracefully", () => {
		const obj: Record<string, unknown> = { a: 1 };
		obj.self = obj;

		const { data: result, truncated } = safeSerialize(obj);

		expect(truncated).toBe(true);
		expect(result).toContain("SERIALIZATION_ERROR");
	});
});

// ============================================================================
// buildSpanData
// ============================================================================

describe("buildSpanData", () => {
	test("builds a complete span for a successful execution", () => {
		const trace = createTraceContext("deals.createDeal", "mutation");
		const span = buildSpanData({
			trace,
			functionName: "deals.createDeal",
			functionType: "mutation",
			startTime: 1000,
			endTime: 1050,
			status: "completed",
			args: { title: "Test Deal" },
			result: { id: "deal-123" },
			authContext: {
				subject: "user-1",
				role: "admin",
			},
		});

		expect(span.traceId).toBe(trace.traceId);
		expect(span.spanId).toBe(trace.spanId);
		expect(span.functionName).toBe("deals.createDeal");
		expect(span.functionType).toBe("mutation");
		expect(span.duration).toBe(50);
		expect(span.status).toBe("completed");
		expect(span.args).toEqual({ title: "Test Deal" });
		expect(span.result).toEqual({ id: "deal-123" });
		expect(span.authContext?.subject).toBe("user-1");
		expect(span.error).toBeUndefined();
		expect(span.truncated).toBeUndefined();
	});

	test("builds a span for an error", () => {
		const trace = createTraceContext("deals.createDeal", "mutation");
		const span = buildSpanData({
			trace,
			functionName: "deals.createDeal",
			functionType: "mutation",
			startTime: 1000,
			endTime: 1010,
			status: "error",
			args: { id: "bad-id" },
			error: new Error("Deal not found"),
		});

		expect(span.status).toBe("error");
		expect(span.error?.message).toBe("Deal not found");
		expect(span.error?.stack).toBeDefined();
		expect(span.result).toBeUndefined();
	});

	test("marks span as truncated when payload is oversized", () => {
		const trace = createTraceContext("test", "mutation");
		const largeArgs: Record<string, string> = {};
		for (let i = 0; i < 1000; i += 1) {
			largeArgs[`key_${i}`] = "x".repeat(1000);
		}

		const span = buildSpanData({
			trace,
			functionName: "test",
			functionType: "mutation",
			startTime: 1000,
			status: "completed",
			args: largeArgs,
		});

		expect(span.truncated).toBe(true);
	});
});

// ============================================================================
// Span CRUD Operations (Convex integration tests)
// ============================================================================

describe("trace span CRUD", () => {
	test("recordSpan creates a span in the database", async () => {
		const t = createTest();

		const spanId = await t.mutation(internal.traces.recordSpan, {
			traceId: "trace-001",
			spanId: "span-001",
			functionName: "deals.createDeal",
			functionType: "mutation",
			startTime: Date.now(),
			status: "started",
			args: { title: "Test Deal" },
		});

		expect(spanId).toBeDefined();
	});

	test("completeSpan updates a span with completion data", async () => {
		const t = createTest();

		await t.mutation(internal.traces.recordSpan, {
			traceId: "trace-002",
			spanId: "span-002",
			functionName: "deals.createDeal",
			functionType: "mutation",
			startTime: 1000,
			status: "started",
		});

		await t.mutation(internal.traces.completeSpan, {
			spanId: "span-002",
			endTime: 1050,
			duration: 50,
			status: "completed",
			result: { id: "deal-123" },
		});

		// Verify via internal query
		const spans = await t.query(internal.traces.getExpiredSpans, {
			cutoffTimestamp: Date.now() + 100000,
		});
		expect(spans.length).toBeGreaterThan(0);
	});

	test("deleteExpiredSpans removes old spans", async () => {
		const t = createTest();
		const oldTimestamp = Date.now() - 100000;

		// Create an old span
		await t.mutation(internal.traces.recordSpan, {
			traceId: "trace-old",
			spanId: "span-old",
			functionName: "old.function",
			functionType: "mutation",
			startTime: oldTimestamp,
			status: "completed",
		});

		// Delete spans older than now
		const deleted = await t.mutation(internal.traces.deleteExpiredSpans, {
			cutoffTimestamp: Date.now(),
		});

		expect(deleted).toBeGreaterThanOrEqual(1);
	});

	test("recordSpan stores full payloads without truncation", async () => {
		const t = createTest();

		// Create a moderately large payload (well under 1MB)
		const largeArgs: Record<string, unknown> = {};
		for (let i = 0; i < 100; i += 1) {
			largeArgs[`field_${i}`] = {
				value: "x".repeat(500),
				nested: { a: 1, b: 2, c: 3 },
			};
		}

		const spanId = await t.mutation(internal.traces.recordSpan, {
			traceId: "trace-large",
			spanId: "span-large",
			functionName: "test.largePayload",
			functionType: "mutation",
			startTime: Date.now(),
			status: "completed",
			args: largeArgs,
			result: largeArgs, // Same large object as result
			authContext: {
				subject: "user-1",
				role: "admin",
				org_id: "org-1",
				permissions: ["read:all", "write:all"],
			},
		});

		expect(spanId).toBeDefined();
	});
});
