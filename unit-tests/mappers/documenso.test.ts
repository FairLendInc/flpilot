import { describe, expect, test } from "vitest";
import {
	extractUsers,
	mapDocumensoToDocument,
	mapRole,
} from "@/lib/mappers/documenso";
import type {
	DocumensoDocumentSummary,
	SignatoryOption,
} from "@/lib/types/documenso";
import {
	ActionTypeEnum,
	FairLendRole,
} from "@/stories/dealPortal/utils/dealLogic";

describe("Documenso Mappers", () => {
	describe("mapRole", () => {
		test("should map SIGNER to BUYER", () => {
			expect(mapRole("SIGNER")).toBe(FairLendRole.BUYER);
		});

		test("should map APPROVER to LAWYER", () => {
			expect(mapRole("APPROVER")).toBe(FairLendRole.LAWYER);
		});

		test("should map VIEWER to BROKER", () => {
			expect(mapRole("VIEWER")).toBe(FairLendRole.BROKER);
		});

		test("should map unknown role to NONE", () => {
			expect(mapRole("UNKNOWN")).toBe(FairLendRole.NONE);
			expect(mapRole("")).toBe(FairLendRole.NONE);
		});
	});

	describe("mapDocumensoToDocument", () => {
		// Helper to create mock recipients with all required fields
		const createMockRecipient = (
			overrides: Partial<SignatoryOption>
		): SignatoryOption => ({
			id: 1,
			email: "test@example.com",
			name: "Test User",
			role: "SIGNER",
			signingStatus: "NOT_SIGNED",
			readStatus: "NOT_OPENED",
			sendStatus: "SENT",
			signingOrder: 1,
			token: "test-token",
			...overrides,
		});

		const createMockDoc = (
			overrides: Partial<DocumensoDocumentSummary> = {}
		): DocumensoDocumentSummary => ({
			id: 123,
			title: "Test Document",
			status: "PENDING",
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
			completedAt: null,
			recipients: [],
			...overrides,
		});

		test("should map document with pending SIGNER recipient", () => {
			const doc = createMockDoc({
				recipients: [
					createMockRecipient({
						id: 1,
						email: "buyer@example.com",
						name: "John Buyer",
						role: "SIGNER",
						signingStatus: "NOT_SIGNED",
						signingOrder: 1,
						token: "token123",
					}),
					createMockRecipient({
						id: 2,
						email: "lawyer@example.com",
						name: "Jane Lawyer",
						role: "APPROVER",
						signingStatus: "NOT_SIGNED",
						signingOrder: 2,
						token: "token456",
					}),
				],
			});

			const result = mapDocumensoToDocument(doc);

			expect(result.requiredAction).toBe(ActionTypeEnum.ESIGN);
			expect(result.assignedTo).toBe("buyer@example.com");
			expect(result.assignedToRole).toBe(FairLendRole.BUYER);
			expect(result.isComplete).toBe(false);
		});

		test("should map document with pending APPROVER recipient", () => {
			const doc = createMockDoc({
				recipients: [
					createMockRecipient({
						id: 1,
						email: "buyer@example.com",
						name: "John Buyer",
						role: "SIGNER",
						signingStatus: "SIGNED",
						signingOrder: 1,
						token: "token123",
					}),
					createMockRecipient({
						id: 2,
						email: "lawyer@example.com",
						name: "Jane Lawyer",
						role: "APPROVER",
						signingStatus: "NOT_SIGNED",
						signingOrder: 2,
						token: "token456",
					}),
				],
			});

			const result = mapDocumensoToDocument(doc);

			expect(result.requiredAction).toBe(ActionTypeEnum.APPROVE);
			expect(result.assignedTo).toBe("lawyer@example.com");
			expect(result.assignedToRole).toBe(FairLendRole.LAWYER);
		});

		test("should map document with pending VIEWER recipient", () => {
			const doc = createMockDoc({
				recipients: [
					createMockRecipient({
						id: 1,
						email: "broker@example.com",
						name: "Bob Broker",
						role: "VIEWER",
						signingStatus: "NOT_SIGNED",
						signingOrder: 1,
						token: "",
					}),
				],
			});

			const result = mapDocumensoToDocument(doc);

			expect(result.requiredAction).toBe(ActionTypeEnum.REVIEW);
			expect(result.assignedTo).toBe("broker@example.com");
			expect(result.assignedToRole).toBe(FairLendRole.BROKER);
		});

		test("should map COMPLETED document", () => {
			const doc = createMockDoc({
				status: "COMPLETED",
				recipients: [
					createMockRecipient({
						id: 1,
						email: "buyer@example.com",
						name: "John Buyer",
						role: "SIGNER",
						signingStatus: "SIGNED",
						signingOrder: 1,
						token: "token123",
					}),
					createMockRecipient({
						id: 2,
						email: "lawyer@example.com",
						name: "Jane Lawyer",
						role: "APPROVER",
						signingStatus: "SIGNED",
						signingOrder: 2,
						token: "token456",
					}),
				],
			});

			const result = mapDocumensoToDocument(doc);

			expect(result.requiredAction).toBe(ActionTypeEnum.COMPLETE);
			expect(result.isComplete).toBe(true);
			expect(result.assignedTo).toBe("");
			expect(result.assignedToRole).toBe(FairLendRole.NONE);
		});

		test("should handle recipients with missing tokens", () => {
			const doc = createMockDoc({
				recipients: [
					createMockRecipient({
						id: 1,
						email: "user1@example.com",
						name: "User 1",
						role: "SIGNER",
						signingStatus: "NOT_SIGNED",
						signingOrder: 1,
						token: "token123",
					}),
					createMockRecipient({
						id: 2,
						email: "user2@example.com",
						name: "User 2",
						role: "VIEWER",
						signingStatus: "NOT_SIGNED",
						signingOrder: 2,
						token: "", // Empty token
					}),
				],
			});

			const result = mapDocumensoToDocument(doc);

			// Only recipient with token should be in recipientTokens
			expect(result.recipientTokens).toEqual({
				"user1@example.com": "token123",
			});
		});

		test("should handle recipients with missing signingOrder", () => {
			const doc = createMockDoc({
				recipients: [
					createMockRecipient({
						id: 1,
						email: "user1@example.com",
						name: "User 1",
						role: "SIGNER",
						signingStatus: "NOT_SIGNED",
						signingOrder: null, // Missing signing order
						token: "token123",
					}),
					createMockRecipient({
						id: 2,
						email: "user2@example.com",
						name: "User 2",
						role: "APPROVER",
						signingStatus: "NOT_SIGNED",
						signingOrder: 1,
						token: "token456",
					}),
				],
			});

			const result = mapDocumensoToDocument(doc);

			// Recipients should be sorted with null treated as 0
			expect(result.signingSteps[0].email).toBe("user1@example.com");
			expect(result.signingSteps[0].order).toBe(0);
			expect(result.signingSteps[1].email).toBe("user2@example.com");
			expect(result.signingSteps[1].order).toBe(1);
		});

		test("should create correct recipientStatus object", () => {
			const doc = createMockDoc({
				recipients: [
					createMockRecipient({
						id: 1,
						email: "user1@example.com",
						name: "User 1",
						role: "SIGNER",
						signingStatus: "SIGNED",
						signingOrder: 1,
						token: "token123",
					}),
					createMockRecipient({
						id: 2,
						email: "user2@example.com",
						name: "User 2",
						role: "APPROVER",
						signingStatus: "NOT_SIGNED",
						signingOrder: 2,
						token: "token456",
					}),
				],
			});

			const result = mapDocumensoToDocument(doc);

			expect(result.recipientStatus).toEqual({
				"user1@example.com": "SIGNED",
				"user2@example.com": "NOT_SIGNED",
			});
		});

		test("should map basic document properties", () => {
			const doc = createMockDoc({
				id: 456,
				title: "My Custom Document",
				status: "PENDING",
			});

			const result = mapDocumensoToDocument(doc);

			expect(result.id).toBe("456");
			expect(result.name).toBe("My Custom Document");
			expect(result.group).toBe("other");
			expect(result.status).toBe("PENDING");
		});

		test("should sort recipients by signingOrder in signingSteps", () => {
			const doc = createMockDoc({
				recipients: [
					createMockRecipient({
						id: 3,
						email: "user3@example.com",
						name: "User 3",
						role: "VIEWER",
						signingStatus: "NOT_SIGNED",
						signingOrder: 3,
						token: "",
					}),
					createMockRecipient({
						id: 1,
						email: "user1@example.com",
						name: "User 1",
						role: "SIGNER",
						signingStatus: "NOT_SIGNED",
						signingOrder: 1,
						token: "token123",
					}),
					createMockRecipient({
						id: 2,
						email: "user2@example.com",
						name: "User 2",
						role: "APPROVER",
						signingStatus: "NOT_SIGNED",
						signingOrder: 2,
						token: "token456",
					}),
				],
			});

			const result = mapDocumensoToDocument(doc);

			expect(result.signingSteps).toHaveLength(3);
			expect(result.signingSteps[0].email).toBe("user1@example.com");
			expect(result.signingSteps[1].email).toBe("user2@example.com");
			expect(result.signingSteps[2].email).toBe("user3@example.com");
		});
	});

	describe("extractUsers", () => {
		test("should extract users from recipients", () => {
			const doc: DocumensoDocumentSummary = {
				id: 123,
				title: "Test Document",
				status: "PENDING",
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
				completedAt: null,
				recipients: [
					{
						id: 1,
						email: "buyer@example.com",
						name: "John Buyer",
						role: "SIGNER",
						signingStatus: "NOT_SIGNED",
						readStatus: "NOT_OPENED",
						sendStatus: "SENT",
						signingOrder: 1,
						token: "token123",
					},
					{
						id: 2,
						email: "lawyer@example.com",
						name: "Jane Lawyer",
						role: "APPROVER",
						signingStatus: "NOT_SIGNED",
						readStatus: "NOT_OPENED",
						sendStatus: "SENT",
						signingOrder: 2,
						token: "token456",
					},
					{
						id: 3,
						email: "broker@example.com",
						name: "Bob Broker",
						role: "VIEWER",
						signingStatus: "NOT_SIGNED",
						readStatus: "NOT_OPENED",
						sendStatus: "SENT",
						signingOrder: 3,
						token: "",
					},
				],
			};

			const result = extractUsers(doc);

			expect(result).toHaveLength(3);
			expect(result[0]).toEqual({
				id: "1",
				email: "buyer@example.com",
				name: "John Buyer",
				role: FairLendRole.BUYER,
			});
			expect(result[1]).toEqual({
				id: "2",
				email: "lawyer@example.com",
				name: "Jane Lawyer",
				role: FairLendRole.LAWYER,
			});
			expect(result[2]).toEqual({
				id: "3",
				email: "broker@example.com",
				name: "Bob Broker",
				role: FairLendRole.BROKER,
			});
		});

		test("should handle empty recipients array", () => {
			const doc: DocumensoDocumentSummary = {
				id: 123,
				title: "Test Document",
				status: "PENDING",
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
				completedAt: null,
				recipients: [],
			};

			const result = extractUsers(doc);

			expect(result).toEqual([]);
		});

		test("should convert recipient IDs to strings", () => {
			const doc: DocumensoDocumentSummary = {
				id: 123,
				title: "Test Document",
				status: "PENDING",
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
				completedAt: null,
				recipients: [
					{
						id: 999,
						email: "user@example.com",
						name: "Test User",
						role: "SIGNER",
						signingStatus: "NOT_SIGNED",
						readStatus: "NOT_OPENED",
						sendStatus: "SENT",
						signingOrder: 1,
						token: "token",
					},
				],
			};

			const result = extractUsers(doc);

			expect(result[0].id).toBe("999");
			expect(typeof result[0].id).toBe("string");
		});
	});
});
