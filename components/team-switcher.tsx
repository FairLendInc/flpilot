"use client";

import { ChevronsUpDown, Shield } from "lucide-react";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import type { UserRole } from "@/lib/navigation/role-navigation";
import { getRoleLabel } from "@/lib/utils/role-helpers";

export function TeamSwitcher({
	activeRole,
	availableRoles,
	onRoleChange,
}: {
	activeRole: UserRole;
	availableRoles: UserRole[];
	onRoleChange: (role: UserRole) => void;
}) {
	const { isMobile } = useSidebar();

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
							size="lg"
						>
							<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
								<Shield className="size-4" />
							</div>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">FairLend</span>
								<span className="truncate text-xs">
									{getRoleLabel(activeRole)}
								</span>
							</div>
							<ChevronsUpDown className="ml-auto" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="start"
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
						side={isMobile ? "bottom" : "right"}
						sideOffset={4}
					>
						<DropdownMenuLabel className="text-muted-foreground text-xs">
							Switch Role
						</DropdownMenuLabel>
						{availableRoles.map((role) => (
							<DropdownMenuItem
								className="gap-2 p-2"
								key={role}
								onClick={() => onRoleChange(role)}
							>
								<div className="flex size-6 items-center justify-center rounded-md border">
									<Shield className="size-3.5 shrink-0" />
								</div>
								<div className="flex flex-col">
									<span className="font-medium">{getRoleLabel(role)}</span>
									{role === activeRole && (
										<span className="text-muted-foreground text-xs">
											Active
										</span>
									)}
								</div>
							</DropdownMenuItem>
						))}
						<DropdownMenuSeparator />
						<DropdownMenuItem className="gap-2 p-2" disabled>
							<div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
								<Shield className="size-4" />
							</div>
							<div className="font-medium text-muted-foreground">
								Manage Roles
							</div>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
