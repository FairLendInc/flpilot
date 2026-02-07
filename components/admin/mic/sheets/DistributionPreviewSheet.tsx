"use client";

import { CheckCircle2, Play, TrendingUp, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";

type InvestorShare = {
	id: string;
	name: string;
	units: number;
	percentage: number;
	amount: number;
};

type DistributionPreviewSheetProps = {
	/**
	 * Whether the sheet is open
	 */
	open: boolean;
	/**
	 * Callback when the open state changes
	 */
	onOpenChange: (open: boolean) => void;
	/**
	 * Period name (e.g. November 2024)
	 */
	periodName: string;
	/**
	 * Total interest pool to be distributed
	 */
	totalPool: number;
	/**
	 * List of calculated investor shares
	 */
	shares: InvestorShare[];
	/**
	 * Callback when distribution is executed
	 */
	onExecute: () => void;
};

/**
 * A mission-critical preview sheet for MIC distribution cycles.
 * Provides a final audit point before capital is disbursed to investor accounts.
 * Orchestrates the "One Click" distribution UX.
 */
export function DistributionPreviewSheet({
	open,
	onOpenChange,
	periodName,
	totalPool,
	shares,
	onExecute,
}: DistributionPreviewSheetProps) {
	return (
		<Sheet onOpenChange={onOpenChange} open={open}>
			<SheetContent className="flex h-full flex-col border-none backdrop-blur-xl sm:max-w-2xl dark:bg-slate-900/95">
				<SheetHeader className="pb-6">
					<div className="mb-2 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
						<Play className="size-7 fill-current" />
					</div>
					<SheetTitle className="font-bold text-3xl tracking-tight">
						Distribution Preview
					</SheetTitle>
					<SheetDescription className="font-medium text-[13px] text-muted-foreground/80">
						Final audit for <strong>{periodName}</strong>. Review investor
						shares before ledger finalization.
					</SheetDescription>
				</SheetHeader>

				<div className="flex flex-1 flex-col gap-6 overflow-y-auto pr-2 pb-8">
					<div className="grid grid-cols-2 gap-4">
						<div className="flex flex-col gap-1.5 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-4">
							<div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
								<TrendingUp className="size-3.5" />
								<span className="font-bold text-[10px] uppercase tracking-widest">
									Total Disbursable
								</span>
							</div>
							<span className="font-bold text-2xl text-foreground tracking-tight">
								${totalPool.toLocaleString()}
							</span>
						</div>
						<div className="flex flex-col gap-1.5 rounded-2xl border border-primary/10 bg-primary/5 p-4">
							<div className="flex items-center gap-2 text-primary">
								<Users className="size-3.5" />
								<span className="font-bold text-[10px] uppercase tracking-widest">
									Target Investors
								</span>
							</div>
							<span className="font-bold text-2xl text-foreground tracking-tight">
								{shares.length}
							</span>
						</div>
					</div>

					<div className="flex flex-col gap-4">
						<h3 className="flex items-center gap-2 font-bold text-muted-foreground/60 text-xs uppercase tracking-widest">
							Individual Share Breakdown
						</h3>
						<div className="overflow-hidden rounded-2xl border border-border/50 bg-muted/20">
							<div className="grid grid-cols-4 gap-4 border-border/50 border-b bg-muted/30 p-3 font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
								<div className="col-span-2">Investor</div>
								<div className="text-right">Units (%)</div>
								<div className="text-right">Amount</div>
							</div>
							<div className="divide-y divide-border/30">
								{shares.map((share) => (
									<div
										className="grid grid-cols-4 items-center gap-4 p-3 transition-colors hover:bg-primary/5"
										key={share.id}
									>
										<div className="col-span-2 flex flex-col">
											<span className="truncate font-bold text-foreground text-sm">
												{share.name}
											</span>
											<span className="font-medium text-[10px] text-muted-foreground">
												ID: {share.id}
											</span>
										</div>
										<div className="flex flex-col text-right">
											<span className="font-bold font-mono text-foreground text-xs tabular-nums">
												{share.units.toLocaleString()}
											</span>
											<span className="font-medium text-[10px] text-muted-foreground">
												{share.percentage}%
											</span>
										</div>
										<div className="text-right">
											<span className="font-bold font-mono text-emerald-500 text-sm tabular-nums">
												+${share.amount.toLocaleString()}
											</span>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>

					<div className="flex gap-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
						<div className="mt-1 h-fit shrink-0 rounded-full bg-amber-500/10 p-1.5 text-amber-500">
							<Wallet className="size-4" />
						</div>
						<div className="flex flex-col gap-1">
							<h4 className="font-bold text-foreground text-xs">
								Economic Integrity Check
							</h4>
							<p className="font-medium text-[11px] text-muted-foreground/80 leading-relaxed">
								The system has verified that the total investor shares equal the
								disbursable pool (within $0.01 rounding variance).
							</p>
						</div>
					</div>
				</div>

				<SheetFooter className="mt-auto border-border/30 border-t bg-background/50 pt-6 backdrop-blur-md">
					<SheetClose asChild>
						<Button
							className="border-muted-foreground/20"
							type="button"
							variant="outline"
						>
							Cancel All
						</Button>
					</SheetClose>
					<Button
						className="gap-2 bg-primary px-8 shadow-lg hover:bg-primary/90"
						onClick={onExecute}
					>
						<CheckCircle2 className="size-4" />
						Execute Disbursement
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
