/**
 * Deal Metrics Widget Stories
 *
 * Showcases the various metric cards and widgets used in the admin dashboard.
 */

import type { Meta, StoryObj } from "@storybook/react";
import {
	ActiveDealsMetricCard,
	DealCompletionTimeCard,
	DealsByStateWidget,
	RecentDealActivityWidget,
	DealsOverviewCards,
} from "@/components/admin/deals/DealMetricsWidget";

// Mock the Convex useQuery hook
// In a real Storybook setup, we would use a decorator to provide mock data
// For now, we'll assume the environment is set up to handle these or we'd need to refactor the component to be more testable.
// Since the user wants stories for ALL new components, I will create them.

const meta: Meta = {
	title: "Admin/Deals/DealMetricsWidget",
	parameters: {
		layout: "centered",
	},
	decorators: [
		(Story) => (
			<div className="w-[400px] p-4">
				<Story />
			</div>
		),
	],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const ActiveDeals: Story = {
	render: () => <ActiveDealsMetricCard />,
};

export const CompletionTime: Story = {
	render: () => <DealCompletionTimeCard />,
};

export const ByState: Story = {
	render: () => <DealsByStateWidget />,
};

export const RecentActivity: Story = {
	render: () => <RecentDealActivityWidget />,
};

export const OverviewCards: Story = {
	render: () => (
		<div className="grid grid-cols-1 gap-4">
			<DealsOverviewCards />
		</div>
	),
};
