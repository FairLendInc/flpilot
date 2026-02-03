// @vitest-environment node
/**
 * Unit Tests for Deferral Request Mutations
 *
 * Tests the borrower self-service deferral request workflow
 * and admin approval/rejection flow.
 */

import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import schema from "../schema";

// @ts-ignore - vitest glob import pattern
const modules = import.meta.glob("../**/*.{ts,js,tsx,jsx}", { eager: false });
const createTest = () => convexTest(schema, modules);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a test user with identity
 */
async function createTestUser(
	t: ReturnType<typeof createTest>,
	identifier: string
) {
	return await t.run(
		async (ctx) =>
			await ctx.db.insert("users", {
				idp_id: `idp_${identifier}`,
				email: `${identifier}@test.example.com`,
				email_verified: true,
				first_name: "Test",
				last_name: identifier,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				metadata: {},
			})
	);
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

/**
 * Create a test borrower linked to a user
 */
async function createTestBorrower(
	t: ReturnType<typeof createTest>,
	userId: Id<"users">
) {
	return await t.run(
		async (ctx) =>
			await ctx.db.insert("borrowers", {
				userId,
				name: "Test Borrower",
				email: `borrower_${Date.now()}@example.com`,
				rotessaCustomerId: `rotessa_${Date.now()}`,
			})
	);
}

/**
 * Create a test mortgage for a borrower
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
					state: "ON",
					zip: "M5V1A1",
					country: "Canada",
				},
				location: { lat: 43.65, lng: -79.38 },
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
 * Create a deferral request directly in DB
 */
async function createDeferralRequest(
	t: ReturnType<typeof createTest>,
	borrowerId: Id<"borrowers">,
	mortgageId: Id<"mortgages">,
	options?: {
		status?: "pending" | "approved" | "rejected";
		createdAt?: string;
		requestedDeferralDate?: string;
	}
) {
	const now = new Date();
	const futureDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

	return await t.run(
		async (ctx) =>
			await ctx.db.insert("deferral_requests", {
				borrowerId,
				mortgageId,
				requestType: "one_time" as const,
				requestedDeferralDate:
					options?.requestedDeferralDate ??
					futureDate.toISOString().slice(0, 10),
				reason: "Test deferral request",
				status: options?.status ?? "pending",
				createdAt: options?.createdAt ?? now.toISOString(),
			})
	);
}

/**
 * Get a future date string within 30 days
 */
function getFutureDateString(daysFromNow = 14): string {
	const date = new Date();
	date.setDate(date.getDate() + daysFromNow);
	return date.toISOString().slice(0, 10);
}

// ============================================================================
// checkEligibility Tests
// ============================================================================

describe("checkEligibility", () => {
	test("should return eligible=true for borrower with no prior deferrals", async () => {
		const t = createTest();

		// Create user, borrower, and mortgage
		const userId = await createTestUser(t, "eligible_borrower");
		const borrowerId = await createTestBorrower(t, userId);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const userIdpId = await getUserIdpId(t, userId);

		const result = await t
			.withIdentity({ subject: userIdpId })
			.query(api.deferralRequests.checkEligibility, { mortgageId });

		expect(result.eligible).toBe(true);
		expect(result.reason).toBeUndefined();
	});

	test("should return eligible=false when deferral already approved this year", async () => {
		const t = createTest();

		const userId = await createTestUser(t, "ineligible_borrower");
		const borrowerId = await createTestBorrower(t, userId);
		const mortgageId = await createTestMortgage(t, borrowerId);

		// Create an approved deferral this year
		await createDeferralRequest(t, borrowerId, mortgageId, {
			status: "approved",
			createdAt: new Date().toISOString(),
		});

		const userIdpId = await getUserIdpId(t, userId);

		const result = await t
			.withIdentity({ subject: userIdpId })
			.query(api.deferralRequests.checkEligibility, { mortgageId });

		expect(result.eligible).toBe(false);
		expect(result.reason).toContain("already used");
		expect(result.previousDeferral).toBeDefined();
	});

	test("should return eligible=false when pending request exists", async () => {
		const t = createTest();

		const userId = await createTestUser(t, "pending_borrower");
		const borrowerId = await createTestBorrower(t, userId);
		const mortgageId = await createTestMortgage(t, borrowerId);

		// Create a pending deferral request
		await createDeferralRequest(t, borrowerId, mortgageId, {
			status: "pending",
		});

		const userIdpId = await getUserIdpId(t, userId);

		const result = await t
			.withIdentity({ subject: userIdpId })
			.query(api.deferralRequests.checkEligibility, { mortgageId });

		expect(result.eligible).toBe(false);
		expect(result.reason).toContain("pending");
	});

	test("should return eligible=false for mortgage not owned by borrower", async () => {
		const t = createTest();

		// Create two users with their own borrower profiles
		const userId1 = await createTestUser(t, "borrower_1");
		const userId2 = await createTestUser(t, "borrower_2");
		const borrowerId1 = await createTestBorrower(t, userId1);
		const _borrowerId2 = await createTestBorrower(t, userId2);

		// Create mortgage owned by borrower1
		const mortgageId = await createTestMortgage(t, borrowerId1);

		// Try to check eligibility as borrower2
		const user2IdpId = await getUserIdpId(t, userId2);

		const result = await t
			.withIdentity({ subject: user2IdpId })
			.query(api.deferralRequests.checkEligibility, { mortgageId });

		expect(result.eligible).toBe(false);
		expect(result.reason).toContain("not owned");
	});
});

// ============================================================================
// requestDeferral Tests
// ============================================================================

describe("requestDeferral", () => {
	test("should create deferral request when eligible", async () => {
		const t = createTest();

		const userId = await createTestUser(t, "new_request_borrower");
		const borrowerId = await createTestBorrower(t, userId);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const userIdpId = await getUserIdpId(t, userId);

		const requestedDate = getFutureDateString(14);

		const requestId = await t
			.withIdentity({ subject: userIdpId })
			.mutation(api.deferralRequests.requestDeferral, {
				mortgageId,
				requestType: "one_time",
				requestedDeferralDate: requestedDate,
				reason: "Financial difficulty",
			});

		expect(requestId).toBeDefined();

		// Verify the request was created correctly
		const request = (await t.run(async (ctx) =>
			ctx.db.get(requestId)
		)) as Doc<"deferral_requests"> | null;
		expect(request).toBeDefined();
		expect(request?.status).toBe("pending");
		expect(request?.requestType).toBe("one_time");
		expect(request?.mortgageId).toBe(mortgageId);
	});

	test("should reject deferral request when already approved this year", async () => {
		const t = createTest();

		const userId = await createTestUser(t, "already_approved_borrower");
		const borrowerId = await createTestBorrower(t, userId);
		const mortgageId = await createTestMortgage(t, borrowerId);

		// Create approved deferral
		await createDeferralRequest(t, borrowerId, mortgageId, {
			status: "approved",
		});

		const userIdpId = await getUserIdpId(t, userId);

		await expect(
			t
				.withIdentity({ subject: userIdpId })
				.mutation(api.deferralRequests.requestDeferral, {
					mortgageId,
					requestType: "one_time",
					requestedDeferralDate: getFutureDateString(14),
				})
		).rejects.toThrow("already used");
	});

	test("should reject deferral date more than 30 days in future", async () => {
		const t = createTest();

		const userId = await createTestUser(t, "too_far_future_borrower");
		const borrowerId = await createTestBorrower(t, userId);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const userIdpId = await getUserIdpId(t, userId);

		// 45 days in the future
		const tooFarDate = getFutureDateString(45);

		await expect(
			t
				.withIdentity({ subject: userIdpId })
				.mutation(api.deferralRequests.requestDeferral, {
					mortgageId,
					requestType: "one_time",
					requestedDeferralDate: tooFarDate,
				})
		).rejects.toThrow("within 30 days");
	});

	test("should reject deferral date in the past", async () => {
		const t = createTest();

		const userId = await createTestUser(t, "past_date_borrower");
		const borrowerId = await createTestBorrower(t, userId);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const userIdpId = await getUserIdpId(t, userId);

		// Yesterday
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		const pastDate = yesterday.toISOString().slice(0, 10);

		await expect(
			t
				.withIdentity({ subject: userIdpId })
				.mutation(api.deferralRequests.requestDeferral, {
					mortgageId,
					requestType: "one_time",
					requestedDeferralDate: pastDate,
				})
		).rejects.toThrow("in the future");
	});
});

// ============================================================================
// approveDeferral Tests
// ============================================================================

describe("approveDeferral", () => {
	test("should approve pending deferral request", async () => {
		const t = createTest();

		// Create user and mortgage
		const userId = await createTestUser(t, "approve_test_user");
		const borrowerId = await createTestBorrower(t, userId);
		const mortgageId = await createTestMortgage(t, borrowerId);

		// Create pending deferral
		const requestId = await createDeferralRequest(t, borrowerId, mortgageId, {
			status: "pending",
		});

		// Create admin user
		const adminUserId = await createTestUser(t, "admin_approver");
		const adminIdpId = await getUserIdpId(t, adminUserId);

		// Approve the request
		const result = await t
			.withIdentity({ subject: adminIdpId, role: "admin" })
			.mutation(api.deferralRequests.approveDeferral, {
				requestId,
				reason: "Approved per policy",
			});

		expect(result).toBe(requestId);

		// Verify status changed
		const updatedRequest = await t.run(async (ctx) => ctx.db.get(requestId));
		expect(updatedRequest?.status).toBe("approved");
		expect(updatedRequest?.adminDecision).toBeDefined();
		expect(updatedRequest?.adminDecision?.decidedBy).toBe(adminUserId);
	});

	test("should reject approving already approved request", async () => {
		const t = createTest();

		const userId = await createTestUser(t, "double_approve_user");
		const borrowerId = await createTestBorrower(t, userId);
		const mortgageId = await createTestMortgage(t, borrowerId);

		// Create already approved deferral
		const requestId = await createDeferralRequest(t, borrowerId, mortgageId, {
			status: "approved",
		});

		const adminUserId = await createTestUser(t, "admin_double_approver");
		const adminIdpId = await getUserIdpId(t, adminUserId);

		await expect(
			t
				.withIdentity({ subject: adminIdpId, role: "admin" })
				.mutation(api.deferralRequests.approveDeferral, { requestId })
		).rejects.toThrow("already approved");
	});
});

// ============================================================================
// rejectDeferral Tests
// ============================================================================

describe("rejectDeferral", () => {
	test("should reject pending deferral request with reason", async () => {
		const t = createTest();

		const userId = await createTestUser(t, "reject_test_user");
		const borrowerId = await createTestBorrower(t, userId);
		const mortgageId = await createTestMortgage(t, borrowerId);

		const requestId = await createDeferralRequest(t, borrowerId, mortgageId, {
			status: "pending",
		});

		const adminUserId = await createTestUser(t, "admin_rejecter");
		const adminIdpId = await getUserIdpId(t, adminUserId);

		const result = await t
			.withIdentity({ subject: adminIdpId, role: "admin" })
			.mutation(api.deferralRequests.rejectDeferral, {
				requestId,
				reason: "Does not meet criteria",
			});

		expect(result).toBe(requestId);

		// Verify status changed
		const updatedRequest = await t.run(async (ctx) => ctx.db.get(requestId));
		expect(updatedRequest?.status).toBe("rejected");
		expect(updatedRequest?.adminDecision?.reason).toBe(
			"Does not meet criteria"
		);
	});

	test("should reject rejecting already rejected request", async () => {
		const t = createTest();

		const userId = await createTestUser(t, "double_reject_user");
		const borrowerId = await createTestBorrower(t, userId);
		const mortgageId = await createTestMortgage(t, borrowerId);

		const requestId = await createDeferralRequest(t, borrowerId, mortgageId, {
			status: "rejected",
		});

		const adminUserId = await createTestUser(t, "admin_double_rejecter");
		const adminIdpId = await getUserIdpId(t, adminUserId);

		await expect(
			t
				.withIdentity({ subject: adminIdpId, role: "admin" })
				.mutation(api.deferralRequests.rejectDeferral, {
					requestId,
					reason: "Already handled",
				})
		).rejects.toThrow("already rejected");
	});
});

// ============================================================================
// getMyDeferralRequests Tests
// ============================================================================

describe("getMyDeferralRequests", () => {
	test("should return borrower's deferral requests", async () => {
		const t = createTest();

		const userId = await createTestUser(t, "my_requests_user");
		const borrowerId = await createTestBorrower(t, userId);
		const mortgageId = await createTestMortgage(t, borrowerId);

		// Create multiple requests
		await createDeferralRequest(t, borrowerId, mortgageId, {
			status: "pending",
		});
		await createDeferralRequest(t, borrowerId, mortgageId, {
			status: "rejected",
		});

		const userIdpId = await getUserIdpId(t, userId);

		const requests = await t
			.withIdentity({ subject: userIdpId })
			.query(api.deferralRequests.getMyDeferralRequests, {});

		expect(requests.length).toBe(2);
	});

	test("should filter by status", async () => {
		const t = createTest();

		const userId = await createTestUser(t, "filter_requests_user");
		const borrowerId = await createTestBorrower(t, userId);
		const mortgageId = await createTestMortgage(t, borrowerId);

		await createDeferralRequest(t, borrowerId, mortgageId, {
			status: "pending",
		});
		await createDeferralRequest(t, borrowerId, mortgageId, {
			status: "rejected",
		});

		const userIdpId = await getUserIdpId(t, userId);

		const pendingRequests = await t
			.withIdentity({ subject: userIdpId })
			.query(api.deferralRequests.getMyDeferralRequests, { status: "pending" });

		expect(pendingRequests.length).toBe(1);
		expect(pendingRequests[0]?.status).toBe("pending");
	});
});
