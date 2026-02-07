/**
 * Verification Provider Types
 *
 * Defines interfaces for pluggable verification providers:
 * - Identity verification (Plaid ID, Persona, etc.)
 * - KYC/AML checks (various providers)
 * - Payment processing (Rotessa)
 *
 * The provider pattern allows:
 * - Stub implementations for development
 * - Real providers for production
 * - Easy swapping between providers
 */

// ============================================================================
// Base Provider Interface
// ============================================================================

/**
 * Generic verification provider interface
 */
export type VerificationProvider<TConfig, TInput, TResult> = {
	/** Provider unique identifier */
	readonly id: string;

	/** Human-readable provider name */
	readonly name: string;

	/** Whether provider is currently enabled */
	readonly enabled: boolean;

	/** Provider type category */
	readonly type: ProviderType;

	/**
	 * Initialize provider with configuration
	 */
	initialize(config: TConfig): Promise<void>;

	/**
	 * Execute verification
	 */
	verify(input: TInput): Promise<TResult>;

	/**
	 * Check if result indicates verification passed
	 */
	isPassed(result: TResult): boolean;

	/**
	 * Get human-readable status message
	 */
	getStatusMessage(result: TResult): string;
};

export type ProviderType = "identity" | "kyc_aml" | "payment";

// ============================================================================
// Identity Verification
// ============================================================================

/**
 * Configuration for identity verification providers
 */
export type IdentityVerificationConfig = {
	/** API key or credentials */
	apiKey?: string;

	/** Sandbox/production mode */
	environment: "sandbox" | "production";

	/** Additional provider-specific config */
	options?: Record<string, unknown>;
};

/**
 * Input for identity verification
 */
export type IdentityVerificationInput = {
	/** Person's full name */
	firstName: string;
	lastName: string;

	/** Date of birth (YYYY-MM-DD) */
	dateOfBirth?: string;

	/** Address for verification */
	address?: {
		street: string;
		city: string;
		province: string;
		postalCode: string;
		country: string;
	};

	/** Government ID details (if collected) */
	governmentId?: {
		type: "passport" | "drivers_license" | "national_id";
		number?: string;
		expirationDate?: string;
	};

	/** Session/inquiry ID from provider's frontend SDK */
	inquiryId?: string;
};

/**
 * Result from identity verification
 */
export type IdentityVerificationResult = {
	/** Provider's unique ID for this verification */
	verificationId: string;

	/** Current status */
	status: IdentityVerificationStatus;

	/** Provider-specific reference */
	providerReference?: string;

	/** Timestamp of verification */
	verifiedAt?: string;

	/** Matched data from verification */
	matchedData?: {
		nameMatch: boolean;
		dobMatch?: boolean;
		addressMatch?: boolean;
	};

	/** Risk signals */
	riskSignals?: {
		fraudScore?: number;
		flags?: string[];
	};

	/** Reason for failure (if applicable) */
	failureReason?: string;

	/** Raw provider response (for debugging) */
	rawResponse?: unknown;
};

export type IdentityVerificationStatus =
	| "not_started"
	| "pending"
	| "verified"
	| "failed"
	| "mismatch"
	| "skipped";

// ============================================================================
// KYC/AML Verification
// ============================================================================

/**
 * Configuration for KYC/AML providers
 */
export type KycAmlConfig = {
	/** API credentials */
	apiKey?: string;

	/** Environment setting */
	environment: "sandbox" | "production";

	/** Check types to perform */
	checkTypes?: KycCheckType[];

	/** Additional options */
	options?: Record<string, unknown>;
};

export type KycCheckType =
	| "identity"
	| "watchlist"
	| "pep"
	| "sanctions"
	| "adverse_media";

/**
 * Input for KYC/AML check
 */
export type KycAmlInput = {
	/** Person details */
	firstName: string;
	lastName: string;
	dateOfBirth?: string;

	/** Nationality */
	nationality?: string;

	/** Current address */
	address?: {
		street: string;
		city: string;
		province: string;
		postalCode: string;
		country: string;
	};

	/** External reference */
	externalReference?: string;
};

/**
 * Result from KYC/AML check
 */
export type KycAmlResult = {
	/** Provider's check ID */
	checkId: string;

	/** Overall status */
	status: KycAmlStatus;

	/** Provider reference */
	providerReference?: string;

	/** Timestamp */
	checkedAt?: string;

	/** Individual check results */
	checks?: {
		type: KycCheckType;
		passed: boolean;
		details?: string;
	}[];

	/** Risk assessment */
	riskLevel?: "low" | "medium" | "high";

	/** Flags or alerts */
	alerts?: string[];

	/** Failure reason */
	failureReason?: string;

	/** Review notes (if manual review required) */
	reviewNotes?: string;

	/** Raw response */
	rawResponse?: unknown;
};

export type KycAmlStatus =
	| "not_started"
	| "pending"
	| "passed"
	| "failed"
	| "requires_review"
	| "skipped";

// ============================================================================
// Payment Provider (Rotessa)
// ============================================================================

/**
 * Configuration for payment providers
 */
export type PaymentProviderConfig = {
	/** API credentials */
	apiKey?: string;
	apiSecret?: string;

	/** Environment */
	environment: "sandbox" | "production";

	/** Base URL (if configurable) */
	baseUrl?: string;
};

/**
 * Input for creating a payment customer
 */
export type PaymentCustomerInput = {
	/** Customer details */
	name: string;
	email: string;
	phone?: string;

	/** Address */
	address?: {
		street: string;
		city: string;
		province: string;
		postalCode: string;
		country: string;
	};

	/** Bank information for pre-authorized debit */
	bankInfo?: {
		institutionNumber: string;
		transitNumber: string;
		accountNumber: string;
		accountType: "checking" | "savings";
	};

	/** Custom identifier for the customer */
	customIdentifier?: string;
};

/**
 * Result from payment provider operations
 */
export type PaymentProviderResult = {
	/** Provider's customer ID */
	customerId: number | string;

	/** Custom identifier */
	customIdentifier?: string;

	/** Operation status */
	status: PaymentCustomerStatus;

	/** When customer was created/linked */
	linkedAt?: string;

	/** Bank info confirmation */
	bankInfoConfirmed?: boolean;

	/** Authorization status */
	authorizationType?: "online" | "offline" | "pad";

	/** Error details */
	errorCode?: string;
	errorMessage?: string;

	/** Raw response */
	rawResponse?: unknown;
};

export type PaymentCustomerStatus =
	| "not_started"
	| "pending"
	| "linked"
	| "created"
	| "active"
	| "failed";

// ============================================================================
// Provider Registry Types
// ============================================================================

/**
 * Provider registration entry
 */
export type ProviderRegistryEntry<
	T extends VerificationProvider<unknown, unknown, unknown>,
> = {
	/** Provider ID */
	id: string;

	/** Provider type */
	type: ProviderType;

	/** Factory function to create provider instance */
	factory: () => T;

	/** Whether enabled by default */
	enabledByDefault: boolean;

	/** Description */
	description?: string;
};

/**
 * Provider registry configuration
 */
export type ProviderRegistryConfig = {
	/** Identity verification provider ID */
	identityProvider?: string;

	/** KYC/AML provider ID */
	kycAmlProvider?: string;

	/** Payment provider ID */
	paymentProvider?: string;

	/** Override enabled status */
	enabledOverrides?: Record<string, boolean>;
};
