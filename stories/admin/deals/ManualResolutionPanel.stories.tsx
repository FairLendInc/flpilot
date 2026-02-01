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

const mockAlert = {
	_id: "alert_1",
	userId: "user_1",
	relatedDealId: "deal_1",
	type: "ownership_transfer_rejected",
	severity: "warning",
	message: "Ownership transfer rejected by admin review.",
	createdAt: Date.now() - 1000 * 60 * 30,
} as any;

const mockDealDetails = {
	deal: {
		_id: "deal_1",
		mortgageId: "mortgage_1",
		currentState: "pending_ownership_review",
	},
	mortgage: {
		address: {
			street: "123 King St",
			city: "Toronto",
			state: "ON",
			zip: "M5V 2T6",
		},
	},
} as any;

const mockInvestor = {
	first_name: "Jordan",
	last_name: "Lee",
	email: "jordan.lee@example.com",
} as any;

const meta: Meta<typeof ManualResolutionPanel> = {
	title: "Dashboard/Admin/Deals/Manual Resolution Panel",
	component: ManualResolutionPanel,
	parameters: {
		layout: "padded",
		convex: {
			queries: {
				"alerts:getAllUserAlerts": [mockAlert],
				"pendingOwnershipTransfers:getPendingTransferByDeal": {
					_id: "ptr_1",
				},
			},
			authenticatedQueries: {
				"deals:getDealWithDetails": mockDealDetails,
				"users:getUserByIdAdmin": mockInvestor,
			},
		},
		auth: {
			user: { id: "admin", email: "admin@example.com" },
		},
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

