import { withAuth } from "@workos-inc/authkit-nextjs";
import { fetchQuery } from "convex/nextjs";
import { DocumentViewerWrapper } from "@/components/listing-detail/document-viewer-wrapper";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { transformMortgageToDocuments } from "@/lib/transforms/mortgage";
import type { MortgageWithUrls } from "@/lib/types/convex";

type DocumentViewerAsyncProps = {
	mortgageId: Id<"mortgages">;
};

/**
 * Async server component wrapper for DocumentViewerWrapper
 * Fetches mortgage documents independently and streams content progressively
 */
export async function DocumentViewerAsync({
	mortgageId,
}: DocumentViewerAsyncProps) {
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

	// Transform documents for component
	const documents = transformMortgageToDocuments(mortgage);

	// Return null if no documents (section won't render)
	if (!documents || documents.length === 0) {
		return null;
	}

	return <DocumentViewerWrapper documents={documents} />;
}
