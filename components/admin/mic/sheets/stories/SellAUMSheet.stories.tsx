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

export const Default: Story = {
	args: {
		open: true,
		assetName: "First Mortgage Toronto",
		currentShare: 100,
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
					Sell Share
				</Button>
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
		onOpenChange: (isOpen) => {
			if (!isOpen) return;
		},
		onSubmit: (data) => {
			if (!data) return;
		},
	},
};
