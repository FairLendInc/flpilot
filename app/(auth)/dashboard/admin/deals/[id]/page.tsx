/**
 * Deal Detail Page
 *
 * Admin-only page showing complete details of a single deal including:
 * - Current state and progression
 * - Full audit trail
 * - Property and investor details
 * - Actions: Cancel, Archive, Transfer Ownership
 */

"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { useMutation } from "convex/react";
import { format } from "date-fns";
import {
	AlertTriangle,
	Archive,
	ArrowLeft,
	Banknote,
	Calendar,
	CheckCircle,
	FileSignature,
	Lock,
	MapPin,
	Scale,
	SearchCheck,
	TrendingUp,
	User,
	XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuthenticatedQuery } from "@/convex/lib/client";
import {
	canArchive,
	canCancel,
	canTransferOwnership,
	DEAL_STATE_COLORS,
	DEAL_STATE_LABELS,
	type DealStateValue,
	formatDealValue,
	getDaysInState,
} from "@/lib/types/dealTypes";

const STATE_ICONS: Record<DealStateValue, typeof Lock> = {
	locked: Lock,
	pending_lawyer: Scale,
	pending_docs: FileSignature,
	pending_transfer: Banknote,
	pending_verification: SearchCheck,
	completed: CheckCircle,
	cancelled: XCircle,
	archived: Archive,
};

