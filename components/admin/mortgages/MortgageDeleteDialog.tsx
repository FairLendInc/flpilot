"use client";

import { useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";

export interface DeleteResult {
	mortgageId: Id<"mortgages">;
	deletedCounts: {
		listings: number;
		comparables: number;
		ownership: number;
		payments: number;
	};
}

interface MortgageDeleteDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	mortgageId: Id<"mortgages"> | null;
	mortgageAddress?: string;
	hasActiveListings?: boolean;
	expectedDeletions?: {
		listings: number;
		comparables: number;
		ownership: number;
		payments: number;
	};
	onConfirm: (force: boolean) => void | Promise<void | DeleteResult>;
}

export function MortgageDeleteDialog({
	open,
	onOpenChange,
	mortgageId,
	mortgageAddress,
	hasActiveListings = false,
	expectedDeletions,
	onConfirm,
}: MortgageDeleteDialogProps) {
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
			open={open}
			onOpenChange={(isOpen) => {
				if (!isOpen) {
					setForce(false);
				}
				onOpenChange(isOpen);
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<AlertTriangle className="h-5 w-5 text-destructive" />
						Delete Mortgage
					</DialogTitle>
					<DialogDescription>
						Are you sure you want to delete this mortgage? This action will
						cascade delete all associated records.
					</DialogDescription>
				</DialogHeader>

				{mortgageAddress && (
					<div className="rounded-md bg-muted p-3">
						<p className="font-medium text-sm">{mortgageAddress}</p>
						{mortgageId && (
							<p className="text-muted-foreground text-xs mt-1">
								ID: {mortgageId}
							</p>
						)}
					</div>
				)}

				<div className="rounded-md border border-destructive/20 bg-destructive/5 p-3">
					<p className="font-semibold text-sm mb-2">
						This will cascade delete:
					</p>
					<ul className="list-inside list-disc space-y-1 text-sm">
						<li>
							{expectedDeletions?.listings ?? "All"} listing
							{expectedDeletions?.listings === 1 ? "" : "s"}
						</li>
						<li>
							{expectedDeletions?.comparables ?? "All"} comparable propert
							{expectedDeletions?.comparables === 1 ? "y" : "ies"}
						</li>
						<li>
							{expectedDeletions?.ownership ?? "All"} ownership record
							{expectedDeletions?.ownership === 1 ? "" : "s"}
						</li>
						<li>
							{expectedDeletions?.payments ?? "All"} payment record
							{expectedDeletions?.payments === 1 ? "" : "s"}
						</li>
					</ul>
					<p className="mt-2 font-semibold text-sm">
						The borrower record will be preserved. This action cannot be undone.
					</p>
				</div>

				{hasActiveListings && (
					<div className="space-y-3">
						<div className="rounded-md border border-warning/20 bg-warning/5 p-3">
							<p className="text-sm">
								<strong>Active listings detected:</strong> This mortgage has
								active or locked listings. Deletion requires force confirmation.
							</p>
						</div>
						<div className="flex items-start gap-2">
							<Checkbox
								id="force"
								checked={force}
								onCheckedChange={(checked) =>
									setForce(checked === true)
								}
								disabled={isDeleting}
							/>
							<Label
								htmlFor="force"
								className="text-sm font-normal leading-tight cursor-pointer"
							>
								Force delete this mortgage and all associated listings. I
								understand this will delete active listings.
							</Label>
						</div>
					</div>
				)}

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isDeleting}
					>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={handleConfirm}
						disabled={isDeleting || (hasActiveListings && !force)}
					>
						{isDeleting ? "Deleting..." : "Delete Mortgage"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

