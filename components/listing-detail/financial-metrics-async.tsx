import { withAuth } from "@workos-inc/authkit-nextjs";
import { fetchQuery } from "convex/nextjs";
import { FinancialMetrics } from "@/components/listing-detail/financial-metrics";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { transformMortgageToFinancials } from "@/lib/transforms/mortgage";
import type { MortgageWithUrls } from "@/lib/types/convex";

type FinancialMetricsAsyncProps = {
	mortgageId: Id<"mortgages">;
};

/**
 * Async server component wrapper for FinancialMetrics
 * Fetches mortgage financial data independently and streams content progressively
 */
export async function FinancialMetricsAsync({
	mortgageId,
}: FinancialMetricsAsyncProps) {
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

	// Transform to financial metrics
	const financials = transformMortgageToFinancials(mortgage);

	return <FinancialMetrics financials={financials} />;
}
