// @vitest-environment node
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import type { Doc, Id } from "../_generated/dataModel";

// @ts-ignore
const modules = import.meta.glob("../**/*.{ts,js,tsx,jsx}", { eager: false });
const createTest = () => convexTest(schema, modules);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get an authenticated test instance with admin role
 */
function getAuthenticatedTest(t: ReturnType<typeof createTest>) {
	return t.withIdentity({
		subject: "test-admin-user",
		role: "admin",
	});
}

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
 */
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
async function createTestLockRequest(
	t: ReturnType<typeof createTest>,
	listingId: Id<"listings">,
	requestedBy: Id<"users">,
	options?: {
		status?: "pending" | "approved" | "rejected" | "expired";
		requestNotes?: string;
		lawyerName?: string;
		lawyerLSONumber?: string;
		lawyerEmail?: string;
	}
) {
	return await t.run(async (ctx) => {
		return await ctx.db.insert("lock_requests", {
			listingId,
			requestedBy,
			status: options?.status ?? "pending",
			requestedAt: Date.now(),
			requestNotes: options?.requestNotes,
			lawyerName: options?.lawyerName ?? "John Doe",
			lawyerLSONumber: options?.lawyerLSONumber ?? "12345",
			lawyerEmail: options?.lawyerEmail ?? "john@example.com",
		});
	});
}

// ============================================================================
// Section 2.1: Unit Tests for Mutations
// ============================================================================

