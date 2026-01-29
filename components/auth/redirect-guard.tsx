"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

type RedirectGuardProps = {
	shouldRedirect: boolean;
	redirectTo: string;
	skipPaths?: string[];
};

export function RedirectGuard({
	shouldRedirect,
	redirectTo,
	skipPaths,
}: RedirectGuardProps) {
	const pathname = usePathname();
	const router = useRouter();

	useEffect(() => {
		if (!shouldRedirect || pathname === redirectTo) {
			return;
		}

		const isSkipped = skipPaths?.some((path) => pathname.startsWith(path));
		if (isSkipped) {
			return;
		}

		if (pathname) {
			router.push(redirectTo);
		}
	}, [shouldRedirect, redirectTo, pathname, router, skipPaths]);

	return null;
}
