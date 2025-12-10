// import { OnboardingGateWrapper } from "@/components/onboarding/OnboardingGateWrapper";

import { withAuth } from "@workos-inc/authkit-nextjs";
import { RedirectGuard } from "@/components/auth/redirect-guard";
import NavigationProvider from "@/components/navigation/navigation-provider";

export default async function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const user = await withAuth();
	//if the user has "member" role, or no role redirect to root.
	console.log("USER", { user });

	// Logic to redirect if member or no role (and not on profile)
	// Note: This logic assumes we want to redirect unauthenticated users (no role) to profile as well?
	// If user is null, !user?.role is true. This might cause loops if profile is protected.
	// However, fixing the 'request' error using client-side check:
	const shouldRedirect = user?.role === "member" || !user?.role;

	return (
		<main
			className="h-[calc(100vh-6rem)] bg-background pt-24"
			id="main-content"
		>
			<RedirectGuard redirectTo="/profile" shouldRedirect={shouldRedirect} />
			{/* <OnboardingGateWrapper /> */}
			<NavigationProvider>{children}</NavigationProvider>
		</main>
	);
}
