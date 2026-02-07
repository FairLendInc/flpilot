// @vitest-environment node
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import schema from "../schema";

// @ts-ignore
const modules = import.meta.glob("../**/*.{ts,js,tsx,jsx}", { eager: false });
const createTest = () => convexTest(schema, modules);

// ============================================================================
// Helper Functions (localized to keep test self-contained)
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
				metadata: { testUser: true, role },
			})
	);
	return { userId, idp_id };
}

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

async function approveLockRequest(
	t: ReturnType<typeof createTest>,
	lockRequestId: Id<"lock_requests">
) {
	const adminT = await getAdminTest(t);
	await adminT.mutation(api.lockRequests.approveLockRequest, {
		requestId: lockRequestId,
	});
}

async function createDeal(t: ReturnType<typeof createTest>) {
	const { mortgageId } = await createTestMortgage(t);
	const listingId = await createTestListing(t, mortgageId);
	const { idp_id: investorIdpId, userId: investorId } = await createTestUser(
		t,
		`investor_${Date.now()}`
	);

	const lockRequestId = await createLockRequest(t, listingId, investorIdpId);
	await approveLockRequest(t, lockRequestId);

	const adminT = await getAdminTest(t);
	const result = await adminT.action(api.deals.createDeal, { lockRequestId });

	return { dealId: result.dealId, investorId, investorIdpId };
}

// ============================================================================
// Tests
// ============================================================================

describe("document completion checks", () => {
	test("areAllDocumentsSigned returns false when missing or pending", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);

		// No documents
		const none = await t.query(internal.deal_documents.areAllDocumentsSigned, {
			dealId,
		});
		expect(none).toBe(false);

		// One pending document
		await t.run(async (ctx) => {
			await ctx.db.insert("deal_documents", {
				dealId,
				documensoDocumentId: "doc-1",
				templateId: "tpl-1",
				templateName: "Doc 1",
				status: "pending",
				signatories: [
					{ role: "investor", name: "Investor", email: "investor@test.com" },
				],
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});
		});

		const pending = await t.query(
			internal.deal_documents.areAllDocumentsSigned,
			{
				dealId,
			}
		);
		expect(pending).toBe(false);
	});

	test("areAllDocumentsSigned returns true when all documents are signed", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);

		await t.run(async (ctx) => {
			await ctx.db.insert("deal_documents", {
				dealId,
				documensoDocumentId: "doc-1",
				templateId: "tpl-1",
				templateName: "Doc 1",
				status: "signed",
				signatories: [
					{ role: "investor", name: "Investor", email: "investor@test.com" },
				],
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});
			await ctx.db.insert("deal_documents", {
				dealId,
				documensoDocumentId: "doc-2",
				templateId: "tpl-2",
				templateName: "Doc 2",
				status: "signed",
				signatories: [
					{ role: "admin", name: "Admin", email: "admin@test.com" },
				],
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});
		});

		const result = await t.query(
			internal.deal_documents.areAllDocumentsSigned,
			{
				dealId,
			}
		);
		expect(result).toBe(true);
	});
});

describe("checkPendingDocsDeals integration", () => {
	test("transitions pending_docs deal to pending_transfer when all docs signed", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);
		const adminT = await getAdminTest(t);

		// Move deal to pending_docs
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "CONFIRM_LAWYER" },
		});
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "COMPLETE_DOCS" },
		});

		// Insert signed documents
		await t.run(async (ctx) => {
			await ctx.db.insert("deal_documents", {
				dealId,
				documensoDocumentId: "doc-1",
				templateId: "tpl-1",
				templateName: "Doc 1",
				status: "signed",
				signatories: [
					{ role: "investor", name: "Investor", email: "investor@test.com" },
				],
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});
		});

		// Run cron mutation
		await t.mutation(internal.deals.checkPendingDocsDeals, {});

		const updatedDeal = await adminT.query(api.deals.getDeal, { dealId });
		expect(updatedDeal?.currentState).toBe("pending_transfer");
	});
	test("transitions immediately when last document is signed via action", async () => {
		const t = createTest();
		const { dealId } = await createDeal(t);
		const adminT = await getAdminTest(t);

		// Move deal to pending_docs
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "CONFIRM_LAWYER" },
		});
		await adminT.mutation(api.deals.transitionDealState, {
			dealId,
			event: { type: "COMPLETE_DOCS" },
		});

		// Create a pending document directly
		const docId = await t.run(
			async (ctx) =>
				await ctx.db.insert("deal_documents", {
					dealId,
					documensoDocumentId: "doc-1",
					templateId: "tpl-1",
					templateName: "Doc 1",
					status: "pending",
					signatories: [
						{ role: "investor", name: "Investor", email: "investor@test.com" },
					],
					createdAt: Date.now(),
					updatedAt: Date.now(),
				})
		);

		// Update document status via mutation (should trigger immediate check)
		await adminT.mutation(api.deal_documents.updateDocumentStatus, {
			documentId: docId,
			status: "signed",
		});

		// Verify state transition happened properly
		const updatedDeal = await adminT.query(api.deals.getDeal, { dealId });
		expect(updatedDeal?.currentState).toBe("pending_transfer");
	});
	test("lazily transitions when upload attempted and docs signed", async () => {
		const t2 = createTest();
		const { dealId: dealId2, investorIdpId: investorIdpId2 } =
			await createDeal(t2);
		const adminT2 = await getAdminTest(t2);
		const investorT2 = t2.withIdentity({
			subject: investorIdpId2,
			role: "investor",
		});

		// Move deal to pending_docs
		await adminT2.mutation(api.deals.transitionDealState, {
			dealId: dealId2,
			event: { type: "CONFIRM_LAWYER" },
		});
		await adminT2.mutation(api.deals.transitionDealState, {
			dealId: dealId2,
			event: { type: "COMPLETE_DOCS" },
		});

		// Create a SIGNED document directly but don't check for completion yet
		// This simulates the "stuck" state
		await t2.run(async (ctx) => {
			await ctx.db.insert("deal_documents", {
				dealId: dealId2,
				documensoDocumentId: "doc-1",
				templateId: "tpl-1",
				templateName: "Doc 1",
				status: "signed",
				signatories: [
					{ role: "investor", name: "Investor", email: "investor@test.com" },
				],
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});
		});

		// Attempt to upload file - this should trigger the transition and succeed
		// We need a storage ID first
		const storageId = await t2.run(
			async (ctx) =>
				await ctx.storage.store(
					new Blob(["fake content"], { type: "application/pdf" })
				)
		);

		await investorT2.mutation(api.deals.recordFundTransferUpload, {
			dealId: dealId2,
			storageId,
			fileName: "receipt.pdf",
			fileType: "application/pdf",
		});

		// Verify state transition happened properly
		const updatedDeal2 = await adminT2.query(api.deals.getDeal, {
			dealId: dealId2,
		});
		expect(updatedDeal2?.currentState).toBe("pending_transfer");
		expect(updatedDeal2?.currentUpload).toBeDefined();
	});
});
