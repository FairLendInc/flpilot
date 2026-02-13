"use client";

import { useAction } from "convex/react";
import type { UserIdentity } from "convex/server";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { format } from "date-fns";
import {
	AlertCircle,
	Calendar,
	CheckCircle2,
	ClipboardCheck,
	DollarSign,
	FileText,
	Home,
	Landmark,
	Percent,
	Scale,
	UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { OwnershipTransferReview } from "@/components/admin/deals/OwnershipTransferReview";
import { DealPortalLoading } from "@/components/deal-portal/DealPortalLoading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import {
	useAuthenticatedQuery,
	useAuthenticatedQueryWithStatus,
} from "@/convex/lib/client";

import {
	extractUsers,
	mapDocumensoToDocument,
	mapDocumensoToDocumentLegacy,
} from "@/lib/mappers/documenso";
import { DEAL_STATE_LABELS_INVESTOR } from "@/lib/types/dealTypes";
import type { DocumensoDocumentSummary } from "@/lib/types/documenso";
import { LawyerInviteManagement } from "@/stories/dealPortal/components/LawyerInviteManagement";
import { LawyerRepresentationConfirmation } from "@/stories/dealPortal/components/LawyerRepresentationConfirmation";
import DealPortal from "@/stories/dealPortal/DealPortal";

type UserIdentityWithRole = UserIdentity & { role?: string };

