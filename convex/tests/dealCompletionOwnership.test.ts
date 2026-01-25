// @vitest-environment node
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import schema from "../schema";

process.env.OWNERSHIP_LEDGER_SOURCE = "legacy";

// @ts-ignore
const modules = import.meta.glob("../**/*.{ts,js,tsx,jsx}", { eager: false });
const createTest = () => convexTest(schema, modules);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get an authenticated test instance with admin role
 * Ensures the admin user exists in the database
 */
async function getAdminTest(t: ReturnType<typeof createTest>) {
	// First ensure admin user exists
	const adminIdpId = "test-admin-user";
	await t.run(async (ctx) => {
		const existingAdmin = await ctx.db
			.query("users")
			.withIndex("by_idp_id", (q) => q.eq("idp_id", adminIdpId))
			.first();

		if (!existingAdmin) {
			await ctx.db.insert("users", {
				idp_id: adminIdpId,
				email: "admin@test.example.com",
				email_verified: true,
				first_name: "Test",
				last_name: "Admin",
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				metadata: {
					testUser: true,
					role: "admin",
				},
			});
		}
	});

	return t.withIdentity({
		subject: adminIdpId,
		role: "admin",
	});
}

/**
 * Create a test user and return both ID and idp_id
 */
async function createTestUser(
	t: ReturnType<typeof createTest>,
	userIdentifier: string,
	role = "investor"
) {
	const idp_id = `test_${userIdentifier}`;
	const userId = await t.run(
		async (ctx) =>
			await ctx.db.insert("users", {
				idp_id,
				email: `${userIdentifier}@test.example.com`,
				email_verified: true,
				first_name: "Test",
				last_name: userIdentifier,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				metadata: {
					testUser: true,
					role,
				},
			})
	);
	return { userId, idp_id };
}

/**
 * Create a test borrower
 */
async function createTestBorrower(t: ReturnType<typeof createTest>) {
	return await t.run(
		async (ctx) =>
			await ctx.db.insert("borrowers", {
				name: "Test Borrower",
				email: `test_borrower_${Date.now()}@example.com`,
				rotessaCustomerId: `rotessa_${Date.now()}`,
			})
	);
}

/**
 * Create a test mortgage with FairLend ownership
 */
