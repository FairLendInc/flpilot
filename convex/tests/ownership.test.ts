// @vitest-environment node
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import type { Id } from "../_generated/dataModel";

// @ts-ignore
const modules = import.meta.glob("../**/*.{ts,js,tsx,jsx}", { eager: false });
const createTest = () => convexTest(schema, modules);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a test mortgage with default values
 */
async function createTestMortgage(t: ReturnType<typeof createTest>) {
	// First create a borrower
	const borrowerId = await t.run(async (ctx) => {
		return await ctx.db.insert("borrowers", {
			name: "Test Borrower",
			email: `test_${Date.now()}@example.com`, // Unique email for each test
			rotessaCustomerId: `rotessa_${Date.now()}`,
		});
	});

	// Create mortgage
	const mortgageId = await t.mutation(api.mortgages.createMortgage, {
		borrowerId,
		loanAmount: 500000,
		interestRate: 5.5,
		originationDate: "2024-01-01",
		maturityDate: "2025-01-01",
		mortgageType: "1st" as const,
		address: {
			street: "123 Test St",
			city: "Test City",
			state: "CA",
			zip: "12345",
			country: "USA",
		},
		location: {
			lat: 37.7749,
			lng: -122.4194,
		},
		propertyType: "Single Family",
		appraisalMarketValue: 600000,
		appraisalMethod: "Comparative Market Analysis",
		appraisalCompany: "Test Appraisal Co",
		appraisalDate: "2023-12-01",
		ltv: 83.33,
		images: [],
		documents: [],
	});

	return { mortgageId, borrowerId };
}

/**
 * Create a test user
 */
async function createTestUser(
	t: ReturnType<typeof createTest>,
	userIdentifier: string
) {
	return await t.run(async (ctx) => {
		return await ctx.db.insert("users", {
			idp_id: `test_${userIdentifier}`,
			email: `${userIdentifier}@test.example.com`,
			email_verified: true,
			first_name: "Test",
			last_name: userIdentifier,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			metadata: {
				testUser: true,
			},
		});
	});
}

/**
 * Verify total ownership equals expected percentage
 */
async function verifyTotalOwnership(
	t: ReturnType<typeof createTest>,
	mortgageId: Id<"mortgages">,
	expectedTotal = 100
) {
	const result = await t.query(api.ownership.getTotalOwnership, {
		mortgageId,
	});

	expect(result.totalPercentage).toBeCloseTo(expectedTotal, 2);
	expect(result.isValid).toBe(Math.abs(result.totalPercentage - 100) < 0.01);

	return result;
}

/**
 * Get FairLend's ownership for a mortgage
 */
async function getFairlendOwnership(
	t: ReturnType<typeof createTest>,
	mortgageId: Id<"mortgages">
) {
	const ownership = await t.run(async (ctx) => {
		return await ctx.db
			.query("mortgage_ownership")
			.withIndex("by_mortgage_owner", (q) =>
				q.eq("mortgageId", mortgageId).eq("ownerId", "fairlend")
			)
			.first();
	});
	return ownership;
}

// ============================================================================
// Mortgage Creation Tests
// ============================================================================

describe("createMortgage", () => {
	test("should create 100% FairLend ownership automatically", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		// Verify FairLend ownership exists with 100%
		const fairlendOwnership = await getFairlendOwnership(t, mortgageId);
		expect(fairlendOwnership).toBeTruthy();
		expect(fairlendOwnership?.ownershipPercentage).toBe(100);

		// Verify total ownership
		const total = await verifyTotalOwnership(t, mortgageId, 100);
		expect(total.owners).toBe(1);
		expect(total.breakdown).toHaveLength(1);
		expect(total.breakdown[0]).toEqual({
			ownerId: "fairlend",
			percentage: 100,
		});
	});

	test("should validate all mortgage fields", async () => {
		const t = createTest();
		const { borrowerId } = await createTestMortgage(t);

		// Test invalid loan amount
		await expect(
			t.mutation(api.mortgages.createMortgage, {
				borrowerId,
				loanAmount: -1000,
				interestRate: 5.5,
				originationDate: "2024-01-01",
				maturityDate: "2025-01-01",
				mortgageType: "1st" as const,
				address: {
					street: "123 Test St",
					city: "Test City",
					state: "CA",
					zip: "12345",
					country: "USA",
				},
				location: { lat: 37.7749, lng: -122.4194 },
				propertyType: "Single Family",
				appraisalMarketValue: 600000,
				appraisalMethod: "CMA",
				appraisalCompany: "Test Co",
				appraisalDate: "2023-12-01",
				ltv: 83.33,
				images: [],
				documents: [],
			})
		).rejects.toThrow("Loan amount must be greater than 0");
	});

	test("should reject invalid LTV, coordinates, dates", async () => {
		const t = createTest();
		const { borrowerId } = await createTestMortgage(t);

		// Invalid LTV
		await expect(
			t.mutation(api.mortgages.createMortgage, {
				borrowerId,
				loanAmount: 500000,
				interestRate: 5.5,
				originationDate: "2024-01-01",
				maturityDate: "2025-01-01",
				mortgageType: "1st" as const,
				address: {
					street: "123 Test St",
					city: "Test City",
					state: "CA",
					zip: "12345",
					country: "USA",
				},
				location: { lat: 37.7749, lng: -122.4194 },
				propertyType: "Single Family",
				appraisalMarketValue: 600000,
				appraisalMethod: "CMA",
				appraisalCompany: "Test Co",
				appraisalDate: "2023-12-01",
				ltv: 150, // Invalid
				images: [],
				documents: [],
			})
		).rejects.toThrow("LTV must be between 0 and 100");

		// Invalid coordinates
		await expect(
			t.mutation(api.mortgages.createMortgage, {
				borrowerId,
				loanAmount: 500000,
				interestRate: 5.5,
				originationDate: "2024-01-01",
				maturityDate: "2025-01-01",
				mortgageType: "1st" as const,
				address: {
					street: "123 Test St",
					city: "Test City",
					state: "CA",
					zip: "12345",
					country: "USA",
				},
				location: { lat: 200, lng: -122.4194 }, // Invalid
				propertyType: "Single Family",
				appraisalMarketValue: 600000,
				appraisalMethod: "CMA",
				appraisalCompany: "Test Co",
				appraisalDate: "2023-12-01",
				ltv: 83.33,
				images: [],
				documents: [],
			})
		).rejects.toThrow("Latitude must be between -90 and 90");
	});
});

