// @vitest-environment node
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import schema from "../schema";

// @ts-ignore
const modules = import.meta.glob("../**/*.{ts,js,tsx,jsx}", { eager: false });
const createTest = () => convexTest(schema, modules);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a test borrower
 */
async function createTestBorrower(t: ReturnType<typeof createTest>) {
	return await t.run(
		async (ctx) =>
			await ctx.db.insert("borrowers", {
				name: "Test Borrower",
				email: `test_${Date.now()}@example.com`,
				rotessaCustomerId: `rotessa_${Date.now()}`,
			})
	);
}

/**
 * Create a test mortgage
 */
async function createTestMortgage(
	t: ReturnType<typeof createTest>,
	borrowerId: Id<"borrowers">
) {
	return await t.run(
		async (ctx) =>
			await ctx.db.insert("mortgages", {
				borrowerId,
				loanAmount: 500000,
				interestRate: 5.5,
				originationDate: "2024-01-01",
				maturityDate: "2025-01-01",
				status: "active" as const,
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
			})
	);
}

/**
 * Create a test listing
 */
async function createTestListing(
	t: ReturnType<typeof createTest>,
	mortgageId: Id<"mortgages">
) {
	return await t.run(
		async (ctx) =>
			await ctx.db.insert("listings", {
				mortgageId,
				visible: true,
				locked: false,
			})
	);
}

/**
 * Create a test user
 */
async function createTestUser(t: ReturnType<typeof createTest>) {
	return await t.run(
		async (ctx) =>
			await ctx.db.insert("users", {
				idp_id: `test_user_${Date.now()}`,
				email: `testuser_${Date.now()}@example.com`,
				email_verified: true,
				first_name: "Test",
				last_name: "User",
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				metadata: {},
			})
	);
}

// ============================================================================
// Broker/Admin Listing Update Tests
// ============================================================================