async function createTestMortgage(t: ReturnType<typeof createTest>) {
	const borrowerId = await createTestBorrower(t);

	// Use admin credentials to create mortgage
	const adminT = await getAdminTest(t);
	const mortgageId = await adminT.mutation(api.mortgages.createMortgage, {
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

/**
 * Create a test listing for a mortgage
 */
async function createTestListing(
	t: ReturnType<typeof createTest>,
	mortgageId: Id<"mortgages">
) {
	const adminT = await getAdminTest(t);
	return await adminT.mutation(api.listings.createListing, {
		mortgageId,
	});
}

/**
 * Create a lock request for a listing
 */
async function createLockRequest(
	t: ReturnType<typeof createTest>,
	listingId: Id<"listings">,
	investorIdpId: string
) {
	// Create lock request as investor
	const investorT = t.withIdentity({
		subject: investorIdpId,
		role: "investor",
	});

	return await investorT.mutation(api.lockRequests.createLockRequest, {
		listingId,
		lawyerName: "Test Lawyer",
		lawyerLSONumber: "12345",
		lawyerEmail: "lawyer@test.com",
		requestNotes: "Test lock request",
	});
}

/**
 * Approve a lock request
 */
async function approveLockRequest(
	t: ReturnType<typeof createTest>,
	lockRequestId: Id<"lock_requests">
) {
	const adminT = await getAdminTest(t);
	await adminT.mutation(api.lockRequests.approveLockRequest, {
		requestId: lockRequestId,
	});
}

/**
 * Create a full deal workflow: mortgage → listing → lock request → approval → deal
 */
async function createCompleteDealSetup(t: ReturnType<typeof createTest>) {
	// Create mortgage and listing
	const { mortgageId } = await createTestMortgage(t);
	const listingId = await createTestListing(t, mortgageId);

	// Create investor
	const { userId: investorId, idp_id: investorIdpId } = await createTestUser(
		t,
		`investor_${Date.now()}`
	);

	// Create and approve lock request
	const lockRequestId = await createLockRequest(t, listingId, investorIdpId);
	await approveLockRequest(t, lockRequestId);

	// Create deal
	const adminT = await getAdminTest(t);
	const result = await adminT.action(api.deals.createDeal, {
		lockRequestId,
	});
	const dealId = result.dealId;

	return { dealId, mortgageId, listingId, lockRequestId, investorId };
}

/**
 * Move deal to completed state (through all workflow stages)
 */
async function moveDealToCompleted(
	t: ReturnType<typeof createTest>,
	dealId: Id<"deals">
) {
	const adminT = await getAdminTest(t);

	// Progress through all states to completed
	await adminT.mutation(api.deals.transitionDealState, {
		dealId,
		event: { type: "CONFIRM_LAWYER" },
	});

	await adminT.mutation(api.deals.transitionDealState, {
		dealId,
		event: { type: "COMPLETE_DOCS" },
	});

	await adminT.mutation(api.deals.transitionDealState, {
		dealId,
		event: { type: "RECEIVE_FUNDS" },
	});

	await adminT.mutation(api.deals.transitionDealState, {
		dealId,
		event: { type: "VERIFY_FUNDS" },
	});

	await adminT.mutation(api.deals.transitionDealState, {
		dealId,
		event: { type: "COMPLETE_DEAL" },
	});
}

/**
 * Get FairLend's ownership for a mortgage
 */
async function getFairlendOwnership(
	t: ReturnType<typeof createTest>,
	mortgageId: Id<"mortgages">
) {
	const ownership = await t.run(
		async (ctx) =>
			await ctx.db
				.query("mortgage_ownership")
				.withIndex("by_mortgage_owner", (q) =>
					q.eq("mortgageId", mortgageId).eq("ownerId", "fairlend")
				)
				.first()
	);
	return ownership;
}

/**
 * Get investor's ownership for a mortgage
 */
async function getInvestorOwnership(
	t: ReturnType<typeof createTest>,
	mortgageId: Id<"mortgages">,
	investorId: Id<"users">
) {
	const ownership = await t.run(
		async (ctx) =>
			await ctx.db
				.query("mortgage_ownership")
				.withIndex("by_mortgage_owner", (q) =>
					q.eq("mortgageId", mortgageId).eq("ownerId", investorId)
				)
				.first()
	);
	return ownership;
}

/**
 * Verify total ownership equals expected percentage
 */
async function verifyTotalOwnership(
	t: ReturnType<typeof createTest>,
	mortgageId: Id<"mortgages">,
	expectedTotal = 100
) {
	const adminT = await getAdminTest(t);
	const result = await adminT.action(api.ownership.getTotalOwnership, {
		mortgageId,
	});

	// biome-ignore lint/suspicious/noMisplacedAssertion: helper executed within tests
	expect(result.totalPercentage).toBeCloseTo(expectedTotal, 2);
	// biome-ignore lint/suspicious/noMisplacedAssertion: helper executed within tests
	expect(result.isValid).toBe(Math.abs(result.totalPercentage - 100) < 0.01);

	return result;
}

// ============================================================================
// Deal Completion Ownership Tests
// ============================================================================

describe("completeDeal ownership transfer", () => {
	test("should transfer 100% ownership from FairLend to investor on deal completion", async () => {
		const t = createTest();
		const { dealId, mortgageId, investorId } = await createCompleteDealSetup(t);

		// Move deal to completed state
		await moveDealToCompleted(t, dealId);

		// Verify FairLend has 100% ownership before transfer
		const fairlendBefore = await getFairlendOwnership(t, mortgageId);
		expect(fairlendBefore).toBeTruthy();
		expect(fairlendBefore?.ownershipPercentage).toBe(100);

		// Complete deal (transfer ownership)
		const adminT = await getAdminTest(t);
		await adminT.mutation(api.deals.completeDeal, {
			dealId,
		});

		// Verify investor now has 100% ownership
		const investorOwnership = await getInvestorOwnership(
			t,
			mortgageId,
			investorId
		);
		expect(investorOwnership).toBeTruthy();
		expect(investorOwnership?.ownershipPercentage).toBe(100);

		// Verify FairLend ownership is removed (0%)
		const fairlendAfter = await getFairlendOwnership(t, mortgageId);
		expect(fairlendAfter).toBeNull();

		// Verify total ownership is still 100%
		await verifyTotalOwnership(t, mortgageId, 100);
	});

	test("should maintain 100% ownership invariant after transfer", async () => {
		const t = createTest();
		const { dealId, mortgageId, investorId } = await createCompleteDealSetup(t);

		// Verify 100% before
		await verifyTotalOwnership(t, mortgageId, 100);

		// Complete workflow
		await moveDealToCompleted(t, dealId);
		const adminT = await getAdminTest(t);
		await adminT.mutation(api.deals.completeDeal, {
			dealId,
		});

		// Verify 100% after
		const total = await verifyTotalOwnership(t, mortgageId, 100);
		expect(total.owners).toBe(1); // Only investor
		expect(total.breakdown).toHaveLength(1);
		expect(total.breakdown[0]).toEqual({
			ownerId: investorId,
			percentage: 100,
		});
	});

	test("should set completedAt timestamp after ownership transfer", async () => {
		const t = createTest();
		const { dealId } = await createCompleteDealSetup(t);

		await moveDealToCompleted(t, dealId);

		const adminT = await getAdminTest(t);

		// Get deal before completion
		const dealBefore = await adminT.query(api.deals.getDeal, { dealId });
		expect(dealBefore?.completedAt).toBeUndefined();

		// Complete deal
		await adminT.mutation(api.deals.completeDeal, {
			dealId,
		});

		// Get deal after completion
		const dealAfter = await adminT.query(api.deals.getDeal, { dealId });
		expect(dealAfter?.completedAt).toBeTruthy();
		expect(typeof dealAfter?.completedAt).toBe("number");
		expect(dealAfter?.completedAt).toBeGreaterThan(0);
	});

	test("should create ownership record with correct percentage", async () => {
		const t = createTest();
		const { dealId, mortgageId, investorId } = await createCompleteDealSetup(t);

		await moveDealToCompleted(t, dealId);

		const adminT = await getAdminTest(t);
		await adminT.mutation(api.deals.completeDeal, {
			dealId,
		});

		// Get the ownership record
		const ownership = await getInvestorOwnership(t, mortgageId, investorId);
		expect(ownership).toBeTruthy();
		expect(ownership?.mortgageId).toBe(mortgageId);
		expect(ownership?.ownerId).toBe(investorId);
		expect(ownership?.ownershipPercentage).toBe(100);
	});

	test("should create alerts for both admin and investor on completion", async () => {
		const t = createTest();
		const { dealId, investorId } = await createCompleteDealSetup(t);

		await moveDealToCompleted(t, dealId);

		const adminT = await getAdminTest(t);
		const adminUserId = await t.run(async (ctx) => {
			const user = await ctx.db
				.query("users")
				.withIndex("by_idp_id", (q) => q.eq("idp_id", "test-admin-user"))
				.first();
			return user?._id;
		});

		await adminT.mutation(api.deals.completeDeal, {
			dealId,
		});

		// Get alerts for admin
		const adminAlerts = await t.run(
			async (ctx) =>
				await ctx.db
					.query("alerts")
					.filter((q) =>
						q.and(
							q.eq(q.field("userId"), adminUserId),
							q.eq(q.field("type"), "deal_completed"),
							q.eq(q.field("relatedDealId"), dealId)
						)
					)
					.collect()
		);

		expect(adminAlerts.length).toBeGreaterThan(0);
		expect(adminAlerts[0]?.severity).toBe("info");
		expect(adminAlerts[0]?.title).toBe("Deal Completed");

		// Get alerts for investor
		const investorAlerts = await t.run(
			async (ctx) =>
				await ctx.db
					.query("alerts")
					.filter((q) =>
						q.and(
							q.eq(q.field("userId"), investorId),
							q.eq(q.field("type"), "deal_completed"),
							q.eq(q.field("relatedDealId"), dealId)
						)
					)
					.collect()
		);

		expect(investorAlerts.length).toBeGreaterThan(0);
		expect(investorAlerts[0]?.severity).toBe("info");
		expect(investorAlerts[0]?.title).toBe("Your Deal Is Complete!");
	});
});

// ============================================================================
// Error Condition Tests
// ============================================================================

describe("completeDeal error conditions", () => {
	test("should reject completion if deal not in completed state", async () => {
		const t = createTest();
		const { dealId } = await createCompleteDealSetup(t);

		// Deal is in "locked" state, not "completed"
		const adminT = await getAdminTest(t);
		await expect(
			adminT.mutation(api.deals.completeDeal, {
				dealId,
			})
		).rejects.toThrow(
			"Deal must be in completed state before transferring ownership"
		);
	});

	test("should reject completion if ownership already transferred", async () => {
		const t = createTest();
		const { dealId } = await createCompleteDealSetup(t);

		await moveDealToCompleted(t, dealId);

		const adminT = await getAdminTest(t);

		// Complete deal first time
		await adminT.mutation(api.deals.completeDeal, {
			dealId,
		});

		// Try to complete again
		await expect(
			adminT.mutation(api.deals.completeDeal, {
				dealId,
			})
		).rejects.toThrow("Ownership has already been transferred for this deal");
	});

	test("should reject completion if deal doesn't exist", async () => {
		const t = createTest();
		const { dealId } = await createCompleteDealSetup(t);

		// Delete the deal
		await t.run(async (ctx) => {
			await ctx.db.delete(dealId);
		});

		const adminT = await getAdminTest(t);
		await expect(
			adminT.mutation(api.deals.completeDeal, {
				dealId,
			})
		).rejects.toThrow("Deal not found");
	});

	test("should require admin privileges for completion", async () => {
		const t = createTest();
		const { dealId } = await createCompleteDealSetup(t);

		await moveDealToCompleted(t, dealId);

		// Try as non-admin user
		const investorT = t.withIdentity({
			subject: "test-investor-user",
			role: "investor",
		});

		await expect(
			investorT.mutation(api.deals.completeDeal, {
				dealId,
			})
		).rejects.toThrow("Unauthorized: Admin privileges required");
	});
});

// ============================================================================
// Integration Tests
// ============================================================================

describe("completeDeal integration scenarios", () => {
	test("should handle full deal lifecycle from creation to ownership transfer", async () => {
		const t = createTest();

		// 1. Create mortgage
		const { mortgageId } = await createTestMortgage(t);

		// Verify FairLend has 100%
		const initialOwnership = await getFairlendOwnership(t, mortgageId);
		expect(initialOwnership?.ownershipPercentage).toBe(100);

		// 2. Create listing
		const listingId = await createTestListing(t, mortgageId);

		// 3. Create investor and lock request
		const { userId: investorId, idp_id: investorIdpId } = await createTestUser(
			t,
			`investor_${Date.now()}`
		);
		const lockRequestId = await createLockRequest(t, listingId, investorIdpId);

		// 4. Approve lock request and create deal
		await approveLockRequest(t, lockRequestId);
		const adminT = await getAdminTest(t);
		const result = await adminT.action(api.deals.createDeal, {
			lockRequestId,
		});
		const dealId = result.dealId;

		// Verify deal is in "locked" state
		const dealAfterCreation = await adminT.query(api.deals.getDeal, { dealId });
		expect(dealAfterCreation?.currentState).toBe("locked");

		// 5. Progress through workflow
		await moveDealToCompleted(t, dealId);

		// Verify deal is in "completed" state
		const dealAfterWorkflow = await adminT.query(api.deals.getDeal, { dealId });
		expect(dealAfterWorkflow?.currentState).toBe("completed");
		expect(dealAfterWorkflow?.completedAt).toBeUndefined(); // Not yet transferred

		// 6. Transfer ownership
		await adminT.mutation(api.deals.completeDeal, {
			dealId,
		});

		// Verify final state
		const finalDeal = await adminT.query(api.deals.getDeal, { dealId });
		expect(finalDeal?.completedAt).toBeTruthy();

		// Verify ownership transferred
		const investorOwnership = await getInvestorOwnership(
			t,
			mortgageId,
			investorId
		);
		expect(investorOwnership?.ownershipPercentage).toBe(100);

		const fairlendOwnership = await getFairlendOwnership(t, mortgageId);
		expect(fairlendOwnership).toBeNull();

		// Verify 100% invariant
		await verifyTotalOwnership(t, mortgageId, 100);
	});

	test("should handle concurrent ownership operations correctly", async () => {
		const t = createTest();

		// Create two separate deals for the same mortgage (should fail)
		const { mortgageId } = await createTestMortgage(t);
		const listingId = await createTestListing(t, mortgageId);

		const { userId: investor1, idp_id: investor1IdpId } = await createTestUser(
			t,
			`investor_1_${Date.now()}`
		);
		const { userId: investor2, idp_id: investor2IdpId } = await createTestUser(
			t,
			`investor_2_${Date.now()}`
		);

		const lock1 = await createLockRequest(t, listingId, investor1IdpId);
		const lock2 = await createLockRequest(t, listingId, investor2IdpId);

		await approveLockRequest(t, lock1);

		const adminT = await getAdminTest(t);
		const result1 = await adminT.action(api.deals.createDeal, {
			lockRequestId: lock1,
		});
		const deal1 = result1.dealId;

		// Second lock request cannot be approved because the listing is already locked
		// by the first deal
		await expect(approveLockRequest(t, lock2)).rejects.toThrow(
			"Listing is no longer available"
		);

		// Creating a deal with the second lock request should also fail
		// because the lock request was never approved
		await expect(
			adminT.action(api.deals.createDeal, {
				lockRequestId: lock2,
			})
		).rejects.toThrow("Lock request must be approved before creating deal");

		// Complete first deal
		await moveDealToCompleted(t, deal1);
		await adminT.mutation(api.deals.completeDeal, {
			dealId: deal1,
		});

		// Verify only investor1 owns the mortgage
		const investor1Ownership = await getInvestorOwnership(
			t,
			mortgageId,
			investor1
		);
		expect(investor1Ownership?.ownershipPercentage).toBe(100);

		const investor2Ownership = await getInvestorOwnership(
			t,
			mortgageId,
			investor2
		);
		expect(investor2Ownership).toBeNull();
	});

	test("should maintain ownership history and audit trail", async () => {
		const t = createTest();
		const { dealId, mortgageId } = await createCompleteDealSetup(t);

		// Get initial ownership records
		const initialRecords = await t.run(
			async (ctx) =>
				await ctx.db
					.query("mortgage_ownership")
					.withIndex("by_mortgage", (q) => q.eq("mortgageId", mortgageId))
					.collect()
		);

		expect(initialRecords).toHaveLength(1); // Only FairLend

		// Complete deal
		await moveDealToCompleted(t, dealId);
		const adminT = await getAdminTest(t);
		await adminT.mutation(api.deals.completeDeal, {
			dealId,
		});

		// Get final ownership records
		const finalRecords = await t.run(
			async (ctx) =>
				await ctx.db
					.query("mortgage_ownership")
					.withIndex("by_mortgage", (q) => q.eq("mortgageId", mortgageId))
					.collect()
		);

		expect(finalRecords).toHaveLength(1); // Only investor

		// Verify deal state history was updated
		const deal = await adminT.query(api.deals.getDeal, { dealId });
		expect(deal?.stateHistory).toBeTruthy();
		expect(deal?.stateHistory?.length).toBeGreaterThan(0);

		// Find the completion transition
		const completionTransition = deal?.stateHistory?.find(
			(h: { toState: string }) => h.toState === "completed"
		);
		expect(completionTransition).toBeTruthy();
	});
});
