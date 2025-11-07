import {
	BookOpen,
	FileText,
	HelpCircle,
	LayoutDashboard,
	type LucideIcon,
	Mail,
} from "lucide-react";

export type NavItem = {
	id: string;
	label: string;
	href: string;
	icon: LucideIcon;
	/**
	 * If true, this nav item will be highlighted when the current path
	 * starts with the href (for nested routes)
	 * If false, requires exact match
	 */
	matchPrefix?: boolean;
};

export const navigationItems: NavItem[] = [
	{
		id: "listings",
		label: "Listings",
		href: "/listings",
		icon: FileText,
		matchPrefix: true, // Will match /listings, /listings/123, etc.
	},
	{
		id: "blog",
		label: "Blog",
		href: "/blog",
		icon: BookOpen,
		matchPrefix: true,
	},
	{
		id: "about",
		label: "About",
		href: "/about",
		icon: FileText,
		matchPrefix: true,
	},
	{
		id: "faq",
		label: "FAQ",
		href: "/faq",
		icon: HelpCircle,
		matchPrefix: true,
	},
	{
		id: "contact",
		label: "Contact Us",
		href: "/contact",
		icon: Mail,
		matchPrefix: true,
	},
	{
		id: "dashboard",
		label: "Dashboard",
		href: "/dashboard",
		icon: LayoutDashboard,
		matchPrefix: true,
	},
];

/**
 * Check if a nav item should be highlighted based on the current pathname
 */
export function isNavItemActive(navItem: NavItem, pathname: string): boolean {
	if (navItem.matchPrefix) {
		// For prefix matching, check if pathname starts with href (but not just '/')
		if (navItem.href === "/") {
			return pathname === navItem.href;
		}
		return pathname.startsWith(navItem.href);
	}

	// For exact matching, check if pathname equals href
	return pathname === navItem.href;
}

/**
 * Find the active nav item based on the current pathname
 */
export function getActiveNavItem(pathname: string): NavItem | undefined {
	return navigationItems.find((item) => isNavItemActive(item, pathname));
}
