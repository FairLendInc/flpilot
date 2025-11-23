import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	test,
	vi,
} from "vitest";
import {
	type DocumensoTemplate,
	generateDocumentsFromTemplates,
	mapRecipientsForListing,
} from "../lib/documenso";

// Set up environment variable for tests
beforeAll(() => {
	process.env.DOCUMENSO_API_KEY = "test_api_key_for_tests";
});

// Mock the fetch API
global.fetch = vi.fn();

// Helper to create mock template response
function createMockTemplate(
	recipients: Array<{ id: number; email: string; name: string; role: string }>
): DocumensoTemplate {
	return {
		id: 123,
		title: "Test Template",
		externalId: "template_123",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
		recipients: recipients.map((r) => ({
			...r,
			role: r.role as any,
			signingOrder: null,
		})),
	};
}

beforeEach(() => {
	vi.clearAllMocks();
});

afterEach(() => {
	vi.restoreAllMocks();
});

// ============================================================================
// Recipient Mapping Tests
// ============================================================================

describe("mapRecipientsForListing", () => {
	test("should map broker placeholder to actual broker", async () => {
		const mockTemplate = createMockTemplate([
			{
				id: 1,
				email: "placeholder@example.com",
				name: "{{Broker}}",
				role: "SIGNER",
			},
			{
				id: 2,
				email: "placeholder@example.com",
				name: "{{Investor}}",
				role: "SIGNER",
			},
		]);

		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => mockTemplate,
		});

		const broker = { email: "broker@fairlend.ca", name: "John Broker" };
		const investor = { email: "investor@example.com", name: "Jane Investor" };

		const recipients = await mapRecipientsForListing(
			"template_123",
			broker,
			investor
		);

		expect(recipients).toHaveLength(2);
		expect(recipients[0]).toEqual({
			id: 1,
			email: "broker@fairlend.ca",
			name: "John Broker",
		});
		expect(recipients[1]).toEqual({
			id: 2,
			email: "investor@example.com",
			name: "Jane Investor",
		});
	});

	test("should map broker without curly braces", async () => {
		const mockTemplate = createMockTemplate([
			{
				id: 1,
				email: "placeholder@example.com",
				name: "Broker",
				role: "SIGNER",
			},
		]);

		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => mockTemplate,
		});

		const broker = { email: "broker@fairlend.ca", name: "John Broker" };
		const investor = { email: "investor@example.com", name: "Jane Investor" };

		const recipients = await mapRecipientsForListing(
			"template_123",
			broker,
			investor
		);

		expect(recipients[0].email).toBe("broker@fairlend.ca");
		expect(recipients[0].name).toBe("John Broker");
	});

	test("should map investor placeholder to actual investor", async () => {
		const mockTemplate = createMockTemplate([
			{
				id: 1,
				email: "placeholder@example.com",
				name: "{{Investor}}",
				role: "SIGNER",
			},
		]);

		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => mockTemplate,
		});

		const broker = { email: "broker@fairlend.ca", name: "John Broker" };
		const investor = { email: "investor@example.com", name: "Jane Investor" };

		const recipients = await mapRecipientsForListing(
			"template_123",
			broker,
			investor
		);

		expect(recipients[0].email).toBe("investor@example.com");
		expect(recipients[0].name).toBe("Jane Investor");
	});

	test("should be case-insensitive when matching placeholders", async () => {
		const mockTemplate = createMockTemplate([
			{
				id: 1,
				email: "placeholder@example.com",
				name: "{{BROKER}}",
				role: "SIGNER",
			},
			{
				id: 2,
				email: "placeholder@example.com",
				name: "{{investor}}",
				role: "SIGNER",
			},
		]);

		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => mockTemplate,
		});

		const broker = { email: "broker@fairlend.ca", name: "John Broker" };
		const investor = { email: "investor@example.com", name: "Jane Investor" };

		const recipients = await mapRecipientsForListing(
			"template_123",
			broker,
			investor
		);

		expect(recipients[0].email).toBe("broker@fairlend.ca");
		expect(recipients[1].email).toBe("investor@example.com");
	});

	test("should preserve other recipients unchanged", async () => {
		const mockTemplate = createMockTemplate([
			{
				id: 1,
				email: "broker@fairlend.ca",
				name: "{{Broker}}",
				role: "SIGNER",
			},
			{
				id: 2,
				email: "witness@law.com",
				name: "Legal Witness",
				role: "VIEWER",
			},
		]);

		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => mockTemplate,
		});

		const broker = { email: "new-broker@fairlend.ca", name: "John Broker" };
		const investor = { email: "investor@example.com", name: "Jane Investor" };

		const recipients = await mapRecipientsForListing(
			"template_123",
			broker,
			investor
		);

		expect(recipients).toHaveLength(2);
		expect(recipients[0].email).toBe("new-broker@fairlend.ca");
		expect(recipients[1].email).toBe("witness@law.com"); // Unchanged
		expect(recipients[1].name).toBe("Legal Witness"); // Unchanged
	});

	test("should preserve recipient IDs from template", async () => {
		const mockTemplate = createMockTemplate([
			{
				id: 42,
				email: "placeholder@example.com",
				name: "{{Broker}}",
				role: "SIGNER",
			},
			{
				id: 99,
				email: "placeholder@example.com",
				name: "{{Investor}}",
				role: "SIGNER",
			},
		]);

		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => mockTemplate,
		});

		const broker = { email: "broker@fairlend.ca", name: "John Broker" };
		const investor = { email: "investor@example.com", name: "Jane Investor" };

		const recipients = await mapRecipientsForListing(
			"template_123",
			broker,
			investor
		);

		expect(recipients[0].id).toBe(42);
		expect(recipients[1].id).toBe(99);
	});

	test("should handle template with only broker", async () => {
		const mockTemplate = createMockTemplate([
			{
				id: 1,
				email: "placeholder@example.com",
				name: "{{Broker}}",
				role: "SIGNER",
			},
		]);

		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => mockTemplate,
		});

		const broker = { email: "broker@fairlend.ca", name: "John Broker" };
		const investor = { email: "investor@example.com", name: "Jane Investor" };

		const recipients = await mapRecipientsForListing(
			"template_123",
			broker,
			investor
		);

		expect(recipients).toHaveLength(1);
		expect(recipients[0].email).toBe("broker@fairlend.ca");
	});

	test("should handle template with only investor", async () => {
		const mockTemplate = createMockTemplate([
			{
				id: 1,
				email: "placeholder@example.com",
				name: "{{Investor}}",
				role: "SIGNER",
			},
		]);

		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => mockTemplate,
		});

		const broker = { email: "broker@fairlend.ca", name: "John Broker" };
		const investor = { email: "investor@example.com", name: "Jane Investor" };

		const recipients = await mapRecipientsForListing(
			"template_123",
			broker,
			investor
		);

		expect(recipients).toHaveLength(1);
		expect(recipients[0].email).toBe("investor@example.com");
	});

	test("should validate all template recipients were mapped", async () => {
		const mockTemplate = createMockTemplate([
			{
				id: 1,
				email: "placeholder@example.com",
				name: "{{Broker}}",
				role: "SIGNER",
			},
			{
				id: 2,
				email: "placeholder@example.com",
				name: "{{Investor}}",
				role: "SIGNER",
			},
		]);

		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => mockTemplate,
		});

		const broker = { email: "broker@fairlend.ca", name: "John Broker" };
		const investor = { email: "investor@example.com", name: "Jane Investor" };

		const recipients = await mapRecipientsForListing(
			"template_123",
			broker,
			investor
		);

		// Should map all recipients
		expect(recipients.length).toBe((mockTemplate.recipients ?? []).length);
	});
});

