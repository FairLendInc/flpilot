import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for property map component
 * Matches PropertyMapComponent layout with controls overlay
 */
export function PropertyMapSkeleton() {
	return (
		<div className="relative">
			<Skeleton className="h-96 w-full rounded-lg" />
			{/* Map controls overlay */}
			<div className="absolute top-4 right-4 space-y-2">
				<Skeleton className="h-10 w-10 rounded-md" />
				<Skeleton className="h-10 w-10 rounded-md" />
			</div>
			{/* Address marker indicator */}
			<div className="absolute bottom-4 left-4">
				<Skeleton className="h-8 w-32 rounded-md" />
			</div>
		</div>
	);
}
