import { withAuth } from "@workos-inc/authkit-nextjs";
import { preloadedQueryResult, preloadQuery } from "convex/nextjs";
import { redirect } from "next/navigation";
import { OnboardingExperience } from "@/components/onboarding/OnboardingExperience";
import { api } from "@/convex/_generated/api";
import { extractRole, isElevatedRole, type WorkOSUser } from "@/types/workos";

export default async function OnboardingPage() {
	const { user, accessToken } = await withAuth();

	// Server-side role check - WorkOS is source of truth
	const userRole = extractRole(user as WorkOSUser);
	if (isElevatedRole(userRole)) {
		redirect("/dashboard");
	}

	const preloadedJourney = await preloadQuery(
		api.onboarding.getJourney,
		{},
		{ token: accessToken }
	);
	const journey = preloadedQueryResult(preloadedJourney);
	if (journey?.status === "approved") {
		redirect("/dashboard");
	}
	return <OnboardingExperience preloadedJourney={preloadedJourney} />;
}
