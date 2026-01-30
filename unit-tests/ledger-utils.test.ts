import { Building2, Database, Globe, Home, User, Wallet } from "lucide-react";
import { describe, expect, it } from "vitest";
import {
	formatBalance,
	getAccountColor,
	getAccountIcon,
	getNamespace,
	groupAccountsByNamespace,
	parseMortgageIdFromAsset,
	parseOwnerId,
	truncateAddress,
} from "@/lib/ledger/utils";

describe("getNamespace", () => {
	it("extracts namespace from colon-separated address", () => {
		expect(getNamespace("fairlend:inventory")).toBe("fairlend");
		expect(getNamespace("investor:abc123:inventory")).toBe("investor");
		expect(getNamespace("mortgage:xyz789:shares")).toBe("mortgage");
	});

	it("returns 'system' for @ prefixed addresses", () => {
		expect(getNamespace("@world")).toBe("system");
		expect(getNamespace("@fees")).toBe("system");
	});

	it("returns 'other' for addresses without colons", () => {
		expect(getNamespace("simpleaddress")).toBe("other");
		expect(getNamespace("")).toBe("other");
	});

	it("handles edge cases", () => {
		expect(getNamespace(":startsWithColon")).toBe("other");
		expect(getNamespace("a:b")).toBe("a");
	});
});

describe("formatBalance", () => {
	it("formats CAD amounts (stored as cents)", () => {
		expect(formatBalance(10000, "CAD")).toBe("$100.00");
		expect(formatBalance(25000000, "CAD")).toBe("$250,000.00");
		expect(formatBalance(0, "CAD")).toBe("$0.00");
	});

	it("formats USD amounts (stored as cents)", () => {
		expect(formatBalance(10000, "USD")).toContain("$100.00");
	});

	it("formats share tokens with correct pluralization", () => {
		expect(formatBalance(1, "Mabc123/SHARE")).toBe("1 share");
		expect(formatBalance(50, "Mxyz789/SHARE")).toBe("50 shares");
		expect(formatBalance(1, "M5B8F2A1C")).toBe("1 share");
		expect(formatBalance(50, "M5B8F2A1C")).toBe("50 shares");
		expect(formatBalance(0, "Mdef456/SHARE")).toBe("0 shares");
	});

	it("formats generic assets with asset suffix", () => {
		expect(formatBalance(100, "POINTS")).toBe("100 POINTS");
		expect(formatBalance(1000, "TOKENS")).toBe("1,000 TOKENS");
	});

	it("handles bigint amounts", () => {
		expect(formatBalance(BigInt(10000), "CAD")).toBe("$100.00");
		expect(formatBalance(BigInt(5), "Mabc/SHARE")).toBe("5 shares");
	});

	it("handles string amounts", () => {
		expect(formatBalance("10000", "CAD")).toBe("$100.00");
		expect(formatBalance("50", "Mabc/SHARE")).toBe("50 shares");
	});
});

describe("getAccountIcon", () => {
	it("returns Building2 for fairlend namespace", () => {
		expect(getAccountIcon("fairlend")).toBe(Building2);
	});

	it("returns User for investor namespace", () => {
		expect(getAccountIcon("investor")).toBe(User);
	});

	it("returns Home for mortgage namespace", () => {
		expect(getAccountIcon("mortgage")).toBe(Home);
	});

	it("returns Wallet for mic namespace", () => {
		expect(getAccountIcon("mic")).toBe(Wallet);
	});

	it("returns Globe for system and world namespaces", () => {
		expect(getAccountIcon("system")).toBe(Globe);
		expect(getAccountIcon("world")).toBe(Globe);
	});

	it("returns Database for unknown namespaces", () => {
		expect(getAccountIcon("unknown")).toBe(Database);
		expect(getAccountIcon("other")).toBe(Database);
	});
});

describe("getAccountColor", () => {
	it("returns blue colors for fairlend", () => {
		expect(getAccountColor("fairlend")).toContain("blue-500");
	});

	it("returns green colors for investor", () => {
		expect(getAccountColor("investor")).toContain("green-500");
	});

	it("returns purple colors for mortgage", () => {
		expect(getAccountColor("mortgage")).toContain("purple-500");
	});

	it("returns amber colors for mic", () => {
		expect(getAccountColor("mic")).toContain("amber-500");
	});

	it("returns gray colors for system namespaces", () => {
		expect(getAccountColor("system")).toContain("gray-500");
		expect(getAccountColor("world")).toContain("gray-500");
	});

	it("returns muted colors for unknown namespaces", () => {
		expect(getAccountColor("unknown")).toContain("muted");
	});
});

