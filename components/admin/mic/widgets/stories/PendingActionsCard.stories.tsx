import type { Meta, StoryObj } from "@storybook/react";
import { PendingActionsCard } from "../PendingActionsCard";

const meta: Meta<typeof PendingActionsCard> = {
	title: "Admin/MIC/Widgets/PendingActionsCard",
	component: PendingActionsCard,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	decorators: [
		(StoryFn) => (
			<div className="w-[450px] bg-slate-50 p-4 dark:bg-slate-950">
				<StoryFn />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof PendingActionsCard>;

const mockActions = [
	{
		id: "1",
		type: "subscription_approval" as const,
		title: "Approve Subscription",
		description: "Investor INV-001 (Michael Scott) pending $50,000",
		priority: "high" as const,
	},
	{
		id: "2",
		type: "distribution_review" as const,
		title: "Review Distribution",
		description: "Monthly close for Dec 2024 requires validation",
		priority: "medium" as const,
	},
	{
		id: "3",
		type: "redemption_approval" as const,
		title: "Process Redemption",
		description: "Investor INV-022 requested $10,000 withdrawal",
		priority: "low" as const,
	},
	{
		id: "4",
		type: "origination_approval" as const,
		title: "Fund Mortgage",
		description: "MTG-102 (Vancouver Heights) ready for funding",
		priority: "high" as const,
	},
];

export const Default: Story = {
	args: {
		actions: mockActions,
	},
};

export const Empty: Story = {
	args: {
		actions: [],
	},
};

export const HighPriorityOnly: Story = {
	args: {
		actions: mockActions.filter((a) => a.priority === "high"),
	},
};

export const SingleAction: Story = {
	args: {
		actions: [mockActions[1]],
	},
};
