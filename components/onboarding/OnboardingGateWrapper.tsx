import { OnboardingGate } from "./OnboardingGate";

/**
 * Server Component wrapper for OnboardingGate
 * Client-side gate handles auth-aware routing.
 */
export async function OnboardingGateWrapper() {
	return <OnboardingGate />;
}
