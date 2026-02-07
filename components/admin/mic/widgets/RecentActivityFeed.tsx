"use client";

import { formatDistanceToNow } from "date-fns";
import {
	ArrowDownLeft,
	ArrowUpRight,
	Coins,
	type LucideIcon,
	Percent,
	ReceiptText,
	UserPlus,
} from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ActivityType =
	| "subscription"
	| "origination"
	| "sale"
	| "distribution"
	| "redemption"
	| "interest"
	| "fee"
	| "other";

type ActivityItem = {
	id: string;
	type: ActivityType;
	title: string;
	description: string;
	timestamp: Date | string;
	amount?: string;
};

type RecentActivityFeedProps = {
	/**
	 * Array of activity items to display
	 */
	activities: ActivityItem[];
	/**
	 * Optional className for the container
	 */
	className?: string;
};

const activityConfig: Record<
	ActivityType,
	{ icon: LucideIcon; color: string; bgColor: string }
> = {
	subscription: {
		icon: UserPlus,
		color: "text-blue-500",
		bgColor: "bg-blue-500/10",
	},
	origination: {
		icon: ArrowUpRight,
		color: "text-emerald-500",
		bgColor: "bg-emerald-500/10",
	},
	sale: {
		icon: ArrowDownLeft,
		color: "text-amber-500",
		bgColor: "bg-amber-500/10",
	},
	distribution: {
		icon: Coins,
		color: "text-indigo-500",
		bgColor: "bg-indigo-500/10",
	},
	redemption: {
		icon: Percent,
		color: "text-rose-500",
		bgColor: "bg-rose-500/10",
	},
	interest: {
		icon: ArrowDownLeft,
		color: "text-emerald-500",
		bgColor: "bg-emerald-500/10",
	},
	fee: {
		icon: ReceiptText,
		color: "text-slate-500",
		bgColor: "bg-slate-500/10",
	},
	other: {
		icon: ReceiptText,
		color: "text-slate-500",
		bgColor: "bg-slate-500/10",
	},
};

/**
 * A vertical timeline showing recent MIC activities.
 * Designed with premium aesthetics including status icons and relative timestamps.
 */
export function RecentActivityFeed({
	activities,
	className,
}: RecentActivityFeedProps) {
	return (
		<Card
			className={cn(
				"flex flex-col border-none shadow-sm dark:bg-slate-900/50",
				className
			)}
		>
			<CardHeader className="pb-4">
				<CardTitle className="font-bold text-muted-foreground/80 text-sm uppercase tracking-wider">
					Recent Activity
				</CardTitle>
				<CardDescription className="text-xs">
					Latest ledger transactions and events.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="relative space-y-6 before:absolute before:inset-y-0 before:left-[1rem] before:w-[1px] before:bg-border/60">
					{activities.length === 0 ? (
						<p className="py-8 text-center text-muted-foreground text-xs">
							No recent activity to show.
						</p>
					) : (
						activities.map((activity) => {
							const config =
								activityConfig[activity.type] || activityConfig.other;
							const Icon = config.icon;
							const date =
								typeof activity.timestamp === "string"
									? new Date(activity.timestamp)
									: activity.timestamp;

							return (
								<div
									className="relative flex gap-4 pl-0 transition-all duration-300 hover:translate-x-1"
									key={activity.id}
								>
									<div
										className={cn(
											"relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-background shadow-xs",
											config.bgColor,
											config.color
										)}
									>
										<Icon className="size-4" />
									</div>
									<div className="flex flex-1 flex-col gap-0.5 pt-0.5">
										<div className="flex items-center justify-between">
											<h4 className="font-bold text-foreground text-sm tracking-tight">
												{activity.title}
											</h4>
											{activity.amount && (
												<span className="font-bold text-foreground text-sm">
													{activity.amount}
												</span>
											)}
										</div>
										<p className="font-medium text-muted-foreground/80 text-xs leading-relaxed">
											{activity.description}
										</p>
										<span className="mt-1 font-bold text-[10px] text-muted-foreground/50 uppercase tracking-widest">
											{formatDistanceToNow(date, { addSuffix: true })}
										</span>
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
