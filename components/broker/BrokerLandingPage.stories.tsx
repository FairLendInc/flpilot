import type { Meta, StoryObj } from "@storybook/react";
import { BrokerLandingPage } from "./BrokerLandingPage";

const meta: Meta<typeof BrokerLandingPage> = {
	title: "Broker/BrokerLandingPage",
	component: BrokerLandingPage,
	parameters: {
		layout: "fullscreen",
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

import type { Id } from "@/convex/_generated/dataModel";

const mockBroker = {
	_id: "broker123" as Id<"brokers">,
	brandName: "Acme Mortgage Brokers",
	subdomain: "acme",
	branding: {
		primaryColor: "#3B82F6",
		secondaryColor: "#60A5FA",
	},
	contactEmail: "contact@acmebrokers.com",
	contactPhone: "+1 (555) 123-4567",
};

export const Default: Story = {
	args: {
		broker: mockBroker,
		brokerCode: "ACME2024",
	},
};

export const WithoutBrokerCode: Story = {
	args: {
		broker: mockBroker,
	},
};

export const MinimalContact: Story = {
	args: {
		broker: {
			...mockBroker,
			contactEmail: undefined,
			contactPhone: undefined,
		},
		brokerCode: "ACME2024",
	},
};

export const CustomBranding: Story = {
	args: {
		broker: {
			...mockBroker,
			brandName: "Premium Investments",
			branding: {
				primaryColor: "#8B5CF6",
				secondaryColor: "#A78BFA",
			},
		},
		brokerCode: "PREMIUM2024",
	},
};
