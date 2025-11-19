import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for property info header section
 * Matches PropertyInfo component layout
 */
export function PropertyInfoSkeleton() {
	return (
		<div className="mb-8 space-y-3">
			<Skeleton className="h-8 w-96" />
			<Skeleton className="h-5 w-64" />
			<Skeleton className="h-16 w-full" />
			<Skeleton className="h-6 w-24" />
		</div>
	);
}
