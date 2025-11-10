import { Users as UsersIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function AdminUsersPage() {
	return (
		<>
			<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator className="mr-2 h-4" orientation="vertical" />
				<h1 className="font-semibold text-lg">User Management</h1>
			</header>

			<div className="flex flex-1 flex-col gap-6 p-6">
				<Card>
					<CardHeader>
						<CardTitle>Users</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<div className="mb-4 rounded-full bg-primary/10 p-6">
							<UsersIcon className="h-12 w-12 text-primary" />
						</div>
						<h3 className="mb-2 font-semibold text-lg">User Management</h3>
						<p className="text-center text-muted-foreground text-sm">
							User management features coming soon
						</p>
					</CardContent>
				</Card>
			</div>
		</>
	);
}
