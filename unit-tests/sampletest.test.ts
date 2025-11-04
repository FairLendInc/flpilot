import { describe, expect, it } from "vitest";
import { add, delayedEcho, makeCounter } from "../lib/testWorker";

describe("add", () => {
	it("should add two numbers", () => {
		expect(add(1, 2)).toBe(3);
	});

	it("should handle negative numbers", () => {
		expect(add(-1, 2)).toBe(1);
	});

	it("should add zero", () => {
		expect(add(0, 5)).toBe(5);
	});
});

describe("delayedEcho", () => {
	it("should resolve with the provided value after delay", async () => {
		const result = await delayedEcho("test");
		expect(result).toBe("test");
	});

	it("should work with different types", async () => {
		const result = await delayedEcho(42);
		expect(result).toBe(42);
	});

	it("should use default delay", async () => {
		const start = Date.now();
		await delayedEcho(null);
		const end = Date.now();
		expect(end - start).toBeGreaterThanOrEqual(20);
	});
});

describe("makeCounter", () => {
	it("should initialize with default value", () => {
		const c = makeCounter();
		expect(c.get()).toBe(0);
	});

	it("should initialize with initial value", () => {
		const c = makeCounter(5);
		expect(c.get()).toBe(5);
	});

	it("should increment by 1", () => {
		const c = makeCounter(5);
		c.increment();
		expect(c.get()).toBe(6);
	});

	it("should increment by specified amount", () => {
		const c = makeCounter(5);
		c.increment(3);
		expect(c.get()).toBe(8);
	});

	it("should decrement by 1", () => {
		const c = makeCounter(5);
		c.decrement();
		expect(c.get()).toBe(4);
	});

	it("should decrement by specified amount", () => {
		const c = makeCounter(5);
		c.decrement(2);
		expect(c.get()).toBe(3);
	});

	it("should reset to initial value", () => {
		const c = makeCounter(5);
		c.increment();
		c.reset();
		expect(c.get()).toBe(5);
	});

	it("should reset to specified value", () => {
		const c = makeCounter(5);
		c.reset(10);
		expect(c.get()).toBe(10);
	});
});
