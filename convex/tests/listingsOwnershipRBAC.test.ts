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
 * Create a test borrower
 */
async function createTestBorrower(t: ReturnType<typeof createTest>) {
	return await t.run(async (ctx) => {
		return await ctx.db.insert("borrowers", {
			name: "Test Borrower",
			email: `test_${Date.now()}@example.com`,
			rotessaCustomerId: `rotessa_${Date.now()}`,
		});
	});
}

/**
 * Create a test mortgage
 * Uses the createMortgage mutation to ensure FairLend ownership is created automatically
 */
async function createTestMortgage(
	t: ReturnType<typeof createTest>,
	borrowerId: Id<"borrowers">
) {
	// Use a broker identity to call the mutation
	const brokerT = t.withIdentity({
		subject: "broker-user-123",
		role: "broker",
	});

	return await brokerT.mutation(api.mortgages.createMortgage, {
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
}

/**
 * Create a test listing
 */
async function createTestListing(
	t: ReturnType<typeof createTest>,
	mortgageId: Id<"mortgages">,
	options?: { visible?: boolean; locked?: boolean; lockedBy?: Id<"users"> }
) {
	return await t.run(async (ctx) => {
		return await ctx.db.insert("listings", {
			mortgageId,
			visible: options?.visible ?? true,
			locked: options?.locked ?? false,
			lockedBy: options?.lockedBy,
			lockedAt: options?.locked ? Date.now() : undefined,
		});
	});
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
			metadata: {},
		});
	});
}

/**
 * Get user's idp_id for identity matching
 */
async function getUserIdpId(
	t: ReturnType<typeof createTest>,
	userId: Id<"users">
): Promise<string> {
	const user = await t.run(async (ctx) => ctx.db.get(userId));
	if (!user?.idp_id) {
		throw new Error(`User ${userId} has no idp_id`);
	}
	return user.idp_id;
}

// ============================================================================
// Listings Mutations RBAC Tests
// ============================================================================

describe("createListing - RBAC Authorization", () => {
	test("should create listing with broker role", async () => {
		const t = createTest();
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);

		const brokerT = t.withIdentity({
			subject: "broker-user-123",
			role: "broker",
		});

		const listingId = await brokerT.mutation(api.listings.createListing, {
			mortgageId,
			visible: true,
		});

		expect(listingId).toBeDefined();
		const listing = await t.run(async (ctx) => ctx.db.get(listingId));
		expect(listing?.mortgageId).toBe(mortgageId);
		expect(listing?.visible).toBe(true);
	});

	test("should create listing with admin role", async () => {
		const t = createTest();
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);

		const adminT = t.withIdentity({
			subject: "admin-user-123",
			role: "admin",
		});

		const listingId = await adminT.mutation(api.listings.createListing, {
			mortgageId,
			visible: true,
		});

		expect(listingId).toBeDefined();
		const listing = await t.run(async (ctx) => ctx.db.get(listingId));
		expect(listing?.mortgageId).toBe(mortgageId);
	});

	test("should reject create listing with investor role", async () => {
		const t = createTest();
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);

		const investorT = t.withIdentity({
			subject: "investor-user-123",
			role: "investor",
		});

		await expect(
			investorT.mutation(api.listings.createListing, {
				mortgageId,
				visible: true,
			})
		).rejects.toThrow("Broker or admin privileges required");
	});

	test("should reject create listing with lawyer role", async () => {
		const t = createTest();
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);

		const lawyerT = t.withIdentity({
			subject: "lawyer-user-123",
			role: "lawyer",
		});

		await expect(
			lawyerT.mutation(api.listings.createListing, {
				mortgageId,
				visible: true,
			})
		).rejects.toThrow("Broker or admin privileges required");
	});

	test("should reject create listing with member role", async () => {
		const t = createTest();
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);

		const memberT = t.withIdentity({
			subject: "member-user-123",
			role: "member",
		});

		await expect(
			memberT.mutation(api.listings.createListing, {
				mortgageId,
				visible: true,
			})
		).rejects.toThrow("Broker or admin privileges required");
	});

	test("should reject create listing without authentication", async () => {
		const t = createTest();
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);

		await expect(
			t.mutation(api.listings.createListing, {
				mortgageId,
				visible: true,
			})
		).rejects.toThrow("Authentication required");
	});
});

