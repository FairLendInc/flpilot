import type { Meta, StoryObj } from "@storybook/react";
import { Activity, PlayCircle, ShieldCheck, Sparkles } from "lucide-react";
import React from "react";
import { MICLiveDemoModal } from "../MICLiveDemoModal";

type DemoPhase = "setup" | "accrual" | "dividend" | "verification";

const meta: Meta<typeof MICLiveDemoModal> = {
	title: "Admin/MIC/Demo/MICLiveDemoModal",
	component: MICLiveDemoModal,
	parameters: {
		layout: "fullscreen",
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof MICLiveDemoModal>;

const mockPhaseConfig = {
	setup: {
		title: "Initialize Ledger State",
		description:
			"Setting up the MIC control accounts and provisioning investor wallets in the Formance Ledger.",
		technicalNote:
			"Creates 'MIC:CASH' and 'MIC:CAPITAL' accounts with zero initial balances.",
		icon: Sparkles,
	},
	accrual: {
		title: "Perform Interest Accrual",
		description:
			"Calculating interest for each mortgage asset and accruing it to the fund's ledger.",
		technicalNote:
			"Numscript orchestrates moves from asset accounts to the MIC interest clearing account.",
		icon: PlayCircle,
	},
	dividend: {
		title: "Execute Distribution",
		description:
			"Calculating pro-rata shares for all investors and disbursing interest to individual wallets.",
		technicalNote:
			"Ensures total disbursements exactly match the interest pool balance.",
		icon: Activity,
	},
	verification: {
		title: "Verify Ledger Parity",
		description:
			"Performing final audit checks to ensure balances match external state expectations.",
		technicalNote:
			"Runs invariant checks across all investor positions and fund aggregates.",
		icon: ShieldCheck,
	},
};

const mockAccounts = [
	{
		id: "MIC:CASH",
		label: "MIC Cash Holdings",
		balance: "1,250,000",
		asset: "USD",
		type: "internal" as const,
	},
	{
		id: "MIC:INTEREST",
		label: "Interest Clearing",
		balance: "2,450.50",
		asset: "USD",
		type: "internal" as const,
	},
	{
		id: "inv:scott:CASH",
		label: "M. Scott Wallet",
		balance: "10,240.00",
		asset: "USD",
		type: "investor" as const,
	},
];

const mockTransaction = {
	description: "Subscription of $100,000 from Michael Scott",
	legs: [
		{
			source: "world",
			destination: "MIC:CASH",
			amount: "100,000",
			asset: "USD",
		},
		{
			source: "MIC:CAPITAL",
			destination: "inv:scott:UNIT",
			amount: "100,000",
			asset: "MICCAP",
		},
	],
};

export const StepByStep: Story = {
	render: (args) => {
		const [phase, setPhase] = React.useState<DemoPhase>("setup");
		const [isExecuting, setIsExecuting] = React.useState(false);
		const [isFinished, setIsFinished] = React.useState(false);

		const handleNext = () => {
			if (isFinished) {
				// Move to next phase
				const phases: DemoPhase[] = [
					"setup",
					"accrual",
					"dividend",
					"verification",
				];
				const nextIndex = (phases.indexOf(phase) + 1) % phases.length;
				setPhase(phases[nextIndex]);
				setIsFinished(false);
			} else {
				setIsExecuting(true);
				setTimeout(() => {
					setIsExecuting(false);
					setIsFinished(true);
				}, 1500);
			}
		};

		const handlePrevious = () => {
			const phases: DemoPhase[] = [
				"setup",
				"accrual",
				"dividend",
				"verification",
			];
			const prevIndex =
				(phases.indexOf(phase) - 1 + phases.length) % phases.length;
			setPhase(phases[prevIndex]);
			setIsFinished(false);
		};

		return (
			<MICLiveDemoModal
				{...args}
				currentPhase={phase}
				isExecuting={isExecuting}
				isFinished={isFinished}
				onNext={handleNext}
				onPrevious={handlePrevious}
				open={true}
			/>
		);
	},
	args: {
		phaseConfig: mockPhaseConfig,
		ledgerAccounts: mockAccounts,
		activeTransaction: mockTransaction,
	},
};