// ============================================================================
// Create Ownership Tests
// ============================================================================

describe("createOwnership", () => {
	test("should create investor ownership and reduce FairLend automatically", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		const user1 = await createTestUser(t, "investor_1");

		// Create 25% ownership for investor
		await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: user1,
			ownershipPercentage: 25,
		});

		// Verify FairLend ownership reduced to 75%
		const fairlendOwnership = await getFairlendOwnership(t, mortgageId);
		expect(fairlendOwnership?.ownershipPercentage).toBe(75);

		// Verify total is still 100%
		const total = await verifyTotalOwnership(t, mortgageId, 100);
		expect(total.owners).toBe(2);
		expect(total.breakdown).toHaveLength(2);
	});

	test("should handle multiple investors", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		const investor1 = await createTestUser(t, "investor_1");
		const investor2 = await createTestUser(t, "investor_2");
		const investor3 = await createTestUser(t, "investor_3");

		// Create ownership for 3 investors
		await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: investor1,
			ownershipPercentage: 20,
		});

		await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: investor2,
			ownershipPercentage: 30,
		});

		await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: investor3,
			ownershipPercentage: 15,
		});

		// Verify FairLend ownership is 35%
		const fairlendOwnership = await getFairlendOwnership(t, mortgageId);
		expect(fairlendOwnership?.ownershipPercentage).toBe(35);

		// Verify total is 100%
		const total = await verifyTotalOwnership(t, mortgageId, 100);
		expect(total.owners).toBe(4); // 3 investors + FairLend
	});

	test("should delete FairLend record when ownership reaches 0%", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		const investor1 = await createTestUser(t, "investor_1");

		// Sell 100% to an investor
		await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: investor1,
			ownershipPercentage: 100,
		});

		// Verify FairLend ownership doesn't exist
		const fairlendOwnership = await getFairlendOwnership(t, mortgageId);
		expect(fairlendOwnership).toBeNull();

		// Verify total is still 100%
		const total = await verifyTotalOwnership(t, mortgageId, 100);
		expect(total.owners).toBe(1); // Only investor_1
	});

	test("should reject ownership > FairLend's available percentage", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		// Sell 90% first, leaving only 10% with FairLend
		await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_0")),
			ownershipPercentage: 90,
		});

		// Now try to create 20% ownership (more than FairLend's 10%)
		await expect(
			t.mutation(api.ownership.createOwnership, {
				mortgageId,
				ownerId: (await createTestUser(t, "investor_1")),
				ownershipPercentage: 20,
			})
		).rejects.toThrow("Insufficient FairLend ownership");
	});

	test("should reject duplicate ownership records", async () => {
		const t = createTest();
		const user1 = await createTestUser(t, "investor_1");
		const { mortgageId } = await createTestMortgage(t);

		// Create ownership for investor_1
		await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: user1,
			ownershipPercentage: 25,
		});

		// Try to create again for same investor
		await expect(
			t.mutation(api.ownership.createOwnership, {
				mortgageId,
				ownerId: user1,
				ownershipPercentage: 10,
			})
		).rejects.toThrow(
			"Ownership record already exists for this mortgage and owner"
		);
	});

	test("should reject manual FairLend ownership creation", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		await expect(
			t.mutation(api.ownership.createOwnership, {
				mortgageId,
				ownerId: "fairlend",
				ownershipPercentage: 50,
			})
		).rejects.toThrow("FairLend ownership is managed automatically");
	});

	test("should reject percentage <= 0", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		await expect(
			t.mutation(api.ownership.createOwnership, {
				mortgageId,
				ownerId: (await createTestUser(t, "investor_1")),
				ownershipPercentage: 0,
			})
		).rejects.toThrow("Ownership percentage must be between 0 and 100");

		await expect(
			t.mutation(api.ownership.createOwnership, {
				mortgageId,
				ownerId: (await createTestUser(t, "investor_1")),
				ownershipPercentage: -10,
			})
		).rejects.toThrow("Ownership percentage must be between 0 and 100");
	});

	test("should reject percentage > 100", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		await expect(
			t.mutation(api.ownership.createOwnership, {
				mortgageId,
				ownerId: (await createTestUser(t, "investor_1")),
				ownershipPercentage: 150,
			})
		).rejects.toThrow("Ownership percentage must be between 0 and 100");
	});

	test("should reject non-existent mortgage", async () => {
		const t = createTest();

		// Create a fake mortgage ID by creating and deleting a mortgage
		const { mortgageId } = await createTestMortgage(t);
		await t.run(async (ctx) => {
			await ctx.db.delete(mortgageId);
		});

		await expect(
			t.mutation(api.ownership.createOwnership, {
				mortgageId,
				ownerId: (await createTestUser(t, "investor_1")),
				ownershipPercentage: 25,
			})
		).rejects.toThrow("Mortgage not found");
	});

	test("should maintain 100% total after creation", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		// Create several ownerships
		await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_1")),
			ownershipPercentage: 33.33,
		});

		await verifyTotalOwnership(t, mortgageId, 100);

		await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_2")),
			ownershipPercentage: 25.5,
		});

		await verifyTotalOwnership(t, mortgageId, 100);
	});

	test("should handle fractional percentages correctly", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		// Create ownership with fractional percentage
		await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_1")),
			ownershipPercentage: 12.345,
		});

		const fairlendOwnership = await getFairlendOwnership(t, mortgageId);
		expect(fairlendOwnership?.ownershipPercentage).toBeCloseTo(87.655, 3);

		await verifyTotalOwnership(t, mortgageId, 100);
	});
});

