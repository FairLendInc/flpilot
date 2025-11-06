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
// Mortgage Update Tests
// ============================================================================

describe("mortgages.updateMortgage", () => {
	test("should update loan amount as admin", async () => {
		const t = createTest();
		const admin = withAdminIdentity(t);
		const { mortgageId } = await createTestMortgage(t);

		await admin.mutation(api.mortgages.updateMortgage, {
			id: mortgageId,
			loanAmount: 600000,
		});

		const mortgage = await admin.run(async (ctx) => {
			return await ctx.db.get(mortgageId);
		});

		expect(mortgage?.loanAmount).toBe(600000);
	});

	test("should update interest rate as admin", async () => {
		const t = createTest();
		const admin = withAdminIdentity(t);
		const { mortgageId } = await createTestMortgage(t);

		await admin.mutation(api.mortgages.updateMortgage, {
			id: mortgageId,
			interestRate: 6.5,
		});

		const mortgage = await admin.run(async (ctx) => {
			return await ctx.db.get(mortgageId);
		});

		expect(mortgage?.interestRate).toBe(6.5);
	});

	test("should update status as admin", async () => {
		const t = createTest();
		const admin = withAdminIdentity(t);
		const { mortgageId } = await createTestMortgage(t);

		await admin.mutation(api.mortgages.updateMortgage, {
			id: mortgageId,
			status: "closed",
		});

		const mortgage = await admin.run(async (ctx) => {
			return await ctx.db.get(mortgageId);
		});

		expect(mortgage?.status).toBe("closed");
	});

	test("should validate loan amount > 0", async () => {
		const t = createTest();
		const admin = withAdminIdentity(t);
		const { mortgageId } = await createTestMortgage(t);

		await expect(
			admin.mutation(api.mortgages.updateMortgage, {
				id: mortgageId,
				loanAmount: -1000,
			})
		).rejects.toThrow("greater than 0");
	});

	test("should validate interest rate range", async () => {
		const t = createTest();
		const admin = withAdminIdentity(t);
		const { mortgageId } = await createTestMortgage(t);

		await expect(
			admin.mutation(api.mortgages.updateMortgage, {
				id: mortgageId,
				interestRate: 150,
			})
		).rejects.toThrow("between 0 and 100");
	});

	test("should reject update from non-admin", async () => {
		const t = createTest();
		const admin = withAdminIdentity(t);
		const nonAdmin = withNonAdminIdentity(t);
		const { mortgageId } = await createTestMortgage(t);

		await expect(
			nonAdmin.mutation(api.mortgages.updateMortgage, {
				id: mortgageId,
				loanAmount: 600000,
			})
		).rejects.toThrow("Unauthorized");
	});
});

// ============================================================================
// Mortgage Delete Tests
// ============================================================================

describe("mortgages.deleteMortgage", () => {
	test("should delete mortgage as admin", async () => {
		const t = createTest();
		const admin = withAdminIdentity(t);
		const { mortgageId } = await createTestMortgage(t);

		await admin.mutation(api.mortgages.deleteMortgage, {
			id: mortgageId,
		});

		const mortgage = await admin.run(async (ctx) => {
			return await ctx.db.get(mortgageId);
		});

		expect(mortgage).toBeNull();
	});

	test("should cascade delete listings", async () => {
		const t = createTest();
		const admin = withAdminIdentity(t);
		const { mortgageId } = await createTestMortgage(t);
		const listingId = await createTestListing(admin, mortgageId);

		await admin.mutation(api.mortgages.deleteMortgage, {
			id: mortgageId,
		});

		const listing = await admin.run(async (ctx) => {
			return await ctx.db.get(listingId);
		});

		expect(listing).toBeNull();
	});

	test("should cascade delete comparables", async () => {
		const t = createTest();
		const admin = withAdminIdentity(t);
		const { mortgageId } = await createTestMortgage(t);

		const comparableId = await admin.mutation(api.comparables.createComparable, {
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

		await admin.mutation(api.mortgages.deleteMortgage, {
			id: mortgageId,
		});

		const comparable = await admin.run(async (ctx) => {
			return await ctx.db.get(comparableId);
		});

		expect(comparable).toBeNull();
	});

	test("should cascade delete ownership records", async () => {
		const t = createTest();
		const admin = withAdminIdentity(t);
		const user = await createTestUser(admin, "investor_1");
		const { mortgageId } = await createTestMortgage(t);

		const ownershipId = await admin.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: user,
			ownershipPercentage: 25,
		});

		await admin.mutation(api.mortgages.deleteMortgage, {
			id: mortgageId,
		});

		const ownership = await admin.run(async (ctx) => {
			return await ctx.db.get(ownershipId);
		});

		expect(ownership).toBeNull();
	});

	test("should cascade delete payments", async () => {
		const t = createTest();
		const admin = withAdminIdentity(t);
		const { mortgageId } = await createTestMortgage(t);

		const paymentId = await admin.mutation(api.payments.createPayment, {
			mortgageId,
			amount: 2500,
			processDate: "2024-01-15",
			status: "cleared",
			paymentId: `test-payment-${Date.now()}`,
			customerId: "test-customer",
			transactionScheduleId: "test-schedule",
		});

		await admin.mutation(api.mortgages.deleteMortgage, {
			id: mortgageId,
		});

		const payment = await admin.run(async (ctx) => {
			return await ctx.db.get(paymentId);
		});

		expect(payment).toBeNull();
	});

	test("should reject deletion of mortgage with locked listing without force", async () => {
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
			admin.mutation(api.mortgages.deleteMortgage, {
				id: mortgageId,
			})
		).rejects.toThrow("locked");
	});

	test("should allow force deletion of mortgage with locked listing", async () => {
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
		await admin.mutation(api.mortgages.deleteMortgage, {
			id: mortgageId,
			force: true,
		});

		const mortgage = await admin.run(async (ctx) => {
			return await ctx.db.get(mortgageId);
		});

		expect(mortgage).toBeNull();
	});

	test("should reject deletion from non-admin", async () => {
		const t = createTest();
		const admin = withAdminIdentity(t);
		const nonAdmin = withNonAdminIdentity(t);
		const { mortgageId } = await createTestMortgage(t);

		await expect(
			nonAdmin.mutation(api.mortgages.deleteMortgage, {
				id: mortgageId,
			})
		).rejects.toThrow("Unauthorized");
	});

	test("should preserve borrower record", async () => {
		const t = createTest();
		const admin = withAdminIdentity(t);
		const { mortgageId, borrowerId } = await createTestMortgage(t);

		await admin.mutation(api.mortgages.deleteMortgage, {
			id: mortgageId,
		});

		const borrower = await admin.run(async (ctx) => {
			return await ctx.db.get(borrowerId);
		});

		expect(borrower).toBeTruthy();
	});
});