describe("updateListing - Broker/Admin Authorization", () => {
	test("should update listing visible field with broker role", async () => {
		const t = createTest();

		// Create test data
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);

		// Mock broker identity and use returned instance
		const brokerT = t.withIdentity({
			subject: "broker-user-123",
			role: "broker",
		});

		// Update listing visibility
		const result = await brokerT.mutation(api.listings.updateListing, {
			listingId,
			visible: false,
		});

		expect(result).toBe(listingId);

		// Verify the update
		const listing = await t.run(async (ctx) => ctx.db.get(listingId));
		expect(listing?.visible).toBe(false);
	});

	test("should update listing visible field with admin role", async () => {
		const t = createTest();

		// Create test data
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);

		// Mock admin identity and use returned instance
		const adminT = t.withIdentity({
			subject: "admin-user-123",
			role: "admin",
		});

		// Update listing visibility
		const result = await adminT.mutation(api.listings.updateListing, {
			listingId,
			visible: false,
		});

		expect(result).toBe(listingId);

		// Verify the update
		const listing = await t.run(async (ctx) => ctx.db.get(listingId));
		expect(listing?.visible).toBe(false);
	});

	test("should update listing lock state with broker role", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);
		const userId = await createTestUser(t);

		// Mock broker identity and use returned instance
		const brokerT = t.withIdentity({
			subject: "broker-user-123",
			role: "broker",
		});

		// Lock the listing
		const result = await brokerT.mutation(api.listings.updateListing, {
			listingId,
			locked: true,
			lockedBy: userId,
		});

		expect(result).toBe(listingId);

		// Verify the lock
		const listing = await t.run(async (ctx) => ctx.db.get(listingId));
		expect(listing?.locked).toBe(true);
		expect(listing?.lockedBy).toBe(userId);
		expect(listing?.lockedAt).toBeDefined();
	});

	test("should update listing lock state with admin role", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);
		const userId = await createTestUser(t);

		// Mock admin identity and use returned instance
		const adminT = t.withIdentity({
			subject: "admin-user-123",
			role: "admin",
		});

		// Lock the listing
		const result = await adminT.mutation(api.listings.updateListing, {
			listingId,
			locked: true,
			lockedBy: userId,
		});

		expect(result).toBe(listingId);

		// Verify the lock
		const listing = await t.run(async (ctx) => ctx.db.get(listingId));
		expect(listing?.locked).toBe(true);
		expect(listing?.lockedBy).toBe(userId);
		expect(listing?.lockedAt).toBeDefined();
	});

	test("should unlock listing with broker role", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const userId = await createTestUser(t);

		// Create locked listing
		const listingId = await t.run(
			async (ctx) =>
				await ctx.db.insert("listings", {
					mortgageId,
					visible: true,
					locked: true,
					lockedBy: userId,
					lockedAt: Date.now(),
				})
		);

		// Mock broker identity and use returned instance
		const brokerT = t.withIdentity({
			subject: "broker-user-123",
			role: "broker",
		});

		// Unlock the listing
		await brokerT.mutation(api.listings.updateListing, {
			listingId,
			locked: false,
		});

		// Verify the unlock
		const listing = await t.run(async (ctx) => ctx.db.get(listingId));
		expect(listing?.locked).toBe(false);
		expect(listing?.lockedBy).toBeUndefined();
		expect(listing?.lockedAt).toBeUndefined();
	});

	test("should unlock listing with admin role", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const userId = await createTestUser(t);

		// Create locked listing
		const listingId = await t.run(
			async (ctx) =>
				await ctx.db.insert("listings", {
					mortgageId,
					visible: true,
					locked: true,
					lockedBy: userId,
					lockedAt: Date.now(),
				})
		);

		// Mock admin identity and use returned instance
		const adminT = t.withIdentity({
			subject: "admin-user-123",
			role: "admin",
		});

		// Unlock the listing
		await adminT.mutation(api.listings.updateListing, {
			listingId,
			locked: false,
		});

		// Verify the unlock
		const listing = await t.run(async (ctx) => ctx.db.get(listingId));
		expect(listing?.locked).toBe(false);
		expect(listing?.lockedBy).toBeUndefined();
		expect(listing?.lockedAt).toBeUndefined();
	});

	test("should reject update without authentication", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);

		// Attempt update without identity
		await expect(
			t.mutation(api.listings.updateListing, {
				listingId,
				visible: false,
			})
		).rejects.toThrow("Authentication required");
	});

	test("should reject update without broker/admin role", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);

		// Mock non-broker/admin identity and use returned instance
		const userT = t.withIdentity({
			subject: "regular-user-123",
			role: "user",
		});

		// Attempt update
		await expect(
			userT.mutation(api.listings.updateListing, {
				listingId,
				visible: false,
			})
		).rejects.toThrow("Broker or admin privileges are required");
	});
});

// ============================================================================
// Broker/Admin Listing Deletion Tests
// ============================================================================

