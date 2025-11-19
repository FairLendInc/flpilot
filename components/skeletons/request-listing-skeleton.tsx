import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for request listing section
 * Matches RequestListingSection component layout
 */
export function RequestListingSkeleton() {
	return (
		<div className="space-y-4 rounded-lg border bg-muted/50 p-6">
			<Skeleton className="h-6 w-64" />
			<Skeleton className="h-4 w-full" />
			<Skeleton className="h-10 w-40" />
		</div>
	);
}
