import { describe, expect, test } from "vitest";

// ============================================================================
// Document Status Type Definitions (from Documenso)
// ============================================================================

type DocumentStatus = "draft" | "pending" | "signed" | "rejected";

type DealDocument = {
	id: string;
	dealId: string;
	documensoDocumentId: string;
	templateId: string;
	templateName: string;
	status: DocumentStatus;
	signatories: Array<{
		role: string;
		name: string;
		email: string;
	}>;
};

// ============================================================================
// Document Completion Logic
// ============================================================================

/**
 * Check if all documents for a deal are signed
 */
function areAllDocumentsSigned(documents: DealDocument[]): boolean {
	if (documents.length === 0) {
		return false; // No documents means not signed
	}

	return documents.every((doc) => doc.status === "signed");
}

/**
 * Check if any documents are rejected
 */
function hasRejectedDocuments(documents: DealDocument[]): boolean {
	return documents.some((doc) => doc.status === "rejected");
}

/**
 * Count documents by status
 */
function countDocumentsByStatus(
	documents: DealDocument[]
): Record<DocumentStatus, number> {
	const counts: Record<DocumentStatus, number> = {
		draft: 0,
		pending: 0,
		signed: 0,
		rejected: 0,
	};

	for (const doc of documents) {
		counts[doc.status] += 1;
	}

	return counts;
}

/**
 * Calculate document completion percentage
 */
function calculateCompletionPercentage(documents: DealDocument[]): number {
	if (documents.length === 0) return 0;

	const signedCount = documents.filter((doc) => doc.status === "signed").length;
	return Math.round((signedCount / documents.length) * 100);
}

/**
 * Determine if deal is ready for auto-transition to pending_transfer
 */
function shouldAutoTransitionToPendingTransfer(
	documents: DealDocument[],
	dealState: string
): boolean {
	// Only auto-transition from pending_docs state
	if (dealState !== "pending_docs") {
		return false;
	}

	// Must have at least one document
	if (documents.length === 0) {
		return false;
	}

	// All documents must be signed
	return areAllDocumentsSigned(documents);
}

/**
 * Get next required action for documents
 */
function getNextDocumentAction(documents: DealDocument[]): string | null {
	if (documents.length === 0) {
		return "No documents configured";
	}

	const counts = countDocumentsByStatus(documents);

	if (counts.rejected > 0) {
		return `${counts.rejected} document(s) rejected - review required`;
	}

	if (counts.pending > 0) {
		return `${counts.pending} document(s) awaiting signatures`;
	}

	if (counts.draft > 0) {
		return `${counts.draft} document(s) in draft - send for signing`;
	}

	if (counts.signed === documents.length) {
		return "All documents signed";
	}

	return "Unknown document status";
}

// ============================================================================
// Document Completion Tests
// ============================================================================