export default function DealDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const resolvedParams = use(params);
	const dealId = resolvedParams.id as Id<"deals">;
	const router = useRouter();
	const { loading: authLoading } = useAuth();

	const [showCancelDialog, setShowCancelDialog] = useState(false);
	const [showArchiveDialog, setShowArchiveDialog] = useState(false);
	const [showTransferDialog, setShowTransferDialog] = useState(false);
	const [cancelReason, setCancelReason] = useState("");

	// Use authenticated query - automatically handles auth checking
	const dealData = useAuthenticatedQuery(api.deals.getDealWithDetails, {
		dealId,
	});
	const cancelDeal = useMutation(api.deals.cancelDeal);
	const archiveDeal = useMutation(api.deals.archiveDeal);
	const completeDeal = useMutation(api.deals.completeDeal);

	const handleCancel = async () => {
		if (!cancelReason.trim()) {
			toast.error("Cancellation reason required");
			return;
		}

		try {
			await cancelDeal({ dealId, reason: cancelReason });
			toast.success("Deal Cancelled", {
				description: "Deal has been cancelled and listing unlocked",
			});
			setShowCancelDialog(false);
			setCancelReason("");
		} catch (error) {
			console.error("Failed to cancel deal:", error);
			toast.error("Failed to Cancel Deal", {
				description:
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
			});
		}
	};

	const handleArchive = async () => {
		try {
			await archiveDeal({ dealId });
			toast.success("Deal Archived", {
				description: "Deal has been moved to archive",
			});
			setShowArchiveDialog(false);
			router.push("/dashboard/admin/deals");
		} catch (error) {
			console.error("Failed to archive deal:", error);
			toast.error("Failed to Archive Deal", {
				description:
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
			});
		}
	};

	const handleTransferOwnership = async () => {
		try {
			await completeDeal({ dealId });
			toast.success("Ownership Transferred!", {
				description: "Mortgage ownership has been transferred to the investor",
			});
			setShowTransferDialog(false);
		} catch (error) {
			console.error("Failed to transfer ownership:", error);
			toast.error("Failed to Transfer Ownership", {
				description:
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
			});
		}
	};

	// Show loading state while auth is loading or query is pending
	if (authLoading || !dealData) {
		return (
			<>
				<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
					<SidebarTrigger className="-ml-1" />
					<Separator className="mr-2 h-4" orientation="vertical" />
					<h1 className="font-semibold text-lg">Deal Details</h1>
				</header>
				<div className="flex flex-1 flex-col gap-6 p-6">
					<Skeleton className="h-8 w-64" />
					<Skeleton className="h-96 w-full" />
				</div>
			</>
		);
	}

	if (!dealData.deal) {
		return (
			<>
				<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
					<SidebarTrigger className="-ml-1" />
					<Separator className="mr-2 h-4" orientation="vertical" />
					<h1 className="font-semibold text-lg">Deal Details</h1>
				</header>
				<div className="flex flex-1 flex-col gap-6 p-6">
					<Card>
						<CardContent className="py-12 text-center">
							<AlertTriangle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
							<h2 className="mb-2 font-semibold text-2xl">Deal Not Found</h2>
							<p className="mb-4 text-muted-foreground">
								The deal you're looking for doesn't exist or has been deleted.
							</p>
							<Button onClick={() => router.push("/dashboard/admin/deals")}>
								Back to Deals
							</Button>
						</CardContent>
					</Card>
				</div>
			</>
		);
	}

	const { deal, lockRequest, mortgage, investor } = dealData;
	const IconComponent = STATE_ICONS[deal.currentState as DealStateValue];
	const stateColor = DEAL_STATE_COLORS[deal.currentState as DealStateValue];

	return (
		<>
			<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator className="mr-2 h-4" orientation="vertical" />
				<h1 className="font-semibold text-lg">Deal Details</h1>
			</header>

			<div className="flex flex-1 flex-col gap-6 p-6">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<Button
							onClick={() => router.push("/dashboard/admin/deals")}
							size="sm"
							variant="ghost"
						>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to Deals
						</Button>
						<div>
							<h1 className="font-bold text-3xl tracking-tight">
								Deal Details
							</h1>
							<p className="text-muted-foreground text-sm">
								Created {format(new Date(deal.createdAt), "MMM d, yyyy")}
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2">
						{canArchive(deal) && (
							<Button
								onClick={() => setShowArchiveDialog(true)}
								size="sm"
								variant="outline"
							>
								<Archive className="mr-2 h-4 w-4" />
								Archive
							</Button>
						)}
						{canCancel(deal) && (
							<Button
								onClick={() => setShowCancelDialog(true)}
								size="sm"
								variant="destructive"
							>
								<XCircle className="mr-2 h-4 w-4" />
								Cancel Deal
							</Button>
						)}
					</div>
				</div>

				<div className="grid gap-6 lg:grid-cols-3">
					{/* Main Content - Left Column */}
					<div className="space-y-6 lg:col-span-2">
						{/* Current State */}
						<Card>
							<CardHeader>
								<CardTitle>Current State</CardTitle>
								<CardDescription>Deal progress and status</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-center gap-4">
									<div
										className="rounded-lg p-3"
										style={{ backgroundColor: `${stateColor}20` }}
									>
										<IconComponent
											className="h-6 w-6"
											style={{ color: stateColor }}
										/>
									</div>
									<div className="flex-1">
										<h3 className="font-semibold text-lg">
											{DEAL_STATE_LABELS[deal.currentState as DealStateValue]}
										</h3>
										<p className="text-muted-foreground text-sm">
											In this state for {getDaysInState(deal)} days
										</p>
									</div>
									<Badge
										style={{
											borderColor: stateColor,
											color: stateColor,
										}}
										variant="outline"
									>
										{deal.currentState}
									</Badge>
								</div>

								{/* Transfer Ownership Button (only for completed deals) */}
								{canTransferOwnership(deal) && (
									<div className="border-t pt-4">
										<Button
											className="w-full"
											onClick={() => setShowTransferDialog(true)}
											size="lg"
										>
											<TrendingUp className="mr-2 h-4 w-4" />
											Transfer Ownership to Investor
										</Button>
										<p className="mt-2 text-center text-muted-foreground text-xs">
											This will transfer 100% ownership of the mortgage to the
											investor
										</p>
									</div>
								)}

								{deal.currentState === "completed" && deal.completedAt && (
									<div className="border-t pt-4">
										<Badge className="text-sm" variant="success">
											Ownership Transferred{" "}
											{format(new Date(deal.completedAt), "MMM d, yyyy")}
										</Badge>
									</div>
								)}

								{deal.currentState === "cancelled" && deal.cancelledAt && (
									<div className="border-t pt-4">
										<Badge className="text-sm" variant="destructive">
											Deal Cancelled{" "}
											{format(new Date(deal.cancelledAt), "MMM d, yyyy")}
										</Badge>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Property Details */}
						{mortgage && (
							<Card>
								<CardHeader>
									<CardTitle>Property Details</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="flex items-start gap-3">
										<MapPin className="mt-0.5 h-5 w-5 text-muted-foreground" />
										<div>
											<p className="font-medium">{mortgage.address.street}</p>
											<p className="text-muted-foreground text-sm">
												{mortgage.address.city}, {mortgage.address.state}{" "}
												{mortgage.address.zip}
											</p>
										</div>
									</div>

									<Separator />

									<div className="grid grid-cols-2 gap-4">
										<div>
											<Label className="text-muted-foreground text-xs">
												Loan Amount
											</Label>
											<p className="font-medium">
												{formatDealValue(mortgage.loanAmount)}
											</p>
										</div>
										<div>
											<Label className="text-muted-foreground text-xs">
												Interest Rate
											</Label>
											<p className="font-medium">{mortgage.interestRate}%</p>
										</div>
										<div>
											<Label className="text-muted-foreground text-xs">
												Property Type
											</Label>
											<p className="font-medium">
												{mortgage.propertyType || "N/A"}
											</p>
										</div>
										<div>
											<Label className="text-muted-foreground text-xs">
												Purchase Percentage
											</Label>
											<p className="font-medium">{deal.purchasePercentage}%</p>
										</div>
									</div>
								</CardContent>
							</Card>
						)}

						{/* Audit Trail */}
						<Card>
							<CardHeader>
								<CardTitle>Audit Trail</CardTitle>
								<CardDescription>
									Complete history of all state transitions
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{deal.stateHistory.map((entry, idx) => (
										<div
											className="flex gap-4"
											key={`${entry.timestamp}-${entry.fromState}-${entry.toState}`}
										>
											<div className="flex flex-col items-center">
												<div className="h-2 w-2 rounded-full bg-primary" />
												{idx < deal.stateHistory.length - 1 && (
													<div className="mt-1 w-px flex-1 bg-border" />
												)}
											</div>
											<div className="flex-1 pb-4">
												<div className="mb-1 flex items-center gap-2">
													<Badge className="text-xs" variant="outline">
														{entry.fromState} → {entry.toState}
													</Badge>
													<span className="text-muted-foreground text-xs">
														{format(
															new Date(entry.timestamp),
															"MMM d, yyyy HH:mm"
														)}
													</span>
												</div>
												{entry.notes && (
													<p className="text-muted-foreground text-sm">
														{entry.notes}
													</p>
												)}
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Sidebar - Right Column */}
					<div className="space-y-6">
						{/* Deal Summary */}
						<Card>
							<CardHeader>
								<CardTitle>Deal Summary</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<Label className="text-muted-foreground text-xs">
										Deal Value
									</Label>
									<p className="font-bold text-2xl">
										{formatDealValue(deal.dealValue)}
									</p>
								</div>

								<Separator />

								<div className="space-y-3">
									<div className="flex items-center gap-2 text-sm">
										<Calendar className="h-4 w-4 text-muted-foreground" />
										<span className="text-muted-foreground">Created:</span>
										<span className="font-medium">
											{format(new Date(deal.createdAt), "MMM d, yyyy")}
										</span>
									</div>

									<div className="flex items-center gap-2 text-sm">
										<Calendar className="h-4 w-4 text-muted-foreground" />
										<span className="text-muted-foreground">Last Updated:</span>
										<span className="font-medium">
											{format(new Date(deal.updatedAt), "MMM d, yyyy")}
										</span>
									</div>

									{deal.currentState === "completed" && deal.completedAt && (
										<div className="flex items-center gap-2 text-sm">
											<CheckCircle className="h-4 w-4 text-green-600" />
											<span className="text-muted-foreground">Completed:</span>
											<span className="font-medium">
												{format(new Date(deal.completedAt), "MMM d, yyyy")}
											</span>
										</div>
									)}

									{deal.currentState === "cancelled" && deal.cancelledAt && (
										<div className="flex items-center gap-2 text-sm">
											<XCircle className="h-4 w-4 text-red-600" />
											<span className="text-muted-foreground">Cancelled:</span>
											<span className="font-medium">
												{format(new Date(deal.cancelledAt), "MMM d, yyyy")}
											</span>
										</div>
									)}
								</div>
							</CardContent>
						</Card>

						{/* Investor Details */}
						{investor && (
							<Card>
								<CardHeader>
									<CardTitle>Investor</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3">
									<div className="flex items-center gap-3">
										<User className="h-5 w-5 text-muted-foreground" />
										<div>
											<p className="font-medium">
												{investor.first_name && investor.last_name
													? `${investor.first_name} ${investor.last_name}`
													: investor.email}
											</p>
											<p className="text-muted-foreground text-sm">
												{investor.email}
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						)}

						{/* Lawyer Information */}
						{lockRequest && (
							<Card>
								<CardHeader>
									<CardTitle>Lawyer Information</CardTitle>
								</CardHeader>
								<CardContent className="space-y-2">
									<div>
										<Label className="text-muted-foreground text-xs">
											Name
										</Label>
										<p className="font-medium">{lockRequest.lawyerName}</p>
									</div>
									<div>
										<Label className="text-muted-foreground text-xs">
											LSO Number
										</Label>
										<p className="font-medium">{lockRequest.lawyerLSONumber}</p>
									</div>
									<div>
										<Label className="text-muted-foreground text-xs">
											Email
										</Label>
										<p className="break-all font-medium text-sm">
											{lockRequest.lawyerEmail}
										</p>
									</div>
								</CardContent>
							</Card>
						)}
					</div>
				</div>

				{/* Cancel Dialog */}
				<Dialog onOpenChange={setShowCancelDialog} open={showCancelDialog}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Cancel Deal</DialogTitle>
							<DialogDescription>
								This will cancel the deal and unlock the listing. The investor
								and admins will be notified.
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4 py-4">
							<div className="space-y-2">
								<Label htmlFor="cancel-reason">
									Cancellation Reason (Required)
								</Label>
								<Textarea
									id="cancel-reason"
									onChange={(e) => setCancelReason(e.target.value)}
									placeholder="Enter reason for cancellation..."
									rows={4}
									value={cancelReason}
								/>
							</div>
						</div>
						<DialogFooter>
							<Button
								onClick={() => {
									setShowCancelDialog(false);
									setCancelReason("");
								}}
								variant="outline"
							>
								Cancel
							</Button>
							<Button
								disabled={!cancelReason.trim()}
								onClick={handleCancel}
								variant="destructive"
							>
								Confirm Cancellation
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* Archive Dialog */}
				<AlertDialog
					onOpenChange={setShowArchiveDialog}
					open={showArchiveDialog}
				>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Archive Deal</AlertDialogTitle>
							<AlertDialogDescription>
								This will move the deal to the archive. Archived deals can no
								longer be modified but remain accessible for audit purposes.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction onClick={handleArchive}>
								Archive Deal
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>

				{/* Transfer Ownership Dialog */}
				<AlertDialog
					onOpenChange={setShowTransferDialog}
					open={showTransferDialog}
				>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Transfer Ownership</AlertDialogTitle>
							<AlertDialogDescription>
								This will transfer <strong>100%</strong> ownership of the
								mortgage to the investor. This action cannot be undone.
							</AlertDialogDescription>
						</AlertDialogHeader>
						{mortgage && investor && (
							<div className="space-y-1 rounded-md bg-muted p-3 text-sm">
								<div>
									<strong>Property:</strong> {mortgage.address.street}
								</div>
								<div>
									<strong>Investor:</strong>{" "}
									{investor.first_name && investor.last_name
										? `${investor.first_name} ${investor.last_name}`
										: investor.email}
								</div>
								<div>
									<strong>Amount:</strong> {formatDealValue(deal.dealValue)}
								</div>
							</div>
						)}
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction onClick={handleTransferOwnership}>
								Transfer Ownership
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</>
	);
}
