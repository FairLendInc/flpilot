import { withAuth } from "@workos-inc/authkit-nextjs";
import { preloadedQueryResult, preloadQuery } from "convex/nextjs";
import { redirect } from "next/navigation";
import { OnboardingExperience } from "@/components/onboarding/OnboardingExperience";
import { api } from "@/convex/_generated/api";

export default async function OnboardingPage() {
	const { accessToken } = await withAuth();
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
