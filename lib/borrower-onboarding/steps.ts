/**
 * Borrower Onboarding Step Registry
 *
 * Defines the step configuration for borrower onboarding.
 * Steps: intro → profile → identity_verification → kyc_aml → rotessa_setup → review
 *
 * Note: identity_verification and kyc_aml are skippable until real providers are integrated.
 */

import type {
	JourneyContext,
	OnboardingStep,
	PersistContext,
	PersistResult,
	StepConfiguration,
	ValidationResult,
} from "@/lib/onboarding/step-registry";

// ============================================================================
// Validation Regex (Top-level for performance)
// ============================================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const POSTAL_CODE_REGEX = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
const INSTITUTION_NUMBER_REGEX = /^\d{3}$/;
const TRANSIT_NUMBER_REGEX = /^\d{5}$/;
const ACCOUNT_NUMBER_REGEX = /^\d{5,12}$/;

// ============================================================================
// Step IDs
// ============================================================================

export const BORROWER_STEP_IDS = {
	INTRO: "borrower_intro",
	PROFILE: "borrower_profile",
	IDENTITY_VERIFICATION: "borrower_identity_verification",
	KYC_AML: "borrower_kyc_aml",
	ROTESSA_SETUP: "borrower_rotessa_setup",
	REVIEW: "borrower_review",
} as const;

export type BorrowerStepId =
	(typeof BORROWER_STEP_IDS)[keyof typeof BORROWER_STEP_IDS];

// ============================================================================
// Step Data Types
// ============================================================================

export type BorrowerIntroData = {
	acknowledged: boolean;
};

export type BorrowerProfileData = {
	firstName: string;
	middleName?: string;
	lastName: string;
	email: string;
	phone?: string;
	address?: {
		street: string;
		city: string;
		province: string;
		postalCode: string;
		country: string;
	};
};

export type BorrowerIdentityVerificationData = {
	status: "not_started" | "pending" | "verified" | "failed" | "skipped";
	provider?: string;
	inquiryId?: string;
	checkedAt?: string;
};

export type BorrowerKycAmlData = {
	status:
		| "not_started"
		| "pending"
		| "passed"
		| "failed"
		| "requires_review"
		| "skipped";
	provider?: string;
	checkId?: string;
	checkedAt?: string;
};

export type BorrowerRotessaData = {
	status:
		| "not_started"
		| "pending"
		| "linked"
		| "created"
		| "active"
		| "failed";
	customerId?: number;
	customIdentifier?: string;
	linkedAt?: string;
	bankInfo?: {
		institutionNumber: string;
		transitNumber: string;
		accountNumber: string;
		accountType: "checking" | "savings";
	};
};

export type BorrowerReviewData = {
	confirmed: boolean;
	finalNotes?: string;
};

// ============================================================================
// Step Configuration
// ============================================================================

/**
 * Borrower onboarding step configuration
 * Defines the order and settings for each step
 */
export const BORROWER_ONBOARDING_STEPS: Record<
	BorrowerStepId,
	{
		id: BorrowerStepId;
		label: string;
		description: string;
		order: number;
		required: boolean;
		provider?: string;
		skipIfNotConfigured?: boolean;
	}