// ============================================================================
// Update Ownership Tests
// ============================================================================

describe("updateOwnershipPercentage", () => {
	test("should increase ownership and decrease FairLend", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		// Create initial 25% ownership
		const ownershipId = await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_1")),
			ownershipPercentage: 25,
		});

		// Update to 40%
		await t.mutation(api.ownership.updateOwnershipPercentage, {
			id: ownershipId,
			ownershipPercentage: 40,
		});

		// Verify FairLend reduced from 75% to 60%
		const fairlendOwnership = await getFairlendOwnership(t, mortgageId);
		expect(fairlendOwnership?.ownershipPercentage).toBe(60);

		await verifyTotalOwnership(t, mortgageId, 100);
	});

	test("should decrease ownership and increase FairLend", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		// Create initial 50% ownership
		const ownershipId = await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_1")),
			ownershipPercentage: 50,
		});

		// Update to 30%
		await t.mutation(api.ownership.updateOwnershipPercentage, {
			id: ownershipId,
			ownershipPercentage: 30,
		});

		// Verify FairLend increased from 50% to 70%
		const fairlendOwnership = await getFairlendOwnership(t, mortgageId);
		expect(fairlendOwnership?.ownershipPercentage).toBe(70);

		await verifyTotalOwnership(t, mortgageId, 100);
	});

	test("should update FairLend ownership directly when specified", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		// Get FairLend ownership ID
		const fairlendOwnership = await getFairlendOwnership(t, mortgageId);
		expect(fairlendOwnership).toBeTruthy();

		// Update FairLend to 80%
		await t.mutation(api.ownership.updateOwnershipPercentage, {
			id: fairlendOwnership!._id,
			ownershipPercentage: 80,
		});

		// Verify it updated
		const updated = await getFairlendOwnership(t, mortgageId);
		expect(updated?.ownershipPercentage).toBe(80);
	});

	test("should create FairLend record if doesn't exist", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		// Sell 100% to investor
		const ownershipId = await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_1")),
			ownershipPercentage: 100,
		});

		// Verify FairLend doesn't exist
		let fairlendOwnership = await getFairlendOwnership(t, mortgageId);
		expect(fairlendOwnership).toBeNull();

		// Update investor to 80% (should create FairLend with 20%)
		await t.mutation(api.ownership.updateOwnershipPercentage, {
			id: ownershipId,
			ownershipPercentage: 80,
		});

		// Verify FairLend now exists with 20%
		fairlendOwnership = await getFairlendOwnership(t, mortgageId);
		expect(fairlendOwnership).toBeTruthy();
		expect(fairlendOwnership?.ownershipPercentage).toBe(20);

		await verifyTotalOwnership(t, mortgageId, 100);
	});

	test("should delete FairLend record if becomes 0%", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		// Create 90% ownership for investor
		const ownershipId = await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_1")),
			ownershipPercentage: 90,
		});

		// Update to 100% (FairLend should be deleted)
		await t.mutation(api.ownership.updateOwnershipPercentage, {
			id: ownershipId,
			ownershipPercentage: 100,
		});

		// Verify FairLend doesn't exist
		const fairlendOwnership = await getFairlendOwnership(t, mortgageId);
		expect(fairlendOwnership).toBeNull();

		await verifyTotalOwnership(t, mortgageId, 100);
	});

	test("should reject update requiring negative FairLend ownership", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		// Create 60% ownership for investor_1 and 30% for investor_2
		// This leaves FairLend with only 10%
		const ownershipId1 = await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_1")),
			ownershipPercentage: 60,
		});

		await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_2")),
			ownershipPercentage: 30,
		});

		// Try to update investor_1 to 95% (would require FairLend to be -25%)
		await expect(
			t.mutation(api.ownership.updateOwnershipPercentage, {
				id: ownershipId1,
				ownershipPercentage: 95,
			})
		).rejects.toThrow("would require FairLend to have");
	});

	test("should reject update requiring FairLend > 100%", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		// Create 50% ownership for investor
		const ownershipId = await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_1")),
			ownershipPercentage: 50,
		});

		// Try to update to -60% (would require FairLend to be 160%)
		await expect(
			t.mutation(api.ownership.updateOwnershipPercentage, {
				id: ownershipId,
				ownershipPercentage: -60,
			})
		).rejects.toThrow();
	});

	test("should reject percentage < 0", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		const ownershipId = await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_1")),
			ownershipPercentage: 50,
		});

		await expect(
			t.mutation(api.ownership.updateOwnershipPercentage, {
				id: ownershipId,
				ownershipPercentage: -5,
			})
		).rejects.toThrow("Ownership percentage must be between 0 and 100");
	});

	test("should reject percentage > 100", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		const ownershipId = await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_1")),
			ownershipPercentage: 50,
		});

		await expect(
			t.mutation(api.ownership.updateOwnershipPercentage, {
				id: ownershipId,
				ownershipPercentage: 101,
			})
		).rejects.toThrow();
	});

	test("should reject non-existent ownership record", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		// Create and delete an ownership record to get a valid but deleted ID
		const ownershipId = await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_1")),
			ownershipPercentage: 25,
		});
		await t.mutation(api.ownership.deleteOwnership, { id: ownershipId });

		await expect(
			t.mutation(api.ownership.updateOwnershipPercentage, {
				id: ownershipId,
				ownershipPercentage: 50,
			})
		).rejects.toThrow("Ownership record not found");
	});

	test("should maintain 100% total after update", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		const ownershipId = await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_1")),
			ownershipPercentage: 25,
		});

		// Multiple updates
		await t.mutation(api.ownership.updateOwnershipPercentage, {
			id: ownershipId,
			ownershipPercentage: 40,
		});
		await verifyTotalOwnership(t, mortgageId, 100);

		await t.mutation(api.ownership.updateOwnershipPercentage, {
			id: ownershipId,
			ownershipPercentage: 15,
		});
		await verifyTotalOwnership(t, mortgageId, 100);

		await t.mutation(api.ownership.updateOwnershipPercentage, {
			id: ownershipId,
			ownershipPercentage: 99.5,
		});
		await verifyTotalOwnership(t, mortgageId, 100);
	});

	test("should handle multiple sequential updates", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		const id1 = await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_1")),
			ownershipPercentage: 30,
		});

		const id2 = await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_2")),
			ownershipPercentage: 20,
		});

		// Update both
		await t.mutation(api.ownership.updateOwnershipPercentage, {
			id: id1,
			ownershipPercentage: 35,
		});
		await verifyTotalOwnership(t, mortgageId, 100);

		await t.mutation(api.ownership.updateOwnershipPercentage, {
			id: id2,
			ownershipPercentage: 25,
		});
		await verifyTotalOwnership(t, mortgageId, 100);

		// Verify final state
		const fairlendOwnership = await getFairlendOwnership(t, mortgageId);
		expect(fairlendOwnership?.ownershipPercentage).toBe(40); // 100 - 35 - 25
	});
});