describe("parseOwnerId", () => {
	it("returns 'fairlend' for fairlend addresses", () => {
		expect(parseOwnerId("fairlend:inventory")).toBe("fairlend");
		expect(parseOwnerId("fairlend:fees")).toBe("fairlend");
	});

	it("extracts userId from investor addresses", () => {
		expect(parseOwnerId("investor:abc123:inventory")).toBe("abc123");
		expect(parseOwnerId("investor:user_xyz789:inventory")).toBe("user_xyz789");
	});

	it("returns the full address for other patterns", () => {
		expect(parseOwnerId("mortgage:abc:shares")).toBe("mortgage:abc:shares");
		expect(parseOwnerId("@world")).toBe("@world");
	});
});

describe("parseMortgageIdFromAsset", () => {
	it("extracts mortgage ID from share asset names", () => {
		expect(parseMortgageIdFromAsset("M5B8F2A1C")).toBe("5B8F2A1C");
		expect(parseMortgageIdFromAsset("Mabc123/SHARE")).toBe("abc123");
		expect(parseMortgageIdFromAsset("Mxyz789def456/SHARE")).toBe(
			"xyz789def456"
		);
	});

	it("returns null for non-share assets", () => {
		expect(parseMortgageIdFromAsset("CAD")).toBeNull();
		expect(parseMortgageIdFromAsset("USD")).toBeNull();
		expect(parseMortgageIdFromAsset("TOKENS")).toBeNull();
	});

	it("returns null for malformed share assets", () => {
		expect(parseMortgageIdFromAsset("abc123/SHARE")).toBeNull(); // missing M prefix
		expect(parseMortgageIdFromAsset("M!!")).toBeNull(); // invalid chars
	});
});

describe("truncateAddress", () => {
	it("returns full address if within max length", () => {
		expect(truncateAddress("short", 24)).toBe("short");
		expect(truncateAddress("exactly24characters!!!", 24)).toBe(
			"exactly24characters!!!"
		);
	});

	it("truncates long addresses with ellipsis", () => {
		const longAddress = "investor:verylonguser123456789:inventory";
		const result = truncateAddress(longAddress, 24);
		expect(result.length).toBeLessThanOrEqual(24);
		expect(result).toContain("...");
	});

	it("uses default maxLength of 24", () => {
		const result = truncateAddress(
			"this-is-a-very-long-address-that-exceeds-default"
		);
		expect(result.length).toBeLessThanOrEqual(24);
	});

	it("preserves start and end of address", () => {
		const result = truncateAddress("start_middle_end_verylong", 20);
		expect(result.startsWith("start")).toBe(true);
		expect(result.endsWith("long")).toBe(true);
	});
});

describe("groupAccountsByNamespace", () => {
	const testAccounts = [
		{ address: "fairlend:inventory" },
		{ address: "fairlend:fees" },
		{ address: "investor:user1:inventory" },
		{ address: "investor:user2:inventory" },
		{ address: "mortgage:abc:shares" },
		{ address: "@world" },
	];

	it("groups accounts by their namespace", () => {
		const grouped = groupAccountsByNamespace(testAccounts);

		expect(Object.keys(grouped).sort()).toEqual([
			"fairlend",
			"investor",
			"mortgage",
			"system",
		]);
	});

	it("correctly assigns accounts to namespaces", () => {
		const grouped = groupAccountsByNamespace(testAccounts);

		expect(grouped.fairlend).toHaveLength(2);
		expect(grouped.investor).toHaveLength(2);
		expect(grouped.mortgage).toHaveLength(1);
		expect(grouped.system).toHaveLength(1);
	});

	it("handles empty array", () => {
		const grouped = groupAccountsByNamespace([]);
		expect(Object.keys(grouped)).toHaveLength(0);
	});

	it("preserves account data in groups", () => {
		const accounts = [{ address: "investor:user1:inventory", extra: "data" }];
		const grouped = groupAccountsByNamespace(accounts);

		expect(grouped.investor[0]).toHaveProperty("extra", "data");
	});
});
