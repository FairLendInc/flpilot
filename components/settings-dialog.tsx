"use client";

import {
	Bell,
	Briefcase,
	Check,
	CheckSquare,
	ClipboardList,
	FileText,
	Globe,
	ImageIcon,
	Keyboard,
	LinkIcon,
	Lock,
	MessageCircle,
	PanelLeft,
	Settings,
	Video,
	X,
} from "lucide-react";
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
import { useIsMobile } from "@/hooks/use-mobile";
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

const sections = [
	{
		id: "notifications",
		name: "Notifications",
		icon: Bell,
		notificationCount: 5,
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

export function SettingsDialog() {
	const [open, setOpen] = React.useState(true);
	const [activeSection, setActiveSection] = React.useState("messages");
	const [activeSubTab, setActiveSubTab] = React.useState("messages-list");
	const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
	const isMobile = useIsMobile();

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
							{sections.map((section) => (
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
							{sections.map((section) => (
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
