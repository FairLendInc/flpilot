import { env } from "../lib/env";
import type { LawyerProfile, NameFields } from "./types";

export type IdentityInquiryStatus = "pending" | "completed";

export type IdentityInquiry = {
	inquiryId: string;
	status: IdentityInquiryStatus;
	provider: "mock_persona";
	extractedName: NameFields;
};

export type IdentityVerificationProvider = {
	createInquiry: (
		profile: LawyerProfile,
		options?: { simulateMismatch?: boolean }
	) => Promise<IdentityInquiry>;
};

function createMockInquiryId() {
	const rand = Math.random().toString(16).slice(2, 10);
	return `mock_inq_${Date.now()}_${rand}`;
}

export class MockPersonaIdentityProvider
	implements IdentityVerificationProvider
{
	async createInquiry(
		profile: LawyerProfile,
		options?: { simulateMismatch?: boolean }
	): Promise<IdentityInquiry> {
		const mismatch = options?.simulateMismatch ?? false;
		const extractedName: NameFields = mismatch
			? {
					firstName: profile.firstName,
					lastName: `${profile.lastName}-mismatch`,
					middleName: profile.middleName,
				}
			: {
					firstName: profile.firstName,
					lastName: profile.lastName,
					middleName: profile.middleName,
				};

		return {
			inquiryId: createMockInquiryId(),
			status: "completed",
			provider: "mock_persona",
			extractedName,
		};
	}
}

export class PersonaIdentityVerificationProvider
	implements IdentityVerificationProvider
{
	async createInquiry(): Promise<IdentityInquiry> {
		throw new Error(
			"Persona identity provider is not configured. Use LAWYER_IDENTITY_PROVIDER=mock_persona for now."
		);
	}
}

let identityProvider: IdentityVerificationProvider | null = null;

export function getIdentityVerificationProvider(): IdentityVerificationProvider {
	if (!identityProvider) {
		const provider = env.LAWYER_IDENTITY_PROVIDER;
		identityProvider =
			provider === "persona"
				? new PersonaIdentityVerificationProvider()
				: new MockPersonaIdentityProvider();
	}
	return identityProvider;
}

export function resetIdentityVerificationProvider() {
	identityProvider = null;
}
