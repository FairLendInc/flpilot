"use client";

import { CheckCircle2, Users } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import { PendingApplicationCard } from "./PendingApplicationCard";
import type { RotessaStatus } from "./RotessaStatusIcon";

type VerificationStatus = "complete" | "skipped" | "pending" | "failed";

type PendingBorrowerJourney = {
	id: string;
	submittedAt: string;
	context: {
		profile: {
			firstName: string;
			lastName: string;
			email: string;
			phone?: string;
			address?: {
				street: string;
				city: string;
				province: string;
				postalCode: string;
				country: string;
			};
		};
		idVerification: { status: VerificationStatus };
		kycAml: { status: VerificationStatus };
		rotessa: {
			status: RotessaStatus;
			customerId?: string;
			linkedAt?: string;
		};
		invitation?: {
			invitedBy: string;
			invitedByRole: string;
			invitedAt: string;
		};
	};
};

type BorrowerApprovalQueueProps = {
	pendingJourneys: PendingBorrowerJourney[];
	onApprove: (journeyId: string) => Promise<void>;
	onReject: (journeyId: string, reason: string) => Promise<void>;
	onViewAllBorrowers?: () => void;
};

const REJECTION_QUICK_REASONS = [
	"Address mismatch",
	"Missing information",
	"Unable to verify identity",
	"Duplicate application",
];

export function BorrowerApprovalQueue({
	pendingJourneys,
	onApprove,
	onReject,
	onViewAllBorrowers,
}: BorrowerApprovalQueueProps) {
	const [processingId, setProcessingId] = useState<string | null>(null);
	const [processingAction, setProcessingAction] = useState<
		"approve" | "reject" | null
	>(null);
	const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
	const [rejectingJourneyId, setRejectingJourneyId] = useState<string | null>(
		null
	);
	const [rejectionReason, setRejectionReason] = useState("");

	const handleApprove = async (journeyId: string) => {
		setProcessingId(journeyId);
		setProcessingAction("approve");
		try {
			await onApprove(journeyId);
		} finally {
			setProcessingId(null);
			setProcessingAction(null);
		}
	};

	const handleRejectClick = (journeyId: string) => {
		setRejectingJourneyId(journeyId);
		setRejectionReason("");
		setRejectDialogOpen(true);
	};

	const handleRejectConfirm = async () => {
		if (!(rejectingJourneyId && rejectionReason.trim())) return;

		setProcessingId(rejectingJourneyId);
		setProcessingAction("reject");
		try {
			await onReject(rejectingJourneyId, rejectionReason.trim());
			setRejectDialogOpen(false);
		} finally {
			setProcessingId(null);
			setProcessingAction(null);
		}
	};

	const handleQuickReason = (reason: string) => {
		setRejectionReason(reason);
	};

	if (pendingJourneys.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center gap-6 rounded-xl border border-dashed bg-gradient-to-b from-muted/20 to-transparent py-20">
				<div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50">
					<CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
				</div>
				<div className="text-center">
					<h3 className="font-semibold text-xl">All caught up!</h3>
					<p className="mt-1 text-muted-foreground">
						No pending approvals at this time
					</p>
				</div>
				{onViewAllBorrowers && (
					<Button onClick={onViewAllBorrowers} variant="outline">
						<Users className="mr-2 h-4 w-4" />
						View All Borrowers
					</Button>
				)}
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-3">
				<Badge className="h-7 min-w-[28px] justify-center border-amber-300 bg-amber-100 font-semibold text-amber-700 text-sm dark:bg-amber-900/50 dark:text-amber-300">
					{pendingJourneys.length}
				</Badge>
				<span className="font-medium text-lg">
					pending approval{pendingJourneys.length === 1 ? "" : "s"}
				</span>
			</div>

			{/* Application Cards */}
			<div className="space-y-4">
				{pendingJourneys.map((journey) => (
					<PendingApplicationCard
						isApproving={
							processingId === journey.id && processingAction === "approve"
						}
						isRejecting={
							processingId === journey.id && processingAction === "reject"
						}
						journey={journey}
						key={journey.id}
						onApprove={() => handleApprove(journey.id)}
						onReject={() => handleRejectClick(journey.id)}
					/>
				))}
			</div>

			{/* Rejection Dialog */}
			<Dialog onOpenChange={setRejectDialogOpen} open={rejectDialogOpen}>
				<DialogContent className="sm:max-w-[480px]">
					<DialogHeader>
						<DialogTitle>Reject Application</DialogTitle>
						<DialogDescription>
							This will notify the applicant that their application was not
							approved. They will be able to edit and resubmit.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="rejection-reason">
								Rejection Reason <span className="text-destructive">*</span>
							</Label>
							<Textarea
								className="min-h-[100px]"
								id="rejection-reason"
								onChange={(e) => setRejectionReason(e.target.value)}
								placeholder="Please provide a reason that will help the applicant understand what needs to be corrected..."
								value={rejectionReason}
							/>
						</div>

						<div className="space-y-2">
							<Label className="text-muted-foreground text-xs">
								Quick reasons:
							</Label>
							<div className="flex flex-wrap gap-2">
								{REJECTION_QUICK_REASONS.map((reason) => (
									<Button
										className={cn(
											"h-7 text-xs",
											rejectionReason === reason &&
												"bg-muted ring-2 ring-primary"
										)}
										key={reason}
										onClick={() => handleQuickReason(reason)}
										size="sm"
										type="button"
										variant="outline"
									>
										{reason}
									</Button>
								))}
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button
							onClick={() => setRejectDialogOpen(false)}
							variant="outline"
						>
							Cancel
						</Button>
						<Button
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							disabled={
								!rejectionReason.trim() ||
								(processingId === rejectingJourneyId &&
									processingAction === "reject")
							}
							onClick={handleRejectConfirm}
						>
							{processingId === rejectingJourneyId &&
							processingAction === "reject"
								? "Rejecting..."
								: "Reject Application"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