describe("areAllDocumentsSigned", () => {
	test("should return true when all documents are signed", () => {
		const documents: DealDocument[] = [
			{
				id: "1",
				dealId: "deal_1",
				documensoDocumentId: "doc_1",
				templateId: "template_1",
				templateName: "Purchase Agreement",
				status: "signed",
				signatories: [],
			},
			{
				id: "2",
				dealId: "deal_1",
				documensoDocumentId: "doc_2",
				templateId: "template_2",
				templateName: "Disclosure",
				status: "signed",
				signatories: [],
			},
		];

		expect(areAllDocumentsSigned(documents)).toBe(true);
	});

	test("should return false when some documents are pending", () => {
		const documents: DealDocument[] = [
			{
				id: "1",
				dealId: "deal_1",
				documensoDocumentId: "doc_1",
				templateId: "template_1",
				templateName: "Purchase Agreement",
				status: "signed",
				signatories: [],
			},
			{
				id: "2",
				dealId: "deal_1",
				documensoDocumentId: "doc_2",
				templateId: "template_2",
				templateName: "Disclosure",
				status: "pending",
				signatories: [],
			},
		];

		expect(areAllDocumentsSigned(documents)).toBe(false);
	});

	test("should return false when some documents are in draft", () => {
		const documents: DealDocument[] = [
			{
				id: "1",
				dealId: "deal_1",
				documensoDocumentId: "doc_1",
				templateId: "template_1",
				templateName: "Purchase Agreement",
				status: "draft",
				signatories: [],
			},
		];

		expect(areAllDocumentsSigned(documents)).toBe(false);
	});

	test("should return false when documents are rejected", () => {
		const documents: DealDocument[] = [
			{
				id: "1",
				dealId: "deal_1",
				documensoDocumentId: "doc_1",
				templateId: "template_1",
				templateName: "Purchase Agreement",
				status: "rejected",
				signatories: [],
			},
		];

		expect(areAllDocumentsSigned(documents)).toBe(false);
	});

	test("should return false for empty document array", () => {
		expect(areAllDocumentsSigned([])).toBe(false);
	});

	test("should return true for single signed document", () => {
		const documents: DealDocument[] = [
			{
				id: "1",
				dealId: "deal_1",
				documensoDocumentId: "doc_1",
				templateId: "template_1",
				templateName: "Purchase Agreement",
				status: "signed",
				signatories: [],
			},
		];

		expect(areAllDocumentsSigned(documents)).toBe(true);
	});
});

// ============================================================================
// Rejected Documents Tests
// ============================================================================

describe("hasRejectedDocuments", () => {
	test("should return true when any document is rejected", () => {
		const documents: DealDocument[] = [
			{
				id: "1",
				dealId: "deal_1",
				documensoDocumentId: "doc_1",
				templateId: "template_1",
				templateName: "Purchase Agreement",
				status: "signed",
				signatories: [],
			},
			{
				id: "2",
				dealId: "deal_1",
				documensoDocumentId: "doc_2",
				templateId: "template_2",
				templateName: "Disclosure",
				status: "rejected",
				signatories: [],
			},
		];

		expect(hasRejectedDocuments(documents)).toBe(true);
	});

	test("should return false when no documents are rejected", () => {
		const documents: DealDocument[] = [
			{
				id: "1",
				dealId: "deal_1",
				documensoDocumentId: "doc_1",
				templateId: "template_1",
				templateName: "Purchase Agreement",
				status: "signed",
				signatories: [],
			},
			{
				id: "2",
				dealId: "deal_1",
				documensoDocumentId: "doc_2",
				templateId: "template_2",
				templateName: "Disclosure",
				status: "pending",
				signatories: [],
			},
		];

		expect(hasRejectedDocuments(documents)).toBe(false);
	});

	test("should return false for empty document array", () => {
		expect(hasRejectedDocuments([])).toBe(false);
	});
});

// ============================================================================
// Document Status Counting Tests
// ============================================================================

describe("countDocumentsByStatus", () => {
	test("should count documents by status correctly", () => {
		const documents: DealDocument[] = [
			{
				id: "1",
				dealId: "deal_1",
				documensoDocumentId: "doc_1",
				templateId: "template_1",
				templateName: "Doc 1",
				status: "signed",
				signatories: [],
			},
			{
				id: "2",
				dealId: "deal_1",
				documensoDocumentId: "doc_2",
				templateId: "template_2",
				templateName: "Doc 2",
				status: "signed",
				signatories: [],
			},
			{
				id: "3",
				dealId: "deal_1",
				documensoDocumentId: "doc_3",
				templateId: "template_3",
				templateName: "Doc 3",
				status: "pending",
				signatories: [],
			},
			{
				id: "4",
				dealId: "deal_1",
				documensoDocumentId: "doc_4",
				templateId: "template_4",
				templateName: "Doc 4",
				status: "draft",
				signatories: [],
			},
		];

		const counts = countDocumentsByStatus(documents);

		expect(counts.signed).toBe(2);
		expect(counts.pending).toBe(1);
		expect(counts.draft).toBe(1);
		expect(counts.rejected).toBe(0);
	});

	test("should return zero counts for empty array", () => {
		const counts = countDocumentsByStatus([]);

		expect(counts.signed).toBe(0);
		expect(counts.pending).toBe(0);
		expect(counts.draft).toBe(0);
		expect(counts.rejected).toBe(0);
	});

	test("should handle all documents in same status", () => {
		const documents: DealDocument[] = [
			{
				id: "1",
				dealId: "deal_1",
				documensoDocumentId: "doc_1",
				templateId: "template_1",
				templateName: "Doc 1",
				status: "pending",
				signatories: [],
			},
			{
				id: "2",
				dealId: "deal_1",
				documensoDocumentId: "doc_2",
				templateId: "template_2",
				templateName: "Doc 2",
				status: "pending",
				signatories: [],
			},
		];

		const counts = countDocumentsByStatus(documents);

		expect(counts.pending).toBe(2);
		expect(counts.signed).toBe(0);
		expect(counts.draft).toBe(0);
		expect(counts.rejected).toBe(0);
	});
});

