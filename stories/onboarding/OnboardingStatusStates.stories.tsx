import type { Meta, StoryObj } from "@storybook/react";
import {
	PendingAdminState,
	RejectedState,
} from "@/components/onboarding/shared/OnboardingStatusStates";

const meta: Meta<typeof PendingAdminState> = {
	title: "Onboarding/Shared/OnboardingStatusStates",
	component: PendingAdminState,
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

export const Pending: Story = {
	render: () => <PendingAdminState />,
};

export const Rejected: Story = {
	render: () => (
		<RejectedState decision={{ notes: "Please clarify your licensing documentation." }} />
	),
};