// ============================================================================
// Delete Ownership Tests
// ============================================================================

describe("deleteOwnership", () => {
	test("should transfer ownership back to FairLend", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		// Create 30% ownership
		const ownershipId = await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_1")),
			ownershipPercentage: 30,
		});

		// Delete it
		await t.mutation(api.ownership.deleteOwnership, { id: ownershipId });

		// Verify FairLend back to 100%
		const fairlendOwnership = await getFairlendOwnership(t, mortgageId);
		expect(fairlendOwnership?.ownershipPercentage).toBe(100);

		await verifyTotalOwnership(t, mortgageId, 100);
	});

	test("should add to existing FairLend ownership", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		// Create two investors
		const id1 = await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_1")),
			ownershipPercentage: 30,
		});

		await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_2")),
			ownershipPercentage: 20,
		});

		// FairLend should have 50%
		let fairlendOwnership = await getFairlendOwnership(t, mortgageId);
		expect(fairlendOwnership?.ownershipPercentage).toBe(50);

		// Delete investor_1
		await t.mutation(api.ownership.deleteOwnership, { id: id1 });

		// FairLend should now have 80%
		fairlendOwnership = await getFairlendOwnership(t, mortgageId);
		expect(fairlendOwnership?.ownershipPercentage).toBe(80);

		await verifyTotalOwnership(t, mortgageId, 100);
	});

	test("should create FairLend record if doesn't exist", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		// Sell 100% to two investors
		const id1 = await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_1")),
			ownershipPercentage: 60,
		});

		await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_2")),
			ownershipPercentage: 40,
		});

		// Verify FairLend doesn't exist
		let fairlendOwnership = await getFairlendOwnership(t, mortgageId);
		expect(fairlendOwnership).toBeNull();

		// Delete investor_1
		await t.mutation(api.ownership.deleteOwnership, { id: id1 });

		// Verify FairLend now exists with 60%
		fairlendOwnership = await getFairlendOwnership(t, mortgageId);
		expect(fairlendOwnership).toBeTruthy();
		expect(fairlendOwnership?.ownershipPercentage).toBe(60);

		await verifyTotalOwnership(t, mortgageId, 100);
	});

	test("should reject deletion of FairLend ownership", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		const fairlendOwnership = await getFairlendOwnership(t, mortgageId);
		expect(fairlendOwnership).toBeTruthy();

		await expect(
			t.mutation(api.ownership.deleteOwnership, {
				id: fairlendOwnership!._id,
			})
		).rejects.toThrow("Cannot delete FairLend ownership record");
	});

	test("should reject non-existent ownership record", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		// Create and delete an ownership record to get a valid but deleted ID
		const ownershipId = await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_1")),
			ownershipPercentage: 25,
		});
		await t.mutation(api.ownership.deleteOwnership, { id: ownershipId });

		await expect(
			t.mutation(api.ownership.deleteOwnership, { id: ownershipId })
		).rejects.toThrow("Ownership record not found");
	});

	test("should maintain 100% total after deletion", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		const id1 = await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_1")),
			ownershipPercentage: 25,
		});

		const id2 = await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_2")),
			ownershipPercentage: 35,
		});

		await t.mutation(api.ownership.deleteOwnership, { id: id1 });
		await verifyTotalOwnership(t, mortgageId, 100);

		await t.mutation(api.ownership.deleteOwnership, { id: id2 });
		await verifyTotalOwnership(t, mortgageId, 100);
	});

	test("should handle deleting all investors (FairLend returns to 100%)", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		// Create 3 investors totaling 100%
		const id1 = await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_1")),
			ownershipPercentage: 40,
		});

		const id2 = await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_2")),
			ownershipPercentage: 35,
		});

		const id3 = await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_3")),
			ownershipPercentage: 25,
		});

		// Verify FairLend doesn't exist
		let fairlendOwnership = await getFairlendOwnership(t, mortgageId);
		expect(fairlendOwnership).toBeNull();

		// Delete all investors
		await t.mutation(api.ownership.deleteOwnership, { id: id1 });
		await t.mutation(api.ownership.deleteOwnership, { id: id2 });
		await t.mutation(api.ownership.deleteOwnership, { id: id3 });

		// Verify FairLend back to 100%
		fairlendOwnership = await getFairlendOwnership(t, mortgageId);
		expect(fairlendOwnership?.ownershipPercentage).toBe(100);

		await verifyTotalOwnership(t, mortgageId, 100);
	});
});

