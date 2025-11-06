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

async function createTestBorrower(t: ReturnType<typeof createTest>) {
	return await t.run(async (ctx) => {
		return await ctx.db.insert("borrowers", {
			name: "Test Borrower",
			email: `test_${Date.now()}@example.com`,
			rotessaCustomerId: `rotessa_${Date.now()}`,
		});
	});
}

async function createTestMortgage(
	t: ReturnType<typeof createTest>,
	borrowerId: Id<"borrowers">
) {
	return await t.run(async (ctx) => {
		return await ctx.db.insert("mortgages", {
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
		});
	});
}

// ============================================================================
// Admin Mortgage Update Tests
// ============================================================================

describe("updateMortgage - Admin Authorization", () => {
	test("should update loan amount with admin role", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);

		// Mock admin identity
		t.withIdentity({
			subject: "admin-user-123",
			role: "admin",
		});

		// Update loan amount
		await t.mutation(api.mortgages.updateMortgage, {
			mortgageId,
			loanAmount: 550000,
		});

		// Verify update
		const mortgage = await t.run(async (ctx) => ctx.db.get(mortgageId));
		expect(mortgage?.loanAmount).toBe(550000);
	});

	test("should update interest rate with admin role", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);

		// Mock admin identity
		t.withIdentity({
			subject: "admin-user-123",
			role: "admin",
		});

		// Update interest rate
		await t.mutation(api.mortgages.updateMortgage, {
			mortgageId,
			interestRate: 6.0,
		});

		// Verify update
		const mortgage = await t.run(async (ctx) => ctx.db.get(mortgageId));
		expect(mortgage?.interestRate).toBe(6.0);
	});

	test("should update property address with admin role", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);

		// Mock admin identity
		t.withIdentity({
			subject: "admin-user-123",
			role: "admin",
		});

		const newAddress = {
			street: "456 New St",
			city: "New City",
			state: "NY",
			zip: "67890",
			country: "USA",
		};

		// Update address
		await t.mutation(api.mortgages.updateMortgage, {
			mortgageId,
			address: newAddress,
		});

		// Verify update
		const mortgage = await t.run(async (ctx) => ctx.db.get(mortgageId));
		expect(mortgage?.address).toEqual(newAddress);
	});

	test("should update location coordinates with admin role", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);

		// Mock admin identity
		t.withIdentity({
			subject: "admin-user-123",
			role: "admin",
		});

		const newLocation = {
			lat: 40.7128,
			lng: -74.006,
		};

		// Update location
		await t.mutation(api.mortgages.updateMortgage, {
			mortgageId,
			location: newLocation,
		});

		// Verify update
		const mortgage = await t.run(async (ctx) => ctx.db.get(mortgageId));
		expect(mortgage?.location).toEqual(newLocation);
	});

	test("should relink mortgage to different borrower with admin role", async () => {
		const t = createTest();

		const borrowerId1 = await createTestBorrower(t);
		const borrowerId2 = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId1);

		// Mock admin identity
		t.withIdentity({
			subject: "admin-user-123",
			role: "admin",
		});

		// Relink to different borrower
		await t.mutation(api.mortgages.updateMortgage, {
			mortgageId,
			borrowerId: borrowerId2,
		});

		// Verify update
		const mortgage = await t.run(async (ctx) => ctx.db.get(mortgageId));
		expect(mortgage?.borrowerId).toBe(borrowerId2);
	});

	test("should reject invalid loan amount", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);

		// Mock admin identity
		t.withIdentity({
			subject: "admin-user-123",
			role: "admin",
		});

		// Attempt invalid loan amount
		await expect(
			t.mutation(api.mortgages.updateMortgage, {
				mortgageId,
				loanAmount: -1000,
			})
		).rejects.toThrow("Loan amount must be greater than 0");
	});

	test("should reject invalid interest rate", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);

		// Mock admin identity
		t.withIdentity({
			subject: "admin-user-123",
			role: "admin",
		});

		// Attempt invalid interest rate
		await expect(
			t.mutation(api.mortgages.updateMortgage, {
				mortgageId,
				interestRate: 150,
			})
		).rejects.toThrow("Interest rate must be between 0 and 100");
	});

	test("should reject invalid coordinates", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);

		// Mock admin identity
		t.withIdentity({
			subject: "admin-user-123",
			role: "admin",
		});

		// Attempt invalid latitude
		await expect(
			t.mutation(api.mortgages.updateMortgage, {
				mortgageId,
				location: { lat: 100, lng: 0 },
			})
		).rejects.toThrow("Latitude must be between -90 and 90");
	});

	test("should reject maturity date before origination date", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);

		// Mock admin identity
		t.withIdentity({
			subject: "admin-user-123",
			role: "admin",
		});

		// Attempt invalid dates
		await expect(
			t.mutation(api.mortgages.updateMortgage, {
				mortgageId,
				originationDate: "2025-01-01",
				maturityDate: "2024-01-01",
			})
		).rejects.toThrow("Maturity date must be after origination date");
	});

	test("should reject update without authentication", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);

		// Attempt update without identity
		await expect(
			t.mutation(api.mortgages.updateMortgage, {
				mortgageId,
				loanAmount: 550000,
			})
		).rejects.toThrow("Authentication required");
	});

	test("should reject update without admin role", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);

		// Mock non-admin identity
		t.withIdentity({
			subject: "regular-user-123",
			role: "user",
		});

		// Attempt update
		await expect(
			t.mutation(api.mortgages.updateMortgage, {
				mortgageId,
				loanAmount: 550000,
			})
		).rejects.toThrow("Unauthorized");
	});
});