describe("createLockRequest - Unit Tests", () => {
	test("2.1.1: should create lock request with valid investor", async () => {
		const t = createTest();

		// Setup test data
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);
		const investorId = await createTestUser(t, "investor_1");

		// Get the user's idp_id for identity matching
		const investor = await t.run(async (ctx) => ctx.db.get(investorId));
		const investorIdpId = investor?.idp_id;

		// Mock investor identity
		const investorT = t.withIdentity({
			subject: investorIdpId!,
			role: "investor",
		});

		// Create lock request
		const requestId = await investorT.mutation(
			api.lockRequests.createLockRequest,
			{
				listingId,
				requestNotes: "Interested in purchasing 50%",
				lawyerName: "John Doe",
				lawyerLSONumber: "12345",
				lawyerEmail: "john@example.com",
			}
		);

		expect(requestId).toBeDefined();

		// Verify request was created
		const request = await t.run(async (ctx) => ctx.db.get(requestId)) as Doc<"lock_requests"> | null;
		expect(request).toBeTruthy();
		expect(request?.status).toBe("pending");
		expect(request?.listingId).toBe(listingId);
		expect(request?.requestNotes).toBe("Interested in purchasing 50%");
		expect(request?.lawyerName).toBe("John Doe");
		expect(request?.lawyerLSONumber).toBe("12345");
		expect(request?.lawyerEmail).toBe("john@example.com");
		expect(request?.requestedAt).toBeDefined();
	});

	test("2.1.2: should reject createLockRequest for locked listing", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const userId = await createTestUser(t, "user_1");
		const listingId = await createTestListing(t, mortgageId, {
			locked: true,
			lockedBy: userId,
		});
		const investorId = await createTestUser(t, "investor_1");
		const investorIdpId = await getUserIdpId(t, investorId);

		const investorT = t.withIdentity({
			subject: investorIdpId,
			role: "investor",
		});

		await expect(
			investorT.mutation(api.lockRequests.createLockRequest, {
				listingId,
				lawyerName: "John Doe",
				lawyerLSONumber: "12345",
				lawyerEmail: "john@example.com",
			})
		).rejects.toThrow("Listing is already locked");
	});

	test("2.1.2: should reject createLockRequest for hidden listing", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId, {
			visible: false,
		});
		const investorId = await createTestUser(t, "investor_1");
		const investorIdpId = await getUserIdpId(t, investorId);

		const investorT = t.withIdentity({
			subject: investorIdpId,
			role: "investor",
		});

		await expect(
			investorT.mutation(api.lockRequests.createLockRequest, {
				listingId,
				lawyerName: "John Doe",
				lawyerLSONumber: "12345",
				lawyerEmail: "john@example.com",
			})
		).rejects.toThrow("Listing is not visible");
	});

	test("2.1.2: should reject createLockRequest with notes too long", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);
		const longNotes = "a".repeat(1001); // 1001 characters
		const investorId = await createTestUser(t, "investor_1");
		const investorIdpId = await getUserIdpId(t, investorId);

		const investorT = t.withIdentity({
			subject: investorIdpId,
			role: "investor",
		});

		await expect(
			investorT.mutation(api.lockRequests.createLockRequest, {
				listingId,
				requestNotes: longNotes,
				lawyerName: "John Doe",
				lawyerLSONumber: "12345",
				lawyerEmail: "john@example.com",
			})
		).rejects.toThrow("Request notes exceed character limit of 1000");
	});

	test("2.1.3: should allow admin to create lock request", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);
		const adminId = await createTestUser(t, "admin_1");
		const adminIdpId = await getUserIdpId(t, adminId);

		const adminT = t.withIdentity({
			subject: adminIdpId,
			role: "admin",
		});

		const requestId = await adminT.mutation(
			api.lockRequests.createLockRequest,
			{
				listingId,
				lawyerName: "John Doe",
				lawyerLSONumber: "12345",
				lawyerEmail: "john@example.com",
			}
		);

		expect(requestId).toBeDefined();
	});

	test("2.1.3: should reject createLockRequest without investor role", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);
		const userId = await createTestUser(t, "user_1");
		const userIdpId = await getUserIdpId(t, userId);

		const userT = t.withIdentity({
			subject: userIdpId,
			role: "user",
		});

		await expect(
			userT.mutation(api.lockRequests.createLockRequest, {
				listingId,
				lawyerName: "John Doe",
				lawyerLSONumber: "12345",
				lawyerEmail: "john@example.com",
			})
		).rejects.toThrow("Unauthorized: Investor role required");
	});

	test("2.1.3: should reject createLockRequest without authentication", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);

		await expect(
			t.mutation(api.lockRequests.createLockRequest, {
				listingId,
				lawyerName: "John Doe",
				lawyerLSONumber: "12345",
				lawyerEmail: "john@example.com",
			})
		).rejects.toThrow("Authentication required");
	});

	test("should reject createLockRequest with invalid lawyer email", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);
		const investorId = await createTestUser(t, "investor_1");
		const investorIdpId = await getUserIdpId(t, investorId);

		const investorT = t.withIdentity({
			subject: investorIdpId,
			role: "investor",
		});

		await expect(
			investorT.mutation(api.lockRequests.createLockRequest, {
				listingId,
				lawyerName: "John Doe",
				lawyerLSONumber: "12345",
				lawyerEmail: "invalid-email",
			})
		).rejects.toThrow("Invalid lawyer email format");
	});

	test("should reject createLockRequest with empty lawyer name", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);
		const investorId = await createTestUser(t, "investor_1");
		const investorIdpId = await getUserIdpId(t, investorId);

		const investorT = t.withIdentity({
			subject: investorIdpId,
			role: "investor",
		});

		await expect(
			investorT.mutation(api.lockRequests.createLockRequest, {
				listingId,
				lawyerName: "",
				lawyerLSONumber: "12345",
				lawyerEmail: "john@example.com",
			})
		).rejects.toThrow("Lawyer name is required");
	});
});

