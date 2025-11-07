"use client";

import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { Id } from "@/convex/_generated/dataModel";

type ListingDeleteDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	listingId: Id<"listings"> | null;
	listingAddress?: string;
	isLocked?: boolean;
	comparablesCount?: number;
	onConfirm: (force: boolean) => void | Promise<void>;
};

export function ListingDeleteDialog({
	open,
	onOpenChange,
	listingId,
	listingAddress,
	isLocked = false,
	comparablesCount,
	onConfirm,
}: ListingDeleteDialogProps) {
	const [force, setForce] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	async function handleConfirm() {
		setIsDeleting(true);
		try {
			await onConfirm(force);
			setForce(false);
		} finally {
			setIsDeleting(false);
		}
	}

	return (
		<Dialog
			onOpenChange={(isOpen) => {
				if (!isOpen) {
					setForce(false);
				}
				onOpenChange(isOpen);
			}}
			open={open}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<AlertTriangle className="h-5 w-5 text-destructive" />
						Delete Listing
					</DialogTitle>
					<DialogDescription>
						Are you sure you want to delete this listing? This action will also
						delete all associated comparables. The underlying mortgage will be
						preserved.
					</DialogDescription>
				</DialogHeader>

				{listingAddress && (
					<div className="rounded-md bg-muted p-3">
						<p className="font-medium text-sm">{listingAddress}</p>
						{listingId && (
							<p className="mt-1 text-muted-foreground text-xs">
								ID: {listingId}
							</p>
						)}
					</div>
				)}

				{comparablesCount !== undefined && comparablesCount > 0 && (
					<div className="rounded-md border border-destructive/20 bg-destructive/5 p-3">
						<p className="text-sm">
							<strong>Warning:</strong> This will cascade delete{" "}
							{comparablesCount} comparable propert
							{comparablesCount === 1 ? "y" : "ies"}.
						</p>
					</div>
				)}

				{isLocked && (
					<div className="space-y-3">
						<div className="rounded-md border border-warning/20 bg-warning/5 p-3">
							<p className="text-sm">
								<strong>Locked listing:</strong> This listing is locked and
								requires force deletion.
							</p>
						</div>
						<div className="flex items-start gap-2">
							<Checkbox
								checked={force}
								disabled={isDeleting}
								id="force"
								onCheckedChange={(checked) => setForce(checked === true)}
							/>
							<Label
								className="cursor-pointer font-normal text-sm leading-tight"
								htmlFor="force"
							>
								Force delete this locked listing. I understand this bypasses the
								lock protection.
							</Label>
						</div>
					</div>
				)}

				<DialogFooter>
					<Button
						disabled={isDeleting}
						onClick={() => onOpenChange(false)}
						variant="outline"
					>
						Cancel
					</Button>
					<Button
						disabled={isDeleting || (isLocked && !force)}
						onClick={handleConfirm}
						variant="destructive"
					>
						{isDeleting ? "Deleting..." : "Delete Listing"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
