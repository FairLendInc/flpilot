// @vitest-environment node
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "../schema";

// Ensure webhook configuration is present before modules load
process.env.LISTINGS_WEBHOOK_API_KEY = "test-webhook-key";
process.env.LISTINGS_WEBHOOK_ALLOWED_ORIGIN = "*";

// @ts-ignore
const modules = import.meta.glob("../**/*.{ts,js,tsx,jsx}", { eager: false });
const createTest = () => convexTest(schema, modules);

const makeWebhookPayload = (overrides: Record<string, any> = {}) => {
	const basePayload = {
		borrower: {
			name: "Webhook Borrower",
			email: "webhook.borrower@example.com",
			rotessaCustomerId: "rotessa-webhook",
		},
		mortgage: {
			loanAmount: 475000,
			interestRate: 5.25,
			originationDate: "2023-01-01",
			maturityDate: "2025-01-01",
			status: "active" as const,
			mortgageType: "1st" as const,
			address: {
				street: "789 Integration Ave",
				city: "Ottawa",
				state: "ON",
				zip: "K1A0B1",
				country: "Canada",
			},
			location: {
				lat: 45.4215,
				lng: -75.6972,
			},
			propertyType: "Townhouse",
			appraisalMarketValue: 540000,
			appraisalMethod: "Appraisal",
			appraisalCompany: "Webhook Appraisals",
			appraisalDate: "2023-11-15",
			ltv: 88,
			externalMortgageId: "webhook-test-mortgage",
		},
		listing: {
			visible: true,
		},
	};

	return structuredClone({ ...basePayload, ...overrides });
};