// ============================================================================
// Admin Mortgage Deletion Tests
// ============================================================================

describe("deleteMortgage - Admin Authorization and Cascade", () => {
	test("should delete mortgage with all cascades", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);

		// Create a listing
		const listingId = await t.run(async (ctx) => {
			return await ctx.db.insert("listings", {
				mortgageId,
				visible: true,
				locked: false,
			});
		});

		// Create comparables
		const comparable1 = await t.run(async (ctx) => {
			return await ctx.db.insert("appraisal_comparables", {
				mortgageId,
				address: "456 Compare St",
				city: "Test City",
				state: "CA",
				zip: "12345",
				country: "USA",
				distance: 0.5,
				salePrice: 550000,
				saleDate: "2023-11-01",
				propertyType: "Single Family",
				bedrooms: 3,
				bathrooms: 2,
				squareFeet: 2000,
				lotSize: 5000,
			});
		});

		// Create ownership record (besides default fairlend record)
		const ownershipId = await t.run(async (ctx) => {
			return await ctx.db.insert("mortgage_ownership", {
				mortgageId,
				ownerId: "test_user_1",
				ownershipPercentage: 25,
			});
		});

		// Create payment record
		const paymentId = await t.run(async (ctx) => {
			return await ctx.db.insert("payments", {
				mortgageId,
				amountDue: 5000,
				amountPaid: 5000,
				dueDate: "2024-02-01",
				paymentDate: "2024-02-01",
				status: "paid" as const,
				paymentType: "interest" as const,
			});
		});

		// Mock admin identity
		t.withIdentity({
			subject: "admin-user-123",
			role: "admin",
		});

		// Delete mortgage
		const result = await t.mutation(api.mortgages.deleteMortgage, {
			mortgageId,
		});

		expect(result.mortgageId).toBe(mortgageId);
		expect(result.deletedCounts.listings).toBeGreaterThan(0);
		expect(result.deletedCounts.comparables).toBeGreaterThan(0);
		expect(result.deletedCounts.ownership).toBeGreaterThan(0);
		expect(result.deletedCounts.payments).toBeGreaterThan(0);

		// Verify all were deleted
		const mortgage = await t.run(async (ctx) => ctx.db.get(mortgageId));
		const listing = await t.run(async (ctx) => ctx.db.get(listingId));
		const comparable = await t.run(async (ctx) => ctx.db.get(comparable1));
		const ownership = await t.run(async (ctx) => ctx.db.get(ownershipId));
		const payment = await t.run(async (ctx) => ctx.db.get(paymentId));

		expect(mortgage).toBeNull();
		expect(listing).toBeNull();
		expect(comparable).toBeNull();
		expect(ownership).toBeNull();
		expect(payment).toBeNull();

		// Verify borrower still exists
		const borrower = await t.run(async (ctx) => ctx.db.get(borrowerId));
		expect(borrower).not.toBeNull();
	});

	test("should reject deletion of mortgage with locked listing without force", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);

		// Create locked listing
		await t.run(async (ctx) => {
			return await ctx.db.insert("listings", {
				mortgageId,
				visible: true,
				locked: true,
				lockedBy: "test_user_1" as Id<"users">,
				lockedAt: Date.now(),
			});
		});

		// Mock admin identity
		t.withIdentity({
			subject: "admin-user-123",
			role: "admin",
		});

		// Attempt delete without force
		await expect(
			t.mutation(api.mortgages.deleteMortgage, {
				mortgageId,
			})
		).rejects.toThrow("Cannot delete mortgage with locked listing");
	});

	test("should force delete mortgage with locked listing", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);

		// Create locked listing
		await t.run(async (ctx) => {
			return await ctx.db.insert("listings", {
				mortgageId,
				visible: true,
				locked: true,
				lockedBy: "test_user_1" as Id<"users">,
				lockedAt: Date.now(),
			});
		});

		// Mock admin identity
		t.withIdentity({
			subject: "admin-user-123",
			role: "admin",
		});

		// Delete with force
		const result = await t.mutation(api.mortgages.deleteMortgage, {
			mortgageId,
			force: true,
		});

		expect(result.mortgageId).toBe(mortgageId);

		// Verify deletion
		const mortgage = await t.run(async (ctx) => ctx.db.get(mortgageId));
		expect(mortgage).toBeNull();
	});

	test("should reject deletion without authentication", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);

		// Attempt delete without identity
		await expect(
			t.mutation(api.mortgages.deleteMortgage, {
				mortgageId,
			})
		).rejects.toThrow("Authentication required");
	});

	test("should reject deletion without admin role", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);

		// Mock non-admin identity
		t.withIdentity({
			subject: "regular-user-123",
			role: "user",
		});

		// Attempt delete
		await expect(
			t.mutation(api.mortgages.deleteMortgage, {
				mortgageId,
			})
		).rejects.toThrow("Unauthorized");
	});
});

