/**
 * Manual Resolution Panel
 *
 * Shows deals requiring manual intervention after multiple rejection cycles.
 * Provides admin options: force approve, cancel deal, contact investor.
 *
 * High-visibility warning styling to draw attention to escalated items.
 */

"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import {
	AlertTriangle,
	Ban,
	CheckCircle,
	Clock,
	ExternalLink,
	Loader2,
	Mail,
	MessageSquare,
	RefreshCw,
	ShieldAlert,
	User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
	AlertDialogTrigger,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuthenticatedQuery } from "@/convex/lib/client";

type AlertItem = (typeof api.alerts.getAllUserAlerts._returnType)[number];

// ============================================================================
// Types
// ============================================================================

type ManualResolutionPanelProps = {
	/** If provided, shows resolution for a specific deal only */
	dealId?: Id<"deals">;
	/** Callback when a resolution action is taken */
	onResolved?: () => void;
};

type EscalatedDeal = {
	_id: Id<"deals">;
	investorId: Id<"users">;
	mortgageId: Id<"mortgages">;
	currentState: string;
	rejectionHistory: Array<{
		reason: string;
		timestamp: number;
		reviewedBy?: Id<"users">;
	}>;
	investorName: string;
	investorEmail: string;
	mortgageAddress?: string;
};

// ============================================================================
// Subcomponents
// ============================================================================

function RejectionHistoryItem({
	rejection,
	index,
}: {
	rejection: { reason: string; timestamp: number; reviewedBy?: Id<"users"> };
	index: number;
}) {
	return (
		<div className="relative flex gap-4 pb-4 pl-6">
			{/* Timeline line */}
			<div className="absolute top-0 bottom-0 left-2 w-px bg-border" />
			{/* Timeline dot */}
			<div className="absolute top-1 left-0 flex h-4 w-4 items-center justify-center rounded-full border-2 border-red-500 bg-background">
				<span className="text-[10px] text-red-500">{index + 1}</span>
			</div>
			<div className="flex-1 space-y-1">
				<p className="text-sm">{rejection.reason}</p>
				<p className="text-muted-foreground text-xs">
					{format(new Date(rejection.timestamp), "PPP 'at' p")}
				</p>
			</div>
		</div>
	);
}

function ResolutionActions({
	onAction,
	isLoading,
}: {
	onAction: (action: "approve" | "cancel" | "contact") => Promise<void>;
	isLoading: boolean;
}) {
	const [_forceApproveOpen, _setForceApproveOpen] = useState(false);
	const [cancelOpen, setCancelOpen] = useState(false);
	const [cancelReason, setCancelReason] = useState("");

	return (
		<div className="flex flex-wrap gap-2 pt-4">
			{/* Force Approve */}
			<AlertDialog>
				<AlertDialogTrigger asChild>
					<Button
						className="bg-amber-600 hover:bg-amber-700"
						disabled={isLoading}
						size="sm"
					>
						<ShieldAlert className="mr-2 h-4 w-4" />
						Force Approve
					</Button>
				</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className="flex items-center gap-2 text-amber-600">
							<ShieldAlert className="h-5 w-5" />
							Force Approve Transfer
						</AlertDialogTitle>
						<AlertDialogDescription>
							This will bypass the normal review process and approve the
							ownership transfer immediately. This action is audited and should
							only be used when manual verification has been performed
							externally.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							className="bg-amber-600 hover:bg-amber-700"
							disabled={isLoading}
							onClick={() => onAction("approve")}
						>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Processing...
								</>
							) : (
								<>
									<CheckCircle className="mr-2 h-4 w-4" />
									Force Approve
								</>
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Cancel Deal */}
			<Dialog onOpenChange={setCancelOpen} open={cancelOpen}>
				<Button
					disabled={isLoading}
					onClick={() => setCancelOpen(true)}
					size="sm"
					variant="destructive"
				>
					<Ban className="mr-2 h-4 w-4" />
					Cancel Deal
				</Button>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Cancel Deal</DialogTitle>
						<DialogDescription>
							This will permanently cancel the deal. The listing will be
							returned to the marketplace. Please provide a reason.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="cancel-reason">Cancellation Reason</Label>
							<Textarea
								id="cancel-reason"
								onChange={(e) => setCancelReason(e.target.value)}
								placeholder="Enter the reason for cancellation..."
								rows={4}
								value={cancelReason}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							disabled={isLoading}
							onClick={() => setCancelOpen(false)}
							variant="outline"
						>
							Go Back
						</Button>
						<Button
							disabled={!cancelReason.trim() || isLoading}
							onClick={async () => {
								await onAction("cancel");
								setCancelOpen(false);
							}}
							variant="destructive"
						>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Cancelling...
								</>
							) : (
								<>
									<Ban className="mr-2 h-4 w-4" />
									Confirm Cancellation
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Contact Investor */}
			<Button
				disabled={isLoading}
				onClick={() => onAction("contact")}
				size="sm"
				variant="outline"
			>
				<Mail className="mr-2 h-4 w-4" />
				Contact Investor
			</Button>
		</div>
	);
}