describe("updateListingVisibility - RBAC Authorization", () => {
	test("should update visibility with broker role", async () => {
		const t = createTest();
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);

		const brokerT = t.withIdentity({
			subject: "broker-user-123",
			role: "broker",
		});

		const result = await brokerT.mutation(
			api.listings.updateListingVisibility,
			{
				listingId,
				visible: false,
			}
		);

		expect(result).toBe(listingId);
		const listing = await t.run(async (ctx) => ctx.db.get(listingId));
		expect(listing?.visible).toBe(false);
	});

	test("should update visibility with admin role", async () => {
		const t = createTest();
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);

		const adminT = t.withIdentity({
			subject: "admin-user-123",
			role: "admin",
		});

		const result = await adminT.mutation(
			api.listings.updateListingVisibility,
			{
				listingId,
				visible: false,
			}
		);

		expect(result).toBe(listingId);
		const listing = await t.run(async (ctx) => ctx.db.get(listingId));
		expect(listing?.visible).toBe(false);
	});

	test("should reject update visibility with investor role", async () => {
		const t = createTest();
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);

		const investorT = t.withIdentity({
			subject: "investor-user-123",
			role: "investor",
		});

		await expect(
			investorT.mutation(api.listings.updateListingVisibility, {
				listingId,
				visible: false,
			})
		).rejects.toThrow("Broker or admin privileges required");
	});

	test("should reject update visibility without authentication", async () => {
		const t = createTest();
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);

		await expect(
			t.mutation(api.listings.updateListingVisibility, {
				listingId,
				visible: false,
			})
		).rejects.toThrow("Authentication required");
	});
});

describe("lockListing - RBAC Authorization", () => {
	test("should lock listing with broker role", async () => {
		const t = createTest();
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);
		const userId = await createTestUser(t, "locker");

		const brokerT = t.withIdentity({
			subject: "broker-user-123",
			role: "broker",
		});

		const result = await brokerT.mutation(api.listings.lockListing, {
			listingId,
			userId,
		});

		expect(result).toBe(listingId);
		const listing = await t.run(async (ctx) => ctx.db.get(listingId));
		expect(listing?.locked).toBe(true);
		expect(listing?.lockedBy).toBe(userId);
	});

	test("should lock listing with admin role", async () => {
		const t = createTest();
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);
		const userId = await createTestUser(t, "locker");

		const adminT = t.withIdentity({
			subject: "admin-user-123",
			role: "admin",
		});

		const result = await adminT.mutation(api.listings.lockListing, {
			listingId,
			userId,
		});

		expect(result).toBe(listingId);
		const listing = await t.run(async (ctx) => ctx.db.get(listingId));
		expect(listing?.locked).toBe(true);
	});

	test("should reject lock listing with investor role", async () => {
		const t = createTest();
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);
		const userId = await createTestUser(t, "locker");

		const investorT = t.withIdentity({
			subject: "investor-user-123",
			role: "investor",
		});

		await expect(
			investorT.mutation(api.listings.lockListing, {
				listingId,
				userId,
			})
		).rejects.toThrow("Broker or admin privileges required");
	});

	test("should reject lock listing without authentication", async () => {
		const t = createTest();
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);
		const userId = await createTestUser(t, "locker");

		await expect(
			t.mutation(api.listings.lockListing, {
				listingId,
				userId,
			})
		).rejects.toThrow("Authentication required");
	});
});

