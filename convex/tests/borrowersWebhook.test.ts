// @vitest-environment node
import { convexTest } from "convex-test";
import { beforeEach, describe, expect, test } from "vitest";
import type { Doc, Id } from "../_generated/dataModel";
import schema from "../schema";

process.env.LISTINGS_WEBHOOK_API_KEY = "test-webhook-key";
process.env.LISTINGS_WEBHOOK_ALLOWED_ORIGIN = "*";

const modules = import.meta.glob("../**/*.{ts,js,tsx,jsx}", { eager: false });
const createTest = () => convexTest(schema, modules);

const API_KEY = "test-webhook-key";
const WRONG_KEY = "wrong-key";
const JSON_HEADERS = { "Content-Type": "application/json", "x-api-key": API_KEY };

type BorrowerPayload = {
	name: string;
	email: string;
	phone?: string;
	rotessaCustomerId: string;
};

const baseBorrowerPayload: BorrowerPayload = {
	name: "John Doe",
	email: "john@example.com",
	rotessaCustomerId: "rot_123",
};

const makeBorrowerPayload = (
	overrides: Partial<BorrowerPayload> = {}
): BorrowerPayload => ({
	...baseBorrowerPayload,
	...overrides,
});

describe("/borrowers/create", () => {
	test("creates borrower when payload is valid", async () => {
		const t = createTest();

		const response = await t.fetch("/borrowers/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify(makeBorrowerPayload()),
		});

		expect(response.status).toBe(201);
		const body = (await response.json()) as {
			code: string;
			result: { borrowerId: string; created: boolean };
		};
		expect(body.code).toBe("borrower_created");
		expect(body.result.created).toBe(true);

		const borrowers = await t.run(
			async (ctx) => await ctx.db.query("borrowers").collect()
		);
		expect(borrowers).toHaveLength(1);
	});

	test("returns existing borrower when rotessaCustomerId already exists", async () => {
		const t = createTest();

		await t.fetch("/borrowers/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify(makeBorrowerPayload()),
		});

		const response = await t.fetch("/borrowers/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify(
				makeBorrowerPayload({
					name: "Jane Doe",
					email: "jane@example.com",
					rotessaCustomerId: "rot_123",
				})
			),
		});

		expect(response.status).toBe(200);
		const body = (await response.json()) as {
			code: string;
			result: { created: boolean };
		};
		expect(body.code).toBe("borrower_already_exists");
		expect(body.result.created).toBe(false);

		const borrowers = await t.run(
			async (ctx) => await ctx.db.query("borrowers").collect()
		);
		expect(borrowers).toHaveLength(1);
	});

	test("creates borrower with optional phone", async () => {
		const t = createTest();

		const response = await t.fetch("/borrowers/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify(makeBorrowerPayload({ phone: "+1-555-0100" })),
		});

		expect(response.status).toBe(201);
		const borrowers = await t.run(
			async (ctx) => await ctx.db.query("borrowers").collect()
		);
		expect(borrowers[0]?.phone).toBe("+1-555-0100");
	});

	test("rejects invalid email format", async () => {
		const t = createTest();

		const response = await t.fetch("/borrowers/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify(makeBorrowerPayload({ email: "not-an-email" })),
		});

		expect(response.status).toBe(400);
		const body = (await response.json()) as { code: string };
		expect(body.code).toBe("payload_validation_error");
	});

	test("rejects missing name", async () => {
		const t = createTest();

		const { name: _unused, ...payload } = makeBorrowerPayload();
		const response = await t.fetch("/borrowers/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify(payload),
		});

		expect(response.status).toBe(400);
		const body = (await response.json()) as { code: string };
		expect(body.code).toBe("payload_validation_error");
	});

	test("rejects missing email", async () => {
		const t = createTest();

		const { email: _unused, ...payload } = makeBorrowerPayload();
		const response = await t.fetch("/borrowers/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify(payload),
		});

		expect(response.status).toBe(400);
		const body = (await response.json()) as { code: string };
		expect(body.code).toBe("payload_validation_error");
	});

	test("rejects missing rotessaCustomerId", async () => {
		const t = createTest();

		const { rotessaCustomerId: _unused, ...payload } =
			makeBorrowerPayload();
		const response = await t.fetch("/borrowers/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify(payload),
		});

		expect(response.status).toBe(400);
		const body = (await response.json()) as { code: string };
		expect(body.code).toBe("payload_validation_error");
	});

	test("rejects invalid API key", async () => {
		const t = createTest();

		const response = await t.fetch("/borrowers/create", {
			method: "POST",
			headers: { ...JSON_HEADERS, "x-api-key": WRONG_KEY },
			body: JSON.stringify(makeBorrowerPayload()),
		});

		expect(response.status).toBe(401);
		const body = (await response.json()) as { code: string };
		expect(body.code).toBe("invalid_api_key");
	});

	test("rejects missing API key", async () => {
		const t = createTest();

		const response = await t.fetch("/borrowers/create", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(makeBorrowerPayload()),
		});

		expect(response.status).toBe(401);
		const body = (await response.json()) as { code: string };
		expect(body.code).toBe("invalid_api_key");
	});

	test("rejects malformed JSON", async () => {
		const t = createTest();

		const response = await t.fetch("/borrowers/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: "not json",
		});

		expect(response.status).toBe(400);
		const body = (await response.json()) as { code: string };
		expect(body.code).toBe("invalid_json");
	});
});