describe("approveLockRequest - Unit Tests", () => {
	test("2.1.4: should approve lock request atomically", async () => {
		const t = createTest();

		// Setup test data
		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);
		const investorId = await createTestUser(t, "investor_1");
		const adminId = await createTestUser(t, "admin_1");

		// Create pending request
		const requestId = await createTestLockRequest(
			t,
			listingId,
			investorId
		);

		// Mock admin identity
		const adminIdpId = await getUserIdpId(t, adminId);
		const adminT = t.withIdentity({
			subject: adminIdpId,
			role: "admin",
		});

		// Approve request
		const approvedRequestId = await adminT.mutation(
			api.lockRequests.approveLockRequest,
			{
				requestId,
			}
		);

		expect(approvedRequestId).toBe(requestId);

		// Verify request was approved
		const request = await t.run(async (ctx) => ctx.db.get(requestId));
		expect(request?.status).toBe("approved");
		expect(request?.reviewedAt).toBeDefined();
		expect(request?.reviewedBy).toBeDefined();

		// Verify listing was locked
		const listing = await t.run(async (ctx) => ctx.db.get(listingId));
		expect(listing?.locked).toBe(true);
		expect(listing?.lockedBy).toBe(investorId);
		expect(listing?.lockedAt).toBeDefined();
	});

	test("2.1.5: should handle race condition (two admins approve simultaneously)", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);
		const investorId = await createTestUser(t, "investor_1");

		// Create two pending requests for same listing
		const requestId1 = await createTestLockRequest(
			t,
			listingId,
			investorId
		);
		const investorId2 = await createTestUser(t, "investor_2");
		const requestId2 = await createTestLockRequest(
			t,
			listingId,
			investorId2
		);

		// Mock two admin identities
		const adminId1 = await createTestUser(t, "admin_1");
		const adminId2 = await createTestUser(t, "admin_2");
		const adminIdpId1 = await getUserIdpId(t, adminId1);
		const adminIdpId2 = await getUserIdpId(t, adminId2);
		const adminT1 = t.withIdentity({
			subject: adminIdpId1,
			role: "admin",
		});
		const adminT2 = t.withIdentity({
			subject: adminIdpId2,
			role: "admin",
		});

		// Approve first request
		await adminT1.mutation(api.lockRequests.approveLockRequest, {
			requestId: requestId1,
		});

		// Try to approve second request (should fail - listing already locked)
		await expect(
			adminT2.mutation(api.lockRequests.approveLockRequest, {
				requestId: requestId2,
			})
		).rejects.toThrow("Listing is no longer available");

	// Verify only first request was approved
	const request1 = await t.run(async (ctx) => ctx.db.get(requestId1));
	const request2 = await t.run(async (ctx) => ctx.db.get(requestId2));
	expect(request1?.status).toBe("approved");
	// Request 2 was auto-rejected when request 1 was approved (listing was locked)
	expect(request2?.status).toBe("rejected");
	expect(request2?.rejectionReason).toBe("Listing was locked");

	// Verify listing is locked
	const listing = await t.run(async (ctx) => ctx.db.get(listingId));
	expect(listing?.locked).toBe(true);
	expect(listing?.lockedBy).toBe(investorId);
	});

	test("2.1.6: should reject approveLockRequest for already locked listing", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const userId = await createTestUser(t, "user_1");
		const listingId = await createTestListing(t, mortgageId, {
			locked: true,
			lockedBy: userId,
		});
		const investorId = await createTestUser(t, "investor_1");
		const requestId = await createTestLockRequest(
			t,
			listingId,
			investorId
		);

		const adminId = await createTestUser(t, "admin_1");
		const adminIdpId = await getUserIdpId(t, adminId);
		const adminT = t.withIdentity({
			subject: adminIdpId,
			role: "admin",
		});

		await expect(
			adminT.mutation(api.lockRequests.approveLockRequest, {
				requestId,
			})
		).rejects.toThrow("Listing is no longer available");
	});

	test("2.1.6: should reject approveLockRequest for non-pending request", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);
		const investorId = await createTestUser(t, "investor_1");
		const requestId = await createTestLockRequest(
			t,
			listingId,
			investorId,
			{ status: "rejected" }
		);

		const adminId = await createTestUser(t, "admin_1");
		const adminIdpId = await getUserIdpId(t, adminId);
		const adminT = t.withIdentity({
			subject: adminIdpId,
			role: "admin",
		});

		await expect(
			adminT.mutation(api.lockRequests.approveLockRequest, {
				requestId,
			})
		).rejects.toThrow("Request is not pending");
	});

	test("should reject approveLockRequest without admin role", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);
		const investorId = await createTestUser(t, "investor_1");
		const requestId = await createTestLockRequest(
			t,
			listingId,
			investorId
		);

		const investorIdpId = await getUserIdpId(t, investorId);
		const investorT = t.withIdentity({
			subject: investorIdpId,
			role: "investor",
		});

		await expect(
			investorT.mutation(api.lockRequests.approveLockRequest, {
				requestId,
			})
		).rejects.toThrow("Unauthorized: Admin privileges required");
	});
});

