"use client";

import type { LucideIcon } from "lucide-react";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Trend = {
	direction: "up" | "down" | "neutral";
	value: string;
};

type SummaryCardProps = {
	title: string;
	value: string | number;
	subtitle: string;
	icon?: LucideIcon;
	trend?: Trend;
	className?: string;
};

const trendIcons: Record<Trend["direction"], LucideIcon> = {
	up: TrendingUp,
	down: TrendingDown,
	neutral: Minus,
};

const trendColors: Record<Trend["direction"], string> = {
	up: "text-emerald-600 dark:text-emerald-400",
	down: "text-red-600 dark:text-red-400",
	neutral: "text-slate-500 dark:text-slate-400",
};

export function SummaryCard({
	title,
	value,
	subtitle,
	icon: Icon,
	trend,
	className,
}: SummaryCardProps) {
	const TrendIcon = trend ? trendIcons[trend.direction] : null;

	return (
		<Card
			className={cn(
				"relative overflow-hidden transition-shadow hover:shadow-md",
				className
			)}
		>
			<CardContent className="p-6">
				{/* Decorative gradient */}
				<div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-gradient-to-bl from-primary/5 to-transparent" />

				<div className="relative">
					<div className="mb-3 flex items-center justify-between">
						<span className="font-medium text-muted-foreground text-sm">
							{title}
						</span>
						{Icon && (
							<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
								<Icon className="h-4 w-4 text-primary" />
							</div>
						)}
					</div>

					<div className="space-y-1">
						<p className="font-bold text-3xl tabular-nums tracking-tight">
							{value}
						</p>

						<div className="flex items-center gap-2">
							<span className="text-muted-foreground text-sm">{subtitle}</span>
							{trend && TrendIcon && (
								<span
									className={cn(
										"flex items-center gap-0.5 font-medium text-xs",
										trendColors[trend.direction]
									)}
								>
									<TrendIcon className="h-3 w-3" />
									{trend.value}
								</span>
							)}
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
