import type { Meta, StoryObj } from "@storybook/react";
import { DistributionHistoryTable } from "../DistributionHistoryTable";

const meta: Meta<typeof DistributionHistoryTable> = {
	title: "Admin/MIC/Tables/DistributionHistoryTable",
	component: DistributionHistoryTable,
	parameters: {
		layout: "fullscreen",
	},
	tags: ["autodocs"],
	decorators: [
		(StoryFn) => (
			<div className="min-h-screen bg-slate-50 p-8 dark:bg-slate-950">
				<StoryFn />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof DistributionHistoryTable>;

const mockDistributions = [
	{
		id: "1",
		periodName: "November 2024",
		totalAmount: 145200.5,
		rate: 8.2,
		investorCount: 45,
		status: "completed" as const,
		completionDate: "2024-12-01",
	},
	{
		id: "2",
		periodName: "October 2024",
		totalAmount: 138400.0,
		rate: 7.9,
		investorCount: 42,
		status: "completed" as const,
		completionDate: "2024-11-01",
	},
	{
		id: "3",
		periodName: "December 2024",
		totalAmount: 45000.0,
		rate: 8.5,
		investorCount: 48,
		status: "pending" as const,
	},
	{
		id: "4",
		periodName: "September 2024",
		totalAmount: 125000.0,
		rate: 7.5,
		investorCount: 38,
		status: "failed" as const,
		completionDate: "2024-10-01",
	},
];

export const Default: Story = {
	args: {
		data: mockDistributions,
	},
};

export const Empty: Story = {
	args: {
		data: [],
	},
};

export const CompletedOnly: Story = {
	args: {
		data: mockDistributions.filter((d) => d.status === "completed"),
	},
};