// ============================================================================
// Transfer Ownership Tests
// ============================================================================

describe("transferOwnership", () => {
	test("should transfer ownership to new owner", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		// Create ownership for investor_1
		const ownershipId = await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_1")),
			ownershipPercentage: 30,
		});

		// Transfer to investor_2
		const user2 = await createTestUser(t, "investor_2");
		await t.mutation(api.ownership.transferOwnership, {
			id: ownershipId,
			newOwnerId: user2,
		});

		// Verify ownership changed
		const ownership = await t.run(async (ctx) => {
			return await ctx.db.get(ownershipId);
		});

		expect(ownership?.ownerId).toBe(user2);
		expect(ownership?.ownershipPercentage).toBe(30);
	});

	test("should maintain percentage during transfer", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		const ownershipId = await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_1")),
			ownershipPercentage: 45.67,
		});

		await t.mutation(api.ownership.transferOwnership, {
			id: ownershipId,
			newOwnerId: (await createTestUser(t, "investor_2")),
		});

		const ownership = await t.run(async (ctx) => {
			return await ctx.db.get(ownershipId);
		});

		expect(ownership?.ownershipPercentage).toBe(45.67);
		await verifyTotalOwnership(t, mortgageId, 100);
	});

	test("should validate new owner ID", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		const ownershipId = await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_1")),
			ownershipPercentage: 30,
		});

		// Transfer to fairlend (should work)
		await t.mutation(api.ownership.transferOwnership, {
			id: ownershipId,
			newOwnerId: "fairlend",
		});

		const ownership = await t.run(async (ctx) => {
			return await ctx.db.get(ownershipId);
		});

		expect(ownership?.ownerId).toBe("fairlend");
	});

	test("should reject non-existent ownership record", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		// Create and delete an ownership record to get a valid but deleted ID
		const ownershipId = await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_1")),
			ownershipPercentage: 25,
		});
		await t.mutation(api.ownership.deleteOwnership, { id: ownershipId });

		await expect(
			t.mutation(api.ownership.transferOwnership, {
				id: ownershipId,
				newOwnerId: (await createTestUser(t, "investor_2")),
			})
		).rejects.toThrow("Ownership record not found");
	});
});

