"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, startTransition } from "react";

export type TransitionType = "slide" | "cross-fade" | "none";

export type ViewTransitionWrapperProps = {
	children: ReactNode;
	type?: TransitionType;
	sharedElements?: string[];
	className?: string;
	name?: string;
};

/**
 * ViewTransitionWrapper - Central wrapper for React 19 View Transitions
 *
 * Provides automatic route detection and transition type selection
 * Integrates with Next.js App Router using startTransition
 * Supports shared element transitions for smooth animations
 */
export function AppViewTransition({
	children,
	type = "slide",
	sharedElements = [],
	className = "",
	name,
}: ViewTransitionWrapperProps) {
	const pathname = usePathname();

	// Determine transition type based on route hierarchy
	const getTransitionType = (): TransitionType => {
		// Main navigation routes use slide transitions
		if (pathname === "/" || pathname.startsWith("/listings")) {
			return "slide";
		}
		// Content changes within same page use cross-fade
		return "cross-fade";
	};

	const transitionType = type || getTransitionType();

	// Handle navigation with startTransition for smooth transitions
	const _handleNavigation = (callback: () => void) => {
		startTransition(callback);
	};

	return (
		<div
			className={`${className} transition-${transitionType}`}
			data-shared-elements={sharedElements.join(",")}
			data-vt-name={name ?? ""}
		>
			{children}
		</div>
	);
}

/**
 * Hook for navigation with transitions
 * Wraps navigation callbacks with startTransition
 */
export function useNavigationTransition() {
	const handleNavigation = (callback: () => void) => {
		startTransition(callback);
	};

	return { handleNavigation };
}

// Backwards compatibility alias
export const ViewTransitionWrapper = AppViewTransition;
