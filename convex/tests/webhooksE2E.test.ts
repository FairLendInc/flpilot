// @vitest-environment node
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import type { Doc, Id } from "../_generated/dataModel";
import schema from "../schema";

process.env.LISTINGS_WEBHOOK_API_KEY = "test-webhook-key";
process.env.LISTINGS_WEBHOOK_ALLOWED_ORIGIN = "*";

const modules = import.meta.glob("../**/*.{ts,js,tsx,jsx}", { eager: false });
const createTest = () => convexTest(schema, modules);

const API_KEY = "test-webhook-key";
const JSON_HEADERS = { "Content-Type": "application/json", "x-api-key": API_KEY };

const baseBorrower = {
	name: "E2E Borrower",
	email: "e2e@example.com",
	rotessaCustomerId: "rot_e2e_1",
};

const baseMortgage = {
	externalMortgageId: "E2E-LOAN-001",
	loanAmount: 400000,
	interestRate: 5.5,
	originationDate: "2024-01-15",
	maturityDate: "2025-01-15",
	mortgageType: "1st" as const,
	address: {
		street: "E2E Street",
		city: "Toronto",
		state: "ON",
		zip: "M5V 1A1",
		country: "Canada",
	},
	location: { lat: 43.65, lng: -79.38 },
	propertyType: "Condo",
	appraisalMarketValue: 500000,
	appraisalMethod: "Comparative",
	appraisalCompany: "E2E Appraisals",
	appraisalDate: "2024-01-01",
	ltv: 80,
};

const createBorrower = async (
	t: ReturnType<typeof createTest>,
	overrides: Partial<typeof baseBorrower> = {}
) => {
	const response = await t.fetch("/borrowers/create", {
		method: "POST",
		headers: JSON_HEADERS,
		body: JSON.stringify({ ...baseBorrower, ...overrides }),
	});
	const body = (await response.json()) as { result: { borrowerId: string } };
	return body.result.borrowerId;
};