// ============================================================================
// Query Tests
// ============================================================================

describe("getTotalOwnership", () => {
	test("should return 100% for new mortgage", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		const result = await t.query(api.ownership.getTotalOwnership, {
			mortgageId,
		});

		expect(result.totalPercentage).toBe(100);
		expect(result.isValid).toBe(true);
		expect(result.owners).toBe(1);
		expect(result.breakdown).toEqual([
			{ ownerId: "fairlend", percentage: 100 },
		]);
	});

	test("should return correct breakdown for multiple owners", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);
		const user1 = await createTestUser(t, "investor_1");
		const user2 = await createTestUser(t, "investor_2");

		await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: user1,
			ownershipPercentage: 30,
		});

		await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: user2,
			ownershipPercentage: 25,
		});

		const result = await t.query(api.ownership.getTotalOwnership, {
			mortgageId,
		});

		expect(result.totalPercentage).toBe(100);
		expect(result.isValid).toBe(true);
		expect(result.owners).toBe(3);
		expect(result.breakdown).toHaveLength(3);

		// Check all owners are present
		const ownerIds = result.breakdown.map((b) => b.ownerId);
		expect(ownerIds).toContain("fairlend");
		expect(ownerIds).toContain(user1);
		expect(ownerIds).toContain(user2);
	});

	test("should validate isValid flag correctly", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_1")),
			ownershipPercentage: 50,
		});

		const result = await t.query(api.ownership.getTotalOwnership, {
			mortgageId,
		});

		expect(result.totalPercentage).toBe(100);
		expect(result.isValid).toBe(true);
	});

	test("should handle floating point precision", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_1")),
			ownershipPercentage: 33.33,
		});

		await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_2")),
			ownershipPercentage: 33.33,
		});

		const result = await t.query(api.ownership.getTotalOwnership, {
			mortgageId,
		});

		// Should be close to 100 (99.99 due to rounding)
		expect(result.totalPercentage).toBeCloseTo(100, 1);
		expect(result.isValid).toBe(true); // Within 0.01% tolerance
	});
});

describe("getMortgageOwnership", () => {
	test("should return all owners sorted by percentage desc", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_1")),
			ownershipPercentage: 20,
		});

		await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_2")),
			ownershipPercentage: 30,
		});

		const result = await t.query(api.ownership.getMortgageOwnership, {
			mortgageId,
		});

		expect(result).toHaveLength(3);
		// Should be sorted by percentage descending
		expect(result[0].ownershipPercentage).toBeGreaterThanOrEqual(
			result[1].ownershipPercentage
		);
		expect(result[1].ownershipPercentage).toBeGreaterThanOrEqual(
			result[2].ownershipPercentage
		);
	});

	test("should return empty array for non-existent mortgage", async () => {
		const t = createTest();

		// Create and delete a mortgage to get a valid but deleted ID
		const { mortgageId } = await createTestMortgage(t);
		// Delete the mortgage and its ownership
		const ownership = await getFairlendOwnership(t, mortgageId);
		if (ownership) {
			await t.run(async (ctx) => {
				await ctx.db.delete(ownership._id);
			});
		}
		await t.run(async (ctx) => {
			await ctx.db.delete(mortgageId);
		});

		const result = await t.query(api.ownership.getMortgageOwnership, {
			mortgageId,
		});

		expect(result).toEqual([]);
	});
});

describe("getUserPortfolio", () => {
	test("should return all mortgages for an investor", async () => {
		const t = createTest();

		// Create two mortgages
		const { mortgageId: m1 } = await createTestMortgage(t);
		const { mortgageId: m2 } = await createTestMortgage(t);
		const user1 = await createTestUser(t, "investor_1");

		// Investor owns parts of both
		await t.mutation(api.ownership.createOwnership, {
			mortgageId: m1,
			ownerId: user1,
			ownershipPercentage: 30,
		});

		await t.mutation(api.ownership.createOwnership, {
			mortgageId: m2,
			ownerId: user1,
			ownershipPercentage: 40,
		});

		const result = await t.query(api.ownership.getUserPortfolio, {
			userId: user1,
		});

		expect(result).toHaveLength(2);
		const mortgageIds = result.map((r) => r.mortgageId);
		expect(mortgageIds).toContain(m1);
		expect(mortgageIds).toContain(m2);
	});

	test("should return empty array for investor with no ownership", async () => {
		const t = createTest();
		await createTestMortgage(t);

		const result = await t.query(api.ownership.getUserPortfolio, {
			userId: (await createTestUser(t, "investor_999")),
		});

		expect(result).toEqual([]);
	});
});

