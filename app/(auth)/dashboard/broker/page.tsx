"use client";

import { useConvexAuth, useQuery } from "convex/react";
import {
	ArrowUpRight,
	Building2,
	DollarSign,
	TrendingUp,
	UserPlus,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";

export default function BrokerDashboardPage() {
	const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
	const router = useRouter();

	const broker = useQuery(api.brokers.management.getBrokerByUserId, {});
	const stats = useQuery(
		api.brokers.stats.getBrokerDashboardStats,
		broker ? { brokerId: broker._id, timeRange: "all" } : "skip"
	);

	const _isLoading = authLoading || !broker || !stats;

	if (authLoading) {
		return <LoadingState />;
	}

	if (!isAuthenticated) {
		router.push("/sign-in");
		return null;
	}

	if (!broker) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center p-6">
				<Building2 className="mb-4 h-16 w-16 text-muted-foreground" />
				<h1 className="mb-2 font-bold text-2xl">Broker Account Required</h1>
				<p className="text-center text-muted-foreground">
					You need to complete broker onboarding to access this dashboard.
				</p>
				<Button asChild className="mt-4">
					<Link href="/dashboard">Go to Dashboard</Link>
				</Button>
			</div>
		);
	}

	const brandName = broker.branding?.brandName || "Your Brokerage";

	return (
		<>
			<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator className="mr-2 h-4" orientation="vertical" />
				<h1 className="font-semibold text-lg">{brandName}</h1>
				<Badge
					className="ml-2"
					variant={broker.status === "active" ? "default" : "secondary"}
				>
					{broker.status}
				</Badge>
			</header>

			<div className="flex flex-1 flex-col gap-6 p-6">
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<KPICard
						icon={Users}
						title="Total Clients"
						trend="+2 this month"
						value={stats?.clientCount || 0}
					/>
					<KPICard
						icon={DollarSign}
						title="Assets Under Management"
						trend="+5.2%"
						value={`$${((stats?.aum || 0) / 1000000).toFixed(1)}M`}
					/>
					<KPICard
						icon={Building2}
						title="Total Deals"
						trend="12 active"
						value={stats?.dealCount || 0}
					/>
					<KPICard
						icon={TrendingUp}
						title="Commissions YTD"
						trend="On track"
						value={`$${((stats?.totalCommissions || 0) / 1000).toFixed(0)}K`}
					/>
				</div>

				<div className="grid gap-4 md:grid-cols-3">
					<Card className="col-span-2">
						<CardHeader>
							<CardTitle>Quick Actions</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-4 sm:grid-cols-2">
							<Button asChild>
								<Link href="/dashboard/broker/clients/onboard">
									<UserPlus className="mr-2 h-4 w-4" />
									Onboard New Client
								</Link>
							</Button>
							<Button asChild variant="outline">
								<Link href="/dashboard/broker/clients">
									<Users className="mr-2 h-4 w-4" />
									View All Clients
								</Link>
							</Button>
							<Button asChild variant="outline">
								<Link href="/dashboard/broker/portfolio">
									<Building2 className="mr-2 h-4 w-4" />
									Portfolio Overview
								</Link>
							</Button>
							<Button asChild variant="outline">
								<Link href="/dashboard/broker/commissions">
									<DollarSign className="mr-2 h-4 w-4" />
									Commission History
								</Link>
							</Button>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Recent Activity</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="flex items-center gap-3">
									<div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
										<UserPlus className="h-4 w-4 text-green-600" />
									</div>
									<div className="flex-1">
										<p className="font-medium text-sm">New client onboarded</p>
										<p className="text-muted-foreground text-xs">2 hours ago</p>
									</div>
								</div>
								<div className="flex items-center gap-3">
									<div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
										<Building2 className="h-4 w-4 text-blue-600" />
									</div>
									<div className="flex-1">
										<p className="font-medium text-sm">Deal completed</p>
										<p className="text-muted-foreground text-xs">5 hours ago</p>
									</div>
								</div>
								<div className="flex items-center gap-3">
									<div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100">
										<DollarSign className="h-4 w-4 text-yellow-600" />
									</div>
									<div className="flex-1">
										<p className="font-medium text-sm">Commission earned</p>
										<p className="text-muted-foreground text-xs">Yesterday</p>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</>
	);
}

function KPICard({
	title,
	value,
	icon: Icon,
	trend,
}: {
	title: string;
	value: string | number;
	icon: React.ElementType;
	trend?: string;
}) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="font-medium text-sm">{title}</CardTitle>
				<Icon className="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div className="font-bold text-2xl">{value}</div>
				{trend && (
					<p className="flex items-center text-muted-foreground text-xs">
						<ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
						{trend}
					</p>
				)}
			</CardContent>
		</Card>
	);
}

function LoadingState() {
	return (
		<div className="flex flex-1 flex-col gap-6 p-6">
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{[1, 2, 3, 4].map((i) => (
					<Card key={i}>
						<CardHeader>
							<Skeleton className="h-4 w-32" />
						</CardHeader>
						<CardContent>
							<Skeleton className="mb-2 h-8 w-16" />
							<Skeleton className="h-3 w-24" />
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
