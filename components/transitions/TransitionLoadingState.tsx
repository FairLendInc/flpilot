"use client";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * TransitionLoadingState - Loading skeleton for smooth transitions
 *
 * Provides consistent loading UI during view transitions
 * Maintains layout stability with skeleton components
 */
export function TransitionLoadingState() {
	return (
		<div className="min-h-[200px] w-full">
			<div className="container mx-auto px-4 py-6">
				<div className="mb-6">
					<Skeleton className="h-8 w-48" />
				</div>
				<div className="space-y-4">
					<div className="grid grid-cols-1 gap-4">
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-3/4" />
					</div>
					<div className="grid grid-cols-2 gap-4">
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-full" />
					</div>
					<div className="grid grid-cols-3 gap-4">
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-full" />
					</div>
				</div>
			</div>
		</div>
	);
}
