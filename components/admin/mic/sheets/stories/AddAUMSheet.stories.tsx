import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Button } from "@/components/ui/button";
import { AddAUMSheet } from "../AddAUMSheet";

const meta: Meta<typeof AddAUMSheet> = {
	title: "Admin/MIC/Sheets/AddAUMSheet",
	component: AddAUMSheet,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof AddAUMSheet>;

export const Default: Story = {
	args: {
		open: true,
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
					Add AUM
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
				<Button onClick={() => setIsOpen(true)}>New Mortgage</Button>
				<AddAUMSheet {...args} onOpenChange={setIsOpen} open={isOpen} />
			</div>
		);
	},
	args: {
		onSubmit: (data) => {
			console.log(`Added AUM: ${JSON.stringify(data)}`);
		},
	},
};
