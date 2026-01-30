"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import {
	ArrowLeft,
	CheckCircle,
	Mail,
	MessageSquare,
	User,
	XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export default function ClientDetailPage() {
	const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
	const params = useParams();
	const router = useRouter();
	const clientId = params.clientId as Id<"broker_clients">;
	const [message, setMessage] = useState("");

	const client = useQuery(api.brokers.clients.getClientDetail, {
		clientBrokerId: clientId,
	});

	const approveMutation = useMutation(api.brokers.clients.approveClient);
	const rejectMutation = useMutation(api.brokers.clients.rejectClient);
	const sendRequestMutation = useMutation(
		api.brokers.communication.sendClientRequest
	);

	const _isLoading = authLoading || client === undefined;

	if (authLoading) {
		return <LoadingState />;
	}

	if (!isAuthenticated) {
		router.push("/sign-in");
		return null;
	}

	if (!client) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center p-6">
				<User className="mb-4 h-16 w-16 text-muted-foreground" />
				<h1 className="mb-2 font-bold text-2xl">Client Not Found</h1>
				<Button asChild className="mt-4">
					<Link href="/dashboard/broker/clients">Back to Clients</Link>
				</Button>
			</div>
		);
	}

	const handleApprove = async () => {
		try {
			await approveMutation({ clientBrokerId: clientId });
			toast.success("Client approved successfully");
		} catch (_error) {
			toast.error("Failed to approve client");
		}
	};

	const handleReject = async () => {
		try {
			await rejectMutation({ clientBrokerId: clientId });
			toast.success("Client rejected");
		} catch (_error) {
			toast.error("Failed to reject client");
		}
	};

	const handleSendRequest = async () => {
		if (!message.trim()) {
			toast.error("Please enter a message");
			return;
		}
		try {
			await sendRequestMutation({
				clientBrokerId: clientId,
				type: "info_request",
				message,
			});
			toast.success("Request sent");
			setMessage("");
		} catch (_error) {
			toast.error("Failed to send request");
		}
	};

	return (
		<>
			<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator className="mr-2 h-4" orientation="vertical" />
				<Button asChild size="sm" variant="ghost">
					<Link href="/dashboard/broker/clients">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back
					</Link>
				</Button>
				<Separator className="mx-2 h-4" orientation="vertical" />
				<h1 className="font-semibold text-lg">Client Details</h1>
				<Badge
					className="ml-2"
					variant={
						client.onboardingStatus === "approved"
							? "default"
							: client.onboardingStatus === "rejected"
								? "destructive"
								: "secondary"
					}
				>
					{client.onboardingStatus}
				</Badge>
			</header>

			<div className="flex flex-1 flex-col gap-6 p-6">
				<Tabs defaultValue="overview">
					<TabsList>
						<TabsTrigger value="overview">Overview</TabsTrigger>
						<TabsTrigger value="filters">Filters</TabsTrigger>
						<TabsTrigger value="communication">Communication</TabsTrigger>
					</TabsList>

					<TabsContent className="space-y-4" value="overview">
						<div className="grid gap-4 md:grid-cols-3">
							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="font-medium text-sm">Status</CardTitle>
									<User className="h-4 w-4 text-muted-foreground" />
								</CardHeader>
								<CardContent>
									<div className="font-bold text-lg capitalize">
										{client.onboardingStatus}
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="font-medium text-sm">Invited</CardTitle>
									<Mail className="h-4 w-4 text-muted-foreground" />
								</CardHeader>
								<CardContent>
									<div className="font-bold text-lg">
										{new Date(client.invitedAt).toLocaleDateString()}
									</div>
								</CardContent>
							</Card>
						</div>

						{client.onboardingStatus === "pending_approval" && (
							<Card>
								<CardHeader>
									<CardTitle>Approval Actions</CardTitle>
								</CardHeader>
								<CardContent className="flex gap-4">
									<Button onClick={handleApprove}>
										<CheckCircle className="mr-2 h-4 w-4" />
										Approve Client
									</Button>
									<Button onClick={handleReject} variant="destructive">
										<XCircle className="mr-2 h-4 w-4" />
										Reject
									</Button>
								</CardContent>
							</Card>
						)}
					</TabsContent>

					<TabsContent value="filters">
						<Card>
							<CardHeader>
								<CardTitle>Filter Configuration</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div>
										<Label>Property Types</Label>
										<p className="text-muted-foreground">
											{client.filters.values.propertyTypes.join(", ") ||
												"All types allowed"}
										</p>
									</div>
									<div>
										<Label>Locations</Label>
										<p className="text-muted-foreground">
											{client.filters.values.locations.join(", ") ||
												"All locations allowed"}
										</p>
									</div>
									<div>
										<Label>Risk Profile</Label>
										<p className="text-muted-foreground capitalize">
											{client.filters.values.riskProfile}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="communication">
						<Card>
							<CardHeader>
								<CardTitle>Send Message</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label>Message</Label>
									<Input
										onChange={(e) => setMessage(e.target.value)}
										placeholder="Type your message..."
										value={message}
									/>
								</div>
								<Button onClick={handleSendRequest}>
									<MessageSquare className="mr-2 h-4 w-4" />
									Send Request
								</Button>
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
			<div className="grid gap-4 md:grid-cols-3">
				{[1, 2, 3].map((i) => (
					<Card key={i}>
						<CardHeader>
							<Skeleton className="h-4 w-32" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-16" />
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
