// @vitest-environment node
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import type { Doc, Id } from "../_generated/dataModel";
import schema from "../schema";

process.env.LISTINGS_WEBHOOK_API_KEY = "test-webhook-key";
process.env.LISTINGS_WEBHOOK_ALLOWED_ORIGIN = "*";

// @ts-ignore
const modules = import.meta.glob("../**/*.{ts,js,tsx,jsx}", { eager: false });
const createTest = () => convexTest(schema, modules);

const API_KEY = "test-webhook-key";
const WRONG_KEY = "wrong-key";
const JSON_HEADERS = {
	"Content-Type": "application/json",
	"x-api-key": API_KEY,
};

const baseBorrowerPayload = {
	name: "Borrower One",
	email: "b1@example.com",
	rotessaCustomerId: "rot_m1",
};

const baseMortgagePayload = {
	externalMortgageId: "LOS-2024-001",
	loanAmount: 500000,
	interestRate: 6.5,
	originationDate: "2024-01-01",
	maturityDate: "2025-01-01",
	mortgageType: "1st" as const,
	address: {
		street: "123 Main St",
		city: "Toronto",
		state: "ON",
		zip: "M5V 1A1",
		country: "Canada",
	},
	location: { lat: 43.65, lng: -79.38 },
	propertyType: "Single Family",
	appraisalMarketValue: 600000,
	appraisalMethod: "Market",
	appraisalCompany: "Appraisals Inc",
	appraisalDate: "2023-12-15",
	ltv: 83.3,
};

const createBorrower = async (t: ReturnType<typeof createTest>) => {
	const borrowerRes = await t.fetch("/borrowers/create", {
		method: "POST",
		headers: JSON_HEADERS,
		body: JSON.stringify(baseBorrowerPayload),
	});
	const { result } = (await borrowerRes.json()) as {
		result: { borrowerId: string };
	};
	return result.borrowerId;
};