// ============================================================================
// Batch Document Generation Tests
// ============================================================================

describe("generateDocumentsFromTemplates", () => {
	test("should generate documents for all templates successfully", async () => {
		const templates = [
			{ documensoTemplateId: "template_1", name: "Purchase Agreement" },
			{ documensoTemplateId: "template_2", name: "Disclosure Form" },
		];

		const broker = { email: "broker@fairlend.ca", name: "John Broker" };
		const investor = { email: "investor@example.com", name: "Jane Investor" };

		// Mock template fetch for both templates
		(global.fetch as any)
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () =>
					createMockTemplate([
						{
							id: 1,
							email: "placeholder@example.com",
							name: "{{Broker}}",
							role: "SIGNER",
						},
					]),
			})
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({ id: 100, title: "Generated Doc 1" }),
			})
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () =>
					createMockTemplate([
						{
							id: 1,
							email: "placeholder@example.com",
							name: "{{Investor}}",
							role: "SIGNER",
						},
					]),
			})
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({ id: 101, title: "Generated Doc 2" }),
			});

		const results = await generateDocumentsFromTemplates(
			templates,
			broker,
			investor
		);

		expect(results).toHaveLength(2);
		expect(results[0]).toEqual({
			templateId: "template_1",
			documentId: "100",
			success: true,
		});
		expect(results[1]).toEqual({
			templateId: "template_2",
			documentId: "101",
			success: true,
		});
	});

	test("should handle partial failure gracefully", async () => {
		const templates = [
			{ documensoTemplateId: "template_1", name: "Purchase Agreement" },
			{ documensoTemplateId: "template_2", name: "Disclosure Form" },
		];

		const broker = { email: "broker@fairlend.ca", name: "John Broker" };
		const investor = { email: "investor@example.com", name: "Jane Investor" };

		// First template succeeds, second fails
		(global.fetch as any)
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () =>
					createMockTemplate([
						{
							id: 1,
							email: "placeholder@example.com",
							name: "{{Broker}}",
							role: "SIGNER",
						},
					]),
			})
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({ id: 100, title: "Generated Doc 1" }),
			})
			.mockResolvedValueOnce({
				ok: false,
				status: 404,
				text: async () => "Template not found",
			});

		const results = await generateDocumentsFromTemplates(
			templates,
			broker,
			investor
		);

		expect(results).toHaveLength(2);
		expect(results[0].success).toBe(true);
		expect(results[1].success).toBe(false);
		expect(results[1].error).toBeDefined();
	});

	test("should return empty array for empty template list", async () => {
		const broker = { email: "broker@fairlend.ca", name: "John Broker" };
		const investor = { email: "investor@example.com", name: "Jane Investor" };

		const results = await generateDocumentsFromTemplates([], broker, investor);

		expect(results).toEqual([]);
	});

	test("should handle all templates failing", async () => {
		const templates = [
			{ documensoTemplateId: "template_1", name: "Purchase Agreement" },
			{ documensoTemplateId: "template_2", name: "Disclosure Form" },
		];

		const broker = { email: "broker@fairlend.ca", name: "John Broker" };
		const investor = { email: "investor@example.com", name: "Jane Investor" };

		// Both templates fail
		(global.fetch as any)
			.mockResolvedValueOnce({
				ok: false,
				status: 404,
				text: async () => "Template 1 not found",
			})
			.mockResolvedValueOnce({
				ok: false,
				status: 500,
				text: async () => "Server error",
			});

		const results = await generateDocumentsFromTemplates(
			templates,
			broker,
			investor
		);

		expect(results).toHaveLength(2);
		expect(results.every((r) => !r.success)).toBe(true);
		expect(results[0].error).toBeDefined();
		expect(results[1].error).toBeDefined();
	});

	test("should include error message for failed templates", async () => {
		const templates = [
			{ documensoTemplateId: "template_1", name: "Purchase Agreement" },
		];

		const broker = { email: "broker@fairlend.ca", name: "John Broker" };
		const investor = { email: "investor@example.com", name: "Jane Investor" };

		(global.fetch as any).mockResolvedValueOnce({
			ok: false,
			status: 401,
			text: async () => "Unauthorized",
		});

		const results = await generateDocumentsFromTemplates(
			templates,
			broker,
			investor
		);

		expect(results[0].success).toBe(false);
		expect(results[0].error).toBeTruthy();
		expect(typeof results[0].error).toBe("string");
	});

	test("should process templates sequentially", async () => {
		const templates = [
			{ documensoTemplateId: "template_1", name: "First" },
			{ documensoTemplateId: "template_2", name: "Second" },
			{ documensoTemplateId: "template_3", name: "Third" },
		];

		const broker = { email: "broker@fairlend.ca", name: "John Broker" };
		const investor = { email: "investor@example.com", name: "Jane Investor" };

		let callCount = 0;
		(global.fetch as any).mockImplementation(async () => {
			callCount += 1;
			if (callCount % 2 === 1) {
				// Template fetch
				return {
					ok: true,
					status: 200,
					json: async () =>
						createMockTemplate([
							{
								id: 1,
								email: "placeholder@example.com",
								name: "{{Broker}}",
								role: "SIGNER",
							},
						]),
				};
			}
			// Document creation
			return {
				ok: true,
				status: 200,
				json: async () => ({ id: callCount / 2, title: "Generated Doc" }),
			};
		});

		const results = await generateDocumentsFromTemplates(
			templates,
			broker,
			investor
		);

		expect(results).toHaveLength(3);
		expect(results.every((r) => r.success)).toBe(true);
		expect(callCount).toBe(6); // 2 calls per template (fetch + create)
	});
});

