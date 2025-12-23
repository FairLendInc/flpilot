import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Button } from "@/components/ui/button";
import { AUMStateSheet } from "../AUMStateSheet";

const meta: Meta<typeof AUMStateSheet> = {
	title: "Admin/MIC/Sheets/AUMStateSheet",
	component: AUMStateSheet,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof AUMStateSheet>;

export const Default: Story = {
	args: {
		open: true,
		assetName: "First Mortgage Toronto",
		currentState: "active",
		onOpenChange: (isOpen) => {
			if (!isOpen) return;
		},
		onStateChange: (state) => {
			if (!state) return;
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
					Manage State
				</Button>
				<StoryFn />
			</div>
		),
	],
};

export const PendingState: Story = {
	args: {
		open: true,
		assetName: "Commercial Bridge Loan",
		currentState: "pending",
		onOpenChange: (isOpen) => {
			console.log(`Open: ${isOpen}`);
		},
	},
};
