"use client";

import { addDays, format } from "date-fns";
import {
	AlertTriangle,
	Calendar,
	CheckCircle2,
	ChevronRight,
	Info,
	Loader2,
	MapPin,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type UpcomingPayment = {
	id: string;
	dueDate: string;
	amount: number;
	propertyAddress: string;
	mortgageId: string;
};

type EligibilityResult = {
	eligible: boolean;
	reason?: string;
	previousDeferral?: {
		date: string;
		property: string;
	};
};

type DeferralRequestDialogProps = {
	open: boolean;
	onClose: () => void;
	upcomingPayments: UpcomingPayment[];
	preselectedPaymentId?: string;
	checkEligibility: (mortgageId: string) => Promise<EligibilityResult>;
	onSubmit: (request: {
		paymentId: string;
		mortgageId: string;
		requestType: "one_time" | "hardship";
		requestedDeferralDate: string;
		reason?: string;
	}) => Promise<{ referenceNumber: string }>;
};

type Step = "select" | "reason" | "review" | "success" | "ineligible";

function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("en-CA", {
		style: "currency",
		currency: "CAD",
	}).format(amount);
}

export function DeferralRequestDialog({
	open,
	onClose,
	upcomingPayments,
	preselectedPaymentId,
	checkEligibility,
	onSubmit,
}: DeferralRequestDialogProps) {
	const [step, setStep] = useState<Step>("select");
	const [selectedPaymentId, setSelectedPaymentId] = useState<string>(
		preselectedPaymentId ?? ""
	);
	const [requestType, setRequestType] = useState<"one_time" | "hardship">(
		"one_time"
	);
	const [requestedDate, setRequestedDate] = useState<string>("");
	const [reason, setReason] = useState<string>("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [referenceNumber, setReferenceNumber] = useState<string>("");
	const [eligibility, setEligibility] = useState<EligibilityResult | null>(
		null
	);

	const selectedPayment = upcomingPayments.find(
		(p) => p.id === selectedPaymentId
	);

	const handleNext = async () => {
		if (step === "select" && selectedPayment) {
			// Check eligibility before proceeding
			const result = await checkEligibility(selectedPayment.mortgageId);
			setEligibility(result);
			if (result.eligible) {
				// Set default requested date to 14 days after due date
				const defaultDate = addDays(new Date(selectedPayment.dueDate), 14);
				setRequestedDate(format(defaultDate, "yyyy-MM-dd"));
				setStep("reason");
			} else {
				setStep("ineligible");
			}
		} else if (step === "reason") {
			setStep("review");
		}
	};

	const handleBack = () => {
		if (step === "reason") {
			setStep("select");
		} else if (step === "review") {
			setStep("reason");
		}
	};

	const handleSubmit = async () => {
		if (!selectedPayment) return;

		setIsSubmitting(true);
		try {
			const result = await onSubmit({
				paymentId: selectedPaymentId,
				mortgageId: selectedPayment.mortgageId,
				requestType,
				requestedDeferralDate: requestedDate,
				reason: reason || undefined,
			});
			setReferenceNumber(result.referenceNumber);
			setStep("success");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClose = () => {
		// Reset state on close
		setStep("select");
		setSelectedPaymentId(preselectedPaymentId ?? "");
		setRequestType("one_time");
		setRequestedDate("");
		setReason("");
		setEligibility(null);
		onClose();
	};

	const maxDeferralDate = selectedPayment
		? format(addDays(new Date(selectedPayment.dueDate), 30), "yyyy-MM-dd")
		: "";

	return (
		<Dialog onOpenChange={(o) => !o && handleClose()} open={open}>
			<DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[500px]">
				<DialogHeader className="border-b p-6 pb-4">
					<DialogTitle>Request Payment Deferral</DialogTitle>
					{step !== "success" && step !== "ineligible" && (
						<DialogDescription>
							Step {step === "select" ? 1 : step === "reason" ? 2 : 3} of 3:{" "}
							{step === "select"
								? "Select Payment"
								: step === "reason"
									? "Reason for Deferral"
									: "Review Your Request"}
						</DialogDescription>
					)}
				</DialogHeader>

				<div className="max-h-[60vh] overflow-y-auto p-6">
					{/* Step 1: Select Payment */}
					{step === "select" && (
						<div className="space-y-4">
							<div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
								<Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
								<p className="text-blue-700 text-sm dark:text-blue-300">
									A one-time deferral allows you to delay a single payment. You
									may request one deferral per loan per year.
								</p>
							</div>

							<div className="space-y-2">
								<Label className="font-medium text-sm">
									Which payment would you like to defer?
								</Label>
								<RadioGroup
									className="space-y-3"
									onValueChange={setSelectedPaymentId}
									value={selectedPaymentId}
								>
									{upcomingPayments.map((payment) => (
										<Label
											className={cn(
												"flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors",
												selectedPaymentId === payment.id
													? "border-primary bg-primary/5"
													: "border-border hover:border-primary/50"
											)}
											htmlFor={payment.id}
											key={payment.id}
										>
											<RadioGroupItem id={payment.id} value={payment.id} />
											<div className="flex-1">
												<div className="flex items-center justify-between">
													<span className="font-medium">
														{format(new Date(payment.dueDate), "MMM d, yyyy")}
													</span>
													<span className="font-semibold tabular-nums">
														{formatCurrency(payment.amount)}
													</span>
												</div>
												<div className="mt-1 flex items-center gap-1.5 text-muted-foreground text-sm">
													<MapPin className="h-3.5 w-3.5" />
													{payment.propertyAddress.split(",")[0]}
												</div>
											</div>
										</Label>
									))}
								</RadioGroup>
							</div>
						</div>
					)}

					{/* Step 2: Reason */}
					{step === "reason" && selectedPayment && (
						<div className="space-y-6">
							{/* Selected payment summary */}
							<Card className="bg-muted/30">
								<CardContent className="p-4">
									<p className="mb-1 text-muted-foreground text-sm">
										Selected Payment
									</p>
									<p className="font-medium">
										{format(new Date(selectedPayment.dueDate), "MMM d, yyyy")} -{" "}
										{formatCurrency(selectedPayment.amount)}
									</p>
									<p className="text-muted-foreground text-sm">
										{selectedPayment.propertyAddress}
									</p>
								</CardContent>
							</Card>

							{/* Request type */}
							<div className="space-y-2">
								<Label className="font-medium text-sm">Request Type</Label>
								<RadioGroup
									className="space-y-2"
									onValueChange={(v) =>
										setRequestType(v as "one_time" | "hardship")
									}
									value={requestType}
								>
									<Label
										className={cn(
											"flex cursor-pointer items-start gap-3 rounded-lg border p-4",
											requestType === "one_time"
												? "border-primary bg-primary/5"
												: "border-border"
										)}
										htmlFor="one_time"
									>
										<RadioGroupItem
											className="mt-0.5"
											id="one_time"
											value="one_time"
										/>
										<div>
											<span className="font-medium">One-time Deferral</span>
											<p className="text-muted-foreground text-sm">
												Delay this single payment
											</p>
										</div>
									</Label>
									<Label
										className={cn(
											"flex cursor-pointer items-start gap-3 rounded-lg border p-4",
											requestType === "hardship"
												? "border-primary bg-primary/5"
												: "border-border"
										)}
										htmlFor="hardship"
									>
										<RadioGroupItem
											className="mt-0.5"
											id="hardship"
											value="hardship"
										/>
										<div>
											<span className="font-medium">Hardship Request</span>
											<p className="text-muted-foreground text-sm">
												Experiencing financial difficulty
											</p>
										</div>
									</Label>
								</RadioGroup>
							</div>

							{/* Preferred date */}
							<div className="space-y-2">
								<Label className="font-medium text-sm" htmlFor="deferral-date">
									Preferred New Payment Date
								</Label>
								<div className="relative">
									<Calendar className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
									<Input
										className="pl-10"
										id="deferral-date"
										max={maxDeferralDate}
										min={format(new Date(), "yyyy-MM-dd")}
										onChange={(e) => setRequestedDate(e.target.value)}
										type="date"
										value={requestedDate}
									/>
								</div>
								<p className="text-muted-foreground text-xs">
									Must be within 30 days of original due date
								</p>
							</div>

							{/* Reason textarea */}
							<div className="space-y-2">
								<Label className="font-medium text-sm" htmlFor="reason">
									Reason (optional)
								</Label>
								<Textarea
									className="min-h-[100px] resize-none"
									id="reason"
									onChange={(e) => setReason(e.target.value)}
									placeholder="Please provide any additional context that may help us process your request..."
									value={reason}
								/>
							</div>
						</div>
					)}

					{/* Step 3: Review */}
					{step === "review" && selectedPayment && (
						<div className="space-y-6">
							<Card>
								<CardContent className="space-y-4 p-5">
									<div>
										<h4 className="mb-2 font-semibold text-sm">
											Payment Details
										</h4>
										<div className="grid grid-cols-2 gap-y-2 text-sm">
											<span className="text-muted-foreground">Property</span>
											<span>{selectedPayment.propertyAddress}</span>
											<span className="text-muted-foreground">Amount</span>
											<span className="font-medium">
												{formatCurrency(selectedPayment.amount)}
											</span>
											<span className="text-muted-foreground">
												Original Date
											</span>
											<span>
												{format(
													new Date(selectedPayment.dueDate),
													"MMMM d, yyyy"
												)}
											</span>
										</div>
									</div>

									<div className="border-t pt-4">
										<h4 className="mb-2 font-semibold text-sm">
											Deferral Request
										</h4>
										<div className="grid grid-cols-2 gap-y-2 text-sm">
											<span className="text-muted-foreground">Type</span>
											<span>
												{requestType === "one_time"
													? "One-time Deferral"
													: "Hardship Request"}
											</span>
											<span className="text-muted-foreground">New Date</span>
											<span>
												{format(new Date(requestedDate), "MMMM d, yyyy")}
											</span>
											{reason && (
												<>
													<span className="text-muted-foreground">Reason</span>
													<span className="truncate">{reason}</span>
												</>
											)}
										</div>
									</div>
								</CardContent>
							</Card>

							<div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
								<AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
								<div className="text-amber-700 text-sm dark:text-amber-300">
									<p className="mb-1 font-medium">Important</p>
									<ul className="list-inside list-disc space-y-1 text-amber-600 dark:text-amber-400">
										<li>Your request will be reviewed by our team</li>
										<li>You'll receive a decision within 2 business days</li>
										<li>If approved, your payment will be rescheduled</li>
										<li>Interest will continue to accrue</li>
									</ul>
								</div>
							</div>
						</div>
					)}

					{/* Success state */}
					{step === "success" && (
						<div className="py-6 text-center">
							<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
								<CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
							</div>
							<h3 className="mb-2 font-semibold text-lg">Request Submitted</h3>
							<p className="mb-6 text-muted-foreground text-sm">
								Your deferral request has been submitted successfully.
							</p>

							<Card className="bg-muted/30 text-left">
								<CardContent className="space-y-2 p-4">
									<div className="flex justify-between text-sm">
										<span className="text-muted-foreground">
											Reference Number
										</span>
										<span className="font-medium font-mono">
											{referenceNumber}
										</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-muted-foreground">Status</span>
										<span className="font-medium text-amber-600">
											Pending Review
										</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-muted-foreground">Submitted</span>
										<span>{format(new Date(), "MMMM d, yyyy")}</span>
									</div>
								</CardContent>
							</Card>

							<div className="mt-6 text-left">
								<p className="mb-2 font-medium text-sm">What happens next?</p>
								<ul className="space-y-1 text-muted-foreground text-sm">
									<li>• Our team will review your request</li>
									<li>• You'll receive an email notification</li>
									<li>• Decision typically within 2 business days</li>
								</ul>
							</div>
						</div>
					)}

					{/* Ineligible state */}
					{step === "ineligible" && eligibility && (
						<div className="py-6 text-center">
							<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950">
								<AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
							</div>
							<h3 className="mb-2 font-semibold text-lg">
								Deferral Not Available
							</h3>
							<p className="mb-6 text-muted-foreground text-sm">
								{eligibility.reason ||
									"You've already used your one-time deferral for this loan."}
							</p>

							{eligibility.previousDeferral && (
								<Card className="mb-6 bg-muted/30 text-left">
									<CardContent className="space-y-2 p-4 text-sm">
										<div className="flex justify-between">
											<span className="text-muted-foreground">
												Previous deferral
											</span>
											<span>
												{format(
													new Date(eligibility.previousDeferral.date),
													"MMMM d, yyyy"
												)}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-muted-foreground">Property</span>
											<span>{eligibility.previousDeferral.property}</span>
										</div>
									</CardContent>
								</Card>
							)}

							<p className="mb-4 text-muted-foreground text-sm">
								If you're experiencing financial hardship, please contact us:
							</p>
							<div className="space-y-1 text-sm">
								<p>support@fairlend.com</p>
								<p>1-800-FAIRLEND</p>
							</div>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="flex items-center justify-between border-t bg-muted/30 p-6 pt-4">
					{step === "select" && (
						<>
							<Button onClick={handleClose} variant="outline">
								Cancel
							</Button>
							<Button
								className="gap-1.5"
								disabled={!selectedPaymentId}
								onClick={handleNext}
							>
								Next
								<ChevronRight className="h-4 w-4" />
							</Button>
						</>
					)}

					{step === "reason" && (
						<>
							<Button onClick={handleBack} variant="outline">
								Back
							</Button>
							<Button
								className="gap-1.5"
								disabled={!requestedDate}
								onClick={handleNext}
							>
								Next
								<ChevronRight className="h-4 w-4" />
							</Button>
						</>
					)}

					{step === "review" && (
						<>
							<Button onClick={handleBack} variant="outline">
								Back
							</Button>
							<Button disabled={isSubmitting} onClick={handleSubmit}>
								{isSubmitting ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Submitting...
									</>
								) : (
									"Submit Request"
								)}
							</Button>
						</>
					)}

					{(step === "success" || step === "ineligible") && (
						<>
							<div />
							<Button onClick={handleClose}>
								{step === "success" ? "Done" : "Close"}
							</Button>
						</>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
