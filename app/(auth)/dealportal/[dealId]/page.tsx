"use client";

import { useAction } from "convex/react";
import { AlertCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DealPortalLoading } from "@/components/deal-portal/DealPortalLoading";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuthenticatedQuery } from "@/convex/lib/client";
import type { DocumensoDocumentSummary } from "@/lib/types/documenso";
import DealPortal from "@/stories/dealPortal/DealPortal";
import {
	ActionTypeEnum,
	FairLendRole,
} from "@/stories/dealPortal/utils/dealLogic";

// Map Documenso role to FairLendRole
function mapRole(role: string): FairLendRole {
	switch (role) {
		case "SIGNER":
			return FairLendRole.BUYER;
		case "APPROVER":
			return FairLendRole.LAWYER;
		case "VIEWER":
			return FairLendRole.BROKER;
		default:
			return FairLendRole.NONE;
	}
}

// Map Documenso document to DealPortal document format
function mapDocumensoToDocument(doc: DocumensoDocumentSummary) {
	const pendingRecipient = doc.recipients
		.sort((a, b) => (a.signingOrder ?? 0) - (b.signingOrder ?? 0))
		.find((r) => r.signingStatus !== "SIGNED");

	let requiredAction = ActionTypeEnum.NONE;
	if (pendingRecipient) {
		if (pendingRecipient.role === "SIGNER")
			requiredAction = ActionTypeEnum.ESIGN;
		else if (pendingRecipient.role === "APPROVER")
			requiredAction = ActionTypeEnum.APPROVE;
		else requiredAction = ActionTypeEnum.REVIEW;
	} else if (doc.status === "COMPLETED") {
		requiredAction = ActionTypeEnum.COMPLETE;
	}

	return {
		id: String(doc.id),
		name: doc.title,
		group: "mortgage",
		status: doc.status,
		requiredAction,
		assignedTo: pendingRecipient?.email || "",
		assignedToRole: pendingRecipient
			? mapRole(pendingRecipient.role)
			: FairLendRole.NONE,
		isComplete: doc.status === "COMPLETED",
		recipientTokens: Object.fromEntries(
			doc.recipients.filter((r) => r.token).map((r) => [r.email, r.token])
		),
		recipientStatus: Object.fromEntries(
			doc.recipients.map((r) => [r.email, r.signingStatus])
		),
		signingSteps: doc.recipients
			.sort((a, b) => (a.signingOrder ?? 0) - (b.signingOrder ?? 0))
			.map((r) => ({
				email: r.email,
				name: r.name,
				role: mapRole(r.role),
				status: r.signingStatus,
				order: r.signingOrder ?? 0,
			})),
	};
}

// Extract users from Documenso recipients
function extractUsers(doc: DocumensoDocumentSummary) {
	return doc.recipients.map((r) => ({
		id: String(r.id),
		email: r.email,
		name: r.name,
		role: mapRole(r.role),
	}));
}

export default function DealPortalPage() {
	const params = useParams();
	const dealId =
		typeof params.dealId === "string"
			? (params.dealId as Id<"deals">)
			: undefined;

	const deal = useAuthenticatedQuery(
		api.deals.getDealWithDetails,
		dealId ? { dealId } : "skip"
	);

	const dealDocuments = useAuthenticatedQuery(
		api.deal_documents.getDealDocuments,
		dealId ? { dealId } : "skip"
	);

	const getDocumensoDocument = useAction(api.documenso.getDocumentAction);

	const [documensoData, setDocumensoData] =
		useState<DocumensoDocumentSummary | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function fetchDocumensoDocuments() {
			if (!dealDocuments || dealDocuments.length === 0) {
				setLoading(false);
				return;
			}

			const firstDoc = dealDocuments[0];
			if (firstDoc?.documensoDocumentId) {
				try {
					const doc = await getDocumensoDocument({
						documentId: firstDoc.documensoDocumentId,
					});
					setDocumensoData(doc);
				} catch (error) {
					console.error("Error fetching Documenso document:", error);
				}
			}
			setLoading(false);
		}

		if (dealDocuments !== undefined) {
			fetchDocumensoDocuments();
		}
	}, [dealDocuments, getDocumensoDocument]);

	if (!dealId) {
		return (
			<div className="flex flex-1 items-center justify-center p-6">
				<Card className="max-w-md">
					<CardContent className="flex items-center gap-3 p-6">
						<AlertCircle className="h-5 w-5 text-destructive" />
						<p className="text-muted-foreground text-sm">Invalid deal ID</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!deal || loading) {
		return <DealPortalLoading />;
	}

	if (!deal.deal) {
		return (
			<div className="flex flex-1 items-center justify-center p-6">
				<Card className="max-w-md">
					<CardContent className="flex items-center gap-3 p-6">
						<AlertCircle className="h-5 w-5 text-destructive" />
						<p className="text-muted-foreground text-sm">Deal not found</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	const mappedDocuments = documensoData
		? [mapDocumensoToDocument(documensoData)]
		: [];
	const initialUsers = documensoData ? extractUsers(documensoData) : [];

	return (
		<DealPortal
			deal={deal}
			dealId={dealId}
			initialDocuments={mappedDocuments}
			initialUsers={initialUsers}
			profile={{
				name:
					[deal.investor?.first_name, deal.investor?.last_name]
						.filter(Boolean)
						.join(" ") || "Investor",
			}}
			user={{ id: deal.investor?._id, email: deal.investor?.email }}
		/>
	);
}
