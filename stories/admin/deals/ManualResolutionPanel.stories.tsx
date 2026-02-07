/**
 * Manual Resolution Panel Stories
 *
 * Storybook stories for the ManualResolutionPanel component.
 * This component handles escalated ownership transfers that require
 * manual admin intervention after multiple rejections.
 */

import type { Meta, StoryObj } from "@storybook/react";
import type { Id } from "@/convex/_generated/dataModel";
import { ManualResolutionPanel } from "@/components/admin/deals/ManualResolutionPanel";

const meta: Meta<typeof ManualResolutionPanel> = {
	title: "Dashboard/Admin/Deals/Manual Resolution Panel",
	component: ManualResolutionPanel,
	parameters: {
		layout: "padded",
	},
};

export default meta;
type Story = StoryObj<typeof ManualResolutionPanel>;

// ============================================================================
// Stories
// ============================================================================

/**
 * Default state showing multiple escalated deals requiring manual resolution.
 */
export const Default: Story = {
	args: {
		onResolved: () => {},
	},
};

/**
 * Single escalated deal view.
 */
export const SingleDeal: Story = {
	args: {
		dealId: "deal_single" as Id<"deals">,
		onResolved: () => {},
	},
};

/**
 * Highly escalated deal with 3+ rejections - shows critical urgency.
 */
export const HighlyEscalated: Story = {
	args: {
		dealId: "deal_escalated" as Id<"deals">,
		onResolved: () => {},
	},
};

/**
 * Empty state when no escalated items exist.
 */
export const EmptyState: Story = {
	args: {
		onResolved: () => {},
	},
};

/**
 * Loading state during action processing.
 */
export const LoadingState: Story = {
	args: {
		onResolved: () => {},
	},
};

/**
 * Deal without property address (shows minimal info).
 */
export const MinimalInfo: Story = {
	args: {
		dealId: "deal_minimal" as Id<"deals">,
		onResolved: () => {},
	},
};