describe("End-to-End Workflows", () => {
	test("complete loan origination workflow", async () => {
		const t = createTest();

		const borrowerRes = await t.fetch("/borrowers/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify(baseBorrower),
		});
		expect(borrowerRes.status).toBe(201);
		const borrowerBody = (await borrowerRes.json()) as {
			result: { borrowerId: string };
		};

		const mortgageRes = await t.fetch("/mortgages/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify({
				...baseMortgage,
				borrowerId: borrowerBody.result.borrowerId,
			}),
		});
		expect(mortgageRes.status).toBe(201);
		const mortgageBody = (await mortgageRes.json()) as {
			result: { mortgageId: string };
		};

		const listingRes = await t.fetch("/listings/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify({
				borrower: baseBorrower,
				mortgage: {
					...baseMortgage,
					externalMortgageId: "E2E-LOAN-002",
					mortgageType: "2nd",
					loanAmount: 300000,
				},
				listing: { visible: true },
			}),
		});
		expect(listingRes.status).toBe(201);

		const borrowers = await t.run(async (ctx) => ctx.db.query("borrowers").collect());
		const mortgages = await t.run(async (ctx) => ctx.db.query("mortgages").collect());
		const listings = await t.run(async (ctx) => ctx.db.query("listings").collect());

		expect(borrowers).toHaveLength(1);
		expect(mortgages).toHaveLength(2);
		expect(listings).toHaveLength(1);
	});

	test("CRM sync workflow", async () => {
		const t = createTest();

		await t.fetch("/borrowers/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify(baseBorrower),
		});

		const listRes = await t.fetch("/borrowers/list?createdAfter=2024-01-01", {
			method: "GET",
			headers: { "x-api-key": API_KEY },
		});
		expect(listRes.status).toBe(200);

		const updateRes = await t.fetch("/borrowers/update", {
			method: "PATCH",
			headers: JSON_HEADERS,
			body: JSON.stringify({ rotessaCustomerId: "rot_e2e_1", name: "Updated" }),
		});
		expect(updateRes.status).toBe(200);

		const getRes = await t.fetch("/borrowers/get?rotessaCustomerId=rot_e2e_1", {
			method: "GET",
			headers: { "x-api-key": API_KEY },
		});
		const getBody = (await getRes.json()) as { result: { name: string } };
		expect(getBody.result.name).toBe("Updated");
	});

	test("single-call mortgage + borrower creation", async () => {
		const t = createTest();

		const mortgageRes = await t.fetch("/mortgages/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify({
				...baseMortgage,
				externalMortgageId: "E2E-LOAN-003",
				borrower: {
					name: "Inline Borrower",
					email: "inline@example.com",
					rotessaCustomerId: "rot_inline_99",
				},
			}),
		});
		expect(mortgageRes.status).toBe(201);
		const mortgageBody = (await mortgageRes.json()) as {
			result: { mortgageId: string };
		};

		const getMortgageRes = await t.fetch(
			`/mortgages/get?mortgageId=${mortgageBody.result.mortgageId}&includeBorrower=true`,
			{ method: "GET", headers: { "x-api-key": API_KEY } }
		);
		const getMortgageBody = (await getMortgageRes.json()) as {
			result: { borrower?: { rotessaCustomerId: string } };
		};
		expect(getMortgageBody.result.borrower?.rotessaCustomerId).toBe("rot_inline_99");

		const getBorrowerRes = await t.fetch(
			"/borrowers/get?rotessaCustomerId=rot_inline_99",
			{ method: "GET", headers: { "x-api-key": API_KEY } }
		);
		expect(getBorrowerRes.status).toBe(200);
	});

	test("dependency-aware deletion chain", async () => {
		const t = createTest();

		const listingRes = await t.fetch("/listings/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify({
				borrower: baseBorrower,
				mortgage: baseMortgage,
				listing: { visible: true },
			}),
		});
		const listingBody = (await listingRes.json()) as {
			result: { borrowerId: string; mortgageId: string; listingId: string };
		};

		const borrowerDelete = await t.fetch("/borrowers/delete", {
			method: "DELETE",
			headers: JSON_HEADERS,
			body: JSON.stringify({ borrowerId: listingBody.result.borrowerId }),
		});
		expect(borrowerDelete.status).toBe(409);

		const listingDelete = await t.fetch("/listings/delete", {
			method: "DELETE",
			headers: JSON_HEADERS,
			body: JSON.stringify({ listingId: listingBody.result.listingId }),
		});
		expect(listingDelete.status).toBe(200);

		const mortgageDelete = await t.fetch("/mortgages/delete", {
			method: "DELETE",
			headers: JSON_HEADERS,
			body: JSON.stringify({ mortgageId: listingBody.result.mortgageId }),
		});
		expect(mortgageDelete.status).toBe(200);

		const borrowerDelete2 = await t.fetch("/borrowers/delete", {
			method: "DELETE",
			headers: JSON_HEADERS,
			body: JSON.stringify({ borrowerId: listingBody.result.borrowerId }),
		});
		expect(borrowerDelete2.status).toBe(200);
	});

	test("idempotency across retries", async () => {
		const t = createTest();

		const first = await t.fetch("/borrowers/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify(baseBorrower),
		});
		const second = await t.fetch("/borrowers/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify(baseBorrower),
		});
		const third = await t.fetch("/borrowers/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify(baseBorrower),
		});

		const firstBody = (await first.json()) as { result: { borrowerId: string } };
		const secondBody = (await second.json()) as { result: { borrowerId: string } };
		const thirdBody = (await third.json()) as { result: { borrowerId: string } };

		expect(firstBody.result.borrowerId).toBe(secondBody.result.borrowerId);
		expect(secondBody.result.borrowerId).toBe(thirdBody.result.borrowerId);

		const mortgagePayload = {
			...baseMortgage,
			externalMortgageId: "E2E-IDEM-1",
			borrowerId: firstBody.result.borrowerId,
		};

		const mortgageFirst = await t.fetch("/mortgages/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify(mortgagePayload),
		});
		const mortgageSecond = await t.fetch("/mortgages/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify(mortgagePayload),
		});
		const mortgageThird = await t.fetch("/mortgages/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify(mortgagePayload),
		});

		const mortgageFirstBody = (await mortgageFirst.json()) as {
			result: { mortgageId: string };
		};
		const mortgageSecondBody = (await mortgageSecond.json()) as {
			result: { mortgageId: string };
		};
		const mortgageThirdBody = (await mortgageThird.json()) as {
			result: { mortgageId: string };
		};

		expect(mortgageFirstBody.result.mortgageId).toBe(
			mortgageSecondBody.result.mortgageId
		);
		expect(mortgageSecondBody.result.mortgageId).toBe(
			mortgageThirdBody.result.mortgageId
		);

		const mortgages = await t.run(async (ctx) => ctx.db.query("mortgages").collect());
		expect(mortgages).toHaveLength(1);
	});

	test("LOS lookup workflow", async () => {
		const t = createTest();

		await t.fetch("/listings/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify({
				borrower: baseBorrower,
				mortgage: { ...baseMortgage, externalMortgageId: "LOS-LOOKUP-1" },
				listing: { visible: true },
			}),
		});

		const mortgageGet = await t.fetch(
			"/mortgages/get?externalMortgageId=LOS-LOOKUP-1",
			{ method: "GET", headers: { "x-api-key": API_KEY } }
		);
		expect(mortgageGet.status).toBe(200);

		const listingGet = await t.fetch(
			"/listings/get?externalMortgageId=LOS-LOOKUP-1",
			{ method: "GET", headers: { "x-api-key": API_KEY } }
		);
		expect(listingGet.status).toBe(200);
	});

	test("payment processor lookup", async () => {
		const t = createTest();
		const borrowerId = await createBorrower(t, {
			rotessaCustomerId: "rot_pay",
			email: "pay@example.com",
		});

		await t.fetch("/mortgages/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify({
				...baseMortgage,
				externalMortgageId: "PAY-1",
				borrowerId,
			}),
		});
		await t.fetch("/mortgages/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify({
				...baseMortgage,
				externalMortgageId: "PAY-2",
				borrowerId,
			}),
		});

		const borrowerGet = await t.fetch(
			"/borrowers/get?rotessaCustomerId=rot_pay",
			{ method: "GET", headers: { "x-api-key": API_KEY } }
		);
		expect(borrowerGet.status).toBe(200);

		const mortgagesList = await t.fetch(
			`/mortgages/list?borrowerId=${borrowerId}`,
			{ method: "GET", headers: { "x-api-key": API_KEY } }
		);
		const mortgagesBody = (await mortgagesList.json()) as {
			result: { mortgages: Doc<"mortgages">[] };
		};
		expect(mortgagesBody.result.mortgages).toHaveLength(2);
	});

	test("filter accuracy for LTV range", async () => {
		const t = createTest();

		const ltvValues = [50, 65, 75, 85, 95];
		for (const ltv of ltvValues) {
			await t.fetch("/listings/create", {
				method: "POST",
				headers: JSON_HEADERS,
				body: JSON.stringify({
					borrower: {
						...baseBorrower,
						rotessaCustomerId: `rot_ltv_${ltv}`,
						email: `ltv${ltv}@example.com`,
					},
					mortgage: {
						...baseMortgage,
						externalMortgageId: `LTV-${ltv}`,
						ltv,
					},
					listing: { visible: true },
				}),
			});
		}

		const response = await t.fetch("/listings/list?minLtv=60&maxLtv=80", {
			method: "GET",
			headers: { "x-api-key": API_KEY },
		});
		const body = (await response.json()) as {
			result: { listings: Doc<"listings">[] };
		};
		expect(body.result.listings).toHaveLength(2);
	});

	test("pagination consistency", async () => {
		const t = createTest();

		for (let i = 0; i < 15; i += 1) {
			await t.fetch("/borrowers/create", {
				method: "POST",
				headers: JSON_HEADERS,
				body: JSON.stringify({
					name: `Borrower ${i}`,
					email: `borrower${i}@example.com`,
					rotessaCustomerId: `rot_page_${i}`,
				}),
			});
		}

		const page1 = await t.fetch("/borrowers/list?limit=5", {
			method: "GET",
			headers: { "x-api-key": API_KEY },
		});
		const body1 = (await page1.json()) as {
			result: { borrowers: Array<{ _id: string }>; nextCursor?: string };
		};
		const ids = new Set(body1.result.borrowers.map((b) => b._id));

		const page2 = await t.fetch(
			`/borrowers/list?limit=5&cursor=${body1.result.nextCursor}`,
			{ method: "GET", headers: { "x-api-key": API_KEY } }
		);
		const body2 = (await page2.json()) as {
			result: { borrowers: Array<{ _id: string }>; nextCursor?: string };
		};
		for (const borrower of body2.result.borrowers) {
			ids.add(borrower._id);
		}

		const page3 = await t.fetch(
			`/borrowers/list?limit=5&cursor=${body2.result.nextCursor}`,
			{ method: "GET", headers: { "x-api-key": API_KEY } }
		);
		const body3 = (await page3.json()) as {
			result: { borrowers: Array<{ _id: string }> };
		};
		for (const borrower of body3.result.borrowers) {
			ids.add(borrower._id);
		}

		expect(ids.size).toBe(15);
	});

	test("include options verification", async () => {
		const t = createTest();

		const createRes = await t.fetch("/listings/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify({
				borrower: baseBorrower,
				mortgage: baseMortgage,
				listing: { visible: true },
				comparables: [
					{
						address: {
							street: "100 Comp St",
							city: "Toronto",
							state: "ON",
							zip: "M5J 2N1",
						},
						saleAmount: 550000,
						saleDate: "2023-11-01",
						distance: 0.5,
					},
				],
			}),
		});
		const createBody = (await createRes.json()) as {
			result: { listingId: string; borrowerId: string };
		};

		const response = await t.fetch(
			`/listings/get?listingId=${createBody.result.listingId}&includeBorrower=true&includeComparables=true`,
			{ method: "GET", headers: { "x-api-key": API_KEY } }
		);
		const body = (await response.json()) as {
			result: {
				mortgage?: { _id: string };
				borrower?: { _id: string };
				comparables?: Array<{ saleAmount: number }>;
			};
		};
		expect(body.result.mortgage).toBeDefined();
		expect(body.result.borrower?._id).toBe(createBody.result.borrowerId);
		expect(body.result.comparables).toHaveLength(1);
	});
});

