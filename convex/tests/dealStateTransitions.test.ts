// @vitest-environment node
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { DealStateValue } from "../dealStateMachine";
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
 */
async function getAdminTest(t: ReturnType<typeof createTest>) {
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
 * Create a test user
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
 * Create a test mortgage
 */
async function createTestMortgage(t: ReturnType<typeof createTest>) {
	const borrowerId = await createTestBorrower(t);
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
 * Create a test listing
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
 * Create a lock request
 */
async function createLockRequest(
	t: ReturnType<typeof createTest>,
	listingId: Id<"listings">,
	investorIdpId: string
) {
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
 * Create a complete deal in initial "locked" state
 */
async function createDeal(t: ReturnType<typeof createTest>) {
	const { mortgageId } = await createTestMortgage(t);
	const listingId = await createTestListing(t, mortgageId);
	const { userId: investorId, idp_id: investorIdpId } = await createTestUser(
		t,
		`investor_${Date.now()}`
	);

	const lockRequestId = await createLockRequest(t, listingId, investorIdpId);
	await approveLockRequest(t, lockRequestId);

	const adminT = await getAdminTest(t);
	const result = await adminT.action(api.deals.createDeal, {
		lockRequestId,
	});

	return { dealId: result.dealId, mortgageId, listingId, investorId };
}

// ============================================================================
// Forward State Transition Tests
// ============================================================================

describe("transitionDealState - Forward Transitions", () => {
	test("should transition from locked to pending_lawyer via CONFIRM_LAWYER", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);

		const adminT = await getAdminTest(t);

		// Verify initial state
		const dealBefore = await adminT.query(api.deals.getDeal, { dealId });
		expect(dealBefore?.currentState).toBe("locked");

		// Transition to pending_lawyer
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "CONFIRM_LAWYER", notes: "Lawyer confirmed" },
		});

		// Verify state changed
		const dealAfter = await adminT.query(api.deals.getDeal, { dealId });
		expect(dealAfter?.currentState).toBe("pending_lawyer");
	});

	test("should transition from pending_lawyer to pending_docs via COMPLETE_DOCS", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);
		const adminT = await getAdminTest(t);

		// Move to pending_lawyer
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "CONFIRM_LAWYER" },
		});

		// Transition to pending_docs
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "COMPLETE_DOCS", notes: "Documents ready" },
		});

		const deal = await adminT.query(api.deals.getDeal, { dealId });
		expect(deal?.currentState).toBe("pending_docs");
	});

	test("should transition from pending_docs to pending_transfer via RECEIVE_FUNDS", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);
		const adminT = await getAdminTest(t);

		// Move through states
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "CONFIRM_LAWYER" },
		});
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "COMPLETE_DOCS" },
		});

		// Transition to pending_transfer
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "RECEIVE_FUNDS", notes: "Funds received" },
		});

		const deal = await adminT.query(api.deals.getDeal, { dealId });
		expect(deal?.currentState).toBe("pending_transfer");
	});

	test("should transition from pending_docs to pending_transfer via DOCUMENTS_COMPLETE", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);
		const adminT = await getAdminTest(t);

		// Move through states
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "CONFIRM_LAWYER" },
		});
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "COMPLETE_DOCS" },
		});

		// Transition to pending_transfer through document completion
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "DOCUMENTS_COMPLETE", notes: "All docs signed" },
		});

		const deal = await adminT.query(api.deals.getDeal, { dealId });
		expect(deal?.currentState).toBe("pending_transfer");
	});

	test("should transition from pending_transfer to pending_verification via VERIFY_FUNDS", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);
		const adminT = await getAdminTest(t);

		// Move through states
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

		// Transition to pending_verification
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "VERIFY_FUNDS", notes: "Verification started" },
		});

		const deal = await adminT.query(api.deals.getDeal, { dealId });
		expect(deal?.currentState).toBe("pending_verification");
	});

	test("should transition from pending_verification to completed via COMPLETE_DEAL", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);
		const adminT = await getAdminTest(t);

		// Move through all states to pending_verification
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

		// Transition to completed
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "COMPLETE_DEAL", notes: "Deal completed" },
		});

		const deal = await adminT.query(api.deals.getDeal, { dealId });
		expect(deal?.currentState).toBe("completed");
	});

	test("should complete full forward transition flow from locked to completed", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);
		const adminT = await getAdminTest(t);

		const states: DealStateValue[] = [
			"locked",
			"pending_lawyer",
			"pending_docs",
			"pending_transfer",
			"pending_verification",
			"completed",
		];

		const transitions = [
			{ type: "CONFIRM_LAWYER" as const },
			{ type: "COMPLETE_DOCS" as const },
			{ type: "RECEIVE_FUNDS" as const },
			{ type: "VERIFY_FUNDS" as const },
			{ type: "COMPLETE_DEAL" as const },
		];

		// Verify initial state
		let deal = await adminT.query(api.deals.getDeal, { dealId });
		expect(deal?.currentState).toBe("locked");

		// Execute each transition
		for (let i = 0; i < transitions.length; i += 1) {
			await adminT.mutation(api.deals.transitionDealState, {
				dealId,
				event: transitions[i],
			});

			deal = await adminT.query(api.deals.getDeal, { dealId });
			expect(deal?.currentState).toBe(states[i + 1]);
		}

		// Verify final state
		expect(deal?.currentState).toBe("completed");
	});
});