describe("rejectLockRequest - Unit Tests", () => {
	test("2.1.7: should reject lock request with optional reason", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);
		const investorId = await createTestUser(t, "investor_1");
		const requestId = await createTestLockRequest(
			t,
			listingId,
			investorId
		);

		const adminId = await createTestUser(t, "admin_1");
		const adminIdpId = await getUserIdpId(t, adminId);
		const adminT = t.withIdentity({
			subject: adminIdpId,
			role: "admin",
		});

		const rejectedRequestId = await adminT.mutation(
			api.lockRequests.rejectLockRequest,
			{
				requestId,
				rejectionReason: "Incomplete documentation",
			}
		);

		expect(rejectedRequestId).toBe(requestId);

		// Verify request was rejected
		const request = await t.run(async (ctx) => ctx.db.get(requestId));
		expect(request?.status).toBe("rejected");
		expect(request?.rejectionReason).toBe("Incomplete documentation");
		expect(request?.reviewedAt).toBeDefined();
		expect(request?.reviewedBy).toBeDefined();

		// Verify listing remains unlocked
		const listing = await t.run(async (ctx) => ctx.db.get(listingId));
		expect(listing?.locked).toBe(false);
	});

	test("2.1.7: should reject lock request without reason", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);
		const investorId = await createTestUser(t, "investor_1");
		const requestId = await createTestLockRequest(
			t,
			listingId,
			investorId
		);

		const adminId = await createTestUser(t, "admin_1");
		const adminIdpId = await getUserIdpId(t, adminId);
		const adminT = t.withIdentity({
			subject: adminIdpId,
			role: "admin",
		});

		await adminT.mutation(api.lockRequests.rejectLockRequest, {
			requestId,
		});

		const request = await t.run(async (ctx) => ctx.db.get(requestId));
		expect(request?.status).toBe("rejected");
		expect(request?.rejectionReason).toBeUndefined();
	});

	test("2.1.8: should reject rejectLockRequest without admin role", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);
		const investorId = await createTestUser(t, "investor_1");
		const requestId = await createTestLockRequest(
			t,
			listingId,
			investorId
		);

		const investorIdpId = await getUserIdpId(t, investorId);
		const investorT = t.withIdentity({
			subject: investorIdpId,
			role: "investor",
		});

		await expect(
			investorT.mutation(api.lockRequests.rejectLockRequest, {
				requestId,
			})
		).rejects.toThrow("Unauthorized: Admin privileges required");
	});

	test("should reject rejectLockRequest for non-pending request", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);
		const investorId = await createTestUser(t, "investor_1");
		const requestId = await createTestLockRequest(
			t,
			listingId,
			investorId,
			{ status: "approved" }
		);

		const adminId = await createTestUser(t, "admin_1");
		const adminIdpId = await getUserIdpId(t, adminId);
		const adminT = t.withIdentity({
			subject: adminIdpId,
			role: "admin",
		});

		await expect(
			adminT.mutation(api.lockRequests.rejectLockRequest, {
				requestId,
			})
		).rejects.toThrow("Request is not pending");
	});
});

