"use client";

import { useAction } from "convex/react";
import type { UserIdentity } from "convex/server";
import { AlertCircle, ClipboardCheck } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { OwnershipTransferReview } from "@/components/admin/deals/OwnershipTransferReview";
import { DealPortalLoading } from "@/components/deal-portal/DealPortalLoading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { DEAL_STATE_LABELS_INVESTOR } from "@/lib/types/dealTypes";
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

/**
 * Ownership Review State Component
 *
 * For admins: Shows the OwnershipTransferReview component for approval/rejection
 * For investors: Shows a "Finalizing Transfer" status message
 */
function PendingOwnershipReviewState({
	dealId,
	viewer,
}: {
	dealId: Id<"deals">;
	viewer: UserIdentity;
}) {
	// Check if user is admin
	const isAdmin = (viewer as { role?: string })?.role === "admin";

	if (isAdmin) {
		return (
			<div className="container max-w-4xl py-8">
				<div className="mb-6">
					<h1 className="flex items-center gap-2 font-bold text-2xl">
						<ClipboardCheck className="h-6 w-6 text-primary" />
						Ownership Transfer Review
					</h1>
					<p className="text-muted-foreground">
						Review and approve the ownership transfer for this deal
					</p>
				</div>
				<OwnershipTransferReview
					dealId={dealId}
					onApproved={() => {
						toast.success("Transfer approved successfully");
					}}
					onRejected={() => {
						toast.info("Transfer rejected - deal returned to verification");
					}}
				/>
			</div>
		);
	}

	// Investor view - show "Finalizing Transfer" status
	return (
		<div className="flex flex-1 items-center justify-center p-6">
			<Card className="max-w-md">
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
						<ClipboardCheck className="h-8 w-8 text-primary" />
					</div>
					<CardTitle>
						{DEAL_STATE_LABELS_INVESTOR.pending_ownership_review}
					</CardTitle>
					<CardDescription>
						Your investment is in the final stages of processing
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4 text-center">
					<p className="text-muted-foreground text-sm">
						Our team is reviewing the ownership transfer details. This process
						typically takes 1-2 business days. You&apos;ll receive a notification
						once the transfer is complete.
					</p>
					<Badge
						className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
						variant="secondary"
					>
						Review in Progress
					</Badge>
				</CardContent>
			</Card>
		</div>
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

	// Handle pending_ownership_review state - admins can review, investors see status
	if (dealData.deal.currentState === "pending_ownership_review" && viewer) {
		return <PendingOwnershipReviewState dealId={dealId} viewer={viewer} />;
	}

	// Show error banner if Documenso fetch failed
	if (documensoError) {
		return (
			<div className="flex flex-1 items-center justify-center p-6">
				<Card className="max-w-md">
					<CardContent className="p-6">
						<div className="flex items-start gap-3">
							<AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
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
