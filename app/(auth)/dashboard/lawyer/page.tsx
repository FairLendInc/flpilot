import { Briefcase, FileText, Settings, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function LawyerDashboardPage() {
	return (
		<>
			<header className="mt-4 flex h-16 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator className="mr-2 h-4" orientation="vertical" />
				<h1 className="font-semibold text-lg">Lawyer Dashboard</h1>
			</header>

			<div className="flex flex-1 flex-col gap-6 p-6">
				{/* Metrics Cards */}
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Active Deals
							</CardTitle>
							<Briefcase className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">12</div>
							<p className="text-muted-foreground text-xs">
								Currently representing
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Pending Requests
							</CardTitle>
							<FileText className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">5</div>
							<p className="text-muted-foreground text-xs">Awaiting review</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Closed This Month
							</CardTitle>
							<Briefcase className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">8</div>
							<p className="text-muted-foreground text-xs">
								Successfully closed
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">Clients</CardTitle>
							<User className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">32</div>
							<p className="text-muted-foreground text-xs">Total clients</p>
						</CardContent>
					</Card>
				</div>

				{/* Active Deals Section */}
				<Card>
					<CardHeader>
						<CardTitle>Active Deals</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{[
								{
									id: "1",
									client: "Acme Corp",
									deal: "Series A Funding",
									status: "In Review",
								},
								{
									id: "2",
									client: "Tech Ventures",
									deal: "Bridge Loan",
									status: "Due Diligence",
								},
								{
									id: "3",
									client: "Growth Partners",
									deal: "Mezzanine Financing",
									status: "Documentation",
								},
							].map((item) => (
								<div
									className="flex items-center justify-between rounded-lg border p-4"
									key={item.id}
								>
									<div>
										<p className="font-medium">{item.client}</p>
										<p className="text-muted-foreground text-sm">{item.deal}</p>
									</div>
									<div className="flex items-center gap-2">
										<span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary text-xs">
											{item.status}
										</span>
										<Button size="sm" variant="ghost">
											View
										</Button>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Representation Requests Section */}
				<Card>
					<CardHeader>
						<CardTitle>Representation Requests</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{[
								{
									id: "1",
									client: "Startup Inc",
									type: "Seed Round",
									date: "2 days ago",
								},
								{
									id: "2",
									client: "Innovation Labs",
									type: "Debt Financing",
									date: "5 days ago",
								},
							].map((item) => (
								<div
									className="flex items-center justify-between rounded-lg border p-4"
									key={item.id}
								>
									<div>
										<p className="font-medium">{item.client}</p>
										<p className="text-muted-foreground text-sm">{item.type}</p>
									</div>
									<div className="flex items-center gap-2">
										<span className="text-muted-foreground text-xs">
											{item.date}
										</span>
										<Button size="sm" variant="outline">
											Review
										</Button>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Quick Actions */}
				<Card>
					<CardHeader>
						<CardTitle>Quick Actions</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-wrap gap-3">
						<Button asChild>
							<Link href="/dashboard/lawyer/deals">
								<Briefcase className="mr-2 h-4 w-4" />
								View All Deals
							</Link>
						</Button>
						<Button asChild variant="secondary">
							<Link href="/dashboard/lawyer/requests">
								<FileText className="mr-2 h-4 w-4" />
								Manage Requests
							</Link>
						</Button>
						<Button asChild variant="outline">
							<Link href="/dashboard/settings">
								<Settings className="mr-2 h-4 w-4" />
								Settings
							</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		</>
	);
}
