import { withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import { OnboardingExperience } from "@/components/onboarding/OnboardingExperience";
import { extractRole, isElevatedRole, type WorkOSUser } from "@/types/workos";

export default async function OnboardingPage() {
	const { user } = await withAuth();

	// Server-side role check - WorkOS is source of truth
	const userRole = extractRole(user as WorkOSUser);
	if (isElevatedRole(userRole)) {
		redirect("/dashboard");
	}

	return <OnboardingExperience />;
}
