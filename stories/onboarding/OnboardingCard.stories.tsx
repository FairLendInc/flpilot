import type { Meta, StoryObj } from "@storybook/react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OnboardingCard } from "@/components/onboarding/shared/OnboardingCard";

const meta: Meta<typeof OnboardingCard> = {
	title: "Onboarding/Shared/OnboardingCard",
	component: OnboardingCard,
	parameters: {
		layout: "centered",
	},
	decorators: [
		(Story) => (
			<div className="w-full max-w-2xl p-6">
				<Story />
			</div>
		),
	],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<OnboardingCard>
			<CardHeader>
				<CardTitle>Onboarding card</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2 text-muted-foreground text-sm">
				<p>
					Use this container to wrap onboarding steps with a glassmorphism
					aesthetic and soft depth.
				</p>
				<p>It supports headers, body content, and actions.</p>
			</CardContent>
		</OnboardingCard>
	),
};
