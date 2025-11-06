"use client";

import { useState, useEffect } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface MortgageUpdateDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	mortgageId: Id<"mortgages"> | null;
	initialLoanAmount: number;
	initialInterestRate: number;
	onSave: (data: { loanAmount: number; interestRate: number }) => void | Promise<void>;
}

export function MortgageUpdateDialog({
	open,
	onOpenChange,
	mortgageId,
	initialLoanAmount,
	initialInterestRate,
	onSave,
}: MortgageUpdateDialogProps) {
	const [loanAmount, setLoanAmount] = useState(initialLoanAmount);
	const [interestRate, setInterestRate] = useState(initialInterestRate);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Sync local state when props change
	useEffect(() => {
		setLoanAmount(initialLoanAmount);
		setInterestRate(initialInterestRate);
	}, [initialLoanAmount, initialInterestRate]);

	async function handleSave() {
		setIsSubmitting(true);
		try {
			await onSave({ loanAmount, interestRate });
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit Mortgage</DialogTitle>
					<DialogDescription>
						Update loan amount and interest rate for this mortgage
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<Label htmlFor="loanAmount">Loan Amount ($)</Label>
						<Input
							id="loanAmount"
							type="number"
							value={loanAmount}
							onChange={(e) =>
								setLoanAmount(Number.parseFloat(e.target.value))
							}
							min={0}
							step={1000}
							disabled={isSubmitting}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="interestRate">Interest Rate (%)</Label>
						<Input
							id="interestRate"
							type="number"
							value={interestRate}
							onChange={(e) =>
								setInterestRate(Number.parseFloat(e.target.value))
							}
							min={0}
							max={100}
							step={0.1}
							disabled={isSubmitting}
						/>
					</div>
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isSubmitting}
					>
						Cancel
					</Button>
					<Button onClick={handleSave} disabled={isSubmitting}>
						{isSubmitting ? "Saving..." : "Save Changes"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

