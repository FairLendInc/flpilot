import type { Meta, StoryObj } from "@storybook/react";
import { Database, Play, Sparkles } from "lucide-react";
import React from "react";
import { DemoPhaseCard } from "../DemoPhaseCard";

const meta: Meta<typeof DemoPhaseCard> = {
	title: "Admin/MIC/Demo/DemoPhaseCard",
	component: DemoPhaseCard,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof DemoPhaseCard>;

export const SetupPhase: Story = {
	args: {
		icon: Sparkles,
		title: "Initialize Ledger State",
		description:
			"Setting up the MIC control accounts and provisioning investor wallets in the Formance Ledger.",
		technicalNote:
			"This phase creates the 'MIC:CASH' and 'MIC:CAPITAL' accounts with an initial zero balance.",
		isWorking: true,
	},
};

export const AccrualPhase: Story = {
	args: {
		icon: Play,
		title: "Perform Interest Accrual",
		description:
			"Calculating interest for each mortgage asset in AUM and accruing it to the fund's ledger.",
		technicalNote:
			"Numscript orchestrates moves from asset accounts to the MIC interest clearing account.",
		isWorking: false,
	},
};