function PendingLawyerState({
	deal,
	dealId,
	viewer,
}: {
	deal: Doc<"deals">;
	dealId: Id<"deals">;
	viewer: UserIdentityWithRole;
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
	viewer: UserIdentityWithRole;
}) {
	// Check if user is admin
	const isAdmin = viewer?.role === "admin";

	// Fetch comprehensive deal data for admin view
	const dealData = useAuthenticatedQueryWithStatus(
		api.deals.getDealWithDetails,
		isAdmin ? { dealId } : "skip"
	);

	if (!isAdmin) {
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
							typically takes 1-2 business days. You&apos;ll receive a
							notification once the transfer is complete.
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

	// Admin view - check loading state
	if (dealData.isPending) {
		return <DealPortalLoading />;
	}

	const normalizedDealData =
		dealData.data === null || dealData.data === undefined
			? undefined
			: {
					...dealData.data,
					mortgage: dealData.data.mortgage ?? undefined,
					investor: dealData.data.investor ?? undefined,
				};

	// Admin view - show comprehensive ownership review
	return (
		<div className="container max-w-6xl space-y-6 py-8">
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
				dealData={normalizedDealData}
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

function formatCurrency(value?: number) {
	if (typeof value !== "number" || !Number.isFinite(value)) return "N/A";
	return new Intl.NumberFormat("en-CA", {
		style: "currency",
		currency: "CAD",
		maximumFractionDigits: 0,
	}).format(value);
}

function formatDate(value?: number) {
	if (!value) return "N/A";
	return format(new Date(value), "PPP");
}

function formatDateTime(value?: number) {
	if (!value) return "N/A";
	return format(new Date(value), "PPP 'at' p");
}

function DealCompleteState({
	dealData,
}: {
	dealData: NonNullable<typeof api.deals.getDealWithDetails._returnType>;
}) {
	const deal = dealData.deal;
	const mortgage = dealData.mortgage;
	const lockRequest = dealData.lockRequest;
	const investor = dealData.investor;

	const purchasePercentage = deal.purchasePercentage ?? 100;
	const loanAmount = mortgage?.loanAmount;
	const estimatedInvestment =
		typeof loanAmount === "number"
			? Math.round(loanAmount * (purchasePercentage / 100))
			: undefined;

	const timelineEntries =
		deal.stateHistory && deal.stateHistory.length > 0
			? [...deal.stateHistory]
					.sort((a, b) => a.timestamp - b.timestamp)
					.map((entry) => ({
						label:
							(DEAL_STATE_LABELS_INVESTOR as Record<string, string>)[
								entry.toState
							] ??
							entry.toState
								.replace(/_/g, " ")
								.replace(/\b\w/g, (letter: string) => letter.toUpperCase()),
						date: entry.timestamp,
						note: entry.notes,
					}))
			: [
					{
						label: "Deal Created",
						date: deal.createdAt,
						note: undefined,
					},
					{
						label: "Deal Completed",
						date: deal.completedAt ?? deal.updatedAt,
						note: undefined,
					},
				];

	return (
		<div className="relative min-h-screen bg-gradient-to-b from-teal-50 via-white to-white">
			<div className="pointer-events-none absolute inset-0">
				<div className="-top-24 absolute right-0 h-64 w-64 rounded-full bg-teal-200/40 blur-3xl" />
				<div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl" />
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(13,148,136,0.18),_transparent_55%)]" />
			</div>

			<div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
				<Card className="border-teal-100 bg-white/90 shadow-sm backdrop-blur">
					<CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
						<div className="flex flex-col gap-4">
							<div className="flex items-center gap-3">
								<div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-600 text-white">
									<CheckCircle2 className="h-6 w-6" />
								</div>
								<div>
									<p className="text-sm text-teal-700 uppercase tracking-[0.18em]">
										Deal Complete
									</p>
									<h1 className="font-semibold text-2xl text-slate-900 md:text-3xl">
										Congratulations to everyone involved
									</h1>
								</div>
							</div>
							<p className="max-w-2xl text-slate-600 text-sm leading-relaxed">
								Your investment has officially closed. The mortgage ownership
								transfer is complete and your portfolio is updated with this
								property.
							</p>
							<div className="flex flex-wrap items-center gap-3">
								<Badge
									className="bg-teal-100 text-teal-800"
									variant="secondary"
								>
									Closed {formatDate(deal.completedAt)}
								</Badge>
								<Badge
									className="bg-slate-100 text-slate-700"
									variant="secondary"
								>
									Deal ID: {deal._id}
								</Badge>
							</div>
						</div>
						<div className="flex flex-col gap-3 rounded-2xl border border-teal-100 bg-teal-50/70 p-4 text-sm">
							<div className="flex items-center gap-2 text-teal-700">
								<DollarSign className="h-4 w-4" />
								<span className="font-medium">Investment Summary</span>
							</div>
							<div className="space-y-1 text-slate-700">
								<p>
									<span className="text-slate-500">Purchase:</span>{" "}
									{purchasePercentage.toFixed(2)}%
								</p>
								<p>
									<span className="text-slate-500">Deal Value:</span>{" "}
									{formatCurrency(deal.dealValue ?? loanAmount)}
								</p>
								<p>
									<span className="text-slate-500">Estimated Investment:</span>{" "}
									{formatCurrency(estimatedInvestment ?? deal.dealValue)}
								</p>
							</div>
							<Button asChild className="mt-2 bg-teal-600 hover:bg-teal-700">
								<Link href="/dashboard/investor/portfolio">
									View Your Portfolio
								</Link>
							</Button>
						</div>
					</CardContent>
				</Card>

				<div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
					<div className="grid gap-6 md:grid-cols-2">
						<Card className="border-slate-200 bg-white/90 shadow-sm backdrop-blur">
							<CardHeader className="pb-3">
								<CardTitle className="flex items-center gap-2 text-base text-slate-900">
									<Home className="h-4 w-4 text-teal-600" />
									Property Information
								</CardTitle>
								<CardDescription className="text-slate-500">
									{mortgage?.address
										? `${mortgage.address.street}, ${mortgage.address.city}, ${mortgage.address.state}`
										: "Address unavailable"}
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4 text-slate-700 text-sm">
								<div className="flex flex-col gap-1">
									<span className="text-slate-500">Property Type</span>
									<span className="font-medium">
										{mortgage?.propertyType ?? "N/A"}
									</span>
								</div>
								<div className="flex flex-col gap-1">
									<span className="text-slate-500">Mortgage ID</span>
									<span className="break-all font-mono text-slate-600 text-xs">
										{mortgage?._id ?? "N/A"}
									</span>
								</div>
							</CardContent>
						</Card>

						<Card className="border-slate-200 bg-white/90 shadow-sm backdrop-blur">
							<CardHeader className="pb-3">
								<CardTitle className="flex items-center gap-2 text-base text-slate-900">
									<Landmark className="h-4 w-4 text-teal-600" />
									Mortgage Details
								</CardTitle>
								<CardDescription className="text-slate-500">
									Loan and rate information
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3 text-slate-700 text-sm">
								<div className="flex items-center justify-between">
									<span className="text-slate-500">Loan Amount</span>
									<span>{formatCurrency(mortgage?.loanAmount)}</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-slate-500">Interest Rate</span>
									<span>
										{typeof mortgage?.interestRate === "number"
											? `${mortgage.interestRate.toFixed(2)}%`
											: "N/A"}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-slate-500">Purchase Percentage</span>
									<span>{purchasePercentage.toFixed(2)}%</span>
								</div>
							</CardContent>
						</Card>

						<Card className="border-slate-200 bg-white/90 shadow-sm backdrop-blur">
							<CardHeader className="pb-3">
								<CardTitle className="flex items-center gap-2 text-base text-slate-900">
									<UserCheck className="h-4 w-4 text-teal-600" />
									Parties
								</CardTitle>
								<CardDescription className="text-slate-500">
									Primary stakeholders
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3 text-slate-700 text-sm">
								<div className="flex items-center justify-between">
									<span className="text-slate-500">Investor</span>
									<span>
										{investor
											? `${investor.first_name ?? ""} ${investor.last_name ?? ""}`.trim() ||
												investor.email
											: "N/A"}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-slate-500">Platform</span>
									<span>FairLend</span>
								</div>
							</CardContent>
						</Card>

						<Card className="border-slate-200 bg-white/90 shadow-sm backdrop-blur">
							<CardHeader className="pb-3">
								<CardTitle className="flex items-center gap-2 text-base text-slate-900">
									<Scale className="h-4 w-4 text-teal-600" />
									Lawyer Information
								</CardTitle>
								<CardDescription className="text-slate-500">
									Closing counsel details
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3 text-slate-700 text-sm">
								<div className="flex items-center justify-between">
									<span className="text-slate-500">Lawyer Name</span>
									<span>{lockRequest?.lawyerName ?? "N/A"}</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-slate-500">Lawyer Email</span>
									<span>{lockRequest?.lawyerEmail ?? "N/A"}</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-slate-500">LSO Number</span>
									<span>{lockRequest?.lawyerLSONumber ?? "N/A"}</span>
								</div>
							</CardContent>
						</Card>

						<Card className="border-slate-200 bg-white/90 shadow-sm backdrop-blur md:col-span-2">
							<CardHeader className="pb-3">
								<CardTitle className="flex items-center gap-2 text-base text-slate-900">
									<FileText className="h-4 w-4 text-teal-600" />
									Deal Summary
								</CardTitle>
								<CardDescription className="text-slate-500">
									Everything recorded for this transaction
								</CardDescription>
							</CardHeader>
							<CardContent className="grid gap-4 text-slate-700 text-sm md:grid-cols-2">
								<div className="flex flex-col gap-1">
									<span className="text-slate-500">Deal ID</span>
									<span className="break-all font-mono text-slate-600 text-xs">
										{deal._id}
									</span>
								</div>
								<div className="flex flex-col gap-1">
									<span className="text-slate-500">Listing ID</span>
									<span className="break-all font-mono text-slate-600 text-xs">
										{deal.listingId}
									</span>
								</div>
								<div className="flex flex-col gap-1">
									<span className="text-slate-500">Mortgage ID</span>
									<span className="break-all font-mono text-slate-600 text-xs">
										{deal.mortgageId}
									</span>
								</div>
								<div className="flex flex-col gap-1">
									<span className="text-slate-500">Investor ID</span>
									<span className="break-all font-mono text-slate-600 text-xs">
										{deal.investorId}
									</span>
								</div>
								<div className="flex flex-col gap-1">
									<span className="text-slate-500">Deal Value</span>
									<span className="font-medium">
										{formatCurrency(deal.dealValue)}
									</span>
								</div>
								<div className="flex flex-col gap-1">
									<span className="text-slate-500">Closing Date</span>
									<span className="font-medium">
										{formatDate(deal.completedAt)}
									</span>
								</div>
							</CardContent>
						</Card>
					</div>

					<Card className="border-slate-200 bg-white/90 shadow-sm backdrop-blur">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-base text-slate-900">
								<Calendar className="h-4 w-4 text-teal-600" />
								Timeline of Events
							</CardTitle>
							<CardDescription className="text-slate-500">
								Every milestone from onboarding to close
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ol className="relative border-teal-200 border-l pl-6 text-slate-700 text-sm">
								{timelineEntries.map((entry, index) => (
									<li
										className="pb-6 last:pb-0"
										key={`${entry.label}-${index}`}
									>
										<span className="-left-2.5 absolute mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-teal-500 bg-white">
											<span className="h-2 w-2 rounded-full bg-teal-500" />
										</span>
										<div className="flex flex-col gap-1">
											<div className="flex items-center gap-2">
												<Badge
													className="bg-teal-50 text-teal-700"
													variant="secondary"
												>
													{entry.label}
												</Badge>
												<span className="text-slate-500 text-xs">
													{formatDateTime(entry.date)}
												</span>
											</div>
											{entry.note && (
												<p className="text-slate-500">{entry.note}</p>
											)}
										</div>
									</li>
								))}
							</ol>
						</CardContent>
					</Card>
				</div>

				<Card className="border-teal-200 bg-teal-600 text-white">
					<CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
						<div className="space-y-2">
							<div className="flex items-center gap-2 text-sm text-teal-100 uppercase tracking-[0.2em]">
								<Percent className="h-4 w-4" />
								Next Steps
							</div>
							<p className="font-semibold text-xl">
								Your ownership is now live in your portfolio.
							</p>
							<p className="text-sm text-teal-100">
								Review performance, download documents, and explore new
								opportunities from your dashboard.
							</p>
						</div>
						<Button asChild className="bg-white text-teal-700 hover:bg-teal-50">
							<Link href="/dashboard/investor/portfolio">Go to Portfolio</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

export default function DealPortalPage() {
	const { user: authUser } = useAuth();
	const viewer = useAuthenticatedQuery(api.profile.getUserIdentity, {});
	// WorkOS access tokens may not include `email` in JWT claims,
	// so merge the guaranteed email from the WorkOS session user
	const viewerWithEmail = viewer
		? { ...viewer, email: viewer.email ?? authUser?.email, name: viewer.name ?? authUser?.firstName ?? undefined }
		: undefined;
	const params = useParams();
	const dealId =
		typeof params.dealId === "string"
			? (params.dealId as Id<"deals">)
			: undefined;

	// Query admin, investor, and lawyer endpoints in parallel — the wrong-role queries return null
	const { data: adminDealData, isPending: adminPending } =
		useAuthenticatedQueryWithStatus(
			api.deals.getDealWithDetails,
			dealId ? { dealId } : "skip"
		);
	const { data: investorDealData, isPending: investorPending } =
		useAuthenticatedQueryWithStatus(
			api.deals.getInvestorDealWithDetails,
			dealId ? { dealId } : "skip"
		);
	const { data: lawyerDealData, isPending: lawyerPending } =
		useAuthenticatedQueryWithStatus(
			api.deals.getLawyerDealWithDetails,
			dealId ? { dealId } : "skip"
		);
	const dealData = adminDealData ?? investorDealData ?? lawyerDealData;
	const isPending = adminPending && investorPending && lawyerPending;

	const dealDocuments = useAuthenticatedQuery(
		api.deal_documents.getDealDocuments,
		dealId ? { dealId } : "skip"
	);

	const getDocumensoDocument = useAction(api.documenso.getDocumentAction);

	const [documensoDataMap, setDocumensoDataMap] = useState<
		Map<number, DocumensoDocumentSummary>
	>(new Map());
	const [loading, setLoading] = useState(true);
	const [documensoError, setDocumensoError] = useState<string | null>(null);

	// Batch resolve document groups for all fetched Documenso documents
	const batchInput = Array.from(documensoDataMap.values()).map((doc) => ({
		id: String(doc.id),
		type: "documenso_document",
		metadata: {
			documentId: doc.id,
			externalId: doc.externalId,
			title: doc.title,
		},
	}));

	const documentGroups = useAuthenticatedQuery(
		api.documentCategorization.batchResolveDocumentGroups,
		batchInput.length > 0 ? { documents: batchInput } : "skip",
	);

	useEffect(() => {
		async function fetchAllDocumensoDocuments() {
			if (!dealDocuments || dealDocuments.length === 0) {
				setLoading(false);
				return;
			}

			const docsWithDocumenso = dealDocuments.filter(
				(d) => d.documensoDocumentId,
			);
			if (docsWithDocumenso.length === 0) {
				setLoading(false);
				return;
			}

			setDocumensoError(null);

			const results = await Promise.allSettled(
				docsWithDocumenso.map((d) =>
					getDocumensoDocument({
						documentId: d.documensoDocumentId,
					}).then((doc) => ({
						documensoDocumentId: d.documensoDocumentId as number,
						doc,
					})),
				),
			);

			const newMap = new Map<number, DocumensoDocumentSummary>();
			let failedCount = 0;

			for (const result of results) {
				if (result.status === "fulfilled") {
					newMap.set(
						result.value.documensoDocumentId,
						result.value.doc,
					);
				} else {
					failedCount++;
					console.error(
						"Error fetching Documenso document:",
						result.reason,
					);
				}
			}

			setDocumensoDataMap(newMap);

			if (newMap.size === 0 && failedCount > 0) {
				setDocumensoError("Failed to load documents from Documenso");
			} else if (failedCount > 0) {
				toast.warning(
					`${failedCount} document(s) failed to load from Documenso`,
				);
			}

			setLoading(false);
		}

		if (dealDocuments !== undefined) {
			fetchAllDocumensoDocuments();
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

	if (dealData.deal.currentState === "pending_lawyer" && viewerWithEmail) {
		return (
			<PendingLawyerState
				deal={dealData.deal}
				dealId={dealId}
				viewer={viewerWithEmail}
			/>
		);
	}

	// Handle pending_ownership_review state - admins can review, investors see status
	if (dealData.deal.currentState === "pending_ownership_review" && viewerWithEmail) {
		return <PendingOwnershipReviewState dealId={dealId} viewer={viewerWithEmail} />;
	}

	if (dealData.deal.currentState === "completed") {
		return <DealCompleteState dealData={dealData} />;
	}

	// Show error banner only if ALL Documenso documents failed to load
	if (documensoError && documensoDataMap.size === 0) {
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

	// Build lookup from documentId → resolved group
	const groupLookup = new Map<string, { group: string; displayName: string; icon?: string; color?: string; resolutionMethod: string }>();
	if (documentGroups) {
		for (const g of documentGroups) {
			groupLookup.set(g.documentId, g);
		}
	}

	// Map ALL fetched Documenso documents
	const mappedDocuments = Array.from(documensoDataMap.values()).map((doc) => {
		const resolved = groupLookup.get(String(doc.id));
		return resolved
			? mapDocumensoToDocument(doc, resolved)
			: mapDocumensoToDocumentLegacy(doc);
	});

	// Merge users from ALL documents, deduplicated by email
	const allUsers = Array.from(documensoDataMap.values()).flatMap(extractUsers);
	const seenEmails = new Set<string>();
	const initialUsers = allUsers.filter((u) => {
		const key = u.email.toLowerCase();
		if (seenEmails.has(key)) return false;
		seenEmails.add(key);
		return true;
	});

	// Determine viewer role from which query succeeded
	const viewerRole = adminDealData ? "admin" : investorDealData ? "investor" : "lawyer";

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
			role={viewerRole}
			user={viewerWithEmail}
		/>
	);
}
