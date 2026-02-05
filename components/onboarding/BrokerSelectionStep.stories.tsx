import type { Meta, StoryObj } from "@storybook/react";
import { BrokerSelectionStep } from "./BrokerSelectionStep";

const meta: Meta<typeof BrokerSelectionStep> = {
	title: "Onboarding/BrokerSelectionStep",
	component: BrokerSelectionStep,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		busy: false,
		onContinue: async (brokerCode) => {
			console.log("Continue with broker code:", brokerCode);
		},
	},
};

export const Loading: Story = {
	args: {
		busy: true,
		onContinue: async () => {
			// Loading state - no action needed
		},
	},
};

export const WithValidationError: Story = {
	args: {
		busy: false,
		onContinue: async () => {
			// Validation error state - no action needed
		},
	},
	play: async ({ canvasElement }) => {
		// Simulate entering invalid broker code
		const input = canvasElement.querySelector('input[id="brokerCode"]');
		if (input) {
			input.setAttribute("value", "INVALID");
			input.dispatchEvent(new Event("change", { bubbles: true }));
		}
	},
};
