/**
 * Tests for trace dashboard UI logic.
 *
 * Tests the pure functions and algorithms used by the trace dashboard
 * components: DAG tree building, timeline calculations, and helper utilities.
 */

import { describe, expect, it } from "vitest";

// ============================================================================
// Replicate the pure logic from components for testing
// (These functions are embedded in the components; we test the algorithms here)
// ============================================================================

type Span = {
	_id: string;
	spanId: string;
	parentSpanId?: string;
	functionName: string;
	kind: string;
	status: string;
	startedAt: number;
	endedAt?: number;
	durationMs?: number;
	traceId?: string;
	error?: { message: string; code?: string };
};

type TreeNode = Span & { children: TreeNode[] };

/** Mirrors TraceDAG.buildTree */
function buildTree(spans: Span[]): TreeNode[] {
	const byId = new Map<string, TreeNode>();
	for (const span of spans) {
		byId.set(span.spanId, { ...span, children: [] });
	}

	const roots: TreeNode[] = [];
	for (const node of byId.values()) {
		if (node.parentSpanId && byId.has(node.parentSpanId)) {
			byId.get(node.parentSpanId)?.children.push(node);
		} else {
			roots.push(node);
		}
	}

	return roots;
}

/** Mirrors TraceTimeline time bounds calculation */
function calculateTimeBounds(spans: Span[]) {
	const minStart = Math.min(...spans.map((s) => s.startedAt));
	const maxEnd = Math.max(...spans.map((s) => s.endedAt ?? s.startedAt));
	const totalDuration = maxEnd - minStart || 1;
	return { minStart, maxEnd, totalDuration };
}

/** Mirrors TraceTimeline bar position calculation */
function calculateBarPosition(
	span: Span,
	minStart: number,
	totalDuration: number
) {
	const startOffset = ((span.startedAt - minStart) / totalDuration) * 100;
	const duration =
		((span.endedAt ?? span.startedAt) - span.startedAt) / totalDuration;
	const widthPercent = Math.max(duration * 100, 0.5);
	return { startOffset, widthPercent };
}

/** Mirrors TraceDAG statusColor */
function statusColor(status: string) {
	switch (status) {
		case "completed":
			return "default";
		case "error":
			return "destructive";
		default:
			return "secondary";
	}
}

/** Mirrors TraceTimeline kindColor */
function kindColor(kind: string) {
	switch (kind) {
		case "query":
			return "bg-blue-500";
		case "mutation":
			return "bg-amber-500";
		case "action":
			return "bg-purple-500";
		default:
			return "bg-gray-400";
	}
}

/** Mirrors traces/page.tsx formatDuration */
function formatDuration(ms: number | undefined) {
	if (ms === undefined) return "-";
	if (ms < 1) return "<1ms";
	if (ms < 1000) return `${Math.round(ms)}ms`;
	return `${(ms / 1000).toFixed(2)}s`;
}

// ============================================================================
// Tests
// ============================================================================

describe("TraceDAG buildTree", () => {
	it("builds a flat list when no parent links exist", () => {
		const spans: Span[] = [
			{
				_id: "1",
				spanId: "aaa",
				functionName: "fn1",
				kind: "query",
				status: "completed",
				startedAt: 100,
			},
			{
				_id: "2",
				spanId: "bbb",
				functionName: "fn2",
				kind: "mutation",
				status: "completed",
				startedAt: 200,
			},
		];

		const roots = buildTree(spans);
		expect(roots).toHaveLength(2);
		expect(roots[0].children).toHaveLength(0);
		expect(roots[1].children).toHaveLength(0);
	});

	it("builds a single-level parent→child tree", () => {
		const spans: Span[] = [
			{
				_id: "1",
				spanId: "root",
				functionName: "rootFn",
				kind: "mutation",
				status: "completed",
				startedAt: 100,
			},
			{
				_id: "2",
				spanId: "child1",
				parentSpanId: "root",
				functionName: "childFn1",
				kind: "query",
				status: "completed",
				startedAt: 110,
			},
			{
				_id: "3",
				spanId: "child2",
				parentSpanId: "root",
				functionName: "childFn2",
				kind: "action",
				status: "completed",
				startedAt: 120,
			},
		];

		const roots = buildTree(spans);
		expect(roots).toHaveLength(1);
		expect(roots[0].spanId).toBe("root");
		expect(roots[0].children).toHaveLength(2);
		expect(roots[0].children[0].spanId).toBe("child1");
		expect(roots[0].children[1].spanId).toBe("child2");
	});

	it("builds a multi-level nested tree", () => {
		const spans: Span[] = [
			{
				_id: "1",
				spanId: "root",
				functionName: "rootFn",
				kind: "mutation",
				status: "completed",
				startedAt: 100,
			},
			{
				_id: "2",
				spanId: "child",
				parentSpanId: "root",
				functionName: "childFn",
				kind: "query",
				status: "completed",
				startedAt: 110,
			},
			{
				_id: "3",
				spanId: "grandchild",
				parentSpanId: "child",
				functionName: "grandchildFn",
				kind: "query",
				status: "completed",
				startedAt: 120,
			},
		];

		const roots = buildTree(spans);
		expect(roots).toHaveLength(1);
		expect(roots[0].children).toHaveLength(1);
		expect(roots[0].children[0].children).toHaveLength(1);
		expect(roots[0].children[0].children[0].spanId).toBe("grandchild");
	});

	it("orphan spans become roots when parent not in set", () => {
		const spans: Span[] = [
			{
				_id: "1",
				spanId: "orphan",
				parentSpanId: "nonexistent",
				functionName: "orphanFn",
				kind: "query",
				status: "completed",
				startedAt: 100,
			},
		];

		const roots = buildTree(spans);
		expect(roots).toHaveLength(1);
		expect(roots[0].spanId).toBe("orphan");
	});

	it("handles empty spans list", () => {
		const roots = buildTree([]);
		expect(roots).toHaveLength(0);
	});
});

