"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { useQuery } from "convex/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "@/convex/_generated/api";
import { isElevatedRole } from "@/types/workos";

const ALLOWLIST = ["/onboarding", "/sign-in", "/sign-up", "/callback"];

type OnboardingGateProps = {
	userRole: string | undefined;
};

export function OnboardingGate({ userRole }: OnboardingGateProps) {
	const { user } = useAuth();
	console.info("USER", { user });
	const pathname = usePathname();
	const router = useRouter();
	const journey = useQuery(api.onboarding.getJourney);
	const isAuthenticated = !!user;

	useEffect(() => {
		if (!(isAuthenticated && pathname)) {
			return;
		}

		// Check WorkOS role first - WorkOS is the source of truth for auth
		// Role is passed from server component where RBAC claims are available

		// Users with elevated roles skip onboarding entirely
		if (isElevatedRole(userRole)) {
			// If they're on onboarding page, redirect to dashboard
			if (pathname.startsWith("/onboarding")) {
				router.replace("/dashboard");
			}
			return; // No onboarding check needed for elevated roles
		}

		// For onboarding routes: check if approved users should exit
		if (pathname.startsWith("/onboarding")) {
			if (journey?.status === "approved") {
				router.replace("/dashboard");
			}
			return;
		}

		// Skip allowlisted routes
		const isAllowlisted = ALLOWLIST.some((prefix) =>
			pathname.startsWith(prefix)
		);
		if (isAllowlisted) {
			return;
		}

		// Wait for journey data to load
		if (journey === undefined) {
			return;
		}

		// Only "member" role users need onboarding
		// If we reach here, user is "member" (or has no role)
		const requiresOnboarding =
			!journey ||
			journey.status === "draft" ||
			journey.status === "awaiting_admin" ||
			journey.status === "rejected";

		if (requiresOnboarding) {
			router.replace("/onboarding");
		}
	}, [isAuthenticated, journey, pathname, router, userRole]);

	return null;
}
