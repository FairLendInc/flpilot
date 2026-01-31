import type { Meta, StoryObj } from "@storybook/react";
import { PersonaSelector } from "@/components/onboarding/shared/PersonaSelector";

const meta: Meta<typeof PersonaSelector> = {
	title: "Onboarding/Shared/PersonaSelector",
	component: PersonaSelector,
	parameters: {
		layout: "centered",
	},
	decorators: [
		(Story) => (
			<div className="w-full max-w-5xl p-6">
				<Story />
			</div>
		),
	],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		options: [
			{
				id: "investor",
				title: "Investor",
				description:
					"Access curated mortgage opportunities once your profile is approved.",
			},
			{
				id: "broker",
				title: "Broker",
				description: "Submit deals and manage your clients' portfolios.",
			},
			{
				id: "lawyer",
				title: "Lawyer",
				description:
					"Complete legal onboarding to review closings and holdbacks.",
			},
		],
		pending: null,
		onSelect: async () => {},
	},
};