describe("/listings/create webhook", () => {
	test("creates listing when payload and key are valid", async () => {
		const t = createTest();

		const response = await t.fetch("/listings/create", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": "test-webhook-key",
			},
			body: JSON.stringify(makeWebhookPayload()),
		});

		expect(response.status).toBe(201);
		const body = (await response.json()) as {
			code: string;
			result: { created: boolean };
		};
		expect(body.code).toBe("listing_created");
		expect(body.result.created).toBe(true);

		const listings = await t.run(async (ctx) => {
			return await ctx.db.query("listings").collect();
		});
		expect(listings).toHaveLength(1);
	});

	test("rejects requests with invalid API key", async () => {
		const t = createTest();

		const response = await t.fetch("/listings/create", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": "wrong-key",
			},
			body: JSON.stringify(makeWebhookPayload()),
		});

		expect(response.status).toBe(401);
		const body = (await response.json()) as { code: string };
		expect(body.code).toBe("invalid_api_key");

		const listings = await t.run(async (ctx) => {
			return await ctx.db.query("listings").collect();
		});
		expect(listings).toHaveLength(0);
	});

	test("returns validation errors for malformed payloads", async () => {
		const t = createTest();
		const invalidPayload = makeWebhookPayload({
			borrower: {
				name: "Borrower",
				email: "not-an-email",
				rotessaCustomerId: "rotessa-webhook",
			},
			mortgage: {
				loanAmount: -1,
				interestRate: 200,
				originationDate: "2024-01-01",
				maturityDate: "2023-01-01",
				status: "active" as const,
				mortgageType: "1st" as const,
				address: {
					street: "",
					city: "",
					state: "",
					zip: "",
					country: "",
				},
				location: {
					lat: 120,
					lng: 200,
				},
				propertyType: "",
				appraisalMarketValue: 0,
				appraisalMethod: "",
				appraisalCompany: "",
				appraisalDate: "invalid-date",
				ltv: 150,
				externalMortgageId: "",
			},
		});

		const response = await t.fetch("/listings/create", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": "test-webhook-key",
			},
			body: JSON.stringify(invalidPayload),
		});

		expect(response.status).toBe(400);
		const body = (await response.json()) as {
			code: string;
			errors: Array<{ code: string }>;
		};
		expect(body.code).toBe("payload_validation_error");
		expect(body.errors.length).toBeGreaterThan(0);
	});

	test("creates listing with comparables", async () => {
		const t = createTest();

		const payload = makeWebhookPayload({
			comparables: [
				{
					address: {
						street: "123 Comp St",
						city: "Toronto",
						state: "ON",
						zip: "M5J 2N1",
					},
					saleAmount: 520000,
					saleDate: "2023-11-15",
					distance: 0.5,
					squareFeet: 1800,
					bedrooms: 3,
					bathrooms: 2,
					propertyType: "Townhouse",
				},
				{
					address: {
						street: "456 Comp Ave",
						city: "Toronto",
						state: "ON",
						zip: "M5K 1L9",
					},
					saleAmount: 535000,
					saleDate: "2023-10-20",
					distance: 0.8,
				},
			],
		});

		const response = await t.fetch("/listings/create", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": "test-webhook-key",
			},
			body: JSON.stringify(payload),
		});

		expect(response.status).toBe(201);
		const body = (await response.json()) as {
			code: string;
			result: { created: boolean };
		};
		expect(body.code).toBe("listing_created");
		expect(body.result.created).toBe(true);

		const comparables = await t.run(async (ctx) => {
			return await ctx.db.query("appraisal_comparables").collect();
		});
		expect(comparables).toHaveLength(2);
	});

	test("creates listing without comparables (optional)", async () => {
		const t = createTest();

		const payload = makeWebhookPayload({
			comparables: [],
		});

		const response = await t.fetch("/listings/create", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": "test-webhook-key",
			},
			body: JSON.stringify(payload),
		});

		expect(response.status).toBe(201);
		const body = (await response.json()) as {
			code: string;
			result: { created: boolean };
		};
		expect(body.code).toBe("listing_created");
		expect(body.result.created).toBe(true);

		const comparables = await t.run(async (ctx) => {
			return await ctx.db.query("appraisal_comparables").collect();
		});
		expect(comparables).toHaveLength(0);
	});

	test("creates listing without comparables field (optional)", async () => {
		const t = createTest();

		const payload = makeWebhookPayload();

		const response = await t.fetch("/listings/create", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": "test-webhook-key",
			},
			body: JSON.stringify(payload),
		});

		expect(response.status).toBe(201);
		const body = (await response.json()) as {
			code: string;
			result: { created: boolean };
		};
		expect(body.code).toBe("listing_created");
		expect(body.result.created).toBe(true);

		const comparables = await t.run(async (ctx) => {
			return await ctx.db.query("appraisal_comparables").collect();
		});
		expect(comparables).toHaveLength(0);
	});

	test("returns validation errors for invalid comparable data", async () => {
		const t = createTest();

		const invalidPayload = makeWebhookPayload({
			comparables: [
				{
					address: {
						street: "",
						city: "Toronto",
						state: "ON",
						zip: "M5J 2N1",
					},
					saleAmount: -100000,
					saleDate: "2030-01-01",
					distance: -1,
				},
			],
		});

		const response = await t.fetch("/listings/create", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": "test-webhook-key",
			},
			body: JSON.stringify(invalidPayload),
		});

		expect(response.status).toBe(400);
		const body = (await response.json()) as {
			code: string;
			errors: Array<{ code: string; path: string }>;
		};
		expect(body.code).toBe("payload_validation_error");
		const comparableErrors = body.errors.filter((e) =>
			e.path.startsWith("comparables")
		);
		expect(comparableErrors.length).toBeGreaterThan(0);
		expect(comparableErrors.find((e) => e.path.includes("address.street"))).toBeDefined();
		expect(comparableErrors.find((e) => e.path.includes("saleAmount"))).toBeDefined();
		expect(comparableErrors.find((e) => e.path.includes("saleDate"))).toBeDefined();
		expect(comparableErrors.find((e) => e.path.includes("distance"))).toBeDefined();
	});
});

