import type { Meta, StoryObj } from "@storybook/react";
import { OnboardingProgress } from "@/components/onboarding/shared/OnboardingProgress";
import { INVESTOR_STEPS } from "@/components/onboarding/flows/investor/InvestorFlow";

const meta: Meta<typeof OnboardingProgress> = {
	title: "Onboarding/Shared/OnboardingProgress",
	component: OnboardingProgress,
	parameters: {
		layout: "centered",
	},
	decorators: [
		(Story) => (
			<div className="w-full max-w-4xl p-6">
				<Story />
			</div>
		),
	],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const InvestorProgress: Story = {
	args: {
		steps: INVESTOR_STEPS,
		currentState: "investor.preferences",
		status: "draft",
	},
};

export const Completed: Story = {
	args: {
		steps: INVESTOR_STEPS,
		currentState: "investor.review",
		status: "awaiting_admin",
	},
};
