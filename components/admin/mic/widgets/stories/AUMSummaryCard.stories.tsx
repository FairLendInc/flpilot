import type { Meta, StoryObj } from "@storybook/react";
import { AUMSummaryCard } from "../AUMSummaryCard";

const meta: Meta<typeof AUMSummaryCard> = {
	title: "Admin/MIC/Widgets/AUMSummaryCard",
	component: AUMSummaryCard,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	decorators: [
		(StoryFn) => (
			<div className="w-[400px] bg-slate-50 p-4 dark:bg-slate-950">
				<StoryFn />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof AUMSummaryCard>;

export const Default: Story = {
	args: {
		mortgageName: "First Mortgage - Toronto",
		address: "123 Bay St, Toronto, ON",
		totalValue: 1250000,
		ownershipPercentage: 100,
		micValue: 1250000,
		accrualStatus: "up-to-date",
		lastAccruedDate: "2024-12-01",
	},
};

export const PartialOwnership: Story = {
	args: {
		mortgageName: "Commercial Bridge Loan",
		address: "456 King St W, Toronto, ON",
		totalValue: 5000000,
		ownershipPercentage: 40,
		micValue: 2000000,
		accrualStatus: "pending",
		lastAccruedDate: "2024-11-30",
	},
};

export const BehindAccrual: Story = {
	args: {
		mortgageName: "Residential Refinance",
		address: "789 Yonge St, Toronto, ON",
		totalValue: 850000,
		ownershipPercentage: 80,
		micValue: 680000,
		accrualStatus: "behind",
		lastAccruedDate: "2024-11-15",
	},
};

export const SmallStake: Story = {
	args: {
		mortgageName: "Land Development Loan",
		address: "101 Queen St E, Toronto, ON",
		totalValue: 10000000,
		ownershipPercentage: 5,
		micValue: 500000,
		accrualStatus: "up-to-date",
	},
};
