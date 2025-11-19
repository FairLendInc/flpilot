import { withAuth } from "@workos-inc/authkit-nextjs";
import { fetchQuery } from "convex/nextjs";
import { PropertyInfo } from "@/components/listing-detail/property-info";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { MortgageWithUrls } from "@/lib/types/convex";

type PropertyInfoAsyncProps = {
	mortgageId: Id<"mortgages">;
};

/**
 * Async server component wrapper for PropertyInfo
 * Fetches basic mortgage data for property header independently
 */
export async function PropertyInfoAsync({
	mortgageId,
}: PropertyInfoAsyncProps) {
	const { accessToken } = await withAuth();

	// Fetch mortgage data
	const mortgage = (await fetchQuery(
		api.mortgages.getMortgage,
		{ id: mortgageId },
		{ token: accessToken }
	)) as MortgageWithUrls | null;

	if (!mortgage) {
		return null;
	}

	// Map mortgage type for display
	const mortgageTypeDisplay =
		mortgage.mortgageType === "1st"
			? "First"
			: mortgage.mortgageType === "2nd"
				? "Second"
				: "Other";

	const investorBrief = `Investment opportunity at ${mortgage.address.street}, ${mortgage.address.city}. ${mortgageTypeDisplay} ${mortgage.propertyType} with ${mortgage.interestRate}% interest rate. Appraised at $${mortgage.appraisalMarketValue.toLocaleString()} with ${mortgage.ltv}% LTV.`;

	return (
		<PropertyInfo
			address={mortgage.address}
			investorBrief={investorBrief}
			status={mortgage.status}
			title={mortgage.address.street}
		/>
	);
}
