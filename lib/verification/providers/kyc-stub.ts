/**
 * KYC/AML Stub Provider
 *
 * Development stub that auto-passes KYC/AML checks.
 * Used when real KYC/AML verification is not yet integrated.
 */

import type {
	KycAmlConfig,
	KycAmlInput,
	KycAmlResult,
	KycAmlStatus,
	KycCheckType,
	VerificationProvider,
} from "../types";

/**
 * Stub implementation for KYC/AML checks
 */
class KycStubProvider
	implements VerificationProvider<KycAmlConfig, KycAmlInput, KycAmlResult>
{
	readonly id = "kyc_stub";
	readonly name = "KYC/AML Stub (Development)";
	readonly enabled = true;
	readonly type = "kyc_aml" as const;

	private config: KycAmlConfig | null = null;
	private readonly simulateDelay = 750; // ms

	async initialize(config: KycAmlConfig): Promise<void> {
		this.config = config;
		// Stub initialization - nothing to do
	}

	async verify(input: KycAmlInput): Promise<KycAmlResult> {
		// Simulate API delay
		await this.delay(this.simulateDelay);

		// Generate a mock check ID
		const checkId = `stub_kyc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

		// Default to "passed" status for stub
		// Can be overridden with special test patterns
		let status: KycAmlStatus = "passed";

		// Special test cases based on name pattern
		const fullName = `${input.firstName} ${input.lastName}`.toLowerCase();
		if (fullName.includes("fail")) {
			status = "failed";
		} else if (fullName.includes("review")) {
			status = "requires_review";
		} else if (fullName.includes("pending")) {
			status = "pending";
		}

		// Determine which checks to simulate
		const checkTypes: KycCheckType[] = this.config?.checkTypes ?? [
			"identity",
			"watchlist",
			"pep",
			"sanctions",
		];

		// Generate check results
		const checks = checkTypes.map((type) => ({
			type,
			passed: status === "passed",
			details:
				status === "passed"
					? "No issues found (stub)"
					: status === "failed"
						? "Simulated failure for testing"
						: "Requires manual review",
		}));

		const result: KycAmlResult = {
			checkId,
			status,
			providerReference: `stub_ref_${checkId}`,
			checkedAt: new Date().toISOString(),
			checks,
			riskLevel:
				status === "passed" ? "low" : status === "failed" ? "high" : "medium",
			alerts: status !== "passed" ? ["Stub: Simulated alert for testing"] : [],
			failureReason:
				status === "failed"
					? "Stub: Simulated KYC/AML failure for testing"
					: undefined,
			reviewNotes:
				status === "requires_review"
					? "Stub: Manual review required (simulated)"
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

	isPassed(result: KycAmlResult): boolean {
		return result.status === "passed";
	}

	getStatusMessage(result: KycAmlResult): string {
		switch (result.status) {
			case "passed":
				return "KYC/AML checks passed (stub)";
			case "pending":
				return "KYC/AML checks pending";
			case "failed":
				return `KYC/AML checks failed: ${result.failureReason ?? "Unknown reason"}`;
			case "requires_review":
				return "KYC/AML checks require manual review";
			case "skipped":
				return "KYC/AML checks skipped";
			default:
				return "KYC/AML checks not started";
		}
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

/**
 * Factory function to create KYC stub provider
 */
export function createKycStubProvider(): KycStubProvider {
	return new KycStubProvider();
}
