import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Button } from "@/components/ui/button";
import { InvestorRedemptionSheet } from "../InvestorRedemptionSheet";

const meta: Meta<typeof InvestorRedemptionSheet> = {
	title: "Admin/MIC/Sheets/InvestorRedemptionSheet",
	component: InvestorRedemptionSheet,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof InvestorRedemptionSheet>;

export const Default: Story = {
	args: {
		open: true,
		investorName: "Michael Scott",
		currentUnits: 250000,
		onOpenChange: (isOpen) => {
			if (!isOpen) return;
		},
		onSubmit: (data) => {
			if (!data) return;
		},
	},
	decorators: [
		(StoryFn) => (
			<div className="min-h-screen bg-slate-50 p-8 dark:bg-slate-950">
				<Button
					onClick={() => {
						console.log("clicked");
					}}
				>
					Redeem Units
				</Button>
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
				<Button onClick={() => setIsOpen(true)} variant="destructive">
					Process Redemption
				</Button>
				<InvestorRedemptionSheet
					{...args}
					onOpenChange={setIsOpen}
					open={isOpen}
				/>
			</div>
		);
	},
	args: {
		investorName: "Michael Scott",
		currentUnits: 1000,
	},
};
