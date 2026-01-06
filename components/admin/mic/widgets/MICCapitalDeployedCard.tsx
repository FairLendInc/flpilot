"use client";

import {
	CreditCard,
	DollarSign,
	LayoutDashboard,
	PieChart,
} from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MICCapitalDeployedCardProps = {
	totalAUM: number;
	totalCapitalDeployed: number;
	micValue: number;
	cashOnHand: number;
	className?: string;
};

export function MICCapitalDeployedCard({
	totalAUM,
	totalCapitalDeployed,
	micValue,
	cashOnHand,
	className,
}: MICCapitalDeployedCardProps) {
	const metrics = [
		{
			label: "Total AUM",
			value: totalAUM,
			icon: LayoutDashboard,
			color: "text-blue-500",
		},
		{
			label: "Capital Deployed",
			value: totalCapitalDeployed,
			icon: PieChart,
			color: "text-emerald-500",
		},
		{
			label: "MIC Value",
			value: micValue,
			icon: DollarSign,
			color: "text-indigo-500",
		},
		{
			label: "Cash on Hand",
			value: cashOnHand,
			icon: CreditCard,
			color: "text-amber-500",
		},
	];

	return (
		<Card
			className={cn("border-none shadow-sm dark:bg-slate-900/50", className)}
		>
			<CardHeader className="pb-4">
				<CardTitle className="font-bold text-muted-foreground/80 text-sm uppercase tracking-wider">
					Capital Deployment
				</CardTitle>
				<CardDescription className="text-xs">
					Breakdown of fund capitalization and utilization.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-2 gap-4">
					{metrics.map((m) => (
						<div
							className="group relative flex flex-col gap-1 rounded-xl border border-transparent bg-muted/30 p-4 transition-all hover:border-primary/10 hover:bg-muted/50"
							key={m.label}
						>
							<div className="flex items-center gap-2">
								<m.icon className={cn("size-3.5", m.color)} />
								<span className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
									{m.label}
								</span>
							</div>
							<span className="font-bold text-foreground text-lg tracking-tight">
								${(m.value / 100).toLocaleString()}
							</span>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
