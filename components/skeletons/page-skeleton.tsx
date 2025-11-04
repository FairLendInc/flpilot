import { Skeleton } from "@/components/ui/skeleton";

/**
 * Generic page loading skeleton
 * Used for basic pages with header and content area
 */
export function PageSkeleton() {
	return (
		<div className="min-h-screen">
			{/* Header skeleton */}
			<div className="sticky top-0 z-10 flex flex-row items-center justify-between border-slate-200 border-b-2 bg-background p-4 dark:border-slate-800">
				<Skeleton className="h-6 w-32" />
				<Skeleton className="h-9 w-24" />
			</div>

			{/* Main content skeleton */}
			<main className="flex flex-col gap-8 p-8">
				<Skeleton className="mx-auto h-10 w-64" />

				<div className="mx-auto flex w-full max-w-lg flex-col gap-8">
					<Skeleton className="h-6 w-full" />
					<Skeleton className="h-6 w-full" />
					<Skeleton className="h-10 w-40" />
					<Skeleton className="h-6 w-full" />
					<Skeleton className="h-6 w-3/4" />
					<Skeleton className="h-6 w-full" />
				</div>
			</main>
		</div>
	);
}
