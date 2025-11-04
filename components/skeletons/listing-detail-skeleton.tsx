import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for listing detail page
 * Matches the layout with carousel, map, metrics, payment history, etc.
 */
export function ListingDetailSkeleton() {
	return (
		<div className="container mx-auto max-w-7xl px-4 py-8">
			{/* Breadcrumb skeleton */}
			<div className="mb-8 flex items-center gap-2">
				<Skeleton className="h-5 w-16" />
				<span className="text-muted-foreground">/</span>
				<Skeleton className="h-5 w-48" />
			</div>

			{/* Property info header */}
			<div className="mb-8 space-y-3">
				<Skeleton className="h-8 w-96" />
				<Skeleton className="h-5 w-64" />
				<Skeleton className="h-16 w-full" />
				<Skeleton className="h-6 w-24" />
			</div>

			{/* Image Carousel and Map Grid - TWO COLUMNS */}
			<div className="mb-12 grid gap-6 lg:grid-cols-2">
				{/* Left: Image Carousel skeleton */}
				<div className="space-y-4">
					{/* Main carousel image */}
					<Skeleton className="h-96 w-full rounded-lg" />
					{/* Thumbnail strip */}
					<div className="flex gap-2 overflow-x-auto">
						{[1, 2, 3, 4, 5].map((i) => (
							<Skeleton
								className="h-20 w-20 flex-shrink-0 rounded-md"
								key={i}
							/>
						))}
					</div>
				</div>

				{/* Right: Property Map skeleton */}
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
			</div>

			{/* Financial metrics grid */}
			<div className="mb-12">
				<Skeleton className="mb-4 h-7 w-48" />
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					{[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
						<div className="space-y-2 rounded-lg border p-4" key={i}>
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-6 w-24" />
						</div>
					))}
				</div>
			</div>

			{/* Payment History - 12 months */}
			<div className="mb-12">
				<Skeleton className="mb-4 h-7 w-48" />
				<div className="space-y-2">
					{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
						<div
							className="flex items-center gap-4 rounded-lg border p-4"
							key={i}
						>
							<Skeleton className="h-5 w-24" />
							<Skeleton className="h-5 w-32" />
							<Skeleton className="h-5 w-28" />
							<Skeleton className="ml-auto h-6 w-20" />
						</div>
					))}
				</div>
			</div>

			{/* Appraisal data */}
			<div className="mb-12">
				<Skeleton className="mb-4 h-7 w-48" />
				<div className="grid gap-4 md:grid-cols-3">
					{[1, 2, 3].map((i) => (
						<div className="space-y-2 rounded-lg border p-4" key={i}>
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-6 w-24" />
						</div>
					))}
				</div>
			</div>

			{/* Comparable Properties - 6 properties */}
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

			{/* Request listing section */}
			<div className="space-y-4 rounded-lg border bg-muted/50 p-6">
				<Skeleton className="h-6 w-64" />
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-10 w-40" />
			</div>
		</div>
	);
}
