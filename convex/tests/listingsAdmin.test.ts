// @vitest-environment node
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import type { Id } from "../_generated/dataModel";

// @ts-ignore
const modules = import.meta.glob("../**/*.{ts,js,tsx,jsx}", { eager: false });
const createTest = () => convexTest(schema, modules);

// Helper functions
async function createTestMortgage(t: ReturnType<typeof createTest>) {
	const borrowerId = await t.run(async (ctx) => {
		return await ctx.db.insert("borrowers", {
			name: "Test Borrower",
			email: `test_${Date.now()}@example.com`,
			rotessaCustomerId: `rotessa_${Date.now()}`,
		});
	});

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
		externalMortgageId: `test-mortgage-${Date.now()}-${Math.random()}`,
	});

	return { mortgageId, borrowerId };
}

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
		});
	});
}

async function createTestListing(
	t: ReturnType<typeof createTest>,
	mortgageId: Id<"mortgages">
) {
	return await t.mutation(api.listings.createListing, {
		mortgageId,
		visible: true,
	});
}

const withAdminIdentity = (t: ReturnType<typeof createTest>) =>
	t.withIdentity({
		subject: "admin-user",
		tokenIdentifier: "test|admin-user",
		role: "admin",
	});

const withNonAdminIdentity = (t: ReturnType<typeof createTest>) =>
	t.withIdentity({
		subject: "user-user",
		tokenIdentifier: "test|user-user",
		role: "member",
	});

// ============================================================================
// Listing Update Tests
// ============================================================================

describe("listings.updateListing", () => {
	test("should update listing visibility as admin", async () => {
		const t = createTest();
		const admin = withAdminIdentity(t);
		const { mortgageId } = await createTestMortgage(t);
		const listingId = await createTestListing(admin, mortgageId);

		await admin.mutation(api.listings.updateListing, {
			listingId,
			visible: false,
		});

		const listing = await admin.run(async (ctx) => {
			return await ctx.db.get(listingId);
		});

		expect(listing?.visible).toBe(false);
	});

	test("should update listing lock state as admin", async () => {
		const t = createTest();
		const admin = withAdminIdentity(t);
		const user = await createTestUser(admin, "investor_1");
		const { mortgageId } = await createTestMortgage(t);
		const listingId = await createTestListing(admin, mortgageId);

		await admin.mutation(api.listings.updateListing, {
			listingId,
			locked: true,
		});

		const listing = await admin.run(async (ctx) => {
			return await ctx.db.get(listingId);
		});

		expect(listing?.locked).toBe(true);
		expect(listing?.lockedBy).toBeTruthy();
		expect(listing?.lockedAt).toBeTruthy();
	});

	test("should unlock listing as admin", async () => {
		const t = createTest();
		const admin = withAdminIdentity(t);
		const user = await createTestUser(admin, "investor_1");
		const { mortgageId } = await createTestMortgage(t);
		const listingId = await createTestListing(admin, mortgageId);

		// Lock first
		await admin.mutation(api.listings.updateListing, {
			listingId,
			locked: true,
		});

		// Then unlock
		await admin.mutation(api.listings.updateListing, {
			listingId,
			locked: false,
		});

		const listing = await admin.run(async (ctx) => {
			return await ctx.db.get(listingId);
		});

		expect(listing?.locked).toBe(false);
		expect(listing?.lockedBy).toBeUndefined();
		expect(listing?.lockedAt).toBeUndefined();
	});

	test("should reject update from non-admin", async () => {
		const t = createTest();
		const admin = withAdminIdentity(t);
		const nonAdmin = withNonAdminIdentity(t);
		const { mortgageId } = await createTestMortgage(t);
		const listingId = await createTestListing(admin, mortgageId);

		await expect(
			nonAdmin.mutation(api.listings.updateListing, {
				listingId,
				visible: false,
			})
		).rejects.toThrow("Unauthorized");
	});

	test("should reject update when not authenticated", async () => {
		const t = createTest();
		const admin = withAdminIdentity(t);
		const { mortgageId } = await createTestMortgage(t);
		const listingId = await createTestListing(admin, mortgageId);

		await expect(
			t.mutation(api.listings.updateListing, {
				listingId,
				visible: false,
			})
		).rejects.toThrow("Authentication required");
	});
});

