"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { AccrualStatusIndicator } from "../AccrualStatusIndicator";
import { MICCapBadge } from "../MICCapBadge";
import { OwnershipPieChart } from "../OwnershipPieChart";

type InvestorPositionCardProps = {
	/**
	 * Investor name or ID
	 */
	investorName: string;
	/**
	 * Capital class (e.g., "MICCAP-FLMIC/0")
	 */
	capitalClass: string;
	/**
	 * Number of units owned
	 */
	unitsOwned: number;
	/**
	 * Ownership percentage (0-100)
	 */
	ownershipPercentage: number;
	/**
	 * Current dollar value of the position
	 */
	currentValue: number;
	/**
	 * Accrual status
	 */
	accrualStatus: "up-to-date" | "pending" | "behind";
	/**
	 * Last accrued date
	 */
	lastAccruedDate?: Date | string;
	/**
	 * Optional className for the container
	 */
	className?: string;
};

/**
 * A detailed position card for an individual investor.
 * Combines badges, charts, and status indicators in a compact layout.
 * Optimized for display within sheets or detail views.
 */
export function InvestorPositionCard({
	investorName,
	capitalClass,
	unitsOwned,
	ownershipPercentage,
	currentValue,
	accrualStatus,
	lastAccruedDate,
	className,
}: InvestorPositionCardProps) {
	return (
		<Card
			className={cn(
				"overflow-hidden border-none shadow-sm dark:bg-slate-900/40",
				className
			)}
		>
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between">
					<CardTitle className="font-bold text-muted-foreground/80 text-sm uppercase tracking-wider">
						Investor Position
					</CardTitle>
					<MICCapBadge capitalClass={capitalClass} variant="success" />
				</div>
				<h3 className="font-bold text-foreground text-xl tracking-tight">
					{investorName}
				</h3>
			</CardHeader>
			<CardContent className="flex flex-col gap-6">
				<div className="flex items-center justify-between gap-4">
					<div className="flex flex-1 flex-col justify-center">
						<div className="flex flex-col gap-0.5">
							<span className="font-bold text-[10px] text-muted-foreground/60 uppercase tracking-widest">
								Units Owned
							</span>
							<span className="font-bold text-foreground text-lg">
								{unitsOwned.toLocaleString()}
							</span>
						</div>
						<Separator className="my-3 opacity-50" />
						<div className="flex flex-col gap-0.5">
							<span className="font-bold text-[10px] text-muted-foreground/60 uppercase tracking-widest">
								Current Value
							</span>
							<span className="font-bold text-lg text-primary">
								${currentValue.toLocaleString()}
							</span>
						</div>
					</div>

					<div className="flex shrink-0 items-center justify-center">
						<OwnershipPieChart
							className="h-32 min-h-0 w-32"
							innerRadius={30}
							label="Share"
							outerRadius={45}
							percentage={ownershipPercentage}
							subLabel="Ownership"
						/>
					</div>
				</div>

				<div className="rounded-xl bg-muted/30 p-4">
					<div className="flex flex-col gap-3">
						<span className="font-bold text-[10px] text-muted-foreground/60 uppercase tracking-widest">
							Accrual Status
						</span>
						<AccrualStatusIndicator
							lastAccruedDate={lastAccruedDate}
							status={accrualStatus}
						/>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
