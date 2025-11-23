import { withAuth } from "@workos-inc/authkit-nextjs";
import type React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const user = await withAuth();

	if (!user) {
		// This should be handled by middleware or withAuth redirect, but for safety
		return null;
	}

	const sidebarUser = {
		name:
			`${user.user?.firstName} ${user.user?.lastName}`.trim() ||
			user.user?.email ||
			"User",
		email: user.user?.email || "",
		avatar: user.user?.profilePictureUrl || "",
		roles: (user.roles as string[]) || [],
	};

	return (
		<SidebarProvider>
			<AppSidebar user={sidebarUser} />
			<SidebarInset>{children}</SidebarInset>
		</SidebarProvider>
	);
}
