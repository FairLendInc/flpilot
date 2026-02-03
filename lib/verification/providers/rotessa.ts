/**
 * Rotessa Payment Provider
 *
 * Implements the payment provider interface using the existing Rotessa client.
 * Handles customer creation, linking, and validation for pre-authorized debit.
 */

import {
	createRotessaClient,
	RotessaApiError,
	type RotessaClient,
} from "@/lib/rotessa/client";
import {
	ROTESSA_BASE_URLS,
	type RotessaAuthorizationType,
	type RotessaCustomerCreate,
} from "@/lib/rotessa/types";
import type {
	PaymentCustomerInput,
	PaymentCustomerStatus,
	PaymentProviderConfig,
	PaymentProviderResult,
	VerificationProvider,
} from "../types";

// Validation regex (top-level for performance)
const INSTITUTION_NUMBER_REGEX = /^\d{3}$/;
const TRANSIT_NUMBER_REGEX = /^\d{5}$/;
const ACCOUNT_NUMBER_REGEX = /^\d{5,12}$/;

/**
 * Convert Rotessa authorization type to our internal format
 */
function normalizeAuthType(
	authType: RotessaAuthorizationType | null
): "online" | "offline" | "pad" | undefined {
	if (!authType) return;
	switch (authType) {
		case "Online":
			return "online";
		case "In Person":
			return "offline";
		default:
			return;
	}
}

/**
 * Convert null to undefined for optional string fields
 */
function nullToUndefined<T>(value: T | null): T | undefined {
	return value === null ? undefined : value;
}

/**
 * Rotessa payment provider implementation
 */
