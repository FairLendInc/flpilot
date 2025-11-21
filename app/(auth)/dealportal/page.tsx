"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuthenticatedQueryWithStatus } from "@/convex/lib/client";
import DealPortal from "../../../stories/dealPortal/DealPortal";
import type { DocumensoDocument } from "../../../stories/dealPortal/models/documenso";
import mockDocumensoRequest from "../../../stories/dealPortal/models/mockDocumensoRequest.json";
import {
	extractUsersFromDocumensoData,
	mapDocumensoToDealDocuments,
} from "../../../stories/dealPortal/utils/documensoMapper";

export default function DealPortalPage() {
	// Hardcoded deal ID for now, as per previous code
	const dealId = "q57f4w0j04mddz3h201hhe5fgs7tzz94" as Id<"deals">;

	// Fetch deal details from Convex
	// Note: This currently requires admin privileges.
	// If accessing as investor, ensure backend permissions allow it or use appropriate query.
	const {
		data: dealData,
		error,
		isPending,
		isError,
	} = useAuthenticatedQueryWithStatus(api.deals.getDealWithDetails, { dealId });

	if (isPending) {
		return (
			<div>
				{/* TODO: Replace with loading spinner or page. */}
				Loading...
			</div>
		);
	}

	if (isError) {
		return (
			<div>
				{/* TODO: Replace with error page. */}
				Error: {error.message}
			</div>
		);
	}

	// Cast the mock data to the expected type
	const documensoData = mockDocumensoRequest as unknown as DocumensoDocument;
	const currentUserEmail = "connor.beleznay@gmail.com"; // Using the email from mock data for testing
	const documents = mapDocumensoToDealDocuments(
		documensoData,
		currentUserEmail
	);
	const users = extractUsersFromDocumensoData(documensoData);

	console.debug("Documents:", {
		documents,
		documensoData,
		currentUserEmail,
		users,
		dealState: dealData?.deal?.currentState,
	});

	if (!dealData?.deal?.currentState) {
		return <div>Loading deal data...</div>;
	}

	const dealState = dealData.deal.currentState;

	if (dealState === "pending_lawyer") {
		return <div>Deal is in pending lawyer state</div>;
	}

	return (
		<DealPortal
			deal={dealData}
			dealId={dealId}
			initialDocuments={documents}
			initialUsers={users}
			profile={{ name: "Connor Beleznay" }}
			// Pass the real deal data if needed, or just the state
			user={{ id: "562879", email: currentUserEmail }}
		/>
	);
}