describe("/borrowers/get", () => {
	test("rejects invalid API key", async () => {
		const t = createTest();

		const response = await t.fetch("/borrowers/get?borrowerId=missing", {
			method: "GET",
			headers: { "x-api-key": WRONG_KEY },
		});

		expect(response.status).toBe(401);
		const body = (await response.json()) as { code: string };
		expect(body.code).toBe("invalid_api_key");
	});

	test("rejects missing API key", async () => {
		const t = createTest();

		const response = await t.fetch("/borrowers/get?borrowerId=missing", {
			method: "GET",
		});

		expect(response.status).toBe(401);
		const body = (await response.json()) as { code: string };
		expect(body.code).toBe("invalid_api_key");
	});

	test("retrieves borrower by borrowerId", async () => {
		const t = createTest();

		const createRes = await t.fetch("/borrowers/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify(makeBorrowerPayload()),
		});
		const { result } = (await createRes.json()) as {
			result: { borrowerId: string };
		};

		const response = await t.fetch(`/borrowers/get?borrowerId=${result.borrowerId}`, {
			method: "GET",
			headers: { "x-api-key": API_KEY },
		});

		expect(response.status).toBe(200);
		const body = (await response.json()) as {
			code: string;
			result: { _id: string };
		};
		expect(body.code).toBe("borrower_found");
		expect(body.result._id).toBe(result.borrowerId);
	});

	test("retrieves borrower by rotessaCustomerId", async () => {
		const t = createTest();

		await t.fetch("/borrowers/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify(
				makeBorrowerPayload({
					rotessaCustomerId: "rot_unique_456",
					email: "unique@example.com",
				})
			),
		});

		const response = await t.fetch(
			"/borrowers/get?rotessaCustomerId=rot_unique_456",
			{ method: "GET", headers: { "x-api-key": API_KEY } }
		);

		expect(response.status).toBe(200);
		const body = (await response.json()) as {
			result: { rotessaCustomerId: string };
		};
		expect(body.result.rotessaCustomerId).toBe("rot_unique_456");
	});

	test("retrieves borrower by email", async () => {
		const t = createTest();

		await t.fetch("/borrowers/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify(
				makeBorrowerPayload({
					email: "lookup@example.com",
					rotessaCustomerId: "rot_lookup",
				})
			),
		});

		const response = await t.fetch(
			"/borrowers/get?email=lookup@example.com",
			{ method: "GET", headers: { "x-api-key": API_KEY } }
		);

		expect(response.status).toBe(200);
		const body = (await response.json()) as { result: { email: string } };
		expect(body.result.email).toBe("lookup@example.com");
	});

	test("returns 404 for non-existent borrower", async () => {
		const t = createTest();

		const response = await t.fetch(
			"/borrowers/get?rotessaCustomerId=does_not_exist",
			{ method: "GET", headers: { "x-api-key": API_KEY } }
		);

		expect(response.status).toBe(404);
		const body = (await response.json()) as { code: string };
		expect(body.code).toBe("borrower_not_found");
	});

	test("rejects missing identifier", async () => {
		const t = createTest();

		const response = await t.fetch("/borrowers/get", {
			method: "GET",
			headers: { "x-api-key": API_KEY },
		});

		expect(response.status).toBe(400);
		const body = (await response.json()) as { code: string };
		expect(body.code).toBe("missing_identifier");
	});

	test("prioritizes borrowerId over rotessaCustomerId", async () => {
		const t = createTest();

		const createRes = await t.fetch("/borrowers/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify(makeBorrowerPayload()),
		});
		const { result } = (await createRes.json()) as {
			result: { borrowerId: string };
		};

		const response = await t.fetch(
			`/borrowers/get?borrowerId=${result.borrowerId}&rotessaCustomerId=other`,
			{ method: "GET", headers: { "x-api-key": API_KEY } }
		);

		expect(response.status).toBe(200);
		const body = (await response.json()) as { result: { _id: string } };
		expect(body.result._id).toBe(result.borrowerId);
	});
});

