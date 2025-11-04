"use client";

import { usePathname, useRouter } from "next/navigation";
import { startTransition } from "react";

/**
 * Hook for navigation with transitions
 * Wraps navigation callbacks with startTransition for smooth animations
 * Detects navigation direction for appropriate slide transitions
 */
export function useNavigationTransition() {
	const router = useRouter();
	const pathname = usePathname();

	const handleNavigation = (href: string) => {
		startTransition(() => {
			router.push(href);
		});
	};

	const getNavigationDirection = (
		targetPath: string
	): "left" | "right" | "none" => {
		const currentPath = pathname;

		// Simple direction detection based on path hierarchy
		if (currentPath === "/" && targetPath.startsWith("/listings")) {
			return "right";
		}
		if (targetPath === "/listings" && currentPath.startsWith("/listings/")) {
			return "left";
		}
		if (targetPath.startsWith("/listings/") && currentPath === "/") {
			return "right";
		}

		return "none";
	};

	return {
		handleNavigation,
		getNavigationDirection,
	};
}
