import type { Meta, StoryObj } from "@storybook/react";
import { MICAUMTable } from "../MICAUMTable";

const meta: Meta<typeof MICAUMTable> = {
	title: "Admin/MIC/Tables/MICAUMTable",
	component: MICAUMTable,
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
type Story = StoryObj<typeof MICAUMTable>;

const mockAssets = [
	{
		id: "1",
		mortgageName: "First Mortgage - Toronto",
		address: "123 Bay St, Toronto, ON",
		totalValue: 1250000,
		ownershipPercentage: 100,
		micValue: 1250000,
		accrualStatus: "up-to-date" as const,
		lastAccruedDate: "2024-12-01",
	},
	{
		id: "2",
		mortgageName: "Commercial Bridge Loan",
		address: "456 King St W, Toronto, ON",
		totalValue: 5000000,
		ownershipPercentage: 40,
		micValue: 2000000,
		accrualStatus: "pending" as const,
		lastAccruedDate: "2024-11-30",
	},
	{
		id: "3",
		mortgageName: "Residential Refinance",
		address: "789 Yonge St, Toronto, ON",
		totalValue: 850000,
		ownershipPercentage: 80,
		micValue: 680000,
		accrualStatus: "behind" as const,
		lastAccruedDate: "2024-11-15",
	},
	{
		id: "4",
		mortgageName: "Land Development Loan",
		address: "101 Queen St E, Toronto, ON",
		totalValue: 10000000,
		ownershipPercentage: 5,
		micValue: 500000,
		accrualStatus: "up-to-date" as const,
	},
];

export const Default: Story = {
	args: {
		data: mockAssets,
	},
};

export const Empty: Story = {
	args: {
		data: [],
	},
};

export const ManyAssets: Story = {
	args: {
		data: [
			...mockAssets,
			...mockAssets.map((a) => ({
				...a,
				id: `${a.id}-copy`,
				mortgageName: `${a.mortgageName} (Copy)`,
			})),
		],
	},
};
