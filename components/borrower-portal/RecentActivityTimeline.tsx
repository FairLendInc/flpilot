"use client";

import { format } from "date-fns";
import { ArrowRight, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ActivityStatus = "cleared" | "pending" | "failed";

type Activity = {
	id: string;
	date: string;
	type: "payment_collected" | "payment_scheduled" | "payment_failed";
	amount: number;
	propertyAddress: string;
	status: ActivityStatus;
};

type RecentActivityTimelineProps = {
	activities: Activity[];
	onViewAll?: () => void;
	maxItems?: number;
	className?: string;
};

const statusConfig: Record<
	ActivityStatus,
	{
		icon: React.ElementType;
		label: string;
		iconClassName: string;
		lineClassName: string;
	}
> = {
	cleared: {
		icon: CheckCircle2,
		label: "Payment Collected",
		iconClassName:
			"text-emerald-500 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400",
		lineClassName: "bg-emerald-200 dark:bg-emerald-800",
	},
	pending: {
		icon: Clock,
		label: "Payment Scheduled",
		iconClassName:
			"text-amber-500 bg-amber-100 dark:bg-amber-950 dark:text-amber-400",
		lineClassName: "bg-amber-200 dark:bg-amber-800",
	},
	failed: {
		icon: XCircle,
		label: "Payment Failed",
		iconClassName: "text-red-500 bg-red-100 dark:bg-red-950 dark:text-red-400",
		lineClassName: "bg-red-200 dark:bg-red-800",
	},
};

function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("en-CA", {
		style: "currency",
		currency: "CAD",
	}).format(amount);
}

export function RecentActivityTimeline({
	activities,
	onViewAll,
	maxItems = 5,
	className,
}: RecentActivityTimelineProps) {
	const displayedActivities = activities.slice(0, maxItems);

	return (
		<Card className={cn("overflow-hidden", className)}>
			<CardHeader className="flex flex-row items-center justify-between pb-4">
				<CardTitle className="font-semibold text-lg">Recent Activity</CardTitle>
				{onViewAll && activities.length > maxItems && (
					<Button
						className="gap-1.5 text-sm"
						onClick={onViewAll}
						size="sm"
						variant="ghost"
					>
						View All
						<ArrowRight className="h-4 w-4" />
					</Button>
				)}
			</CardHeader>

			<CardContent className="pb-6">
				{displayedActivities.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-8 text-center">
						<Clock className="mb-3 h-10 w-10 text-muted-foreground/30" />
						<p className="text-muted-foreground text-sm">No recent activity</p>
					</div>
				) : (
					<div className="relative">
						{displayedActivities.map((activity, index) => {
							const config = statusConfig[activity.status];
							const Icon = config.icon;
							const isLast = index === displayedActivities.length - 1;

							return (
								<div className="relative flex gap-4" key={activity.id}>
									{/* Timeline line */}
									{!isLast && (
										<div
											className={cn(
												"absolute top-10 left-4 h-[calc(100%-16px)] w-0.5",
												config.lineClassName
											)}
										/>
									)}

									{/* Icon */}
									<div
										className={cn(
											"relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
											config.iconClassName
										)}
									>
										<Icon className="h-4 w-4" />
									</div>

									{/* Content */}
									<div className="flex-1 pb-6">
										<div className="flex items-start justify-between gap-2">
											<div>
												<p className="font-medium text-sm">
													{format(new Date(activity.date), "MMM d, yyyy")}
												</p>
												<p className="text-muted-foreground text-xs">
													{config.label}
												</p>
											</div>
											<span className="font-semibold text-sm tabular-nums">
												{formatCurrency(activity.amount)}
											</span>
										</div>
										<p className="mt-1 text-muted-foreground text-xs">
											{activity.propertyAddress.split(",")[0]}
										</p>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

export type { Activity, ActivityStatus };
