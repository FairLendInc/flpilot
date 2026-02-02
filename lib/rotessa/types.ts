export type RotessaHttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export const ROTESSA_BASE_URLS = {
	production: "https://api.rotessa.com/v1",
	sandbox: "https://sandbox-api.rotessa.com/v1",
} as const;

export type RotessaBaseUrlKey = keyof typeof ROTESSA_BASE_URLS;

export const ROTESSA_CUSTOMER_TYPES = ["Personal", "Business"] as const;
export type RotessaCustomerType = (typeof ROTESSA_CUSTOMER_TYPES)[number];

export const ROTESSA_BANK_ACCOUNT_TYPES = ["Savings", "Checking"] as const;
export type RotessaBankAccountType =
	(typeof ROTESSA_BANK_ACCOUNT_TYPES)[number];

export const ROTESSA_AUTHORIZATION_TYPES = ["In Person", "Online"] as const;
export type RotessaAuthorizationType =
	(typeof ROTESSA_AUTHORIZATION_TYPES)[number];

export const ROTESSA_SCHEDULE_FREQUENCIES = [
	"Once",
	"Weekly",
	"Every Other Week",
	"Monthly",
	"Every Other Month",
	"Quarterly",
	"Semi-Annually",
	"Yearly",
] as const;
export type RotessaScheduleFrequency =
	(typeof ROTESSA_SCHEDULE_FREQUENCIES)[number];

export const ROTESSA_TRANSACTION_STATUSES = [
	"Future",
	"Pending",
	"Approved",
	"Declined",
	"Chargeback",
] as const;
export type RotessaTransactionStatus =
	(typeof ROTESSA_TRANSACTION_STATUSES)[number];

export const ROTESSA_STATUS_REASONS = [
	"NSF",
	"Payment Stopped/Recalled",
	"Edit Reject",
	"Funds Not Cleared",
	"Account Closed",
	"Invalid/Incorrect Account No.",
	"Account Not Found",
	"Account Frozen",
	"Agreement Revoked",
	"No Debit Allowed",
] as const;
export type RotessaStatusReason = (typeof ROTESSA_STATUS_REASONS)[number];

export const ROTESSA_REPORT_STATUS_FILTERS = [
	"All",
	"Pending",
	"Approved",
	"Declined",
	"Chargeback",
] as const;
export type RotessaReportStatusFilter =
	(typeof ROTESSA_REPORT_STATUS_FILTERS)[number];

export type RotessaAddress = {
	id?: number;
	address_1?: string | null;
	address_2?: string | null;
	city?: string | null;
	province_code?: string | null;
	postal_code?: string | null;
};

export type RotessaAddressInput = Omit<RotessaAddress, "id">;

export type RotessaCustomerListItem = {
	active: boolean;
	bank_name: string | null;
	created_at: string;
	custom_identifier: string | null;
	customer_type: RotessaCustomerType | null;
	email: string;
	home_phone: string | null;
	id: number;
	identifier: string | null;
	name: string;
	phone: string | null;
	updated_at: string;
};

export type RotessaFinancialTransaction = {
	id: number;
	amount: string;
	process_date: string;
	status: RotessaTransactionStatus;
	status_reason: RotessaStatusReason | null;
	transaction_schedule_id: number;
	bank_name?: string | null;
	institution_number?: string | number | null;
	transit_number?: string | number | null;
	account_number?: string | number | null;
};

export type RotessaTransactionSchedule = {
	id: number;
	amount: string;
	comment: string | null;
	created_at: string;
	updated_at: string;
	frequency: RotessaScheduleFrequency;
	installments: number | null;
	process_date: string;
	next_process_date?: string | null;
	financial_transactions?: RotessaFinancialTransaction[];
};

export type RotessaCustomerDetail = RotessaCustomerListItem & {
	account_number: string | null;
	address: RotessaAddress | null;
	authorization_type: RotessaAuthorizationType | null;
	bank_account_type: RotessaBankAccountType | null;
	institution_number: string | null;
	routing_number: string | null;
	transit_number: string | null;
	transaction_schedules: RotessaTransactionSchedule[];
	financial_transactions: RotessaFinancialTransaction[];
};

