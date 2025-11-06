"use client";

import { Button, Description, FieldError, FieldGroup, Fieldset, Form, Label, Surface, Switch } from "@heroui/react";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface ListingUpdateFormProps {
	listingId: Id<"listings">;
	initialVisible: boolean;
	initialLocked: boolean;
	onSuccess?: () => void;
}

export function ListingUpdateForm({
	listingId,
	initialVisible,
	initialLocked,
	onSuccess,
}: ListingUpdateFormProps) {
	const updateListing = useMutation(api.listings.updateListing);
	const [visible, setVisible] = useState(initialVisible);
	const [locked, setLocked] = useState(initialLocked);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setIsSubmitting(true);

		try {
			await updateListing({
				listingId,
				visible,
				locked,
			});
			toast.success("Listing updated successfully");
			onSuccess?.();
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Unable to update listing";
			toast.error(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Form onSubmit={handleSubmit} className="space-y-6">
			<Surface className="flex flex-col gap-3 rounded-3xl p-6" variant="default">
				<Fieldset.Root>
					<Fieldset.Legend className="text-foreground/70">
						Listing Settings
					</Fieldset.Legend>
					<Description className="text-foreground/50">
						Update listing visibility and lock state.
					</Description>
					<FieldGroup className="space-y-4">
						<div className="flex items-center justify-between gap-4 rounded-md border border-border bg-surface-2 px-4 py-3">
							<div>
								<h3 className="font-medium text-foreground text-sm">
									Marketplace visibility
								</h3>
								<p className="text-foreground/70 text-xs">
									Visible listings appear in investor dashboards.
								</p>
							</div>
							<Switch.Root
								isSelected={visible}
								onChange={(isSelected) => setVisible(isSelected)}
							>
								<Switch.Control>
									<Switch.Thumb />
								</Switch.Control>
								<Label>{visible ? "Visible" : "Hidden"}</Label>
							</Switch.Root>
						</div>

						<div className="flex items-center justify-between gap-4 rounded-md border border-border bg-surface-2 px-4 py-3">
							<div>
								<h3 className="font-medium text-foreground text-sm">
									Lock status
								</h3>
								<p className="text-foreground/70 text-xs">
									Locked listings are reserved for active deals.
								</p>
							</div>
							<Switch.Root
								isSelected={locked}
								onChange={(isSelected) => setLocked(isSelected)}
							>
								<Switch.Control>
									<Switch.Thumb />
								</Switch.Control>
								<Label>{locked ? "Locked" : "Unlocked"}</Label>
							</Switch.Root>
						</div>
					</FieldGroup>
					<Fieldset.Actions>
						<Button
							isDisabled={isSubmitting}
							type="submit"
							variant="primary"
						>
							{isSubmitting ? "Updating…" : "Update Listing"}
						</Button>
					</Fieldset.Actions>
				</Fieldset.Root>
			</Surface>
		</Form>
	);
}

