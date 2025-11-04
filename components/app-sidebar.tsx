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
import {
	MOCK_AVAILABLE_ROLES,
	type UserRole,
} from "@/lib/navigation/role-navigation";
import {
	getPrimaryRole,
	getRoleDashboardUrl,
	getRoleNavigation,
} from "@/lib/utils/role-helpers";

// This is sample data - in production, user would come from auth
const userData = {
	name: "Admin User",
	email: "admin@fairlend.com",
	avatar: "/avatars/admin.jpg",
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const router = useRouter();

	// For now, mock all roles as available. In production, this would come from:
	// const profile = useQuery(api.profile.getCurrentUserProfile);
	// const userRoles = profile?.roles?.map(r => r.slug) || [];
	const availableRoles = MOCK_AVAILABLE_ROLES;

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
					availableRoles={availableRoles}
					onRoleChange={handleRoleChange}
				/>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={navigation} />
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={userData} />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
