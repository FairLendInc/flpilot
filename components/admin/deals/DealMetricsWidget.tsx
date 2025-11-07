/**
 * Deal Metrics Widget
 *
 * Displays deal statistics on the admin dashboard including:
 * - Total active deals count
 * - Deals by state breakdown
 * - Recent state transitions
 */

"use client";

import { useQuery } from "convex/react";
import { format } from "date-fns";
import {
	Activity,
	ArrowRight,
	CheckCircle,
	Clock,
	XCircle,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import {
	DEAL_STATE_COLORS,
	DEAL_STATE_LABELS,
	type DealStateValue,
} from "@/lib/types/dealTypes";

export function ActiveDealsMetricCard() {
	const metrics = useQuery(api.deals.getDealMetrics);

	if (!metrics) {
		return (
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">Active Deals</CardTitle>
					<Activity className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-8 w-20" />
					<Skeleton className="mt-1 h-4 w-32" />
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="font-medium text-sm">Active Deals</CardTitle>
				<Activity className="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div className="font-bold text-2xl">{metrics.totalActive}</div>
				<p className="text-muted-foreground text-xs">
					{metrics.totalCompleted} completed • {metrics.totalCancelled}{" "}
					cancelled
				</p>
			</CardContent>
		</Card>
	);
}

export function DealCompletionTimeCard() {
	const metrics = useQuery(api.deals.getDealMetrics);

	if (!metrics) {
		return (
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">
						Avg. Time to Complete
					</CardTitle>
					<Clock className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-8 w-20" />
					<Skeleton className="mt-1 h-4 w-32" />
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="font-medium text-sm">
					Avg. Time to Complete
				</CardTitle>
				<Clock className="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div className="font-bold text-2xl">
					{metrics.averageDaysToComplete > 0
						? `${metrics.averageDaysToComplete}d`
						: "N/A"}
				</div>
				<p className="text-muted-foreground text-xs">
					{metrics.totalCompleted > 0
						? `Based on ${metrics.totalCompleted} completed deals`
						: "No completed deals yet"}
				</p>
			</CardContent>
		</Card>
	);
}

export function DealsByStateWidget() {
	const metrics = useQuery(api.deals.getDealMetrics);

	if (!metrics) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Deals by State</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{[1, 2, 3, 4].map((i) => (
							<Skeleton className="h-8 w-full" key={i} />
						))}
					</div>
				</CardContent>
			</Card>
		);
	}

	// Sort states by count (descending)
	const sortedStates = Object.entries(metrics.byState)
		.filter(([state]) => state !== "archived") // Exclude archived from this view
		.sort(([, a], [, b]) => b - a);

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle>Deals by State</CardTitle>
				<Button asChild size="sm" variant="ghost">
					<Link href="/dashboard/admin/deals">
						View Kanban
						<ArrowRight className="ml-2 h-4 w-4" />
					</Link>
				</Button>
			</CardHeader>
			<CardContent>
				{sortedStates.length === 0 ? (
					<p className="py-8 text-center text-muted-foreground text-sm">
						No active deals
					</p>
				) : (
					<div className="space-y-3">
						{sortedStates.map(([state, count]) => {
							const stateValue = state as DealStateValue;
							const color = DEAL_STATE_COLORS[stateValue];
							const label = DEAL_STATE_LABELS[stateValue];

							return (
								<div
									className="flex items-center justify-between rounded-lg border p-3"
									key={state}
								>
									<div className="flex items-center gap-3">
										<div
											className="h-3 w-3 rounded-full"
											style={{ backgroundColor: color }}
										/>
										<span className="font-medium text-sm">{label}</span>
									</div>
									<Badge variant="secondary">{count}</Badge>
								</div>
							);
						})}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

export function RecentDealActivityWidget() {
	const metrics = useQuery(api.deals.getDealMetrics);

	if (!metrics) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Recent Deal Activity</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{[1, 2, 3, 4, 5].map((i) => (
							<Skeleton className="h-16 w-full" key={i} />
						))}
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle>Recent Activity</CardTitle>
				<Badge variant="outline">
					{metrics.recentActivity.length} transitions
				</Badge>
			</CardHeader>
			<CardContent>
				{metrics.recentActivity.length === 0 ? (
					<p className="py-8 text-center text-muted-foreground text-sm">
						No recent activity
					</p>
				) : (
					<div className="space-y-3">
						{metrics.recentActivity.map((activity) => {
							const fromColor =
								DEAL_STATE_COLORS[activity.fromState as DealStateValue];
							const toColor =
								DEAL_STATE_COLORS[activity.toState as DealStateValue];

							return (
								<div
									className="flex w-full cursor-pointer items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring"
									key={`${activity.dealId}-${activity.timestamp}`}
									onClick={() => {
										// TODO: Navigate to deal detail
									}}
									onKeyDown={(e) => {
										if (e.key === "Enter" || e.key === " ") {
											e.preventDefault();
											// TODO: Navigate to deal detail
										}
									}}
									role="button"
									tabIndex={0}
								>
									<div className="flex min-w-0 flex-1 items-center gap-3">
										<div className="flex items-center gap-1">
											<div
												className="h-2 w-2 flex-shrink-0 rounded-full"
												style={{ backgroundColor: fromColor }}
											/>
											<ArrowRight className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
											<div
												className="h-2 w-2 flex-shrink-0 rounded-full"
												style={{ backgroundColor: toColor }}
											/>
										</div>
										<div className="min-w-0 flex-1">
											<p className="truncate font-medium text-sm">
												{
													DEAL_STATE_LABELS[
														activity.fromState as DealStateValue
													]
												}{" "}
												→{" "}
												{DEAL_STATE_LABELS[activity.toState as DealStateValue]}
											</p>
											<p className="text-muted-foreground text-xs">
												{format(
													new Date(activity.timestamp),
													"MMM d, yyyy HH:mm"
												)}
											</p>
										</div>
									</div>
									<Button asChild size="sm" variant="ghost">
										<Link href={`/dashboard/admin/deals/${activity.dealId}`}>
											View
										</Link>
									</Button>
								</div>
							);
						})}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

export function DealsOverviewCards() {
	const metrics = useQuery(api.deals.getDealMetrics);

	if (!metrics) {
		return (
			<>
				<Skeleton className="h-32 w-full" />
				<Skeleton className="h-32 w-full" />
			</>
		);
	}

	return (
		<>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">Completed Deals</CardTitle>
					<CheckCircle className="h-4 w-4 text-green-600" />
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">{metrics.totalCompleted}</div>
					<p className="text-muted-foreground text-xs">
						{metrics.averageDaysToComplete > 0
							? `Avg. ${metrics.averageDaysToComplete} days`
							: "No completions yet"}
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">Cancelled Deals</CardTitle>
					<XCircle className="h-4 w-4 text-red-600" />
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">{metrics.totalCancelled}</div>
					<p className="text-muted-foreground text-xs">
						{metrics.totalActive +
							metrics.totalCompleted +
							metrics.totalCancelled >
						0
							? `${Math.round(
									(metrics.totalCancelled /
										(metrics.totalActive +
											metrics.totalCompleted +
											metrics.totalCancelled)) *
										100
								)}% of total`
							: "No deals yet"}
					</p>
				</CardContent>
			</Card>
		</>
	);
}
