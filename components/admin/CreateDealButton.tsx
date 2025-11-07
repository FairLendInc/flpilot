/**
 * Create Deal Button Component
 *
 * Displays a button on approved lock requests to create a deal and initiate
 * the deal workflow. Only visible on approved lock requests that don't have
 * an existing deal.
 */

"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { useMutation, useQuery } from "convex/react";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type CreateDealButtonProps = {
	lockRequestId: Id<"lock_requests">;
	listingAddress?: string;
	investorName?: string;
};

export function CreateDealButton({
	lockRequestId,
	listingAddress = "this property",
	investorName = "the investor",
}: CreateDealButtonProps) {
	const router = useRouter();
	const { user, loading: authLoading } = useAuth();
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);
	const [isCreating, setIsCreating] = useState(false);

	// Check if deal already exists for this lock request
	// Skip query until auth is fully loaded to prevent race condition
	const existingDeal = useQuery(
		api.deals.getDealByLockRequest,
		authLoading || !user ? "skip" : { lockRequestId }
	);

	const createDeal = useMutation(api.deals.createDeal);

	// Don't show button if auth is loading or deal query is loading
	if (authLoading || existingDeal === undefined) {
		return null; // Loading
	}

	if (existingDeal !== null) {
		return (
			<Button
				onClick={() =>
					router.push(`/dashboard/admin/deals/${existingDeal._id}`)
				}
				size="sm"
				variant="outline"
			>
				View Deal ({existingDeal.currentState})
			</Button>
		);
	}

	const handleCreateDeal = async () => {
		setIsCreating(true);

		try {
			const dealId = await createDeal({ lockRequestId });

			toast.success("Deal Created", {
				description: `Deal has been created for ${listingAddress}`,
			});

			// Navigate to deal detail page
			router.push(`/dashboard/admin/deals/${dealId}`);
		} catch (error) {
			console.error("Failed to create deal:", error);
			toast.error("Failed to Create Deal", {
				description:
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
			});
		} finally {
			setIsCreating(false);
			setShowConfirmDialog(false);
		}
	};

	return (
		<>
			<Button
				className="gap-2"
				disabled={isCreating}
				onClick={() => setShowConfirmDialog(true)}
				size="sm"
				variant="default"
			>
				{isCreating ? (
					<>
						<Loader2 className="h-4 w-4 animate-spin" />
						Creating...
					</>
				) : (
					<>
						<Plus className="h-4 w-4" />
						Create Deal
					</>
				)}
			</Button>

			<AlertDialog onOpenChange={setShowConfirmDialog} open={showConfirmDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Create Deal</AlertDialogTitle>
						<AlertDialogDescription>
							<div className="space-y-2">
								<div>
									You are about to create a deal for{" "}
									<strong>{listingAddress}</strong> with investor{" "}
									<strong>{investorName}</strong>.
								</div>
								<div>
									This will initiate the deal workflow starting from the "Locked"
									state. The deal will need to progress through all stages before
									ownership can be transferred.
								</div>
								<div className="text-muted-foreground text-sm">
									Note: For the pilot program, document signing and legal
									processes happen off-platform. Use the Kanban board to manually
									progress the deal through each stage as steps are completed.
								</div>
							</div>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction disabled={isCreating} onClick={handleCreateDeal}>
							{isCreating ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Creating...
								</>
							) : (
								"Create Deal"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
