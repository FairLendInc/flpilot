import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { useState } from "react";
import { ListingDeleteDialog } from "@/components/admin/listings/ListingDeleteDialog";
import type { Id } from "@/convex/_generated/dataModel";

// Wrapper component to make the dialog visible in Storybook
function ListingDeleteDialogWrapper(
	props: Omit<
		React.ComponentProps<typeof ListingDeleteDialog>,
		"open" | "onOpenChange"
	>
) {
	const [open, setOpen] = useState(true);

	return (
		<>
			<button
				onClick={() => setOpen(true)}
				className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
			>
				Open Delete Dialog
			</button>
			<ListingDeleteDialog
				{...props}
				open={open}
				onOpenChange={setOpen}
			/>
		</>
	);
}

const meta = {
	title: "Dashboard/Admin/Listings/Delete Dialog",
	component: ListingDeleteDialogWrapper,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Confirmation dialog for admin users to delete listings. Shows cascade delete warnings and requires force flag for locked listings. Only admin users can access this functionality. This component is used in the admin listings management page.",
			},
		},
	},
	tags: ["autodocs"],
	argTypes: {
		listingId: {
			control: "text",
			description: "The ID of the listing being deleted",
		},
		listingAddress: {
			control: "text",
			description: "The address of the listing for display",
		},
		isLocked: {
			control: "boolean",
			description: "Whether the listing is locked",
		},
		comparablesCount: {
			control: "number",
			description: "Number of comparables that will be cascade deleted",
		},
		onConfirm: {
			action: "onConfirm",
			description: "Callback when delete is confirmed (receives force flag)",
		},
	},
	args: {
		listingId: "k17abc123def456" as Id<"listings">,
		listingAddress: "789 Integration Ave, Ottawa, ON K1A0B1",
		onConfirm: fn(),
	},
} satisfies Meta<typeof ListingDeleteDialogWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default state - unlocked listing with no comparables.
 * Simple deletion with cascade warning.
 */
export const Default: Story = {
	args: {
		isLocked: false,
		comparablesCount: 0,
	},
};

/**
 * Listing with comparables that will be cascade deleted.
 * Shows warning about multiple records being deleted.
 */
export const WithComparables: Story = {
	args: {
		isLocked: false,
		comparablesCount: 3,
	},
};

/**
 * Locked listing requiring force flag.
 * User must check the force checkbox to enable delete button.
 */
export const LockedListing: Story = {
	args: {
		isLocked: true,
		comparablesCount: 0,
	},
	parameters: {
		docs: {
			description: {
				story:
					"Locked listings require the force flag to be deleted. The delete button is disabled until the user checks the force checkbox.",
			},
		},
	},
};

/**
 * Locked listing with comparables.
 * Most complex scenario - requires force flag and has cascade deletes.
 */
export const LockedWithComparables: Story = {
	args: {
		isLocked: true,
		comparablesCount: 5,
	},
	parameters: {
		docs: {
			description: {
				story:
					"This scenario combines both challenges: the listing is locked (requiring force flag) and has multiple comparables that will be cascade deleted.",
			},
		},
	},
};

/**
 * Many comparables scenario.
 * Shows how the dialog handles larger numbers.
 */
export const ManyComparables: Story = {
	args: {
		isLocked: false,
		comparablesCount: 15,
	},
};

/**
 * Authorization example - only admin users should see this dialog.
 * Non-admin users should never reach this point.
 */
export const AdminOnly: Story = {
	args: {
		isLocked: false,
		comparablesCount: 3,
	},
	parameters: {
		docs: {
			description: {
				story:
					"This dialog is only accessible to users with admin role. The deleteListing mutation validates admin privileges using hasRbacAccess.",
			},
		},
	},
};