describe("checkOwnership", () => {
	test("should return ownership record when exists", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);
		const user1 = await createTestUser(t, "investor_1");

		await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: user1,
			ownershipPercentage: 30,
		});

		const result = await t.query(api.ownership.checkOwnership, {
			mortgageId,
			ownerId: user1,
		});

		expect(result).toBeTruthy();
		expect(result?.ownerId).toBe(user1);
		expect(result?.ownershipPercentage).toBe(30);
	});

	test("should return null when doesn't exist", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		const result = await t.query(api.ownership.checkOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_999")),
		});

		expect(result).toBeNull();
	});
});

describe("getInstitutionalPortfolio", () => {
	test("should return all FairLend ownership records", async () => {
		const t = createTest();

		// Create 3 mortgages
		const { mortgageId: m1 } = await createTestMortgage(t);
		const { mortgageId: m2 } = await createTestMortgage(t);
		const { mortgageId: m3 } = await createTestMortgage(t);

		// Sell part of m1 and m2, keep m3 100% FairLend
		await t.mutation(api.ownership.createOwnership, {
			mortgageId: m1,
			ownerId: (await createTestUser(t, "investor_1")),
			ownershipPercentage: 50,
		});

		await t.mutation(api.ownership.createOwnership, {
			mortgageId: m2,
			ownerId: (await createTestUser(t, "investor_1")),
			ownershipPercentage: 100,
		});

		const result = await t.query(api.ownership.getInstitutionalPortfolio, {});

		// Should have FairLend ownership for m1 (50%) and m3 (100%)
		// m2 has no FairLend ownership (100% sold)
		expect(result.length).toBeGreaterThanOrEqual(2);

		const mortgageIds = result.map((r) => r.mortgageId);
		expect(mortgageIds).toContain(m1);
		expect(mortgageIds).toContain(m3);
	});
});

// ============================================================================
// Complex Integration Tests
// ============================================================================