describe("unlockListing - RBAC Authorization", () => {
	test("should unlock listing with broker role", async () => {
		const t = createTest();
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const ownerUserId = await createTestUser(t, "owner");
		const listingId = await createTestListing(t, mortgageId, {
			locked: true,
			lockedBy: ownerUserId,
		});

		const brokerUserId = await createTestUser(t, "broker");
		const brokerIdpId = await getUserIdpId(t, brokerUserId);
		const brokerT = t.withIdentity({
			subject: brokerIdpId,
			role: "broker",
		});

		const result = await brokerT.mutation(api.listings.unlockListing, {
			listingId,
			userId: brokerUserId,
		});

		expect(result).toBe(listingId);
		const listing = await t.run(async (ctx) => ctx.db.get(listingId));
		expect(listing?.locked).toBe(false);
	});

	test("should unlock listing with admin role", async () => {
		const t = createTest();
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const ownerUserId = await createTestUser(t, "owner");
		const listingId = await createTestListing(t, mortgageId, {
			locked: true,
			lockedBy: ownerUserId,
		});

		const adminUserId = await createTestUser(t, "admin");
		const adminIdpId = await getUserIdpId(t, adminUserId);
		const adminT = t.withIdentity({
			subject: adminIdpId,
			role: "admin",
		});

		const result = await adminT.mutation(api.listings.unlockListing, {
			listingId,
			userId: adminUserId,
		});

		expect(result).toBe(listingId);
		const listing = await t.run(async (ctx) => ctx.db.get(listingId));
		expect(listing?.locked).toBe(false);
	});

	test("should unlock listing with owner role (even if not broker/admin)", async () => {
		const t = createTest();
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const ownerUserId = await createTestUser(t, "owner");
		const listingId = await createTestListing(t, mortgageId, {
			locked: true,
			lockedBy: ownerUserId,
		});

		const ownerIdpId = await getUserIdpId(t, ownerUserId);
		const ownerT = t.withIdentity({
			subject: ownerIdpId,
			role: "investor", // Owner can unlock even if not broker/admin
		});

		const result = await ownerT.mutation(api.listings.unlockListing, {
			listingId,
			userId: ownerUserId,
		});

		expect(result).toBe(listingId);
		const listing = await t.run(async (ctx) => ctx.db.get(listingId));
		expect(listing?.locked).toBe(false);
	});

	test("should reject unlock listing with investor role (not owner)", async () => {
		const t = createTest();
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const ownerUserId = await createTestUser(t, "owner");
		const investorUserId = await createTestUser(t, "investor");
		const listingId = await createTestListing(t, mortgageId, {
			locked: true,
			lockedBy: ownerUserId,
		});

		const investorIdpId = await getUserIdpId(t, investorUserId);
		const investorT = t.withIdentity({
			subject: investorIdpId,
			role: "investor",
		});

		await expect(
			investorT.mutation(api.listings.unlockListing, {
				listingId,
				userId: investorUserId,
			})
		).rejects.toThrow(
			"Unauthorized: Only the user who locked this listing, a broker, or an admin can unlock it"
		);
	});

	test("should reject unlock listing without authentication", async () => {
		const t = createTest();
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const userId = await createTestUser(t, "locker");
		const listingId = await createTestListing(t, mortgageId, {
			locked: true,
			lockedBy: userId,
		});

		await expect(
			t.mutation(api.listings.unlockListing, {
				listingId,
				userId,
			})
		).rejects.toThrow("Authentication required");
	});
});

describe("updateListing - RBAC Authorization", () => {
	test("should update listing with broker role", async () => {
		const t = createTest();
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);

		const brokerT = t.withIdentity({
			subject: "broker-user-123",
			role: "broker",
		});

		const result = await brokerT.mutation(api.listings.updateListing, {
			listingId,
			visible: false,
		});

		expect(result).toBe(listingId);
		const listing = await t.run(async (ctx) => ctx.db.get(listingId));
		expect(listing?.visible).toBe(false);
	});

	test("should update listing with admin role", async () => {
		const t = createTest();
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);

		const adminT = t.withIdentity({
			subject: "admin-user-123",
			role: "admin",
		});

		const result = await adminT.mutation(api.listings.updateListing, {
			listingId,
			visible: false,
		});

		expect(result).toBe(listingId);
		const listing = await t.run(async (ctx) => ctx.db.get(listingId));
		expect(listing?.visible).toBe(false);
	});

	test("should reject update listing with investor role", async () => {
		const t = createTest();
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);

		const investorT = t.withIdentity({
			subject: "investor-user-123",
			role: "investor",
		});

		await expect(
			investorT.mutation(api.listings.updateListing, {
				listingId,
				visible: false,
			})
		).rejects.toThrow("Broker or admin privileges are required");
	});

	test("should reject update listing without authentication", async () => {
		const t = createTest();
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);

		await expect(
			t.mutation(api.listings.updateListing, {
				listingId,
				visible: false,
			})
		).rejects.toThrow("Authentication required");
	});
});

