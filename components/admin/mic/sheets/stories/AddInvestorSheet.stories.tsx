import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Button } from "@/components/ui/button";
import { AddInvestorSheet } from "../AddInvestorSheet";

const meta: Meta<typeof AddInvestorSheet> = {
	title: "Admin/MIC/Sheets/AddInvestorSheet",
	component: AddInvestorSheet,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof AddInvestorSheet>;

export const Default: Story = {
	args: {
		open: true,
		onOpenChange: (open) => {
			console.log(`Open: ${open}`);
		},
		onSubmit: (data) => {
			console.log(`Data: ${data}`);
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
					Open Sheet
				</Button>
				<StoryFn />
			</div>
		),
	],
};

export const Triggered: Story = {
	render: (args) => {
		const [isOpen, setIsOpen] = React.useState(false);
		return (
			<div className="min-h-screen bg-slate-50 p-8 dark:bg-slate-950">
				<Button onClick={() => setIsOpen(true)}>Add Investor</Button>
				<AddInvestorSheet {...args} onOpenChange={setIsOpen} open={isOpen} />
			</div>
		);
	},
	args: {
		onSubmit: (data) => {
			console.log(`Submitted: ${JSON.stringify(data)}`);
		},
	},
};