describe("cancelLockRequest - Unit Tests", () => {
	test("2.1.9: should cancel lock request with ownership validation", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);
		const investorId = await createTestUser(t, "investor_1");
		const requestId = await createTestLockRequest(
			t,
			listingId,
			investorId
		);

		const investorIdpId = await getUserIdpId(t, investorId);
		const investorT = t.withIdentity({
			subject: investorIdpId,
			role: "investor",
		});

		const cancelledRequestId = await investorT.mutation(
			api.lockRequests.cancelLockRequest,
			{
				requestId,
			}
		);

		expect(cancelledRequestId).toBe(requestId);

		// Verify request was deleted
		const request = await t.run(async (ctx) => ctx.db.get(requestId));
		expect(request).toBeNull();
	});

	test("2.1.9: should reject cancelLockRequest for another investor's request", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);
		const investorId1 = await createTestUser(t, "investor_1");
		const investorId2 = await createTestUser(t, "investor_2");
		const requestId = await createTestLockRequest(
			t,
			listingId,
			investorId1
		);

		const investorIdpId2 = await getUserIdpId(t, investorId2);
		const investorT2 = t.withIdentity({
			subject: investorIdpId2,
			role: "investor",
		});

		await expect(
			investorT2.mutation(api.lockRequests.cancelLockRequest, {
				requestId,
			})
		).rejects.toThrow("Unauthorized: Not your request");
	});

	test("2.1.10: should reject cancelLockRequest for non-pending request", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);
		const investorId = await createTestUser(t, "investor_1");
		const requestId = await createTestLockRequest(
			t,
			listingId,
			investorId,
			{ status: "approved" }
		);

		const investorIdpId = await getUserIdpId(t, investorId);
		const investorT = t.withIdentity({
			subject: investorIdpId,
			role: "investor",
		});

		await expect(
			investorT.mutation(api.lockRequests.cancelLockRequest, {
				requestId,
			})
		).rejects.toThrow("Request is not pending");
	});
});

// ============================================================================
// Section 2.2: Query Tests
// ============================================================================

describe("getPendingLockRequests - Query Tests", () => {
	test("2.2.1: should filter pending requests correctly", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId1 = await createTestListing(t, mortgageId);
		const listingId2 = await createTestListing(t, mortgageId);
		const investorId1 = await createTestUser(t, "investor_1");
		const investorId2 = await createTestUser(t, "investor_2");

		// Create pending requests
		await createTestLockRequest(t, listingId1, investorId1, {
			status: "pending",
		});
		await createTestLockRequest(t, listingId2, investorId2, {
			status: "pending",
		});

		// Create approved request (should not appear)
		await createTestLockRequest(t, listingId1, investorId1, {
			status: "approved",
		});

		const authT = getAuthenticatedTest(t);
		const pendingRequests = await authT.query(
			api.lockRequests.getPendingLockRequests
		);

		expect(pendingRequests).toHaveLength(2);
		expect(pendingRequests?.every((r: { status: string }) => r.status === "pending")).toBe(true);
	});
});

describe("getPendingLockRequestsWithDetails - Query Tests", () => {
	test("2.2.2: should join listing, mortgage, borrower, and investor data", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);
		const investorId = await createTestUser(t, "investor_1");
		await createTestLockRequest(t, listingId, investorId, {
			status: "pending",
		});

		const authT = getAuthenticatedTest(t);
		const requests = await authT.query(
			api.lockRequests.getPendingLockRequestsWithDetails
		);

		expect(requests).toHaveLength(1);
		const request = requests?.[0];
		expect(request?.request).toBeDefined();
		expect(request?.listing).toBeDefined();
		expect(request?.mortgage).toBeDefined();
		expect(request?.investor).toBeDefined();
		expect("borrower" in request && request.borrower).toBeDefined();
	});
});

describe("getApprovedLockRequests - Query Tests", () => {
	test("2.2.3: should filter approved requests correctly", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);
		const investorId = await createTestUser(t, "investor_1");

		// Create approved request
		await createTestLockRequest(t, listingId, investorId, {
			status: "approved",
		});

		// Create pending request (should not appear)
		await createTestLockRequest(t, listingId, investorId, {
			status: "pending",
		});

		const authT = getAuthenticatedTest(t);
		const approvedRequests = await authT.query(
			api.lockRequests.getApprovedLockRequests
		);

		expect(approvedRequests).toHaveLength(1);
		expect(approvedRequests?.[0].status).toBe("approved");
	});
});

