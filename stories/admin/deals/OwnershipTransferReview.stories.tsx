import type { Meta, StoryObj } from "@storybook/react";
import type { ComponentProps } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import { OwnershipTransferReviewContent } from "@/components/admin/deals/OwnershipTransferReview";

// Mock data helpers
const mockPendingTransfer = {
	_id: "ptr_mock123" as Id<"pending_ownership_transfers">,
	_creationTime: Date.now(),
	dealId: "deal_mock123" as Id<"deals">,
	fromOwnerId: "fairlend",
	toOwnerId: "user_mock456" as Id<"users">,
	percentage: 100,
	amount: 500000,
	status: "pending",
	createdAt: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
	rejectionCount: 0,
};

const mockCurrentOwnership = [
	{ ownerId: "fairlend", percentage: 100, ownerName: "FairLend" },
] as const;

const mockAfterOwnership = [
	{
		ownerId: "user_mock456" as Id<"users">,
		percentage: 100,
		ownerName: "John Investor",
	},
] as const;

// Types for mock casting
type PendingTransfer = ComponentProps<
	typeof OwnershipTransferReviewContent
>["pendingTransfer"];
type OwnershipEntry = ComponentProps<
	typeof OwnershipTransferReviewContent
>["currentOwnership"][number];

const meta: Meta<typeof OwnershipTransferReviewContent> = {
	title: "Dashboard/Admin/Deals/Ownership Transfer Review",
	component: OwnershipTransferReviewContent,
	parameters: {
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof OwnershipTransferReviewContent>;

/**
 * Default state: A pending 100% transfer from FairLend to an investor.
 */
export const Default: Story = {
	args: {
		pendingTransfer: mockPendingTransfer as unknown as PendingTransfer,
		currentOwnership: [...mockCurrentOwnership] as OwnershipEntry[],
		afterOwnership: [...mockAfterOwnership] as OwnershipEntry[],
		onApprove: (async () => {
			await new Promise((r) => setTimeout(r, 1000));
		}) as any,
		onReject: (async () => {
			await new Promise((r) => setTimeout(r, 1000));
		}) as any,
	},
};

/**
 * Fractional transfer scenario: Selling 40% of the loan.
 * Shows complex cap table visualization.
 */
export const FractionalTransfer: Story = {
	args: {
		pendingTransfer: {
			...mockPendingTransfer,
			percentage: 40,
			toOwnerId: "user_mock789" as Id<"users">,
			amount: 200000,
		} as unknown as PendingTransfer,
		currentOwnership: [
			{ ownerId: "fairlend", percentage: 60, ownerName: "FairLend" },
			{
				ownerId: "user_mock456" as Id<"users">,
				percentage: 40,
				ownerName: "Early Investor",
			},
		] as OwnershipEntry[],
		afterOwnership: [
			{ ownerId: "fairlend", percentage: 20, ownerName: "FairLend" },
			{
				ownerId: "user_mock456" as Id<"users">,
				percentage: 40,
				ownerName: "Early Investor",
			},
			{
				ownerId: "user_mock789" as Id<"users">,
				percentage: 40,
				ownerName: "New Investor",
			},
		] as OwnershipEntry[],
		onApprove: (async () => {
			await new Promise((r) => setTimeout(r, 1000));
		}) as any,
		onReject: (async () => {
			await new Promise((r) => setTimeout(r, 1000));
		}) as any,
	},
};

/**
 * Deal that has been rejected before.
 * Shows warning callout with previous rejection reason.
 */
export const PreviouslyRejected: Story = {
	args: {
		pendingTransfer: {
			...mockPendingTransfer,
			rejectionCount: 1,
			reviewNotes:
				"Incorrect percentage calculation. Please verify with ledger.",
		} as unknown as PendingTransfer,
		currentOwnership: [...mockCurrentOwnership] as OwnershipEntry[],
		afterOwnership: [...mockAfterOwnership] as OwnershipEntry[],
		onApprove: (async () => {
			await new Promise((r) => setTimeout(r, 1000));
		}) as any,
		onReject: (async () => {
			await new Promise((r) => setTimeout(r, 1000));
		}) as any,
	},
};

/**
 * Read-only view for an already approved transfer.
 */
export const ApprovedState: Story = {
	args: {
		pendingTransfer: {
			...mockPendingTransfer,
			status: "approved",
			reviewedAt: Date.now(),
			reviewNotes: "Approved via admin review",
		} as unknown as PendingTransfer,
		currentOwnership: [...mockCurrentOwnership] as OwnershipEntry[],
		afterOwnership: [...mockAfterOwnership] as OwnershipEntry[],
		onApprove: (async () => {}) as any,
		onReject: (async () => {}) as any,
	},
};

/**
 * Read-only view for a rejected transfer.
 */
export const RejectedState: Story = {
	args: {
		pendingTransfer: {
			...mockPendingTransfer,
			status: "rejected",
			reviewedAt: Date.now(),
			reviewNotes: "Compliance check failed.",
		} as unknown as PendingTransfer,
		currentOwnership: [...mockCurrentOwnership] as OwnershipEntry[],
		afterOwnership: [...mockAfterOwnership] as OwnershipEntry[],
		onApprove: (async () => {}) as any,
		onReject: (async () => {}) as any,
	},
};
