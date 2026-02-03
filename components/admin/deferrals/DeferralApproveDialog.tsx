"use client";

import { format } from "date-fns";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
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

type DeferralApproveDialogProps = {
	open: boolean;
	onClose: () => void;
	onConfirm: () => void;
	isProcessing: boolean;
	request: {
		borrowerName: string;
		propertyAddress: string;
		originalPaymentDate: string;
		requestedDeferralDate: string;
		amount: number;
	} | null;
};

function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("en-CA", {
		style: "currency",
		currency: "CAD",
	}).format(amount);
}

export function DeferralApproveDialog({
	open,
	onClose,
	onConfirm,
	isProcessing,
	request,
}: DeferralApproveDialogProps) {
	if (!request) return null;

	return (
		<Dialog onOpenChange={(o) => !o && onClose()} open={open}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
							<CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
						</div>
						<div>
							<DialogTitle>Approve Deferral</DialogTitle>
							<DialogDescription>
								Confirm payment rescheduling
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<Card className="bg-muted/30">
						<CardContent className="space-y-3 p-4">
							<div className="space-y-1">
								<p className="text-muted-foreground text-sm">Borrower</p>
								<p className="font-medium">{request.borrowerName}</p>
							</div>
							<div className="space-y-1">
								<p className="text-muted-foreground text-sm">Property</p>
								<p className="font-medium">{request.propertyAddress}</p>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-1">
									<p className="text-muted-foreground text-sm">Amount</p>
									<p className="font-semibold">
										{formatCurrency(request.amount)}
									</p>
								</div>
								<div className="space-y-1">
									<p className="text-muted-foreground text-sm">Date Change</p>
									<div className="flex items-center gap-1 text-sm">
										<span className="text-muted-foreground line-through">
											{format(new Date(request.originalPaymentDate), "MMM d")}
										</span>
										<span>→</span>
										<span className="font-semibold text-emerald-600 dark:text-emerald-400">
											{format(
												new Date(request.requestedDeferralDate),
												"MMM d, yyyy"
											)}
										</span>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					<div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
						<AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
						<div className="text-amber-700 text-sm dark:text-amber-300">
							<p className="mb-1 font-medium">This action will:</p>
							<ul className="list-inside list-disc space-y-0.5 text-amber-600 dark:text-amber-400">
								<li>Reschedule the Rotessa payment date</li>
								<li>Notify the borrower by email</li>
								<li>Record the deferral in history</li>
							</ul>
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button disabled={isProcessing} onClick={onClose} variant="outline">
						Cancel
					</Button>
					<Button className="gap-2" disabled={isProcessing} onClick={onConfirm}>
						{isProcessing ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" />
								Processing...
							</>
						) : (
							<>
								<CheckCircle2 className="h-4 w-4" />
								Approve Deferral
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
