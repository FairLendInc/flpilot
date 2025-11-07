import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { useState } from "react";
import { MortgageUpdateSheet } from "@/components/admin/mortgages/MortgageUpdateSheet";
import type { Id } from "@/convex/_generated/dataModel";

// Wrapper component to make the sheet visible in Storybook
function MortgageUpdateSheetWrapper(
	props: React.ComponentProps<typeof MortgageUpdateSheet>
) {
	const [open, setOpen] = useState(true);

	return (
		<>
			<button
				onClick={() => setOpen(true)}
				className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
			>
				Open Update Sheet
			</button>
			<MortgageUpdateSheet
				{...props}
				open={open}
				onOpenChange={setOpen}
			/>
		</>
	);
}

const meta = {
	title: "Dashboard/Admin/Mortgages/Update Sheet",
	component: MortgageUpdateSheetWrapper,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Sheet component for admin users to update mortgage details. Only admin users can access this functionality. This component is used in the admin mortgages management page.",
			},
		},
	},
	tags: ["autodocs"],
	argTypes: {
		mortgageId: {
			control: "text",
			description: "The ID of the mortgage being updated",
		},
		onSaveComplete: {
			action: "onSaveComplete",
			description: "Callback when save is completed",
		},
	},
	args: {
		mortgageId: "k17mortgage001" as Id<"mortgages">,
		onSaveComplete: fn(),
	},
} satisfies Meta<typeof MortgageUpdateSheetWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default state with a mortgage ID.
 */
export const Default: Story = {
	args: {
		open: true,
		onOpenChange: fn(),
	},
};

/**
 * High loan amount mortgage.
 */
export const HighLoanAmount: Story = {
	args: {
		open: true,
		onOpenChange: fn(),
	},
};

/**
 * Low interest rate mortgage.
 */
export const LowInterestRate: Story = {
	args: {
		open: true,
		onOpenChange: fn(),
	},
};

/**
 * Small loan amount.
 */
export const SmallLoan: Story = {
	args: {
		open: true,
		onOpenChange: fn(),
	},
};

/**
 * Interactive example.
 * Try modifying the mortgage details.
 */
export const Interactive: Story = {
	args: {
		open: true,
		onOpenChange: fn(),
	},
	parameters: {
		docs: {
			description: {
				story:
					"This interactive story allows you to modify mortgage details. Click the button to open the sheet.",
			},
		},
	},
};

/**
 * Authorization example - only admin users should see this sheet.
 * Non-admin users should see an access denied message.
 */
export const AdminOnly: Story = {
	args: {
		open: true,
		onOpenChange: fn(),
	},
	parameters: {
		docs: {
			description: {
				story:
					"This sheet is only accessible to users with admin role. The updateMortgage mutation validates admin privileges using hasRbacAccess.",
			},
		},
	},
};
