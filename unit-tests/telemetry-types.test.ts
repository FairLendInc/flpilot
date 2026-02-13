/**
 * 7.1 Unit test trace context generation and parent/child linkage.
 */
import { describe, expect, it } from "vitest";
import {
	createChildEnvelope,
	createRootEnvelope,
	generatePayloadRef,
	generateRequestId,
	generateSpanId,
	generateTraceId,
} from "../convex/lib/telemetry/types";

describe("ID generation", () => {
	it("generateTraceId returns 32 hex chars", () => {
		const id = generateTraceId();
		expect(id).toMatch(/^[0-9a-f]{32}$/);
	});

	it("generateSpanId returns 16 hex chars", () => {
		const id = generateSpanId();
		expect(id).toMatch(/^[0-9a-f]{16}$/);
	});

	it("generatePayloadRef returns pld_ prefixed string", () => {
		const ref = generatePayloadRef();
		expect(ref).toMatch(/^pld_[0-9a-f]{24}$/);
	});

	it("generateRequestId returns req_ prefixed string", () => {
		const id = generateRequestId();
		expect(id).toMatch(/^req_[0-9a-f]{16}$/);
	});

	it("generates unique IDs on each call", () => {
		const ids = new Set(Array.from({ length: 100 }, () => generateTraceId()));
		expect(ids.size).toBe(100);
	});

	it("generates unique span IDs on each call", () => {
		const ids = new Set(Array.from({ length: 100 }, () => generateSpanId()));
		expect(ids.size).toBe(100);
	});
});

describe("createRootEnvelope", () => {
	it("creates envelope with traceId, spanId, requestId", () => {
		const env = createRootEnvelope(true);
		expect(env.traceId).toMatch(/^[0-9a-f]{32}$/);
		expect(env.spanId).toMatch(/^[0-9a-f]{16}$/);
		expect(env.requestId).toMatch(/^req_/);
		expect(env.sampled).toBe(true);
		expect(env.parentSpanId).toBeUndefined();
	});

	it("respects sampled flag", () => {
		const env = createRootEnvelope(false);
		expect(env.sampled).toBe(false);
	});

	it("passes debugMode through", () => {
		const env = createRootEnvelope(true, true);
		expect(env.debugMode).toBe(true);
	});
});

describe("createChildEnvelope (parent/child linkage)", () => {
	it("preserves traceId from parent", () => {
		const parent = createRootEnvelope(true);
		const child = createChildEnvelope(parent);
		expect(child.traceId).toBe(parent.traceId);
	});

	it("sets parentSpanId to parent spanId", () => {
		const parent = createRootEnvelope(true);
		const child = createChildEnvelope(parent);
		expect(child.parentSpanId).toBe(parent.spanId);
	});

	it("creates a new spanId different from parent", () => {
		const parent = createRootEnvelope(true);
		const child = createChildEnvelope(parent);
		expect(child.spanId).not.toBe(parent.spanId);
		expect(child.spanId).toMatch(/^[0-9a-f]{16}$/);
	});

	it("preserves requestId from parent", () => {
		const parent = createRootEnvelope(true);
		const child = createChildEnvelope(parent);
		expect(child.requestId).toBe(parent.requestId);
	});

	it("preserves sampled flag from parent", () => {
		const parent = createRootEnvelope(false);
		const child = createChildEnvelope(parent);
		expect(child.sampled).toBe(false);
	});

	it("preserves debugMode from parent", () => {
		const parent = createRootEnvelope(true, true);
		const child = createChildEnvelope(parent);
		expect(child.debugMode).toBe(true);
	});

	it("supports multi-level parent/child chains", () => {
		const root = createRootEnvelope(true);
		const child1 = createChildEnvelope(root);
		const child2 = createChildEnvelope(child1);

		// All share the same traceId
		expect(child1.traceId).toBe(root.traceId);
		expect(child2.traceId).toBe(root.traceId);

		// Chain: root -> child1 -> child2
		expect(child1.parentSpanId).toBe(root.spanId);
		expect(child2.parentSpanId).toBe(child1.spanId);

		// All spanIds are unique
		const spanIds = new Set([root.spanId, child1.spanId, child2.spanId]);
		expect(spanIds.size).toBe(3);
	});
});
