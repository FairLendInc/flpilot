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
import { useMutation } from "convex/react";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface ListingDeleteDialogProps {
	listingId: Id<"listings">;
	isLocked: boolean;
	mortgageId: Id<"mortgages">;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export function ListingDeleteDialog({
	listingId,
	isLocked,
	mortgageId,
	open,
	onOpenChange,
	onSuccess,
}: ListingDeleteDialogProps) {
	const deleteListing = useMutation(api.listings.deleteListing);
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			await deleteListing({
				listingId,
				force: isLocked,
			});
			toast.success("Listing deleted successfully");
			onOpenChange(false);
			onSuccess?.();
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Unable to delete listing";
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
						Delete Listing
					</AlertDialogTitle>
					<AlertDialogDescription className="space-y-2">
						<p>
							Are you sure you want to delete this listing? This action cannot
							be undone.
						</p>
						{isLocked && (
							<div className="rounded-md border border-warning bg-warning/10 p-3">
								<p className="font-medium text-warning text-sm">
									Warning: This listing is currently locked.
								</p>
								<p className="mt-1 text-warning/80 text-xs">
									Deleting a locked listing will unlock it and remove it from
									the marketplace. Any active deals may be affected.
								</p>
							</div>
						)}
						<div className="rounded-md border border-border bg-surface-2 p-3">
							<p className="text-foreground/70 text-sm">
								<strong>Impact:</strong>
							</p>
							<ul className="mt-1 list-inside list-disc space-y-1 text-foreground/60 text-xs">
								<li>Listing will be removed from marketplace</li>
								<li>
									All comparables linked to mortgage {mortgageId} will be deleted
								</li>
								<li>Underlying mortgage record will be preserved</li>
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
						{isDeleting ? "Deleting…" : "Delete Listing"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

