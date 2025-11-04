import {
	Briefcase,
	DollarSign,
	PieChart,
	Settings,
	TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function InvestorDashboardPage() {
	return (
		<>
			<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator className="mr-2 h-4" orientation="vertical" />
				<h1 className="font-semibold text-lg">Investor Dashboard</h1>
			</header>

			<div className="flex flex-1 flex-col gap-6 p-6">
				{/* Metrics Cards */}
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Total Portfolio Value
							</CardTitle>
							<DollarSign className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">$1.2M</div>
							<p className="text-muted-foreground text-xs">
								Across all investments
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
							<div className="font-bold text-2xl">8</div>
							<p className="text-muted-foreground text-xs">Currently active</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">YTD Returns</CardTitle>
							<TrendingUp className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">+12.4%</div>
							<p className="text-muted-foreground text-xs">
								Year to date performance
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">Investments</CardTitle>
							<PieChart className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">15</div>
							<p className="text-muted-foreground text-xs">Total count</p>
						</CardContent>
					</Card>
				</div>

				{/* Portfolio Section */}
				<Card>
					<CardHeader>
						<CardTitle>Portfolio Overview</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{[
								{
									id: "1",
									company: "Tech Startup A",
									invested: "$150K",
									current: "$180K",
									return: "+20%",
								},
								{
									id: "2",
									company: "Growth Corp B",
									invested: "$200K",
									current: "$225K",
									return: "+12.5%",
								},
								{
									id: "3",
									company: "Innovation Labs C",
									invested: "$100K",
									current: "$95K",
									return: "-5%",
								},
							].map((item) => (
								<div
									className="flex items-center justify-between rounded-lg border p-4"
									key={item.id}
								>
									<div>
										<p className="font-medium">{item.company}</p>
										<p className="text-muted-foreground text-sm">
											Invested: {item.invested}
										</p>
									</div>
									<div className="flex items-center gap-4">
										<div className="text-right">
											<p className="font-medium">{item.current}</p>
											<p
												className={`text-sm ${
													item.return.startsWith("+")
														? "text-green-600"
														: "text-red-600"
												}`}
											>
												{item.return}
											</p>
										</div>
										<Button size="sm" variant="ghost">
											Details
										</Button>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

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
									deal: "Series B Round",
									company: "Fintech Innovators",
									stage: "Due Diligence",
									amount: "$250K",
								},
								{
									id: "2",
									deal: "Bridge Financing",
									company: "Healthcare Solutions",
									stage: "Term Sheet",
									amount: "$100K",
								},
							].map((item) => (
								<div
									className="flex items-center justify-between rounded-lg border p-4"
									key={item.id}
								>
									<div>
										<p className="font-medium">{item.deal}</p>
										<p className="text-muted-foreground text-sm">
											{item.company} • {item.amount}
										</p>
									</div>
									<div className="flex items-center gap-2">
										<span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary text-xs">
											{item.stage}
										</span>
										<Button size="sm" variant="outline">
											View
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
							<Link href="/dashboard/investor/portfolio">
								<PieChart className="mr-2 h-4 w-4" />
								View Full Portfolio
							</Link>
						</Button>
						<Button asChild variant="secondary">
							<Link href="/dashboard/investor/deals">
								<Briefcase className="mr-2 h-4 w-4" />
								Browse Deals
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