describe("/listings/update webhook", () => {
	test("updates listing when payload and key are valid", async () => {
		const t = createTest();

		// First create a listing
		const createResponse = await t.fetch("/listings/create", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": "test-webhook-key",
			},
			body: JSON.stringify(makeWebhookPayload()),
		});

		expect(createResponse.status).toBe(201);
		const createBody = (await createResponse.json()) as {
			code: string;
			result: { created: boolean; listingId: string };
		};
		const listingId = createBody.result.listingId;

		// Now update the listing
		const updateResponse = await t.fetch("/listings/update", {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": "test-webhook-key",
			},
			body: JSON.stringify({
				listingId,
				visible: false,
				locked: true,
			}),
		});

		expect(updateResponse.status).toBe(200);
		const updateBody = (await updateResponse.json()) as {
			code: string;
			listingId: string;
		};
		expect(updateBody.code).toBe("listing_updated");
		expect(updateBody.listingId).toBe(listingId);

		// Verify the update
		const listing = await t.run(async (ctx) => {
			return await ctx.db.get(listingId as any);
		});
		expect(listing?.visible).toBe(false);
		expect(listing?.locked).toBe(true);
	});

	test("rejects requests with invalid API key", async () => {
		const t = createTest();

		const response = await t.fetch("/listings/update", {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": "wrong-key",
			},
			body: JSON.stringify({
				listingId: "some-id",
				visible: false,
			}),
		});

		expect(response.status).toBe(401);
		const body = (await response.json()) as { code: string };
		expect(body.code).toBe("invalid_api_key");
	});

	test("rejects requests with missing listingId", async () => {
		const t = createTest();

		const response = await t.fetch("/listings/update", {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": "test-webhook-key",
			},
			body: JSON.stringify({
				visible: false,
			}),
		});

		expect(response.status).toBe(400);
		const body = (await response.json()) as { code: string };
		expect(body.code).toBe("missing_listing_id");
	});
});

describe("/listings/delete webhook", () => {
	test("deletes listing when payload and key are valid", async () => {
		const t = createTest();

		// First create a listing
		const createResponse = await t.fetch("/listings/create", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": "test-webhook-key",
			},
			body: JSON.stringify(makeWebhookPayload()),
		});

		expect(createResponse.status).toBe(201);
		const createBody = (await createResponse.json()) as {
			code: string;
			result: { created: boolean; listingId: string };
		};
		const listingId = createBody.result.listingId;

		// Now delete the listing
		const deleteResponse = await t.fetch("/listings/delete", {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": "test-webhook-key",
			},
			body: JSON.stringify({
				listingId,
			}),
		});

		expect(deleteResponse.status).toBe(200);
		const deleteBody = (await deleteResponse.json()) as {
			code: string;
			listingId: string;
		};
		expect(deleteBody.code).toBe("listing_deleted");
		expect(deleteBody.listingId).toBe(listingId);

		// Verify the deletion
		const listing = await t.run(async (ctx) => {
			return await ctx.db.get(listingId as any);
		});
		expect(listing).toBeNull();
	});

	test("rejects requests with invalid API key", async () => {
		const t = createTest();

		const response = await t.fetch("/listings/delete", {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": "wrong-key",
			},
			body: JSON.stringify({
				listingId: "some-id",
			}),
		});

		expect(response.status).toBe(401);
		const body = (await response.json()) as { code: string };
		expect(body.code).toBe("invalid_api_key");
	});

	test("rejects requests with missing listingId", async () => {
		const t = createTest();

		const response = await t.fetch("/listings/delete", {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": "test-webhook-key",
			},
			body: JSON.stringify({}),
		});

		expect(response.status).toBe(400);
		const body = (await response.json()) as { code: string };
		expect(body.code).toBe("missing_listing_id");
	});
});

