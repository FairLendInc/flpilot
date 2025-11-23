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
				metadata: { testUser: true, role: "admin" },
			});
		}
	});

	return t.withIdentity({ subject: adminIdpId, role: "admin" });
}

async function createTestUser(
	t: ReturnType<typeof createTest>,
	userIdentifier: string,
	role = "investor"
) {
	const idp_id = `test_${userIdentifier}`;
	const userId = await t.run(async (ctx) => {
		return await ctx.db.insert("users", {
			idp_id,
			email: `${userIdentifier}@test.example.com`,
			email_verified: true,
			first_name: "Test",
			last_name: userIdentifier,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			metadata: { testUser: true, role },
		});
	});
	return { userId, idp_id };
}

async function createTestBorrower(t: ReturnType<typeof createTest>) {
	return await t.run(async (ctx) => {
		return await ctx.db.insert("borrowers", {
			name: "Test Borrower",
			email: `test_borrower_${Date.now()}@example.com`,
			rotessaCustomerId: `rotessa_${Date.now()}`,
		});
	});
}

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
		location: { lat: 37.7749, lng: -122.4194 },
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

async function createTestListing(
	t: ReturnType<typeof createTest>,
	mortgageId: Id<"mortgages">
) {
	const adminT = await getAdminTest(t);
	return await adminT.mutation(api.listings.createListing, { mortgageId });
}

async function createLockRequest(
	t: ReturnType<typeof createTest>,
	listingId: Id<"listings">,
	investorIdpId: string
) {
	const investorT = t.withIdentity({ subject: investorIdpId, role: "investor" });
	return await investorT.mutation(api.lockRequests.createLockRequest, {
		listingId,
		lawyerName: "Test Lawyer",
		lawyerLSONumber: "12345",
		lawyerEmail: "lawyer@test.com",
		requestNotes: "Test lock request",
	});
}

async function approveLockRequest(
	t: ReturnType<typeof createTest>,
	lockRequestId: Id<"lock_requests">
) {
	const adminT = await getAdminTest(t);
	await adminT.mutation(api.lockRequests.approveLockRequest, {
		requestId: lockRequestId,
	});
}

async function createDealInPendingTransfer(t: ReturnType<typeof createTest>) {
	const { mortgageId } = await createTestMortgage(t);
	const listingId = await createTestListing(t, mortgageId);
	const { userId: investorId, idp_id: investorIdpId } = await createTestUser(
		t,
		`investor_${Date.now()}`
	);

	const lockRequestId = await createLockRequest(t, listingId, investorIdpId);
	await approveLockRequest(t, lockRequestId);

	const adminT = await getAdminTest(t);
	const result = await adminT.action(api.deals.createDeal, { lockRequestId });
	const dealId = result.dealId;

	// Move to pending_transfer state
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

	return { dealId, mortgageId, listingId, investorId, investorIdpId };
}

// ============================================================================
// Upload URL Generation Tests
// ============================================================================

async function generateFakeStorageId(t: ReturnType<typeof createTest>): Promise<Id<"_storage">> {
	// Use convex-test's internal ID generation to create a valid storage ID
	// The format is: <number>;<tableName>
	// We'll generate a unique number and use "_storage" as the table name
	const uniqueNum = Math.floor(Math.random() * 1000000000);
	return `${uniqueNum};_storage` as Id<"_storage">;
}


// ============================================================================
// Upload URL Generation Tests
// ============================================================================

describe("generateFundTransferUploadUrl - Authorization", () => {
	test("should allow investor to generate upload URL", async () => {
		const t = createTest();
		const { dealId, investorId, investorIdpId } =
			await createDealInPendingTransfer(t);

		const investorT = t.withIdentity({
			subject: investorIdpId,
			role: "investor",
		});

		const uploadUrl = await investorT.action(
			api.deals.generateFundTransferUploadUrl,
			{ dealId }
		);

		expect(uploadUrl).toBeDefined();
		expect(typeof uploadUrl).toBe("string");
	});

	test("should allow lawyer to generate upload URL", async () => {
		const t = createTest();
		const { dealId } = await createDealInPendingTransfer(t);

		const lawyerT = t.withIdentity({
			subject: "lawyer-subject",
			email: "lawyer@test.com", // Matches the lawyer email in deal
			role: "user",
		});

		const uploadUrl = await lawyerT.action(
			api.deals.generateFundTransferUploadUrl,
			{ dealId }
		);

		expect(uploadUrl).toBeDefined();
	});

	test("should allow admin to generate upload URL", async () => {
		const t = createTest();
		const { dealId } = await createDealInPendingTransfer(t);
		const adminT = await getAdminTest(t);

		const uploadUrl = await adminT.action(
			api.deals.generateFundTransferUploadUrl,
			{ dealId }
		);

		expect(uploadUrl).toBeDefined();
	});

	test("should reject unauthorized user", async () => {
		const t = createTest();
		const { dealId } = await createDealInPendingTransfer(t);

		const { idp_id: otherInvestorIdpId } = await createTestUser(
			t,
			`other_investor_${Date.now()}`
		);
		const otherInvestorT = t.withIdentity({
			subject: otherInvestorIdpId,
			role: "investor",
		});

		await expect(
			otherInvestorT.action(api.deals.generateFundTransferUploadUrl, {
				dealId,
			})
		).rejects.toThrow("Unauthorized");
	});

	test("should reject unauthenticated request", async () => {
		const t = createTest();
		const { dealId } = await createDealInPendingTransfer(t);

		await expect(
			t.action(api.deals.generateFundTransferUploadUrl, { dealId })
		).rejects.toThrow();
	});

	test("should reject for non-existent deal", async () => {
		const t = createTest();
		const adminT = await getAdminTest(t);
		const fakeDealId = "k123456789" as Id<"deals">;

		await expect(
			adminT.action(api.deals.generateFundTransferUploadUrl, {
				dealId: fakeDealId,
			})
		).rejects.toThrow("Deal not found");
	});
});

