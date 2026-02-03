/**
 * Unit Tests for Borrower Onboarding Steps
 *
 * Tests step validation logic and step registry configuration
 */

import { describe, expect, test } from "vitest";
import {
	BORROWER_ONBOARDING_STEPS,
	BORROWER_STEP_IDS,
	type BorrowerProfileData,
	type BorrowerRotessaData,
	borrowerIdentityVerificationStep,
	borrowerIntroStep,
	borrowerKycAmlStep,
	borrowerProfileStep,
	borrowerReviewStep,
	borrowerRotessaStep,
	createBorrowerStepConfiguration,
	getBorrowerStepsOrdered,
} from "@/lib/borrower-onboarding/steps";

// ============================================================================
// Step Registry Tests
// ============================================================================

describe("Borrower Step Registry", () => {
	test("should have correct step IDs", () => {
		expect(BORROWER_STEP_IDS.INTRO).toBe("borrower_intro");
		expect(BORROWER_STEP_IDS.PROFILE).toBe("borrower_profile");
		expect(BORROWER_STEP_IDS.IDENTITY_VERIFICATION).toBe(
			"borrower_identity_verification"
		);
		expect(BORROWER_STEP_IDS.KYC_AML).toBe("borrower_kyc_aml");
		expect(BORROWER_STEP_IDS.ROTESSA_SETUP).toBe("borrower_rotessa_setup");
		expect(BORROWER_STEP_IDS.REVIEW).toBe("borrower_review");
	});

	test("should have all steps in BORROWER_ONBOARDING_STEPS", () => {
		const stepIds = Object.values(BORROWER_STEP_IDS);
		const registeredStepIds = Object.keys(BORROWER_ONBOARDING_STEPS);

		expect(registeredStepIds).toHaveLength(stepIds.length);
		for (const id of stepIds) {
			expect(BORROWER_ONBOARDING_STEPS[id]).toBeDefined();
		}
	});

	test("getBorrowerStepsOrdered should return steps in order", () => {
		const orderedSteps = getBorrowerStepsOrdered();

		expect(orderedSteps).toHaveLength(6);
		expect(orderedSteps[0]?.id).toBe(BORROWER_STEP_IDS.INTRO);
		expect(orderedSteps[1]?.id).toBe(BORROWER_STEP_IDS.PROFILE);
		expect(orderedSteps[2]?.id).toBe(BORROWER_STEP_IDS.IDENTITY_VERIFICATION);
		expect(orderedSteps[3]?.id).toBe(BORROWER_STEP_IDS.KYC_AML);
		expect(orderedSteps[4]?.id).toBe(BORROWER_STEP_IDS.ROTESSA_SETUP);
		expect(orderedSteps[5]?.id).toBe(BORROWER_STEP_IDS.REVIEW);
	});

	test("createBorrowerStepConfiguration should create valid config", () => {
		const config = createBorrowerStepConfiguration();

		expect(config.configId).toBe("borrower");
		expect(config.version).toBe(1);
		expect(config.stepOrder).toHaveLength(6);

		// Verify step settings
		expect(config.stepSettings[BORROWER_STEP_IDS.INTRO]).toBeDefined();
		expect(config.stepSettings[BORROWER_STEP_IDS.PROFILE]?.isRequired).toBe(
			true
		);
		expect(
			config.stepSettings[BORROWER_STEP_IDS.IDENTITY_VERIFICATION]?.allowSkip
		).toBe(true);
		expect(config.stepSettings[BORROWER_STEP_IDS.KYC_AML]?.allowSkip).toBe(
			true
		);
		expect(
			config.stepSettings[BORROWER_STEP_IDS.ROTESSA_SETUP]?.allowSkip
		).toBe(false);
	});
});

// ============================================================================
// Intro Step Tests
// ============================================================================

describe("borrowerIntroStep", () => {
	test("should have correct metadata", () => {
		expect(borrowerIntroStep.id).toBe(BORROWER_STEP_IDS.INTRO);
		expect(borrowerIntroStep.isRequired).toBe(true);
		expect(borrowerIntroStep.allowSkip).toBe(false);
	});

	test("should validate acknowledged = false as invalid", () => {
		const result = borrowerIntroStep.validate({ acknowledged: false });
		expect(result.valid).toBe(false);
		expect(result.errors?.acknowledged).toBeDefined();
	});

	test("should validate acknowledged = true as valid", () => {
		const result = borrowerIntroStep.validate({ acknowledged: true });
		expect(result.valid).toBe(true);
	});

	test("should return correct initial data", () => {
		const data = borrowerIntroStep.getInitialData();
		expect(data.acknowledged).toBe(false);
	});
});

// ============================================================================
// Profile Step Tests
// ============================================================================

