"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Id } from "@/convex/_generated/dataModel";

type ListingUpdateDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	listingId: Id<"listings"> | null;
	initialVisible: boolean;
	initialLocked: boolean;
	onSave: (data: { visible: boolean; locked: boolean }) => void | Promise<void>;
};

export function ListingUpdateDialog({
	open,
	onOpenChange,
	listingId: _listingId,
	initialVisible,
	initialLocked,
	onSave,
}: ListingUpdateDialogProps) {
	const [visible, setVisible] = useState(initialVisible);
	const [locked, setLocked] = useState(initialLocked);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Sync local state when props change
	useEffect(() => {
		setVisible(initialVisible);
		setLocked(initialLocked);
	}, [initialVisible, initialLocked]);

	async function handleSave() {
		setIsSubmitting(true);
		try {
			await onSave({ visible, locked });
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit Listing</DialogTitle>
					<DialogDescription>
						Update visibility and lock status for this listing
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="flex items-center justify-between">
						<Label htmlFor="visible">Visible</Label>
						<Switch
							checked={visible}
							disabled={isSubmitting}
							id="visible"
							onCheckedChange={setVisible}
						/>
					</div>
					<div className="flex items-center justify-between">
						<Label htmlFor="locked">Locked</Label>
						<Switch
							checked={locked}
							disabled={isSubmitting}
							id="locked"
							onCheckedChange={setLocked}
						/>
					</div>
				</div>
				<DialogFooter>
					<Button
						disabled={isSubmitting}
						onClick={() => onOpenChange(false)}
						variant="outline"
					>
						Cancel
					</Button>
					<Button disabled={isSubmitting} onClick={handleSave}>
						{isSubmitting ? "Saving..." : "Save Changes"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
