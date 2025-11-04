import { describe, expect, it } from "vitest";
import logger from "../lib/logger";
import { createPinoAdapter } from "../lib/pinoAdapter";

describe("logger smoke", () => {
	it("createPinoAdapter initializes and methods are callable", () => {
		const adapter = createPinoAdapter();
		expect(adapter).toBeDefined();
		// call methods — these should not throw
		expect(() => adapter.debug("debug-test", { a: 1 })).not.toThrow();
		expect(() => adapter.info("info-test")).not.toThrow();
		expect(() => adapter.warn("warn-test")).not.toThrow();
		expect(() => adapter.error(new Error("boom"))).not.toThrow();
		const child = adapter.child({ requestId: "t1" });
		expect(() => child.info("child-info")).not.toThrow();
	});

	it("default logger is callable and does not throw", () => {
		expect(() => logger.info("logger-info-test")).not.toThrow();
		expect(() => logger.debug("logger-debug-test")).not.toThrow();
		expect(() => logger.error(new Error("err-test"))).not.toThrow();
	});
});
