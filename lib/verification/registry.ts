/**
 * Verification Provider Registry
 *
 * Central registry for all verification providers.
 * Supports dynamic provider loading and configuration.
 */

// Import providers
import { createIdentityStubProvider } from "./providers/identity-stub";
import { createKycStubProvider } from "./providers/kyc-stub";
import { createRotessaProvider } from "./providers/rotessa";
import type {
	IdentityVerificationConfig,
	IdentityVerificationInput,
	IdentityVerificationResult,
	KycAmlConfig,
	KycAmlInput,
	KycAmlResult,
	PaymentCustomerInput,
	PaymentProviderConfig,
	PaymentProviderResult,
	ProviderRegistryConfig,
	ProviderType,
	VerificationProvider,
} from "./types";

// ============================================================================
// Type Aliases for Provider Types
// ============================================================================

export type IdentityProvider = VerificationProvider<
	IdentityVerificationConfig,
	IdentityVerificationInput,
	IdentityVerificationResult
>;

export type KycAmlProvider = VerificationProvider<
	KycAmlConfig,
	KycAmlInput,
	KycAmlResult
>;

export type PaymentProvider = VerificationProvider<
	PaymentProviderConfig,
	PaymentCustomerInput,
	PaymentProviderResult
>;

// ============================================================================
// Provider Registry
// ============================================================================

/**
 * Available verification providers
 */
export const VERIFICATION_PROVIDERS = {
	identity: {
		/** Stub provider for development (auto-pass) */
		identity_stub: {
			id: "identity_stub",
			type: "identity" as ProviderType,
			factory: createIdentityStubProvider,
			enabledByDefault: true,
			description: "Development stub - auto-passes verification",
		},
		/** Plaid Identity (placeholder - not implemented) */
		plaid: {
			id: "plaid",
			type: "identity" as ProviderType,
			factory: createIdentityStubProvider, // Use stub until real implementation
			enabledByDefault: false,
			description: "Plaid Identity Verification (not implemented)",
		},
	},

	kyc_aml: {
		/** Stub provider for development (auto-pass) */
		kyc_stub: {
			id: "kyc_stub",
			type: "kyc_aml" as ProviderType,
			factory: createKycStubProvider,
			enabledByDefault: true,
			description: "Development stub - auto-passes KYC/AML",
		},
	},

	payment: {
		/** Rotessa payment processor */
		rotessa: {
			id: "rotessa",
			type: "payment" as ProviderType,
			factory: createRotessaProvider,
			enabledByDefault: true,
			description: "Rotessa pre-authorized debit processor",
		},
	},
} as const;

// ============================================================================
// Provider Factory Functions
// ============================================================================

/**
 * Get identity verification provider
 */
export function getIdentityProvider(
	providerId = "identity_stub"
): IdentityProvider {
	const providerEntry =
		VERIFICATION_PROVIDERS.identity[
			providerId as keyof typeof VERIFICATION_PROVIDERS.identity
		];

	if (!providerEntry) {
		throw new Error(`Unknown identity provider: ${providerId}`);
	}

	return providerEntry.factory() as IdentityProvider;
}

/**
 * Get KYC/AML provider
 */
export function getKycAmlProvider(providerId = "kyc_stub"): KycAmlProvider {
	const providerEntry =
		VERIFICATION_PROVIDERS.kyc_aml[
			providerId as keyof typeof VERIFICATION_PROVIDERS.kyc_aml
		];

	if (!providerEntry) {
		throw new Error(`Unknown KYC/AML provider: ${providerId}`);
	}

	return providerEntry.factory() as KycAmlProvider;
}

/**
 * Get payment provider
 */
export function getPaymentProvider(providerId = "rotessa"): PaymentProvider {
	const providerEntry =
		VERIFICATION_PROVIDERS.payment[
			providerId as keyof typeof VERIFICATION_PROVIDERS.payment
		];

	if (!providerEntry) {
		throw new Error(`Unknown payment provider: ${providerId}`);
	}

	return providerEntry.factory() as PaymentProvider;
}

// ============================================================================
// Registry Class
// ============================================================================

/**
 * Provider registry with configuration support
 */
export class VerificationProviderRegistry {
	private readonly config: ProviderRegistryConfig;
	private identityProviderInstance?: IdentityProvider;
	private kycAmlProviderInstance?: KycAmlProvider;
	private paymentProviderInstance?: PaymentProvider;

	constructor(config: ProviderRegistryConfig = {}) {
		this.config = config;
	}

	/**
	 * Get or create identity provider instance
	 */
	getIdentityProvider(): IdentityProvider {
		if (!this.identityProviderInstance) {
			const providerId = this.config.identityProvider ?? "identity_stub";
			this.identityProviderInstance = getIdentityProvider(providerId);
		}
		return this.identityProviderInstance;
	}

	/**
	 * Get or create KYC/AML provider instance
	 */
	getKycAmlProvider(): KycAmlProvider {
		if (!this.kycAmlProviderInstance) {
			const providerId = this.config.kycAmlProvider ?? "kyc_stub";
			this.kycAmlProviderInstance = getKycAmlProvider(providerId);
		}
		return this.kycAmlProviderInstance;
	}

	/**
	 * Get or create payment provider instance
	 */
	getPaymentProvider(): PaymentProvider {
		if (!this.paymentProviderInstance) {
			const providerId = this.config.paymentProvider ?? "rotessa";
			this.paymentProviderInstance = getPaymentProvider(providerId);
		}
		return this.paymentProviderInstance;
	}

	/**
	 * Check if a provider is enabled
	 */
	isProviderEnabled(providerId: string): boolean {
		if (this.config.enabledOverrides?.[providerId] !== undefined) {
			return this.config.enabledOverrides[providerId];
		}

		// Check all provider categories
		for (const category of Object.values(VERIFICATION_PROVIDERS)) {
			const provider = (
				category as Record<string, { enabledByDefault: boolean }>
			)[providerId];
			if (provider) {
				return provider.enabledByDefault;
			}
		}

		return false;
	}

	/**
	 * List all available providers
	 */
	listProviders(): Array<{
		id: string;
		type: ProviderType;
		enabled: boolean;
		description?: string;
	}> {
		const providers: Array<{
			id: string;
			type: ProviderType;
			enabled: boolean;
			description?: string;
		}> = [];

		for (const [, category] of Object.entries(VERIFICATION_PROVIDERS)) {
			for (const [, provider] of Object.entries(category)) {
				providers.push({
					id: provider.id,
					type: provider.type,
					enabled: this.isProviderEnabled(provider.id),
					description: provider.description,
				});
			}
		}

		return providers;
	}
}

/**
 * Default registry instance
 */
export const defaultRegistry = new VerificationProviderRegistry();
