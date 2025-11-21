import DealPortal from "../../../stories/dealPortal/DealPortal";
import type { DocumensoDocument } from "../../../stories/dealPortal/models/documenso";
import mockDocumensoRequest from "../../../stories/dealPortal/models/mockDocumensoRequest.json";
import {
	extractUsersFromDocumensoData,
	mapDocumensoToDealDocuments,
} from "../../../stories/dealPortal/utils/documensoMapper";

export default function DealPortalPage() {
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
	});
	return (
		<DealPortal
			dealId="deal-123"
			initialDocuments={documents}
			initialUsers={users}
			profile={{ name: "Connor Beleznay" }}
			user={{ id: "562879", email: currentUserEmail }}
		/>
	);
}
