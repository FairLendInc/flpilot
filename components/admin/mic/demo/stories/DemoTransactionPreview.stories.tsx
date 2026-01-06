import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { DemoTransactionPreview } from "../DemoTransactionPreview";

const meta: Meta<typeof DemoTransactionPreview> = {
	title: "Admin/MIC/Demo/DemoTransactionPreview",
	component: DemoTransactionPreview,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof DemoTransactionPreview>;

export const Subscription: Story = {
	args: {
		description: "Michael Scott subscribes $100,000 for Class A Units.",
		legs: [
			{
				source: "world",
				destination: "MIC:CASH",
				amount: "100,000",
				asset: "USD",
			},
			{
				source: "MIC:UNITS:ISSUED",
				destination: "investor:michael_scott:UNITS",
				amount: "100,000",
				asset: "MICCAP",
			},
		],
		isExecuting: true,
	},
};

export const Distribution: Story = {
	args: {
		description: "Accruing monthly interest from Mortgage Asset #102.",
		legs: [
			{
				source: "mortgage:102:INTEREST",
				destination: "MIC:INTEREST_POOL",
				amount: "1,250.45",
				asset: "USD",
			},
		],
	},
};
