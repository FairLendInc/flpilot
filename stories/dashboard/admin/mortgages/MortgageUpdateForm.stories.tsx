import type { Meta, StoryObj } from "@storybook/react";
import { MortgageUpdateForm } from "@/app/dashboard/admin/mortgages/components/MortgageUpdateForm";
import type { Id } from "@/convex/_generated/dataModel";

const meta: Meta<typeof MortgageUpdateForm> = {
	title: "Dashboard/Admin/Mortgages/MortgageUpdateForm",
	component: MortgageUpdateForm,
	parameters: {
		layout: "centered",
	},
	decorators: [
		(Story) => (
			<div className="w-[600px]">
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof MortgageUpdateForm>;

export const Default: Story = {
	args: {
		mortgageId: "j1234567890abcdef" as Id<"mortgages">,
	},
};

export const WithValidationErrors: Story = {
	args: {
		mortgageId: "j1234567890abcdef" as Id<"mortgages">,
	},
	parameters: {
		mockData: {
			showErrors: true,
		},
	},
};

