"use client";

import { ArrowRightLeft, Database, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

type LedgerAccount = {
	id: string;
	label: string;
	balance: string;
	asset: string;
	type: "internal" | "investor" | "external";
};

type DemoLedgerStatePanelProps = {
	/**
	 * Array of key ledger accounts and their balances
	 */
	accounts: LedgerAccount[];
	/**
	 * Optional className
	 */
	className?: string;
};

/**
 * A real-time ledger state viewer for the Live Demo.
 * Displays various control and investor accounts to show the side-effects of actions.
 */
export function DemoLedgerStatePanel({
	accounts,
	className,
}: DemoLedgerStatePanelProps) {
	return (
		<div
			className={cn(
				"flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-2xl shadow-indigo-500/10",
				className
			)}
		>
			<div className="flex items-center justify-between border-slate-800 border-b pb-3">
				<div className="flex items-center gap-2.5">
					<Database className="size-4 text-indigo-400" />
					<h3 className="font-bold text-slate-300 text-xs uppercase tracking-widest">
						Live Ledger State
					</h3>
				</div>
				<span className="flex items-center gap-1.5 font-bold text-[9px] text-emerald-400 uppercase tracking-widest">
					<span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
					Synced
				</span>
			</div>

			<div className="grid grid-cols-1 gap-2">
				{accounts.map((acc) => {
					const isInternal = acc.type === "internal";
					const isInvestor = acc.type === "investor";

					return (
						<div
							className={cn(
								"flex items-center justify-between rounded-xl border p-3 transition-all duration-300",
								isInternal
									? "border-slate-800/50 bg-slate-900/40"
									: isInvestor
										? "border-indigo-500/10 bg-indigo-500/5"
										: "border-slate-800/30 bg-slate-950"
							)}
							key={acc.id}
						>
							<div className="flex items-center gap-3">
								<div
									className={cn(
										"flex size-8 items-center justify-center rounded-lg grayscale-[0.3]",
										isInternal
											? "bg-indigo-500/10 text-indigo-400"
											: isInvestor
												? "bg-emerald-500/10 text-emerald-400"
												: "bg-slate-800 text-slate-400"
									)}
								>
									{isInternal ? (
										<ArrowRightLeft className="size-3.5" />
									) : isInvestor ? (
										<Wallet className="size-3.5" />
									) : (
										<Database className="size-3.5" />
									)}
								</div>
								<div className="flex flex-col gap-0.5">
									<span className="font-bold text-[10px] text-slate-400 uppercase tracking-tight">
										#{acc.id}
									</span>
									<span className="font-bold text-slate-100 text-xs">
										{acc.label}
									</span>
								</div>
							</div>
							<div className="flex flex-col items-end gap-0.5">
								<span className="font-bold font-mono text-slate-50 text-sm tabular-nums">
									{acc.balance}
								</span>
								<span className="font-bold text-[9px] text-slate-500 uppercase tracking-widest">
									{acc.asset}
								</span>
							</div>
						</div>
					);
				})}
			</div>

			<div className="mt-2 text-center font-medium text-[10px] text-slate-500 italic">
				Values updated automatically via Formance Ledger listeners.
			</div>
		</div>
	);
}
