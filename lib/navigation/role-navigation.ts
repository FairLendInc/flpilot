import {
	Briefcase,
	Building2,
	Database,
	Edit3,
	FileText,
	Home,
	LayoutDashboard,
	Lock,
	type LucideIcon,
	PieChart,
	Settings,
	Shield,
	TrendingUp,
	UserPlus,
	Users,
} from "lucide-react";

export type NavItem = {
	title: string;
	url: string;
	icon: LucideIcon;
	isActive?: boolean;
	items?: NavItem[];
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
			title: "Onboarding",
			url: "/dashboard/admin/onboarding",
			icon: UserPlus,
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
			title: "Lock Requests",
			url: "/dashboard/admin/lock-requests",
			icon: Lock,
		},
		{
			title: "Manage Listings",
			url: "/dashboard/admin/listings/manage",
			icon: Edit3,
		},
		{
			title: "Manage Mortgages",
			url: "/dashboard/admin/mortgages/manage",
			icon: Home,
		},
		{
			title: "MIC Management",
			url: "/dashboard/admin/mic",
			icon: Building2,
			items: [
				{
					title: "Overview",
					url: "/dashboard/admin/mic",
					icon: LayoutDashboard,
				},
				{
					title: "Investors",
					url: "/dashboard/admin/mic/investors",
					icon: Users,
				},
				{
					title: "AUM Portfolio",
					url: "/dashboard/admin/mic/aum",
					icon: Briefcase,
				},
				{
					title: "Distributions",
					url: "/dashboard/admin/mic/distributions",
					icon: Edit3, // Using Edit3 as placeholder for DollarSign
				},
				{
					title: "Ledger View",
					url: "/dashboard/admin/mic/ledger",
					icon: Database,
				},
				{
					title: "Settings",
					url: "/dashboard/admin/mic/settings",
					icon: Settings,
				},
			],
		},
		{
			title: "Ledger View",
			url: "/dashboard/admin/ledger",
			icon: Database,
			items: [
				{
					title: "Accounts",
					url: "/dashboard/admin/ledger/accounts",
					icon: LayoutDashboard,
				},
				{
					title: "Transactions",
					url: "/dashboard/admin/ledger/transactions",
					icon: FileText,
				},
				{
					title: "Investors",
					url: "/dashboard/admin/ledger/investors",
					icon: Users,
				},
				{
					title: "Mortgages",
					url: "/dashboard/admin/ledger/mortgages",
					icon: Home,
				},
			],
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
