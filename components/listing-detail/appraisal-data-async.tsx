import { withAuth } from "@workos-inc/authkit-nextjs";
import { fetchQuery } from "convex/nextjs";
import { AppraisalData } from "@/components/listing-detail/appraisal-data";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { transformMortgageToAppraisal } from "@/lib/transforms/mortgage";
import type { MortgageWithUrls } from "@/lib/types/convex";

type AppraisalDataAsyncProps = {
	mortgageId: Id<"mortgages">;
};

/**
 * Async server component wrapper for AppraisalData
 * Fetches appraisal data independently and streams content progressively
 */
export async function AppraisalDataAsync({
	mortgageId,
}: AppraisalDataAsyncProps) {
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

	// Transform appraisal data
	const appraisal = transformMortgageToAppraisal(mortgage);

	return (
		<AppraisalData
			appraisal={{
				value: appraisal.marketValue,
				date: appraisal.date,
				appraiser: appraisal.company,
				method: appraisal.method,
			}}
			currentValue={mortgage.appraisalMarketValue}
		/>
	);
}
