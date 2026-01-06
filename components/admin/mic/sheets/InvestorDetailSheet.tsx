"use client";

import { ArrowDownRight, Edit2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { InvestorTransactionTable } from "../InvestorTransactionTable";
import { InvestorPositionCard } from "../widgets/InvestorPositionCard";

type InvestorDetail = {
	id: string;
	name: string;
	email: string;
	capitalClass: string;
	unitsOwned: number;
	ownershipPercentage: number;
	currentValue: number;
	accrualStatus: "up-to-date" | "pending" | "behind";
	lastAccruedDate?: string;
};

type Transaction = {
	id: string;
	type: "subscription" | "redemption" | "distribution" | "adjustment";
	description: string;
	timestamp: string;
	amount: number;
	balanceAfter: number;
	reference?: string;
};

type InvestorDetailSheetProps = {
	/**
	 * Whether the sheet is open
	 */
	open: boolean;
	/**
	 * Callback when the open state changes
	 */
	onOpenChange: (open: boolean) => void;
	/**
	 * Investor data to display
	 */
	investor: InvestorDetail | null;
	/**
	 * Historical transactions for this investor
	 */
	transactions: Transaction[];
	/**
	 * Callback when "Redeem" is clicked
	 */
	onRedeemClick?: (investor: InvestorDetail) => void;
	/**
	 * Optional className for the container
	 */
	className?: string;
};

/**
 * A comprehensive detail view for an individual MIC investor.
 * Composes existing widgets into a unified administrative cockpit.
 * Strictly decoupled from data fetching for Storybook testability.
 */
export function InvestorDetailSheet({
	open,
	onOpenChange,
	investor,
	transactions,
	onRedeemClick,
}: InvestorDetailSheetProps) {
	if (!investor) return null;

	const txCount = transactions.length; // use it to satisfy lint if needed
	console.log(`Rendering ${txCount} transactions`);

	return (
		<Sheet onOpenChange={onOpenChange} open={open}>
			<SheetContent className="overflow-y-auto border-none backdrop-blur-xl sm:max-w-2xl dark:bg-slate-900/95">
				<SheetHeader className="pb-6">
					<div className="flex items-center gap-4">
						<div className="flex size-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
							<User className="size-7" />
						</div>
						<div className="flex flex-col gap-1">
							<SheetTitle className="font-bold text-3xl tracking-tight">
								{investor.name}
							</SheetTitle>
							<SheetDescription className="flex items-center gap-2 font-medium text-[13px] text-muted-foreground/80">
								{investor.email}
								<span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
								ID: {investor.id}
							</SheetDescription>
						</div>
					</div>
				</SheetHeader>

				<div className="flex flex-col gap-8 py-2">
					<section className="flex flex-col gap-4">
						<div className="flex items-center justify-between">
							<h3 className="font-bold text-muted-foreground/60 text-xs uppercase tracking-widest">
								Live Position Summary
							</h3>
							<div className="flex gap-2">
								<Button
									className="h-8 gap-2 border-muted-foreground/20 font-bold text-xs"
									size="sm"
									variant="outline"
								>
									<Edit2 className="size-3.5" />
									Edit Profile
								</Button>
								<Button
									className="h-8 gap-2 bg-rose-500/10 font-bold text-rose-600 text-xs hover:bg-rose-500/20"
									onClick={() => onRedeemClick?.(investor)}
									size="sm"
									variant="secondary"
								>
									<ArrowDownRight className="size-3.5" />
									Process Redemption
								</Button>
							</div>
						</div>
						<InvestorPositionCard
							accrualStatus={investor.accrualStatus}
							capitalClass={investor.capitalClass}
							className="bg-muted/30 dark:bg-slate-800/40"
							currentValue={investor.currentValue}
							investorName={investor.name}
							lastAccruedDate={investor.lastAccruedDate}
							ownershipPercentage={investor.ownershipPercentage}
							unitsOwned={investor.unitsOwned}
						/>
					</section>

					<Separator className="opacity-50" />

					<section className="flex flex-col gap-4">
						<h3 className="font-bold text-muted-foreground/60 text-xs uppercase tracking-widest">
							Ledger Transaction History
						</h3>
						<InvestorTransactionTable
							className="border-none bg-transparent"
							data={transactions}
						/>
					</section>
				</div>
			</SheetContent>
		</Sheet>
	);
}