describe("deleteListing - RBAC Authorization", () => {
	test("should delete listing with broker role", async () => {
		const t = createTest();
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);

		const brokerT = t.withIdentity({
			subject: "broker-user-123",
			role: "broker",
		});

		const result = await brokerT.mutation(api.listings.deleteListing, {
			listingId,
		});

		expect(result).toBe(listingId);
		const listing = await t.run(async (ctx) => ctx.db.get(listingId));
		expect(listing).toBeNull();
	});

	test("should delete listing with admin role", async () => {
		const t = createTest();
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);

		const adminT = t.withIdentity({
			subject: "admin-user-123",
			role: "admin",
		});

		const result = await adminT.mutation(api.listings.deleteListing, {
			listingId,
		});

		expect(result).toBe(listingId);
		const listing = await t.run(async (ctx) => ctx.db.get(listingId));
		expect(listing).toBeNull();
	});

	test("should reject delete listing with investor role", async () => {
		const t = createTest();
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);

		const investorT = t.withIdentity({
			subject: "investor-user-123",
			role: "investor",
		});

		await expect(
			investorT.mutation(api.listings.deleteListing, {
				listingId,
			})
		).rejects.toThrow("Broker or admin privileges are required");
	});

	test("should reject delete listing without authentication", async () => {
		const t = createTest();
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);

		await expect(
			t.mutation(api.listings.deleteListing, {
				listingId,
			})
		).rejects.toThrow("Authentication required");
	});
});

describe("createFromPayload - RBAC Authorization", () => {
	test("should create from payload with broker role", async () => {
		const t = createTest();
		const borrowerId = await createTestBorrower(t);

		const brokerT = t.withIdentity({
			subject: "broker-user-123",
			role: "broker",
		});

		const result = await brokerT.mutation(api.listings.createFromPayload, {
			borrower: {
				name: "Test Borrower",
				email: `test_${Date.now()}@example.com`,
				rotessaCustomerId: `rotessa_${Date.now()}`,
			},
			mortgage: {
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
			},
			listing: {
				visible: true,
			},
			comparables: [],
		});

		expect(result.created).toBe(true);
		expect(result.borrowerId).toBeDefined();
		expect(result.mortgageId).toBeDefined();
		expect(result.listingId).toBeDefined();
	});

	test("should create from payload with admin role", async () => {
		const t = createTest();

		const adminT = t.withIdentity({
			subject: "admin-user-123",
			role: "admin",
		});

		const result = await adminT.mutation(api.listings.createFromPayload, {
			borrower: {
				name: "Test Borrower",
				email: `test_${Date.now()}@example.com`,
				rotessaCustomerId: `rotessa_${Date.now()}`,
			},
			mortgage: {
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
			},
			listing: {
				visible: true,
			},
			comparables: [],
		});

		expect(result.created).toBe(true);
	});

	test("should reject create from payload with investor role", async () => {
		const t = createTest();

		const investorT = t.withIdentity({
			subject: "investor-user-123",
			role: "investor",
		});

		await expect(
			investorT.mutation(api.listings.createFromPayload, {
				borrower: {
					name: "Test Borrower",
					email: `test_${Date.now()}@example.com`,
					rotessaCustomerId: `rotessa_${Date.now()}`,
				},
				mortgage: {
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
				},
				listing: {
					visible: true,
				},
				comparables: [],
			})
		).rejects.toThrow("Broker or admin privileges are required");
	});

	test("should reject create from payload without authentication", async () => {
		const t = createTest();

		await expect(
			t.mutation(api.listings.createFromPayload, {
				borrower: {
					name: "Test Borrower",
					email: `test_${Date.now()}@example.com`,
					rotessaCustomerId: `rotessa_${Date.now()}`,
				},
				mortgage: {
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
				},
				listing: {
					visible: true,
				},
				comparables: [],
			})
		).rejects.toThrow("Authentication required");
	});
});

// ============================================================================
// Ownership Mutations RBAC Tests
// ============================================================================

