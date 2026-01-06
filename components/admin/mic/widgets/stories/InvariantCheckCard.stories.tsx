import type { Meta, StoryObj } from "@storybook/react";
import { InvariantCheckCard } from "../InvariantCheckCard";

const meta: Meta<typeof InvariantCheckCard> = {
	title: "Admin/MIC/Widgets/InvariantCheckCard",
	component: InvariantCheckCard,
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
type Story = StoryObj<typeof InvariantCheckCard>;

const mockInvariants = [
	{
		id: "1",
		name: "Ledger Cash Parity",
		status: "pass" as const,
		expected: "$1,250,560.45",
		actual: "$1,250,560.45",
		lastChecked: new Date(),
	},
	{
		id: "2",
		name: "Total Capital Integrity",
		status: "fail" as const,
		expected: "$11,200,000.00",
		actual: "$11,200,050.00",
		lastChecked: new Date(),
	},
	{
		id: "3",
		name: "Asset/Liability Balance",
		status: "checking" as const,
		expected: "$24,560,000.00",
		actual: "Calculating...",
		lastChecked: new Date(),
	},
	{
		id: "4",
		name: "Investor Unit Parity",
		status: "pass" as const,
		expected: "1,450,000 Units",
		actual: "1,450,000 Units",
		lastChecked: new Date(),
	},
];

export const Default: Story = {
	args: {
		invariants: mockInvariants,
	},
};

export const AllPassing: Story = {
	args: {
		invariants: mockInvariants.filter((i) => i.status === "pass"),
	},
};

export const WithFailures: Story = {
	args: {
		invariants: mockInvariants.filter((i) => i.status !== "pass"),
	},
};

export const Empty: Story = {
	args: {
		invariants: [],
	},
};