describe("Error Code Consistency", () => {
	test("returns invalid_api_key for unauthorized requests", async () => {
		const t = createTest();

		const response = await t.fetch("/borrowers/create", {
			method: "POST",
			headers: { "Content-Type": "application/json", "x-api-key": "wrong-key" },
			body: JSON.stringify(baseBorrower),
		});

		expect(response.status).toBe(401);
		const body = (await response.json()) as { code: string };
		expect(body.code).toBe("invalid_api_key");
	});

	test("returns payload_validation_error with errors array", async () => {
		const t = createTest();

		const response = await t.fetch("/borrowers/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify({ ...baseBorrower, email: "bad-email" }),
		});

		expect(response.status).toBe(400);
		const body = (await response.json()) as {
			code: string;
			errors: Array<{ code: string }>;
		};
		expect(body.code).toBe("payload_validation_error");
		expect(body.errors.length).toBeGreaterThan(0);
	});

	test("returns entity-specific not found codes", async () => {
		const t = createTest();

		const response = await t.fetch("/borrowers/get?borrowerId=missing", {
			method: "GET",
			headers: { "x-api-key": API_KEY },
		});

		expect(response.status).toBe(404);
		const body = (await response.json()) as { code: string };
		expect(body.code).toBe("borrower_not_found");
	});

	test("returns dependency conflict codes with counts", async () => {
		const t = createTest();

		const listingRes = await t.fetch("/listings/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify({
				borrower: baseBorrower,
				mortgage: baseMortgage,
				listing: { visible: true },
			}),
		});
		const listingBody = (await listingRes.json()) as {
			result: { borrowerId: string };
		};

		const response = await t.fetch("/borrowers/delete", {
			method: "DELETE",
			headers: JSON_HEADERS,
			body: JSON.stringify({ borrowerId: listingBody.result.borrowerId }),
		});

		expect(response.status).toBe(409);
		const body = (await response.json()) as { code: string; mortgageCount: number };
		expect(body.code).toBe("borrower_has_dependencies");
		expect(body.mortgageCount).toBeGreaterThan(0);
	});

	test("returns success codes on creation", async () => {
		const t = createTest();

		const response = await t.fetch("/borrowers/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify({
				...baseBorrower,
				rotessaCustomerId: "rot_success",
				email: "success@example.com",
			}),
		});

		expect(response.status).toBe(201);
		const body = (await response.json()) as { code: string };
		expect(body.code).toBe("borrower_created");
	});
});
