import type { Meta, StoryObj } from "@storybook/react";
import {
	BrokerFlowRouter,
	type BrokerDocument,
} from "@/components/onboarding/flows/broker/BrokerFlow";

const meta: Meta<typeof BrokerFlowRouter> = {
	title: "Onboarding/Flows/BrokerFlowRouter",
	component: BrokerFlowRouter,
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

const documents: BrokerDocument[] = [
	{
		storageId: "doc_1" as BrokerDocument["storageId"],
		label: "License.pdf",
		type: "license",
	},
];

const baseArgs = {
	currentState: "broker.company_info" as const,
	broker: {
		companyInfo: {
			companyName: "Northwind Brokers",
			entityType: "corporation",
			registrationNumber: "REG-99881",
			registeredAddress: {
				street: "123 King St",
				city: "Toronto",
				state: "ON",
				zip: "M5V 2T6",
				country: "Canada",
			},
			businessPhone: "416-555-0100",
			businessEmail: "ops@northwind.example",
		},
		licensing: {
			licenseType: "mortgage_broker",
			licenseNumber: "MB-2231",
			issuer: "FSRA",
			issuedDate: "2024-01-10",
			expiryDate: "2026-01-10",
			jurisdictions: ["Ontario"],
		},
		representatives: [
			{
				firstName: "Jordan",
				lastName: "Lee",
				role: "Senior Broker",
				email: "jordan@northwind.example",
				phone: "416-555-0101",
				hasAuthority: true,
			},
		],
		documents,
		proposedSubdomain: "northwind",
	},
	savingState: null,
	uploading: false,
	documentError: null,
	onBrokerIntroContinue: () => {},
	onBrokerCompanyInfoSubmit: async () => {},
	onBrokerLicensingSubmit: async () => {},
	onBrokerRepresentativesSubmit: async () => {},
	onBrokerDocumentsContinue: () => {},
	onBrokerSubmitReview: async () => {},
	onBrokerDocumentUpload: async () => {},
	onBrokerRemoveDocument: () => {},
};

export const CompanyInfoStep: Story = {
	args: baseArgs,
};

export const ReviewStep: Story = {
	args: {
		...baseArgs,
		currentState: "broker.review",
	},
};
