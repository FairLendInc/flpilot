import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Button } from "@/components/ui/button";
import { SellAUMSheet } from "../SellAUMSheet";

const meta: Meta<typeof SellAUMSheet> = {
	title: "Admin/MIC/Sheets/SellAUMSheet",
	component: SellAUMSheet,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof SellAUMSheet>;

const noop = () => {
	// Intentional no-op for Storybook stories
};

export const Default: Story = {
	args: {
		open: true,
		assetName: "First Mortgage Toronto",
		currentShare: 100,
		onOpenChange: noop,
		onSubmit: noop,
	},
	decorators: [
		(StoryFn) => (
			<div className="min-h-screen bg-slate-50 p-8 dark:bg-slate-950">
				<Button onClick={noop}>Sell Share</Button>
				<StoryFn />
			</div>
		),
	],
};

export const PartialShare: Story = {
	args: {
		open: true,
		assetName: "Commercial Bridge Loan",
		currentShare: 40,
		onOpenChange: noop,
		onSubmit: noop,
	},
};
