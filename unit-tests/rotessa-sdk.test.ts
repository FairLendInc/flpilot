import { describe, expect, test, vi } from "vitest";
import {
	RotessaApiError,
	RotessaConfigError,
	createRotessaClient,
} from "../lib/rotessa";

type MockResponse = {
	ok: boolean;
	status: number;
	text: () => Promise<string>;
};

function createMockResponse(status: number, body: unknown): MockResponse {
	return {
		ok: status >= 200 && status < 300,
		status,
		text: async () => JSON.stringify(body),
	};
}

describe("Rotessa SDK", () => {
	test("throws config error when API key is missing", () => {
		const fetchFn = vi.fn();
		expect(() =>
			createRotessaClient({
				apiKey: "",
				baseUrl: "https://api.rotessa.com/v1",
				fetchFn,
			})
		).toThrow(RotessaConfigError);
	});

	test("builds correct request for customer get", async () => {
		const fetchFn = vi.fn().mockResolvedValue(
			createMockResponse(200, {
				id: 123,
				active: true,
				bank_name: null,
				created_at: "2020-01-01T00:00:00Z",
				custom_identifier: null,
				customer_type: "Personal",
				email: "test@example.com",
				home_phone: null,
				identifier: null,
				name: "Test Customer",
				phone: null,
				updated_at: "2020-01-02T00:00:00Z",
				account_number: null,
				address: null,
				authorization_type: "Online",
				bank_account_type: null,
				institution_number: null,
				routing_number: null,
				transit_number: null,
				transaction_schedules: [],
				financial_transactions: [],
			})
		);

		const client = createRotessaClient({
			apiKey: "test_key",
			baseUrl: "https://api.rotessa.com/v1",
			fetchFn,
		});

		await client.customers.get(123);

		expect(fetchFn).toHaveBeenCalledTimes(1);
		const [url, init] = fetchFn.mock.calls[0];
		expect(url).toBe("https://api.rotessa.com/v1/customers/123");
		expect(init?.method).toBe("GET");
		expect(init?.headers?.Authorization).toBe('Token token="test_key"');
	});

	test("normalizes Rotessa error payloads", async () => {
		const fetchFn = vi.fn().mockResolvedValue(
			createMockResponse(422, {
				errors: [
					{ error_code: "invalid_request", error_message: "Bad input" },
				],
			})
		);

		const client = createRotessaClient({
			apiKey: "test_key",
			baseUrl: "https://api.rotessa.com/v1",
			fetchFn,
		});

		try {
			await client.customers.list();
		} catch (error) {
			expect(error).toBeInstanceOf(RotessaApiError);
			if (error instanceof RotessaApiError) {
				expect(error.status).toBe(422);
				expect(error.errors?.[0]?.error_code).toBe("invalid_request");
			}
		}
	});

	test("supports filter parameter for transaction report", async () => {
		const fetchFn = vi.fn().mockResolvedValue(createMockResponse(200, []));

		const client = createRotessaClient({
			apiKey: "test_key",
			baseUrl: "https://api.rotessa.com/v1",
			fetchFn,
		});

		await client.transactionReport.list({
			start_date: "2024-01-01",
			filter: "Approved",
		});

		const [url] = fetchFn.mock.calls[0];
		expect(url).toContain("filter=Approved");
	});
});
