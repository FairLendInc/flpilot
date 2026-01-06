import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { LiveDemoTrigger } from "../LiveDemoTrigger";

const meta: Meta<typeof LiveDemoTrigger> = {
	title: "Admin/MIC/Demo/LiveDemoTrigger",
	component: LiveDemoTrigger,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof LiveDemoTrigger>;

export const Default: Story = {
	args: {
		onClick: () => console.log("Demo Triggered!"),
	},
	decorators: [
		(StoryFn) => (
			<div className="flex min-h-[300px] items-center justify-center bg-slate-900 p-12">
				<StoryFn />
			</div>
		),
	],
};
