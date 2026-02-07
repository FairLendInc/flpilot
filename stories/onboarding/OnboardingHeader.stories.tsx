import type { Meta, StoryObj } from "@storybook/react";
import { OnboardingHeader } from "@/components/onboarding/shared/OnboardingHeader";

const meta: Meta<typeof OnboardingHeader> = {
	title: "Onboarding/Shared/OnboardingHeader",
	component: OnboardingHeader,
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

export const Default: Story = {
	args: {
		title: "Choose your FairLend onboarding path",
		subtitle:
			"Pick the role that best matches how you plan to use FairLend. You can return any time and resume where you left off.",
		status: "draft",
		lastTouchedAt: new Date().toISOString(),
	},
};
