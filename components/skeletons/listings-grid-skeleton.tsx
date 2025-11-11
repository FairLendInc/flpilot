import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";

/**
 * Loading skeleton for listings grid page
 * Matches the exact layout of ListingGridShell with grid view and sticky map
 */
export function ListingsGridSkeleton() {
	return (
		<section className="grid w-screen grid-cols-12 gap-x-4 pt-4 pr-4">
			{/* Left column: Listing cards grid */}
			<div className="col-span-8">
				<ScrollArea className="relative h-[calc(100vh-7rem)]">
					<ProgressiveBlur height="15%" position="bottom" />
					<div className="grid gap-x-2 84rem:grid-cols-2 grid-cols-1 pr-4">
						{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
							<div key={i}>
								<div className="space-y-3 rounded-lg border p-4">
									<div className="flex gap-4 min-w-0">
										{/* Image skeleton */}
										<Skeleton className="h-48 w-48 border-none shrink-0 rounded-md md:max-w-[180px]" />

										{/* Content skeleton */}
										<div className="flex-1 space-y-2 min-w-0 overflow-hidden">
											<Skeleton className="h-6 w-3/4 max-w-full" />
											<Skeleton className="h-4 w-1/2 max-w-full" />
											<div className="mt-2 flex gap-2">
												<Skeleton className="h-4 w-16 shrink-0" />
												<Skeleton className="h-4 w-16 shrink-0" />
											</div>
											<div className="mt-3 flex gap-4 flex-wrap">
												<Skeleton className="h-5 w-20 shrink-0" />
												<Skeleton className="h-5 w-20 shrink-0" />
												<Skeleton className="h-5 w-20 shrink-0" />
											</div>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				</ScrollArea>
			</div>

			{/* Right column: Sticky map */}
			<div className="col-span-4">
				<div className="sticky top-30 h-[calc(100vh-8rem)]">
					<Skeleton className="mt-4 h-[calc(100vh-9rem)] w-full rounded-lg" />
				</div>
			</div>
		</section>
	);
}