// ============================================================================
// Error Handling Tests
// ============================================================================

describe("Documenso API Error Handling", () => {
	test("should handle 401 Unauthorized error", async () => {
		const mockTemplate = createMockTemplate([
			{
				id: 1,
				email: "placeholder@example.com",
				name: "{{Broker}}",
				role: "SIGNER",
			},
		]);

		(global.fetch as any)
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => mockTemplate,
			})
			.mockResolvedValueOnce({
				ok: false,
				status: 401,
				text: async () => "Invalid API key",
			});

		const templates = [{ documensoTemplateId: "template_1", name: "Test" }];
		const broker = { email: "broker@fairlend.ca", name: "John Broker" };
		const investor = { email: "investor@example.com", name: "Jane Investor" };

		const results = await generateDocumentsFromTemplates(
			templates,
			broker,
			investor
		);

		expect(results[0].success).toBe(false);
		expect(results[0].error).toContain("401");
	});

	test("should handle 404 Not Found error", async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: false,
			status: 404,
			text: async () => "Template not found",
		});

		const templates = [{ documensoTemplateId: "nonexistent", name: "Test" }];
		const broker = { email: "broker@fairlend.ca", name: "John Broker" };
		const investor = { email: "investor@example.com", name: "Jane Investor" };

		const results = await generateDocumentsFromTemplates(
			templates,
			broker,
			investor
		);

		expect(results[0].success).toBe(false);
		expect(results[0].error).toBeDefined();
	});

	test("should handle 429 Rate Limit error", async () => {
		const mockTemplate = createMockTemplate([
			{
				id: 1,
				email: "placeholder@example.com",
				name: "{{Broker}}",
				role: "SIGNER",
			},
		]);

		(global.fetch as any)
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => mockTemplate,
			})
			.mockResolvedValueOnce({
				ok: false,
				status: 429,
				text: async () => "Rate limit exceeded",
			});

		const templates = [{ documensoTemplateId: "template_1", name: "Test" }];
		const broker = { email: "broker@fairlend.ca", name: "John Broker" };
		const investor = { email: "investor@example.com", name: "Jane Investor" };

		const results = await generateDocumentsFromTemplates(
			templates,
			broker,
			investor
		);

		expect(results[0].success).toBe(false);
	});

	test("should handle network errors", async () => {
		(global.fetch as any).mockRejectedValueOnce(
			new Error("Network connection failed")
		);

		const templates = [{ documensoTemplateId: "template_1", name: "Test" }];
		const broker = { email: "broker@fairlend.ca", name: "John Broker" };
		const investor = { email: "investor@example.com", name: "Jane Investor" };

		const results = await generateDocumentsFromTemplates(
			templates,
			broker,
			investor
		);

		expect(results[0].success).toBe(false);
		expect(results[0].error).toContain("Network connection failed");
	});
});