describe("createOwnership - RBAC Authorization", () => {
	test("should create ownership with broker role", async () => {
		const t = createTest();
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const userId = await createTestUser(t, "investor");

		const brokerT = t.withIdentity({
			subject: "broker-user-123",
			role: "broker",
		});

		const ownershipId = await brokerT.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: userId,
			ownershipPercentage: 25,
		});

		expect(ownershipId).toBeDefined();
		const ownership = await t.run(async (ctx) => ctx.db.get(ownershipId));
		expect(ownership?.mortgageId).toBe(mortgageId);
		expect(ownership?.ownerId).toBe(userId);
		expect(ownership?.ownershipPercentage).toBe(25);
	});

	test("should create ownership with admin role", async () => {
		const t = createTest();
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const userId = await createTestUser(t, "investor");

		const adminT = t.withIdentity({
			subject: "admin-user-123",
			role: "admin",
		});

		const ownershipId = await adminT.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: userId,
			ownershipPercentage: 25,
		});

		expect(ownershipId).toBeDefined();
		const ownership = await t.run(async (ctx) => ctx.db.get(ownershipId));
		expect(ownership?.ownershipPercentage).toBe(25);
	});

	test("should reject create ownership with investor role", async () => {
		const t = createTest();
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const userId = await createTestUser(t, "investor");

		const investorT = t.withIdentity({
			subject: "investor-user-123",
			role: "investor",
		});

		await expect(
			investorT.mutation(api.ownership.createOwnership, {
				mortgageId,
				ownerId: userId,
				ownershipPercentage: 25,
			})
		).rejects.toThrow("Broker or admin privileges required");
	});

	test("should reject create ownership without authentication", async () => {
		const t = createTest();
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const userId = await createTestUser(t, "investor");

		await expect(
			t.mutation(api.ownership.createOwnership, {
				mortgageId,
				ownerId: userId,
				ownershipPercentage: 25,
			})
		).rejects.toThrow("Authentication required");
	});
});

describe("updateOwnershipPercentage - RBAC Authorization", () => {
	test("should update ownership percentage with broker role", async () => {
		const t = createTest();
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const userId = await createTestUser(t, "investor");

		const brokerT = t.withIdentity({
			subject: "broker-user-123",
			role: "broker",
		});

		// Create initial ownership using the mutation (properly handles FairLend ownership)
		const ownershipId = await brokerT.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: userId,
			ownershipPercentage: 25,
		});

		const result = await brokerT.mutation(
			api.ownership.updateOwnershipPercentage,
			{
				id: ownershipId,
				ownershipPercentage: 50,
			}
		);

		expect(result).toBe(ownershipId);
		const ownership = await t.run(async (ctx) => ctx.db.get(ownershipId));
		expect(ownership?.ownershipPercentage).toBe(50);
	});

	test("should update ownership percentage with admin role", async () => {
		const t = createTest();
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const userId = await createTestUser(t, "investor");

		const adminT = t.withIdentity({
			subject: "admin-user-123",
			role: "admin",
		});

		// Create initial ownership using the mutation (properly handles FairLend ownership)
		const ownershipId = await adminT.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: userId,
			ownershipPercentage: 25,
		});

		const result = await adminT.mutation(
			api.ownership.updateOwnershipPercentage,
			{
				id: ownershipId,
				ownershipPercentage: 50,
			}
		);

		expect(result).toBe(ownershipId);
		const ownership = await t.run(async (ctx) => ctx.db.get(ownershipId));
		expect(ownership?.ownershipPercentage).toBe(50);
	});

	test("should reject update ownership percentage with investor role", async () => {
		const t = createTest();
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const userId = await createTestUser(t, "investor");

		const brokerT = t.withIdentity({
			subject: "broker-user-123",
			role: "broker",
		});

		// Create initial ownership using the mutation (properly handles FairLend ownership)
		const ownershipId = await brokerT.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: userId,
			ownershipPercentage: 25,
		});

		const investorT = t.withIdentity({
			subject: "investor-user-123",
			role: "investor",
		});

		await expect(
			investorT.mutation(api.ownership.updateOwnershipPercentage, {
				id: ownershipId,
				ownershipPercentage: 50,
			})
		).rejects.toThrow("Broker or admin privileges required");
	});

	test("should reject update ownership percentage without authentication", async () => {
		const t = createTest();
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const userId = await createTestUser(t, "investor");

		const brokerT = t.withIdentity({
			subject: "broker-user-123",
			role: "broker",
		});

		// Create initial ownership using the mutation (properly handles FairLend ownership)
		const ownershipId = await brokerT.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: userId,
			ownershipPercentage: 25,
		});

		await expect(
			t.mutation(api.ownership.updateOwnershipPercentage, {
				id: ownershipId,
				ownershipPercentage: 50,
			})
		).rejects.toThrow("Authentication required");
	});
});

