"use client";

import { useMutation } from "convex/react";
import {
	AlertCircle,
	ArrowRightCircle,
	Banknote,
	Bell,
	Briefcase,
	Check,
	CheckCircle,
	CheckSquare,
	ClipboardList,
	FileSignature,
	FileText,
	Globe,
	ImageIcon,
	Keyboard,
	LinkIcon,
	Lock,
	MessageCircle,
	PanelLeft,
	PlusCircle,
	Scale,
	SearchCheck,
	Settings,
	Video,
	X,
	XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { Badge } from "@/components/ui/badge";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuthenticatedQuery } from "@/convex/lib/client";
import { useIsMobile } from "@/hooks/use-mobile";
import {
	DEAL_STATE_COLORS,
	DEAL_STATE_LABELS,
	formatDealValue,
	getTimeAgo,
} from "@/lib/types/dealTypes";
import { cn } from "@/lib/utils";

const sampleMessages = [
	{
		id: 1,
		sender: "John Doe",
		message: "Hey, how are you?",
		time: "10:30 AM",
		avatar: "JD",
	},
	{
		id: 2,
		sender: "Jane Smith",
		message: "Meeting at 3 PM today",
		time: "11:45 AM",
		avatar: "JS",
	},
	{
		id: 3,
		sender: "Mike Johnson",
		message: "Can you review the document?",
		time: "Yesterday",
		avatar: "MJ",
	},
	{
		id: 4,
		sender: "Sarah Williams",
		message: "Thanks for your help!",
		time: "Yesterday",
		avatar: "SW",
	},
	{
		id: 5,
		sender: "Tom Brown",
		message: "Project update attached",
		time: "2 days ago",
		avatar: "TB",
	},
];

const sampleMedia = [
	{
		id: 1,
		type: "image",
		name: "Screenshot 2024.png",
		size: "2.4 MB",
		date: "Today",
	},
	{
		id: 2,
		type: "image",
		name: "Photo_001.jpg",
		size: "1.8 MB",
		date: "Yesterday",
	},
	{
		id: 3,
		type: "video",
		name: "Meeting_Recording.mp4",
		size: "45.2 MB",
		date: "Yesterday",
	},
	{
		id: 4,
		type: "image",
		name: "Design_Mockup.png",
		size: "3.1 MB",
		date: "2 days ago",
	},
	{
		id: 5,
		type: "image",
		name: "Profile_Picture.jpg",
		size: "890 KB",
		date: "3 days ago",
	},
];

const sampleLinks = [
	{
		id: 1,
		url: "https://github.com/project",
		title: "GitHub Repository",
		date: "Today",
	},
	{
		id: 2,
		url: "https://docs.example.com",
		title: "Documentation",
		date: "Yesterday",
	},
	{
		id: 3,
		url: "https://figma.com/design",
		title: "Figma Design File",
		date: "2 days ago",
	},
	{
		id: 4,
		url: "https://notion.so/notes",
		title: "Meeting Notes",
		date: "3 days ago",
	},
];

const sampleFiles = [
	{ id: 1, name: "Project_Proposal.pdf", size: "1.2 MB", date: "Today" },
	{ id: 2, name: "Budget_2024.xlsx", size: "456 KB", date: "Yesterday" },
	{ id: 3, name: "Presentation.pptx", size: "8.9 MB", date: "2 days ago" },
	{ id: 4, name: "Contract_Draft.docx", size: "234 KB", date: "3 days ago" },
];

// Map alert type strings to icon components
const ALERT_ICONS: Record<string, typeof Bell> = {
	deal_created: PlusCircle,
	deal_state_changed: ArrowRightCircle,
	deal_completed: CheckCircle,
	deal_cancelled: XCircle,
	deal_stuck: AlertCircle,
};

// Map lock request status to colors
const STATUS_COLORS: Record<string, string> = {
	pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
	approved: "bg-green-100 text-green-800 border-green-200",
	rejected: "bg-red-100 text-red-800 border-red-200",
	expired: "bg-gray-100 text-gray-800 border-gray-200",
};

// Map deal state to icons
const DEAL_STATE_ICONS: Record<string, typeof Lock> = {
	locked: Lock,
	pending_lawyer: Scale,
	pending_docs: FileSignature,
	pending_transfer: Banknote,
	pending_verification: SearchCheck,
	completed: CheckCircle,
	cancelled: XCircle,
	archived: CheckCircle,
};