> = {
	[BORROWER_STEP_IDS.INTRO]: {
		id: BORROWER_STEP_IDS.INTRO,
		label: "Welcome",
		description: "Introduction to borrower onboarding",
		order: 0,
		required: true,
	},
	[BORROWER_STEP_IDS.PROFILE]: {
		id: BORROWER_STEP_IDS.PROFILE,
		label: "Your Information",
		description: "Personal and contact information",
		order: 1,
		required: true,
	},
	[BORROWER_STEP_IDS.IDENTITY_VERIFICATION]: {
		id: BORROWER_STEP_IDS.IDENTITY_VERIFICATION,
		label: "Identity Verification",
		description: "Verify your identity",
		order: 2,
		required: true,
		provider: "plaid",
		skipIfNotConfigured: true, // Skip until Plaid integrated
	},
	[BORROWER_STEP_IDS.KYC_AML]: {
		id: BORROWER_STEP_IDS.KYC_AML,
		label: "Verification",
		description: "KYC/AML compliance check",
		order: 3,
		required: true,
		provider: "kyc_provider",
		skipIfNotConfigured: true, // Skip until KYC integrated
	},
	[BORROWER_STEP_IDS.ROTESSA_SETUP]: {
		id: BORROWER_STEP_IDS.ROTESSA_SETUP,
		label: "Payment Setup",
		description: "Set up automatic payment collection",
		order: 4,
		required: true,
		provider: "rotessa",
	},
	[BORROWER_STEP_IDS.REVIEW]: {
		id: BORROWER_STEP_IDS.REVIEW,
		label: "Review & Submit",
		description: "Review your information and submit",
		order: 5,
		required: true,
	},
};

/**
 * Get ordered array of borrower steps
 */
export function getBorrowerStepsOrdered() {
	return Object.values(BORROWER_ONBOARDING_STEPS).sort(
		(a, b) => a.order - b.order
	);
}

/**
 * Get borrower step configuration for step registry
 */
export function createBorrowerStepConfiguration(): StepConfiguration {
	return {
		configId: "borrower",
		stepOrder: getBorrowerStepsOrdered().map((s) => s.id),
		stepSettings: Object.fromEntries(
			Object.values(BORROWER_ONBOARDING_STEPS).map((step) => [
				step.id,
				{
					isRequired: step.required,
					allowSkip: step.skipIfNotConfigured ?? false,
					customFields: step.provider ? { provider: step.provider } : undefined,
				},
			])
		),
		version: 1,
	};
}

// ============================================================================
// Step Implementations
// ============================================================================

/**
 * Borrower Intro Step
 */
export const borrowerIntroStep: OnboardingStep<BorrowerIntroData> = {
	id: BORROWER_STEP_IDS.INTRO,
	name: BORROWER_ONBOARDING_STEPS[BORROWER_STEP_IDS.INTRO].label,
	description: BORROWER_ONBOARDING_STEPS[BORROWER_STEP_IDS.INTRO].description,
	isRequired: true,
	allowSkip: false,

	validate(data: BorrowerIntroData): ValidationResult {
		if (!data.acknowledged) {
			return {
				valid: false,
				errors: { acknowledged: "Please acknowledge to continue" },
			};
		}
		return { valid: true };
	},

	async persist(
		data: BorrowerIntroData,
		context: PersistContext
	): Promise<PersistResult<BorrowerIntroData>> {
		await context.persistFn(context.stepId, data);
		return { success: true, data };
	},

	getInitialData(): BorrowerIntroData {
		return { acknowledged: false };
	},
};

/**
 * Borrower Profile Step
 */
export const borrowerProfileStep: OnboardingStep<BorrowerProfileData> = {
	id: BORROWER_STEP_IDS.PROFILE,
	name: BORROWER_ONBOARDING_STEPS[BORROWER_STEP_IDS.PROFILE].label,
	description: BORROWER_ONBOARDING_STEPS[BORROWER_STEP_IDS.PROFILE].description,
	isRequired: true,
	allowSkip: false,

	validate(data: BorrowerProfileData): ValidationResult {
		const errors: Record<string, string> = {};

		if (!data.firstName?.trim()) {
			errors.firstName = "First name is required";
		}
		if (!data.lastName?.trim()) {
			errors.lastName = "Last name is required";
		}
		if (!data.email?.trim()) {
			errors.email = "Email is required";
		} else if (!EMAIL_REGEX.test(data.email)) {
			errors.email = "Invalid email format";
		}
		// Canadian postal code validation
		if (
			data.address?.postalCode &&
			!POSTAL_CODE_REGEX.test(data.address.postalCode)
		) {
			errors["address.postalCode"] = "Invalid Canadian postal code format";
		}

		return { valid: Object.keys(errors).length === 0, errors };
	},

	async persist(
		data: BorrowerProfileData,
		context: PersistContext
	): Promise<PersistResult<BorrowerProfileData>> {
		await context.persistFn(context.stepId, data);
		return { success: true, data };
	},

	getInitialData(): BorrowerProfileData {
		return {
			firstName: "",
			lastName: "",
			email: "",
		};
	},
};