describe("getRejectedLockRequests - Query Tests", () => {
	test("2.2.4: should filter rejected requests correctly", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);
		const investorId = await createTestUser(t, "investor_1");

		// Create rejected request
		await createTestLockRequest(t, listingId, investorId, {
			status: "rejected",
		});

		// Create pending request (should not appear)
		await createTestLockRequest(t, listingId, investorId, {
			status: "pending",
		});

		const authT = getAuthenticatedTest(t);
		const rejectedRequests = await authT.query(
			api.lockRequests.getRejectedLockRequests
		);

		expect(rejectedRequests).toHaveLength(1);
		expect(rejectedRequests?.[0].status).toBe("rejected");
	});
});

describe("getLockRequestsByListing - Query Tests", () => {
	test("2.2.5: should use by_listing index for querying", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId1 = await createTestListing(t, mortgageId);
		const listingId2 = await createTestListing(t, mortgageId);
		const investorId1 = await createTestUser(t, "investor_1");
		const investorId2 = await createTestUser(t, "investor_2");

		// Create requests for listing 1
		await createTestLockRequest(t, listingId1, investorId1, {
			status: "pending",
		});
		await createTestLockRequest(t, listingId1, investorId2, {
			status: "approved",
		});

		// Create request for listing 2
		await createTestLockRequest(t, listingId2, investorId1, {
			status: "pending",
		});

		const authT = getAuthenticatedTest(t);
		const requests = await authT.query(
			api.lockRequests.getLockRequestsByListing,
			{
				listingId: listingId1,
			}
		);

		expect(requests).toHaveLength(2);
		expect(requests?.every((r: Doc<"lock_requests">) => r.listingId === listingId1)).toBe(true);
	});
});

describe("getPendingLockRequestsByListing - Query Tests", () => {
	test("2.2.6: should use compound index for pending count", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);
		const investorId1 = await createTestUser(t, "investor_1");
		const investorId2 = await createTestUser(t, "investor_2");

		// Create pending requests
		await createTestLockRequest(t, listingId, investorId1, {
			status: "pending",
		});
		await createTestLockRequest(t, listingId, investorId2, {
			status: "pending",
		});

		// Create approved request (should not be counted)
		await createTestLockRequest(t, listingId, investorId1, {
			status: "approved",
		});

		const authT = getAuthenticatedTest(t);
		const requests = await authT.query(
			api.lockRequests.getPendingLockRequestsByListing,
			{
				listingId,
			}
		);

		expect(requests).toHaveLength(2);
	});
});

describe("getUserLockRequests - Query Tests", () => {
	test("2.2.7: should filter by requestedBy", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);
		const investorId1 = await createTestUser(t, "investor_1");
		const investorId2 = await createTestUser(t, "investor_2");

		// Create requests for investor 1
		await createTestLockRequest(t, listingId, investorId1, {
			status: "pending",
		});

		// Create request for investor 2
		await createTestLockRequest(t, listingId, investorId2, {
			status: "pending",
		});

		// Query as investor 1
		const investorIdpId1 = await getUserIdpId(t, investorId1);
		const investorT1 = t.withIdentity({
			subject: investorIdpId1,
			role: "investor",
		});

		const userRequests = await investorT1.query(
			api.lockRequests.getUserLockRequests,
			{}
		);

		expect(userRequests).toHaveLength(1);
		expect(userRequests?.[0].requestedBy).toBe(investorId1);
	});
});

// ============================================================================
// Section 2.3: Integration Tests
// ============================================================================

