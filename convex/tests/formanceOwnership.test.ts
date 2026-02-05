// @vitest-environment node
import { convexTest } from "convex-test";
import { afterEach, describe, expect, test, vi } from "vitest";
import { internal } from "../_generated/api";
import schema from "../schema";

process.env.FORMANCE_CLIENT_ID = "test-client";
process.env.FORMANCE_CLIENT_SECRET = "test-secret";
process.env.FORMANCE_SERVER_URL = "https://formance.test";
process.env.OWNERSHIP_LEDGER_SOURCE = "ledger";

// @ts-ignore
const modules = import.meta.glob("../**/*.{ts,js,tsx,jsx}", { eager: false });
const createTest = () => convexTest(schema, modules);

function mockFetchSequence(
	...responses: Array<{
		ok: boolean;
		status?: number;
		statusText?: string;
		json?: () => Promise<unknown>;
		text?: () => Promise<string>;
	}>
) {
	const fetchMock = vi.fn();
	for (const response of responses) {
		fetchMock.mockResolvedValueOnce({
			ok: response.ok,
			status: response.status ?? 200,
			statusText: response.statusText ?? "OK",
			json: response.json ?? (async () => ({})),
			text: response.text ?? (async () => ""),
		});
	}
	vi.stubGlobal("fetch", fetchMock);
	return fetchMock;
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("formance ownership integration", () => {
	test("recordOwnershipTransfer treats duplicate reference as success", async () => {
		const fetchMock = mockFetchSequence(
			{
				ok: true,
				json: async () => ({ access_token: "token" }),
			},
			{
				ok: false,
				status: 409,
				statusText: "Conflict",
				text: async () => "duplicate reference",
			}
		);

		const t = createTest();
		const result = await t.run(async (ctx: any) =>
			ctx.runAction(internal.ledger.recordOwnershipTransfer, {
				mortgageId: "mortgage-test",
				fromOwnerId: "fairlend",
				toOwnerId: "user-1",
				percentage: 25,
				reference: "transfer:deal-1:mortgage-test:123",
			})
		);

		expect(result.success).toBe(true);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	test("recordOwnershipTransfer supports retry after failure", async () => {
		mockFetchSequence(
			{
				ok: true,
				json: async () => ({ access_token: "token" }),
			},
			{
				ok: false,
				status: 500,
				statusText: "Internal Server Error",
				text: async () => "boom",
			}
		);

		const t = createTest();
		const first = await t.run(async (ctx: any) =>
			ctx.runAction(internal.ledger.recordOwnershipTransfer, {
				mortgageId: "mortgage-test",
				fromOwnerId: "fairlend",
				toOwnerId: "user-1",
				percentage: 10,
				reference: "transfer:deal-2:mortgage-test:456",
			})
		);

		expect(first.success).toBe(false);

		mockFetchSequence(
			{
				ok: true,
				json: async () => ({ access_token: "token" }),
			},
			{
				ok: true,
				json: async () => ({ data: { id: "tx-123" } }),
				text: async () => JSON.stringify({ data: { id: "tx-123" } }),
			}
		);

		const second = await t.run(async (ctx: any) =>
			ctx.runAction(internal.ledger.recordOwnershipTransfer, {
				mortgageId: "mortgage-test",
				fromOwnerId: "fairlend",
				toOwnerId: "user-1",
				percentage: 10,
				reference: "transfer:deal-2:mortgage-test:456",
			})
		);

		expect(second.success).toBe(true);
		expect(second.transactionId).toBe("tx-123");
	});

	test("initializeMortgageOwnership includes reference in request body", async () => {
		const fetchMock = mockFetchSequence(
			{
				ok: true,
				json: async () => ({ access_token: "token" }),
			},
			{
				ok: true,
				text: async () => JSON.stringify({ data: { id: "tx-init" } }),
			}
		);

		const t = createTest();
		const result = await t.run(async (ctx: any) =>
			ctx.runAction(internal.ledger.initializeMortgageOwnership, {
				mortgageId: "mortgage-test",
				reference: "init:mortgage-test:789",
			})
		);

		expect(result.success).toBe(true);
		expect(result.transactionId).toBe("tx-init");

		const body = fetchMock.mock.calls[1]?.[1]?.body as string;
		const parsed = JSON.parse(body);
		expect(parsed.reference).toBe("init:mortgage-test:789");
	});
});