// ============================================================================
// Listing Delete Tests
// ============================================================================

describe("listings.deleteListing", () => {
	test("should delete listing as admin", async () => {
		const t = createTest();
		const admin = withAdminIdentity(t);
		const { mortgageId } = await createTestMortgage(t);
		const listingId = await createTestListing(admin, mortgageId);

		await admin.mutation(api.listings.deleteListing, {
			listingId,
		});

		const listing = await admin.run(async (ctx) => {
			return await ctx.db.get(listingId);
		});

		expect(listing).toBeNull();
	});

	test("should delete comparables when deleting listing", async () => {
		const t = createTest();
		const admin = withAdminIdentity(t);
		const { mortgageId } = await createTestMortgage(t);
		const listingId = await createTestListing(admin, mortgageId);

		// Create comparables
		const comparableId1 = await admin.mutation(api.comparables.createComparable, {
			mortgageId,
			address: {
				street: "123 Comp St",
				city: "Test City",
				state: "CA",
				zip: "12345",
			},
			saleAmount: 550000,
			saleDate: "2023-11-01",
			distance: 0.5,
		});

		const comparableId2 = await admin.mutation(api.comparables.createComparable, {
			mortgageId,
			address: {
				street: "456 Comp St",
				city: "Test City",
				state: "CA",
				zip: "12345",
			},
			saleAmount: 580000,
			saleDate: "2023-10-01",
			distance: 0.8,
		});

		// Delete listing
		await admin.mutation(api.listings.deleteListing, {
			listingId,
		});

		// Verify comparables are deleted
		const comparables = await admin.run(async (ctx) => {
			return await ctx.db
				.query("appraisal_comparables")
				.withIndex("by_mortgage", (q) => q.eq("mortgageId", mortgageId))
				.collect();
		});

		expect(comparables).toHaveLength(0);
	});

	test("should reject deletion of locked listing without force", async () => {
		const t = createTest();
		const admin = withAdminIdentity(t);
		const user = await createTestUser(admin, "investor_1");
		const { mortgageId } = await createTestMortgage(t);
		const listingId = await createTestListing(admin, mortgageId);

		// Lock the listing
		await admin.mutation(api.listings.updateListing, {
			listingId,
			locked: true,
		});

		// Try to delete without force
		await expect(
			admin.mutation(api.listings.deleteListing, {
				listingId,
			})
		).rejects.toThrow("locked");
	});

	test("should allow force deletion of locked listing", async () => {
		const t = createTest();
		const admin = withAdminIdentity(t);
		const user = await createTestUser(admin, "investor_1");
		const { mortgageId } = await createTestMortgage(t);
		const listingId = await createTestListing(admin, mortgageId);

		// Lock the listing
		await admin.mutation(api.listings.updateListing, {
			listingId,
			locked: true,
		});

		// Force delete
		await admin.mutation(api.listings.deleteListing, {
			listingId,
			force: true,
		});

		const listing = await admin.run(async (ctx) => {
			return await ctx.db.get(listingId);
		});

		expect(listing).toBeNull();
	});

	test("should reject deletion from non-admin", async () => {
		const t = createTest();
		const admin = withAdminIdentity(t);
		const nonAdmin = withNonAdminIdentity(t);
		const { mortgageId } = await createTestMortgage(t);
		const listingId = await createTestListing(admin, mortgageId);

		await expect(
			nonAdmin.mutation(api.listings.deleteListing, {
				listingId,
			})
		).rejects.toThrow("Unauthorized");
	});
});

