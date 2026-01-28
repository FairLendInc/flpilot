"use client";

import { useConvexAuth } from "convex/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "@/convex/_generated/api";
import { useAuthenticatedQuery } from "@/convex/lib/client";
import { extractRole, isElevatedRole } from "@/types/workos";

const ALLOWLIST = ["/onboarding", "/sign-in", "/sign-up", "/callback"];

export function OnboardingGate() {
	const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
	const pathname = usePathname();
	const router = useRouter();
	const journey = useAuthenticatedQuery(api.onboarding.getJourney, {});
	const profile = useAuthenticatedQuery(api.profile.getCurrentUserProfile, {});
	const userRole = extractRole(profile?.workOsIdentity);

	useEffect(() => {
		if (authLoading || !pathname) {
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
		if (isAuthenticated && journey === undefined) {
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
	}, [authLoading, isAuthenticated, journey, pathname, router, userRole]);

	return null;
}
