"use client";

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
import { useMutation, useQuery } from "convex/react";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface MortgageDeleteDialogProps {
	mortgageId: Id<"mortgages">;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export function MortgageDeleteDialog({
	mortgageId,
	open,
	onOpenChange,
	onSuccess,
}: MortgageDeleteDialogProps) {
	const deleteMortgage = useMutation(api.mortgages.deleteMortgage);
	const listings = useQuery(api.listings.getListingByMortgage, {
		mortgageId,
	});
	const [isDeleting, setIsDeleting] = useState(false);
	const [forceDelete, setForceDelete] = useState(false);

	const hasListings = listings !== undefined && listings !== null;
	const isLocked = listings?.locked ?? false;

	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			await deleteMortgage({
				id: mortgageId,
				force: isLocked ? forceDelete : undefined,
			});
			toast.success("Mortgage deleted successfully");
			onOpenChange(false);
			onSuccess?.();
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Unable to delete mortgage";
			toast.error(message);
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle className="flex items-center gap-2">
						<AlertTriangle className="h-5 w-5 text-destructive" />
						Delete Mortgage
					</AlertDialogTitle>
					<AlertDialogDescription className="space-y-2">
						<p>
							Are you sure you want to delete this mortgage? This action cannot
							be undone and will cascade delete all associated data.
						</p>
						{hasListings && (
							<div className="rounded-md border border-warning bg-warning/10 p-3">
								<p className="font-medium text-warning text-sm">
									Warning: This mortgage has an active listing.
								</p>
								{isLocked && (
									<p className="mt-1 text-warning/80 text-xs">
										The listing is currently locked. Deleting will unlock and
										remove it.
									</p>
								)}
							</div>
						)}
						<div className="rounded-md border border-destructive bg-destructive/10 p-3">
							<p className="font-medium text-destructive text-sm">
								<strong>Cascade Deletion Impact:</strong>
							</p>
							<ul className="mt-1 list-inside list-disc space-y-1 text-destructive/80 text-xs">
								<li>All listings for this mortgage will be deleted</li>
								<li>All comparables linked to this mortgage will be deleted</li>
								<li>All ownership records will be deleted</li>
								<li>All payment records will be deleted</li>
								<li>Borrower record will be preserved</li>
							</ul>
						</div>
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleDelete}
						disabled={isDeleting}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						{isDeleting ? "Deleting…" : "Delete Mortgage"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

