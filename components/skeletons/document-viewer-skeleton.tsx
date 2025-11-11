import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for document viewer component
 * Matches DocumentViewerWrapper component layout
 */
export function DocumentViewerSkeleton() {
	return (
		<div className="mb-12">
			<Skeleton className="mb-4 h-7 w-48" />
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{[1, 2, 3].map((i) => (
					<div className="space-y-3 rounded-lg border p-4" key={i}>
						<Skeleton className="h-32 w-full rounded-md" />
						<Skeleton className="h-5 w-3/4" />
						<Skeleton className="h-4 w-1/2" />
					</div>
				))}
			</div>
		</div>
	);
}