class RotessaProvider
	implements
		VerificationProvider<
			PaymentProviderConfig,
			PaymentCustomerInput,
			PaymentProviderResult
		>
{
	readonly id = "rotessa";
	readonly name = "Rotessa Pre-Authorized Debit";
	readonly enabled = true;
	readonly type = "payment" as const;
	private client: RotessaClient | null = null;
	private config!: PaymentProviderConfig;

	async initialize(config: PaymentProviderConfig): Promise<void> {
		this.config = config;

		// Determine base URL based on environment
		const baseUrl =
			config.baseUrl ??
			(config.environment === "sandbox"
				? ROTESSA_BASE_URLS.sandbox
				: ROTESSA_BASE_URLS.production);

		// Create Rotessa client
		this.client = createRotessaClient({
			apiKey: config.apiKey,
			baseUrl,
		});
	}

	/**
	 * Verify (create or link) a Rotessa customer
	 */
	async verify(input: PaymentCustomerInput): Promise<PaymentProviderResult> {
		if (!this.client) {
			throw new Error(
				"Rotessa provider not initialized. Call initialize() first."
			);
		}

		try {
			// Check if customer already exists by custom identifier
			if (input.customIdentifier) {
				try {
					const existing = await this.client.customers.getByCustomIdentifier(
						input.customIdentifier
					);

					return {
						customerId: existing.id,
						customIdentifier: nullToUndefined(existing.custom_identifier),
						status: "linked",
						linkedAt: new Date().toISOString(),
						bankInfoConfirmed: !!existing.bank_account_type,
						authorizationType: normalizeAuthType(existing.authorization_type),
						rawResponse: existing,
					};
				} catch (error) {
					// Customer doesn't exist, will create new one
					if (!(error instanceof RotessaApiError && error.status === 404)) {
						throw error;
					}
				}
			}

			// Create new customer
			const customerPayload = this.buildCustomerPayload(input);
			const customer = await this.client.customers.create(customerPayload);

			return {
				customerId: customer.id,
				customIdentifier: nullToUndefined(customer.custom_identifier),
				status: "created",
				linkedAt: new Date().toISOString(),
				bankInfoConfirmed: !!customer.bank_account_type,
				authorizationType: normalizeAuthType(customer.authorization_type),
				rawResponse: customer,
			};
		} catch (error) {
			return this.handleError(error);
		}
	}

	/**
	 * Check if result indicates successful verification
	 */
	isPassed(result: PaymentProviderResult): boolean {
		return ["linked", "created", "active"].includes(result.status);
	}

	/**
	 * Get human-readable status message
	 */
	getStatusMessage(result: PaymentProviderResult): string {
		switch (result.status) {
			case "created":
				return `Rotessa customer created (ID: ${result.customerId})`;
			case "linked":
				return `Linked to existing Rotessa customer (ID: ${result.customerId})`;
			case "active":
				return "Rotessa account active";
			case "pending":
				return "Rotessa setup pending";
			case "failed":
				return `Rotessa setup failed: ${result.errorMessage ?? "Unknown error"}`;
			default:
				return "Rotessa setup not started";
		}
	}

	/**
	 * Additional method: Get customer by ID
	 */
	async getCustomer(customerId: number): Promise<PaymentProviderResult> {
		if (!this.client) {
			throw new Error("Rotessa provider not initialized");
		}

		try {
			const customer = await this.client.customers.get(customerId);
			return {
				customerId: customer.id,
				customIdentifier: nullToUndefined(customer.custom_identifier),
				status: "active",
				linkedAt: undefined,
				bankInfoConfirmed: !!customer.bank_account_type,
				authorizationType: normalizeAuthType(customer.authorization_type),
				rawResponse: customer,
			};
		} catch (error) {
			return this.handleError(error);
		}
	}

	/**
	 * Additional method: Validate customer bank info
	 */
	async validateBankInfo(input: {
		institutionNumber: string;
		transitNumber: string;
		accountNumber: string;
	}): Promise<{ valid: boolean; errors: string[] }> {
		const errors: string[] = [];

		// Canadian institution number: 3 digits
		if (!INSTITUTION_NUMBER_REGEX.test(input.institutionNumber)) {
			errors.push("Institution number must be 3 digits");
		}

		// Canadian transit number: 5 digits
		if (!TRANSIT_NUMBER_REGEX.test(input.transitNumber)) {
			errors.push("Transit number must be 5 digits");
		}

		// Account number: 5-12 digits
		if (!ACCOUNT_NUMBER_REGEX.test(input.accountNumber)) {
			errors.push("Account number must be 5-12 digits");
		}

		return {
			valid: errors.length === 0,
			errors,
		};
	}

	/**
	 * Build Rotessa customer creation payload
	 */
	private buildCustomerPayload(
		input: PaymentCustomerInput
	): RotessaCustomerCreate {
		// Build base payload with required bank info for Canada
		// Rotessa requires either Canadian bank info or US bank info
		const bankInfo = input.bankInfo;

		if (!bankInfo) {
			throw new Error(
				"Bank information is required for Rotessa customer creation"
			);
		}

		const payload: RotessaCustomerCreate = {
			name: input.name,
			email: input.email,
			phone: input.phone ?? null,
			custom_identifier: input.customIdentifier ?? null,
			authorization_type: "Online" as RotessaAuthorizationType,
			// Canadian bank info
			institution_number: bankInfo.institutionNumber,
			transit_number: bankInfo.transitNumber,
			account_number: bankInfo.accountNumber,
			bank_account_type:
				bankInfo.accountType === "checking" ? "Checking" : "Savings",
		};

		if (input.address) {
			payload.address = {
				address_1: input.address.street,
				city: input.address.city,
				province_code: input.address.province,
				postal_code: input.address.postalCode,
			};
		}

		return payload;
	}

	/**
	 * Handle Rotessa errors and convert to result
	 */
	private handleError(error: unknown): PaymentProviderResult {
		if (error instanceof RotessaApiError) {
			return {
				customerId: 0,
				status: "failed" as PaymentCustomerStatus,
				errorCode: `rotessa_${error.status}`,
				errorMessage: error.errors?.[0]?.error_message ?? error.message,
				rawResponse: {
					status: error.status,
					errors: error.errors,
					responseText: error.responseText,
				},
			};
		}

		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";

		return {
			customerId: 0,
			status: "failed" as PaymentCustomerStatus,
			errorCode: "rotessa_unknown",
			errorMessage,
			rawResponse: { error: errorMessage },
		};
	}
}

/**
 * Factory function to create Rotessa provider
 */
export function createRotessaProvider(): RotessaProvider {
	return new RotessaProvider();
}
