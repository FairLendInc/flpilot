import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { useState } from "react";
import { MortgageUpdateDialog } from "@/components/admin/mortgages/MortgageUpdateDialog";
import type { Id } from "@/convex/_generated/dataModel";

// Wrapper component to make the dialog visible in Storybook
function MortgageUpdateDialogWrapper(
	props: React.ComponentProps<typeof MortgageUpdateDialog>
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
			<MortgageUpdateDialog
				{...props}
				open={open}
				onOpenChange={setOpen}
			/>
		</>
	);
}

const meta = {
	title: "Dashboard/Admin/Mortgages/Update Dialog",
	component: MortgageUpdateDialogWrapper,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Dialog for admin users to update mortgage loan amount and interest rate. Only admin users can access this functionality. This component is used in the admin mortgages management page.",
			},
		},
	},
	tags: ["autodocs"],
	argTypes: {
		mortgageId: {
			control: "text",
			description: "The ID of the mortgage being updated",
		},
		initialLoanAmount: {
			control: "number",
			description: "Initial loan amount",
		},
		initialInterestRate: {
			control: "number",
			description: "Initial interest rate",
		},
		onSave: {
			action: "onSave",
			description: "Callback when form is submitted",
		},
	},
	args: {
		mortgageId: "k17mortgage001" as Id<"mortgages">,
		onSave: fn(),
	},
} satisfies Meta<typeof MortgageUpdateDialogWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default state with typical loan amount and interest rate.
 */
export const Default: Story = {
	args: {
		initialLoanAmount: 500000,
		initialInterestRate: 5.5,
	},
};

/**
 * High loan amount mortgage.
 */
export const HighLoanAmount: Story = {
	args: {
		initialLoanAmount: 1500000,
		initialInterestRate: 6.25,
	},
};

/**
 * Low interest rate mortgage.
 */
export const LowInterestRate: Story = {
	args: {
		initialLoanAmount: 450000,
		initialInterestRate: 3.25,
	},
};

/**
 * Small loan amount.
 */
export const SmallLoan: Story = {
	args: {
		initialLoanAmount: 250000,
		initialInterestRate: 4.75,
	},
};

/**
 * Interactive example.
 * Try modifying the loan amount and interest rate.
 */
export const Interactive: Story = {
	args: {
		initialLoanAmount: 600000,
		initialInterestRate: 5.0,
	},
	parameters: {
		docs: {
			description: {
				story:
					"This interactive story allows you to modify the loan amount and interest rate to see how the form behaves. Click the button to open the dialog.",
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
		initialLoanAmount: 500000,
		initialInterestRate: 5.5,
	},
	parameters: {
		docs: {
			description: {
				story:
					"This dialog is only accessible to users with admin role. The updateMortgage mutation validates admin privileges using hasRbacAccess.",
			},
		},
	},
};
