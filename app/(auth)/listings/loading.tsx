import { ListingsGridSkeleton } from "@/components/skeletons";

/**
 * Listings page loading UI
 * Displayed while client-side authenticated listings queries are loading
 */
export default function Loading() {
	return <ListingsGridSkeleton />;
}
