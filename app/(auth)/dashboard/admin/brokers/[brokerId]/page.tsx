"use client";

import { useConvexAuth, useQuery } from "convex/react";
import {
	ArrowLeft,
	Building2,
	DollarSign,
	ExternalLink,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export default function BrokerDetailPage() {
	const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
	const params = useParams();
	const router = useRouter();
	const brokerId = params.brokerId as Id<"brokers">;

	const broker = useQuery(api.brokers.management.getBrokerByUserId, {
		userId: undefined, // Will need to fetch broker by ID
	});

	const stats = useQuery(api.brokers.stats.getBrokerDashboardStats, {
		brokerId,
		timeRange: "all",
	});

	const clients = useQuery(api.brokers.stats.getBrokerClientList, {
		brokerId,
	});

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
				<h1 className="mb-2 font-bold text-2xl">Broker Not Found</h1>
				<p className="text-muted-foreground">
					The broker you're looking for doesn't exist or has been removed.
				</p>
				<Button asChild className="mt-4">
					<Link href="/dashboard/admin/brokers/managed">Back to Brokers</Link>
				</Button>
			</div>
		);
	}

	const brandName = broker.branding?.brandName || broker.subdomain;
	const portalUrl = `https://${broker.subdomain}.flpilot.com`;

	return (
		<>
			<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator className="mr-2 h-4" orientation="vertical" />
				<Button asChild size="sm" variant="ghost">
					<Link href="/dashboard/admin/brokers/managed">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back
					</Link>
				</Button>
				<Separator className="mx-2 h-4" orientation="vertical" />
				<h1 className="font-semibold text-lg">{brandName}</h1>
				<Badge
					className="ml-2"
					variant={broker.status === "active" ? "default" : "secondary"}
				>
					{broker.status}
				</Badge>
			</header>

			<div className="flex flex-1 flex-col gap-6 p-6">
				<div className="grid gap-4 md:grid-cols-4">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Total Clients
							</CardTitle>
							<Users className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">
								{stats?.clientCount || 0}
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">AUM</CardTitle>
							<DollarSign className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">
								${((stats?.aum || 0) / 1000000).toFixed(1)}M
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">Total Deals</CardTitle>
							<Building2 className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">{stats?.dealCount || 0}</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">Commissions</CardTitle>
							<DollarSign className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">
								${((stats?.totalCommissions || 0) / 1000).toFixed(0)}K
							</div>
						</CardContent>
					</Card>
				</div>

				<Tabs defaultValue="overview">
					<TabsList>
						<TabsTrigger value="overview">Overview</TabsTrigger>
						<TabsTrigger value="clients">
							Clients ({clients?.length || 0})
						</TabsTrigger>
						<TabsTrigger value="settings">Settings</TabsTrigger>
					</TabsList>

					<TabsContent className="space-y-4" value="overview">
						<Card>
							<CardHeader>
								<CardTitle>Broker Information</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label className="text-muted-foreground">Subdomain</Label>
										<p className="font-medium">
											{broker.subdomain}.flpilot.com
										</p>
									</div>
									<div>
										<Label className="text-muted-foreground">Portal URL</Label>
										<Button asChild className="h-auto p-0" variant="link">
											<Link
												href={portalUrl}
												rel="noopener noreferrer"
												target="_blank"
											>
												{portalUrl}{" "}
												<ExternalLink className="ml-1 inline h-3 w-3" />
											</Link>
										</Button>
									</div>
									<div>
										<Label className="text-muted-foreground">
											Commission Rate
										</Label>
										<p className="font-medium">
											{broker.commission?.ratePercentage || 0}%
										</p>
									</div>
									<div>
										<Label className="text-muted-foreground">Approved At</Label>
										<p className="font-medium">
											{new Date(broker.approvedAt).toLocaleDateString()}
										</p>
									</div>
									<div>
										<Label className="text-muted-foreground">Status</Label>
										<p className="font-medium capitalize">{broker.status}</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="clients">
						<Card>
							<CardHeader>
								<CardTitle>Client List</CardTitle>
							</CardHeader>
							<CardContent>
								{clients?.length === 0 ? (
									<p className="text-muted-foreground">No clients yet.</p>
								) : (
									<div className="space-y-2">
										{clients?.map((client) => (
											<div
												className="flex items-center justify-between rounded-lg border p-3"
												key={client._id}
											>
												<div>
													<p className="font-medium">{client.userId}</p>
													<p className="text-muted-foreground text-sm">
														Status: {client.onboardingStatus}
													</p>
												</div>
												<Badge
													variant={
														client.onboardingStatus === "approved"
															? "default"
															: "secondary"
													}
												>
													{client.onboardingStatus}
												</Badge>
											</div>
										))}
									</div>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="settings">
						<Card>
							<CardHeader>
								<CardTitle>Broker Settings</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">
									Settings management coming soon.
								</p>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</>
	);
}

function LoadingState() {
	return (
		<div className="flex flex-1 flex-col gap-6 p-6">
			<div className="grid gap-4 md:grid-cols-4">
				{[1, 2, 3, 4].map((i) => (
					<Card key={i}>
						<CardHeader>
							<Skeleton className="h-4 w-32" />
						</CardHeader>
						<CardContent>
							<Skeleton className="mb-2 h-8 w-16" />
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
