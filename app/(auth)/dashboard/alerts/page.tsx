/**
 * Alerts Page
 *
 * Displays all alerts for the current user with filtering and pagination.
 */

"use client";

import { useMutation } from "convex/react";
import {
	AlertCircle,
	ArrowRightCircle,
	Bell,
	CheckCircle,
	PlusCircle,
	XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
	type Alert,
	type AlertType,
	getAlertTypeLabel,
	getTimeAgo,
} from "@/lib/types/dealTypes";
import { cn } from "@/lib/utils";
import { useAuthenticatedQuery } from "@/convex/lib/client";

// Map alert type strings to icon components
const ALERT_ICONS: Record<string, typeof Bell> = {
	deal_created: PlusCircle,
	deal_state_changed: ArrowRightCircle,
	deal_completed: CheckCircle,
	deal_cancelled: XCircle,
	deal_stuck: AlertCircle,
};

function AlertItem({
	alert,
	onMarkAsRead,
}: {
	alert: Alert;
	onMarkAsRead: (id: string) => void;
}) {
	const router = useRouter();
	const IconComponent = ALERT_ICONS[alert.type] || Bell;

	const handleClick = () => {
		if (!alert.read) {
			onMarkAsRead(alert._id);
		}
		if (alert.relatedDealId) {
			router.push(`/dashboard/admin/deals/${alert.relatedDealId}`);
		}
	};

	return (
		<Card
			className={cn(
				"cursor-pointer transition-colors hover:bg-muted/50",
				!alert.read && "border-l-4 border-l-primary"
			)}
			onClick={handleClick}
		>
			<CardContent className="p-4">
				<div className="flex gap-3">
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
									"h-5 w-5",
									alert.severity === "info" && "text-blue-600",
									alert.severity === "warning" && "text-yellow-600",
									alert.severity === "error" && "text-red-600"
								)}
							/>
						</div>
					</div>
					<div className="min-w-0 flex-1">
						<div className="flex items-start justify-between gap-2">
							<h3 className={cn("font-medium", !alert.read && "font-semibold")}>
								{alert.title}
							</h3>
							<div className="flex items-center gap-2">
								<Badge
									variant={
										alert.severity === "error" ? "destructive" : "secondary"
									}
								>
									{getAlertTypeLabel(alert.type as AlertType)}
								</Badge>
								{!alert.read && (
									<Badge className="bg-primary" variant="default">
										New
									</Badge>
								)}
							</div>
						</div>
						<p className="mt-1 text-muted-foreground text-sm">
							{alert.message}
						</p>
						<p className="mt-2 text-muted-foreground text-xs">
							{getTimeAgo(alert.createdAt)}
							{alert.readAt && ` • Read ${getTimeAgo(alert.readAt)}`}
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

export default function AlertsPage() {
	const allAlerts = useAuthenticatedQuery(api.alerts.getAllUserAlerts, {});
	const unreadAlerts = useAuthenticatedQuery(api.alerts.getUnreadAlerts, {});
	const unreadCount = useAuthenticatedQuery(api.alerts.getUnreadAlertCount, {});

	const markAlertAsRead = useMutation(api.alerts.markAlertAsRead);
	const markAllAsRead = useMutation(api.alerts.markAllAlertsAsRead);

	const handleMarkAsRead = async (alertId: string) => {
		try {
			await markAlertAsRead({ alertId: alertId as Id<"alerts"> });
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
		<>
			<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator className="mr-2 h-4" orientation="vertical" />
				<h1 className="font-semibold text-lg">Notifications</h1>
			</header>

			<div className="flex flex-1 flex-col gap-6 p-6">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="font-bold text-3xl tracking-tight">Notifications</h2>
						<p className="text-muted-foreground">
							Stay updated on deal activity and system events
						</p>
					</div>
					{unreadCount !== undefined && unreadCount > 0 && (
						<Button onClick={handleMarkAllAsRead}>
							Mark all as read ({unreadCount})
						</Button>
					)}
				</div>

				<Tabs className="w-full" defaultValue="unread">
					<TabsList>
						<TabsTrigger className="relative" value="unread">
							Unread
							{unreadCount !== undefined && unreadCount > 0 && (
								<Badge className="ml-2 h-5 px-1.5" variant="default">
									{unreadCount}
								</Badge>
							)}
						</TabsTrigger>
						<TabsTrigger value="all">All Notifications</TabsTrigger>
					</TabsList>

					<TabsContent className="mt-6 space-y-4" value="unread">
						{!unreadAlerts || unreadAlerts.length === 0 ? (
							<Card>
								<CardContent className="p-12 text-center">
									<Bell className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
									<h3 className="mb-2 font-medium text-lg">All caught up!</h3>
									<p className="text-muted-foreground">
										You have no unread notifications
									</p>
								</CardContent>
							</Card>
						) : (
							<div className="space-y-3">
								{unreadAlerts?.map((alert: Alert) => (
									<AlertItem
										alert={alert}
										key={alert._id}
										onMarkAsRead={handleMarkAsRead}
									/>
								))}
							</div>
						)}
					</TabsContent>

					<TabsContent className="mt-6 space-y-4" value="all">
						{!allAlerts || allAlerts.length === 0 ? (
							<Card>
								<CardContent className="p-12 text-center">
									<Bell className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
									<h3 className="mb-2 font-medium text-lg">
										No notifications yet
									</h3>
									<p className="text-muted-foreground">
										You'll see notifications here when there's activity
									</p>
								</CardContent>
							</Card>
						) : (
							<div className="space-y-3">
								{allAlerts.map((alert: Alert) => (
									<AlertItem
										alert={alert}
										key={alert._id}
										onMarkAsRead={handleMarkAsRead}
									/>
								))}
							</div>
						)}
					</TabsContent>
				</Tabs>
			</div>
		</>
	);
}
