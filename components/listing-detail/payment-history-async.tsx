import { withAuth } from "@workos-inc/authkit-nextjs";
import { fetchQuery } from "convex/nextjs";
import { PaymentHistory } from "@/components/listing-detail/payment-history";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { transformPayments } from "@/lib/transforms/mortgage";
import type { Payment } from "@/lib/types/convex";

type PaymentHistoryAsyncProps = {
	mortgageId: Id<"mortgages">;
};

/**
 * Async server component wrapper for PaymentHistory
 * Fetches payment history independently and streams content progressively
 */
export async function PaymentHistoryAsync({
	mortgageId,
}: PaymentHistoryAsyncProps) {
	const { accessToken } = await withAuth();

	// Fetch payments for this mortgage
	const payments = (await fetchQuery(
		api.payments.getPaymentsForMortgage,
		{ mortgageId },
		{ token: accessToken }
	)) as Payment[] | null;

	// Return null if no payments (section won't render)
	if (!payments || payments.length === 0) {
		return null;
	}

	// Transform payments for component
	const transformedPayments = transformPayments(payments, mortgageId);

	return <PaymentHistory payments={transformedPayments} />;
}