describe("/mortgages/update webhook", () => {
	test("updates mortgage when payload and key are valid", async () => {
		const t = createTest();

		// First create a listing (which creates a mortgage)
		const createResponse = await t.fetch("/listings/create", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": "test-webhook-key",
			},
			body: JSON.stringify(makeWebhookPayload()),
		});

		expect(createResponse.status).toBe(201);
		const createBody = (await createResponse.json()) as {
			code: string;
			result: { created: boolean; mortgageId: string };
		};
		const mortgageId = createBody.result.mortgageId;

		// Now update the mortgage
		const updateResponse = await t.fetch("/mortgages/update", {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": "test-webhook-key",
			},
			body: JSON.stringify({
				mortgageId,
				loanAmount: 500000,
				interestRate: 5.5,
				status: "renewed",
			}),
		});

		expect(updateResponse.status).toBe(200);
		const updateBody = (await updateResponse.json()) as {
			code: string;
			mortgageId: string;
		};
		expect(updateBody.code).toBe("mortgage_updated");
		expect(updateBody.mortgageId).toBe(mortgageId);

		// Verify the update
		const mortgage = await t.run(async (ctx) => {
			return await ctx.db.get(mortgageId as any);
		});
		expect(mortgage?.loanAmount).toBe(500000);
		expect(mortgage?.interestRate).toBe(5.5);
		expect(mortgage?.status).toBe("renewed");
	});

	test("rejects requests with invalid API key", async () => {
		const t = createTest();

		const response = await t.fetch("/mortgages/update", {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": "wrong-key",
			},
			body: JSON.stringify({
				mortgageId: "some-id",
				loanAmount: 500000,
			}),
		});

		expect(response.status).toBe(401);
		const body = (await response.json()) as { code: string };
		expect(body.code).toBe("invalid_api_key");
	});

	test("rejects requests with missing mortgageId", async () => {
		const t = createTest();

		const response = await t.fetch("/mortgages/update", {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": "test-webhook-key",
			},
			body: JSON.stringify({
				loanAmount: 500000,
			}),
		});

		expect(response.status).toBe(400);
		const body = (await response.json()) as { code: string };
		expect(body.code).toBe("missing_mortgage_id");
	});
});

describe("/mortgages/delete webhook", () => {
	test("deletes mortgage and cascade dependencies when payload and key are valid", async () => {
		const t = createTest();

		// First create a listing (which creates a mortgage)
		const createResponse = await t.fetch("/listings/create", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": "test-webhook-key",
			},
			body: JSON.stringify(makeWebhookPayload()),
		});

		expect(createResponse.status).toBe(201);
		const createBody = (await createResponse.json()) as {
			code: string;
			result: { created: boolean; mortgageId: string; listingId: string };
		};
		const mortgageId = createBody.result.mortgageId;
		const listingId = createBody.result.listingId;

		// Now delete the mortgage
		const deleteResponse = await t.fetch("/mortgages/delete", {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": "test-webhook-key",
			},
			body: JSON.stringify({
				mortgageId,
			}),
		});

		expect(deleteResponse.status).toBe(200);
		const deleteBody = (await deleteResponse.json()) as {
			code: string;
			mortgageId: string;
			deletedCounts: {
				listings: number;
				comparables: number;
				ownership: number;
				payments: number;
			};
		};
		expect(deleteBody.code).toBe("mortgage_deleted");
		expect(deleteBody.mortgageId).toBe(mortgageId);
		expect(deleteBody.deletedCounts.listings).toBe(1);

		// Verify the deletion
		const mortgage = await t.run(async (ctx) => {
			return await ctx.db.get(mortgageId as any);
		});
		expect(mortgage).toBeNull();

		// Verify listing was deleted
		const listing = await t.run(async (ctx) => {
			return await ctx.db.get(listingId as any);
		});
		expect(listing).toBeNull();
	});

	test("rejects requests with invalid API key", async () => {
		const t = createTest();

		const response = await t.fetch("/mortgages/delete", {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": "wrong-key",
			},
			body: JSON.stringify({
				mortgageId: "some-id",
			}),
		});

		expect(response.status).toBe(401);
		const body = (await response.json()) as { code: string };
		expect(body.code).toBe("invalid_api_key");
	});

	test("rejects requests with missing mortgageId", async () => {
		const t = createTest();

		const response = await t.fetch("/mortgages/delete", {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": "test-webhook-key",
			},
			body: JSON.stringify({}),
		});

		expect(response.status).toBe(400);
		const body = (await response.json()) as { code: string };
		expect(body.code).toBe("missing_mortgage_id");
	});
});
