import { describe, expect, test, vi } from "vitest";
import { createRotessaClient } from "../lib/rotessa";

const BASE_URL = "https://api.rotessa.com/v1";

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

function expectNullableString(value: unknown) {
	expect(value === null || typeof value === "string").toBe(true);
}

function expectNullableNumber(value: unknown) {
	expect(value === null || typeof value === "number").toBe(true);
}

function expectCustomerListItemShape(value: any) {
	expect(typeof value).toBe("object");
	expect(typeof value.id).toBe("number");
	expect(typeof value.name).toBe("string");
	expect(typeof value.email).toBe("string");
	expect(typeof value.active).toBe("boolean");
	expect(typeof value.created_at).toBe("string");
	expect(typeof value.updated_at).toBe("string");
	expectNullableString(value.custom_identifier);
	expectNullableString(value.customer_type);
	expectNullableString(value.phone);
	expectNullableString(value.home_phone);
	expectNullableString(value.bank_name);
	expectNullableString(value.identifier);
}

function expectFinancialTransactionShape(value: any) {
	expect(typeof value).toBe("object");
	expect(typeof value.id).toBe("number");
	expect(typeof value.amount).toBe("string");
	expect(typeof value.process_date).toBe("string");
	expect(typeof value.status).toBe("string");
	expectNullableString(value.status_reason);
	expect(typeof value.transaction_schedule_id).toBe("number");
}

function expectTransactionScheduleShape(value: any) {
	expect(typeof value).toBe("object");
	expect(typeof value.id).toBe("number");
	expect(typeof value.amount).toBe("string");
	expect(typeof value.frequency).toBe("string");
	expect(typeof value.process_date).toBe("string");
	expect(typeof value.created_at).toBe("string");
	expect(typeof value.updated_at).toBe("string");
	expectNullableString(value.comment);
	expectNullableNumber(value.installments);

	if (value.next_process_date !== undefined) {
		expectNullableString(value.next_process_date);
	}

	if (Array.isArray(value.financial_transactions)) {
		for (const tx of value.financial_transactions) {
			expectFinancialTransactionShape(tx);
		}
	}
}

function expectCustomerDetailShape(value: any) {
	expectCustomerListItemShape(value);
	expectNullableString(value.account_number);
	expectNullableString(value.institution_number);
	expectNullableString(value.transit_number);
	expectNullableString(value.routing_number);
	expectNullableString(value.authorization_type);
	expectNullableString(value.bank_account_type);

	if (value.address !== null) {
		expect(typeof value.address).toBe("object");
	}

	expect(Array.isArray(value.transaction_schedules)).toBe(true);
	expect(Array.isArray(value.financial_transactions)).toBe(true);

	for (const schedule of value.transaction_schedules) {
		expectTransactionScheduleShape(schedule);
	}
	for (const tx of value.financial_transactions) {
		expectFinancialTransactionShape(tx);
	}
}

function expectTransactionReportItemShape(value: any) {
	expect(typeof value).toBe("object");
	expect(typeof value.id).toBe("number");
	expect(typeof value.customer_id).toBe("number");
	expect(typeof value.transaction_schedule_id).toBe("number");
	expect(typeof value.amount).toBe("string");
	expect(typeof value.status).toBe("string");
	expectNullableString(value.status_reason);
	expect(typeof value.process_date).toBe("string");
	expectNullableString(value.settlement_date);
	expectNullableString(value.earliest_approval_date);
	expectNullableString(value.custom_identifier);
	expectNullableString(value.comment);
}

const customerDetailPayload = {
	id: 123,
	active: true,
	bank_name: "Test Bank",
	created_at: "2024-01-01T00:00:00Z",
	custom_identifier: "cust_abc",
	customer_type: "Personal",
	email: "test@example.com",
	home_phone: "555-0000",
	identifier: "ABC123",
	name: "Test Customer",
	phone: "555-1111",
	updated_at: "2024-01-02T00:00:00Z",
	account_number: "123456",
	address: {
		address_1: "123 Test St",
		address_2: "Unit 9",
		city: "Toronto",
		province_code: "ON",
		postal_code: "M1M1M1",
	},
	authorization_type: "Online",
	bank_account_type: "Checking",
	institution_number: "001",
	routing_number: "111000025",
	transit_number: "00011",
	transaction_schedules: [
		{
			id: 555,
			amount: "123.45",
			comment: "Monthly payment",
			created_at: "2024-01-01T00:00:00Z",
			updated_at: "2024-01-02T00:00:00Z",
			frequency: "Monthly",
			installments: 12,
			process_date: "2024-02-01",
			financial_transactions: [
				{
					id: 9001,
					amount: "123.45",
					process_date: "2024-02-01",
					status: "Pending",
					status_reason: null,
					transaction_schedule_id: 555,
				},
			],
		},
	],
	financial_transactions: [
		{
			id: 9002,
			amount: "123.45",
			process_date: "2024-02-01",
			status: "Approved",
			status_reason: null,
			transaction_schedule_id: 555,
		},
	],
};