describe("transferOwnership - RBAC Authorization", () => {
	test("should transfer ownership with broker role", async () => {
		const t = createTest();
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const userId1 = await createTestUser(t, "investor1");
		const userId2 = await createTestUser(t, "investor2");

		// Create initial ownership
		const ownershipId = await t.run(async (ctx) => {
			const ownership = await ctx.db.insert("mortgage_ownership", {
				mortgageId,
				ownerId: userId1,
				ownershipPercentage: 25,
			});
			// Update FairLend ownership
			const fairlendOwnership = await ctx.db
				.query("mortgage_ownership")
				.withIndex("by_mortgage_owner", (q) =>
					q.eq("mortgageId", mortgageId).eq("ownerId", "fairlend")
				)
				.first();
			if (fairlendOwnership) {
				await ctx.db.patch(fairlendOwnership._id, {
					ownershipPercentage: 75,
				});
			}
			return ownership;
		});

		const brokerT = t.withIdentity({
			subject: "broker-user-123",
			role: "broker",
		});

		const result = await brokerT.mutation(api.ownership.transferOwnership, {
			id: ownershipId,
			newOwnerId: userId2,
		});

		expect(result).toBe(ownershipId);
		const ownership = await t.run(async (ctx) => ctx.db.get(ownershipId));
		expect(ownership?.ownerId).toBe(userId2);
	});

	test("should transfer ownership with admin role", async () => {
		const t = createTest();
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const userId1 = await createTestUser(t, "investor1");
		const userId2 = await createTestUser(t, "investor2");

		// Create initial ownership
		const ownershipId = await t.run(async (ctx) => {
			const ownership = await ctx.db.insert("mortgage_ownership", {
				mortgageId,
				ownerId: userId1,
				ownershipPercentage: 25,
			});
			// Update FairLend ownership
			const fairlendOwnership = await ctx.db
				.query("mortgage_ownership")
				.withIndex("by_mortgage_owner", (q) =>
					q.eq("mortgageId", mortgageId).eq("ownerId", "fairlend")
				)
				.first();
			if (fairlendOwnership) {
				await ctx.db.patch(fairlendOwnership._id, {
					ownershipPercentage: 75,
				});
			}
			return ownership;
		});

		const adminT = t.withIdentity({
			subject: "admin-user-123",
			role: "admin",
		});

		const result = await adminT.mutation(api.ownership.transferOwnership, {
			id: ownershipId,
			newOwnerId: userId2,
		});

		expect(result).toBe(ownershipId);
		const ownership = await t.run(async (ctx) => ctx.db.get(ownershipId));
		expect(ownership?.ownerId).toBe(userId2);
	});

	test("should reject transfer ownership with investor role", async () => {
		const t = createTest();
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const userId1 = await createTestUser(t, "investor1");
		const userId2 = await createTestUser(t, "investor2");

		// Create initial ownership
		const ownershipId = await t.run(async (ctx) => {
			const ownership = await ctx.db.insert("mortgage_ownership", {
				mortgageId,
				ownerId: userId1,
				ownershipPercentage: 25,
			});
			// Update FairLend ownership
			const fairlendOwnership = await ctx.db
				.query("mortgage_ownership")
				.withIndex("by_mortgage_owner", (q) =>
					q.eq("mortgageId", mortgageId).eq("ownerId", "fairlend")
				)
				.first();
			if (fairlendOwnership) {
				await ctx.db.patch(fairlendOwnership._id, {
					ownershipPercentage: 75,
				});
			}
			return ownership;
		});

		const investorT = t.withIdentity({
			subject: "investor-user-123",
			role: "investor",
		});

		await expect(
			investorT.mutation(api.ownership.transferOwnership, {
				id: ownershipId,
				newOwnerId: userId2,
			})
		).rejects.toThrow("Broker or admin privileges required");
	});

	test("should reject transfer ownership without authentication", async () => {
		const t = createTest();
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const userId1 = await createTestUser(t, "investor1");
		const userId2 = await createTestUser(t, "investor2");

		// Create initial ownership
		const ownershipId = await t.run(async (ctx) => {
			const ownership = await ctx.db.insert("mortgage_ownership", {
				mortgageId,
				ownerId: userId1,
				ownershipPercentage: 25,
			});
			// Update FairLend ownership
			const fairlendOwnership = await ctx.db
				.query("mortgage_ownership")
				.withIndex("by_mortgage_owner", (q) =>
					q.eq("mortgageId", mortgageId).eq("ownerId", "fairlend")
				)
				.first();
			if (fairlendOwnership) {
				await ctx.db.patch(fairlendOwnership._id, {
					ownershipPercentage: 75,
				});
			}
			return ownership;
		});

		await expect(
			t.mutation(api.ownership.transferOwnership, {
				id: ownershipId,
				newOwnerId: userId2,
			})
		).rejects.toThrow("Authentication required");
	});
});