/**
 * Borrower Identity Verification Step (Skippable - stub implementation)
 */
export const borrowerIdentityVerificationStep: OnboardingStep<BorrowerIdentityVerificationData> =
	{
		id: BORROWER_STEP_IDS.IDENTITY_VERIFICATION,
		name: BORROWER_ONBOARDING_STEPS[BORROWER_STEP_IDS.IDENTITY_VERIFICATION]
			.label,
		description:
			BORROWER_ONBOARDING_STEPS[BORROWER_STEP_IDS.IDENTITY_VERIFICATION]
				.description,
		isRequired: true,
		allowSkip: true, // Can be skipped until Plaid is integrated

		validate(data: BorrowerIdentityVerificationData): ValidationResult {
			// Accept verified, skipped, or allow skip for not_started
			if (data.status === "verified" || data.status === "skipped") {
				return { valid: true };
			}
			if (data.status === "not_started") {
				// Allow skipping if not configured
				return { valid: true };
			}
			if (data.status === "failed") {
				return {
					valid: false,
					errors: { status: "Identity verification failed. Please try again." },
				};
			}
			return { valid: false, errors: { status: "Verification pending" } };
		},

		async persist(
			data: BorrowerIdentityVerificationData,
			context: PersistContext
		): Promise<PersistResult<BorrowerIdentityVerificationData>> {
			await context.persistFn(context.stepId, data);
			return { success: true, data };
		},

		getInitialData(): BorrowerIdentityVerificationData {
			return { status: "not_started" };
		},

		shouldShow(_context: JourneyContext): boolean {
			// Show step but allow skip if provider not configured
			// In future, check for Plaid configuration
			return true;
		},
	};

/**
 * Borrower KYC/AML Step (Skippable - stub implementation)
 */
export const borrowerKycAmlStep: OnboardingStep<BorrowerKycAmlData> = {
	id: BORROWER_STEP_IDS.KYC_AML,
	name: BORROWER_ONBOARDING_STEPS[BORROWER_STEP_IDS.KYC_AML].label,
	description: BORROWER_ONBOARDING_STEPS[BORROWER_STEP_IDS.KYC_AML].description,
	isRequired: true,
	allowSkip: true, // Can be skipped until KYC provider is integrated

	validate(data: BorrowerKycAmlData): ValidationResult {
		// Accept passed, skipped, or allow skip for not_started
		if (data.status === "passed" || data.status === "skipped") {
			return { valid: true };
		}
		if (data.status === "not_started") {
			// Allow skipping if not configured
			return { valid: true };
		}
		if (data.status === "failed") {
			return {
				valid: false,
				errors: { status: "KYC/AML check failed. Please contact support." },
			};
		}
		if (data.status === "requires_review") {
			return {
				valid: false,
				errors: { status: "KYC/AML check requires manual review." },
			};
		}
		return { valid: false, errors: { status: "KYC/AML check pending" } };
	},

	async persist(
		data: BorrowerKycAmlData,
		context: PersistContext
	): Promise<PersistResult<BorrowerKycAmlData>> {
		await context.persistFn(context.stepId, data);
		return { success: true, data };
	},

	getInitialData(): BorrowerKycAmlData {
		return { status: "not_started" };
	},

	shouldShow(_context: JourneyContext): boolean {
		// Show step but allow skip if provider not configured
		// In future, check for KYC provider configuration
		return true;
	},
};