const sections = [
	{
		id: "notifications",
		name: "Notifications",
		icon: Bell,
	},
	{ id: "deals", name: "Deals", icon: Briefcase },
	{ id: "tasks", name: "Tasks", icon: CheckSquare, notificationCount: 3 },
	{ id: "deal-requests", name: "Deal Requests", icon: ClipboardList },
	{
		id: "messages",
		name: "Messages & media",
		icon: MessageCircle,
		hasSubTabs: true,
	},
	{ id: "language", name: "Language & region", icon: Globe },
	{ id: "accessibility", name: "Accessibility", icon: Keyboard },
	{ id: "mark-read", name: "Mark as read", icon: Check },
	{ id: "audio-video", name: "Audio & video", icon: Video },
	{ id: "connected", name: "Connected accounts", icon: LinkIcon },
	{ id: "privacy", name: "Privacy & visibility", icon: Lock },
	{ id: "advanced", name: "Advanced", icon: Settings },
];

const messageSubTabs = [
	{ id: "messages-list", name: "Messages", icon: MessageCircle },
	{ id: "media", name: "Media", icon: ImageIcon },
	{ id: "links", name: "Links", icon: LinkIcon },
	{ id: "files", name: "Files", icon: FileText },
];

function NotificationsContent() {
	const router = useRouter();
	const alerts = useAuthenticatedQuery(api.alerts.getAllUserAlerts, {
		limit: 50,
	});
	const unreadCount = useAuthenticatedQuery(api.alerts.getUnreadAlertCount, {});
	const markAlertAsRead = useMutation(api.alerts.markAlertAsRead);
	const markAllAsRead = useMutation(api.alerts.markAllAlertsAsRead);

	const handleMarkAsRead = async (alertId: Id<"alerts">) => {
		try {
			await markAlertAsRead({ alertId });
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

	const handleAlertClick = async (
		alertId: Id<"alerts">,
		dealId?: Id<"deals">,
		listingId?: Id<"listings">,
		lockRequestId?: Id<"lock_requests">
	) => {
		await handleMarkAsRead(alertId);
		if (dealId) {
			router.push(`/dashboard/admin/deals/${dealId}`);
		} else if (lockRequestId) {
			router.push("/dashboard/admin/lock-requests");
		} else if (listingId) {
			router.push(`/listings/${listingId}`);
		}
	};

	if (alerts === undefined) {
		return (
			<div className="space-y-3">
				{Array.from({ length: 5 }, (_, i) => (
					<Skeleton
						className="h-20 w-full"
						key={`alert-skeleton-${i}-${Date.now()}`}
					/>
				))}
			</div>
		);
	}

	if (alerts.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<Bell className="mb-4 h-12 w-12 text-muted-foreground opacity-50" />
				<p className="text-muted-foreground text-sm">No notifications</p>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{unreadCount !== undefined && unreadCount > 0 && (
				<div className="flex items-center justify-between border-b pb-3">
					<span className="text-muted-foreground text-sm">
						{unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
					</span>
					<Button onClick={handleMarkAllAsRead} size="sm" variant="ghost">
						Mark all as read
					</Button>
				</div>
			)}
			{alerts.map((alert) => {
				const IconComponent = ALERT_ICONS[alert.type] || Bell;

				return (
					<Card
						className={cn(
							"cursor-pointer transition-shadow hover:shadow-md",
							!alert.read && "border-primary/20 bg-primary/5"
						)}
						key={alert._id}
						onClick={() =>
							handleAlertClick(
								alert._id,
								alert.relatedDealId,
								alert.relatedListingId,
								alert.relatedLockRequestId
							)
						}
					>
						<CardContent className="flex gap-3 p-4">
							<div className="shrink-0">
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
								<div className="flex items-start justify-between gap-2">
									<p className="font-medium text-sm">{alert.title}</p>
									{!alert.read && (
										<div className="h-2 w-2 shrink-0 rounded-full bg-primary" />
									)}
								</div>
								<p className="mt-1 line-clamp-2 text-muted-foreground text-sm">
									{alert.message}
								</p>
								<p className="mt-2 text-muted-foreground text-xs">
									{getTimeAgo(alert.createdAt)}
								</p>
							</div>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}

function MessagesContent() {
	return (
		<div className="space-y-3">
			{sampleMessages.map((msg) => (
				<div className="flex gap-3 rounded-lg border bg-card p-3" key={msg.id}>
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground text-sm">
						{msg.avatar}
					</div>
					<div className="min-w-0 flex-1">
						<div className="flex items-center justify-between gap-2">
							<p className="font-medium text-sm">{msg.sender}</p>
							<span className="text-muted-foreground text-xs">{msg.time}</span>
						</div>
						<p className="truncate text-muted-foreground text-sm">
							{msg.message}
						</p>
					</div>
				</div>
			))}
		</div>
	);
}

function MediaContent() {
	return (
		<div className="grid grid-cols-2 gap-3">
			{sampleMedia.map((item) => (
				<div className="space-y-2 rounded-lg border bg-card p-3" key={item.id}>
					<div className="flex aspect-video items-center justify-center rounded-md bg-muted">
						{item.type === "image" ? (
							<ImageIcon className="h-8 w-8 text-muted-foreground" />
						) : (
							<Video className="h-8 w-8 text-muted-foreground" />
						)}
					</div>
					<div>
						<p className="truncate font-medium text-sm">{item.name}</p>
						<div className="flex items-center justify-between text-muted-foreground text-xs">
							<span>{item.size}</span>
							<span>{item.date}</span>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}

function LinksContent() {
	return (
		<div className="space-y-3">
			{sampleLinks.map((link) => (
				<div className="flex gap-3 rounded-lg border bg-card p-3" key={link.id}>
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
						<LinkIcon className="h-5 w-5 text-muted-foreground" />
					</div>
					<div className="min-w-0 flex-1">
						<p className="truncate font-medium text-sm">{link.title}</p>
						<p className="truncate text-muted-foreground text-xs">{link.url}</p>
						<span className="text-muted-foreground text-xs">{link.date}</span>
					</div>
				</div>
			))}
		</div>
	);
}

function FilesContent() {
	return (
		<div className="space-y-3">
			{sampleFiles.map((file) => (
				<div className="flex gap-3 rounded-lg border bg-card p-3" key={file.id}>
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
						<FileText className="h-5 w-5 text-muted-foreground" />
					</div>
					<div className="min-w-0 flex-1">
						<p className="truncate font-medium text-sm">{file.name}</p>
						<div className="flex items-center gap-2 text-muted-foreground text-xs">
							<span>{file.size}</span>
							<span>•</span>
							<span>{file.date}</span>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}

function DealsContent() {
	const router = useRouter();
	const deals = useAuthenticatedQuery(api.deals.getAllActiveDeals, {});

	function getDaysInState(_createdAt: number, updatedAt: number): number {
		return Math.floor((Date.now() - updatedAt) / (1000 * 60 * 60 * 24));
	}

	if (deals === undefined) {
		return (
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 6 }, (_, i) => (
					<Skeleton
						className="h-48 w-full"
						key={`deal-skeleton-${i}-${Date.now()}`}
					/>
				))}
			</div>
		);
	}

	if (deals.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<Briefcase className="mb-4 h-12 w-12 text-muted-foreground opacity-50" />
				<p className="text-muted-foreground text-sm">No active deals</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{deals.map((deal) => {
				const StateIcon = deal.currentState
					? DEAL_STATE_ICONS[deal.currentState] || Lock
					: Lock;
				const stateColor =
					DEAL_STATE_COLORS[
						deal.currentState as keyof typeof DEAL_STATE_COLORS
					] || "#8B7355";
				const daysInState = getDaysInState(deal.createdAt, deal.updatedAt);

				return (
					<Card
						className="cursor-pointer transition-shadow hover:shadow-lg"
						key={deal._id}
						onClick={() => router.push(`/dashboard/admin/deals/${deal._id}`)}
					>
						<CardContent className="space-y-3 p-4">
							<div className="flex items-start justify-between">
								<div className="flex min-w-0 flex-1 items-center gap-2">
									<StateIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
									<span className="truncate font-medium text-sm">
										{deal.mortgageAddress || "Address not available"}
									</span>
								</div>
							</div>

							<div className="space-y-2 text-muted-foreground text-xs">
								<div className="flex items-center justify-between">
									<span>Investor:</span>
									<span className="font-medium text-foreground">
										{deal.investorName}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span>Value:</span>
									<span className="font-medium text-foreground">
										{formatDealValue(deal.dealValue ?? 0)}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span>Days in state:</span>
									<span className="font-medium text-foreground">
										{daysInState}
									</span>
								</div>
							</div>

							<div className="border-t pt-2">
								<Badge
									className="w-full justify-center"
									style={{
										backgroundColor: `${stateColor}20`,
										borderColor: stateColor,
										color: stateColor,
									}}
									variant="outline"
								>
									{DEAL_STATE_LABELS[
										deal.currentState as keyof typeof DEAL_STATE_LABELS
									] || deal.currentState}
								</Badge>
							</div>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}

function DealRequestsContent() {
	const router = useRouter();
	const pendingRequests = useAuthenticatedQuery(
		api.lockRequests.getPendingLockRequestsWithDetails,
		{}
	);
	const approvedRequests = useAuthenticatedQuery(
		api.lockRequests.getApprovedLockRequestsWithDetails,
		{}
	);
	const rejectedRequests = useAuthenticatedQuery(
		api.lockRequests.getRejectedLockRequestsWithDetails,
		{}
	);

	// Combine all requests
	const allRequests = React.useMemo(() => {
		const pending = (pendingRequests || []).map((r) => ({
			...r,
			status: "pending" as const,
		}));
		const approved = (approvedRequests || []).map((r) => ({
			...r,
			status: "approved" as const,
		}));
		const rejected = (rejectedRequests || []).map((r) => ({
			...r,
			status: "rejected" as const,
		}));
		return [...pending, ...approved, ...rejected].sort(
			(a, b) => b.request.requestedAt - a.request.requestedAt
		);
	}, [pendingRequests, approvedRequests, rejectedRequests]);

	function formatAddress(
		mortgage: (typeof allRequests)[0]["mortgage"]
	): string {
		if (!mortgage) return "Address not available";
		return `${mortgage.address.street}, ${mortgage.address.city}, ${mortgage.address.state} ${mortgage.address.zip}`;
	}

	function formatInvestorName(
		investor: (typeof allRequests)[0]["investor"]
	): string {
		if (!investor) return "Unknown";
		if (investor.first_name && investor.last_name) {
			return `${investor.first_name} ${investor.last_name}`;
		}
		return investor.email;
	}

	if (
		pendingRequests === undefined ||
		approvedRequests === undefined ||
		rejectedRequests === undefined
	) {
		return (
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 6 }, (_, i) => (
					<Skeleton
						className="h-56 w-full"
						key={`request-skeleton-${i}-${Date.now()}`}
					/>
				))}
			</div>
		);
	}

	if (allRequests.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<ClipboardList className="mb-4 h-12 w-12 text-muted-foreground opacity-50" />
				<p className="text-muted-foreground text-sm">No deal requests</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{allRequests.map((requestData) => {
				const status = requestData.status;
				const statusColor = STATUS_COLORS[status] || STATUS_COLORS.pending;
				const address = formatAddress(requestData.mortgage);
				const investorName = formatInvestorName(requestData.investor);

				return (
					<Card
						className="cursor-pointer transition-shadow hover:shadow-lg"
						key={requestData.request._id}
						onClick={() => router.push("/dashboard/admin/lock-requests")}
					>
						<CardContent className="space-y-3 p-4">
							<div className="flex items-start justify-between">
								<div className="min-w-0 flex-1">
									<p className="truncate font-medium text-sm">{address}</p>
								</div>
							</div>

							<div className="space-y-2 text-muted-foreground text-xs">
								<div className="flex items-center justify-between">
									<span>Investor:</span>
									<span className="ml-2 truncate font-medium text-foreground">
										{investorName}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span>Lawyer:</span>
									<span className="ml-2 truncate font-medium text-foreground">
										{requestData.request.lawyerName}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span>LSO #:</span>
									<span className="font-medium text-foreground">
										{requestData.request.lawyerLSONumber}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span>Requested:</span>
									<span className="font-medium text-foreground">
										{getTimeAgo(requestData.request.requestedAt)}
									</span>
								</div>
							</div>

							<div className="border-t pt-2">
								<Badge
									className={cn(
										"w-full justify-center capitalize",
										statusColor
									)}
									variant="outline"
								>
									{status}
								</Badge>
							</div>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}

export function SettingsDialog() {
	const [open, setOpen] = React.useState(true);
	const [activeSection, setActiveSection] = React.useState("notifications");
	const [activeSubTab, setActiveSubTab] = React.useState("messages-list");
	const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
	const isMobile = useIsMobile();
	const unreadCount = useAuthenticatedQuery(api.alerts.getUnreadAlertCount, {});

	// Update notification count dynamically
	const sectionsWithCounts = React.useMemo(
		() =>
			sections.map((section) => {
				if (section.id === "notifications") {
					return {
						...section,
						notificationCount: unreadCount ?? 0,
					};
				}
				return section;
			}),
		[unreadCount]
	);

	const renderContent = () => {
		if (activeSection === "messages") {
			switch (activeSubTab) {
				case "messages-list":
					return <MessagesContent />;
				case "media":
					return <MediaContent />;
				case "links":
					return <LinksContent />;
				case "files":
					return <FilesContent />;
				default:
					return <MessagesContent />;
			}
		}

		if (activeSection === "notifications") {
			return <NotificationsContent />;
		}

		if (activeSection === "deals") {
			return <DealsContent />;
		}

		if (activeSection === "deal-requests") {
			return <DealRequestsContent />;
		}

		const section = sections.find((s) => s.id === activeSection);
		return (
			<div className="flex h-full items-center justify-center text-muted-foreground">
				<p>Content for {section?.name} coming soon...</p>
			</div>
		);
	};

	const getCurrentSectionName = () =>
		sections.find((s) => s.id === activeSection)?.name || "Settings";

	if (isMobile) {
		return (
			<Drawer onOpenChange={setOpen} open={open}>
				<DrawerTrigger asChild>
					<Button size="sm">Open Settings</Button>
				</DrawerTrigger>
				<DrawerContent className="z-200 flex h-[85vh] flex-col">
					<DrawerHeader className="border-b">
						<div className="flex items-center justify-between">
							<DrawerTitle>{getCurrentSectionName()}</DrawerTitle>
							<DrawerClose asChild>
								<Button size="icon-sm" variant="ghost">
									<X className="h-4 w-4" />
								</Button>
							</DrawerClose>
						</div>
						<DrawerDescription className="sr-only">
							View and manage your settings
						</DrawerDescription>
						{activeSection === "messages" && (
							<div className="scrollbar-hide flex gap-2 overflow-x-auto pt-3">
								{messageSubTabs.map((tab) => (
									<Button
										className={cn(
											"flex items-center justify-start gap-2 whitespace-nowrap text-left",
											activeSubTab !== tab.id && "text-muted-foreground"
										)}
										key={tab.id}
										onClick={() => setActiveSubTab(tab.id)}
										size="sm"
										type="button"
										variant={activeSubTab === tab.id ? "secondary" : "outline"}
									>
										<tab.icon className="h-4 w-4" />
										<span>{tab.name}</span>
									</Button>
								))}
							</div>
						)}
					</DrawerHeader>
					<div className="flex-1 overflow-y-auto p-4">{renderContent()}</div>
					<div className="border-t bg-background">
						<div className="scrollbar-hide flex gap-2 overflow-x-auto p-3">
							{sectionsWithCounts.map((section) => (
								<Button
									className={cn(
										"relative flex min-w-[88px] shrink-0 flex-col items-start gap-1.5 rounded-xl px-4 py-3 text-left text-xs",
										activeSection !== section.id && "text-muted-foreground"
									)}
									key={section.id}
									onClick={() => {
										setActiveSection(section.id);
										if (section.hasSubTabs) {
											setActiveSubTab("messages-list");
										}
									}}
									size="sm"
									type="button"
									variant={activeSection === section.id ? "default" : "outline"}
								>
									<div className="relative">
										<section.icon className="h-5 w-5" />
										{section.notificationCount &&
											section.notificationCount > 0 && (
												<Badge
													className="-top-2 -right-2 absolute flex h-4 min-w-4 items-center justify-center px-1 text-[10px]"
													variant="destructive"
												>
													{section.notificationCount}
												</Badge>
											)}
									</div>
									<span className="text-center leading-tight">
										{section.name}
									</span>
								</Button>
							))}
						</div>
					</div>
				</DrawerContent>
			</Drawer>
		);
	}

	return (
		<Dialog onOpenChange={setOpen} open={open}>
			<DialogTrigger asChild>
				<Button
					className="justify-start text-left"
					size="sm"
					variant="secondary"
				>
					Open Dialog
				</Button>
			</DialogTrigger>
			<DialogContent className="z-200 overflow-hidden p-0 md:max-h-[500px] md:max-w-[900px] lg:max-w-[1000px]">
				<DialogTitle className="sr-only">Settings</DialogTitle>
				<DialogDescription className="sr-only">
					Customize your settings here.
				</DialogDescription>
				<div className="flex h-[480px]">
					{/* Custom Sidebar */}
					<aside
						className={cn(
							"hidden flex-col border-r bg-muted/40 transition-all duration-300 sm:flex",
							sidebarCollapsed ? "w-16" : "sm:w-40 lg:w-64"
						)}
					>
						<nav className="flex-1 overflow-y-auto p-2">
							{sectionsWithCounts.map((section) => (
								<Button
									className={cn(
										"relative mb-1 w-full justify-start justify-items-start gap-3 px-3 py-2 text-left text-sm",
										sidebarCollapsed && "px-2"
									)}
									key={section.id}
									onClick={() => {
										setActiveSection(section.id);
										if (section.hasSubTabs) {
											setActiveSubTab("messages-list");
										}
									}}
									size="sm"
									title={sidebarCollapsed ? section.name : undefined}
									variant={activeSection === section.id ? "secondary" : "ghost"}
								>
									<div className="relative">
										<section.icon className="h-5 w-5 shrink-0" />
										{section.notificationCount &&
											section.notificationCount > 0 && (
												<Badge
													className="-top-1.5 -right-1.5 absolute flex h-4 min-w-4 items-center justify-center px-1 text-[10px]"
													variant="destructive"
												>
													{section.notificationCount}
												</Badge>
											)}
									</div>
									{!sidebarCollapsed && (
										<span className="flex-1 truncate">{section.name}</span>
									)}
									{!sidebarCollapsed &&
										section.notificationCount &&
										section.notificationCount > 0 && (
											<Badge
												className="ml-auto flex h-5 min-w-5 items-center justify-center px-1.5 text-xs"
												variant="destructive"
											>
												{section.notificationCount}
											</Badge>
										)}
								</Button>
							))}
						</nav>
					</aside>

					{/* Main Content */}
					<main className="flex flex-1 flex-col overflow-hidden">
						<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
							{/* Custom Toggle Button */}
							<Button
								className="hidden h-8 w-8 sm:flex"
								onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
								size="icon"
								variant="ghost"
							>
								<PanelLeft className="h-4 w-4" />
							</Button>
							<Breadcrumb>
								<BreadcrumbList>
									<BreadcrumbItem className="hidden md:block">
										<BreadcrumbLink href="#">Settings</BreadcrumbLink>
									</BreadcrumbItem>
									<BreadcrumbSeparator className="hidden md:block" />
									<BreadcrumbItem>
										<BreadcrumbPage>{getCurrentSectionName()}</BreadcrumbPage>
									</BreadcrumbItem>
								</BreadcrumbList>
							</Breadcrumb>
						</header>
						<div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0">
							{activeSection === "messages" && (
								<div className="mb-1 flex gap-2 border-b pb-3">
									{messageSubTabs.map((tab) => (
										<Button
											className={cn(
												"flex items-center justify-start gap-2 text-left",
												activeSubTab !== tab.id && "text-muted-foreground"
											)}
											key={tab.id}
											onClick={() => setActiveSubTab(tab.id)}
											size="sm"
											variant={
												activeSubTab === tab.id ? "secondary" : "outline"
											}
										>
											<tab.icon className="h-4 w-4" />
											<span>{tab.name}</span>
										</Button>
									))}
								</div>
							)}
							{renderContent()}
						</div>
					</main>
				</div>
			</DialogContent>
		</Dialog>
	);
}