export type RotessaCustomerCreateBase = {
	name: string;
	email: string;
	custom_identifier?: string | null;
	customer_type?: RotessaCustomerType;
	home_phone?: string | null;
	phone?: string | null;
	bank_name?: string | null;
	authorization_type: RotessaAuthorizationType;
	address?: RotessaAddressInput;
};

type RotessaCustomerCanadaBank = {
	institution_number: string;
	transit_number: string;
	account_number: string;
	routing_number?: string;
	bank_account_type?: RotessaBankAccountType;
};

type RotessaCustomerUsBank = {
	bank_account_type: RotessaBankAccountType;
	routing_number: string;
	account_number: string;
	institution_number?: string;
	transit_number?: string;
};

export type RotessaCustomerCreate = RotessaCustomerCreateBase &
	(RotessaCustomerCanadaBank | RotessaCustomerUsBank);

export type RotessaCustomerUpdate = Partial<
	RotessaCustomerCreateBase & RotessaCustomerCanadaBank & RotessaCustomerUsBank
>;

export type RotessaCustomerUpdateViaPost = RotessaCustomerUpdate & {
	id: number;
};

export type RotessaTransactionScheduleCreateBase = {
	amount: number | string;
	frequency: RotessaScheduleFrequency;
	process_date: string;
	installments?: number | null;
	comment?: string | null;
};

export type RotessaTransactionScheduleCreateWithCustomerId =
	RotessaTransactionScheduleCreateBase & {
		customer_id: number;
	};

export type RotessaTransactionScheduleCreateWithCustomIdentifier =
	RotessaTransactionScheduleCreateBase & {
		custom_identifier: string;
	};

export type RotessaTransactionScheduleCreate =
	| RotessaTransactionScheduleCreateWithCustomerId
	| RotessaTransactionScheduleCreateWithCustomIdentifier;

export type RotessaTransactionScheduleUpdate = {
	amount?: number | string;
	comment?: string | null;
};

export type RotessaTransactionScheduleUpdateViaPost =
	RotessaTransactionScheduleUpdate & {
		id: number;
	};

export type RotessaTransactionReportItem = {
	id: number;
	customer_id: number;
	custom_identifier: string | null;
	transaction_schedule_id: number;
	transaction_number: string | number | null;
	amount: string;
	comment: string | null;
	status: RotessaTransactionStatus;
	status_reason: RotessaStatusReason | null;
	process_date: string;
	settlement_date: string | null;
	earliest_approval_date: string | null;
	created_at: string | null;
	updated_at: string | null;
	account_number: string | number | null;
	institution_number: string | number | null;
	transit_number: string | number | null;
	bank_name?: string | null;
};

export type RotessaTransactionReportQuery = {
	start_date: string;
	end_date?: string;
	status?: RotessaReportStatusFilter;
	filter?: RotessaReportStatusFilter;
	page?: number;
};

export type RotessaApiErrorDetail = {
	error_code: string;
	error_message: string;
};

export type RotessaApiErrorPayload = {
	errors: RotessaApiErrorDetail[];
};

export type RotessaParamType =
	| "string"
	| "number"
	| "boolean"
	| "object"
	| "array";

export type RotessaParamSpec = {
	type: RotessaParamType;
	required: boolean;
	description?: string;
	options?: readonly string[];
	fields?: Record<string, RotessaParamSpec>;
};

export type RotessaEndpointParams = {
	path?: Record<string, RotessaParamSpec>;
	query?: Record<string, RotessaParamSpec>;
	body?: Record<string, RotessaParamSpec>;
};

export type RotessaEndpointSpec = {
	method: RotessaHttpMethod;
	path: string;
	params?: RotessaEndpointParams;
	notes?: string[];
};

export type RotessaManifest = {
	customers: {
		list: RotessaEndpointSpec;
		get: RotessaEndpointSpec;
		getByCustomIdentifier: RotessaEndpointSpec;
		create: RotessaEndpointSpec;
		update: RotessaEndpointSpec;
		updateViaPost: RotessaEndpointSpec;
	};
	transactionSchedules: {
		get: RotessaEndpointSpec;
		create: RotessaEndpointSpec;
		createWithCustomIdentifier: RotessaEndpointSpec;
		update: RotessaEndpointSpec;
		updateViaPost: RotessaEndpointSpec;
		delete: RotessaEndpointSpec;
	};
	transactionReport: {
		list: RotessaEndpointSpec;
	};
};