describe("/borrowers/list", () => {
	test("rejects invalid API key", async () => {
		const t = createTest();

		const response = await t.fetch("/borrowers/list", {
			method: "GET",
			headers: { "x-api-key": WRONG_KEY },
		});

		expect(response.status).toBe(401);
		const body = (await response.json()) as { code: string };
		expect(body.code).toBe("invalid_api_key");
	});

	test("rejects missing API key", async () => {
		const t = createTest();

		const response = await t.fetch("/borrowers/list", {
			method: "GET",
		});

		expect(response.status).toBe(401);
		const body = (await response.json()) as { code: string };
		expect(body.code).toBe("invalid_api_key");
	});

	test("lists all borrowers", async () => {
		const t = createTest();
		for (let i = 1; i <= 3; i += 1) {
			await t.fetch("/borrowers/create", {
				method: "POST",
				headers: JSON_HEADERS,
				body: JSON.stringify(
					makeBorrowerPayload({
						name: `Borrower ${i}`,
						email: `borrower${i}@example.com`,
						rotessaCustomerId: `rot_${i}`,
					})
				),
			});
		}

		const response = await t.fetch("/borrowers/list", {
			method: "GET",
			headers: { "x-api-key": API_KEY },
		});

		expect(response.status).toBe(200);
		const body = (await response.json()) as {
			result: { borrowers: Array<{ email: string }>; total: number };
		};
		expect(body.result.borrowers).toHaveLength(3);
		expect(body.result.total).toBe(3);
	});

	test("filters by emailContains", async () => {
		const t = createTest();
		for (let i = 1; i <= 2; i += 1) {
			await t.fetch("/borrowers/create", {
				method: "POST",
				headers: JSON_HEADERS,
				body: JSON.stringify(
					makeBorrowerPayload({
						name: `Borrower ${i}`,
						email: `borrower${i}@example.com`,
						rotessaCustomerId: `rot_${i}`,
					})
				),
			});
		}

		const response = await t.fetch("/borrowers/list?emailContains=borrower1", {
			method: "GET",
			headers: { "x-api-key": API_KEY },
		});

		const body = (await response.json()) as {
			result: { borrowers: Array<{ email: string }> };
		};
		expect(body.result.borrowers).toHaveLength(1);
		expect(body.result.borrowers[0]?.email).toBe("borrower1@example.com");
	});

	test("filters by nameContains", async () => {
		const t = createTest();
		for (let i = 1; i <= 2; i += 1) {
			await t.fetch("/borrowers/create", {
				method: "POST",
				headers: JSON_HEADERS,
				body: JSON.stringify(
					makeBorrowerPayload({
						name: `Borrower ${i}`,
						email: `borrower${i}@example.com`,
						rotessaCustomerId: `rot_${i}`,
					})
				),
			});
		}

		const response = await t.fetch("/borrowers/list?nameContains=Borrower 2", {
			method: "GET",
			headers: { "x-api-key": API_KEY },
		});

		const body = (await response.json()) as {
			result: { borrowers: Array<{ name: string }> };
		};
		expect(body.result.borrowers).toHaveLength(1);
		expect(body.result.borrowers[0]?.name).toBe("Borrower 2");
	});

	test("filters by createdAfter", async () => {
		const t = createTest();
		await t.fetch("/borrowers/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify(
				makeBorrowerPayload({
					name: "Borrower 1",
					email: "borrower1@example.com",
					rotessaCustomerId: "rot_1",
				})
			),
		});

		const response = await t.fetch(
			"/borrowers/list?createdAfter=2024-01-01",
			{
				method: "GET",
				headers: { "x-api-key": API_KEY },
			}
		);

		expect(response.status).toBe(200);
	});

	test("paginates with limit", async () => {
		const t = createTest();
		for (let i = 1; i <= 3; i += 1) {
			await t.fetch("/borrowers/create", {
				method: "POST",
				headers: JSON_HEADERS,
				body: JSON.stringify(
					makeBorrowerPayload({
						name: `Borrower ${i}`,
						email: `borrower${i}@example.com`,
						rotessaCustomerId: `rot_${i}`,
					})
				),
			});
		}

		const page1 = await t.fetch("/borrowers/list?limit=2", {
			method: "GET",
			headers: { "x-api-key": API_KEY },
		});
		const body1 = (await page1.json()) as {
			result: { borrowers: Array<{ _id: string }>; nextCursor?: string; hasMore: boolean };
		};
		expect(body1.result.borrowers).toHaveLength(2);
		expect(body1.result.hasMore).toBe(true);
		expect(body1.result.nextCursor).toBeDefined();

		const page2 = await t.fetch(
			`/borrowers/list?limit=2&cursor=${body1.result.nextCursor}`,
			{ method: "GET", headers: { "x-api-key": API_KEY } }
		);
		const body2 = (await page2.json()) as {
			result: { borrowers: Array<{ _id: string }> };
		};
		expect(body2.result.borrowers).toHaveLength(1);
	});
});