function EscalatedDealCard({
	deal,
	onResolved,
}: {
	deal: EscalatedDeal;
	onResolved?: () => void;
}) {
	const [isLoading, setIsLoading] = useState(false);
	const transitionDeal = useMutation(api.deals.transitionDealState);
	const approvePendingTransfer = useMutation(
		api.pendingOwnershipTransfers.approvePendingTransfer
	);

	// Get pending transfer for this deal
	const { user, loading: authLoading } = useAuth();
	const pendingTransfer = useQuery(
		api.pendingOwnershipTransfers.getPendingTransferByDeal,
		authLoading || !user ? "skip" : { dealId: deal._id }
	);

	async function handleAction(action: "approve" | "cancel" | "contact") {
		if (action === "contact") {
			const email = deal.investorEmail?.trim();
			const isValidEmail =
				typeof email === "string" &&
				email.length > 0 &&
				/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

			if (!isValidEmail) {
				toast.error("Investor email unavailable", {
					description:
						"No valid investor email found for this deal. Please follow up manually.",
				});
				return;
			}
		}

		setIsLoading(true);
		try {
			if (action === "approve") {
				// First approve the pending transfer
				if (pendingTransfer?._id) {
					await approvePendingTransfer({
						transferId: pendingTransfer._id,
						notes: "Force approved via manual resolution",
					});
				}
				// Then transition deal state
				await transitionDeal({
					dealId: deal._id,
					event: {
						type: "CONFIRM_TRANSFER",
						notes: "Force approved via manual resolution panel",
					},
				});
				toast.success("Transfer force-approved successfully");
				onResolved?.();
			} else if (action === "cancel") {
				await transitionDeal({
					dealId: deal._id,
					event: {
						type: "REJECT_TRANSFER",
						reason: "Rejected via manual resolution after multiple rejections",
					},
				});
				toast.success("Deal cancelled successfully");
				onResolved?.();
			} else if (action === "contact") {
				// Open email client with pre-filled message
				const email = deal.investorEmail.trim();
				const subject = encodeURIComponent(
					"Action Required: Your Deal Transfer Review"
				);
				const body = encodeURIComponent(
					`Dear ${deal.investorName},\n\nWe need additional information regarding your investment transfer for the property at ${deal.mortgageAddress || "your mortgage"}.\n\nPlease contact us at your earliest convenience.\n\nBest regards,\nFairLend Team`
				);
				window.open(`mailto:${email}?subject=${subject}&body=${body}`);
				toast.info("Email client opened");
			}
		} catch (error) {
			toast.error(
				`Action failed: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<Card className="border-red-200 dark:border-red-800">
			<CardHeader className="bg-linear-to-r from-red-50 to-amber-50 dark:from-red-950/30 dark:to-amber-950/30">
				<div className="flex items-start justify-between gap-4">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
							<AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
						</div>
						<div>
							<CardTitle className="text-base">
								Manual Resolution Required
							</CardTitle>
							<CardDescription>
								{deal.rejectionHistory?.length || 0} rejection(s) - escalated
								for admin review
							</CardDescription>
						</div>
					</div>
					<Badge className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">
						<Clock className="mr-1 h-3 w-3" />
						Urgent
					</Badge>
				</div>
			</CardHeader>

			<CardContent className="space-y-4 pt-4">
				{/* Investor Info */}
				<div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
					<div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
						<User className="h-4 w-4 text-blue-600" />
					</div>
					<div className="flex-1">
						<p className="font-medium text-sm">{deal.investorName}</p>
						<p className="text-muted-foreground text-xs">
							{deal.investorEmail}
						</p>
					</div>
					<Link
						className="text-primary hover:underline"
						href={`/dashboard/admin/deals/${deal._id}`}
					>
						<Button size="sm" variant="ghost">
							View Deal
							<ExternalLink className="ml-2 h-3 w-3" />
						</Button>
					</Link>
				</div>

				{/* Property Address */}
				{deal.mortgageAddress && (
					<div className="text-muted-foreground text-sm">
						<span className="font-medium">Property:</span>{" "}
						{deal.mortgageAddress}
					</div>
				)}

				{/* Rejection History */}
				{deal.rejectionHistory && deal.rejectionHistory.length > 0 && (
					<div className="space-y-2">
						<h4 className="flex items-center gap-2 font-medium text-sm">
							<MessageSquare className="h-4 w-4" />
							Rejection History
						</h4>
						<div className="ml-2 space-y-0">
							{deal.rejectionHistory.map((rejection, idx) => (
								<RejectionHistoryItem
									index={idx}
									key={`rejection-${deal._id}-${idx}`}
									rejection={rejection}
								/>
							))}
						</div>
					</div>
				)}

				<Separator />

				{/* Action Buttons */}
				<ResolutionActions isLoading={isLoading} onAction={handleAction} />
			</CardContent>
		</Card>
	);
}

function EscalatedDealCardContainer({
	alert,
	onResolved,
}: {
	alert: AlertItem;
	onResolved?: () => void;
}) {
	const dealDetails = useAuthenticatedQuery(
		api.deals.getDealWithDetails,
		alert.relatedDealId ? { dealId: alert.relatedDealId } : "skip"
	);
	const investor = useAuthenticatedQuery(api.users.getUserByIdAdmin, {
		userId: alert.userId,
	});

	if (!alert.relatedDealId) {
		return null;
	}

	if (dealDetails === null || investor === null) {
		return null;
	}

	if (!(dealDetails?.deal && investor)) {
		return <Skeleton className="h-40 w-full" />;
	}

	const investorName =
		[investor.first_name, investor.last_name].filter(Boolean).join(" ") ||
		investor.email;
	const mortgageAddress = dealDetails.mortgage?.address
		? `${dealDetails.mortgage.address.street}, ${dealDetails.mortgage.address.city}, ${dealDetails.mortgage.address.state} ${dealDetails.mortgage.address.zip}`
		: undefined;

	return (
		<EscalatedDealCard
			deal={{
				_id: dealDetails.deal._id,
				investorId: alert.userId,
				mortgageId: dealDetails.deal.mortgageId,
				currentState:
					dealDetails.deal.currentState ?? "pending_ownership_review",
				rejectionHistory: [
					{
						reason: alert.message,
						timestamp: alert.createdAt,
					},
				],
				investorName,
				investorEmail: investor.email,
				mortgageAddress,
			}}
			onResolved={onResolved}
		/>
	);
}

// ============================================================================
// Main Component
// ============================================================================

export function ManualResolutionPanel({
	dealId,
	onResolved,
}: ManualResolutionPanelProps) {
	const { user, loading: authLoading } = useAuth();
	const router = useRouter();
	const [isRefreshing, startTransition] = useTransition();

	// Query for deals requiring manual resolution
	// For now, we query deals in pending_ownership_review with rejection count >= 2
	const alerts = useQuery(
		api.alerts.getAllUserAlerts,
		authLoading || !user ? "skip" : {}
	);

	// Filter to manual resolution alerts
	const manualResolutionAlerts = alerts?.filter(
		(alert: AlertItem) =>
			alert.type === "ownership_transfer_rejected" &&
			alert.severity === "warning" &&
			Boolean(alert.relatedDealId) &&
			(!dealId || alert.relatedDealId === dealId)
	);

	function handleRefresh() {
		try {
			startTransition(() => {
				router.refresh();
			});
		} catch (error) {
			toast.error("Failed to refresh alerts", {
				description:
					error instanceof Error ? error.message : "Unknown error occurred",
			});
		}
	}

	// Loading state
	if (authLoading || alerts === undefined) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-48" />
					<Skeleton className="mt-2 h-4 w-64" />
				</CardHeader>
				<CardContent className="space-y-4">
					<Skeleton className="h-32 w-full" />
					<Skeleton className="h-32 w-full" />
				</CardContent>
			</Card>
		);
	}

	// No escalated deals
	if (!manualResolutionAlerts || manualResolutionAlerts.length === 0) {
		return (
			<Card>
				<CardContent className="flex flex-col items-center justify-center py-12 text-center">
					<div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
						<CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
					</div>
					<h3 className="mt-4 font-semibold">No Escalated Items</h3>
					<p className="mt-1 text-muted-foreground text-sm">
						All ownership transfers are proceeding normally.
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="flex items-center gap-2 font-semibold text-lg">
						<AlertTriangle className="h-5 w-5 text-red-500" />
						Manual Resolution Required
					</h2>
					<p className="text-muted-foreground text-sm">
						{manualResolutionAlerts.length} deal(s) require admin intervention
					</p>
				</div>
				<Button
					disabled={isRefreshing}
					onClick={handleRefresh}
					size="sm"
					variant="outline"
				>
					{isRefreshing ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Refreshing...
						</>
					) : (
						<>
							<RefreshCw className="mr-2 h-4 w-4" />
							Refresh
						</>
					)}
				</Button>
			</div>

			{manualResolutionAlerts.map((alert: AlertItem) => (
				<EscalatedDealCardContainer
					alert={alert}
					key={alert._id}
					onResolved={onResolved}
				/>
			))}
		</div>
	);
}

export default ManualResolutionPanel;