describe("/mortgages/create", () => {
	test("rejects invalid API key", async () => {
		const t = createTest();

		const response = await t.fetch("/mortgages/create", {
			method: "POST",
			headers: { "Content-Type": "application/json", "x-api-key": WRONG_KEY },
			body: JSON.stringify({
				...baseMortgagePayload,
				externalMortgageId: "LOS-2024-099",
				borrowerId: "missing",
			}),
		});

		expect(response.status).toBe(401);
		const body = (await response.json()) as { code: string };
		expect(body.code).toBe("invalid_api_key");
	});

	test("rejects missing API key", async () => {
		const t = createTest();

		const response = await t.fetch("/mortgages/create", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				...baseMortgagePayload,
				externalMortgageId: "LOS-2024-099",
				borrowerId: "missing",
			}),
		});

		expect(response.status).toBe(401);
		const body = (await response.json()) as { code: string };
		expect(body.code).toBe("invalid_api_key");
	});

	test("creates mortgage with borrowerId reference", async () => {
		const t = createTest();
		const borrowerId = await createBorrower(t);

		const response = await t.fetch("/mortgages/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify({
				...baseMortgagePayload,
				externalMortgageId: "LOS-2024-100",
				borrowerId,
			}),
		});

		expect(response.status).toBe(201);
		const body = (await response.json()) as {
			code: string;
			result: { created: boolean; borrowerId: string };
		};
		expect(body.code).toBe("mortgage_created");
		expect(body.result.created).toBe(true);
		expect(body.result.borrowerId).toBe(borrowerId);
	});

	test("creates mortgage with borrowerRotessaId reference", async () => {
		const t = createTest();
		await createBorrower(t);

		const response = await t.fetch("/mortgages/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify({
				...baseMortgagePayload,
				externalMortgageId: "LOS-2024-101",
				borrowerRotessaId: "rot_m1",
			}),
		});

		expect(response.status).toBe(201);
	});

	test("creates mortgage with inline borrower", async () => {
		const t = createTest();

		const response = await t.fetch("/mortgages/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify({
				...baseMortgagePayload,
				externalMortgageId: "LOS-2024-102",
				borrower: {
					name: "Inline Borrower",
					email: "inline@example.com",
					rotessaCustomerId: "rot_inline_1",
				},
			}),
		});

		expect(response.status).toBe(201);
		const body = (await response.json()) as {
			result: { borrowerCreated: boolean };
		};
		expect(body.result.borrowerCreated).toBe(true);
	});

	test("reuses existing borrower when rotessaCustomerId matches", async () => {
		const t = createTest();
		await t.fetch("/borrowers/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify({
				name: "Existing Borrower",
				email: "existing@example.com",
				rotessaCustomerId: "rot_existing_1",
			}),
		});

		const response = await t.fetch("/mortgages/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify({
				...baseMortgagePayload,
				externalMortgageId: "LOS-2024-103",
				borrower: {
					name: "Different Name",
					email: "different@example.com",
					rotessaCustomerId: "rot_existing_1",
				},
			}),
		});

		expect(response.status).toBe(201);
		const body = (await response.json()) as {
			result: { borrowerCreated: boolean };
		};
		expect(body.result.borrowerCreated).toBe(false);
	});

	test("returns idempotent response for duplicate externalMortgageId", async () => {
		const t = createTest();

		const payload = {
			...baseMortgagePayload,
			externalMortgageId: "LOS-2024-104",
			borrower: {
				name: "Test Borrower",
				email: "test@example.com",
				rotessaCustomerId: "rot_idem_1",
			},
		};

		await t.fetch("/mortgages/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify(payload),
		});

		const response = await t.fetch("/mortgages/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify(payload),
		});

		expect(response.status).toBe(200);
		const body = (await response.json()) as {
			code: string;
			result: { created: boolean };
		};
		expect(body.code).toBe("mortgage_already_exists");
		expect(body.result.created).toBe(false);
	});

	test("rejects invalid borrowerId", async () => {
		const t = createTest();

		const response = await t.fetch("/mortgages/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify({
				...baseMortgagePayload,
				externalMortgageId: "LOS-2024-105",
				borrowerId: "missing",
			}),
		});

		expect(response.status).toBe(400);
		const body = (await response.json()) as { code: string };
		expect(body.code).toBe("invalid_borrower_id");
	});

	test("rejects unknown borrowerRotessaId", async () => {
		const t = createTest();

		const response = await t.fetch("/mortgages/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify({
				...baseMortgagePayload,
				externalMortgageId: "LOS-2024-106",
				borrowerRotessaId: "rot_missing",
			}),
		});

		expect(response.status).toBe(400);
		const body = (await response.json()) as { code: string };
		expect(body.code).toBe("borrower_not_found");
	});

	test("rejects missing borrower reference", async () => {
		const t = createTest();

		const response = await t.fetch("/mortgages/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify({
				...baseMortgagePayload,
				externalMortgageId: "LOS-2024-107",
			}),
		});

		expect(response.status).toBe(400);
		const body = (await response.json()) as { code: string };
		expect(body.code).toBe("payload_validation_error");
	});

	test("rejects maturity before origination", async () => {
		const t = createTest();
		const borrowerId = await createBorrower(t);

		const response = await t.fetch("/mortgages/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify({
				...baseMortgagePayload,
				externalMortgageId: "LOS-2024-108",
				borrowerId,
				originationDate: "2024-02-01",
				maturityDate: "2024-01-01",
			}),
		});

		expect(response.status).toBe(400);
		const body = (await response.json()) as { code: string };
		expect(body.code).toBe("payload_validation_error");
	});
});