// ============================================================================
// Upload Recording Tests
// ============================================================================

describe("recordFundTransferUpload - File Upload", () => {
	test("should record PDF upload", async () => {
		const t = createTest();
		const { dealId, investorIdpId } = await createDealInPendingTransfer(t);

		// Create a fake storage ID (in real tests, would upload actual file)
		const fakeStorageId = await generateFakeStorageId(t);

		const investorT = t.withIdentity({
			subject: investorIdpId,
			role: "investor",
		});

		await investorT.mutation(api.deals.recordFundTransferUpload, {
			dealId,
			storageId: fakeStorageId,
			fileName: "proof_of_transfer.pdf",
			fileType: "application/pdf",
		});

		// Verify upload was recorded
		const deal = await t.run(async (ctx) => ctx.db.get(dealId));
		expect(deal?.currentUpload).toBeDefined();
		expect(deal?.currentUpload?.storageId).toBe(fakeStorageId);
		expect(deal?.currentUpload?.fileName).toBe("proof_of_transfer.pdf");
		expect(deal?.currentUpload?.fileType).toBe("application/pdf");
		expect(deal?.currentUpload?.uploadedBy).toBe(investorIdpId);
	});

	test("should record PNG image upload", async () => {
		const t = createTest();
		const { dealId, investorIdpId } = await createDealInPendingTransfer(t);

		const fakeStorageId = await generateFakeStorageId(t);
		const investorT = t.withIdentity({
			subject: investorIdpId,
			role: "investor",
		});

		await investorT.mutation(api.deals.recordFundTransferUpload, {
			dealId,
			storageId: fakeStorageId,
			fileName: "screenshot.png",
			fileType: "image/png",
		});

		const deal = await t.run(async (ctx) => ctx.db.get(dealId));
		expect(deal?.currentUpload?.fileType).toBe("image/png");
	});

	test("should record JPEG image upload", async () => {
		const t = createTest();
		const { dealId, investorIdpId } = await createDealInPendingTransfer(t);

		const fakeStorageId = await generateFakeStorageId(t);
		const investorT = t.withIdentity({
			subject: investorIdpId,
			role: "investor",
		});

		await investorT.mutation(api.deals.recordFundTransferUpload, {
			dealId,
			storageId: fakeStorageId,
			fileName: "receipt.jpg",
			fileType: "image/jpeg",
		});

		const deal = await t.run(async (ctx) => ctx.db.get(dealId));
		expect(deal?.currentUpload?.fileType).toBe("image/jpeg");
	});

	test("should reject invalid file type", async () => {
		const t = createTest();
		const { dealId, investorIdpId } = await createDealInPendingTransfer(t);

		const fakeStorageId = await generateFakeStorageId(t);
		const investorT = t.withIdentity({
			subject: investorIdpId,
			role: "investor",
		});

		await expect(
			investorT.mutation(api.deals.recordFundTransferUpload, {
				dealId,
				storageId: fakeStorageId,
				fileName: "document.docx",
				fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			})
		).rejects.toThrow("Invalid file type");
	});

	test("should reject text file upload", async () => {
		const t = createTest();
		const { dealId, investorIdpId } = await createDealInPendingTransfer(t);

		const fakeStorageId = await generateFakeStorageId(t);
		const investorT = t.withIdentity({
			subject: investorIdpId,
			role: "investor",
		});

		await expect(
			investorT.mutation(api.deals.recordFundTransferUpload, {
				dealId,
				storageId: fakeStorageId,
				fileName: "notes.txt",
				fileType: "text/plain",
			})
		).rejects.toThrow("Invalid file type");
	});
});

