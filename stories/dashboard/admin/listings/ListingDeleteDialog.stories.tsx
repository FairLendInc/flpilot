import type { Meta, StoryObj } from "@storybook/react";
import { ListingDeleteDialog } from "@/app/dashboard/admin/listings/components/ListingDeleteDialog";
import type { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";

const meta: Meta<typeof ListingDeleteDialog> = {
	title: "Dashboard/Admin/Listings/ListingDeleteDialog",
	component: ListingDeleteDialog,
	parameters: {
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof ListingDeleteDialog>;

function DialogWrapper({ children, defaultOpen = false }: { children: React.ReactNode; defaultOpen?: boolean }) {
	const [open, setOpen] = useState(defaultOpen);
	return (
		<div>
			<button onClick={() => setOpen(true)} className="rounded bg-primary px-4 py-2 text-primary-foreground">
				Open Dialog
			</button>
			{open && <div>{children}</div>}
		</div>
	);
}

export const AvailableListing: Story = {
	render: () => (
		<DialogWrapper defaultOpen>
			<ListingDeleteDialog
				listingId={"j1234567890abcdef" as Id<"listings">}
				isLocked={false}
				mortgageId={"j0987654321fedcba" as Id<"mortgages">}
				open={true}
				onOpenChange={() => {}}
			/>
		</DialogWrapper>
	),
};

export const LockedListing: Story = {
	render: () => (
		<DialogWrapper defaultOpen>
			<ListingDeleteDialog
				listingId={"j1234567890abcdef" as Id<"listings">}
				isLocked={true}
				mortgageId={"j0987654321fedcba" as Id<"mortgages">}
				open={true}
				onOpenChange={() => {}}
			/>
		</DialogWrapper>
	),
};

export const Interactive: Story = {
	render: () => {
		const [open, setOpen] = useState(false);
		return (
			<div>
				<button onClick={() => setOpen(true)} className="rounded bg-destructive px-4 py-2 text-destructive-foreground">
					Delete Listing
				</button>
				<ListingDeleteDialog
					listingId={"j1234567890abcdef" as Id<"listings">}
					isLocked={false}
					mortgageId={"j0987654321fedcba" as Id<"mortgages">}
					open={open}
					onOpenChange={setOpen}
				/>
			</div>
		);
	},
};