describe("/mortgages/get", () => {
	test("rejects invalid API key", async () => {
		const t = createTest();

		const response = await t.fetch("/mortgages/get?mortgageId=missing", {
			method: "GET",
			headers: { "x-api-key": WRONG_KEY },
		});

		expect(response.status).toBe(401);
		const body = (await response.json()) as { code: string };
		expect(body.code).toBe("invalid_api_key");
	});

	test("rejects missing API key", async () => {
		const t = createTest();

		const response = await t.fetch("/mortgages/get?mortgageId=missing", {
			method: "GET",
		});

		expect(response.status).toBe(401);
		const body = (await response.json()) as { code: string };
		expect(body.code).toBe("invalid_api_key");
	});

	test("retrieves mortgage by mortgageId", async () => {
		const t = createTest();
		const borrowerId = await createBorrower(t);

		const createRes = await t.fetch("/mortgages/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify({
				...baseMortgagePayload,
				externalMortgageId: "LOS-GET-1",
				borrowerId,
			}),
		});
		const { result } = (await createRes.json()) as {
			result: { mortgageId: string };
		};

		const response = await t.fetch(
			`/mortgages/get?mortgageId=${result.mortgageId}`,
			{ method: "GET", headers: { "x-api-key": API_KEY } }
		);

		expect(response.status).toBe(200);
		const body = (await response.json()) as { result: { _id: string } };
		expect(body.result._id).toBe(result.mortgageId);
	});

	test("retrieves mortgage by externalMortgageId", async () => {
		const t = createTest();
		const borrowerId = await createBorrower(t);

		await t.fetch("/mortgages/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify({
				...baseMortgagePayload,
				externalMortgageId: "LOS-GET-2",
				borrowerId,
			}),
		});

		const response = await t.fetch(
			"/mortgages/get?externalMortgageId=LOS-GET-2",
			{ method: "GET", headers: { "x-api-key": API_KEY } }
		);

		expect(response.status).toBe(200);
		const body = (await response.json()) as {
			result: { externalMortgageId: string };
		};
		expect(body.result.externalMortgageId).toBe("LOS-GET-2");
	});

	test("includes borrower data when requested", async () => {
		const t = createTest();
		const borrowerId = await createBorrower(t);

		await t.fetch("/mortgages/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify({
				...baseMortgagePayload,
				externalMortgageId: "LOS-GET-3",
				borrowerId,
			}),
		});

		const response = await t.fetch(
			"/mortgages/get?externalMortgageId=LOS-GET-3&includeBorrower=true",
			{ method: "GET", headers: { "x-api-key": API_KEY } }
		);

		const body = (await response.json()) as {
			result: { borrower?: { _id: string } };
		};
		expect(body.result.borrower?._id).toBe(borrowerId);
	});

	test("includes listing data when requested", async () => {
		const t = createTest();
		const borrowerId = await createBorrower(t);

		const createRes = await t.fetch("/mortgages/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify({
				...baseMortgagePayload,
				externalMortgageId: "LOS-GET-4",
				borrowerId,
			}),
		});
		const { result } = (await createRes.json()) as {
			result: { mortgageId: string };
		};

		await t.run(async (ctx) => {
			await ctx.db.insert("listings", {
				mortgageId: result.mortgageId as Id<"mortgages">,
				visible: true,
				locked: false,
			});
		});

		const response = await t.fetch(
			"/mortgages/get?externalMortgageId=LOS-GET-4&includeListing=true",
			{ method: "GET", headers: { "x-api-key": API_KEY } }
		);

		const body = (await response.json()) as {
			result: { listing?: { mortgageId: string } };
		};
		expect(body.result.listing?.mortgageId).toBe(result.mortgageId);
	});

	test("returns 404 when mortgage not found", async () => {
		const t = createTest();

		const response = await t.fetch("/mortgages/get?mortgageId=missing", {
			method: "GET",
			headers: { "x-api-key": API_KEY },
		});

		expect(response.status).toBe(404);
		const body = (await response.json()) as { code: string };
		expect(body.code).toBe("mortgage_not_found");
	});
});

