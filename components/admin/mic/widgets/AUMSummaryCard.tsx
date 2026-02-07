"use client";

import { Building2, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { AccrualStatusIndicator } from "../AccrualStatusIndicator";
import { OwnershipPieChart } from "../OwnershipPieChart";

type AUMSummaryCardProps = {
	/**
	 * Mortgage name or identifier
	 */
	mortgageName: string;
	/**
	 * Property address or location
	 */
	address?: string;
	/**
	 * Total mortgage principal/value
	 */
	totalValue: number;
	/**
	 * MIC's current ownership percentage (0-100)
	 */
	ownershipPercentage: number;
	/**
	 * Current dollar value of MIC's portion
	 */
	micValue: number;
	/**
	 * Interest accrual status
	 */
	accrualStatus: "up-to-date" | "pending" | "behind";
	/**
	 * Last interest accrual/payment date
	 */
	lastAccruedDate?: Date | string;
	/**
	 * Optional className for the container
	 */
	className?: string;
};

/**
 * A detailed AUM summary card for an individual mortgage asset.
 * Visualizes MIC's fractional ownership and interest accrual status.
 * Optimized for display within sheets or property detail views.
 */
export function AUMSummaryCard({
	mortgageName,
	address,
	totalValue,
	ownershipPercentage,
	micValue,
	accrualStatus,
	lastAccruedDate,
	className,
}: AUMSummaryCardProps) {
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
						AUM Asset Details
					</CardTitle>
					<div className="rounded-lg bg-blue-500/10 p-1.5 text-blue-500">
						<Building2 className="size-4" />
					</div>
				</div>
				<h3 className="font-bold text-foreground text-xl tracking-tight">
					{mortgageName}
				</h3>
				{address && (
					<div className="flex items-center gap-1.5 font-medium text-muted-foreground text-xs">
						<MapPin className="size-3" />
						{address}
					</div>
				)}
			</CardHeader>
			<CardContent className="flex flex-col gap-6">
				<div className="flex items-center justify-between gap-4">
					<div className="flex flex-1 flex-col justify-center">
						<div className="flex flex-col gap-0.5">
							<span className="font-bold text-[10px] text-muted-foreground/60 uppercase tracking-widest">
								Total Principal
							</span>
							<span className="font-bold text-foreground text-lg">
								${totalValue.toLocaleString()}
							</span>
						</div>
						<Separator className="my-3 opacity-50" />
						<div className="flex flex-col gap-0.5">
							<span className="font-bold text-[10px] text-muted-foreground/60 uppercase tracking-widest">
								MIC Portion
							</span>
							<span className="font-bold text-lg text-primary">
								${micValue.toLocaleString()}
							</span>
						</div>
					</div>

					<div className="flex shrink-0 items-center justify-center">
						<OwnershipPieChart
							className="h-32 min-h-0 w-32"
							color="hsl(var(--primary))"
							innerRadius={30}
							label="MIC"
							outerRadius={45}
							percentage={ownershipPercentage}
							subLabel="Share"
						/>
					</div>
				</div>

				<div className="rounded-xl bg-muted/30 p-4">
					<div className="flex flex-col gap-3">
						<span className="font-bold text-[10px] text-muted-foreground/60 uppercase tracking-widest">
							Interest Accrual
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
