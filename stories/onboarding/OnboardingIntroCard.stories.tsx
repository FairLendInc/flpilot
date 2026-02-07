import type { Meta, StoryObj } from "@storybook/react";
import { OnboardingIntroCard } from "@/components/onboarding/shared/OnboardingIntroCard";

const meta: Meta<typeof OnboardingIntroCard> = {
	title: "Onboarding/Shared/OnboardingIntroCard",
	component: OnboardingIntroCard,
	parameters: {
		layout: "centered",
	},
	decorators: [
		(Story) => (
			<div className="w-full max-w-3xl p-6">
				<Story />
			</div>
		),
	],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		title: "Welcome to FairLend",
		description:
			"We review every applicant to keep marketplace access aligned with pilot requirements.",
		bullets: [
			"Tell us about your investing entity",
			"Share your risk profile and target deal sizes",
			"Confirm compliance expectations",
		],
		ctaLabel: "Begin",
	},
};
