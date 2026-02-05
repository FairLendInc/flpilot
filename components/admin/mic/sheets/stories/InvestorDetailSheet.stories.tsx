import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Button } from "@/components/ui/button";
import { InvestorDetailSheet } from "../InvestorDetailSheet";

const meta: Meta<typeof InvestorDetailSheet> = {
	title: "Admin/MIC/Sheets/InvestorDetailSheet",
	component: InvestorDetailSheet,
	parameters: {
		layout: "fullscreen",
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof InvestorDetailSheet>;

const mockInvestor = {
	id: "INV-001",
	name: "Michael Scott",
	email: "michael.scott@dundermifflin.com",
	capitalClass: "MICCAP-FLMIC/0",
	unitsOwned: 250000,
	ownershipPercentage: 22.5,
	currentValue: 250000,
	accrualStatus: "up-to-date" as const,
	lastAccruedDate: "2024-12-01",
};

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
];

export const Default: Story = {
	args: {
		open: true,
		investor: mockInvestor,
		transactions: mockTransactions,
		onOpenChange: (isOpen) => {
			if (!isOpen) return;
		},
		onRedeemClick: (i) => {
			if (!i) return;
		},
	},
	decorators: [
		(StoryFn) => (
			<div className="min-h-screen bg-slate-50 p-8 dark:bg-slate-950">
				<Button>View Details</Button>
				<StoryFn />
			</div>
		),
	],
};

export const Interactive: Story = {
	render: (args) => {
		const [isOpen, setIsOpen] = React.useState(false);
		return (
			<div className="min-h-screen bg-slate-50 p-8 dark:bg-slate-950">
				<Button onClick={() => setIsOpen(true)}>Open Profile</Button>
				<InvestorDetailSheet {...args} onOpenChange={setIsOpen} open={isOpen} />
			</div>
		);
	},
	args: {
		investor: mockInvestor,
		transactions: mockTransactions,
	},
};
