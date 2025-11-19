import { withAuth } from "@workos-inc/authkit-nextjs";
import { fetchQuery } from "convex/nextjs";
import { ComparableProperties } from "@/components/listing-detail/comparable-properties";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { transformComparables } from "@/lib/transforms/mortgage";
import type { AppraisalComparableWithUrl } from "@/lib/types/convex";

type ComparablePropertiesAsyncProps = {
	mortgageId: Id<"mortgages">;
};

/**
 * Async server component wrapper for ComparableProperties
 * Fetches comparable properties independently and streams content progressively
 */
export async function ComparablePropertiesAsync({
	mortgageId,
}: ComparablePropertiesAsyncProps) {
	const { accessToken } = await withAuth();

	// Fetch comparables for this mortgage
	const comparables = (await fetchQuery(
		api.comparables.getComparablesForMortgage,
		{ mortgageId },
		{ token: accessToken }
	)) as AppraisalComparableWithUrl[] | null;

	// Return null if no comparables (section won't render)
	if (!comparables || comparables.length === 0) {
		return null;
	}

	// Transform comparables for component
	const transformedComparables = transformComparables(comparables);

	return <ComparableProperties comparables={transformedComparables} />;
}
