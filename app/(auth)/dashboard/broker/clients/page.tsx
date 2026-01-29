"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { ChevronRight, Mail, Search, UserPlus, Users } from "lucide-react";
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

type Client = {
	_id: string;
	_creationTime: number;
	onboardingStatus: string;
	invitedAt: string;
	userName?: string;
	userEmail?: string;
	approvedAt?: string;
};

export default function BrokerClientsPage() {
	const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");

	const broker = useQuery(api.brokers.management.getBrokerByUserId, {});
	const clients = useQuery(
		api.brokers.stats.getBrokerClientList,
		broker ? { brokerId: broker._id } : "skip"
	);

	// broker is undefined while loading, null if no broker exists
	const brokerLoading = broker === undefined;
	const isLoading = authLoading || brokerLoading || clients === undefined;

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
				<Users className="mb-4 h-16 w-16 text-muted-foreground" />
				<h1 className="mb-2 font-bold text-2xl">Broker Account Required</h1>
				<p className="text-center text-muted-foreground">
					You need to complete broker onboarding to access client management.
				</p>
			</div>
		);
	}

	const clientList = (clients?.clients ?? []) as unknown as Client[];
	const filteredClients =
		clientList.filter((client) => {
			if (statusFilter !== "all" && client.onboardingStatus !== statusFilter)
				return false;
			if (searchQuery) {
				// Search would need user data - simplified for now
				return true;
			}
			return true;
		}) ?? [];

	const invitedCount = clientList.filter(
		(c) => c.onboardingStatus === "invited"
	).length;
	const pendingCount = clientList.filter(
		(c) => c.onboardingStatus === "pending_approval"
	).length;
	const approvedCount = clientList.filter(
		(c) => c.onboardingStatus === "approved"
	).length;

	return (
		<>
			<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator className="mr-2 h-4" orientation="vertical" />
				<h1 className="font-semibold text-lg">Client Management</h1>
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
							<div className="font-bold text-2xl">{clientList.length || 0}</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">Invited</CardTitle>
							<Mail className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl text-blue-600">
								{invitedCount}
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Pending Approval
							</CardTitle>
							<Users className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl text-yellow-600">
								{pendingCount}
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">Approved</CardTitle>
							<Users className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl text-green-600">
								{approvedCount}
							</div>
						</CardContent>
					</Card>
				</div>

				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle>All Clients</CardTitle>
							<Button asChild>
								<Link href="/dashboard/broker/clients/onboard">
									<UserPlus className="mr-2 h-4 w-4" />
									Onboard New Client
								</Link>
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
									placeholder="Search clients..."
									value={searchQuery}
								/>
							</div>
							<Select onValueChange={setStatusFilter} value={statusFilter}>
								<SelectTrigger className="w-[180px]">
									<SelectValue placeholder="Filter by status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Statuses</SelectItem>
									<SelectItem value="invited">Invited</SelectItem>
									<SelectItem value="in_progress">In Progress</SelectItem>
									<SelectItem value="pending_approval">
										Pending Approval
									</SelectItem>
									<SelectItem value="approved">Approved</SelectItem>
									<SelectItem value="rejected">Rejected</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{isLoading ? (
							<LoadingTable />
						) : filteredClients?.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-12">
								<div className="mb-4 rounded-full bg-primary/10 p-6">
									<Users className="h-12 w-12 text-primary" />
								</div>
								<h3 className="mb-2 font-semibold text-lg">No Clients Yet</h3>
								<p className="text-center text-muted-foreground text-sm">
									Get started by inviting your first client.
								</p>
								<Button asChild className="mt-4">
									<Link href="/dashboard/broker/clients/onboard">
										<UserPlus className="mr-2 h-4 w-4" />
										Onboard New Client
									</Link>
								</Button>
							</div>
						) : (
							<div className="space-y-4">
								{filteredClients?.map((client) => (
									<ClientCard client={client} key={client._id} />
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</>
	);
}

function ClientCard({ client }: { client: Client }) {
	const router = useRouter();

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "invited":
				return <Badge variant="secondary">Invited</Badge>;
			case "in_progress":
				return (
					<Badge className="bg-blue-100 text-blue-800" variant="secondary">
						In Progress
					</Badge>
				);
			case "pending_approval":
				return (
					<Badge className="bg-yellow-100 text-yellow-800" variant="secondary">
						Pending Approval
					</Badge>
				);
			case "approved":
				return <Badge variant="default">Approved</Badge>;
			case "rejected":
				return <Badge variant="destructive">Rejected</Badge>;
			default:
				return <Badge variant="outline">{status}</Badge>;
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			router.push(`/dashboard/broker/clients/${client._id}`);
		}
	};

	return (
		<div
			className="flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
			onClick={() => router.push(`/dashboard/broker/clients/${client._id}`)}
			onKeyDown={handleKeyDown}
			role="button"
			tabIndex={0}
		>
			<div className="flex items-center gap-4">
				<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
					<Users className="h-5 w-5 text-primary" />
				</div>
				<div>
					<h4 className="font-medium">Client {client._id.slice(-6)}</h4>
					<p className="text-muted-foreground text-sm">
						Invited: {new Date(client.invitedAt).toLocaleDateString()}
					</p>
				</div>
			</div>
			<div className="flex items-center gap-4">
				{getStatusBadge(client.onboardingStatus)}
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
