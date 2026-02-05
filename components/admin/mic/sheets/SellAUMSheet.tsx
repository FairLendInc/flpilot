"use client";

import { ArrowUpRight, History, Landmark, ShieldAlert } from "lucide-react";
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

type SellAUMSheetProps = {
	/**
	 * Whether the sheet is open
	 */
	open: boolean;
	/**
	 * Callback when the open state changes
	 */
	onOpenChange: (open: boolean) => void;
	/**
	 * Current asset name
	 */
	assetName: string;
	/**
	 * Current MIC ownership share percentage
	 */
	currentShare: number;
	/**
	 * Callback when form is submitted
	 */
	onSubmit: (data: {
		percentageToSell: number;
		salesPrice: number;
		notes?: string;
	}) => void;
};

/**
 * A specialized action sheet for selling fractional mortgage ownership to external partners (Aisle).
 * Enforces partial sale logic and administrative record keeping for the ledger.
 */
export function SellAUMSheet({
	open,
	onOpenChange,
	assetName,
	currentShare,
	onSubmit,
}: SellAUMSheetProps) {
	const [sellPercentage, setSellPercentage] = React.useState("");
	const [price, setPrice] = React.useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const p = Number.parseFloat(sellPercentage) || 0;
		if (p > currentShare) return;

		onSubmit({
			percentageToSell: p,
			salesPrice: Number.parseFloat(price) || 0,
		});
		onOpenChange(false);
	};

	const invalidPercentage =
		(Number.parseFloat(sellPercentage) || 0) > currentShare;
	const remainingShare = Math.max(
		0,
		currentShare - (Number.parseFloat(sellPercentage) || 0)
	);

	return (
		<Sheet onOpenChange={onOpenChange} open={open}>
			<SheetContent className="border-none backdrop-blur-xl sm:max-w-md dark:bg-slate-900/95">
				<SheetHeader className="pb-8">
					<div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
						<ArrowUpRight className="size-6" />
					</div>
					<SheetTitle className="font-bold text-2xl tracking-tight">
						Sell Asset Participation
					</SheetTitle>
					<SheetDescription className="font-medium text-muted-foreground/80 text-sm">
						Offload a fractional share of <strong>{assetName}</strong> to an
						external partner.
					</SheetDescription>
				</SheetHeader>

				<form className="flex flex-col gap-6" onSubmit={handleSubmit}>
					<div className="rounded-xl border border-indigo-500/10 bg-indigo-500/5 p-4">
						<div className="flex items-center justify-between">
							<span className="font-bold text-[10px] text-indigo-600 uppercase tracking-widest dark:text-indigo-400">
								Current MIC Share
							</span>
							<span className="font-bold text-foreground text-sm">
								{currentShare}%
							</span>
						</div>
					</div>

					<div className="flex flex-col gap-4">
						<div className="grid gap-2">
							<Label
								className="font-bold text-muted-foreground/60 text-xs uppercase tracking-widest"
								htmlFor="sell_perc"
							>
								Ownership Percentage to Sell (%)
							</Label>
							<div className="relative">
								<Input
									className={cn(
										"border-muted-foreground/20 bg-muted/30 pl-9 focus-visible:ring-primary/20",
										invalidPercentage &&
											"border-rose-500/50 focus-visible:ring-rose-500/20"
									)}
									id="sell_perc"
									onChange={(e) => setSellPercentage(e.target.value)}
									placeholder="e.g. 50"
									required
									type="number"
									value={sellPercentage}
								/>
								<Landmark className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground/40" />
							</div>
							{invalidPercentage && (
								<p className="mt-1 flex items-center gap-1 font-bold text-[10px] text-rose-500">
									<ShieldAlert className="size-3" />
									Cannot sell more than the current MIC holdings.
								</p>
							)}
						</div>

						<div className="grid gap-2">
							<Label
								className="font-bold text-muted-foreground/60 text-xs uppercase tracking-widest"
								htmlFor="sell_price"
							>
								Sales Price ($)
							</Label>
							<div className="relative">
								<Input
									className="border-muted-foreground/20 bg-muted/30 pl-9 focus-visible:ring-primary/20"
									id="sell_price"
									onChange={(e) => setPrice(e.target.value)}
									placeholder="0.00"
									required
									type="number"
									value={price}
								/>
								<History className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground/40" />
							</div>
						</div>

						<div className="grid gap-2 rounded-lg border border-indigo-500/10 bg-indigo-500/5 p-3 font-medium text-[10px] text-indigo-700 leading-relaxed dark:text-indigo-400">
							<div className="flex items-center justify-between">
								<span>Post-Sale Residual Share:</span>
								<span className="font-bold">{remainingShare}%</span>
							</div>
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
							className="bg-indigo-600 shadow-sm hover:bg-indigo-700"
							disabled={invalidPercentage || !sellPercentage}
							type="submit"
						>
							Execute Fractional Sale
						</Button>
					</SheetFooter>
				</form>
			</SheetContent>
		</Sheet>
	);
}
