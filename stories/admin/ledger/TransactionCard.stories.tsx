import type { Meta, StoryObj } from "@storybook/react";
import { TransactionCard } from "@/components/admin/ledger/TransactionCard";

const meta: Meta<typeof TransactionCard> = {
	title: "Admin/Ledger/TransactionCard",
	component: TransactionCard,
	parameters: {
		layout: "padded",
		docs: {
			description: {
				component:
					"Displays a single Formance ledger transaction with its postings, reference, and metadata. Each posting shows source → destination flow with amount and asset.",
			},
		},
	},
	decorators: [
		(Story) => (
			<div className="w-full max-w-2xl">
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof TransactionCard>;

/**
 * Single posting transaction - the most common case.
 * Shows a simple transfer from one account to another.
 */
export const SinglePosting: Story = {
	args: {
		id: "12345",
		timestamp: new Date("2024-01-15T14:30:00Z"),
		postings: [
			{
				source: "investor:user123:inventory",
				destination: "fairlend:inventory",
				amount: 25000000,
				asset: "CAD",
			},
		],
		reference: "purchase-deal-abc123",
	},
};

/**
 * Multiple postings transaction - complex transfers with multiple legs.
 * Common for share purchases where funds and shares move simultaneously.
 */
export const MultiplePostings: Story = {
	args: {
		id: "67890",
		timestamp: new Date("2024-01-20T09:15:00Z"),
		postings: [
			{
				source: "investor:user456:inventory",
				destination: "fairlend:inventory",
				amount: 50000000,
				asset: "CAD",
			},
			{
				source: "fairlend:inventory",
				destination: "investor:user456:inventory",
				amount: 5000,
				asset: "Mxyz789/SHARE",
			},
			{
				source: "fairlend:inventory",
				destination: "fairlend:fees",
				amount: 100000,
				asset: "CAD",
			},
		],
		reference: "purchase-deal-xyz789",
	},
};

/**
 * Transaction with rich metadata - shows expandable metadata section.
 */
export const WithMetadata: Story = {
	args: {
		id: "11111",
		timestamp: new Date("2024-02-01T16:45:00Z"),
		postings: [
			{
				source: "@world",
				destination: "mortgage:def456:shares",
				amount: 10000,
				asset: "Mdef456/SHARE",
			},
		],
		reference: "mint-mortgage-def456",
		metadata: {
			mortgageId: "def456",
			propertyAddress: "456 Oak Avenue, Toronto, ON",
			loanAmount: "500000",
			initiatedBy: "admin@fairlend.com",
			dealId: "deal_abc123",
			action: "initial_mint",
		},
	},
};

/**
 * Transaction without reference - minimal display.
 */
export const WithoutReference: Story = {
	args: {
		id: "22222",
		timestamp: new Date("2024-02-10T11:00:00Z"),
		postings: [
			{
				source: "fairlend:fees",
				destination: "fairlend:treasury",
				amount: 200000,
				asset: "CAD",
			},
		],
	},
};

/**
 * Share transfer transaction - showing fractional ownership movement.
 */
export const ShareTransfer: Story = {
	args: {
		id: "33333",
		timestamp: new Date("2024-02-15T08:30:00Z"),
		postings: [
			{
				source: "investor:user123:inventory",
				destination: "investor:user789:inventory",
				amount: 2500,
				asset: "Mabc123/SHARE",
			},
		],
		reference: "secondary-transfer-2024-02-15",
		metadata: {
			transferType: "secondary_sale",
			buyerUserId: "user789",
			sellerUserId: "user123",
			pricePerShare: "50",
		},
	},
};

/**
 * Initial mint from @world - how new assets enter the system.
 */
export const InitialMint: Story = {
	args: {
		id: "44444",
		timestamp: new Date("2024-03-01T10:00:00Z"),
		postings: [
			{
				source: "@world",
				destination: "fairlend:inventory",
				amount: 10000,
				asset: "Mnew123/SHARE",
			},
		],
		reference: "mint-new-mortgage-new123",
		metadata: {
			action: "initial_mint",
			mortgageAddress: "789 Pine Street, Vancouver, BC",
			mortgageId: "new123",
		},
	},
};
