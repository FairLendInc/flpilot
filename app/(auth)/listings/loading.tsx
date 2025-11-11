import { ListingsGridSkeleton } from "@/components/skeletons";

/**
 * Listings page loading UI
 * Displayed while listings data is being preloaded from the server
 */
export default function Loading() {
	return <ListingsGridSkeleton />;
}
