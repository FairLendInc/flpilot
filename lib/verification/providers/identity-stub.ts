/**
 * Identity Verification Stub Provider
 *
 * Development stub that auto-passes identity verification.
 * Used when real identity verification is not yet integrated.
 */

import type {
	IdentityVerificationConfig,
	IdentityVerificationInput,
	IdentityVerificationResult,
	IdentityVerificationStatus,
	VerificationProvider,
} from "../types";

/**
 * Stub implementation for identity verification
 */
class IdentityStubProvider
	implements
		VerificationProvider<
			IdentityVerificationConfig,
			IdentityVerificationInput,
			IdentityVerificationResult
		>
{
	readonly id = "identity_stub";
	readonly name = "Identity Stub (Development)";
	readonly enabled = true;
	readonly type = "identity" as const;
	private readonly simulateDelay = 500; // ms

	async initialize(config: IdentityVerificationConfig): Promise<void> {
		this.config = config;
		// Stub initialization - nothing to do
	}

	async verify(
		input: IdentityVerificationInput
	): Promise<IdentityVerificationResult> {
		// Simulate API delay
		await this.delay(this.simulateDelay);

		// Generate a mock verification ID
		const verificationId = `stub_id_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

		// Default to "verified" status for stub
		// Can be overridden with special test emails
		let status: IdentityVerificationStatus = "verified";

		// Special test cases based on email pattern (if included in name)
		const fullName = `${input.firstName} ${input.lastName}`.toLowerCase();
		if (fullName.includes("fail")) {
			status = "failed";
		} else if (fullName.includes("mismatch")) {
			status = "mismatch";
		} else if (fullName.includes("pending")) {
			status = "pending";
		}

		const result: IdentityVerificationResult = {
			verificationId,
			status,
			providerReference: `stub_ref_${verificationId}`,
			verifiedAt: status === "verified" ? new Date().toISOString() : undefined,
			matchedData:
				status === "verified"
					? {
							nameMatch: true,
							dobMatch: !!input.dateOfBirth,
							addressMatch: !!input.address,
						}
					: undefined,
			riskSignals:
				status === "verified"
					? {
							fraudScore: 0.05,
							flags: [],
						}
					: undefined,
			failureReason:
				status === "failed"
					? "Stub: Simulated failure for testing"
					: status === "mismatch"
						? "Stub: Simulated data mismatch for testing"
						: undefined,
			rawResponse: {
				provider: "stub",
				simulatedAt: new Date().toISOString(),
				input: {
					firstName: input.firstName,
					lastName: input.lastName,
				},
			},
		};

		return result;
	}

	isPassed(result: IdentityVerificationResult): boolean {
		return result.status === "verified";
	}

	getStatusMessage(result: IdentityVerificationResult): string {
		switch (result.status) {
			case "verified":
				return "Identity verified successfully (stub)";
			case "pending":
				return "Identity verification pending";
			case "failed":
				return `Identity verification failed: ${result.failureReason ?? "Unknown reason"}`;
			case "mismatch":
				return "Identity data mismatch detected";
			case "skipped":
				return "Identity verification skipped";
			default:
				return "Identity verification not started";
		}
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

/**
 * Factory function to create identity stub provider
 */
export function createIdentityStubProvider(): IdentityStubProvider {
	return new IdentityStubProvider();
}
