// @vitest-environment node
/**
 * 7.3 Integration test wrapper-based propagation across query/mutation/action chains.
 *
 * Tests that span records are correctly written to trace_spans and trace_runs
 * tables when using the internal span writer mutations.
 */

import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { internal } from "../_generated/api";
import schema from "../schema";

// @ts-ignore
const modules = import.meta.glob("../**/*.{ts,js,tsx,jsx}", { eager: false });
const createTest = () => convexTest(schema, modules);

describe("spanWriter: writeSpan", () => {
	test("inserts a span record into trace_spans", async () => {
		const t = createTest();

		await t.mutation(internal.lib.telemetry.spanWriter.writeSpan, {
			traceId: "aaaa0000bbbb1111cccc2222dddd3333",
			spanId: "1111222233334444",
			functionName: "api.users.getProfile",
			kind: "query",
			status: "completed",
			startedAt: 1700000000000,
			endedAt: 1700000000050,
			durationMs: 50,
		});

		// Verify the span was written
		const spans = await t.run(
			async (ctx) =>
				await ctx.db
					.query("trace_spans")
					.withIndex("by_traceId", (q) =>
						q.eq("traceId", "aaaa0000bbbb1111cccc2222dddd3333")
					)
					.collect()
		);

		expect(spans).toHaveLength(1);
		expect(spans[0].spanId).toBe("1111222233334444");
		expect(spans[0].functionName).toBe("api.users.getProfile");
		expect(spans[0].kind).toBe("query");
		expect(spans[0].status).toBe("completed");
		expect(spans[0].durationMs).toBe(50);
	});

	test("records error details on error spans", async () => {
		const t = createTest();

		await t.mutation(internal.lib.telemetry.spanWriter.writeSpan, {
			traceId: "aaaa0000bbbb1111cccc2222dddd3333",
			spanId: "5555666677778888",
			functionName: "api.users.deleteUser",
			kind: "mutation",
			status: "error",
			startedAt: 1700000000000,
			endedAt: 1700000000100,
			durationMs: 100,
			error: {
				message: "Permission denied",
				code: "auth",
			},
		});

		const spans = await t.run(async (ctx) => {
			const all = await ctx.db
				.query("trace_spans")
				.withIndex("by_traceId", (q) =>
					q.eq("traceId", "aaaa0000bbbb1111cccc2222dddd3333")
				)
				.collect();
			return all.filter((s) => s.spanId === "5555666677778888");
		});

		expect(spans).toHaveLength(1);
		expect(spans[0].status).toBe("error");
		expect(spans[0].error?.message).toBe("Permission denied");
		expect(spans[0].error?.code).toBe("auth");
	});

	test("records parent/child span linkage", async () => {
		const t = createTest();
		const traceId = "aaaa0000bbbb1111cccc2222dddd3333";

		// Write parent span
		await t.mutation(internal.lib.telemetry.spanWriter.writeSpan, {
			traceId,
			spanId: "parent00000000",
			functionName: "api.deals.createDeal",
			kind: "mutation",
			status: "completed",
			startedAt: 1700000000000,
			endedAt: 1700000000200,
			durationMs: 200,
		});

		// Write child span with parentSpanId
		await t.mutation(internal.lib.telemetry.spanWriter.writeSpan, {
			traceId,
			spanId: "child000000000",
			parentSpanId: "parent00000000",
			functionName: "internal.ownership.transfer",
			kind: "internal",
			status: "completed",
			startedAt: 1700000000050,
			endedAt: 1700000000150,
			durationMs: 100,
		});

		const spans = await t.run(
			async (ctx) =>
				await ctx.db
					.query("trace_spans")
					.withIndex("by_traceId", (q) => q.eq("traceId", traceId))
					.collect()
		);

		expect(spans).toHaveLength(2);
		const child = spans.find((s) => s.spanId === "child000000000");
		expect(child?.parentSpanId).toBe("parent00000000");
	});
});

describe("spanWriter: upsertTraceRun", () => {
	test("creates a new trace run on first call", async () => {
		const t = createTest();
		const traceId = "newrun00bbbb1111cccc2222dddd3333";

		await t.mutation(internal.lib.telemetry.spanWriter.upsertTraceRun, {
			traceId,
			rootFunction: "api.listings.list",
			status: "completed",
			startedAt: 1700000000000,
			endedAt: 1700000000100,
			durationMs: 100,
			environment: "test",
		});

		const runs = await t.run(
			async (ctx) =>
				await ctx.db
					.query("trace_runs")
					.withIndex("by_traceId", (q) => q.eq("traceId", traceId))
					.collect()
		);

		expect(runs).toHaveLength(1);
		expect(runs[0].rootFunction).toBe("api.listings.list");
		expect(runs[0].spanCount).toBe(1);
	});

	test("updates existing trace run and increments spanCount", async () => {
		const t = createTest();
		const traceId = "update0000bb1111cccc2222dddd3333";

		// First call creates
		await t.mutation(internal.lib.telemetry.spanWriter.upsertTraceRun, {
			traceId,
			rootFunction: "api.deals.createDeal",
			status: "started",
			startedAt: 1700000000000,
			environment: "test",
		});

		// Second call updates
		await t.mutation(internal.lib.telemetry.spanWriter.upsertTraceRun, {
			traceId,
			rootFunction: "api.deals.createDeal",
			status: "completed",
			startedAt: 1700000000000,
			endedAt: 1700000000200,
			durationMs: 200,
			environment: "test",
		});

		const runs = await t.run(
			async (ctx) =>
				await ctx.db
					.query("trace_runs")
					.withIndex("by_traceId", (q) => q.eq("traceId", traceId))
					.collect()
		);

		expect(runs).toHaveLength(1);
		expect(runs[0].status).toBe("completed");
		expect(runs[0].spanCount).toBe(2);
		expect(runs[0].endedAt).toBe(1700000000200);
	});
});
