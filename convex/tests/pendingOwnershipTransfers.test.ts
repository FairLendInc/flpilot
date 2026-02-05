// @vitest-environment node
/**
 * Pending Ownership Transfers Tests
 *
 * Tests for the Maker-Checker pattern implementation for ownership transfers.
 * See footguns.md for critical invariants that must be maintained.
 *
 * Critical Tests:
 * - 100% ownership invariant maintained after ALL operations
 * - Double-submission idempotency
 * - Rejection and retry flow
 * - Manual escalation after second rejection
 */

import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import schema from "../schema";

process.env.OWNERSHIP_LEDGER_SOURCE = "legacy";

// @ts-ignore
const modules = import.meta.glob("../**/*.{ts,js,tsx,jsx}", { eager: false });
const createTest = () => convexTest(schema, modules);

function requireTransferId(
	transfer: { _id?: Id<"pending_ownership_transfers"> } | null | undefined
): Id<"pending_ownership_transfers"> {
	if (!transfer?._id) {
		throw new Error("Pending transfer not found");
	}
	return transfer._id;
}

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
 * Create a test mortgage with FairLend 100% ownership
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

/**
 * Move deal to pending_ownership_review state
 */
async function moveDealToOwnershipReview(
	t: ReturnType<typeof createTest>,
	dealId: Id<"deals">
) {
	const adminT = await getAdminTest(t);

	// Move through states to pending_ownership_review
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
		event: { type: "VERIFY_COMPLETE" },
	});
}

/**
 * Verify total ownership equals 100%
 */
async function verifyTotalOwnership(
	t: ReturnType<typeof createTest>,
	mortgageId: Id<"mortgages">
) {
	const adminT = await getAdminTest(t);
	const result = await adminT.action(api.ownership.getTotalOwnership, {
		mortgageId,
	});
	return result;
}

// ============================================================================
// Create Pending Transfer Tests
// ============================================================================