// ============================================================================
// Edge Cases
// ============================================================================

describe("Documenso Integration Edge Cases", () => {
	test("should handle empty broker name", async () => {
		const mockTemplate = createMockTemplate([
			{
				id: 1,
				email: "placeholder@example.com",
				name: "{{Broker}}",
				role: "SIGNER",
			},
		]);

		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => mockTemplate,
		});

		const broker = { email: "broker@fairlend.ca", name: "" };
		const investor = { email: "investor@example.com", name: "Jane Investor" };

		const recipients = await mapRecipientsForListing(
			"template_123",
			broker,
			investor
		);

		expect(recipients[0].email).toBe("broker@fairlend.ca");
		expect(recipients[0].name).toBe("");
	});

	test("should handle empty investor name", async () => {
		const mockTemplate = createMockTemplate([
			{
				id: 1,
				email: "placeholder@example.com",
				name: "{{Investor}}",
				role: "SIGNER",
			},
		]);

		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => mockTemplate,
		});

		const broker = { email: "broker@fairlend.ca", name: "John Broker" };
		const investor = { email: "investor@example.com", name: "" };

		const recipients = await mapRecipientsForListing(
			"template_123",
			broker,
			investor
		);

		expect(recipients[0].email).toBe("investor@example.com");
		expect(recipients[0].name).toBe("");
	});

	test("should handle template with no recipients", async () => {
		const mockTemplate: DocumensoTemplate = {
			id: 123,
			title: "Empty Template",
			externalId: "template_empty",
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
			recipients: [],
		};

		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => mockTemplate,
		});

		const broker = { email: "broker@fairlend.ca", name: "John Broker" };
		const investor = { email: "investor@example.com", name: "Jane Investor" };

		const recipients = await mapRecipientsForListing(
			"template_123",
			broker,
			investor
		);

		expect(recipients).toEqual([]);
	});

	test("should handle multiple recipients with same role", async () => {
		const mockTemplate = createMockTemplate([
			{
				id: 1,
				email: "placeholder@example.com",
				name: "{{Broker}}",
				role: "SIGNER",
			},
			{
				id: 2,
				email: "placeholder2@example.com",
				name: "{{Broker}}",
				role: "SIGNER",
			},
		]);

		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => mockTemplate,
		});

		const broker = { email: "broker@fairlend.ca", name: "John Broker" };
		const investor = { email: "investor@example.com", name: "Jane Investor" };

		const recipients = await mapRecipientsForListing(
			"template_123",
			broker,
			investor
		);

		expect(recipients).toHaveLength(2);
		expect(recipients[0].email).toBe("broker@fairlend.ca");
		expect(recipients[1].email).toBe("broker@fairlend.ca");
	});
});
