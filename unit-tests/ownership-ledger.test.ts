import { describe, expect, it } from "vitest";
import {
	fromShareUnits,
	getMortgageShareAsset,
	OWNERSHIP_ACCOUNTS,
	parseOwnershipBalances,
	SHARE_UNIT_SCALE,
	toShareUnits,
} from "@/convex/lib/ownershipLedger";

describe("ownership ledger helpers", () => {
	it("converts percentages to share units using scale", () => {
		expect(toShareUnits(12.5)).toBe(Math.round(12.5 * SHARE_UNIT_SCALE));
		expect(fromShareUnits(2500)).toBe(25);
	});

	it("parses investor inventories from balances", () => {
		const shareAsset = getMortgageShareAsset("mortgage-1");
		const balances = {
			[OWNERSHIP_ACCOUNTS.fairlendInventory]: { [shareAsset]: 7500n },
			"investor:user-1:inventory": { [shareAsset]: 2500n },
			"investor:user-2:inventory": { [shareAsset]: 0n },
			"random:account": { [shareAsset]: 5000n },
		};

		const ownership = parseOwnershipBalances(
			balances as Record<string, Record<string, bigint>>,
			shareAsset
		);

		expect(ownership).toEqual(
			expect.arrayContaining([
				{ ownerId: "fairlend", percentage: 75 },
				{ ownerId: "user-1", percentage: 25 },
			])
		);
		expect(ownership.length).toBe(2);
	});
});
