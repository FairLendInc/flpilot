"use client";

import {
	AlertCircle,
	ArrowRight,
	Banknote,
	Calendar,
	type LucideIcon,
	UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ActionType =
	| "subscription_approval"
	| "distribution_review"
	| "redemption_approval"
	| "origination_approval";

type ActionItem = {
	id: string;
	type: ActionType;
	title: string;
	description: string;
	dueDate?: string;
	priority: "high" | "medium" | "low";
};

type PendingActionsCardProps = {
	/**
	 * Array of pending action items
	 */
	actions: ActionItem[];
	/**
	 * Callback when an action is clicked
	 */
	onActionClick?: (action: ActionItem) => void;
	/**
	 * Optional className for the container
	 */
	className?: string;
};

const actionConfig: Record<ActionType, { icon: LucideIcon; label: string }> = {
	subscription_approval: {
		icon: UserCheck,
		label: "Subscription",
	},
	distribution_review: {
		icon: Calendar,
		label: "Distribution",
	},
	redemption_approval: {
		icon: Banknote,
		label: "Redemption",
	},
	origination_approval: {
		icon: AlertCircle,
		label: "Origination",
	},
};

/**
 * A dashboard widget for critical MIC admin tasks requiring immediate attention.
 * Features priority-aware styling and direct action buttons.
 */
export function PendingActionsCard({
	actions,
	onActionClick,
	className,
}: PendingActionsCardProps) {
	return (
		<Card
			className={cn(
				"flex flex-col border-none shadow-sm dark:bg-slate-900/50",
				className
			)}
		>
			<CardHeader className="pb-4">
				<CardTitle className="font-bold text-muted-foreground/80 text-sm uppercase tracking-wider">
					Pending Actions
				</CardTitle>
				<CardDescription className="text-xs">
					Items requiring your review or approval.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					{actions.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-10 text-center">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
								<UserCheck className="size-5" />
							</div>
							<p className="mt-2 font-bold text-foreground text-xs">
								All caught up!
							</p>
							<p className="font-medium text-[10px] text-muted-foreground">
								No pending actions at this time.
							</p>
						</div>
					) : (
						actions.map((action) => {
							const { icon: Icon } = actionConfig[action.type];

							return (
								<div
									className="group relative flex items-center justify-between gap-4 rounded-xl border border-transparent bg-muted/30 p-3 transition-all duration-300 hover:border-border hover:bg-muted/50"
									key={action.id}
								>
									<div className="flex min-w-0 items-center gap-3">
										<div
											className={cn(
												"flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-xs",
												action.priority === "high"
													? "bg-rose-500/10 text-rose-500"
													: action.priority === "medium"
														? "bg-amber-500/10 text-amber-500"
														: "bg-blue-500/10 text-blue-500"
											)}
										>
											<Icon className="size-5" />
										</div>
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-2">
												<h4 className="truncate font-bold text-foreground text-sm tracking-tight">
													{action.title}
												</h4>
												<span
													className={cn(
														"rounded-full px-1.5 py-0.5 font-bold text-[9px] uppercase tracking-tighter",
														action.priority === "high"
															? "bg-rose-500/10 text-rose-600"
															: action.priority === "medium"
																? "bg-amber-500/10 text-amber-600"
																: "bg-blue-500/10 text-blue-600"
													)}
												>
													{action.priority}
												</span>
											</div>
											<p className="truncate font-medium text-muted-foreground/80 text-xs">
												{action.description}
											</p>
										</div>
									</div>
									<Button
										className="h-8 w-8 shrink-0 rounded-lg group-hover:bg-background group-hover:shadow-sm"
										onClick={() => onActionClick?.(action)}
										size="icon"
										variant="ghost"
										aria-label={`Perform ${action.title}`}
									>
										<ArrowRight className="size-4" />
									</Button>
								</div>
							);
						})
					)}
				</div>
			</CardContent>
		</Card>
	);
}
