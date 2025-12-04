import { withAuth } from "@workos-inc/authkit-nextjs";
import { fetchQuery } from "convex/nextjs";
import { PropertyMapComponent } from "@/components/listing-detail/property-map";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { MortgageWithUrls } from "@/lib/types/convex";

type PropertyMapAsyncProps = {
	mortgageId: Id<"mortgages">;
};

/**
 * Async server component wrapper for PropertyMapComponent
 * Fetches mortgage location data independently and streams content progressively
 */
export async function PropertyMapAsync({ mortgageId }: PropertyMapAsyncProps) {
	const { accessToken } = await withAuth();

	// Fetch mortgage data for location
	const mortgage = (await fetchQuery(
		api.mortgages.getMortgage,
		{ id: mortgageId },
		{ token: accessToken }
	)) as MortgageWithUrls | null;

	if (!mortgage) {
		return null;
	}

	return (
		<PropertyMapComponent
			address={mortgage.address}
			location={mortgage.location}
		/>
	);
}
