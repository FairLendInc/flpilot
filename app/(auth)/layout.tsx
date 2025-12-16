import { withAuth } from "@workos-inc/authkit-nextjs";
import { Suspense } from "react";
import { RedirectGuard } from "@/components/auth/redirect-guard";
import NavigationProvider from "@/components/navigation/navigation-provider";
import { OnboardingGateWrapper } from "@/components/onboarding/OnboardingGateWrapper";

export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<main
			className="h-[calc(100vh-6rem)] bg-background pt-24"
			id="main-content"
		>
			<Suspense fallback={null}>
				<AuthCheck />
			</Suspense>
			<Suspense fallback={null}>
				<OnboardingGateWrapper />
			</Suspense>
			<Suspense fallback={null}>
				<NavigationProvider>{children}</NavigationProvider>
			</Suspense>
		</main>
	);
}

async function AuthCheck() {
	const user = await withAuth();
	//if the user has "member" role, or no role redirect to root.
	console.log("USER", { user });

	// Logic to redirect if member or no role (and not on profile)
	// Note: This logic assumes we want to redirect unauthenticated users (no role) to profile as well?
	// If user is null, !user?.role is true. This might cause loops if profile is protected.
	// However, fixing the 'request' error using client-side check:
	const shouldRedirect = user?.role === "member" || !user?.role;

	return (
		<RedirectGuard redirectTo="/profile" shouldRedirect={shouldRedirect} />
	);
}