describe("deleteListing - Broker/Admin Authorization and Cascade", () => {
	test("should delete listing with broker role", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);

		// Mock broker identity and use returned instance
		const brokerT = t.withIdentity({
			subject: "broker-user-123",
			role: "broker",
		});

		// Delete listing
		const result = await brokerT.mutation(api.listings.deleteListing, {
			listingId,
		});

		expect(result).toBe(listingId);

		// Verify deletion
		const listing = await t.run(async (ctx) => ctx.db.get(listingId));
		expect(listing).toBeNull();

		// Verify mortgage still exists
		const mortgage = await t.run(async (ctx) => ctx.db.get(mortgageId));
		expect(mortgage).not.toBeNull();
	});

	test("should delete listing with admin role", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);

		// Mock admin identity and use returned instance
		const adminT = t.withIdentity({
			subject: "admin-user-123",
			role: "admin",
		});

		// Delete listing
		const result = await adminT.mutation(api.listings.deleteListing, {
			listingId,
		});

		expect(result).toBe(listingId);

		// Verify deletion
		const listing = await t.run(async (ctx) => ctx.db.get(listingId));
		expect(listing).toBeNull();

		// Verify mortgage still exists
		const mortgage = await t.run(async (ctx) => ctx.db.get(mortgageId));
		expect(mortgage).not.toBeNull();
	});

	test("should cascade delete comparables when deleting listing", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);

		// Create comparables
		const comparable1 = await t.run(
			async (ctx) =>
				await ctx.db.insert("appraisal_comparables", {
					mortgageId,
					address: {
						street: "456 Compare St",
						city: "Test City",
						state: "CA",
						zip: "12345",
					},
					distance: 0.5,
					saleAmount: 550000,
					saleDate: "2023-11-01",
					propertyType: "Single Family",
					bedrooms: 3,
					bathrooms: 2,
					squareFeet: 2000,
				})
		);

		const comparable2 = await t.run(
			async (ctx) =>
				await ctx.db.insert("appraisal_comparables", {
					mortgageId,
					address: {
						street: "789 Compare Ave",
						city: "Test City",
						state: "CA",
						zip: "12345",
					},
					distance: 0.8,
					saleAmount: 575000,
					saleDate: "2023-10-15",
					propertyType: "Single Family",
					bedrooms: 4,
					bathrooms: 2.5,
					squareFeet: 2200,
				})
		);

		// Mock admin identity and use returned instance
		const adminT = t.withIdentity({
			subject: "admin-user-123",
			role: "admin",
		});

		// Delete listing
		await adminT.mutation(api.listings.deleteListing, {
			listingId,
		});

		// Verify comparables were deleted
		const comp1 = await t.run(async (ctx) => ctx.db.get(comparable1));
		const comp2 = await t.run(async (ctx) => ctx.db.get(comparable2));
		expect(comp1).toBeNull();
		expect(comp2).toBeNull();
	});

	test("should reject deletion of locked listing without force flag", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const userId = await createTestUser(t);

		// Create locked listing
		const listingId = await t.run(
			async (ctx) =>
				await ctx.db.insert("listings", {
					mortgageId,
					visible: true,
					locked: true,
					lockedBy: userId,
					lockedAt: Date.now(),
				})
		);

		// Mock admin identity and use returned instance
		const adminT = t.withIdentity({
			subject: "admin-user-123",
			role: "admin",
		});

		// Attempt delete without force flag
		await expect(
			adminT.mutation(api.listings.deleteListing, {
				listingId,
			})
		).rejects.toThrow("Cannot delete locked listing");
	});

	test("should force delete locked listing with force flag", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const userId = await createTestUser(t);

		// Create locked listing
		const listingId = await t.run(
			async (ctx) =>
				await ctx.db.insert("listings", {
					mortgageId,
					visible: true,
					locked: true,
					lockedBy: userId,
					lockedAt: Date.now(),
				})
		);

		// Mock admin identity and use returned instance
		const adminT = t.withIdentity({
			subject: "admin-user-123",
			role: "admin",
		});

		// Delete with force flag
		const result = await adminT.mutation(api.listings.deleteListing, {
			listingId,
			force: true,
		});

		expect(result).toBe(listingId);

		// Verify deletion
		const listing = await t.run(async (ctx) => ctx.db.get(listingId));
		expect(listing).toBeNull();
	});

	test("should reject deletion without authentication", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);

		// Attempt delete without identity
		await expect(
			t.mutation(api.listings.deleteListing, {
				listingId,
			})
		).rejects.toThrow("Authentication required");
	});

	test("should reject deletion without broker/admin role", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);

		// Mock non-broker/admin identity and use returned instance
		const userT = t.withIdentity({
			subject: "regular-user-123",
			role: "user",
		});

		// Attempt delete
		await expect(
			userT.mutation(api.listings.deleteListing, {
				listingId,
			})
		).rejects.toThrow("Broker or admin privileges are required");
	});
});
