"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
} from "@/components/ui/sidebar";
import type { UserRole } from "@/lib/navigation/role-navigation";
import {
	getPrimaryRole,
	getRoleDashboardUrl,
	getRoleNavigation,
} from "@/lib/utils/role-helpers";

export function AppSidebar({
	user,
	...props
}: React.ComponentProps<typeof Sidebar> & {
	user: { name: string; email: string; avatar: string; roles: string[] };
}) {
	const router = useRouter();

	const availableRoles = user.roles;

	// State for current active role - default to admin
	const [activeRole, setActiveRole] = React.useState<UserRole>(
		getPrimaryRole(availableRoles)
	);

	// Get navigation for current role
	const navigation = getRoleNavigation(activeRole);

	// Handle role change and navigate to the new role's dashboard
	const handleRoleChange = React.useCallback(
		(newRole: UserRole) => {
			setActiveRole(newRole);
			const dashboardUrl = getRoleDashboardUrl(newRole);
			router.push(dashboardUrl);
		},
		[router]
	);

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<TeamSwitcher
					activeRole={activeRole}
					availableRoles={availableRoles as UserRole[]}
					onRoleChange={handleRoleChange}
				/>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={navigation} />
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={user} />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
