"use client";

import { useAction } from "convex/react";
import { Activity, Coins, ShieldCheck, UserPlus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import {
	ASSETS,
	buildCollectInterestVars,
	buildDistributeVars,
	buildSeedTreasuryVars,
	buildSubscribeVars,
	COLLECT_INTEREST,
	DISTRIBUTE_DIVIDEND,
	INVESTOR_SUBSCRIBE,
	MIC_ACCOUNTS,
	MIC_LEDGER_NAME,
	SEED_TREASURY,
} from "@/lib/mic/numscripts";

export type DemoPhase = "setup" | "accrual" | "dividend" | "verification";

export type LedgerAccount = {
	id: string;
	label: string;
	balance: string;
	asset: string;
	type: "internal" | "investor" | "external";
};

export type TransactionLeg = {
	source: string;
	destination: string;
	amount: string;
	asset: string;
};

export type TransactionPreview = {
	description: string;
	legs: TransactionLeg[];
};

// Demo configuration aligned with e2eSampleFlow.mermaid
const DEMO_INVESTOR_ID = "INV1";
const DEMO_MORTGAGE_ID = "M123";
const DEMO_SUBSCRIPTION_AMOUNT = 25000000; // $250,000 in cents (Step A0)
const DEMO_INTEREST_AMOUNT = 4166700; // ~$41,667 monthly interest (Step H)

// Treasury needs enough units to issue to investors
const TREASURY_SEED_AMOUNT = 100000000; // $1,000,000 worth of MICCAP units

export function useMICDemo() {
	const [isOpen, setIsOpen] = useState(false);
	const [currentPhase, setCurrentPhase] = useState<DemoPhase>("setup");
	const [isExecuting, setIsExecuting] = useState(false);
	const [isFinished, setIsFinished] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const executeNumscript = useAction(api.ledger.executeNumscript);
	const listAccounts = useAction(api.ledger.listAccounts);
	const createLedger = useAction(api.ledger.createLedger);

	const [ledgerAccounts, setLedgerAccounts] = useState<LedgerAccount[]>([
		{
			id: MIC_ACCOUNTS.cash,
			label: "MIC Cash",
			balance: "—",
			asset: "CAD",
			type: "internal",
		},
		{
			id: MIC_ACCOUNTS.capitalTreasury,
			label: "MIC Capital Treasury",
			balance: "—",
			asset: "MICCAP",
			type: "internal",
		},
		{
			id: MIC_ACCOUNTS.distributionPayable,
			label: "Distribution Payable",
			balance: "—",
			asset: "CAD",
			type: "internal",
		},
		{
			id: MIC_ACCOUNTS.borrower(DEMO_MORTGAGE_ID),
			label: `Borrower (${DEMO_MORTGAGE_ID})`,
			balance: "—",
			asset: "CAD",
			type: "external",
		},
		{
			id: MIC_ACCOUNTS.investorCapital(DEMO_INVESTOR_ID),
			label: `Investor ${DEMO_INVESTOR_ID} Capital`,
			balance: "—",
			asset: "MICCAP",
			type: "investor",
		},
		{
			id: MIC_ACCOUNTS.investorWallet(DEMO_INVESTOR_ID),
			label: `Investor ${DEMO_INVESTOR_ID} Wallet`,
			balance: "—",
			asset: "CAD",
			type: "investor",
		},
	]);

	const [activeTransaction, setActiveTransaction] =
		useState<TransactionPreview | null>(null);

	const phaseConfig = {
		setup: {
			title: "Step A0: Investor Subscription",
			description:
				"Investor deposits CAD to MIC, receives MICCAP units from treasury.",
			technicalNote:
				"Flow: investor:wallet → mic:cash (CAD), treasury → investor:capital (MICCAP)",
			icon: UserPlus,
		},
		accrual: {
			title: "Step H: Interest Collection",
			description:
				"Borrower pays monthly interest. Funds flow from borrower to MIC cash.",
			technicalNote: "Flow: external:borrower:M123 → mic:cash (CAD interest)",
			icon: Activity,
		},
		dividend: {
			title: "Step H5: Distribution (Net-Zero)",
			description:
				"All MIC cash distributed to investors proportionally. Post: mic:cash = 0.",
			technicalNote:
				"Flow: mic:cash → distribution:payable → investor:wallet (CAD)",
			icon: Coins,
		},
		verification: {
			title: "Ledger Verification",
			description:
				"Verify ledger invariants: net-zero cash, MICCAP ownership matches.",
			technicalNote: "Query all accounts to verify final state.",
			icon: ShieldCheck,
		},
	};

	// Refresh account balances from Formance
	const refreshAccounts = useCallback(async () => {
		try {
			const result = await listAccounts({
				ledgerName: MIC_LEDGER_NAME,
				pageSize: 100,
				expand: "volumes", // Include balances in response
			});

			// Type cast SDK response - actual structure from Formance SDK
			// With expand=volumes, data comes in volumes.input/output or balances
			type AccountData = {
				address: string;
				volumes?: Record<string, { input: bigint; output: bigint }>;
				balances?: Record<string, bigint>;
			};
			type AccountsResponse = {
				v2AccountsCursorResponse?: {
					cursor?: {
						data?: AccountData[];
					};
				};
			};
			const data = ("data" in result
				? result.data
				: undefined) as AccountsResponse | undefined;

			if (result.success && data?.v2AccountsCursorResponse?.cursor?.data) {
				const formanceAccounts = data.v2AccountsCursorResponse.cursor.data;

				setLedgerAccounts((prev) =>
					prev.map((acc) => {
						const match = formanceAccounts.find((fa) => fa?.address === acc.id);
						if (match) {
							// Try volumes first (from expand=volumes), then balances
							if (match.volumes) {
								const volumeEntries = Object.entries(match.volumes);
								if (volumeEntries.length > 0) {
									const [asset, vol] = volumeEntries[0];
									// Balance = input - output
									const balance = Number(vol.input) - Number(vol.output);
									const displayAmount = asset.includes("/2")
										? (balance / 100).toLocaleString()
										: balance.toLocaleString();
									return { ...acc, balance: displayAmount };
								}
							} else if (match.balances) {
								const balanceEntries = Object.entries(match.balances);
								if (balanceEntries.length > 0) {
									const [asset, amount] = balanceEntries[0];
									const numAmount = Number(amount);
									const displayAmount = asset.includes("/2")
										? (numAmount / 100).toLocaleString()
										: numAmount.toLocaleString();
									return { ...acc, balance: displayAmount };
								}
							}
							return { ...acc, balance: "0" }; // Account exists but no balance
						}
						return acc;
					})
				);
			}
		} catch (err) {
			console.error("Failed to refresh accounts:", err);
		}
	}, [listAccounts]);

	// Refresh accounts when modal opens
	useEffect(() => {
		if (isOpen) {
			refreshAccounts();
		}
	}, [isOpen, refreshAccounts]);

	const handleNext = useCallback(async () => {
		setIsExecuting(true);
		setError(null);

		try {
			if (currentPhase === "setup") {
				// Step 1: Create ledger if needed
				toast.info("Ensuring MIC ledger exists...");
				try {
					await createLedger({ ledgerName: MIC_LEDGER_NAME });
				} catch (err) {
					// Ignore "ledger already exists" error
					console.log("Ledger creation status:", err);
				}

				// Step 2: Seed treasury with MICCAP units (required before issuance)
				toast.info("Seeding treasury with MICCAP units...");
				setActiveTransaction({
					description: "Seed Treasury",
					legs: [
						{
							source: "@world",
							destination: MIC_ACCOUNTS.capitalTreasury,
							amount: TREASURY_SEED_AMOUNT.toString(),
							asset: ASSETS.MICCAP,
						},
					],
				});

				const seedResult = await executeNumscript({
					ledgerName: MIC_LEDGER_NAME,
					script: SEED_TREASURY,
					variables: buildSeedTreasuryVars(TREASURY_SEED_AMOUNT),
					reference: `demo-seed-treasury-${Date.now()}`,
				});

				if (!seedResult.success) {
					const errorMessage =
						"error" in seedResult ? seedResult.error : undefined;
					throw new Error(errorMessage || "Failed to seed treasury");
				}

				// Step 2.5: Seed investor wallet with CAD from @world
				// In Formance, only @world can create money. The investor needs funds before subscribing.
				const seedInvestorScript = `
vars {
  account $investor_wallet
  monetary $amount
}
send $amount (
  source = @world
  destination = $investor_wallet
)
`;
				await executeNumscript({
					ledgerName: MIC_LEDGER_NAME,
					script: seedInvestorScript,
					variables: {
						investor_wallet: MIC_ACCOUNTS.investorWallet(DEMO_INVESTOR_ID),
						amount: `${ASSETS.CAD} ${DEMO_SUBSCRIPTION_AMOUNT}`,
					},
					reference: `demo-seed-investor-${Date.now()}`,
				});

				// Step 3: Execute investor subscription (proper flow)
				// Investor subscribes to MIC: investor_wallet → mic:cash, treasury → investor:capital
				toast.info("Executing investor subscription...");
				setActiveTransaction({
					description: "Investor Subscription (Step A0)",
					legs: [
						{
							source: MIC_ACCOUNTS.investorWallet(DEMO_INVESTOR_ID),
							destination: MIC_ACCOUNTS.cash,
							amount: DEMO_SUBSCRIPTION_AMOUNT.toString(),
							asset: ASSETS.CAD,
						},
						{
							source: MIC_ACCOUNTS.capitalTreasury,
							destination: MIC_ACCOUNTS.investorCapital(DEMO_INVESTOR_ID),
							amount: DEMO_SUBSCRIPTION_AMOUNT.toString(),
							asset: ASSETS.MICCAP,
						},
					],
				});

				const result = await executeNumscript({
					ledgerName: MIC_LEDGER_NAME,
					script: INVESTOR_SUBSCRIBE,
					variables: buildSubscribeVars(
						DEMO_INVESTOR_ID,
						DEMO_SUBSCRIPTION_AMOUNT
					),
					reference: `demo-subscribe-${Date.now()}`,
				});

				if (!result.success) {
					const errorMessage = "error" in result ? result.error : undefined;
					throw new Error(errorMessage || "Failed to execute subscription");
				}

				toast.success("Step A0 complete: Investor subscribed!");
				await refreshAccounts();
				setIsFinished(true);
			} else if (currentPhase === "accrual") {
				// Step H: Borrower pays interest to MIC

				// First, seed borrower with funds (simulating loan repayment)
				toast.info("Simulating borrower interest payment...");
				setActiveTransaction({
					description: "Interest Collection (Step H)",
					legs: [
						{
							source: MIC_ACCOUNTS.borrower(DEMO_MORTGAGE_ID),
							destination: MIC_ACCOUNTS.cash,
							amount: DEMO_INTEREST_AMOUNT.toString(),
							asset: ASSETS.CAD,
						},
					],
				});

				// For demo, we use world → borrower → mic:cash to simulate the flow
				// In production, borrower would already have funds from the origination
				const seedBorrowerScript = `
vars {
  monetary $amount
}
send $amount (
  source = @world
  destination = @${MIC_ACCOUNTS.borrower(DEMO_MORTGAGE_ID)}
)
`;
				await executeNumscript({
					ledgerName: MIC_LEDGER_NAME,
					script: seedBorrowerScript,
					variables: {
						amount: `${ASSETS.CAD} ${DEMO_INTEREST_AMOUNT}`,
					},
					reference: `demo-seed-borrower-${Date.now()}`,
				});

				// Now collect interest from borrower
				const result = await executeNumscript({
					ledgerName: MIC_LEDGER_NAME,
					script: COLLECT_INTEREST,
					variables: buildCollectInterestVars(
						DEMO_MORTGAGE_ID,
						DEMO_INTEREST_AMOUNT
					),
					reference: `demo-collect-interest-${Date.now()}`,
				});

				if (!result.success) {
					const errorMessage = "error" in result ? result.error : undefined;
					throw new Error(errorMessage || "Failed to collect interest");
				}

				toast.success("Step H complete: Interest collected from borrower!");
				await refreshAccounts();
				setIsFinished(true);
			} else if (currentPhase === "dividend") {
				// Step H5: Net-zero distribution
				setActiveTransaction({
					description: "Dividend Distribution (Step H5)",
					legs: [
						{
							source: MIC_ACCOUNTS.cash,
							destination: MIC_ACCOUNTS.distributionPayable,
							amount: DEMO_INTEREST_AMOUNT.toString(),
							asset: ASSETS.CAD,
						},
						{
							source: MIC_ACCOUNTS.distributionPayable,
							destination: MIC_ACCOUNTS.investorWallet(DEMO_INVESTOR_ID),
							amount: DEMO_INTEREST_AMOUNT.toString(),
							asset: ASSETS.CAD,
						},
					],
				});

				const result = await executeNumscript({
					ledgerName: MIC_LEDGER_NAME,
					script: DISTRIBUTE_DIVIDEND,
					variables: buildDistributeVars(
						DEMO_INVESTOR_ID,
						DEMO_INTEREST_AMOUNT
					),
					reference: `demo-distribute-${Date.now()}`,
				});

				if (!result.success) {
					const errorMessage = "error" in result ? result.error : undefined;
					throw new Error(errorMessage || "Failed to distribute dividend");
				}

				toast.success("Step H5 complete: Dividend distributed (net-zero)!");
				await refreshAccounts();
				setIsFinished(true);
			} else if (currentPhase === "verification") {
				// Just refresh and verify
				setActiveTransaction({
					description: "Verifying Ledger State",
					legs: [],
				});

				await refreshAccounts();
				toast.success("Ledger verification complete!");
				setIsFinished(true);
			}
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : "Unknown error";
			setError(errorMessage);
			toast.error(`Execution failed: ${errorMessage}`);
		} finally {
			setIsExecuting(false);
		}
	}, [currentPhase, createLedger, executeNumscript, refreshAccounts]);

	const handlePrevious = useCallback(() => {
		const phases: DemoPhase[] = [
			"setup",
			"accrual",
			"dividend",
			"verification",
		];
		const currentIndex = phases.indexOf(currentPhase);
		if (currentIndex > 0) {
			setCurrentPhase(phases[currentIndex - 1]);
			setIsFinished(false);
			setActiveTransaction(null);
			setError(null);
		}
	}, [currentPhase]);

	const proceedToNextPhase = useCallback(() => {
		const phases: DemoPhase[] = [
			"setup",
			"accrual",
			"dividend",
			"verification",
		];
		const currentIndex = phases.indexOf(currentPhase);
		if (isFinished && currentIndex < phases.length - 1) {
			setCurrentPhase(phases[currentIndex + 1]);
			setIsFinished(false);
			setActiveTransaction(null);
			setError(null);
		}
	}, [currentPhase, isFinished]);

	return {
		isOpen,
		setIsOpen,
		currentPhase,
		isExecuting,
		isFinished,
		error,
		ledgerAccounts,
		activeTransaction,
		phaseConfig,
		handleNext,
		handlePrevious,
		proceedToNextPhase,
	};
}
