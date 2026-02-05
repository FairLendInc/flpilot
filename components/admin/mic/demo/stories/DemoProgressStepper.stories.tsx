import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { DemoProgressStepper } from "../DemoProgressStepper";

const meta: Meta<typeof DemoProgressStepper> = {
	title: "Admin/MIC/Demo/DemoProgressStepper",
	component: DemoProgressStepper,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof DemoProgressStepper>;

const steps = [
	{ id: "setup" as const, label: "Setup" },
	{ id: "accrual" as const, label: "Accrual" },
	{ id: "dividend" as const, label: "Dividend" },
	{ id: "verification" as const, label: "Verify" },
];

export const Step1: Story = {
	args: {
		steps,
		currentStep: "setup",
		completedSteps: [],
	},
};

export const Step2: Story = {
	args: {
		steps,
		currentStep: "accrual",
		completedSteps: ["setup"],
	},
};

export const Completed: Story = {
	args: {
		steps,
		currentStep: "verification",
		completedSteps: ["setup", "accrual", "dividend", "verification"],
	},
};