// ============================================================================
// Completion Percentage Tests
// ============================================================================

describe("calculateCompletionPercentage", () => {
	test("should return 100% when all documents are signed", () => {
		const documents: DealDocument[] = [
			{
				id: "1",
				dealId: "deal_1",
				documensoDocumentId: "doc_1",
				templateId: "template_1",
				templateName: "Doc 1",
				status: "signed",
				signatories: [],
			},
			{
				id: "2",
				dealId: "deal_1",
				documensoDocumentId: "doc_2",
				templateId: "template_2",
				templateName: "Doc 2",
				status: "signed",
				signatories: [],
			},
		];

		expect(calculateCompletionPercentage(documents)).toBe(100);
	});

	test("should return 50% when half are signed", () => {
		const documents: DealDocument[] = [
			{
				id: "1",
				dealId: "deal_1",
				documensoDocumentId: "doc_1",
				templateId: "template_1",
				templateName: "Doc 1",
				status: "signed",
				signatories: [],
			},
			{
				id: "2",
				dealId: "deal_1",
				documensoDocumentId: "doc_2",
				templateId: "template_2",
				templateName: "Doc 2",
				status: "pending",
				signatories: [],
			},
		];

		expect(calculateCompletionPercentage(documents)).toBe(50);
	});

	test("should return 0% when no documents are signed", () => {
		const documents: DealDocument[] = [
			{
				id: "1",
				dealId: "deal_1",
				documensoDocumentId: "doc_1",
				templateId: "template_1",
				templateName: "Doc 1",
				status: "pending",
				signatories: [],
			},
		];

		expect(calculateCompletionPercentage(documents)).toBe(0);
	});

	test("should return 0% for empty array", () => {
		expect(calculateCompletionPercentage([])).toBe(0);
	});

	test("should round to nearest integer", () => {
		const documents: DealDocument[] = [
			{
				id: "1",
				dealId: "deal_1",
				documensoDocumentId: "doc_1",
				templateId: "template_1",
				templateName: "Doc 1",
				status: "signed",
				signatories: [],
			},
			{
				id: "2",
				dealId: "deal_1",
				documensoDocumentId: "doc_2",
				templateId: "template_2",
				templateName: "Doc 2",
				status: "pending",
				signatories: [],
			},
			{
				id: "3",
				dealId: "deal_1",
				documensoDocumentId: "doc_3",
				templateId: "template_3",
				templateName: "Doc 3",
				status: "pending",
				signatories: [],
			},
		];

		// 1/3 = 33.333...%, should round to 33
		expect(calculateCompletionPercentage(documents)).toBe(33);
	});
});

// ============================================================================
// Auto-Transition Logic Tests
// ============================================================================

