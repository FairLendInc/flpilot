"use client";

import {
	Building2,
	type LucideIcon,
	TrendingUp,
	Users,
	Wallet,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MetricItem = {
	label: string;
	value: string | number;
	change?: string;
	trend?: "up" | "down" | "neutral";
	icon: LucideIcon;
	color: string;
	bgGradient: string;
};

type MICFundMetricsRowProps = {
	/**
	 * Array of 4 metrics to display
	 */
	metrics?: MetricItem[];
	/**
	 * Optional className for the container
	 */
	className?: string;
};

const defaultMetrics: MetricItem[] = [
	{
		label: "Total AUM",
		value: "$12,450,000",
		change: "+2.5% from last month",
		trend: "up",
		icon: Building2,
		color: "text-blue-500",
		bgGradient: "from-blue-500/10 to-blue-500/5",
	},
	{
		label: "Total Capital",
		value: "$11,200,000",
		change: "+1.2% from last month",
		trend: "up",
		icon: TrendingUp,
		color: "text-emerald-500",
		bgGradient: "from-emerald-500/10 to-emerald-500/5",
	},
	{
		label: "Investor Count",
		value: "142",
		change: "+3 new this month",
		trend: "up",
		icon: Users,
		color: "text-indigo-500",
		bgGradient: "from-indigo-500/10 to-indigo-500/5",
	},
	{
		label: "Cash Balance",
		value: "$1,250,560",
		change: "-5% from last week",
		trend: "down",
		icon: Wallet,
		color: "text-amber-500",
		bgGradient: "from-amber-500/10 to-amber-500/5",
	},
];

/**
 * A responsive row of metric cards for the MIC dashboard.
 * Features premium glassmorphism effects and visual trend indicators.
 */
export function MICFundMetricsRow({
	metrics = defaultMetrics,
	className,
}: MICFundMetricsRowProps) {
	return (
		<div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
			{metrics.slice(0, 4).map((metric) => (
				<Card
					className={cn(
						"relative overflow-hidden border-none bg-linear-to-br transition-all duration-300 hover:shadow-md dark:shadow-none",
						metric.bgGradient
					)}
					key={metric.label}
				>
					<div className="-mr-4 -mt-4 absolute top-0 right-0 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div
								className={cn(
									"rounded-lg bg-background/50 p-2 shadow-xs",
									metric.color
								)}
							>
								<metric.icon className="size-5" />
							</div>
							{metric.trend && (
								<div
									className={cn(
										"flex items-center gap-0.5 font-bold text-xs",
										metric.trend === "up"
											? "text-emerald-600 dark:text-emerald-400"
											: metric.trend === "down"
												? "text-rose-600 dark:text-rose-400"
												: "text-muted-foreground"
									)}
								>
									{metric.trend === "up"
										? "↑"
										: metric.trend === "down"
											? "↓"
											: "→"}
									{metric.change?.split(" ")[0]}
								</div>
							)}
						</div>
						<div className="mt-4 flex flex-col gap-0.5">
							<span className="font-bold text-muted-foreground/80 text-xs uppercase tracking-wider">
								{metric.label}
							</span>
							<span className="font-bold text-2xl text-foreground tracking-tight">
								{metric.value}
							</span>
						</div>
						{metric.change && (
							<p className="mt-1 font-medium text-[10px] text-muted-foreground">
								{metric.change}
							</p>
						)}
					</CardContent>
				</Card>
			))}
		</div>
	);
}