// ============================================================================
// Upload History Tests
// ============================================================================

describe("recordFundTransferUpload - Upload History", () => {
	test("should track upload history when replacing file", async () => {
		const t = createTest();
		const { dealId, investorIdpId } = await createDealInPendingTransfer(t);
		const investorT = t.withIdentity({
			subject: investorIdpId,
			role: "investor",
		});

		// First upload
		const firstStorageId = await generateFakeStorageId(t);
		await investorT.mutation(api.deals.recordFundTransferUpload, {
			dealId,
			storageId: firstStorageId,
			fileName: "first_upload.pdf",
			fileType: "application/pdf",
		});

		// Second upload (replacement)
		const secondStorageId = await generateFakeStorageId(t);
		await investorT.mutation(api.deals.recordFundTransferUpload, {
			dealId,
			storageId: secondStorageId,
			fileName: "second_upload.pdf",
			fileType: "application/pdf",
		});

		// Verify history
		const deal = await t.run(async (ctx) => ctx.db.get(dealId));
		expect(deal?.currentUpload?.storageId).toBe(secondStorageId);
		expect(deal?.uploadHistory).toBeDefined();
		expect(deal?.uploadHistory?.length).toBe(1);
		expect(deal?.uploadHistory?.[0].storageId).toBe(firstStorageId);
	});

	test("should maintain complete upload history across multiple replacements", async () => {
		const t = createTest();
		const { dealId, investorIdpId } = await createDealInPendingTransfer(t);
		const investorT = t.withIdentity({
			subject: investorIdpId,
			role: "investor",
		});

		const uploads = [
			{ id: await generateFakeStorageId(t), name: "upload_1.pdf" },
			{ id: await generateFakeStorageId(t), name: "upload_2.pdf" },
			{ id: await generateFakeStorageId(t), name: "upload_3.pdf" },
		];

		for (const upload of uploads) {
			await investorT.mutation(api.deals.recordFundTransferUpload, {
				dealId,
				storageId: upload.id,
				fileName: upload.name,
				fileType: "application/pdf",
			});
		}
		const deal = await t.run(async (ctx) => ctx.db.get(dealId));
		expect(deal?.currentUpload?.storageId).toBe(uploads[2].id);
		expect(deal?.uploadHistory?.length).toBe(2);
		expect(deal?.uploadHistory?.[0].storageId).toBe(uploads[0].id);
		expect(deal?.uploadHistory?.[1].storageId).toBe(uploads[1].id);
	});

	test("should record timestamp for each upload", async () => {
		const t = createTest();
		const { dealId, investorIdpId } = await createDealInPendingTransfer(t);
		const investorT = t.withIdentity({
			subject: investorIdpId,
			role: "investor",
		});

		const beforeTimestamp = Date.now();

		await investorT.mutation(api.deals.recordFundTransferUpload, {
			dealId,
			storageId: await generateFakeStorageId(t),
			fileName: "test.pdf",
			fileType: "application/pdf",
		});

		const afterTimestamp = Date.now();

		const deal = await t.run(async (ctx) => ctx.db.get(dealId));
		expect(deal?.currentUpload?.uploadedAt).toBeGreaterThanOrEqual(
			beforeTimestamp
		);
		expect(deal?.currentUpload?.uploadedAt).toBeLessThanOrEqual(
			afterTimestamp
		);
	});

	test("should record uploader identity", async () => {
		const t = createTest();
		const { dealId, investorIdpId } = await createDealInPendingTransfer(t);
		const investorT = t.withIdentity({
			subject: investorIdpId,
			role: "investor",
		});

		await investorT.mutation(api.deals.recordFundTransferUpload, {
			dealId,
			storageId: await generateFakeStorageId(t),
			fileName: "test.pdf",
			fileType: "application/pdf",
		});

		const deal = await t.run(async (ctx) => ctx.db.get(dealId));
		expect(deal?.currentUpload?.uploadedBy).toBe(investorIdpId);
	});
});

// ============================================================================
// Authorization Tests
// ============================================================================

