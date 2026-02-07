import type { Meta, StoryObj } from "@storybook/react";
import { InvestorTransactionTable } from "../InvestorTransactionTable";

const meta: Meta<typeof InvestorTransactionTable> = {
	title: "Admin/MIC/Tables/InvestorTransactionTable",
	component: InvestorTransactionTable,
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
type Story = StoryObj<typeof InvestorTransactionTable>;

const mockTransactions = [
	{
		id: "1",
		type: "subscription" as const,
		description: "Initial Unit Subscription",
		timestamp: "2024-11-01T10:00:00Z",
		amount: 100000,
		balanceAfter: 100000,
		reference: "SUB-8902",
	},
	{
		id: "2",
		type: "distribution" as const,
		description: "Monthly Interest Distribution - Oct 2024",
		timestamp: "2024-11-01T09:00:00Z",
		amount: 650.5,
		balanceAfter: 100650.5,
		reference: "DIST-2024-10",
	},
	{
		id: "3",
		type: "redemption" as const,
		description: "Partial Unit Redemption",
		timestamp: "2024-12-05T14:30:00Z",
		amount: -5000,
		balanceAfter: 95650.5,
		reference: "RED-1123",
	},
	{
		id: "4",
		type: "adjustment" as const,
		description: "Clawback / Admin Fee Correction",
		timestamp: "2024-12-10T11:15:00Z",
		amount: -25,
		balanceAfter: 95625.5,
	},
	{
		id: "5",
		type: "subscription" as const,
		description: "Follow-on Subscription",
		timestamp: "2024-12-15T16:00:00Z",
		amount: 25000,
		balanceAfter: 120625.5,
		reference: "SUB-9110",
	},
];

export const Default: Story = {
	args: {
		data: mockTransactions,
	},
};

export const SingleEntry: Story = {
	args: {
		data: [mockTransactions[0]],
	},
};

export const Empty: Story = {
	args: {
		data: [],
	},
};
