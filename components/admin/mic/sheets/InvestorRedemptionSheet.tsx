"use client";

import { AlertTriangle, ArrowDownLeft, Info, Wallet } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type InvestorRedemptionSheetProps = {
	/**
	 * Whether the sheet is open
	 */
	open: boolean;
	/**
	 * Callback when the open state changes
	 */
	onOpenChange: (open: boolean) => void;
	/**
	 * Name of the investor (for display)
	 */
	investorName: string;
	/**
	 * Current units owned by the investor
	 */
	currentUnits: number;
	/**
	 * Callback when form is submitted
	 */
	onSubmit: (data: {
		redemptionUnits: number;
		redemptionAmount: number;
		notes?: string;
	}) => void;
};

/**
 * A critical action sheet for processing investor unit redemptions.
 * Features unit-to-dollar conversion logic and safety warnings.
 * strictly decoupled for administrative ledger control.
 */
export function InvestorRedemptionSheet({
	open,
	onOpenChange,
	investorName,
	currentUnits,
	onSubmit,
}: InvestorRedemptionSheetProps) {
	const [units, setUnits] = React.useState("");
	const [amount, setAmount] = React.useState("");

	// Simplified unit-to-NAV conversion (1:1 for this MIC)
	React.useEffect(() => {
		if (units) {
			setAmount(units);
		} else {
			setAmount("");
		}
	}, [units]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const u = Number.parseFloat(units) || 0;
		if (u > currentUnits) return; // Basic validation check

		onSubmit({
			redemptionUnits: u,
			redemptionAmount: Number.parseFloat(amount) || 0,
		});
		onOpenChange(false);
	};

	const exceedsBalance = (Number.parseFloat(units) || 0) > currentUnits;

	return (
		<Sheet onOpenChange={onOpenChange} open={open}>
			<SheetContent className="border-none backdrop-blur-xl sm:max-w-md dark:bg-slate-900/95">
				<SheetHeader className="pb-8">
					<div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
						<ArrowDownLeft className="size-6" />
					</div>
					<SheetTitle className="font-bold text-2xl tracking-tight">
						Process Redemption
					</SheetTitle>
					<SheetDescription className="font-medium text-muted-foreground/80 text-sm">
						Process a capital withdrawal request for{" "}
						<strong>{investorName}</strong>.
					</SheetDescription>
				</SheetHeader>

				<form className="flex flex-col gap-6" onSubmit={handleSubmit}>
					<div className="rounded-xl border border-border/50 bg-muted/30 p-4">
						<div className="flex items-center justify-between">
							<span className="font-bold text-[10px] text-muted-foreground/60 uppercase tracking-widest">
								Current Unit Balance
							</span>
							<span className="font-bold text-foreground text-sm">
								{currentUnits.toLocaleString()} Units
							</span>
						</div>
					</div>

					<div className="flex flex-col gap-4">
						<div className="grid gap-2">
							<Label
								className="font-bold text-muted-foreground/60 text-xs uppercase tracking-widest"
								htmlFor="redemption_units"
							>
								Units to Redeem
							</Label>
							<div className="relative">
								<Input
									className={cn(
										"border-muted-foreground/20 bg-muted/30 pl-9 focus-visible:ring-primary/20",
										exceedsBalance &&
											"border-rose-500/50 focus-visible:ring-rose-500/20"
									)}
									id="redemption_units"
									max={currentUnits}
									onChange={(e) => setUnits(e.target.value)}
									placeholder="0"
									required
									type="number"
									value={units}
								/>
								<Wallet className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground/40" />
							</div>
							{exceedsBalance && (
								<p className="mt-1 flex items-center gap-1 font-bold text-[10px] text-rose-500">
									<AlertTriangle className="size-3" />
									Amount exceeds current holdings.
								</p>
							)}
						</div>

						<div className="grid gap-2">
							<Label className="font-bold text-muted-foreground/60 text-xs uppercase tracking-widest">
								Calculated Value ($)
							</Label>
							<div className="relative opacity-80">
								<Input
									className="border-muted-foreground/10 bg-muted/50 pl-9 font-bold"
									disabled
									value={
										amount
											? `$${Number.parseFloat(amount).toLocaleString()}`
											: "$0.00"
									}
								/>
								<Info className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground/40" />
							</div>
							<p className="font-medium text-[9px] text-muted-foreground italic">
								* Based on current NAV of $1.00 per unit.
							</p>
						</div>

						<div className="grid gap-2 rounded-lg border border-amber-500/10 bg-amber-500/5 p-3 font-medium text-[10px] text-amber-700 leading-relaxed dark:text-amber-400">
							<p>
								Note: Redemption will be queued for the next monthly close
								period as per MIC economic rules.
							</p>
						</div>
					</div>

					<SheetFooter className="mt-4">
						<SheetClose asChild>
							<Button
								className="border-muted-foreground/20"
								type="button"
								variant="outline"
							>
								Cancel
							</Button>
						</SheetClose>
						<Button
							className="bg-rose-600 shadow-sm hover:bg-rose-700"
							disabled={exceedsBalance || !units}
							type="submit"
						>
							Process Withdrawal
						</Button>
					</SheetFooter>
				</form>
			</SheetContent>
		</Sheet>
	);
}
