"use client";

import {
	AuthKitProvider,
	useAccessToken,
	useAuth,
} from "@workos-inc/authkit-nextjs/components";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { type ReactNode, Suspense, useCallback, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { logger } from "../lib/logger";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
	const [convex] = useState(
		// biome-ignore lint/style/noNonNullAssertion: its fine
		() => new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
	);
	return (
		<AuthKitProvider>
			<ConvexProviderWithAuth client={convex} useAuth={useAuthFromAuthKit}>
				<Suspense
					fallback={
						<div className="flex min-h-screen items-center justify-center">
							<Spinner className="size-8" />
						</div>
					}
				>
					{children}
				</Suspense>
			</ConvexProviderWithAuth>
		</AuthKitProvider>
	);
}

function useAuthFromAuthKit() {
	const { user, loading: isLoading } = useAuth();
	const { getAccessToken, refresh } = useAccessToken();

	const isAuthenticated = !!user;

	const fetchAccessToken = useCallback(
		async ({
			forceRefreshToken,
		}: {
			forceRefreshToken?: boolean;
		} = {}): Promise<string | null> => {
			if (!user) {
				return null;
			}

			try {
				if (forceRefreshToken) {
					return (await refresh()) ?? null;
				}
				return (await getAccessToken()) ?? null;
			} catch (error) {
				logger.error("Failed to get access token:", { error });
				return null;
			}
		},
		[user, refresh, getAccessToken]
	);

	return {
		isLoading,
		isAuthenticated,
		fetchAccessToken,
	};
}
