"use client";

import { BadgeAlert, BadgeCheck, ShieldAlert, ShieldCheck } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type InvariantStatus = "pass" | "fail" | "checking";

type InvariantResult = {
	id: string;
	name: string;
	status: InvariantStatus;
	expected: string;
	actual: string;
	lastChecked: Date | string;
};

type InvariantCheckCardProps = {
	/**
	 * Array of invariant check results
	 */
	invariants: InvariantResult[];
	/**
	 * Optional className for the container
	 */
	className?: string;
};

/**
 * A critical audit widget for monitoring MIC ledger integrity.
 * Visualizes the parity between different ledger balances and external states.
 * Uses high-visibility status indicators for audit failures.
 */
export function InvariantCheckCard({
	invariants,
	className,
}: InvariantCheckCardProps) {
	return (
		<Card
			className={cn(
				"flex flex-col border-none shadow-sm dark:bg-slate-900/50",
				className
			)}
		>
			<CardHeader className="pb-4">
				<div className="flex items-center justify-between">
					<CardTitle className="font-bold text-muted-foreground/80 text-sm uppercase tracking-wider">
						System Invariants
					</CardTitle>
					<ShieldCheck className="size-4 text-emerald-500" />
				</div>
				<CardDescription className="text-xs">
					Real-time audit of ledger integrity constraints.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{invariants.length === 0 ? (
						<p className="py-8 text-center font-medium text-muted-foreground text-xs">
							No invariants configured for check.
						</p>
					) : (
						invariants.map((item) => {
							const isPass = item.status === "pass";
							const isChecking = item.status === "checking";

							return (
								<div
									className={cn(
										"flex flex-col gap-3 rounded-xl border p-3 transition-all duration-300",
										isPass
											? "border-emerald-500/10 bg-emerald-500/5"
											: isChecking
												? "border-slate-500/10 bg-slate-500/5"
												: "border-rose-500/20 bg-rose-500/5"
									)}
									key={item.id}
								>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											{isPass ? (
												<BadgeCheck className="size-4 text-emerald-500" />
											) : isChecking ? (
												<ShieldAlert className="size-4 animate-pulse text-slate-400" />
											) : (
												<BadgeAlert className="size-4 text-rose-500" />
											)}
											<h4 className="font-bold text-foreground text-xs tracking-tight">
												{item.name}
											</h4>
										</div>
										<span
											className={cn(
												"font-bold text-[9px] uppercase tracking-widest",
												isPass
													? "text-emerald-600 dark:text-emerald-400"
													: isChecking
														? "text-slate-500"
														: "text-rose-600 dark:text-rose-400"
											)}
										>
											{item.status}
										</span>
									</div>

									<div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
										<div className="flex flex-col gap-0.5 opacity-70">
											<span className="text-muted-foreground uppercase">
												Expected
											</span>
											<span className="truncate font-bold text-foreground">
												{item.expected}
											</span>
										</div>
										<div className="flex flex-col gap-0.5">
											<span className="text-muted-foreground uppercase">
												Actual
											</span>
											<span
												className={cn(
													"truncate font-bold",
													isPass
														? "text-emerald-600 dark:text-emerald-400"
														: "text-rose-600 dark:text-rose-400"
												)}
											>
												{item.actual}
											</span>
										</div>
									</div>
								</div>
							);
						})
					)}
				</div>
			</CardContent>
		</Card>
	);
}