describe("createPendingTransferInternal", () => {
	test("should create pending transfer when deal enters ownership review state", async () => {
		const t = createTest();
		const { dealId, mortgageId } = await createDeal(t);

		// Move deal to pending_ownership_review
		await moveDealToOwnershipReview(t, dealId);

		// Check pending transfer was created
		const adminT = await getAdminTest(t);
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

	test("should validate source has sufficient ownership", async () => {
		const t = createTest();
		const { dealId, mortgageId, investorId } = await createDeal(t);

		// First create an investor ownership of 50%
		const adminT = await getAdminTest(t);
		await adminT.mutation(api.ownership.createOwnership, {
			mortgageId,
			ownerId: investorId,
			ownershipPercentage: 50,
		});

		// Now FairLend only has 50%. Try to transfer 100% should fail in the internal mutation
		// This test verifies the validation inside createPendingTransferInternal
		await expect(
			t.run(async (ctx) => {
				await ctx.runMutation(
					internal.pendingOwnershipTransfers.createPendingTransferInternal,
					{
						dealId,
						mortgageId,
						fromOwnerId: "fairlend",
						toOwnerId: investorId,
						percentage: 100, // More than FairLend has
					}
				);
			})
		).rejects.toThrow("Insufficient source ownership");
	});

	test("should reject duplicate pending transfer for same deal", async () => {
		const t = createTest();
		const { dealId, mortgageId, investorId } = await createDeal(t);

		// Create first pending transfer
		await t.run(async (ctx) => {
			await ctx.runMutation(
				internal.pendingOwnershipTransfers.createPendingTransferInternal,
				{
					dealId,
					mortgageId,
					fromOwnerId: "fairlend",
					toOwnerId: investorId,
					percentage: 100,
				}
			);
		});

		// Try to create duplicate
		await expect(
			t.run(async (ctx) => {
				await ctx.runMutation(
					internal.pendingOwnershipTransfers.createPendingTransferInternal,
					{
						dealId,
						mortgageId,
						fromOwnerId: "fairlend",
						toOwnerId: investorId,
						percentage: 100,
					}
				);
			})
		).rejects.toThrow("A pending transfer already exists for this deal");
	});
});

// ============================================================================
// Approve Transfer Tests
// ============================================================================

describe("approvePendingTransfer", () => {
	test("should approve transfer and return deal ID", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);
		await moveDealToOwnershipReview(t, dealId);

		// Get the pending transfer
		const adminT = await getAdminTest(t);
		const transfer = await adminT.query(
			api.pendingOwnershipTransfers.getPendingTransferByDeal,
			{ dealId }
		);
		expect(transfer).toBeTruthy();

		// Approve it
		const result = await adminT.mutation(
			api.pendingOwnershipTransfers.approvePendingTransfer,
			{
				transferId: requireTransferId(transfer),
				notes: "Approved after review",
			}
		);

		expect(result.success).toBe(true);
		expect(result.dealId).toBe(dealId);

		// Verify transfer status updated
		const updatedTransfer = await adminT.query(
			api.pendingOwnershipTransfers.getPendingTransferByDeal,
			{ dealId }
		);
		expect(updatedTransfer?.status).toBe("approved");
		expect(updatedTransfer?.reviewNotes).toBe("Approved after review");
	});

	test("should reject approval of non-pending transfer", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);
		await moveDealToOwnershipReview(t, dealId);

		const adminT = await getAdminTest(t);
		const transfer = await adminT.query(
			api.pendingOwnershipTransfers.getPendingTransferByDeal,
			{ dealId }
		);

		// Approve it once
		await adminT.mutation(
			api.pendingOwnershipTransfers.approvePendingTransfer,
			{ transferId: requireTransferId(transfer) }
		);

		// Try to approve again (should fail - idempotency check)
		await expect(
			adminT.mutation(api.pendingOwnershipTransfers.approvePendingTransfer, {
				transferId: requireTransferId(transfer),
			})
		).rejects.toThrow("Transfer is not pending");
	});

	test("should reject approval when deal not in pending_ownership_review state", async () => {
		const t = createTest();
		const { dealId, mortgageId, investorId } = await createDeal(t);

		// Create a pending transfer directly (without moving deal to review state)
		const transferId = await t.run(
			async (ctx) =>
				await ctx.runMutation(
					internal.pendingOwnershipTransfers.createPendingTransferInternal,
					{
						dealId,
						mortgageId,
						fromOwnerId: "fairlend",
						toOwnerId: investorId,
						percentage: 100,
					}
				)
		);

		// Try to approve while deal is still in 'locked' state
		const adminT = await getAdminTest(t);
		await expect(
			adminT.mutation(api.pendingOwnershipTransfers.approvePendingTransfer, {
				transferId: transferId as string as Id<"pending_ownership_transfers">,
			})
		).rejects.toThrow("Deal is not in pending_ownership_review state");
	});

	test("should record reviewer info on approval", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);
		await moveDealToOwnershipReview(t, dealId);

		const adminT = await getAdminTest(t);
		const transfer = await adminT.query(
			api.pendingOwnershipTransfers.getPendingTransferByDeal,
			{ dealId }
		);

		const beforeApproval = Date.now();
		await adminT.mutation(
			api.pendingOwnershipTransfers.approvePendingTransfer,
			{ transferId: requireTransferId(transfer) }
		);
		const afterApproval = Date.now();

		const updatedTransfer = await adminT.query(
			api.pendingOwnershipTransfers.getPendingTransferByDeal,
			{ dealId }
		);

		expect(updatedTransfer?.reviewedBy).toBeDefined();
		expect(updatedTransfer?.reviewedAt).toBeGreaterThanOrEqual(beforeApproval);
		expect(updatedTransfer?.reviewedAt).toBeLessThanOrEqual(afterApproval);
	});
});

// ============================================================================
// Reject Transfer Tests
// ============================================================================

describe("rejectPendingTransfer", () => {
	test("should reject transfer with reason", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);
		await moveDealToOwnershipReview(t, dealId);

		const adminT = await getAdminTest(t);
		const transfer = await adminT.query(
			api.pendingOwnershipTransfers.getPendingTransferByDeal,
			{ dealId }
		);

		// Reject
		const result = await adminT.mutation(
			api.pendingOwnershipTransfers.rejectPendingTransfer,
			{
				transferId: requireTransferId(transfer),
				reason: "Documentation incomplete",
			}
		);

		expect(result.success).toBe(true);
		expect(result.escalated).toBe(false);

		// Verify transfer status
		const updatedTransfer = await adminT.query(
			api.pendingOwnershipTransfers.getPendingTransferByDeal,
			{ dealId }
		);
		expect(updatedTransfer?.status).toBe("rejected");
		expect(updatedTransfer?.reviewNotes).toBe("Documentation incomplete");
		expect(updatedTransfer?.rejectionCount).toBe(1);
	});

	test("should create alert on rejection", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);
		await moveDealToOwnershipReview(t, dealId);

		const adminT = await getAdminTest(t);
		const transfer = await adminT.query(
			api.pendingOwnershipTransfers.getPendingTransferByDeal,
			{ dealId }
		);

		await adminT.mutation(api.pendingOwnershipTransfers.rejectPendingTransfer, {
			transferId: requireTransferId(transfer),
			reason: "Need verification",
		});

		// Check alert was created
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
		expect(alerts[0]?.message).toContain("Need verification");
	});

	test("should escalate to manual resolution after second rejection", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);
		await moveDealToOwnershipReview(t, dealId);

		const adminT = await getAdminTest(t);
		const transfer = await adminT.query(
			api.pendingOwnershipTransfers.getPendingTransferByDeal,
			{ dealId }
		);

		// First rejection
		const result1 = await adminT.mutation(
			api.pendingOwnershipTransfers.rejectPendingTransfer,
			{
				transferId: requireTransferId(transfer),
				reason: "First issue",
			}
		);
		expect(result1.escalated).toBe(false);

		// Update rejection count manually to simulate retry scenario
		// (In real flow, a new transfer would be created for retry)
		await t.run(async (ctx) => {
			await ctx.db.patch(requireTransferId(transfer), { status: "pending" });
		});

		// Second rejection
		const result2 = await adminT.mutation(
			api.pendingOwnershipTransfers.rejectPendingTransfer,
			{
				transferId: requireTransferId(transfer),
				reason: "Second issue",
			}
		);
		expect(result2.escalated).toBe(true);

		// Check alert severity is higher
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
					.order("desc")
					.collect()
		);

		const latestAlert = alerts[0];
		expect(latestAlert?.severity).toBe("warning");
		expect(latestAlert?.message).toContain("manual resolution");
	});
});

