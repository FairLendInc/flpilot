import { describe, expect, it } from "vitest";
import { formatPercent, formatUsdAbbrev, formatUsdFull } from "@/lib/format";

describe("formatUsdAbbrev", () => {
	it("formats thousands with k", () => {
		expect(formatUsdAbbrev(35000000)).toBe("$350k"); // $350,000
	});
	it("formats millions with M", () => {
		expect(formatUsdAbbrev(1_250_000_00)).toBe("$1.3M");
	});
	it("handles small amounts without decimals", () => {
		expect(formatUsdAbbrev(95000)).toBe("$950");
	});
});

describe("formatUsdFull", () => {
	it("formats full USD", () => {
		expect(formatUsdFull(35000000)).toContain("$350,000");
	});
});

describe("formatPercent", () => {
	it("defaults decimals based on size", () => {
		expect(formatPercent(6.5, { suffix: "%" })).toBe("6.5%");
		expect(formatPercent(68)).toBe("68%");
	});
});
