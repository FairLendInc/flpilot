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
});