describe("recordFundTransferUpload - Authorization", () => {
	test("should allow lawyer to upload", async () => {
		const t = createTest();
		const { dealId } = await createDealInPendingTransfer(t);

		const lawyerT = t.withIdentity({
			subject: "lawyer-subject",
			email: "lawyer@test.com",
			role: "user",
		});

		await lawyerT.mutation(api.deals.recordFundTransferUpload, {
			dealId,
			storageId: await generateFakeStorageId(t),
			fileName: "lawyer_upload.pdf",
			fileType: "application/pdf",
		});

		const deal = await t.run(async (ctx) => ctx.db.get(dealId));
		expect(deal?.currentUpload).toBeDefined();
	});

	test("should allow admin to upload", async () => {
		const t = createTest();
		const { dealId } = await createDealInPendingTransfer(t);
		const adminT = await getAdminTest(t);

		await adminT.mutation(api.deals.recordFundTransferUpload, {
			dealId,
			storageId: await generateFakeStorageId(t),
			fileName: "admin_upload.pdf",
			fileType: "application/pdf",
		});

		const deal = await t.run(async (ctx) => ctx.db.get(dealId));
		expect(deal?.currentUpload).toBeDefined();
	});

	test("should reject unauthorized user", async () => {
		const t = createTest();
		const { dealId } = await createDealInPendingTransfer(t);

		const { idp_id: otherInvestorIdpId } = await createTestUser(
			t,
			`other_investor_${Date.now()}`
		);
		const otherInvestorT = t.withIdentity({
			subject: otherInvestorIdpId,
			role: "investor",
		});

		await expect(
			otherInvestorT.mutation(api.deals.recordFundTransferUpload, {
				dealId,
				storageId: await generateFakeStorageId(t),
				fileName: "unauthorized.pdf",
				fileType: "application/pdf",
			})
		).rejects.toThrow("Unauthorized");
	});

	test("should reject unauthenticated upload", async () => {
		const t = createTest();
		const { dealId } = await createDealInPendingTransfer(t);

		await expect(
			t.mutation(api.deals.recordFundTransferUpload, {
				dealId,
				storageId: await generateFakeStorageId(t),
				fileName: "test.pdf",
				fileType: "application/pdf",
			})
		).rejects.toThrow();
	});
});

// ============================================================================
// Integration Tests
// ============================================================================

describe("recordFundTransferUpload - Integration", () => {
	test("should complete full upload workflow", async () => {
		const t = createTest();
		const { dealId, investorIdpId } = await createDealInPendingTransfer(t);
		const investorT = t.withIdentity({
			subject: investorIdpId,
			role: "investor",
		});

		// 1. Generate upload URL
		const uploadUrl = await investorT.action(
			api.deals.generateFundTransferUploadUrl,
			{ dealId }
		);
		expect(uploadUrl).toBeDefined();

		// 2. Record upload (simulating file upload)
		await investorT.mutation(api.deals.recordFundTransferUpload, {
			dealId,
			storageId: await generateFakeStorageId(t),
			fileName: "complete_transfer.pdf",
			fileType: "application/pdf",
		});

		// 3. Verify deal was updated
		const deal = await t.run(async (ctx) => ctx.db.get(dealId));
		expect(deal?.currentUpload).toBeDefined();
		expect(deal?.currentUpload?.fileName).toBe("complete_transfer.pdf");

		// 4. Verify deal is still in pending_transfer state
		// (Upload doesn't auto-transition, admin must verify)
		expect(deal?.currentState).toBe("pending_transfer");
	});

	test("should handle rapid successive uploads correctly", async () => {
		const t = createTest();
		const { dealId, investorIdpId } = await createDealInPendingTransfer(t);
		const investorT = t.withIdentity({
			subject: investorIdpId,
			role: "investor",
		});

		// Upload multiple files in succession
		const id1 = await generateFakeStorageId(t);
		await investorT.mutation(api.deals.recordFundTransferUpload, {
			dealId,
			storageId: id1,
			fileName: "rapid_1.pdf",
			fileType: "application/pdf",
		});

		const id2 = await generateFakeStorageId(t);
		await investorT.mutation(api.deals.recordFundTransferUpload, {
			dealId,
			storageId: id2,
			fileName: "rapid_2.pdf",
			fileType: "application/pdf",
		});

		const id3 = await generateFakeStorageId(t);
		await investorT.mutation(api.deals.recordFundTransferUpload, {
			dealId,
			storageId: id3,
			fileName: "rapid_3.pdf",
			fileType: "application/pdf",
		});

		const deal = await t.run(async (ctx) => ctx.db.get(dealId));
		expect(deal?.currentUpload?.storageId).toBe(id3);
		expect(deal?.uploadHistory?.length).toBe(2);
	});

	test("should not auto-transition state after upload", async () => {
		const t = createTest();
		const { dealId, investorIdpId } = await createDealInPendingTransfer(t);
		const investorT = t.withIdentity({
			subject: investorIdpId,
			role: "investor",
		});

		// Verify initial state
		const dealBefore = await t.run(async (ctx) => ctx.db.get(dealId));
		expect(dealBefore?.currentState).toBe("pending_transfer");

		// Upload file
		await investorT.mutation(api.deals.recordFundTransferUpload, {
			dealId,
			storageId: await generateFakeStorageId(t),
			fileName: "no_auto_transition.pdf",
			fileType: "application/pdf",
		});

		// Verify state hasn't changed (admin must manually verify)
		const dealAfter = await t.run(async (ctx) => ctx.db.get(dealId));
		expect(dealAfter?.currentState).toBe("pending_transfer");
	});
});