describe("borrowerProfileStep", () => {
	test("should have correct metadata", () => {
		expect(borrowerProfileStep.id).toBe(BORROWER_STEP_IDS.PROFILE);
		expect(borrowerProfileStep.isRequired).toBe(true);
		expect(borrowerProfileStep.allowSkip).toBe(false);
	});

	test("should validate empty profile as invalid", () => {
		const data: BorrowerProfileData = {
			firstName: "",
			lastName: "",
			email: "",
		};
		const result = borrowerProfileStep.validate(data);

		expect(result.valid).toBe(false);
		expect(result.errors?.firstName).toBeDefined();
		expect(result.errors?.lastName).toBeDefined();
		expect(result.errors?.email).toBeDefined();
	});

	test("should validate complete profile as valid", () => {
		const data: BorrowerProfileData = {
			firstName: "John",
			lastName: "Smith",
			email: "john@example.com",
			phone: "416-555-1234",
			address: {
				street: "123 Main St",
				city: "Toronto",
				province: "ON",
				postalCode: "M5V 1A1",
				country: "Canada",
			},
		};
		const result = borrowerProfileStep.validate(data);
		expect(result.valid).toBe(true);
	});

	test("should validate invalid email format", () => {
		const data: BorrowerProfileData = {
			firstName: "John",
			lastName: "Smith",
			email: "not-an-email",
		};
		const result = borrowerProfileStep.validate(data);

		expect(result.valid).toBe(false);
		expect(result.errors?.email).toContain("Invalid email format");
	});

	test("should validate invalid Canadian postal code", () => {
		const data: BorrowerProfileData = {
			firstName: "John",
			lastName: "Smith",
			email: "john@example.com",
			address: {
				street: "123 Main St",
				city: "Toronto",
				province: "ON",
				postalCode: "12345", // US format - invalid
				country: "Canada",
			},
		};
		const result = borrowerProfileStep.validate(data);

		expect(result.valid).toBe(false);
		expect(result.errors?.["address.postalCode"]).toContain(
			"Invalid Canadian postal code"
		);
	});

	test("should accept valid Canadian postal codes", () => {
		const validPostalCodes = ["M5V 1A1", "M5V1A1", "K1A-0B1", "V6B 2W2"];

		for (const postalCode of validPostalCodes) {
			const data: BorrowerProfileData = {
				firstName: "John",
				lastName: "Smith",
				email: "john@example.com",
				address: {
					street: "123 Main St",
					city: "Toronto",
					province: "ON",
					postalCode,
					country: "Canada",
				},
			};
			const result = borrowerProfileStep.validate(data);
			expect(result.valid).toBe(true);
		}
	});
});

// ============================================================================
// Identity Verification Step Tests
// ============================================================================

describe("borrowerIdentityVerificationStep", () => {
	test("should have correct metadata", () => {
		expect(borrowerIdentityVerificationStep.id).toBe(
			BORROWER_STEP_IDS.IDENTITY_VERIFICATION
		);
		expect(borrowerIdentityVerificationStep.allowSkip).toBe(true);
	});

	test("should validate verified status as valid", () => {
		const result = borrowerIdentityVerificationStep.validate({
			status: "verified",
		});
		expect(result.valid).toBe(true);
	});

	test("should validate skipped status as valid", () => {
		const result = borrowerIdentityVerificationStep.validate({
			status: "skipped",
		});
		expect(result.valid).toBe(true);
	});

	test("should validate not_started status as valid (skippable)", () => {
		const result = borrowerIdentityVerificationStep.validate({
			status: "not_started",
		});
		expect(result.valid).toBe(true);
	});

	test("should validate failed status as invalid", () => {
		const result = borrowerIdentityVerificationStep.validate({
			status: "failed",
		});
		expect(result.valid).toBe(false);
		expect(result.errors?.status).toContain("failed");
	});

	test("should validate pending status as invalid", () => {
		const result = borrowerIdentityVerificationStep.validate({
			status: "pending",
		});
		expect(result.valid).toBe(false);
	});
});

// ============================================================================
// KYC/AML Step Tests
// ============================================================================

describe("borrowerKycAmlStep", () => {
	test("should have correct metadata", () => {
		expect(borrowerKycAmlStep.id).toBe(BORROWER_STEP_IDS.KYC_AML);
		expect(borrowerKycAmlStep.allowSkip).toBe(true);
	});

	test("should validate passed status as valid", () => {
		const result = borrowerKycAmlStep.validate({ status: "passed" });
		expect(result.valid).toBe(true);
	});

	test("should validate skipped status as valid", () => {
		const result = borrowerKycAmlStep.validate({ status: "skipped" });
		expect(result.valid).toBe(true);
	});

	test("should validate failed status as invalid", () => {
		const result = borrowerKycAmlStep.validate({ status: "failed" });
		expect(result.valid).toBe(false);
	});

	test("should validate requires_review status as invalid", () => {
		const result = borrowerKycAmlStep.validate({ status: "requires_review" });
		expect(result.valid).toBe(false);
		expect(result.errors?.status).toContain("manual review");
	});
});