describe("/borrowers/update", () => {
	test("rejects invalid API key", async () => {
		const t = createTest();

		const response = await t.fetch("/borrowers/update", {
			method: "PATCH",
			headers: { "Content-Type": "application/json", "x-api-key": WRONG_KEY },
			body: JSON.stringify({ borrowerId: "missing", name: "Nope" }),
		});

		expect(response.status).toBe(401);
		const body = (await response.json()) as { code: string };
		expect(body.code).toBe("invalid_api_key");
	});

	test("rejects missing API key", async () => {
		const t = createTest();

		const response = await t.fetch("/borrowers/update", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ borrowerId: "missing", name: "Nope" }),
		});

		expect(response.status).toBe(401);
		const body = (await response.json()) as { code: string };
		expect(body.code).toBe("invalid_api_key");
	});

	test("updates name by borrowerId", async () => {
		const t = createTest();

		const createRes = await t.fetch("/borrowers/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify(makeBorrowerPayload()),
		});
		const { result } = (await createRes.json()) as {
			result: { borrowerId: string };
		};

		const response = await t.fetch("/borrowers/update", {
			method: "PATCH",
			headers: JSON_HEADERS,
			body: JSON.stringify({ borrowerId: result.borrowerId, name: "Updated Name" }),
		});

		expect(response.status).toBe(200);
		const updated = await t.run(async (ctx) =>
			ctx.db.get(result.borrowerId as Id<"borrowers">)
		);
		expect(updated?.name).toBe("Updated Name");
	});

	test("updates email by borrowerId", async () => {
		const t = createTest();

		const createRes = await t.fetch("/borrowers/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify(makeBorrowerPayload()),
		});
		const { result } = (await createRes.json()) as {
			result: { borrowerId: string };
		};

		const response = await t.fetch("/borrowers/update", {
			method: "PATCH",
			headers: JSON_HEADERS,
			body: JSON.stringify({
				borrowerId: result.borrowerId,
				email: "updated@example.com",
			}),
		});

		expect(response.status).toBe(200);
		const updated = await t.run(async (ctx) =>
			ctx.db.get(result.borrowerId as Id<"borrowers">)
		);
		expect(updated?.email).toBe("updated@example.com");
	});

	test("updates by rotessaCustomerId", async () => {
		const t = createTest();

		await t.fetch("/borrowers/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify(makeBorrowerPayload()),
		});

		const response = await t.fetch("/borrowers/update", {
			method: "PATCH",
			headers: JSON_HEADERS,
			body: JSON.stringify({
				rotessaCustomerId: "rot_123",
				name: "Rotessa Updated",
			}),
		});

		expect(response.status).toBe(200);
	});

	test("returns 404 when borrower not found", async () => {
		const t = createTest();
		const createRes = await t.fetch("/borrowers/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify(makeBorrowerPayload()),
		});
		const { result } = (await createRes.json()) as {
			result: { borrowerId: string };
		};

		await t.run(async (ctx) => {
			await ctx.db.delete(result.borrowerId as Id<"borrowers">);
		});

		const response = await t.fetch("/borrowers/update", {
			method: "PATCH",
			headers: JSON_HEADERS,
			body: JSON.stringify({ borrowerId: result.borrowerId, name: "Nope" }),
		});

		expect(response.status).toBe(404);
		const body = (await response.json()) as { code: string };
		expect(body.code).toBe("borrower_not_found");
	});

	test("rejects invalid email", async () => {
		const t = createTest();

		const createRes = await t.fetch("/borrowers/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify(makeBorrowerPayload()),
		});
		const { result } = (await createRes.json()) as {
			result: { borrowerId: string };
		};

		const response = await t.fetch("/borrowers/update", {
			method: "PATCH",
			headers: JSON_HEADERS,
			body: JSON.stringify({
				borrowerId: result.borrowerId,
				email: "bad-email",
			}),
		});

		expect(response.status).toBe(400);
		const body = (await response.json()) as { code: string };
		expect(body.code).toBe("payload_validation_error");
	});
});

