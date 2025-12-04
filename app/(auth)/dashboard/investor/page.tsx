import { LayoutDashboardIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function InvestorDashboardPage() {
	return (
		<>
			<header className="mt-4 flex h-16 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator className="mr-2 h-4" orientation="vertical" />
				<h1 className="font-semibold text-lg">Investor Dashboard</h1>
			</header>

			<div className="flex flex-1 flex-col gap-6 p-6">
				<Card>
					<CardHeader>
						<CardTitle>Investor Dashboard</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<div className="mb-4 rounded-full bg-primary/10 p-6">
							<LayoutDashboardIcon className="h-12 w-12 text-primary" />
						</div>
						<h3 className="mb-2 font-semibold text-lg">Investor Dashboard</h3>
						<p className="text-center text-muted-foreground text-sm">
							Welcome to your investor dashboard
						</p>
					</CardContent>
				</Card>
			</div>
		</>
	);
}
