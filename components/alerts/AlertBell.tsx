/**
 * Alert Bell Component
 *
 * Displays a bell icon in the navigation bar with an unread count badge.
 * Clicking opens a dropdown with recent alerts.
 */

"use client";

import { useMutation, useQuery } from "convex/react";
import {
	AlertCircle,
	ArrowRightCircle,
	Bell,
	CheckCircle,
	PlusCircle,
	XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/convex/_generated/api";
import { getTimeAgo } from "@/lib/types/dealTypes";
import { cn } from "@/lib/utils";

// Map alert type strings to icon components
const ALERT_ICONS: Record<string, typeof Bell> = {
	deal_created: PlusCircle,
	deal_state_changed: ArrowRightCircle,
	deal_completed: CheckCircle,
	deal_cancelled: XCircle,
	deal_stuck: AlertCircle,
};

export function AlertBell() {
	const router = useRouter();
	const [isOpen, setIsOpen] = useState(false);

	const unreadCount = useQuery(api.alerts.getUnreadAlertCount);
	const unreadAlerts = useQuery(api.alerts.getUnreadAlerts);
	const markAlertAsRead = useMutation(api.alerts.markAlertAsRead);
	const markAllAsRead = useMutation(api.alerts.markAllAlertsAsRead);

	// Auto-close dropdown when clicking an alert
	const handleAlertClick = async (alertId: string, dealId?: string) => {
		try {
			await markAlertAsRead({ alertId: alertId as any });
			setIsOpen(false);
			if (dealId) {
				router.push(`/dashboard/admin/deals/${dealId}`);
			}
		} catch (error) {
			console.error("Failed to mark alert as read:", error);
		}
	};

	const handleMarkAllAsRead = async () => {
		try {
			await markAllAsRead();
		} catch (error) {
			console.error("Failed to mark all as read:", error);
		}
	};

	return (
		<DropdownMenu onOpenChange={setIsOpen} open={isOpen}>
			<DropdownMenuTrigger asChild>
				<Button className="relative" size="icon" variant="ghost">
					<Bell className="h-5 w-5" />
					{unreadCount !== undefined && unreadCount > 0 && (
						<Badge
							className="-top-1 -right-1 absolute flex h-5 w-5 items-center justify-center p-0 text-xs"
							variant="destructive"
						>
							{unreadCount > 9 ? "9+" : unreadCount}
						</Badge>
					)}
					<span className="sr-only">Notifications</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-96">
				<DropdownMenuLabel className="flex items-center justify-between">
					<span>Notifications</span>
					{unreadCount !== undefined && unreadCount > 0 && (
						<Button
							className="h-auto p-0 font-normal text-xs"
							onClick={handleMarkAllAsRead}
							size="sm"
							variant="ghost"
						>
							Mark all as read
						</Button>
					)}
				</DropdownMenuLabel>
				<DropdownMenuSeparator />

				{!unreadAlerts || unreadAlerts.length === 0 ? (
					<div className="p-4 text-center text-muted-foreground text-sm">
						<Bell className="mx-auto mb-2 h-8 w-8 opacity-50" />
						<p>No new notifications</p>
					</div>
				) : (
					<>
						<ScrollArea className="h-[384px]">
							<div className="pr-4">
								{unreadAlerts.map((alert) => {
									const IconComponent = ALERT_ICONS[alert.type] || Bell;

									return (
										<DropdownMenuItem
											className="cursor-pointer p-3 hover:bg-muted/50"
											key={alert._id}
											onClick={() =>
												handleAlertClick(
													alert._id,
													alert.relatedDealId as string | undefined
												)
											}
										>
											<div className="flex w-full gap-3">
												<div className="flex-shrink-0">
													<div
														className={cn(
															"rounded-full p-2",
															alert.severity === "info" && "bg-blue-50",
															alert.severity === "warning" && "bg-yellow-50",
															alert.severity === "error" && "bg-red-50"
														)}
													>
														<IconComponent
															className={cn(
																"h-4 w-4",
																alert.severity === "info" && "text-blue-600",
																alert.severity === "warning" && "text-yellow-600",
																alert.severity === "error" && "text-red-600"
															)}
														/>
													</div>
												</div>
												<div className="min-w-0 flex-1">
													<p className="font-medium text-sm">{alert.title}</p>
													<p className="mt-0.5 line-clamp-2 text-muted-foreground text-xs">
														{alert.message}
													</p>
													<p className="mt-1 text-muted-foreground text-xs">
														{getTimeAgo(alert.createdAt)}
													</p>
												</div>
											</div>
										</DropdownMenuItem>
									);
								})}
							</div>
						</ScrollArea>
						<DropdownMenuSeparator />
						<div className="p-2">
							<Button
								className="w-full justify-center"
								onClick={() => {
									setIsOpen(false);
									router.push("/dashboard/alerts");
								}}
								size="sm"
								variant="ghost"
							>
								View all notifications
							</Button>
						</div>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
