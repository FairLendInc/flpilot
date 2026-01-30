/**
 * Fund Verification Card Component
 *
 * Displays the uploaded fund transfer receipt and provides admin actions
 * to verify the transfer when the deal is in pending_verification state.
 */

import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import {
	CheckCircle2,
	Clock,
	Download,
	Eye,
	FileText,
	Loader2,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type UploadMeta = {
	storageId: Id<"_storage">;
	uploadedBy: string;
	uploadedAt: number;
	fileName: string;
	fileType: string;
};

type FundVerificationCardProps = {
	dealId: Id<"deals">;
	currentState?: string | null;
	currentUpload?: UploadMeta | null;
	dealValue?: number | null;
};

export function FundVerificationCard({
	dealId,
	currentState,
	currentUpload,
	dealValue,
}: FundVerificationCardProps) {
	const [isVerifying, setIsVerifying] = useState(false);
	const [showRejectDialog, setShowRejectDialog] = useState(false);
	const [rejectReason, setRejectReason] = useState("");
	const [isRejecting, setIsRejecting] = useState(false);

	const transitionDealState = useMutation(api.deals.transitionDealState);

	// Get file URL for viewing/downloading
	const fileUrl = useQuery(
		api.storage.getFileUrl,
		currentUpload?.storageId ? { storageId: currentUpload.storageId } : "skip"
	);

	// Only show in pending_verification state
	if (currentState !== "pending_verification") {
		return null;
	}

	const handleVerify = async () => {
		setIsVerifying(true);
		try {
			await transitionDealState({
				dealId,
				event: {
					type: "VERIFY_COMPLETE",
					notes: "Fund transfer verified by admin",
				},
			});
			toast.success("Fund Transfer Verified", {
				description:
					"The deal has moved to pending ownership review for final approval.",
			});
		} catch (error) {
			console.error("Failed to verify fund transfer:", error);
			toast.error("Verification Failed", {
				description:
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
			});
		} finally {
			setIsVerifying(false);
		}
	};

	const handleReject = async () => {
		if (!rejectReason.trim()) {
			toast.error("Rejection reason required");
			return;
		}

		setIsRejecting(true);
		try {
			// Transition back to pending_transfer state
			await transitionDealState({
				dealId,
				event: {
					type: "GO_BACK",
					toState: "pending_transfer",
					notes: `Fund transfer rejected: ${rejectReason}`,
				},
			});
			toast.success("Transfer Rejected", {
				description: "The deal has been returned to pending transfer state.",
			});
			setShowRejectDialog(false);
			setRejectReason("");
		} catch (error) {
			console.error("Failed to reject fund transfer:", error);
			toast.error("Rejection Failed", {
				description:
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
			});
		} finally {
			setIsRejecting(false);
		}
	};

	const handleView = () => {
		if (fileUrl) {
			window.open(fileUrl, "_blank");
		}
	};

	const handleDownload = () => {
		if (fileUrl && currentUpload) {
			const link = document.createElement("a");
			link.href = fileUrl;
			link.download = currentUpload.fileName;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}
	};

	const formatCurrency = (value: number) =>
		new Intl.NumberFormat("en-CA", {
			style: "currency",
			currency: "CAD",
		}).format(value);

	return (
		<>
			<Card className="border-amber-200 bg-amber-50/50">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-amber-900">
						<FileText className="h-5 w-5" />
						Fund Transfer Verification
					</CardTitle>
					<CardDescription className="text-amber-700">
						Review the uploaded receipt and verify the fund transfer
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Deal Value */}
					{dealValue && (
						<div className="rounded-lg border border-amber-200 bg-white p-3">
							<Label className="text-muted-foreground text-xs">
								Expected Transfer Amount
							</Label>
							<p className="font-bold text-lg">{formatCurrency(dealValue)}</p>
						</div>
					)}

					{/* Uploaded Receipt */}
					{currentUpload ? (
						<div className="rounded-lg border border-amber-200 bg-white p-4">
							<div className="mb-3 flex items-center justify-between">
								<div className="flex items-center gap-2 font-medium">
									<FileText className="h-4 w-4 text-amber-700" />
									<span>Uploaded Receipt</span>
								</div>
							</div>

							<p className="mb-2 truncate font-medium text-sm">
								{currentUpload.fileName}
							</p>

							<div className="mb-4 flex flex-wrap items-center gap-3 text-muted-foreground text-xs">
								<span className="flex items-center gap-1">
									<Clock className="h-3 w-3" />
									{formatDistanceToNow(currentUpload.uploadedAt, {
										addSuffix: true,
									})}
								</span>
								<span className="rounded bg-muted px-1.5 py-0.5">
									{currentUpload.fileType}
								</span>
							</div>

							{/* View/Download Actions */}
							<div className="flex gap-2">
								<Button
									className="flex-1"
									disabled={!fileUrl}
									onClick={handleView}
									size="sm"
									variant="outline"
								>
									<Eye className="mr-2 h-4 w-4" />
									View
								</Button>
								<Button
									className="flex-1"
									disabled={!fileUrl}
									onClick={handleDownload}
									size="sm"
									variant="outline"
								>
									<Download className="mr-2 h-4 w-4" />
									Download
								</Button>
							</div>
						</div>
					) : (
						<div className="rounded-lg border border-amber-300 border-dashed bg-white p-4 text-center">
							<FileText className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
							<p className="text-muted-foreground text-sm">
								No receipt uploaded yet
							</p>
						</div>
					)}

					{/* Admin Actions */}
					<div className="space-y-2 border-t pt-4">
						<Button
							className="w-full bg-green-600 hover:bg-green-700"
							disabled={isVerifying || !currentUpload}
							onClick={handleVerify}
							size="lg"
						>
							{isVerifying ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<CheckCircle2 className="mr-2 h-4 w-4" />
							)}
							Verify Transfer
						</Button>
						<Button
							className="w-full"
							onClick={() => setShowRejectDialog(true)}
							size="lg"
							variant="outline"
						>
							<XCircle className="mr-2 h-4 w-4" />
							Reject Transfer
						</Button>
						<p className="text-center text-muted-foreground text-xs">
							Verify confirms the funds have been received. Reject returns the
							deal to pending transfer.
						</p>
					</div>
				</CardContent>
			</Card>

			{/* Reject Dialog */}
			<Dialog onOpenChange={setShowRejectDialog} open={showRejectDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Reject Fund Transfer</DialogTitle>
						<DialogDescription>
							This will return the deal to pending transfer state. The investor
							will need to upload a new transfer receipt.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="reject-reason">Rejection Reason (Required)</Label>
							<Textarea
								id="reject-reason"
								onChange={(e) => setRejectReason(e.target.value)}
								placeholder="Enter reason for rejection..."
								rows={4}
								value={rejectReason}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							onClick={() => {
								setShowRejectDialog(false);
								setRejectReason("");
							}}
							variant="outline"
						>
							Cancel
						</Button>
						<Button
							disabled={!rejectReason.trim() || isRejecting}
							onClick={handleReject}
							variant="destructive"
						>
							{isRejecting ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : null}
							Confirm Rejection
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