describe("Listing-Request Relationship - Integration Tests", () => {
	test("2.3.1: should prevent listing deletion with pending requests", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);
		const investorId = await createTestUser(t, "investor_1");
		await createTestLockRequest(t, listingId, investorId, {
			status: "pending",
		});

		const adminId = await createTestUser(t, "admin_1");
		const adminIdpId = await getUserIdpId(t, adminId);
		const adminT = t.withIdentity({
			subject: adminIdpId,
			role: "admin",
		});

		await expect(
			adminT.mutation(api.listings.deleteListing, {
				listingId,
			})
		).rejects.toThrow("Cannot delete listing with existing lock requests");
	});

	test("2.3.2: should prevent listing deletion with approved requests", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);
		const investorId = await createTestUser(t, "investor_1");
		await createTestLockRequest(t, listingId, investorId, {
			status: "approved",
		});

		const adminId = await createTestUser(t, "admin_1");
		const adminIdpId = await getUserIdpId(t, adminId);
		const adminT = t.withIdentity({
			subject: adminIdpId,
			role: "admin",
		});

		await expect(
			adminT.mutation(api.listings.deleteListing, {
				listingId,
			})
		).rejects.toThrow("Cannot delete listing with existing lock requests");
	});

	test("2.3.3: should prevent listing deletion with rejected requests", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);
		const investorId = await createTestUser(t, "investor_1");
		await createTestLockRequest(t, listingId, investorId, {
			status: "rejected",
		});

		const adminId = await createTestUser(t, "admin_1");
		const adminIdpId = await getUserIdpId(t, adminId);
		const adminT = t.withIdentity({
			subject: adminIdpId,
			role: "admin",
		});

		await expect(
			adminT.mutation(api.listings.deleteListing, {
				listingId,
			})
		).rejects.toThrow("Cannot delete listing with existing lock requests");
	});

	test("2.3.4: should allow listing deletion after cleaning up requests", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);
		const investorId = await createTestUser(t, "investor_1");
		const requestId = await createTestLockRequest(t, listingId, investorId, {
			status: "pending",
		});

		// Delete the request
		await t.run(async (ctx) => {
			await ctx.db.delete(requestId);
		});

		const adminId = await createTestUser(t, "admin_1");
		const adminIdpId = await getUserIdpId(t, adminId);
		const adminT = t.withIdentity({
			subject: adminIdpId,
			role: "admin",
		});

		// Now deletion should succeed
		const deletedId = await adminT.mutation(api.listings.deleteListing, {
			listingId,
		});

		expect(deletedId).toBe(listingId);

		// Verify listing was deleted
		const listing = await t.run(async (ctx) => ctx.db.get(listingId));
		expect(listing).toBeNull();
	});

	test("2.3.5: should allow multiple pending requests per listing", async () => {
		const t = createTest();

		const borrowerId = await createTestBorrower(t);
		const mortgageId = await createTestMortgage(t, borrowerId);
		const listingId = await createTestListing(t, mortgageId);
		const investorId1 = await createTestUser(t, "investor_1");
		const investorId2 = await createTestUser(t, "investor_2");
		const investorId3 = await createTestUser(t, "investor_3");

		// Create multiple pending requests
		const requestId1 = await createTestLockRequest(
			t,
			listingId,
			investorId1,
			{ status: "pending" }
		);
		const requestId2 = await createTestLockRequest(
			t,
			listingId,
			investorId2,
			{ status: "pending" }
		);
		const requestId3 = await createTestLockRequest(
			t,
			listingId,
			investorId3,
			{ status: "pending" }
		);

		// Verify all requests exist
		const request1 = await t.run(async (ctx) => ctx.db.get(requestId1));
		const request2 = await t.run(async (ctx) => ctx.db.get(requestId2));
		const request3 = await t.run(async (ctx) => ctx.db.get(requestId3));

		expect(request1).toBeTruthy();
		expect(request2).toBeTruthy();
		expect(request3).toBeTruthy();
		expect(request1?.status).toBe("pending");
		expect(request2?.status).toBe("pending");
		expect(request3?.status).toBe("pending");

		// Verify count query returns 3
		const authT = getAuthenticatedTest(t);
		const requests = await authT.query(
			api.lockRequests.getPendingLockRequestsByListing,
			{
				listingId,
			}
		);
		expect(requests).toHaveLength(3);
	});
});

