import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { DemoControlBar } from "../DemoControlBar";

const meta: Meta<typeof DemoControlBar> = {
	title: "Admin/MIC/Demo/DemoControlBar",
	component: DemoControlBar,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof DemoControlBar>;

export const Default: Story = {
	args: {
		hasPrevious: true,
		hasNext: true,
		onPrevious: () => console.log("Back clicked"),
		onNext: () => console.log("Execute clicked"),
	},
};

export const Executing: Story = {
	args: {
		hasPrevious: true,
		hasNext: true,
		isExecuting: true,
		onPrevious: () => {
			console.log("Prev");
		},
		onNext: () => {
			console.log("Next");
		},
	},
};

export const Finished: Story = {
	args: {
		hasPrevious: true,
		hasNext: true,
		isFinished: true,
		onPrevious: () => {
			console.log("Prev");
		},
		onNext: () => {
			console.log("Next");
		},
	},
};

export const Start: Story = {
	args: {
		hasPrevious: false,
		hasNext: true,
		onPrevious: () => {
			console.log("Prev");
		},
		onNext: () => {
			console.log("Next");
		},
	},
};