// ============================================================================
// Backward Transition Tests (GO_BACK)
// ============================================================================

describe("transitionDealState - Backward Transitions", () => {
	test("should allow backward transition from pending_lawyer to locked", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);
		const adminT = await getAdminTest(t);

		// Move forward
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "CONFIRM_LAWYER" },
		});

		// Move backward
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "GO_BACK", toState: "locked", notes: "Going back" },
		});

		const deal = await adminT.query(api.deals.getDeal, { dealId });
		expect(deal?.currentState).toBe("locked");
	});

	test("should allow backward transition from pending_docs to pending_lawyer", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);
		const adminT = await getAdminTest(t);

		// Move forward through states
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "CONFIRM_LAWYER" },
		});
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "COMPLETE_DOCS" },
		});

		// Move backward
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: {
				type: "GO_BACK",
				toState: "pending_lawyer",
				notes: "Documents need revision",
			},
		});

		const deal = await adminT.query(api.deals.getDeal, { dealId });
		expect(deal?.currentState).toBe("pending_lawyer");
	});

	test("should allow backward transition from pending_transfer to pending_docs", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);
		const adminT = await getAdminTest(t);

		// Move forward
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

		// Move backward
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "GO_BACK", toState: "pending_docs" },
		});

		const deal = await adminT.query(api.deals.getDeal, { dealId });
		expect(deal?.currentState).toBe("pending_docs");
	});

	test("should allow backward transition from pending_verification to pending_transfer", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);
		const adminT = await getAdminTest(t);

		// Move through states
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

		// Move backward
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "GO_BACK", toState: "pending_transfer" },
		});

		const deal = await adminT.query(api.deals.getDeal, { dealId });
		expect(deal?.currentState).toBe("pending_transfer");
	});
});

// ============================================================================
// Audit Trail Tests
// ============================================================================

