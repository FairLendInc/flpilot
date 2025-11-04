import { Send, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function BrokerDashboardPage() {
	return (
		<>
			<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator className="mr-2 h-4" orientation="vertical" />
				<h1 className="font-semibold text-lg">Broker Dashboard</h1>
			</header>

			<div className="flex flex-1 flex-col gap-6 p-6">
				{/* Metrics Cards */}
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Total Clients
							</CardTitle>
							<Users className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">24</div>
							<p className="text-muted-foreground text-xs">
								All registered clients
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Active Clients
							</CardTitle>
							<Users className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">18</div>
							<p className="text-muted-foreground text-xs">Currently active</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">AUM</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">$2.4M</div>
							<p className="text-muted-foreground text-xs">
								Assets under management
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">Trailer YTD</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">$48.2K</div>
							<p className="text-muted-foreground text-xs">
								Year to date earnings
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Quick Actions */}
				<Card>
					<CardHeader>
						<CardTitle>Quick Actions</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-wrap gap-3">
						<Button asChild>
							<Link href="/dashboard/clients/new">
								<UserPlus className="mr-2 h-4 w-4" />
								Add Client
							</Link>
						</Button>
						<Button variant="secondary">
							<Send className="mr-2 h-4 w-4" />
							Invite Investor
						</Button>
						<Button asChild variant="outline">
							<Link href="/dashboard/clients">
								<Users className="mr-2 h-4 w-4" />
								View Clients
							</Link>
						</Button>
					</CardContent>
				</Card>

				{/* Empty State Illustration */}
				<Card className="flex-1">
					<CardContent className="flex flex-col items-center justify-center py-12">
						<div className="mb-4 rounded-full bg-primary/10 p-6">
							<Users className="h-12 w-12 text-primary" />
						</div>
						<h3 className="mb-2 font-semibold text-lg">
							Welcome to Your Dashboard
						</h3>
						<p className="mb-6 max-w-md text-center text-muted-foreground text-sm">
							Get started by adding your first client or inviting investors to
							the platform.
						</p>
						<Button asChild>
							<Link href="/dashboard/clients/new">
								<UserPlus className="mr-2 h-4 w-4" />
								Add Your First Client
							</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		</>
	);
}
