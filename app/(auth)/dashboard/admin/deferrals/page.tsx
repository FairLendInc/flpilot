"use client";

import { useConvexAuth, useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
	type DeferralRequest,
	DeferralRequestQueue,
} from "@/components/admin/deferrals";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuthenticatedQuery } from "@/convex/lib/client";

export default function AdminDeferralsPage() {
	const { isLoading: authLoading, isAuthenticated } = useConvexAuth();

	// Fetch pending deferral requests
	const pendingRequests = useAuthenticatedQuery(
		api.deferralRequests.getPendingDeferralRequests,
		{}
	);

	// Mutations for approve/reject
	const approveDeferralMutation = useMutation(
		api.deferralRequests.approveDeferral
	);
	const rejectDeferralMutation = useMutation(
		api.deferralRequests.rejectDeferral
	);

	// Loading states
	if (authLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!isAuthenticated) {
		return (
			<div className="flex h-full items-center justify-center">
				<p className="text-muted-foreground">Authentication required</p>
			</div>
		);
	}

	// Transform requests to expected format
	const requests: DeferralRequest[] = (pendingRequests ?? []).map(
		(item: NonNullable<typeof pendingRequests>[number]) => ({
			id: item.request._id,
			borrowerId: item.request.borrowerId,
			borrowerName: item.borrowerName,
			borrowerEmail: item.borrowerEmail,
			mortgageId: item.request.mortgageId,
			propertyAddress: item.propertyAddress,
			requestType: item.request.requestType,
			requestedDeferralDate: item.request.requestedDeferralDate,
			originalPaymentDate:
				item.originalPaymentDate ?? item.request.requestedDeferralDate,
			originalPaymentAmount:
				item.originalPaymentAmount ?? (item.loanAmount * 0.08) / 12,
			reason: item.request.reason ?? "",
			status: item.request.status,
			createdAt: item.request.createdAt,
		})
	);

	const handleApprove = async (requestId: string) => {
		try {
			await approveDeferralMutation({
				requestId: requestId as Id<"deferral_requests">,
			});
			toast.success("Deferral approved", {
				description: "The payment deferral has been approved",
			});
		} catch (error) {
			toast.error("Failed to approve deferral", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		}
	};

	const handleReject = async (requestId: string, reason: string) => {
		try {
			await rejectDeferralMutation({
				requestId: requestId as Id<"deferral_requests">,
				reason,
			});
			toast.success("Deferral rejected", {
				description: "The payment deferral request has been rejected",
			});
		} catch (error) {
			toast.error("Failed to reject deferral", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		}
	};

	const handleRefresh = () => {
		// Convex queries are reactive
		toast.info("Data refreshes automatically");
	};

	return (
		<>
			<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator className="mr-2 h-4" orientation="vertical" />
				<h1 className="font-semibold text-lg">Deferral Requests</h1>
				{pendingRequests && (
					<span className="ml-2 text-muted-foreground text-sm">
						({pendingRequests.length} pending)
					</span>
				)}
			</header>

			<div className="flex flex-1 flex-col gap-6 p-6">
				{pendingRequests ? (
					<DeferralRequestQueue
						isRefreshing={false}
						onApprove={handleApprove}
						onRefresh={handleRefresh}
						onReject={handleReject}
						requests={requests}
					/>
				) : (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
					</div>
				)}
			</div>
		</>
	);
}