// ============================================================================
// Rotessa Setup Step Tests
// ============================================================================

describe("borrowerRotessaStep", () => {
	test("should have correct metadata", () => {
		expect(borrowerRotessaStep.id).toBe(BORROWER_STEP_IDS.ROTESSA_SETUP);
		expect(borrowerRotessaStep.isRequired).toBe(true);
		expect(borrowerRotessaStep.allowSkip).toBe(false);
	});

	test("should validate not_started status as invalid", () => {
		const data: BorrowerRotessaData = { status: "not_started" };
		const result = borrowerRotessaStep.validate(data);

		expect(result.valid).toBe(false);
		expect(result.errors?.status).toContain("complete Rotessa payment setup");
	});

	test("should validate active status as valid", () => {
		const data: BorrowerRotessaData = {
			status: "active",
			customerId: 12345,
		};
		const result = borrowerRotessaStep.validate(data);
		expect(result.valid).toBe(true);
	});

	test("should validate linked status as valid", () => {
		const data: BorrowerRotessaData = {
			status: "linked",
			customerId: 12345,
		};
		const result = borrowerRotessaStep.validate(data);
		expect(result.valid).toBe(true);
	});

	test("should validate created status as valid", () => {
		const data: BorrowerRotessaData = {
			status: "created",
			customerId: 12345,
		};
		const result = borrowerRotessaStep.validate(data);
		expect(result.valid).toBe(true);
	});

	test("should validate bank info institution number format", () => {
		const data: BorrowerRotessaData = {
			status: "active",
			customerId: 12345,
			bankInfo: {
				institutionNumber: "12", // Invalid - must be 3 digits
				transitNumber: "12345",
				accountNumber: "1234567",
				accountType: "checking",
			},
		};
		const result = borrowerRotessaStep.validate(data);

		expect(result.valid).toBe(false);
		expect(result.errors?.["bankInfo.institutionNumber"]).toContain("3 digits");
	});

	test("should validate bank info transit number format", () => {
		const data: BorrowerRotessaData = {
			status: "active",
			customerId: 12345,
			bankInfo: {
				institutionNumber: "001",
				transitNumber: "1234", // Invalid - must be 5 digits
				accountNumber: "1234567",
				accountType: "checking",
			},
		};
		const result = borrowerRotessaStep.validate(data);

		expect(result.valid).toBe(false);
		expect(result.errors?.["bankInfo.transitNumber"]).toContain("5 digits");
	});

	test("should validate bank info account number format", () => {
		const data: BorrowerRotessaData = {
			status: "active",
			customerId: 12345,
			bankInfo: {
				institutionNumber: "001",
				transitNumber: "12345",
				accountNumber: "1234", // Invalid - must be 5-12 digits
				accountType: "checking",
			},
		};
		const result = borrowerRotessaStep.validate(data);

		expect(result.valid).toBe(false);
		expect(result.errors?.["bankInfo.accountNumber"]).toContain("5-12 digits");
	});

	test("should validate complete valid bank info", () => {
		const data: BorrowerRotessaData = {
			status: "active",
			customerId: 12345,
			bankInfo: {
				institutionNumber: "001",
				transitNumber: "12345",
				accountNumber: "1234567890",
				accountType: "checking",
			},
		};
		const result = borrowerRotessaStep.validate(data);
		expect(result.valid).toBe(true);
	});
});

// ============================================================================
// Review Step Tests
// ============================================================================

describe("borrowerReviewStep", () => {
	test("should have correct metadata", () => {
		expect(borrowerReviewStep.id).toBe(BORROWER_STEP_IDS.REVIEW);
		expect(borrowerReviewStep.isRequired).toBe(true);
		expect(borrowerReviewStep.allowSkip).toBe(false);
	});

	test("should validate confirmed = false as invalid", () => {
		const result = borrowerReviewStep.validate({ confirmed: false });
		expect(result.valid).toBe(false);
		expect(result.errors?.confirmed).toContain("confirm");
	});

	test("should validate confirmed = true as valid", () => {
		const result = borrowerReviewStep.validate({ confirmed: true });
		expect(result.valid).toBe(true);
	});

	test("should accept final notes", () => {
		const result = borrowerReviewStep.validate({
			confirmed: true,
			finalNotes: "All looks good!",
		});
		expect(result.valid).toBe(true);
	});
});
