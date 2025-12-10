"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

type RedirectGuardProps = {
	shouldRedirect: boolean;
	redirectTo: string;
};

export function RedirectGuard({
	shouldRedirect,
	redirectTo,
}: RedirectGuardProps) {
	const pathname = usePathname();
	const router = useRouter();

	useEffect(() => {
		if (shouldRedirect && pathname !== redirectTo) {
			router.push(redirectTo);
		}
	}, [shouldRedirect, redirectTo, pathname, router]);

	return null;
}
