"use client";

import { ArrowRight, Code2, CornerDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

type TransactionLeg = {
	source: string;
	destination: string;
	amount: string;
	asset: string;
};

type DemoTransactionPreviewProps = {
	/**
	 * Description of the transaction
	 */
	description: string;
	/**
	 * Array of transaction legs (moves)
	 */
	legs: TransactionLeg[];
	/**
	 * Whether the transaction is currently executing
	 */
	isExecuting?: boolean;
	/**
	 * Optional className
	 */
	className?: string;
};

/**
 * A sleek visualization of a Formance Ledger transaction for the Live Demo.
 * Highlights the "Double Entry" nature of the underlying Numscript.
 */
export function DemoTransactionPreview({
	description,
	legs,
	isExecuting,
	className,
}: DemoTransactionPreviewProps) {
	return (
		<div
			className={cn(
				"flex flex-col gap-3 rounded-2xl border border-muted-foreground/10 bg-muted/20 p-4",
				className
			)}
		>
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Code2 className="size-3.5 text-primary opacity-70" />
					<span className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">
						Proposed Transaction
					</span>
				</div>
				{isExecuting && (
					<span className="flex animate-pulse items-center gap-1.5 font-bold text-[9px] text-primary uppercase tracking-widest">
						<span className="size-1.5 rounded-full bg-primary" />
						Executing
					</span>
				)}
			</div>

			<p className="font-bold text-foreground text-sm leading-snug">
				{description}
			</p>

			<div className="mt-1 flex flex-col gap-2">
				{legs.map((leg, index) => (
					<div
						className="flex items-center gap-3 font-mono text-[11px] leading-none"
						key={`${leg.source}-${leg.destination}-${index}`}
					>
						<CornerDownRight className="size-3 shrink-0 text-muted-foreground opacity-40" />
						<div className="flex flex-1 items-center gap-2 overflow-hidden">
							<span className="truncate rounded border border-border/30 bg-muted/50 px-1.5 py-0.5 text-muted-foreground">
								{leg.source}
							</span>
							<ArrowRight className="size-3 shrink-0 text-primary opacity-50" />
							<span className="truncate rounded border border-primary/20 bg-primary/5 px-1.5 py-0.5 font-bold text-foreground">
								{leg.destination}
							</span>
						</div>
						<div className="ml-auto flex shrink-0 items-center gap-1 pl-2 font-bold">
							<span className="text-primary">{leg.amount}</span>
							<span className="text-[9px] text-muted-foreground">
								{leg.asset}
							</span>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
