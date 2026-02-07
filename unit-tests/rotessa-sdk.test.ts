import { describe, expect, test, vi } from "vitest";
import {
	createRotessaClient,
	RotessaApiError,
	RotessaConfigError,
	RotessaRequestError,
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
				errors: [{ error_code: "invalid_request", error_message: "Bad input" }],
			})
		);

		const client = createRotessaClient({
			apiKey: "test_key",
			baseUrl: "https://api.rotessa.com/v1",
			fetchFn,
		});

		const requestPromise = client.customers.list();

		await expect(requestPromise).rejects.toBeInstanceOf(RotessaApiError);
		await expect(requestPromise).rejects.toMatchObject({
			status: 422,
			errors: [{ error_code: "invalid_request" }],
		});
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

	test("enforces timeout even when an external signal is provided", async () => {
		vi.useFakeTimers();
		try {
			const fetchFn = vi.fn(
				(_url: URL | RequestInfo, init?: RequestInit): Promise<Response> =>
					new Promise<Response>((_, reject) => {
						const signal = init?.signal;
						if (!signal) return;
						if (signal.aborted) {
							const error = new Error("Aborted");
							error.name = "AbortError";
							reject(error);
							return;
						}
						signal.addEventListener(
							"abort",
							() => {
								const error = new Error("Aborted");
								error.name = "AbortError";
								reject(error);
							},
							{ once: true }
						);
					})
			);

			const client = createRotessaClient({
				apiKey: "test_key",
				baseUrl: "https://api.rotessa.com/v1",
				fetchFn,
				timeoutMs: 10,
			});
			const controller = new AbortController();

			const requestPromise = client.request("GET", "/customers", {
				signal: controller.signal,
				timeoutMs: 10,
			});

			vi.advanceTimersByTime(10);

			await expect(requestPromise).rejects.toBeInstanceOf(RotessaRequestError);
			await expect(requestPromise).rejects.toMatchObject({
				message: "Rotessa request timed out.",
			});
		} finally {
			vi.useRealTimers();
		}
	});
});
