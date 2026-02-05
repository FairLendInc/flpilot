"use client";

import { useConvexAuth } from "convex/react";
import {
	ArrowUpRight,
	Building2,
	DollarSign,
	TrendingUp,
	UserPlus,
	Users,
	Wrench,
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
import { useAuthenticatedQuery } from "@/convex/lib/client";

export default function BrokerDashboardPage() {
	const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
	// const user = useAuthenticatedQuery(api.profile.getUserIdentity);
	const router = useRouter();

	const broker = useAuthenticatedQuery(
		api.brokers.management.getBrokerByUserId,
		{}
	);
	console.log("Broker", broker);
	const stats = useAuthenticatedQuery(
		api.brokers.stats.getBrokerDashboardStats,
		broker ? { brokerId: broker._id, timeRange: "all" } : "skip"
	);

	// broker is undefined while loading, null if no broker exists
	const brokerLoading = broker === undefined;
	const _isLoading = authLoading || brokerLoading || !stats;

	if (authLoading || brokerLoading) {
		return <LoadingState />;
	}

	if (!isAuthenticated) {
		router.push("/sign-in");
		return null;
	}

	// At this point broker is null (no broker exists) or a valid broker object
	if (broker === null) {
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
						value={stats?.clients.total || 0}
					/>
					<KPICard
						icon={DollarSign}
						title="Assets Under Management"
						trend="+5.2%"
						value={`$${((stats?.assets.totalAUM || 0) / 1000000).toFixed(1)}M`}
					/>
					<KPICard
						icon={Building2}
						title="Total Deals"
						trend="12 active"
						value={stats?.deals.dealCount || 0}
					/>
					<KPICard
						icon={TrendingUp}
						title="Commissions YTD"
						trend="On track"
						value={`$${((stats?.commissions.totalEarned || 0) / 1000).toFixed(0)}K`}
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
							<UnderConstructionCard />
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

function UnderConstructionCard() {
	return (
		<div className="flex flex-col items-center justify-center rounded-lg border border-muted-foreground/25 border-dashed bg-muted/30 py-12">
			<div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
				<Wrench className="h-8 w-8 animate-pulse text-primary" />
				<div className="absolute inset-0 animate-ping rounded-full bg-primary/5" />
			</div>
			<h3 className="mb-1 font-semibold text-foreground">Under Construction</h3>
			<p className="text-center text-muted-foreground text-sm">
				Recent activity features are being built. Check back soon!
			</p>
		</div>
	);
}