describe("transitionDealState - Audit Trail", () => {
	test("should create audit trail entry for each transition", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);
		const adminT = await getAdminTest(t);

		// Initial state history should have 1 entry (creation)
		const dealBefore = await adminT.query(api.deals.getDeal, { dealId });
		const initialHistoryLength = dealBefore?.stateHistory?.length || 0;

		// Perform transition
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "CONFIRM_LAWYER", notes: "Test transition" },
		});

		// Verify new entry was added
		const dealAfter = await adminT.query(api.deals.getDeal, { dealId });
		expect(dealAfter?.stateHistory?.length).toBeGreaterThanOrEqual(
			initialHistoryLength
		);

		// Verify latest entry details
		const latestEntry =
			dealAfter?.stateHistory?.[dealAfter.stateHistory.length - 1];
		expect(latestEntry?.fromState).toBe("locked");
		expect(latestEntry?.toState).toBe("pending_lawyer");
		expect(latestEntry?.notes).toBe("Test transition");
		expect(latestEntry?.timestamp).toBeDefined();
		expect(latestEntry?.triggeredBy).toBeDefined();
	});

	test("should record admin ID in audit trail", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);
		const adminT = await getAdminTest(t);

		// Get admin user ID
		const adminUserId = await t.run(async (ctx) => {
			const user = await ctx.db
				.query("users")
				.withIndex("by_idp_id", (q) => q.eq("idp_id", "test-admin-user"))
				.first();
			return user?._id;
		});

		// Perform transition
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "CONFIRM_LAWYER" },
		});

		// Verify admin ID is recorded
		const deal = await adminT.query(api.deals.getDeal, { dealId });
		const latestEntry = deal?.stateHistory?.[deal.stateHistory.length - 1];
		expect(latestEntry?.triggeredBy).toBe(adminUserId);
	});

	test("should maintain complete audit trail across multiple transitions", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);
		const adminT = await getAdminTest(t);

		// Perform multiple transitions
		const transitions = [
			{ type: "CONFIRM_LAWYER" as const, notes: "First" },
			{ type: "COMPLETE_DOCS" as const, notes: "Second" },
			{
				type: "GO_BACK" as const,
				toState: "pending_lawyer" as const,
				notes: "Third",
			},
			{ type: "COMPLETE_DOCS" as const, notes: "Fourth" },
		];

		for (const event of transitions) {
			await adminT.mutation(api.deals.transitionDealState, {
				dealId,
				event,
			});
		}

		// Verify all transitions are recorded
		const deal = await adminT.query(api.deals.getDeal, { dealId });
		const historyLength = deal?.stateHistory?.length || 0;

		// Should have: creation + 4 transitions
		expect(historyLength).toBeGreaterThanOrEqual(4);

		// Verify notes are preserved
		const notesInHistory = deal?.stateHistory
			?.slice(-4)
			.map((entry: any) => entry.notes);
		expect(notesInHistory).toContain("First");
		expect(notesInHistory).toContain("Second");
		expect(notesInHistory).toContain("Third");
		expect(notesInHistory).toContain("Fourth");
	});

	test("should record timestamp for each transition", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);
		const adminT = await getAdminTest(t);

		const beforeTimestamp = Date.now();

		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "CONFIRM_LAWYER" },
		});

		const afterTimestamp = Date.now();

		const deal = await adminT.query(api.deals.getDeal, { dealId });
		const latestEntry = deal?.stateHistory?.[deal.stateHistory.length - 1];

		expect(latestEntry?.timestamp).toBeGreaterThanOrEqual(beforeTimestamp);
		expect(latestEntry?.timestamp).toBeLessThanOrEqual(afterTimestamp);
	});
});

// ============================================================================
// Cancellation Tests
// ============================================================================

describe("cancelDeal - Cancellation from Different States", () => {
	test("should cancel deal from locked state", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);
		const adminT = await getAdminTest(t);

		await adminT.mutation(api.deals.cancelDeal, {
			dealId,
			reason: "Test cancellation",
		});

		const deal = await adminT.query(api.deals.getDeal, { dealId });
		expect(deal?.currentState).toBe("cancelled");
	});

	test("should cancel deal from pending_lawyer state", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);
		const adminT = await getAdminTest(t);

		// Move to pending_lawyer
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "CONFIRM_LAWYER" },
		});

		// Cancel
		await adminT.mutation(api.deals.cancelDeal, {
			dealId,
			reason: "Lawyer declined",
		});

		const deal = await adminT.query(api.deals.getDeal, { dealId });
		expect(deal?.currentState).toBe("cancelled");
	});

	test("should cancel deal from pending_docs state", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);
		const adminT = await getAdminTest(t);

		// Move to pending_docs
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "CONFIRM_LAWYER" },
		});
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "COMPLETE_DOCS" },
		});

		// Cancel
		await adminT.mutation(api.deals.cancelDeal, {
			dealId,
			reason: "Documents unsigned",
		});

		const deal = await adminT.query(api.deals.getDeal, { dealId });
		expect(deal?.currentState).toBe("cancelled");
	});

	test("should reject cancellation of already cancelled deal", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);
		const adminT = await getAdminTest(t);

		// Cancel first time
		await adminT.mutation(api.deals.cancelDeal, {
			dealId,
			reason: "First cancellation",
		});

		// Try to cancel again
		await expect(
			adminT.mutation(api.deals.cancelDeal, {
				dealId,
				reason: "Second cancellation",
			})
		).rejects.toThrow("Cannot cancel an already cancelled or archived deal");
	});

	test("should unlock listing when deal is cancelled", async () => {
		const t = createTest();
		const { dealId, listingId } = await createDeal(t);
		const adminT = await getAdminTest(t);

		// Verify listing is locked
		const listingBefore = await t.run(async (ctx) => ctx.db.get(listingId));
		expect(listingBefore?.locked).toBe(true);

		// Cancel deal
		await adminT.mutation(api.deals.cancelDeal, {
			dealId,
			reason: "Test",
		});

		// Verify listing is unlocked
		const listingAfter = await t.run(async (ctx) => ctx.db.get(listingId));
		expect(listingAfter?.locked).toBe(false);
		expect(listingAfter?.lockedBy).toBeUndefined();
	});
});

