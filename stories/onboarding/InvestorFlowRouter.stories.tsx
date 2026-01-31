import type { Meta, StoryObj } from "@storybook/react";
import {
	InvestorFlowRouter,
	type InvestorDocument,
} from "@/components/onboarding/flows/investor/InvestorFlow";

const meta: Meta<typeof InvestorFlowRouter> = {
	title: "Onboarding/Flows/InvestorFlowRouter",
	component: InvestorFlowRouter,
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

const documents: InvestorDocument[] = [
	{ storageId: "doc_1" as InvestorDocument["storageId"], label: "Accreditation.pdf" },
];

const baseArgs = {
	currentState: "investor.profile" as const,
	investor: {
		profile: {
			firstName: "Avery",
			lastName: "Nguyen",
			entityType: "individual",
		},
		preferences: {
			minTicket: 100000,
			maxTicket: 500000,
			riskProfile: "balanced",
			liquidityHorizonMonths: 18,
			focusRegions: ["ON", "BC"],
		},
		documents,
	},
	savingState: null,
	uploading: false,
	documentError: null,
	onIntroContinue: async () => {},
	onProfileSubmit: async () => {},
	onPreferencesSubmit: async () => {},
	onKycAcknowledge: async () => {},
	onDocumentsContinue: async () => {},
	onSubmitReview: async () => {},
	onUploadDocument: async () => {},
	onRemoveDocument: async () => {},
};

export const ProfileStep: Story = {
	args: baseArgs,
};

export const ReviewStep: Story = {
	args: {
		...baseArgs,
		currentState: "investor.review",
	},
};
