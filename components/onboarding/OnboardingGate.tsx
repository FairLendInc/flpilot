"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { useQuery } from "convex/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "@/convex/_generated/api";

const ALLOWLIST = ["/onboarding", "/sign-in", "/sign-up", "/callback"];

export function OnboardingGate() {
	const { user } = useAuth();
	const pathname = usePathname();
	const router = useRouter();
	const journey = useQuery(api.onboarding.getJourney);
	const isAuthenticated = !!user;

	useEffect(() => {
		if (!(isAuthenticated && pathname)) {
			return;
		}

		if (pathname.startsWith("/onboarding")) {
			if (journey?.status === "approved") {
				router.replace("/dashboard");
			}
			return;
		}

		const isAllowlisted = ALLOWLIST.some((prefix) =>
			pathname.startsWith(prefix)
		);
		if (isAllowlisted) {
			return;
		}

		if (journey === undefined) {
			return;
		}

		const requiresOnboarding =
			!journey ||
			journey.status === "draft" ||
			journey.status === "awaiting_admin" ||
			journey.status === "rejected";

		if (requiresOnboarding) {
			router.replace("/onboarding");
		}
	}, [isAuthenticated, journey, pathname, router]);

	return null;
}
