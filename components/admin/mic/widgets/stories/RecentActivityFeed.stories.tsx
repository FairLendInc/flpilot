import type { Meta, StoryObj } from "@storybook/react";
import { RecentActivityFeed } from "../RecentActivityFeed";

const meta: Meta<typeof RecentActivityFeed> = {
	title: "Admin/MIC/Widgets/RecentActivityFeed",
	component: RecentActivityFeed,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	decorators: [
		(StoryFn) => (
			<div className="min-h-[600px] w-[450px] bg-slate-50 p-4 dark:bg-slate-950">
				<StoryFn />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof RecentActivityFeed>;

const mockActivities = [
	{
		id: "1",
		type: "subscription" as const,
		title: "New Investor Subscription",
		description:
			"Investor INV-001 subscribed to 25,000 units of MICCAP-FLMIC/0",
		timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
		amount: "$25,000",
	},
	{
		id: "2",
		type: "origination" as const,
		title: "Mortgage Originated",
		description: "MIC funded mortgage MTG-789 (First Mortgage - Toronto)",
		timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
		amount: "$450,000",
	},
	{
		id: "3",
		type: "distribution" as const,
		title: "Monthly Distribution",
		description:
			"System processed November 2024 distributions for all investors",
		timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
		amount: "$12,450",
	},
	{
		id: "4",
		type: "sale" as const,
		title: "AUM Fraction Sold",
		description: "Sold 20% fraction of MTG-456 to external MIC",
		timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
		amount: "$100,000",
	},
	{
		id: "5",
		type: "redemption" as const,
		title: "Investor Redemption",
		description: "Redemption request processed for Investor INV-045",
		timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 1 week ago
		amount: "$5,000",
	},
];

export const Default: Story = {
	args: {
		activities: mockActivities,
	},
};

export const Empty: Story = {
	args: {
		activities: [],
	},
};

export const FewItems: Story = {
	args: {
		activities: mockActivities.slice(0, 2),
	},
};

export const LongList: Story = {
	args: {
		activities: [
			...mockActivities,
			...mockActivities.map((a) => ({ ...a, id: `${a.id}-copy` })),
		],
	},
};
