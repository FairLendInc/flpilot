import {
	Briefcase,
	Building2,
	FileText,
	Settings,
	Shield,
	Users,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function AdminDashboardPage() {
	return (
		<>
			<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator className="mr-2 h-4" orientation="vertical" />
				<h1 className="font-semibold text-lg">Admin Dashboard</h1>
			</header>

			<div className="flex flex-1 flex-col gap-6 p-6">
				{/* Metrics Cards */}
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">Total Users</CardTitle>
							<Users className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">1,254</div>
							<p className="text-muted-foreground text-xs">
								All platform users
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Active Deals
							</CardTitle>
							<Briefcase className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">87</div>
							<p className="text-muted-foreground text-xs">Currently active</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">Brokers</CardTitle>
							<Building2 className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">45</div>
							<p className="text-muted-foreground text-xs">Active brokers</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">Lawyers</CardTitle>
							<Shield className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">23</div>
							<p className="text-muted-foreground text-xs">Active lawyers</p>
						</CardContent>
					</Card>
				</div>

				{/* Recent Users Section */}
				<Card>
					<CardHeader>
						<CardTitle>Recent Users</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{[
								{
									id: "1",
									name: "John Broker",
									role: "Broker",
									status: "Active",
								},
								{
									id: "2",
									name: "Jane Investor",
									role: "Investor",
									status: "Active",
								},
								{
									id: "3",
									name: "Mike Lawyer",
									role: "Lawyer",
									status: "Pending",
								},
							].map((item) => (
								<div
									className="flex items-center justify-between rounded-lg border p-4"
									key={item.id}
								>
									<div className="flex items-center gap-3">
										<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
											<Users className="h-5 w-5 text-primary" />
										</div>
										<div>
											<p className="font-medium">{item.name}</p>
											<p className="text-muted-foreground text-sm">
												{item.role}
											</p>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<span
											className={`rounded-full px-3 py-1 font-medium text-xs ${
												item.status === "Active"
													? "bg-green-100 text-green-700"
													: "bg-yellow-100 text-yellow-700"
											}`}
										>
											{item.status}
										</span>
										<Button size="sm" variant="ghost">
											Manage
										</Button>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Deals Management Section */}
				<Card>
					<CardHeader>
						<CardTitle>Recent Deals</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{[
								{
									id: "1",
									deal: "Series A Funding",
									broker: "Acme Brokers",
									amount: "$2.5M",
									status: "In Progress",
								},
								{
									id: "2",
									deal: "Bridge Loan",
									broker: "Growth Capital",
									amount: "$500K",
									status: "Completed",
								},
								{
									id: "3",
									deal: "Mezzanine Financing",
									broker: "Venture Partners",
									amount: "$1.2M",
									status: "Under Review",
								},
							].map((item) => (
								<div
									className="flex items-center justify-between rounded-lg border p-4"
									key={item.id}
								>
									<div>
										<p className="font-medium">{item.deal}</p>
										<p className="text-muted-foreground text-sm">
											{item.broker} • {item.amount}
										</p>
									</div>
									<div className="flex items-center gap-2">
										<span
											className={`rounded-full px-3 py-1 font-medium text-xs ${
												item.status === "Completed"
													? "bg-green-100 text-green-700"
													: item.status === "In Progress"
														? "bg-blue-100 text-blue-700"
														: "bg-yellow-100 text-yellow-700"
											}`}
										>
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

				{/* Listings Section */}
				<Card>
					<CardHeader>
						<CardTitle>Recent Listings</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{[
								{
									id: "1",
									title: "Commercial Property - Downtown",
									type: "Real Estate",
									posted: "2 days ago",
								},
								{
									id: "2",
									title: "Tech Startup - Series B",
									type: "Equity",
									posted: "5 days ago",
								},
							].map((item) => (
								<div
									className="flex items-center justify-between rounded-lg border p-4"
									key={item.id}
								>
									<div>
										<p className="font-medium">{item.title}</p>
										<p className="text-muted-foreground text-sm">
											{item.type} • {item.posted}
										</p>
									</div>
									<Button size="sm" variant="outline">
										Review
									</Button>
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
							<Link href="/dashboard/admin/users">
								<Users className="mr-2 h-4 w-4" />
								Manage Users
							</Link>
						</Button>
						<Button asChild variant="secondary">
							<Link href="/dashboard/admin/deals">
								<Briefcase className="mr-2 h-4 w-4" />
								View All Deals
							</Link>
						</Button>
						<Button asChild variant="secondary">
							<Link href="/dashboard/admin/brokers">
								<Building2 className="mr-2 h-4 w-4" />
								Manage Brokers
							</Link>
						</Button>
						<Button asChild variant="secondary">
							<Link href="/dashboard/admin/lawyers">
								<Shield className="mr-2 h-4 w-4" />
								Manage Lawyers
							</Link>
						</Button>
						<Button asChild variant="outline">
							<Link href="/dashboard/admin/listings">
								<FileText className="mr-2 h-4 w-4" />
								View Listings
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