describe("ownership invariant integration", () => {
	test("should maintain 100% through complex multi-investor scenario", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		// Scenario: Multiple investors buy, sell, and transfer ownership

		// 1. Investor 1 buys 25%
		const id1 = await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_1")),
			ownershipPercentage: 25,
		});
		await verifyTotalOwnership(t, mortgageId, 100);

		// 2. Investor 2 buys 30%
		const id2 = await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_2")),
			ownershipPercentage: 30,
		});
		await verifyTotalOwnership(t, mortgageId, 100);

		// 3. Investor 3 buys 15%
		const id3 = await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_3")),
			ownershipPercentage: 15,
		});
		await verifyTotalOwnership(t, mortgageId, 100);

		// 4. Investor 1 increases to 35%
		await t.mutation(api.ownership.updateOwnershipPercentage, {
			id: id1,
			ownershipPercentage: 35,
		});
		await verifyTotalOwnership(t, mortgageId, 100);

		// 5. Investor 3 sells (deletes)
		await t.mutation(api.ownership.deleteOwnership, { id: id3 });
		await verifyTotalOwnership(t, mortgageId, 100);

		// 6. Investor 2 transfers to Investor 4
		await t.mutation(api.ownership.transferOwnership, {
			id: id2,
			newOwnerId: (await createTestUser(t, "investor_4")),
		});
		await verifyTotalOwnership(t, mortgageId, 100);

		// Final state: Investor 1 (35%), Investor 4 (30%), FairLend (35%)
		const total = await verifyTotalOwnership(t, mortgageId, 100);
		expect(total.owners).toBe(3);
	});

	test("should handle concurrent ownership creation", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		// Create multiple ownerships concurrently
		await Promise.all([
			t.mutation(api.ownership.createOwnership, {
				mortgageId,
				ownerId: (await createTestUser(t, "investor_1")),
				ownershipPercentage: 20,
			}),
			t.mutation(api.ownership.createOwnership, {
				mortgageId,
				ownerId: (await createTestUser(t, "investor_2")),
				ownershipPercentage: 30,
			}),
			t.mutation(api.ownership.createOwnership, {
				mortgageId,
				ownerId: (await createTestUser(t, "investor_3")),
				ownershipPercentage: 15,
			}),
		]);

		// Verify total is still 100%
		await verifyTotalOwnership(t, mortgageId, 100);

		// Verify all investors were created
		const total = await t.query(api.ownership.getTotalOwnership, {
			mortgageId,
		});
		expect(total.owners).toBe(4); // 3 investors + FairLend
	});

	test("should handle concurrent ownership updates", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		// Create initial ownerships
		const id1 = await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_1")),
			ownershipPercentage: 25,
		});

		const id2 = await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_2")),
			ownershipPercentage: 25,
		});

		// Update both concurrently
		await Promise.all([
			t.mutation(api.ownership.updateOwnershipPercentage, {
				id: id1,
				ownershipPercentage: 30,
			}),
			t.mutation(api.ownership.updateOwnershipPercentage, {
				id: id2,
				ownershipPercentage: 20,
			}),
		]);

		// Verify total is still 100%
		await verifyTotalOwnership(t, mortgageId, 100);
	});

	test("should handle concurrent ownership deletion", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		// Create multiple ownerships
		const id1 = await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_1")),
			ownershipPercentage: 20,
		});

		const id2 = await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_2")),
			ownershipPercentage: 30,
		});

		const id3 = await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_3")),
			ownershipPercentage: 15,
		});

		// Delete two concurrently
		await Promise.all([
			t.mutation(api.ownership.deleteOwnership, { id: id1 }),
			t.mutation(api.ownership.deleteOwnership, { id: id2 }),
		]);

		// Verify total is still 100%
		await verifyTotalOwnership(t, mortgageId, 100);

		// Delete the last one
		await t.mutation(api.ownership.deleteOwnership, { id: id3 });
		await verifyTotalOwnership(t, mortgageId, 100);

		// FairLend should be back to 100%
		const fairlendOwnership = await getFairlendOwnership(t, mortgageId);
		expect(fairlendOwnership?.ownershipPercentage).toBe(100);
	});

	test("should maintain consistency with multiple investors buying and selling", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		// Simulate a busy marketplace
		for (let i = 0; i < 5; i++) {
			// Buy
			const id = await t.mutation(api.ownership.createOwnership, {
				mortgageId,
				ownerId: (await createTestUser(t, `investor_${i}`)),
				ownershipPercentage: 10,
			});
			await verifyTotalOwnership(t, mortgageId, 100);

			// Sell
			await t.mutation(api.ownership.deleteOwnership, { id });
			await verifyTotalOwnership(t, mortgageId, 100);
		}

		// Should end up back at FairLend 100%
		const fairlendOwnership = await getFairlendOwnership(t, mortgageId);
		expect(fairlendOwnership?.ownershipPercentage).toBe(100);
	});

	test("should handle edge case: sell 100%, then buy 100%", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		// Investor 1 buys 100%
		const id1 = await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_1")),
			ownershipPercentage: 100,
		});
		await verifyTotalOwnership(t, mortgageId, 100);

		// No FairLend ownership
		let fairlendOwnership = await getFairlendOwnership(t, mortgageId);
		expect(fairlendOwnership).toBeNull();

		// Investor 1 sells back 100%
		await t.mutation(api.ownership.deleteOwnership, { id: id1 });
		await verifyTotalOwnership(t, mortgageId, 100);

		// FairLend back to 100%
		fairlendOwnership = await getFairlendOwnership(t, mortgageId);
		expect(fairlendOwnership?.ownershipPercentage).toBe(100);

		// Investor 2 buys 100%
		await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_2")),
			ownershipPercentage: 100,
		});
		await verifyTotalOwnership(t, mortgageId, 100);

		// No FairLend ownership again
		fairlendOwnership = await getFairlendOwnership(t, mortgageId);
		expect(fairlendOwnership).toBeNull();
	});

	test("should handle edge case: multiple fractional ownerships summing to 100%", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		// Create precise fractional ownerships
		await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_1")),
			ownershipPercentage: 12.5,
		});

		await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_2")),
			ownershipPercentage: 37.5,
		});

		await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_3")),
			ownershipPercentage: 25.0,
		});

		await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_4")),
			ownershipPercentage: 25.0,
		});

		// FairLend should have 0% and be deleted
		const fairlendOwnership = await getFairlendOwnership(t, mortgageId);
		expect(fairlendOwnership).toBeNull();

		// Total should be exactly 100%
		const total = await verifyTotalOwnership(t, mortgageId, 100);
		expect(total.totalPercentage).toBe(100);
	});

	test("should validate total ownership never exceeds 100.01%", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		// Create various ownerships and verify after each
		const percentages = [15.3, 22.7, 31.1, 18.9, 12.0];

		for (const pct of percentages) {
			await t.mutation(api.ownership.createOwnership, {
				mortgageId,
				ownerId: (await createTestUser(t, `investor_${pct}`)),
				ownershipPercentage: pct,
			});

			const total = await t.query(api.ownership.getTotalOwnership, {
				mortgageId,
			});

			// Should never exceed 100.01%
			expect(total.totalPercentage).toBeLessThanOrEqual(100.01);
		}
	});

	test("should validate total ownership never falls below 99.99%", async () => {
		const t = createTest();
		const { mortgageId } = await createTestMortgage(t);

		// Create ownerships with difficult fractions
		await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_1")),
			ownershipPercentage: 33.33,
		});

		await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_2")),
			ownershipPercentage: 33.34,
		});

		await t.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: (await createTestUser(t, "investor_3")),
			ownershipPercentage: 33.33,
		});

		const total = await t.query(api.ownership.getTotalOwnership, {
			mortgageId,
		});

		// Should never fall below 99.99%
		expect(total.totalPercentage).toBeGreaterThanOrEqual(99.99);
		expect(total.totalPercentage).toBeLessThanOrEqual(100.01);
		expect(total.isValid).toBe(true);
	});
});