// ============================================================================
// Ownership Preview Tests
// ============================================================================

describe("getOwnershipPreview", () => {
	test("should show correct before and after ownership", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);
		await moveDealToOwnershipReview(t, dealId);

		const adminT = await getAdminTest(t);
		const _transfer = await adminT.query(
			api.pendingOwnershipTransfers.getPendingTransferByDeal,
			{ dealId }
		);

		const preview = await adminT.action(
			api.pendingOwnershipTransfers.getOwnershipPreview,
			{ dealId }
		);

		// Before: FairLend 100%
		expect(preview.currentOwnership.length).toBe(1);
		expect(preview.currentOwnership[0].ownerId).toBe("fairlend");
		expect(preview.currentOwnership[0].percentage).toBe(100);

		// After: Investor 100%
		expect(preview.afterOwnership.length).toBe(1);
		expect(preview.afterOwnership[0].percentage).toBe(100);
	});

	test("should handle partial transfers correctly", async () => {
		const t = createTest();
		const { dealId, mortgageId, investorId } = await createDeal(t);

		// Create a custom pending transfer for 50%
		const _transferId = await t.run(
			async (ctx) =>
				await ctx.runMutation(
					internal.pendingOwnershipTransfers.createPendingTransferInternal,
					{
						dealId,
						mortgageId,
						fromOwnerId: "fairlend",
						toOwnerId: investorId,
						percentage: 50,
					}
				)
		);

		const adminT = await getAdminTest(t);
		const preview = await adminT.action(
			api.pendingOwnershipTransfers.getOwnershipPreview,
			{ dealId }
		);

		// Before: FairLend 100%
		expect(preview.currentOwnership.length).toBe(1);
		expect(preview.currentOwnership[0].percentage).toBe(100);

		// After: FairLend 50%, Investor 50%
		expect(preview.afterOwnership.length).toBe(2);
		const fairlendAfter = preview.afterOwnership.find(
			(o: (typeof preview.afterOwnership)[number]) => o.ownerId === "fairlend"
		);
		const investorAfter = preview.afterOwnership.find(
			(o: (typeof preview.afterOwnership)[number]) => o.ownerId === investorId
		);
		expect(fairlendAfter?.percentage).toBe(50);
		expect(investorAfter?.percentage).toBe(50);
	});
});

// ============================================================================
// Query Tests
// ============================================================================

describe("getPendingTransfersForReview", () => {
	test("should return all pending transfers", async () => {
		const t = createTest();

		// Create multiple deals with pending transfers
		const deal1 = await createDeal(t);
		const deal2 = await createDeal(t);

		await moveDealToOwnershipReview(t, deal1.dealId);
		await moveDealToOwnershipReview(t, deal2.dealId);

		const adminT = await getAdminTest(t);
		const pendingTransfers = await adminT.query(
			api.pendingOwnershipTransfers.getPendingTransfersForReview,
			{}
		);

		expect(pendingTransfers.length).toBeGreaterThanOrEqual(2);
		expect(pendingTransfers.every((pt) => pt.status === "pending")).toBe(true);
	});

	test("should not return approved or rejected transfers", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);
		await moveDealToOwnershipReview(t, dealId);

		const adminT = await getAdminTest(t);
		const transfer = await adminT.query(
			api.pendingOwnershipTransfers.getPendingTransferByDeal,
			{ dealId }
		);

		// Approve it
		await adminT.mutation(
			api.pendingOwnershipTransfers.approvePendingTransfer,
			{ transferId: requireTransferId(transfer) }
		);

		// Check it's not in pending list
		const pendingTransfers = await adminT.query(
			api.pendingOwnershipTransfers.getPendingTransfersForReview,
			{}
		);

		const found = pendingTransfers.find((pt) => pt.dealId === dealId);
		expect(found).toBeUndefined();
	});
});