describe("TraceTimeline calculations", () => {
	it("calculates correct time bounds", () => {
		const spans: Span[] = [
			{
				_id: "1",
				spanId: "a",
				functionName: "fn",
				kind: "query",
				status: "completed",
				startedAt: 1000,
				endedAt: 1200,
			},
			{
				_id: "2",
				spanId: "b",
				functionName: "fn2",
				kind: "mutation",
				status: "completed",
				startedAt: 1100,
				endedAt: 1500,
			},
		];

		const { minStart, maxEnd, totalDuration } = calculateTimeBounds(spans);
		expect(minStart).toBe(1000);
		expect(maxEnd).toBe(1500);
		expect(totalDuration).toBe(500);
	});

	it("uses startedAt as fallback when endedAt is missing", () => {
		const spans: Span[] = [
			{
				_id: "1",
				spanId: "a",
				functionName: "fn",
				kind: "query",
				status: "started",
				startedAt: 1000,
			},
		];

		const { minStart, maxEnd, totalDuration } = calculateTimeBounds(spans);
		expect(minStart).toBe(1000);
		expect(maxEnd).toBe(1000);
		expect(totalDuration).toBe(1); // avoids division by zero
	});

	it("calculates correct bar position for a span", () => {
		const span: Span = {
			_id: "1",
			spanId: "a",
			functionName: "fn",
			kind: "query",
			status: "completed",
			startedAt: 1100,
			endedAt: 1300,
		};

		// Total range: 1000-1500 = 500ms
		const { startOffset, widthPercent } = calculateBarPosition(span, 1000, 500);
		expect(startOffset).toBe(20); // (1100-1000)/500 * 100 = 20%
		expect(widthPercent).toBe(40); // (1300-1100)/500 * 100 = 40%
	});

	it("enforces minimum bar width of 0.5%", () => {
		const span: Span = {
			_id: "1",
			spanId: "a",
			functionName: "fn",
			kind: "query",
			status: "completed",
			startedAt: 1000,
			endedAt: 1000, // zero duration
		};

		const { widthPercent } = calculateBarPosition(span, 1000, 500);
		expect(widthPercent).toBe(0.5);
	});

	it("handles span with no endedAt", () => {
		const span: Span = {
			_id: "1",
			spanId: "a",
			functionName: "fn",
			kind: "query",
			status: "started",
			startedAt: 1200,
		};

		const { startOffset, widthPercent } = calculateBarPosition(span, 1000, 500);
		expect(startOffset).toBe(40); // (1200-1000)/500 * 100
		expect(widthPercent).toBe(0.5); // zero duration → min width
	});
});

describe("Status and kind color helpers", () => {
	it("statusColor maps correctly", () => {
		expect(statusColor("completed")).toBe("default");
		expect(statusColor("error")).toBe("destructive");
		expect(statusColor("started")).toBe("secondary");
		expect(statusColor("unknown")).toBe("secondary");
	});

	it("kindColor maps correctly", () => {
		expect(kindColor("query")).toBe("bg-blue-500");
		expect(kindColor("mutation")).toBe("bg-amber-500");
		expect(kindColor("action")).toBe("bg-purple-500");
		expect(kindColor("internal")).toBe("bg-gray-400");
		expect(kindColor("unknown")).toBe("bg-gray-400");
	});
});

describe("formatDuration", () => {
	it("returns '-' for undefined", () => {
		expect(formatDuration(undefined)).toBe("-");
	});

	it("formats sub-millisecond durations", () => {
		expect(formatDuration(0.5)).toBe("<1ms");
		expect(formatDuration(0)).toBe("<1ms");
	});

	it("formats millisecond durations", () => {
		expect(formatDuration(1)).toBe("1ms");
		expect(formatDuration(42)).toBe("42ms");
		expect(formatDuration(999)).toBe("999ms");
	});

	it("formats second durations", () => {
		expect(formatDuration(1000)).toBe("1.00s");
		expect(formatDuration(1500)).toBe("1.50s");
		expect(formatDuration(12345)).toBe("12.35s");
	});
});