describe("shouldAutoTransitionToPendingTransfer", () => {
	test("should return true when all conditions met", () => {
		const documents: DealDocument[] = [
			{
				id: "1",
				dealId: "deal_1",
				documensoDocumentId: "doc_1",
				templateId: "template_1",
				templateName: "Doc 1",
				status: "signed",
				signatories: [],
			},
		];

		expect(
			shouldAutoTransitionToPendingTransfer(documents, "pending_docs")
		).toBe(true);
	});

	test("should return false when not in pending_docs state", () => {
		const documents: DealDocument[] = [
			{
				id: "1",
				dealId: "deal_1",
				documensoDocumentId: "doc_1",
				templateId: "template_1",
				templateName: "Doc 1",
				status: "signed",
				signatories: [],
			},
		];

		expect(shouldAutoTransitionToPendingTransfer(documents, "locked")).toBe(
			false
		);
		expect(
			shouldAutoTransitionToPendingTransfer(documents, "pending_lawyer")
		).toBe(false);
		expect(
			shouldAutoTransitionToPendingTransfer(documents, "pending_transfer")
		).toBe(false);
	});

	test("should return false when documents not all signed", () => {
		const documents: DealDocument[] = [
			{
				id: "1",
				dealId: "deal_1",
				documensoDocumentId: "doc_1",
				templateId: "template_1",
				templateName: "Doc 1",
				status: "signed",
				signatories: [],
			},
			{
				id: "2",
				dealId: "deal_1",
				documensoDocumentId: "doc_2",
				templateId: "template_2",
				templateName: "Doc 2",
				status: "pending",
				signatories: [],
			},
		];

		expect(
			shouldAutoTransitionToPendingTransfer(documents, "pending_docs")
		).toBe(false);
	});

	test("should return false when no documents exist", () => {
		expect(shouldAutoTransitionToPendingTransfer([], "pending_docs")).toBe(
			false
		);
	});
});

// ============================================================================
// Next Action Tests
// ============================================================================

describe("getNextDocumentAction", () => {
	test("should return appropriate message for no documents", () => {
		expect(getNextDocumentAction([])).toBe("No documents configured");
	});

	test("should prioritize rejected documents message", () => {
		const documents: DealDocument[] = [
			{
				id: "1",
				dealId: "deal_1",
				documensoDocumentId: "doc_1",
				templateId: "template_1",
				templateName: "Doc 1",
				status: "rejected",
				signatories: [],
			},
			{
				id: "2",
				dealId: "deal_1",
				documensoDocumentId: "doc_2",
				templateId: "template_2",
				templateName: "Doc 2",
				status: "pending",
				signatories: [],
			},
		];

		const action = getNextDocumentAction(documents);
		expect(action).toContain("rejected");
		expect(action).toContain("1");
	});

	test("should show pending count when documents pending", () => {
		const documents: DealDocument[] = [
			{
				id: "1",
				dealId: "deal_1",
				documensoDocumentId: "doc_1",
				templateId: "template_1",
				templateName: "Doc 1",
				status: "pending",
				signatories: [],
			},
			{
				id: "2",
				dealId: "deal_1",
				documensoDocumentId: "doc_2",
				templateId: "template_2",
				templateName: "Doc 2",
				status: "pending",
				signatories: [],
			},
		];

		const action = getNextDocumentAction(documents);
		expect(action).toContain("awaiting signatures");
		expect(action).toContain("2");
	});

	test("should show draft count when documents in draft", () => {
		const documents: DealDocument[] = [
			{
				id: "1",
				dealId: "deal_1",
				documensoDocumentId: "doc_1",
				templateId: "template_1",
				templateName: "Doc 1",
				status: "draft",
				signatories: [],
			},
		];

		const action = getNextDocumentAction(documents);
		expect(action).toContain("draft");
		expect(action).toContain("1");
	});

	test("should show success message when all signed", () => {
		const documents: DealDocument[] = [
			{
				id: "1",
				dealId: "deal_1",
				documensoDocumentId: "doc_1",
				templateId: "template_1",
				templateName: "Doc 1",
				status: "signed",
				signatories: [],
			},
		];

		expect(getNextDocumentAction(documents)).toBe("All documents signed");
	});
});
