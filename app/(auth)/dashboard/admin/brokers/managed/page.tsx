"use client";

import { useConvexAuth, useQuery } from "convex/react";
import {
	Building2,
	ChevronRight,
	ExternalLink,
	MoreHorizontal,
	Search,
	Settings,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type Broker = {
	_creationTime: number;
	_id: Id<"brokers">;
	branding?: {
		brandName?: string;
		logoStorageId?: Id<"_storage">;
		primaryColor?: string;
		secondaryColor?: string;
	};
	commission?: {
		ratePercentage?: number;
	};
	customDomain?: string;
	status: "active" | "suspended" | "revoked";
	subdomain: string;
	userId: Id<"users">;
	workosOrgId: string;
	userName: string | null;
	approvedAt: string;
	createdAt: string;
	updatedAt?: string;
};

export default function ManagedBrokersPage() {
	const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");

	const brokers = useQuery(api.brokers.management.listBrokers, {});

	const isLoading = authLoading || brokers === undefined;

	if (authLoading) {
		return <LoadingState />;
	}

	if (!isAuthenticated) {
		router.push("/sign-in");
		return null;
	}

	const filteredBrokers = brokers?.filter((broker: Broker) => {
		if (statusFilter !== "all" && broker.status !== statusFilter) return false;
		if (searchQuery) {
			const brandName = broker.branding?.brandName?.toLowerCase() || "";
			const subdomain = broker.subdomain.toLowerCase();
			const query = searchQuery.toLowerCase();
			return brandName.includes(query) || subdomain.includes(query);
		}
		return true;
	});

	const activeCount =
		brokers?.filter((b: Broker) => b.status === "active").length || 0;
	const suspendedCount =
		brokers?.filter((b: Broker) => b.status === "suspended").length || 0;
	const revokedCount =
		brokers?.filter((b: Broker) => b.status === "revoked").length || 0;

	return (
		<>
			<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator className="mr-2 h-4" orientation="vertical" />
				<h1 className="font-semibold text-lg">Managed Brokers</h1>
			</header>

			<div className="flex flex-1 flex-col gap-6 p-6">
				<div className="grid gap-4 md:grid-cols-4">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Total Brokers
							</CardTitle>
							<Building2 className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">{brokers?.length || 0}</div>
							<p className="text-muted-foreground text-xs">All time</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">Active</CardTitle>
							<Building2 className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl text-green-600">
								{activeCount}
							</div>
							<p className="text-muted-foreground text-xs">
								Currently operating
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">Suspended</CardTitle>
							<Building2 className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl text-yellow-600">
								{suspendedCount}
							</div>
							<p className="text-muted-foreground text-xs">
								Temporarily inactive
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">Revoked</CardTitle>
							<Building2 className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl text-red-600">
								{revokedCount}
							</div>
							<p className="text-muted-foreground text-xs">Access removed</p>
						</CardContent>
					</Card>
				</div>

				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle>Broker Management</CardTitle>
							<Button asChild size="sm" variant="outline">
								<Link href="/dashboard/admin/brokers">View Applications</Link>
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						<div className="mb-6 flex gap-4">
							<div className="relative flex-1">
								<Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
								<Input
									className="pl-8"
									onChange={(e) => setSearchQuery(e.target.value)}
									placeholder="Search by brand name or subdomain..."
									value={searchQuery}
								/>
							</div>
							<Select onValueChange={setStatusFilter} value={statusFilter}>
								<SelectTrigger className="w-[180px]">
									<SelectValue placeholder="Filter by status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Statuses</SelectItem>
									<SelectItem value="active">Active</SelectItem>
									<SelectItem value="suspended">Suspended</SelectItem>
									<SelectItem value="revoked">Revoked</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{isLoading ? (
							<LoadingTable />
						) : filteredBrokers?.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-12">
								<div className="mb-4 rounded-full bg-primary/10 p-6">
									<Building2 className="h-12 w-12 text-primary" />
								</div>
								<h3 className="mb-2 font-semibold text-lg">No Brokers</h3>
								<p className="text-center text-muted-foreground text-sm">
									No approved brokers match your criteria. Approve broker
									applications to see them here.
								</p>
								<Button asChild className="mt-4">
									<Link href="/dashboard/admin/brokers">View Applications</Link>
								</Button>
							</div>
						) : (
							<div className="space-y-4">
								{filteredBrokers?.map((broker: Broker) => (
									<BrokerCard broker={broker} key={broker._id} />
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</>
	);
}

function BrokerCard({ broker }: { broker: Broker }) {
	const router = useRouter();
	const brandName = broker.branding?.brandName || broker.subdomain;
	const portalUrl = `https://${broker.subdomain}.flpilot.com`;

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "active":
				return <Badge variant="default">Active</Badge>;
			case "suspended":
				return (
					<Badge className="bg-yellow-100 text-yellow-800" variant="secondary">
						Suspended
					</Badge>
				);
			case "revoked":
				return <Badge variant="destructive">Revoked</Badge>;
			default:
				return <Badge variant="outline">{status}</Badge>;
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			router.push(`/dashboard/admin/brokers/${broker._id}`);
		}
	};

	return (
		<div
			className="flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
			onClick={() => router.push(`/dashboard/admin/brokers/${broker._id}`)}
			onKeyDown={handleKeyDown}
			role="button"
			tabIndex={0}
		>
			<div className="flex items-center gap-4">
				<div
					className="flex h-12 w-12 items-center justify-center rounded-full"
					style={{
						backgroundColor:
							broker.branding?.primaryColor || "hsl(var(--primary))",
					}}
				>
					<span className="font-bold text-lg text-white">
						{brandName.charAt(0).toUpperCase()}
					</span>
				</div>
				<div>
					<h4 className="font-medium">{brandName}</h4>
					<p className="text-muted-foreground text-sm">
						{broker.subdomain}.flpilot.com • Commission:{" "}
						{broker.commission?.ratePercentage || 0}%
					</p>
					<p className="text-muted-foreground text-xs">
						Approved: {new Date(broker.approvedAt).toLocaleDateString()}
					</p>
				</div>
			</div>
			<div className="flex items-center gap-4">
				{getStatusBadge(broker.status)}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							onClick={(e) => e.stopPropagation()}
							size="sm"
							variant="ghost"
						>
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem asChild>
							<Link href={`/dashboard/admin/brokers/${broker._id}`}>
								<Settings className="mr-2 h-4 w-4" />
								Manage Broker
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild>
							<Link href={portalUrl} rel="noopener noreferrer" target="_blank">
								<ExternalLink className="mr-2 h-4 w-4" />
								View Portal
							</Link>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
				<ChevronRight className="h-4 w-4 text-muted-foreground" />
			</div>
		</div>
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
							<Skeleton className="h-3 w-24" />
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}

function LoadingTable() {
	return (
		<div className="space-y-4">
			{[1, 2, 3].map((i) => (
				<div className="flex items-center gap-4 rounded-lg border p-4" key={i}>
					<Skeleton className="h-12 w-12 rounded-full" />
					<div className="flex-1">
						<Skeleton className="mb-2 h-4 w-48" />
						<Skeleton className="mb-2 h-3 w-64" />
						<Skeleton className="h-3 w-32" />
					</div>
					<Skeleton className="h-6 w-20" />
				</div>
			))}
		</div>
	);
}