// ============================================================================
// Ownership Invariant Tests (CRITICAL)
// ============================================================================

describe("ownership invariant - 100% maintained", () => {
	test("should maintain 100% ownership after approval", async () => {
		const t = createTest();
		const { dealId, mortgageId } = await createDeal(t);
		await moveDealToOwnershipReview(t, dealId);

		// Verify before
		const before = await verifyTotalOwnership(t, mortgageId);
		expect(before.totalPercentage).toBeCloseTo(100, 2);

		const adminT = await getAdminTest(t);
		const transfer = await adminT.query(
			api.pendingOwnershipTransfers.getPendingTransferByDeal,
			{ dealId }
		);

		await adminT.mutation(
			api.pendingOwnershipTransfers.approvePendingTransfer,
			{ transferId: requireTransferId(transfer) }
		);

		// Now complete the deal to execute the transfer
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "CONFIRM_TRANSFER" },
		});

		// Verify after - should still be 100%
		const after = await verifyTotalOwnership(t, mortgageId);
		expect(after.totalPercentage).toBeCloseTo(100, 2);
	});

	test("should maintain 100% ownership after rejection", async () => {
		const t = createTest();
		const { dealId, mortgageId } = await createDeal(t);
		await moveDealToOwnershipReview(t, dealId);

		const before = await verifyTotalOwnership(t, mortgageId);
		expect(before.totalPercentage).toBeCloseTo(100, 2);

		const adminT = await getAdminTest(t);
		const transfer = await adminT.query(
			api.pendingOwnershipTransfers.getPendingTransferByDeal,
			{ dealId }
		);

		await adminT.mutation(api.pendingOwnershipTransfers.rejectPendingTransfer, {
			transferId: requireTransferId(transfer),
			reason: "Test rejection",
		});

		// Ownership unchanged
		const after = await verifyTotalOwnership(t, mortgageId);
		expect(after.totalPercentage).toBeCloseTo(100, 2);
	});

	test("should maintain 100% ownership after multiple approve/reject cycles", async () => {
		const t = createTest();
		const { dealId, mortgageId } = await createDeal(t);
		await moveDealToOwnershipReview(t, dealId);

		const adminT = await getAdminTest(t);
		const transfer = await adminT.query(
			api.pendingOwnershipTransfers.getPendingTransferByDeal,
			{ dealId }
		);

		// First: reject
		await adminT.mutation(api.pendingOwnershipTransfers.rejectPendingTransfer, {
			transferId: requireTransferId(transfer),
			reason: "Issue 1",
		});
		const afterReject = await verifyTotalOwnership(t, mortgageId);
		expect(afterReject.totalPercentage).toBeCloseTo(100, 2);

		// Reset to pending (simulate retry flow)
		await t.run(async (ctx) => {
			await ctx.db.patch(requireTransferId(transfer), { status: "pending" });
		});

		// Second: approve
		await adminT.mutation(
			api.pendingOwnershipTransfers.approvePendingTransfer,
			{ transferId: requireTransferId(transfer) }
		);
		const afterApprove = await verifyTotalOwnership(t, mortgageId);
		expect(afterApprove.totalPercentage).toBeCloseTo(100, 2);
	});
});

// ============================================================================
// Idempotency Tests (CRITICAL)
// ============================================================================

describe("idempotency - double submission handling", () => {
	test("should reject double approval", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);
		await moveDealToOwnershipReview(t, dealId);

		const adminT = await getAdminTest(t);
		const transfer = await adminT.query(
			api.pendingOwnershipTransfers.getPendingTransferByDeal,
			{ dealId }
		);

		// First approval
		await adminT.mutation(
			api.pendingOwnershipTransfers.approvePendingTransfer,
			{ transferId: requireTransferId(transfer) }
		);

		// Second approval should fail
		await expect(
			adminT.mutation(api.pendingOwnershipTransfers.approvePendingTransfer, {
				transferId: requireTransferId(transfer),
			})
		).rejects.toThrow("Transfer is not pending");
	});

	test("should reject double rejection", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);
		await moveDealToOwnershipReview(t, dealId);

		const adminT = await getAdminTest(t);
		const transfer = await adminT.query(
			api.pendingOwnershipTransfers.getPendingTransferByDeal,
			{ dealId }
		);

		// First rejection
		await adminT.mutation(api.pendingOwnershipTransfers.rejectPendingTransfer, {
			transferId: requireTransferId(transfer),
			reason: "Issue",
		});

		// Second rejection should fail
		await expect(
			adminT.mutation(api.pendingOwnershipTransfers.rejectPendingTransfer, {
				transferId: requireTransferId(transfer),
				reason: "Issue again",
			})
		).rejects.toThrow("Transfer is not pending");
	});
});
