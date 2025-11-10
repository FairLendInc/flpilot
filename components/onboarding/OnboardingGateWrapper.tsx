import { withAuth } from "@workos-inc/authkit-nextjs";
import { preloadedQueryResult, preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { extractRole, type WorkOSIdentity } from "@/types/workos";
import { OnboardingGate } from "./OnboardingGate";

/**
 * Server Component wrapper for OnboardingGate
 * Fetches user role from Convex server-side (where RBAC claims are available)
 * and passes it to the client component
 */
export async function OnboardingGateWrapper() {
	// Get auth token - returns null if not authenticated
	const auth = await withAuth({ ensureSignedIn: false });

	if (!auth.user) {
		// Not authenticated - return null gate (no redirect logic needed)
		return <OnboardingGate userRole={undefined} />;
	}

	// Fetch user identity from Convex (includes RBAC claims)
	const preloadedIdentity = await preloadQuery(
		api.profile.getUserIdentity,
		{},
		{ token: auth.accessToken }
	);

	const identity = preloadedQueryResult(
		preloadedIdentity
	) as WorkOSIdentity | null;
	console.log("Identity:", { identity });

	// Extract role from identity
	const userRole = extractRole(identity);

	return <OnboardingGate userRole={userRole} />;
}
