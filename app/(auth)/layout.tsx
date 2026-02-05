import { withAuth } from "@workos-inc/authkit-nextjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import NavigationProvider from "@/components/navigation/navigation-provider";
import { OnboardingGate } from "@/components/onboarding/OnboardingGate";

export default async function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const user = await withAuth();
	const headerList = await headers();
	const pathname = headerList.get("x-pathname") ?? "";

	if (!user) {
		redirect("/sign-in");
	}

	const shouldRedirect = user?.role === "member" || !user?.role;
	const isOnboarding = pathname.startsWith("/onboarding");
	const isProfile = pathname.startsWith("/profile");

	if (shouldRedirect && !isOnboarding && !isProfile) {
		redirect("/profile");
	}

	return (
		<main
			className="h-[calc(100vh-6rem)] bg-background pt-24"
			id="main-content"
		>
			<OnboardingGate />
			<Suspense fallback={null}>
				<NavigationProvider>{children}</NavigationProvider>
			</Suspense>
		</main>
	);
}
