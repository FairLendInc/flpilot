import { withAuth } from "@workos-inc/authkit-nextjs";
import { fetchQuery } from "convex/nextjs";
import { ImageCarousel } from "@/components/listing-detail/image-carousel";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { transformMortgageToImages } from "@/lib/transforms/mortgage";
import type { MortgageWithUrls } from "@/lib/types/convex";

type ImageCarouselAsyncProps = {
	mortgageId: Id<"mortgages">;
};

/**
 * Async server component wrapper for ImageCarousel
 * Fetches mortgage images independently and streams content progressively
 */
export async function ImageCarouselAsync({
	mortgageId,
}: ImageCarouselAsyncProps) {
	const { accessToken } = await withAuth();

	// Fetch mortgage data with images
	const mortgage = (await fetchQuery(
		api.mortgages.getMortgage,
		{ id: mortgageId },
		{ token: accessToken }
	)) as MortgageWithUrls | null;

	if (!mortgage) {
		return null;
	}

	// Transform images for component
	const images = transformMortgageToImages(mortgage);
	const propertyTitle = mortgage.address.street;

	return <ImageCarousel images={images} propertyTitle={propertyTitle} />;
}
