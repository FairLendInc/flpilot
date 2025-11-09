"use client";

import { useAction } from "convex/react";
import { useEffect, useRef } from "react";

import { api } from "@/convex/_generated/api";
import type { UserProfileReturnType } from "@/convex/profile";

type ProfileLike = UserProfileReturnType | undefined;

/**
 * Ensures the current WorkOS-authenticated user has a Convex `users` record.
 * Calls `users.provisionCurrentUser` exactly once per identity when the
 * profile query returns `{ user: null, workOsIdentity: {...} }`.
 */
export function useProvisionCurrentUser(profile: ProfileLike) {
	const provisionUser = useAction(api.users.provisionCurrentUser);
	const attemptedForId = useRef<string | null>(null);

	useEffect(() => {
		if (!profile) {
			return;
		}

		const identity = profile.workOsIdentity as { subject?: string } | null;
		const userMissing = profile.user === null && identity?.subject;

		if (!userMissing) {
			// Reset so we can retry for future identities (logout/login scenarios)
			attemptedForId.current = null;
			return;
		}

		if (attemptedForId.current === identity.subject) {
			return;
		}

		attemptedForId.current = identity.subject ?? null;

		provisionUser().catch((error) => {
			if (process.env.NODE_ENV !== "production") {
				console.error("Failed to provision user", error);
			}
			// Allow another attempt if provisioning fails
			attemptedForId.current = null;
		});
	}, [profile, provisionUser]);
}
