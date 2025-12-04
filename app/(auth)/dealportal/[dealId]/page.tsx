"use client";

import { useAction } from "convex/react";
import type { UserIdentity } from "convex/server";
import { AlertCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DealPortalLoading } from "@/components/deal-portal/DealPortalLoading";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import {
	useAuthenticatedQuery,
	useAuthenticatedQueryWithStatus,
} from "@/convex/lib/client";
import { useDocumentGroupResolution } from "@/hooks/useDocumentCategorization";
import {
	extractUsers,
	mapDocumensoToDocument,
	mapDocumensoToDocumentLegacy,
} from "@/lib/mappers/documenso";
import type { DocumensoDocumentSummary } from "@/lib/types/documenso";
import { LawyerInviteManagement } from "@/stories/dealPortal/components/LawyerInviteManagement";
import { LawyerRepresentationConfirmation } from "@/stories/dealPortal/components/LawyerRepresentationConfirmation";
import DealPortal from "@/stories/dealPortal/DealPortal";

function PendingLawyerState({
	deal,
	dealId,
	viewer,
}: {
	deal: Doc<"deals">;
	dealId: Id<"deals">;
	viewer: UserIdentity;
}) {
	if (viewer === undefined) {
		return <DealPortalLoading />;
	}

	const isLawyer = viewer?.email === deal.lawyerEmail;

	if (isLawyer) {
		return <LawyerRepresentationConfirmation dealId={dealId} />;
	}

	return (
		<LawyerInviteManagement
			dealId={dealId}
			lawyerEmail={deal.lawyerEmail}
			lawyerLSONumber={deal.lawyerLSONumber}
			lawyerName={deal.lawyerName}
		/>
	);
}

export default function DealPortalPage() {
	const viewer = useAuthenticatedQuery(api.profile.getUserIdentity, {});
	const params = useParams();
	const dealId =
		typeof params.dealId === "string"
			? (params.dealId as Id<"deals">)
			: undefined;

	const { data: dealData, isPending } = useAuthenticatedQueryWithStatus(
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
	const [documensoError, setDocumensoError] = useState<string | null>(null);

	// Use dynamic document group resolution for Documenso documents
	const documentGroup = useDocumentGroupResolution(
		documensoData
			? {
					type: "documenso_document", // Generic type for Documenso documents
					metadata: {
						documentId: documensoData.id,
						externalId: documensoData.externalId,
						title: documensoData.title,
					},
				}
			: undefined
	);

	useEffect(() => {
		async function fetchDocumensoDocuments() {
			if (!dealDocuments || dealDocuments.length === 0) {
				setLoading(false);
				return;
			}

			const firstDoc = dealDocuments[0];
			if (firstDoc?.documensoDocumentId) {
				try {
					// Clear any previous errors
					setDocumensoError(null);

					const doc = await getDocumensoDocument({
						documentId: firstDoc.documensoDocumentId,
					});
					setDocumensoData(doc);
				} catch (error) {
					const errorMessage =
						error instanceof Error
							? error.message
							: "Failed to load document from Documenso";

					setDocumensoError(errorMessage);
					console.error("Error fetching Documenso document:", error);

					// Show user-visible error notification
					toast.error("Failed to load document", {
						description: errorMessage,
					});
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

	if (isPending || loading) {
		return <DealPortalLoading />;
	}

	if (!dealData?.deal?.currentState) {
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

	if (dealData.deal.currentState === "pending_lawyer" && viewer) {
		return (
			<PendingLawyerState
				deal={dealData.deal}
				dealId={dealId}
				viewer={viewer}
			/>
		);
	}

	// Show error banner if Documenso fetch failed
	if (documensoError) {
		return (
			<div className="flex flex-1 items-center justify-center p-6">
				<Card className="max-w-md">
					<CardContent className="p-6">
						<div className="flex items-start gap-3">
							<AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
							<div className="flex flex-col gap-2">
								<p className="font-medium text-sm">Failed to load documents</p>
								<p className="text-muted-foreground text-sm">
									{documensoError}
								</p>
								<button
									className="text-left text-primary text-sm hover:underline"
									onClick={() => window.location.reload()}
									type="button"
								>
									Refresh page to try again
								</button>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	const mappedDocuments =
		documensoData && documentGroup
			? [mapDocumensoToDocument(documensoData, documentGroup)]
			: documensoData
				? [mapDocumensoToDocumentLegacy(documensoData)] // Fallback if group resolution not ready
				: [];
	const initialUsers = documensoData ? extractUsers(documensoData) : [];

	return (
		<DealPortal
			deal={dealData}
			dealId={dealId}
			initialDocuments={mappedDocuments}
			initialUsers={initialUsers}
			profile={{
				name:
					[dealData?.investor?.first_name, dealData?.investor?.last_name]
						.filter(Boolean)
						.join(" ") || "Investor",
			}}
			user={viewer}
		/>
	);
}
