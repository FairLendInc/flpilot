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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface ListingUpdateDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	listingId: Id<"listings"> | null;
	initialVisible: boolean;
	initialLocked: boolean;
	onSave: (data: { visible: boolean; locked: boolean }) => void | Promise<void>;
}

export function ListingUpdateDialog({
	open,
	onOpenChange,
	listingId,
	initialVisible,
	initialLocked,
	onSave,
}: ListingUpdateDialogProps) {
	const [visible, setVisible] = useState(initialVisible);
	const [locked, setLocked] = useState(initialLocked);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Sync local state when props change
	useState(() => {
		setVisible(initialVisible);
		setLocked(initialLocked);
	});

	async function handleSave() {
		setIsSubmitting(true);
		try {
			await onSave({ visible, locked });
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
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
							id="visible"
							checked={visible}
							onCheckedChange={setVisible}
							disabled={isSubmitting}
						/>
					</div>
					<div className="flex items-center justify-between">
						<Label htmlFor="locked">Locked</Label>
						<Switch
							id="locked"
							checked={locked}
							onCheckedChange={setLocked}
							disabled={isSubmitting}
						/>
					</div>
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isSubmitting}
					>
						Cancel
					</Button>
					<Button onClick={handleSave} disabled={isSubmitting}>
						{isSubmitting ? "Saving..." : "Save Changes"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

