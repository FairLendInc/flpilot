import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for image carousel component
 * Matches ImageCarousel component layout with main image and thumbnails
 */
export function ImageCarouselSkeleton() {
	return (
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
	);
}