describe("/mortgages/list", () => {
	test("rejects invalid API key", async () => {
		const t = createTest();

		const response = await t.fetch("/mortgages/list", {
			method: "GET",
			headers: { "x-api-key": WRONG_KEY },
		});

		expect(response.status).toBe(401);
		const body = (await response.json()) as { code: string };
		expect(body.code).toBe("invalid_api_key");
	});

	test("rejects missing API key", async () => {
		const t = createTest();

		const response = await t.fetch("/mortgages/list", {
			method: "GET",
		});

		expect(response.status).toBe(401);
		const body = (await response.json()) as { code: string };
		expect(body.code).toBe("invalid_api_key");
	});

	test("lists all mortgages", async () => {
		const t = createTest();
		const borrowerId = await createBorrower(t);

		await t.fetch("/mortgages/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify({
				...baseMortgagePayload,
				externalMortgageId: "LOS-LIST-1",
				borrowerId,
			}),
		});

		const response = await t.fetch("/mortgages/list", {
			method: "GET",
			headers: { "x-api-key": API_KEY },
		});

		expect(response.status).toBe(200);
		const body = (await response.json()) as {
			result: { mortgages: Doc<"mortgages">[] };
		};
		expect(body.result.mortgages.length).toBeGreaterThan(0);
	});

	test("filters by borrowerId", async () => {
		const t = createTest();
		const borrowerId = await createBorrower(t);

		await t.fetch("/mortgages/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify({
				...baseMortgagePayload,
				externalMortgageId: "LOS-LIST-2",
				borrowerId,
			}),
		});

		const response = await t.fetch(`/mortgages/list?borrowerId=${borrowerId}`, {
			method: "GET",
			headers: { "x-api-key": API_KEY },
		});

		const body = (await response.json()) as {
			result: { mortgages: Doc<"mortgages">[] };
		};
		expect(body.result.mortgages).toHaveLength(1);
	});

	test("filters by status", async () => {
		const t = createTest();
		const borrowerId = await createBorrower(t);

		await t.fetch("/mortgages/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify({
				...baseMortgagePayload,
				externalMortgageId: "LOS-LIST-3",
				borrowerId,
				status: "closed",
			}),
		});

		const response = await t.fetch("/mortgages/list?status=closed", {
			method: "GET",
			headers: { "x-api-key": API_KEY },
		});

		const body = (await response.json()) as {
			result: { mortgages: Doc<"mortgages">[] };
		};
		expect(body.result.mortgages).toHaveLength(1);
	});

	test("filters by LTV range", async () => {
		const t = createTest();
		const borrowerId = await createBorrower(t);

		await t.fetch("/mortgages/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify({
				...baseMortgagePayload,
				externalMortgageId: "LOS-LIST-4",
				borrowerId,
				ltv: 70,
			}),
		});

		const response = await t.fetch("/mortgages/list?minLtv=60&maxLtv=80", {
			method: "GET",
			headers: { "x-api-key": API_KEY },
		});

		const body = (await response.json()) as {
			result: { mortgages: Doc<"mortgages">[] };
		};
		expect(body.result.mortgages).toHaveLength(1);
	});

	test("filters by maturity date range", async () => {
		const t = createTest();
		const borrowerId = await createBorrower(t);

		await t.fetch("/mortgages/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify({
				...baseMortgagePayload,
				externalMortgageId: "LOS-LIST-5",
				borrowerId,
				maturityDate: "2026-01-01",
			}),
		});

		const response = await t.fetch(
			"/mortgages/list?maturityAfter=2025-01-01&maturityBefore=2027-01-01",
			{ method: "GET", headers: { "x-api-key": API_KEY } }
		);

		const body = (await response.json()) as {
			result: { mortgages: Doc<"mortgages">[] };
		};
		expect(body.result.mortgages).toHaveLength(1);
	});

	test("filters by hasListing=true", async () => {
		const t = createTest();
		const borrowerId = await createBorrower(t);

		const createRes = await t.fetch("/mortgages/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify({
				...baseMortgagePayload,
				externalMortgageId: "LOS-LIST-6",
				borrowerId,
			}),
		});
		const { result } = (await createRes.json()) as {
			result: { mortgageId: string };
		};

		await t.run(async (ctx) => {
			await ctx.db.insert("listings", {
				mortgageId: result.mortgageId as Id<"mortgages">,
				visible: true,
				locked: false,
			});
		});

		const response = await t.fetch("/mortgages/list?hasListing=true", {
			method: "GET",
			headers: { "x-api-key": API_KEY },
		});

		const body = (await response.json()) as {
			result: { mortgages: Doc<"mortgages">[] };
		};
		expect(body.result.mortgages).toHaveLength(1);
	});

	test("paginates results", async () => {
		const t = createTest();
		const borrowerId = await createBorrower(t);

		for (let i = 0; i < 4; i += 1) {
			await t.fetch("/mortgages/create", {
				method: "POST",
				headers: JSON_HEADERS,
				body: JSON.stringify({
					...baseMortgagePayload,
					externalMortgageId: `LOS-LIST-PAGE-${i}`,
					borrowerId,
				}),
			});
		}

		const page1 = await t.fetch("/mortgages/list?limit=2", {
			method: "GET",
			headers: { "x-api-key": API_KEY },
		});
		const body1 = (await page1.json()) as {
			result: {
				mortgages: Doc<"mortgages">[];
				nextCursor?: string;
				hasMore: boolean;
			};
		};
		expect(body1.result.mortgages).toHaveLength(2);
		expect(body1.result.hasMore).toBe(true);
		expect(body1.result.nextCursor).toBeDefined();

		const page2 = await t.fetch(
			`/mortgages/list?limit=2&cursor=${body1.result.nextCursor}`,
			{ method: "GET", headers: { "x-api-key": API_KEY } }
		);
		const body2 = (await page2.json()) as {
			result: { mortgages: Doc<"mortgages">[] };
		};
		expect(body2.result.mortgages).toHaveLength(2);
	});

	test("includes borrower data when requested", async () => {
		const t = createTest();
		const borrowerId = await createBorrower(t);

		await t.fetch("/mortgages/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify({
				...baseMortgagePayload,
				externalMortgageId: "LOS-LIST-7",
				borrowerId,
			}),
		});

		const response = await t.fetch("/mortgages/list?includeBorrower=true", {
			method: "GET",
			headers: { "x-api-key": API_KEY },
		});

		const body = (await response.json()) as {
			result: { mortgages: Array<{ borrower?: { _id: string } }> };
		};
		expect(body.result.mortgages[0]?.borrower?._id).toBe(borrowerId);
	});
});
