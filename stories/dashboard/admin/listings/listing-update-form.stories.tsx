import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { useState } from "react";
import { ListingUpdateDialog } from "@/components/admin/listings/ListingUpdateDialog";
import type { Id } from "@/convex/_generated/dataModel";

// Wrapper component to make the dialog visible in Storybook
function ListingUpdateDialogWrapper(
	props: React.ComponentProps<typeof ListingUpdateDialog>
) {
	const [open, setOpen] = useState(true);

	return (
		<>
			<button
				onClick={() => setOpen(true)}
				className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
			>
				Open Update Dialog
			</button>
			<ListingUpdateDialog
				{...props}
				open={open}
				onOpenChange={setOpen}
			/>
		</>
	);
}

const meta = {
	title: "Dashboard/Admin/Listings/Update Dialog",
	component: ListingUpdateDialogWrapper,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Dialog for admin users to update listing visibility and lock state. Only admin users can access this functionality. This component is used in the admin listings management page.",
			},
		},
	},
	tags: ["autodocs"],
	argTypes: {
		listingId: {
			control: "text",
			description: "The ID of the listing being updated",
		},
		initialVisible: {
			control: "boolean",
			description: "Initial visibility state of the listing",
		},
		initialLocked: {
			control: "boolean",
			description: "Initial lock state of the listing",
		},
		onSave: {
			action: "onSave",
			description: "Callback when form is submitted",
		},
	},
	args: {
		listingId: "k17abc123def456" as Id<"listings">,
		onSave: fn(),
	},
} satisfies Meta<typeof ListingUpdateDialogWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default state with visible listing that is not locked.
 */
export const Default: Story = {
	args: {
		initialVisible: true,
		initialLocked: false,
	},
};

/**
 * Visible but locked listing.
 * Locked listings cannot be modified or deleted without force flag.
 */
export const VisibleAndLocked: Story = {
	args: {
		initialVisible: true,
		initialLocked: true,
	},
};

/**
 * Hidden and unlocked listing.
 * Hidden listings do not appear on the marketplace.
 */
export const HiddenAndUnlocked: Story = {
	args: {
		initialVisible: false,
		initialLocked: false,
	},
};

/**
 * Hidden and locked listing.
 * Most restrictive state - not visible and cannot be modified.
 */
export const HiddenAndLocked: Story = {
	args: {
		initialVisible: false,
		initialLocked: true,
	},
};

/**
 * Interactive example showing all state combinations.
 * Try toggling both switches to see different states.
 */
export const Interactive: Story = {
	args: {
		initialVisible: true,
		initialLocked: false,
	},
	parameters: {
		docs: {
			description: {
				story:
					"This interactive story allows you to toggle visibility and lock state to see how the form behaves in different scenarios. Click the button to open the dialog.",
			},
		},
	},
};

/**
 * Authorization example - only admin users should see this dialog.
 * Non-admin users should see an access denied message.
 */
export const AdminOnly: Story = {
	args: {
		initialVisible: true,
		initialLocked: false,
	},
	parameters: {
		docs: {
			description: {
				story:
					"This dialog is only accessible to users with admin role. The updateListing mutation validates admin privileges using hasRbacAccess.",
			},
		},
	},
};
