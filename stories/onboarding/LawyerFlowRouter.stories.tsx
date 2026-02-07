import type { Meta, StoryObj } from "@storybook/react";
import { LawyerFlowRouter } from "@/components/onboarding/flows/lawyer/LawyerFlow";

const meta: Meta<typeof LawyerFlowRouter> = {
	title: "Onboarding/Flows/LawyerFlowRouter",
	component: LawyerFlowRouter,
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

const baseArgs = {
	currentState: "lawyer.profile" as const,
	lawyer: {
		profile: {
			firstName: "Alex",
			middleName: "R.",
			lastName: "Wong",
			lsoNumber: "L12345",
			firmName: "Wong Legal",
			email: "alex@wonglegal.ca",
			phone: "416-555-0102",
			jurisdiction: "ON",
		},
		identityVerification: {
			status: "verified" as const,
			extractedName: { firstName: "Alex", lastName: "Wong" },
		},
		lsoVerification: {
			status: "verified" as const,
			matchedRecord: {
				lsoNumber: "L12345",
				firstName: "Alex",
				lastName: "Wong",
				firmName: "Wong Legal",
				status: "Active",
			},
		},
	},
	savingState: null,
	onIntroContinue: async () => {},
	onProfileSubmit: async () => {},
	onIdentityVerify: async () => {},
	onVerifyContinue: async () => {},
	onLsoVerify: async () => {},
	onLsoContinue: async () => {},
	onSubmitReview: async () => {},
};

export const ProfileStep: Story = {
	args: baseArgs,
};

export const ReviewStep: Story = {
	args: {
		...baseArgs,
		currentState: "lawyer.review",
	},
};