describe("deleteOwnership - RBAC Authorization", () => {
	test("should delete ownership with broker role", async () => {
		const t = createTest();
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const userId = await createTestUser(t, "investor");

		// Create initial ownership
		const ownershipId = await t.run(async (ctx) => {
			const ownership = await ctx.db.insert("mortgage_ownership", {
				mortgageId,
				ownerId: userId,
				ownershipPercentage: 25,
			});
			// Update FairLend ownership
			const fairlendOwnership = await ctx.db
				.query("mortgage_ownership")
				.withIndex("by_mortgage_owner", (q) =>
					q.eq("mortgageId", mortgageId).eq("ownerId", "fairlend")
				)
				.first();
			if (fairlendOwnership) {
				await ctx.db.patch(fairlendOwnership._id, {
					ownershipPercentage: 75,
				});
			}
			return ownership;
		});

		const brokerT = t.withIdentity({
			subject: "broker-user-123",
			role: "broker",
		});

		const result = await brokerT.mutation(api.ownership.deleteOwnership, {
			id: ownershipId,
		});

		expect(result).toBe(ownershipId);
		const ownership = await t.run(async (ctx) => ctx.db.get(ownershipId));
		expect(ownership).toBeNull();
	});

	test("should delete ownership with admin role", async () => {
		const t = createTest();
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const userId = await createTestUser(t, "investor");

		// Create initial ownership
		const ownershipId = await t.run(async (ctx) => {
			const ownership = await ctx.db.insert("mortgage_ownership", {
				mortgageId,
				ownerId: userId,
				ownershipPercentage: 25,
			});
			// Update FairLend ownership
			const fairlendOwnership = await ctx.db
				.query("mortgage_ownership")
				.withIndex("by_mortgage_owner", (q) =>
					q.eq("mortgageId", mortgageId).eq("ownerId", "fairlend")
				)
				.first();
			if (fairlendOwnership) {
				await ctx.db.patch(fairlendOwnership._id, {
					ownershipPercentage: 75,
				});
			}
			return ownership;
		});

		const adminT = t.withIdentity({
			subject: "admin-user-123",
			role: "admin",
		});

		const result = await adminT.mutation(api.ownership.deleteOwnership, {
			id: ownershipId,
		});

		expect(result).toBe(ownershipId);
		const ownership = await t.run(async (ctx) => ctx.db.get(ownershipId));
		expect(ownership).toBeNull();
	});

	test("should reject delete ownership with investor role", async () => {
		const t = createTest();
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const userId = await createTestUser(t, "investor");

		// Create initial ownership
		const ownershipId = await t.run(async (ctx) => {
			const ownership = await ctx.db.insert("mortgage_ownership", {
				mortgageId,
				ownerId: userId,
				ownershipPercentage: 25,
			});
			// Update FairLend ownership
			const fairlendOwnership = await ctx.db
				.query("mortgage_ownership")
				.withIndex("by_mortgage_owner", (q) =>
					q.eq("mortgageId", mortgageId).eq("ownerId", "fairlend")
				)
				.first();
			if (fairlendOwnership) {
				await ctx.db.patch(fairlendOwnership._id, {
					ownershipPercentage: 75,
				});
			}
			return ownership;
		});

		const investorT = t.withIdentity({
			subject: "investor-user-123",
			role: "investor",
		});

		await expect(
			investorT.mutation(api.ownership.deleteOwnership, {
				id: ownershipId,
			})
		).rejects.toThrow("Broker or admin privileges required");
	});

	test("should reject delete ownership without authentication", async () => {
		const t = createTest();
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const userId = await createTestUser(t, "investor");

		// Create initial ownership
		const ownershipId = await t.run(async (ctx) => {
			const ownership = await ctx.db.insert("mortgage_ownership", {
				mortgageId,
				ownerId: userId,
				ownershipPercentage: 25,
			});
			// Update FairLend ownership
			const fairlendOwnership = await ctx.db
				.query("mortgage_ownership")
				.withIndex("by_mortgage_owner", (q) =>
					q.eq("mortgageId", mortgageId).eq("ownerId", "fairlend")
				)
				.first();
			if (fairlendOwnership) {
				await ctx.db.patch(fairlendOwnership._id, {
					ownershipPercentage: 75,
				});
			}
			return ownership;
		});

		await expect(
			t.mutation(api.ownership.deleteOwnership, {
				id: ownershipId,
			})
		).rejects.toThrow("Authentication required");
	});
});

