import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { useState } from "react";
import { MortgageDeleteDialog } from "@/components/admin/mortgages/MortgageDeleteDialog";
import type { Id } from "@/convex/_generated/dataModel";

// Wrapper component to make the dialog visible in Storybook
function MortgageDeleteDialogWrapper(
	props: React.ComponentProps<typeof MortgageDeleteDialog>
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
			<MortgageDeleteDialog
				{...props}
				open={open}
				onOpenChange={setOpen}
			/>
		</>
	);
}

const meta = {
	title: "Dashboard/Admin/Mortgages/Delete Dialog",
	component: MortgageDeleteDialogWrapper,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Confirmation dialog for admin users to delete mortgages. Shows cascade delete warnings for all associated records (listings, comparables, ownership, payments). Requires force flag for mortgages with active listings. Only admin users can access this functionality. This component is used in the admin mortgages management page.",
			},
		},
	},
	tags: ["autodocs"],
	argTypes: {
		mortgageId: {
			control: "text",
			description: "The ID of the mortgage being deleted",
		},
		mortgageAddress: {
			control: "text",
			description: "The address of the mortgage property for display",
		},
		hasActiveListings: {
			control: "boolean",
			description: "Whether the mortgage has active listings",
		},
		expectedDeletions: {
			control: "object",
			description: "Expected counts of records to be cascade deleted",
		},
		onConfirm: {
			action: "onConfirm",
			description: "Callback when delete is confirmed (receives force flag)",
		},
	},
	args: {
		mortgageId: "k17mortgage001" as Id<"mortgages">,
		mortgageAddress: "789 Integration Ave, Ottawa, ON K1A0B1",
		onConfirm: fn(),
	},
} satisfies Meta<typeof MortgageDeleteDialogWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default state - no active listings with typical associated records.
 */
export const Default: Story = {
	args: {
		hasActiveListings: false,
		expectedDeletions: {
			listings: 0,
			comparables: 0,
			ownership: 3,
			payments: 12,
		},
	},
};

/**
 * Mortgage with significant associated records.
 * Shows the full cascade delete impact.
 */
export const WithManyRecords: Story = {
	args: {
		hasActiveListings: false,
		expectedDeletions: {
			listings: 2,
			comparables: 8,
			ownership: 5,
			payments: 36,
		},
	},
};

/**
 * Mortgage with active listings requiring force flag.
 * User must check the force checkbox to enable delete button.
 */
export const WithActiveListings: Story = {
	args: {
		hasActiveListings: true,
		expectedDeletions: {
			listings: 1,
			comparables: 4,
			ownership: 3,
			payments: 24,
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Mortgages with active listings require the force flag to be deleted. The delete button is disabled until the user checks the force checkbox.",
			},
		},
	},
};

/**
 * Mortgage with multiple active listings.
 * Most complex scenario requiring force confirmation.
 */
export const MultipleActiveListings: Story = {
	args: {
		hasActiveListings: true,
		expectedDeletions: {
			listings: 3,
			comparables: 12,
			ownership: 7,
			payments: 48,
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					"This scenario shows a mortgage with multiple active listings and extensive associated records. Force confirmation is required.",
			},
		},
	},
};

/**
 * Minimal associated records.
 * Shows the simplest deletion case.
 */
export const MinimalRecords: Story = {
	args: {
		hasActiveListings: false,
		expectedDeletions: {
			listings: 0,
			comparables: 0,
			ownership: 1,
			payments: 6,
		},
	},
};

/**
 * Authorization example - only admin users should see this dialog.
 * Non-admin users should never reach this point.
 */
export const AdminOnly: Story = {
	args: {
		hasActiveListings: false,
		expectedDeletions: {
			listings: 1,
			comparables: 3,
			ownership: 3,
			payments: 18,
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					"This dialog is only accessible to users with admin role. The deleteMortgage mutation validates admin privileges using hasRbacAccess.",
			},
		},
	},
};