/**
 * Borrower Rotessa Setup Step
 */
export const borrowerRotessaStep: OnboardingStep<BorrowerRotessaData> = {
	id: BORROWER_STEP_IDS.ROTESSA_SETUP,
	name: BORROWER_ONBOARDING_STEPS[BORROWER_STEP_IDS.ROTESSA_SETUP].label,
	description:
		BORROWER_ONBOARDING_STEPS[BORROWER_STEP_IDS.ROTESSA_SETUP].description,
	isRequired: true,
	allowSkip: false,

	validate(data: BorrowerRotessaData): ValidationResult {
		const errors: Record<string, string> = {};

		// Must have active Rotessa customer
		if (!["linked", "created", "active"].includes(data.status)) {
			errors.status = "Please complete Rotessa payment setup";
		}

		// Validate bank info if provided
		if (data.bankInfo) {
			if (
				!(
					data.bankInfo.institutionNumber &&
					INSTITUTION_NUMBER_REGEX.test(data.bankInfo.institutionNumber)
				)
			) {
				errors["bankInfo.institutionNumber"] =
					"Institution number must be 3 digits";
			}
			if (
				!(
					data.bankInfo.transitNumber &&
					TRANSIT_NUMBER_REGEX.test(data.bankInfo.transitNumber)
				)
			) {
				errors["bankInfo.transitNumber"] = "Transit number must be 5 digits";
			}
			if (
				!(
					data.bankInfo.accountNumber &&
					ACCOUNT_NUMBER_REGEX.test(data.bankInfo.accountNumber)
				)
			) {
				errors["bankInfo.accountNumber"] = "Account number must be 5-12 digits";
			}
		}

		return { valid: Object.keys(errors).length === 0, errors };
	},

	async persist(
		data: BorrowerRotessaData,
		context: PersistContext
	): Promise<PersistResult<BorrowerRotessaData>> {
		await context.persistFn(context.stepId, data);
		return { success: true, data };
	},

	getInitialData(): BorrowerRotessaData {
		return { status: "not_started" };
	},
};

/**
 * Borrower Review Step
 */
export const borrowerReviewStep: OnboardingStep<BorrowerReviewData> = {
	id: BORROWER_STEP_IDS.REVIEW,
	name: BORROWER_ONBOARDING_STEPS[BORROWER_STEP_IDS.REVIEW].label,
	description: BORROWER_ONBOARDING_STEPS[BORROWER_STEP_IDS.REVIEW].description,
	isRequired: true,
	allowSkip: false,

	validate(data: BorrowerReviewData): ValidationResult {
		if (!data.confirmed) {
			return {
				valid: false,
				errors: {
					confirmed: "Please confirm that your information is correct",
				},
			};
		}
		return { valid: true };
	},

	async persist(
		data: BorrowerReviewData,
		context: PersistContext
	): Promise<PersistResult<BorrowerReviewData>> {
		await context.persistFn(context.stepId, data);
		return { success: true, data };
	},

	getInitialData(): BorrowerReviewData {
		return { confirmed: false };
	},
};

// ============================================================================
// Registry Helper
// ============================================================================

/**
 * All borrower onboarding steps
 */
export const BORROWER_STEPS = [
	borrowerIntroStep,
	borrowerProfileStep,
	borrowerIdentityVerificationStep,
	borrowerKycAmlStep,
	borrowerRotessaStep,
	borrowerReviewStep,
];

/**
 * Register borrower steps with the global registry
 */
export function registerBorrowerSteps(
	registry: import("@/lib/onboarding/step-registry").StepRegistry
): void {
	// Cast to OnboardingStep<unknown>[] to satisfy registry type constraint
	// This is safe as the registry only uses the common interface
	registry.registerSteps(
		BORROWER_STEPS as unknown as import("@/lib/onboarding/step-registry").OnboardingStep[]
	);
	registry.registerConfiguration(createBorrowerStepConfiguration());
}
