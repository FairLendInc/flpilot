"use client";

import { useQuery } from "convex/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import { LockRequestsTable } from "./components/LockRequestsTable";

export default function AdminLockRequestsPage() {
	// Fetch counts for badges
	const pendingRequests = useQuery(
		api.lockRequests.getPendingLockRequestsWithDetails
	);
	const approvedRequests = useQuery(
		api.lockRequests.getApprovedLockRequestsWithDetails
	);
	const rejectedRequests = useQuery(
		api.lockRequests.getRejectedLockRequestsWithDetails
	);

	const pendingCount = pendingRequests?.length ?? 0;
	const approvedCount = approvedRequests?.length ?? 0;
	const rejectedCount = rejectedRequests?.length ?? 0;

	return (
		<>
			<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator className="mr-2 h-4" orientation="vertical" />
				<h1 className="font-semibold text-lg">Lock Requests</h1>
			</header>

			<div className="flex flex-1 flex-col gap-6 p-6">
				<div className="space-y-2">
					<h2 className="font-semibold text-2xl">Lock Requests</h2>
					<p className="text-muted-foreground text-sm">
						Review and manage investor lock requests for marketplace listings
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Requests</CardTitle>
					</CardHeader>
					<CardContent>
						<Tabs defaultValue="pending">
							<TabsList className="grid w-full grid-cols-3">
								<TabsTrigger value="pending">
									Pending {pendingCount > 0 && `(${pendingCount})`}
								</TabsTrigger>
								<TabsTrigger value="approved">
									Approved {approvedCount > 0 && `(${approvedCount})`}
								</TabsTrigger>
								<TabsTrigger value="rejected">
									Rejected {rejectedCount > 0 && `(${rejectedCount})`}
								</TabsTrigger>
							</TabsList>

							<TabsContent className="mt-6" value="pending">
								<LockRequestsTable status="pending" />
							</TabsContent>

							<TabsContent className="mt-6" value="approved">
								<LockRequestsTable status="approved" />
							</TabsContent>

							<TabsContent className="mt-6" value="rejected">
								<LockRequestsTable status="rejected" />
							</TabsContent>
						</Tabs>
					</CardContent>
				</Card>
			</div>
		</>
	);
}