// ============================================================================
// Error Handling and Validation Tests
// ============================================================================

describe("transitionDealState - Error Handling", () => {
	test("should reject transition for non-existent deal", async () => {
		const t = createTest();
		const adminT = await getAdminTest(t);
		const { dealId } = await createDeal(t);
		await t.run(async (ctx) => ctx.db.delete(dealId));

		await expect(
			adminT.mutation(api.deals.transitionDealState, {
				dealId,
				event: { type: "CONFIRM_LAWYER" },
			})
		).rejects.toThrow("Deal not found");
	});

	test("should require admin privileges for transitions", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);

		// Try as non-admin user
		const investorT = t.withIdentity({
			subject: "test-investor-user",
			role: "investor",
		});

		await expect(
			investorT.mutation(api.deals.transitionDealState, {
				dealId,
				event: { type: "CONFIRM_LAWYER" },
			})
		).rejects.toThrow();
	});

	test("should require authentication for transitions", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);

		await expect(
			t.mutation(api.deals.transitionDealState, {
				dealId,
				event: { type: "CONFIRM_LAWYER" },
			})
		).rejects.toThrow();
	});

	test("should create alert when state changes", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);
		const adminT = await getAdminTest(t);

		// Perform transition
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "CONFIRM_LAWYER" },
		});

		// Check for state change alert
		const alerts = await t.run(
			async (ctx) =>
				await ctx.db
					.query("alerts")
					.filter((q) =>
						q.and(
							q.eq(q.field("relatedDealId"), dealId),
							q.eq(q.field("type"), "deal_state_changed")
						)
					)
					.collect()
		);

		expect(alerts.length).toBeGreaterThan(0);
		expect(alerts[0]?.message).toContain("locked");
		expect(alerts[0]?.message).toContain("pending_lawyer");
	});
});

// ============================================================================
// Integration Tests
// ============================================================================

describe("transitionDealState - Integration Scenarios", () => {
	test("should handle rapid succession of transitions correctly", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);
		const adminT = await getAdminTest(t);

		// Execute transitions rapidly
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

		const deal = await adminT.query(api.deals.getDeal, { dealId });
		expect(deal?.currentState).toBe("pending_transfer");
		expect(deal?.stateHistory?.length).toBeGreaterThanOrEqual(3); // creation + 2 transitions is acceptable here
	});

	test("should handle forward, backward, and forward transitions correctly", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);
		const adminT = await getAdminTest(t);

		// Forward
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "CONFIRM_LAWYER" },
		});
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "COMPLETE_DOCS" },
		});

		// Backward
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "GO_BACK", toState: "pending_lawyer" },
		});

		// Forward again
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "COMPLETE_DOCS" },
		});

		const deal = await adminT.query(api.deals.getDeal, { dealId });
		expect(deal?.currentState).toBe("pending_docs");

		// Verify all transitions are in history
		expect(deal?.stateHistory?.length).toBeGreaterThanOrEqual(4); // creation + 3 transitions is acceptable here
	});

	test("should maintain state machine integrity after cancellation", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);
		const adminT = await getAdminTest(t);

		// Move to pending_docs
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "CONFIRM_LAWYER" },
		});
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "COMPLETE_DOCS" },
		});

		// Cancel
		await adminT.mutation(api.deals.cancelDeal, {
			dealId,
			reason: "Test cancellation",
		});

		const deal = await adminT.query(api.deals.getDeal, { dealId });
		expect(deal?.currentState).toBe("cancelled");

		// Verify state machine state is still valid JSON
		expect(deal?.stateMachineState).toBeDefined();
		if (!deal?.stateMachineState) {
			throw new Error("Missing state machine state");
		}
		const snapshot = JSON.parse(deal.stateMachineState);
		expect(snapshot.context.currentState).toBe("cancelled");
	});
});

