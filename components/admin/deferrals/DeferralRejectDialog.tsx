"use client";

import { format } from "date-fns";
import { Loader2, XCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

type DeferralRejectDialogProps = {
	open: boolean;
	onClose: () => void;
	onConfirm: (reason: string) => void;
	isProcessing: boolean;
	request: {
		borrowerName: string;
		propertyAddress: string;
		originalPaymentDate: string;
		requestedDeferralDate: string;
		amount: number;
	} | null;
};

const quickReasons = [
	"Previous deferral already used this year",
	"Request outside of allowed date range",
	"Account not in good standing",
	"Insufficient documentation provided",
];

function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("en-CA", {
		style: "currency",
		currency: "CAD",
	}).format(amount);
}

export function DeferralRejectDialog({
	open,
	onClose,
	onConfirm,
	isProcessing,
	request,
}: DeferralRejectDialogProps) {
	const [reason, setReason] = useState("");
	const [selectedQuickReason, setSelectedQuickReason] = useState<string | null>(
		null
	);

	const handleQuickReasonClick = (quickReason: string) => {
		if (selectedQuickReason === quickReason) {
			setSelectedQuickReason(null);
			setReason("");
		} else {
			setSelectedQuickReason(quickReason);
			setReason(quickReason);
		}
	};

	const handleConfirm = () => {
		onConfirm(reason);
	};

	const handleClose = () => {
		setReason("");
		setSelectedQuickReason(null);
		onClose();
	};

	if (!request) return null;

	return (
		<Dialog onOpenChange={(o) => !o && handleClose()} open={open}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
							<XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
						</div>
						<div>
							<DialogTitle>Reject Deferral</DialogTitle>
							<DialogDescription>
								Provide a reason for the borrower
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<div className="space-y-4 py-4">
					{/* Request summary */}
					<Card className="bg-muted/30">
						<CardContent className="p-4">
							<div className="grid grid-cols-2 gap-4 text-sm">
								<div>
									<p className="text-muted-foreground">Borrower</p>
									<p className="font-medium">{request.borrowerName}</p>
								</div>
								<div>
									<p className="text-muted-foreground">Amount</p>
									<p className="font-medium">
										{formatCurrency(request.amount)}
									</p>
								</div>
								<div className="col-span-2">
									<p className="text-muted-foreground">Requested</p>
									<p className="font-medium">
										Defer{" "}
										{format(
											new Date(request.originalPaymentDate),
											"MMM d, yyyy"
										)}{" "}
										→{" "}
										{format(
											new Date(request.requestedDeferralDate),
											"MMM d, yyyy"
										)}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Quick reasons */}
					<div className="space-y-2">
						<Label className="font-medium text-sm">Quick Reasons</Label>
						<div className="flex flex-wrap gap-2">
							{quickReasons.map((quickReason) => (
								<Button
									className={cn(
										"h-auto px-3 py-1.5 text-xs",
										selectedQuickReason === quickReason &&
											"bg-primary text-primary-foreground"
									)}
									key={quickReason}
									onClick={() => handleQuickReasonClick(quickReason)}
									size="sm"
									variant={
										selectedQuickReason === quickReason ? "default" : "outline"
									}
								>
									{quickReason}
								</Button>
							))}
						</div>
					</div>

					{/* Custom reason */}
					<div className="space-y-2">
						<Label className="font-medium text-sm" htmlFor="reason">
							Rejection Reason
						</Label>
						<Textarea
							className="min-h-[100px] resize-none"
							id="reason"
							onChange={(e) => {
								setReason(e.target.value);
								if (
									selectedQuickReason &&
									e.target.value !== selectedQuickReason
								) {
									setSelectedQuickReason(null);
								}
							}}
							placeholder="Provide a detailed reason that will be shared with the borrower..."
							value={reason}
						/>
						<p className="text-muted-foreground text-xs">
							This reason will be included in the notification email.
						</p>
					</div>
				</div>

				<DialogFooter>
					<Button
						disabled={isProcessing}
						onClick={handleClose}
						variant="outline"
					>
						Cancel
					</Button>
					<Button
						className="gap-2"
						disabled={isProcessing || !reason.trim()}
						onClick={handleConfirm}
						variant="destructive"
					>
						{isProcessing ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" />
								Processing...
							</>
						) : (
							<>
								<XCircle className="h-4 w-4" />
								Reject Request
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
