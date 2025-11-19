import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for comparable properties grid
 * Matches ComparableProperties component layout with 6 property cards
 */
export function ComparablePropertiesSkeleton() {
	return (
		<div className="mb-12">
			<Skeleton className="mb-4 h-7 w-48" />
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{[1, 2, 3, 4, 5, 6].map((i) => (
					<div className="space-y-3 rounded-lg border p-4" key={i}>
						<Skeleton className="h-40 w-full rounded-md" />
						<Skeleton className="h-5 w-3/4" />
						<Skeleton className="h-4 w-1/2" />
						<div className="flex gap-4">
							<Skeleton className="h-5 w-20" />
							<Skeleton className="h-5 w-20" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