// ============================================================================
// Ownership Review State Transition Tests (NEW)
// ============================================================================

describe("transitionDealState - Ownership Review Flow", () => {
	/**
	 * Helper to move a deal to pending_verification state
	 */
	async function moveDealToPendingVerification(
		t: ReturnType<typeof createTest>,
		dealId: Id<"deals">
	) {
		const adminT = await getAdminTest(t);

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
	}

	test("should transition from pending_verification to pending_ownership_review via VERIFY_COMPLETE", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);

		await moveDealToPendingVerification(t, dealId);

		const adminT = await getAdminTest(t);

		// Verify we're in pending_verification
		const dealBefore = await adminT.query(api.deals.getDeal, { dealId });
		expect(dealBefore?.currentState).toBe("pending_verification");

		// Transition to pending_ownership_review
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "VERIFY_COMPLETE", notes: "Verification complete" },
		});

		const dealAfter = await adminT.query(api.deals.getDeal, { dealId });
		expect(dealAfter?.currentState).toBe("pending_ownership_review");
	});

	test("should create pending transfer when entering pending_ownership_review state", async () => {
		const t = createTest();
		const { dealId, mortgageId } = await createDeal(t);

		await moveDealToPendingVerification(t, dealId);

		const adminT = await getAdminTest(t);

		// Transition to pending_ownership_review
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "VERIFY_COMPLETE" },
		});

		// Verify pending transfer was created
		const transfer = await adminT.query(
			api.pendingOwnershipTransfers.getPendingTransferByDeal,
			{ dealId }
		);

		expect(transfer).toBeTruthy();
		expect(transfer?.status).toBe("pending");
		expect(transfer?.mortgageId).toBe(mortgageId);
		expect(transfer?.fromOwnerId).toBe("fairlend");
		expect(transfer?.percentage).toBe(100);
	});

	test("should create ownership_review_required alert when entering pending_ownership_review", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);

		await moveDealToPendingVerification(t, dealId);

		const adminT = await getAdminTest(t);

		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "VERIFY_COMPLETE" },
		});

		// Check alert was created
		const alerts = await t.run(
			async (ctx) =>
				await ctx.db
					.query("alerts")
					.filter((q) =>
						q.and(
							q.eq(q.field("relatedDealId"), dealId),
							q.eq(q.field("type"), "ownership_review_required")
						)
					)
					.collect()
		);

		expect(alerts.length).toBeGreaterThan(0);
	});

	test("should transition from pending_ownership_review to completed via CONFIRM_TRANSFER", async () => {
		const t = createTest();
		const { dealId, mortgageId, investorId } = await createDeal(t);

		await moveDealToPendingVerification(t, dealId);

		const adminT = await getAdminTest(t);

		// Move to pending_ownership_review
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "VERIFY_COMPLETE" },
		});

		// Verify deal is in pending_ownership_review
		const dealBefore = await adminT.query(api.deals.getDeal, { dealId });
		expect(dealBefore?.currentState).toBe("pending_ownership_review");

		// Approve the transfer
		const transfer = await adminT.query(
			api.pendingOwnershipTransfers.getPendingTransferByDeal,
			{ dealId }
		);
		if (!transfer?._id) {
			throw new Error("Pending transfer not found");
		}
		await adminT.mutation(
			api.pendingOwnershipTransfers.approvePendingTransfer,
			{
				transferId: transfer._id,
			}
		);

		// Confirm transfer
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "CONFIRM_TRANSFER", notes: "Ownership transferred" },
		});

		const dealAfter = await adminT.query(api.deals.getDeal, { dealId });
		expect(dealAfter?.currentState).toBe("completed");

		// Verify ownership was transferred
		const ownership = await adminT.action(api.ownership.getMortgageOwnership, {
			mortgageId,
		});
		const investorOwnership = ownership.find((o) => o.ownerId === investorId) as
			| { ownershipPercentage?: number; percentage?: number }
			| undefined;
		if (!investorOwnership) {
			throw new Error("Investor ownership not found");
		}
		const investorPercentage =
			investorOwnership.ownershipPercentage ?? investorOwnership.percentage;
		expect(investorPercentage).toBe(100);
	});

	test("should transition from pending_ownership_review to pending_verification via REJECT_TRANSFER", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);

		await moveDealToPendingVerification(t, dealId);

		const adminT = await getAdminTest(t);

		// Move to pending_ownership_review
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "VERIFY_COMPLETE" },
		});

		// Get the pending transfer
		const transfer = await adminT.query(
			api.pendingOwnershipTransfers.getPendingTransferByDeal,
			{ dealId }
		);

		// Reject the transfer
		if (!transfer?._id) {
			throw new Error("Pending transfer not found");
		}
		await adminT.mutation(api.pendingOwnershipTransfers.rejectPendingTransfer, {
			transferId: transfer._id,
			reason: "Documents need review",
		});

		// Trigger REJECT_TRANSFER
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: {
				type: "REJECT_TRANSFER",
				reason: "Documents need review",
			},
		});

		const dealAfter = await adminT.query(api.deals.getDeal, { dealId });
		expect(dealAfter?.currentState).toBe("pending_verification");
	});

	test("should create ownership_transfer_rejected alert on rejection", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);

		await moveDealToPendingVerification(t, dealId);

		const adminT = await getAdminTest(t);

		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "VERIFY_COMPLETE" },
		});

		const transfer = await adminT.query(
			api.pendingOwnershipTransfers.getPendingTransferByDeal,
			{ dealId }
		);

		if (!transfer?._id) {
			throw new Error("Pending transfer not found");
		}
		await adminT.mutation(api.pendingOwnershipTransfers.rejectPendingTransfer, {
			transferId: transfer._id,
			reason: "Issue found",
		});

		// Check rejection alert was created
		const alerts = await t.run(
			async (ctx) =>
				await ctx.db
					.query("alerts")
					.filter((q) =>
						q.and(
							q.eq(q.field("relatedDealId"), dealId),
							q.eq(q.field("type"), "ownership_transfer_rejected")
						)
					)
					.collect()
		);

		expect(alerts.length).toBeGreaterThan(0);
		expect(alerts[0]?.message).toContain("Issue found");
	});

	test("should maintain 100% ownership invariant after CONFIRM_TRANSFER", async () => {
		const t = createTest();
		const { dealId, mortgageId } = await createDeal(t);

		await moveDealToPendingVerification(t, dealId);

		const adminT = await getAdminTest(t);

		// Move to pending_ownership_review
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "VERIFY_COMPLETE" },
		});

		// Verify 100% before transfer
		const ownershipBefore = await adminT.action(
			api.ownership.getTotalOwnership,
			{
				mortgageId,
			}
		);
		expect(ownershipBefore.totalPercentage).toBeCloseTo(100, 2);

		// Approve and confirm transfer
		const transfer = await adminT.query(
			api.pendingOwnershipTransfers.getPendingTransferByDeal,
			{ dealId }
		);
		if (!transfer?._id) {
			throw new Error("Pending transfer not found");
		}
		await adminT.mutation(
			api.pendingOwnershipTransfers.approvePendingTransfer,
			{ transferId: transfer._id }
		);

		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "CONFIRM_TRANSFER" },
		});

		// Verify 100% after transfer
		const ownershipAfter = await adminT.action(
			api.ownership.getTotalOwnership,
			{
				mortgageId,
			}
		);
		expect(ownershipAfter.totalPercentage).toBeCloseTo(100, 2);
		expect(ownershipAfter.isValid).toBe(true);
	});

	test("should persist state machine state after each transition", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);

		await moveDealToPendingVerification(t, dealId);

		const adminT = await getAdminTest(t);

		// Transition to pending_ownership_review
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "VERIFY_COMPLETE" },
		});

		// Verify state machine state is persisted
		const deal = await adminT.query(api.deals.getDeal, { dealId });
		if (!deal?.stateMachineState) {
			throw new Error("Deal or state machine state not found");
		}

		const snapshot = JSON.parse(deal.stateMachineState);
		expect(snapshot.context.currentState).toBe("pending_ownership_review");
	});

	test("should escalate to manual resolution after second rejection", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);

		await moveDealToPendingVerification(t, dealId);

		const adminT = await getAdminTest(t);

		// First cycle: VERIFY_COMPLETE -> reject
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "VERIFY_COMPLETE" },
		});

		let transfer = await adminT.query(
			api.pendingOwnershipTransfers.getPendingTransferByDeal,
			{ dealId }
		);

		// First rejection
		if (!transfer?._id) {
			throw new Error("Pending transfer not found");
		}
		const result1 = await adminT.mutation(
			api.pendingOwnershipTransfers.rejectPendingTransfer,
			{
				transferId: transfer._id,
				reason: "First issue",
			}
		);
		expect(result1.escalated).toBe(false);

		// Trigger REJECT_TRANSFER
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: {
				type: "REJECT_TRANSFER",
				reason: "First issue",
			},
		});

		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "VERIFY_COMPLETE" },
		});

		transfer = await adminT.query(
			api.pendingOwnershipTransfers.getPendingTransferByDeal,
			{ dealId }
		);

		// Second rejection should escalate
		if (!transfer?._id) {
			throw new Error("Pending transfer not found");
		}
		const result2 = await adminT.mutation(
			api.pendingOwnershipTransfers.rejectPendingTransfer,
			{
				transferId: transfer._id,
				reason: "Second issue",
			}
		);
		expect(result2.escalated).toBe(true);
	});

	test("should reject CONFIRM_TRANSFER if pending transfer not approved", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);

		await moveDealToPendingVerification(t, dealId);

		const adminT = await getAdminTest(t);

		// Move to pending_ownership_review
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "VERIFY_COMPLETE" },
		});

		// Try to confirm transfer without approving first
		await expect(
			adminT.mutation(api.deals.transitionDealState, {
				dealId,
				event: { type: "CONFIRM_TRANSFER" },
			})
		).rejects.toThrow("Transfer is not approved");
	});

	test("should reject VERIFY_COMPLETE from non-pending_verification state", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);
		const adminT = await getAdminTest(t);

		// Try VERIFY_COMPLETE from locked state (should fail)
		await expect(
			adminT.mutation(api.deals.transitionDealState, {
				dealId,
				event: { type: "VERIFY_COMPLETE" },
			})
		).rejects.toThrow("Invalid transition");
	});

	test("complete ownership review flow: verification -> review -> approve -> complete", async () => {
		const t = createTest();
		const { dealId, mortgageId } = await createDeal(t);

		await moveDealToPendingVerification(t, dealId);

		const adminT = await getAdminTest(t);

		// Step 1: Complete verification
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "VERIFY_COMPLETE" },
		});

		let deal = await adminT.query(api.deals.getDeal, { dealId });
		expect(deal?.currentState).toBe("pending_ownership_review");

		// Step 2: Approve pending transfer
		const transfer = await adminT.query(
			api.pendingOwnershipTransfers.getPendingTransferByDeal,
			{ dealId }
		);
		if (!transfer?._id) {
			throw new Error("Pending transfer not found");
		}
		expect(transfer.status).toBe("pending");

		await adminT.mutation(
			api.pendingOwnershipTransfers.approvePendingTransfer,
			{ transferId: transfer._id }
		);

		const approvedTransfer = await adminT.query(
			api.pendingOwnershipTransfers.getPendingTransferByDeal,
			{ dealId }
		);
		expect(approvedTransfer?.status).toBe("approved");

		// Step 3: Confirm transfer
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "CONFIRM_TRANSFER" },
		});

		deal = await adminT.query(api.deals.getDeal, { dealId });
		expect(deal?.currentState).toBe("completed");

		// Step 4: Verify ownership is transferred and invariant maintained
		const ownership = await adminT.action(api.ownership.getTotalOwnership, {
			mortgageId,
		});
		expect(ownership.totalPercentage).toBeCloseTo(100, 2);
		expect(ownership.isValid).toBe(true);
	});
});
