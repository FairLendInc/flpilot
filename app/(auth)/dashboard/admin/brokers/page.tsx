"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { Building2, ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function AdminBrokersPage() {
	const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");

	// Fetch broker applications and approved brokers
	const brokerJourneys = useQuery(
		api.brokers.approval.listPendingBrokerJourneys,
		{}
	);
	const approvedBrokers = useQuery(api.brokers.management.listBrokers, {
		status: "active",
	});

	const isLoading =
		authLoading ||
		brokerJourneys === undefined ||
		approvedBrokers === undefined;

	if (authLoading) {
		return <LoadingState />;
	}

	if (!isAuthenticated) {
		router.push("/sign-in");
		return null;
	}

	// Filter broker journeys
	const filteredJourneys = brokerJourneys?.filter((journey) => {
		if (statusFilter !== "all" && journey.status !== statusFilter) return false;
		if (searchQuery) {
			const brokerData = journey.context?.broker;
			const companyName =
				brokerData?.companyInfo?.companyName?.toLowerCase() || "";
			return companyName.includes(searchQuery.toLowerCase());
		}
		return true;
	});

	const pendingCount =
		brokerJourneys?.filter((j) => j.status === "awaiting_admin").length || 0;
	const totalBrokers = approvedBrokers?.length || 0;

	return (
		<>
			<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator className="mr-2 h-4" orientation="vertical" />
				<h1 className="font-semibold text-lg">Broker Management</h1>
			</header>

			<div className="flex flex-1 flex-col gap-6 p-6">
				{/* Stats Overview */}
				<div className="grid gap-4 md:grid-cols-3">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Pending Applications
							</CardTitle>
							<Building2 className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">{pendingCount}</div>
							<p className="text-muted-foreground text-xs">
								Awaiting admin review
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Active Brokers
							</CardTitle>
							<Building2 className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">{totalBrokers}</div>
							<p className="text-muted-foreground text-xs">
								Approved and active
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Total Applications
							</CardTitle>
							<Building2 className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">
								{(brokerJourneys?.length || 0) + totalBrokers}
							</div>
							<p className="text-muted-foreground text-xs">All time</p>
						</CardContent>
					</Card>
				</div>

				{/* Pending Applications Section */}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle>Pending Applications</CardTitle>
							<Link href="/dashboard/admin/brokers/applications">
								<Button size="sm" variant="outline">
									View All
									<ChevronRight className="ml-2 h-4 w-4" />
								</Button>
							</Link>
						</div>
					</CardHeader>
					<CardContent>
						{/* Filters */}
						<div className="mb-6 flex gap-4">
							<div className="relative flex-1">
								<Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
								<Input
									className="pl-8"
									onChange={(e) => setSearchQuery(e.target.value)}
									placeholder="Search by company name..."
									value={searchQuery}
								/>
							</div>
							<Select onValueChange={setStatusFilter} value={statusFilter}>
								<SelectTrigger className="w-[180px]">
									<SelectValue placeholder="Filter by status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Statuses</SelectItem>
									<SelectItem value="awaiting_admin">Awaiting Admin</SelectItem>
									<SelectItem value="draft">Draft</SelectItem>
									<SelectItem value="approved">Approved</SelectItem>
									<SelectItem value="rejected">Rejected</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Applications List */}
						{isLoading ? (
							<LoadingTable />
						) : filteredJourneys?.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-12">
								<div className="mb-4 rounded-full bg-primary/10 p-6">
									<Building2 className="h-12 w-12 text-primary" />
								</div>
								<h3 className="mb-2 font-semibold text-lg">No Applications</h3>
								<p className="text-center text-muted-foreground text-sm">
									No broker applications match your criteria
								</p>
							</div>
						) : (
							<div className="space-y-4">
								{filteredJourneys?.slice(0, 5).map((journey) => (
									<BrokerApplicationCard journey={journey} key={journey._id} />
								))}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Active Brokers Section */}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle>Active Brokers</CardTitle>
							<Link href="/dashboard/admin/brokers/managed">
								<Button size="sm" variant="outline">
									Manage All
									<ChevronRight className="ml-2 h-4 w-4" />
								</Button>
							</Link>
						</div>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<LoadingTable />
						) : approvedBrokers?.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-12">
								<div className="mb-4 rounded-full bg-primary/10 p-6">
									<Building2 className="h-12 w-12 text-primary" />
								</div>
								<h3 className="mb-2 font-semibold text-lg">
									No Active Brokers
								</h3>
								<p className="text-center text-muted-foreground text-sm">
									No brokers have been approved yet
								</p>
							</div>
						) : (
							<div className="space-y-4">
								{approvedBrokers?.slice(0, 5).map((broker) => (
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

type BrokerJourney = {
	_id: string;
	status: string;
	stateValue: string;
	lastTouchedAt: string;
	context?: {
		broker?: {
			companyInfo?: {
				companyName?: string;
			};
		};
	};
};

function BrokerApplicationCard({ journey }: { journey: BrokerJourney }) {
	const router = useRouter();
	const brokerData = journey.context?.broker;
	const companyName = brokerData?.companyInfo?.companyName || "Unnamed Company";
	const submittedDate = new Date(journey.lastTouchedAt).toLocaleDateString();

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "awaiting_admin":
				return <Badge variant="default">Awaiting Review</Badge>;
			case "draft":
				return <Badge variant="secondary">Draft</Badge>;
			case "approved":
				return <Badge variant="default">Approved</Badge>;
			case "rejected":
				return <Badge variant="destructive">Rejected</Badge>;
			default:
				return <Badge variant="outline">{status}</Badge>;
		}
	};

	const handleClick = () => {
		router.push(`/dashboard/admin/brokers/applications/${journey._id}`);
	};

	const handleKeyDown = (event: React.KeyboardEvent) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			handleClick();
		}
	};

	return (
		<div
			className="flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			role="button"
			tabIndex={0}
		>
			<div className="flex items-center gap-4">
				<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
					<Building2 className="h-5 w-5 text-primary" />
				</div>
				<div>
					<h4 className="font-medium">{companyName}</h4>
					<p className="text-muted-foreground text-sm">
						Submitted: {submittedDate} • Current Step: {journey.stateValue}
					</p>
				</div>
			</div>
			<div className="flex items-center gap-4">
				{getStatusBadge(journey.status)}
				<ChevronRight className="h-4 w-4 text-muted-foreground" />
			</div>
		</div>
	);
}