const customerListPayload = [
	{
		id: 321,
		active: true,
		bank_name: "Test Bank",
		created_at: "2024-01-01T00:00:00Z",
		custom_identifier: "cust_list_1",
		customer_type: "Business",
		email: "list@example.com",
		home_phone: null,
		identifier: "LIST123",
		name: "List Customer",
		phone: "555-3333",
		updated_at: "2024-01-02T00:00:00Z",
	},
];

const schedulePayload = {
	id: 777,
	amount: "50.00",
	comment: "Weekly",
	created_at: "2024-01-01T00:00:00Z",
	updated_at: "2024-01-02T00:00:00Z",
	frequency: "Weekly",
	installments: null,
	process_date: "2024-02-01",
	next_process_date: "2024-02-08",
	financial_transactions: [
		{
			id: 8001,
			amount: "50.00",
			process_date: "2024-02-01",
			status: "Future",
			status_reason: null,
			transaction_schedule_id: 777,
		},
	],
};

const reportPayload = [
	{
		id: 9991,
		customer_id: 123,
		custom_identifier: "cust_abc",
		transaction_schedule_id: 555,
		transaction_number: "T-100",
		amount: "123.45",
		comment: "Monthly",
		status: "Approved",
		status_reason: null,
		process_date: "2024-02-01",
		settlement_date: "2024-02-02",
		earliest_approval_date: "2024-02-01",
		created_at: "2024-01-31",
		updated_at: "2024-02-01",
		account_number: "123456",
		institution_number: "001",
		transit_number: "00011",
		bank_name: "Test Bank",
	},
];

describe("Rotessa SDK get methods (integration shape checks)", () => {
	test("customers.list returns expected shape", async () => {
		const fetchFn = vi
			.fn()
			.mockResolvedValue(createMockResponse(200, customerListPayload));

		const client = createRotessaClient({
			apiKey: "test_key",
			baseUrl: BASE_URL,
			fetchFn,
		});

		const result = await client.customers.list();
		expect(Array.isArray(result)).toBe(true);
		for (const item of result) {
			expectCustomerListItemShape(item);
		}

		const [url, init] = fetchFn.mock.calls[0];
		expect(url).toBe(`${BASE_URL}/customers`);
		expect(init?.method).toBe("GET");
	});

	test("customers.get returns expected shape", async () => {
		const fetchFn = vi
			.fn()
			.mockResolvedValue(createMockResponse(200, customerDetailPayload));

		const client = createRotessaClient({
			apiKey: "test_key",
			baseUrl: BASE_URL,
			fetchFn,
		});

		const result = await client.customers.get(123);
		expectCustomerDetailShape(result);

		const [url, init] = fetchFn.mock.calls[0];
		expect(url).toBe(`${BASE_URL}/customers/123`);
		expect(init?.method).toBe("GET");
	});

	test("customers.getByCustomIdentifier returns expected shape", async () => {
		const fetchFn = vi
			.fn()
			.mockResolvedValue(createMockResponse(200, customerDetailPayload));

		const client = createRotessaClient({
			apiKey: "test_key",
			baseUrl: BASE_URL,
			fetchFn,
		});

		const result = await client.customers.getByCustomIdentifier("cust_abc");
		expectCustomerDetailShape(result);

		const [url, init] = fetchFn.mock.calls[0];
		expect(url).toBe(`${BASE_URL}/customers/show_with_custom_identifier`);
		expect(init?.method).toBe("POST");
		const parsedBody = JSON.parse(init?.body ?? "{}");
		expect(parsedBody.custom_identifier).toBe("cust_abc");
	});

	test("transactionSchedules.get returns expected shape", async () => {
		const fetchFn = vi
			.fn()
			.mockResolvedValue(createMockResponse(200, schedulePayload));

		const client = createRotessaClient({
			apiKey: "test_key",
			baseUrl: BASE_URL,
			fetchFn,
		});

		const result = await client.transactionSchedules.get(777);
		expectTransactionScheduleShape(result);

		const [url, init] = fetchFn.mock.calls[0];
		expect(url).toBe(`${BASE_URL}/transaction_schedules/777`);
		expect(init?.method).toBe("GET");
	});

	test("transactionReport.list returns expected shape", async () => {
		const fetchFn = vi
			.fn()
			.mockResolvedValue(createMockResponse(200, reportPayload));

		const client = createRotessaClient({
			apiKey: "test_key",
			baseUrl: BASE_URL,
			fetchFn,
		});

		const result = await client.transactionReport.list({
			start_date: "2024-02-01",
			status: "Approved",
			page: 2,
		});
		expect(Array.isArray(result)).toBe(true);
		for (const item of result) {
			expectTransactionReportItemShape(item);
		}

		const [url, init] = fetchFn.mock.calls[0];
		expect(url).toContain("/transaction_report?");
		expect(url).toContain("start_date=2024-02-01");
		expect(url).toContain("status=Approved");
		expect(url).toContain("page=2");
		expect(init?.method).toBe("GET");
	});
});
