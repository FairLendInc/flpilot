import {
	Briefcase,
	Building2,
	FileText,
	LayoutDashboard,
	type LucideIcon,
	PieChart,
	Settings,
	Shield,
	TrendingUp,
	Users,
} from "lucide-react";

export type NavItem = {
	title: string;
	url: string;
	icon: LucideIcon;
	isActive?: boolean;
};

export type UserRole = "admin" | "broker" | "lawyer" | "investor";

export const ROLE_LABELS: Record<UserRole, string> = {
	admin: "Administrator",
	broker: "Broker",
	lawyer: "Legal Counsel",
	investor: "Investor",
};

export const ROLE_NAVIGATION: Record<UserRole, NavItem[]> = {
	admin: [
		{
			title: "Dashboard",
			url: "/dashboard/admin",
			icon: LayoutDashboard,
		},
		{
			title: "Users",
			url: "/dashboard/admin/users",
			icon: Users,
		},
		{
			title: "Deals",
			url: "/dashboard/admin/deals",
			icon: Briefcase,
		},
		{
			title: "Brokers",
			url: "/dashboard/admin/brokers",
			icon: Building2,
		},
		{
			title: "Lawyers",
			url: "/dashboard/admin/lawyers",
			icon: Shield,
		},
		{
			title: "Listings",
			url: "/dashboard/admin/listings",
			icon: FileText,
		},
		{
			title: "Settings",
			url: "/dashboard/settings",
			icon: Settings,
		},
	],
	broker: [
		{
			title: "Dashboard",
			url: "/dashboard/broker",
			icon: LayoutDashboard,
		},
		{
			title: "Clients",
			url: "/dashboard/clients",
			icon: Users,
		},
		{
			title: "Settings",
			url: "/dashboard/settings",
			icon: Settings,
		},
	],
	lawyer: [
		{
			title: "Dashboard",
			url: "/dashboard/lawyer",
			icon: LayoutDashboard,
		},
		{
			title: "Active Deals",
			url: "/dashboard/lawyer/deals",
			icon: Briefcase,
		},
		{
			title: "Requests",
			url: "/dashboard/lawyer/requests",
			icon: FileText,
		},
		{
			title: "Clients",
			url: "/dashboard/lawyer/clients",
			icon: Users,
		},
		{
			title: "Settings",
			url: "/dashboard/settings",
			icon: Settings,
		},
	],
	investor: [
		{
			title: "Dashboard",
			url: "/dashboard/investor",
			icon: LayoutDashboard,
		},
		{
			title: "Portfolio",
			url: "/dashboard/investor/portfolio",
			icon: PieChart,
		},
		{
			title: "Deals",
			url: "/dashboard/investor/deals",
			icon: Briefcase,
		},
		{
			title: "Opportunities",
			url: "/dashboard/investor/opportunities",
			icon: TrendingUp,
		},
		{
			title: "Settings",
			url: "/dashboard/settings",
			icon: Settings,
		},
	],
};

// Mock all roles as available for development
export const MOCK_AVAILABLE_ROLES: UserRole[] = [
	"admin",
	"broker",
	"lawyer",
	"investor",
];