type Broker = {
	_id: string;
	status: string;
	subdomain: string;
	approvedAt: string;
	branding?: {
		brandName?: string;
	};
	companyInfo?: {
		companyName?: string;
	};
};

function BrokerCard({ broker }: { broker: Broker }) {
	const router = useRouter();
	const approvedDate = new Date(broker.approvedAt).toLocaleDateString();

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "active":
				return <Badge variant="default">Active</Badge>;
			case "suspended":
				return <Badge variant="secondary">Suspended</Badge>;
			case "revoked":
				return <Badge variant="destructive">Revoked</Badge>;
			default:
				return <Badge variant="outline">{status}</Badge>;
		}
	};

	const handleClick = () => {
		router.push(`/dashboard/admin/brokers/${broker._id}`);
	};

	const handleKeyDown = (event: React.KeyboardEvent) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			handleClick();
		}
	};

	return (
		<div
			className="flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			role="button"
			tabIndex={0}
		>
			<div className="flex items-center gap-4">
				<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
					<Building2 className="h-5 w-5 text-primary" />
				</div>
				<div>
					<h4 className="font-medium">
						{broker.branding?.brandName ||
							broker.companyInfo?.companyName ||
							"Unnamed Broker"}
					</h4>
					<p className="text-muted-foreground text-sm">
						Subdomain: {broker.subdomain}.flpilot.com • Approved: {approvedDate}
					</p>
				</div>
			</div>
			<div className="flex items-center gap-4">
				{getStatusBadge(broker.status)}
				<ChevronRight className="h-4 w-4 text-muted-foreground" />
			</div>
		</div>
	);
}

function LoadingState() {
	return (
		<div className="flex flex-1 flex-col gap-6 p-6">
			<div className="grid gap-4 md:grid-cols-3">
				{[1, 2, 3].map((i) => (
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
					<Skeleton className="h-10 w-10 rounded-full" />
					<div className="flex-1">
						<Skeleton className="mb-2 h-4 w-48" />
						<Skeleton className="h-3 w-32" />
					</div>
					<Skeleton className="h-6 w-20" />
				</div>
			))}
		</div>
	);
}
