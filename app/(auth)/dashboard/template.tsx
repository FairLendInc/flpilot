"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export default function Template({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const previousPathname = useRef(pathname);

	useEffect(() => {
		// Only trigger view transition on route changes
		if (previousPathname.current !== pathname) {
			previousPathname.current = pathname;

			// Use View Transitions API if available
			if (document.startViewTransition) {
				document.startViewTransition(() => {
					// The transition happens automatically
				});
			}
		}
	}, [pathname]);

	return <>{children}</>;
}