describe("/borrowers/delete", () => {
	test("rejects invalid API key", async () => {
		const t = createTest();

		const response = await t.fetch("/borrowers/delete", {
			method: "DELETE",
			headers: { "Content-Type": "application/json", "x-api-key": WRONG_KEY },
			body: JSON.stringify({ borrowerId: "missing" }),
		});

		expect(response.status).toBe(401);
		const body = (await response.json()) as { code: string };
		expect(body.code).toBe("invalid_api_key");
	});

	test("rejects missing API key", async () => {
		const t = createTest();

		const response = await t.fetch("/borrowers/delete", {
			method: "DELETE",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ borrowerId: "missing" }),
		});

		expect(response.status).toBe(401);
		const body = (await response.json()) as { code: string };
		expect(body.code).toBe("invalid_api_key");
	});

	test("deletes borrower with no dependencies", async () => {
		const t = createTest();

		const createRes = await t.fetch("/borrowers/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify(
				makeBorrowerPayload({
					email: "delete@example.com",
					rotessaCustomerId: "rot_delete",
				})
			),
		});
		const { result } = (await createRes.json()) as {
			result: { borrowerId: string };
		};

		const response = await t.fetch("/borrowers/delete", {
			method: "DELETE",
			headers: JSON_HEADERS,
			body: JSON.stringify({ borrowerId: result.borrowerId }),
		});

		expect(response.status).toBe(200);
		const body = (await response.json()) as {
			code: string;
			result: { deleted: boolean };
		};
		expect(body.code).toBe("borrower_deleted");
		expect(body.result.deleted).toBe(true);

		const borrower = await t.run(async (ctx) =>
			ctx.db.get(result.borrowerId as Id<"borrowers">)
		);
		expect(borrower).toBeNull();
	});

	test("deletes borrower by rotessaCustomerId", async () => {
		const t = createTest();

		await t.fetch("/borrowers/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify(
				makeBorrowerPayload({
					email: "delete2@example.com",
					rotessaCustomerId: "rot_delete_2",
				})
			),
		});

		const response = await t.fetch("/borrowers/delete", {
			method: "DELETE",
			headers: JSON_HEADERS,
			body: JSON.stringify({ rotessaCustomerId: "rot_delete_2" }),
		});

		expect(response.status).toBe(200);
	});

	test("blocks deletion when mortgages exist", async () => {
		const t = createTest();

		const listingRes = await t.fetch("/listings/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify({
				borrower: makeBorrowerPayload(),
				mortgage: {
					loanAmount: 300000,
					interestRate: 4.5,
					originationDate: "2023-01-01",
					maturityDate: "2025-01-01",
					mortgageType: "1st",
					address: {
						street: "123 Main St",
						city: "Toronto",
						state: "ON",
						zip: "M5V 1A1",
						country: "Canada",
					},
					location: { lat: 43.65, lng: -79.38 },
					propertyType: "Condo",
					appraisalMarketValue: 400000,
					appraisalMethod: "Market",
					appraisalCompany: "Appraiser",
					appraisalDate: "2023-01-01",
					ltv: 75,
					externalMortgageId: "delete-deps-1",
				},
				listing: { visible: true },
			}),
		});

		const { result } = (await listingRes.json()) as {
			result: { borrowerId: string };
		};

		const response = await t.fetch("/borrowers/delete", {
			method: "DELETE",
			headers: JSON_HEADERS,
			body: JSON.stringify({ borrowerId: result.borrowerId }),
		});

		expect(response.status).toBe(409);
		const body = (await response.json()) as { code: string; mortgageCount: number };
		expect(body.code).toBe("borrower_has_dependencies");
		expect(body.mortgageCount).toBeGreaterThan(0);
	});

	test("force deletes borrower with mortgages", async () => {
		const t = createTest();

		const listingRes = await t.fetch("/listings/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify({
				borrower: makeBorrowerPayload({
					rotessaCustomerId: "rot_force",
					email: "force@example.com",
				}),
				mortgage: {
					loanAmount: 300000,
					interestRate: 4.5,
					originationDate: "2023-01-01",
					maturityDate: "2025-01-01",
					mortgageType: "1st",
					address: {
						street: "123 Main St",
						city: "Toronto",
						state: "ON",
						zip: "M5V 1A1",
						country: "Canada",
					},
					location: { lat: 43.65, lng: -79.38 },
					propertyType: "Condo",
					appraisalMarketValue: 400000,
					appraisalMethod: "Market",
					appraisalCompany: "Appraiser",
					appraisalDate: "2023-01-01",
					ltv: 75,
					externalMortgageId: "delete-force-1",
				},
				listing: { visible: true },
			}),
		});

		const { result } = (await listingRes.json()) as {
			result: { borrowerId: string };
		};

		const response = await t.fetch("/borrowers/delete", {
			method: "DELETE",
			headers: JSON_HEADERS,
			body: JSON.stringify({ borrowerId: result.borrowerId, force: true }),
		});

		expect(response.status).toBe(200);
	});

	test("returns 404 when borrower not found", async () => {
		const t = createTest();
		const createRes = await t.fetch("/borrowers/create", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify(makeBorrowerPayload()),
		});
		const { result } = (await createRes.json()) as {
			result: { borrowerId: string };
		};

		await t.run(async (ctx) => {
			await ctx.db.delete(result.borrowerId as Id<"borrowers">);
		});

		const response = await t.fetch("/borrowers/delete", {
			method: "DELETE",
			headers: JSON_HEADERS,
			body: JSON.stringify({ borrowerId: result.borrowerId }),
		});

		expect(response.status).toBe(404);
		const body = (await response.json()) as { code: string };
		expect(body.code).toBe("borrower_not_found");
	});
});
