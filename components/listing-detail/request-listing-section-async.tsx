import { withAuth } from "@workos-inc/authkit-nextjs";
import { fetchQuery } from "convex/nextjs";
import { RequestListingSection } from "@/components/listing-detail/request-listing-section";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { MortgageWithUrls } from "@/lib/types/convex";

type RequestListingSectionAsyncProps = {
	mortgageId: Id<"mortgages">;
};

/**
 * Async server component wrapper for RequestListingSection
 * Fetches listing data independently and streams content progressively
 */
export async function RequestListingSectionAsync({
	mortgageId,
}: RequestListingSectionAsyncProps) {
	const { accessToken } = await withAuth();

	// Fetch listing data for this mortgage
	const listingData = await fetchQuery(
		api.listings.getListingByMortgage,
		{ mortgageId },
		{ token: accessToken }
	);

	// Also fetch mortgage data for the listing prop
	const mortgage = (await fetchQuery(
		api.mortgages.getMortgage,
		{ id: mortgageId },
		{ token: accessToken }
	)) as MortgageWithUrls | null;

	// Return null if no listing data
	if (!(listingData && mortgage)) {
		return null;
	}

	// Transform mortgage data to match RequestListingSection listing prop
	const listing = {
		_id: mortgage._id,
		title: mortgage.address.street,
		address: mortgage.address,
		financials: {
			currentValue: mortgage.appraisalMarketValue,
		},
	};

	return (
		<RequestListingSection
			isLocked={listingData.locked}
			listing={listing}
			listingId={listingData._id}
		/>
	);
}
