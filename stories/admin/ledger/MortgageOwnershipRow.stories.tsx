import type { Meta, StoryObj } from "@storybook/react";
import { Home, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { OwnershipCapTable } from "@/components/admin/ledger/OwnershipCapTable";

type OwnershipEntry = {
	ownerId: string;
	percentage: number;
	label?: string;
};

type MortgageOwnershipRowDisplayProps = {
	mortgageId: string;
	address: string;
	loanAmount: number;
	ownership: OwnershipEntry[] | null;
	showMintButton?: boolean;
	className?: string;
};

/**
 * Presentational version of MortgageOwnershipRow for Storybook
 * without the dialog dependencies
 */
function MortgageOwnershipRowDisplay({
	mortgageId,
	address,
	loanAmount,
	ownership,
	showMintButton = true,
	className,
}: MortgageOwnershipRowDisplayProps) {
	const isMinted = ownership !== null && ownership.length > 0;

	return (
		<Card className={cn("overflow-hidden", className)}>
			<CardContent className="p-4">
				<div className="flex flex-col gap-4">
					<div className="flex items-start justify-between">
						<div className="flex items-start gap-3">
							<div className="rounded-lg bg-purple-500/10 p-2 text-purple-500">
								<Home className="size-4" />
							</div>
							<div className="flex flex-col gap-0.5">
								<span className="font-medium text-foreground text-sm">
									{address}
								</span>
								<span className="font-mono text-[10px] text-muted-foreground">
									{mortgageId}
								</span>
							</div>
						</div>

						<div className="flex items-center gap-3">
							<span className="font-mono font-bold text-foreground text-sm">
								${loanAmount.toLocaleString()}
							</span>
							{isMinted ? (
								<Badge className="bg-green-500/10 text-green-500" variant="outline">
									Minted
								</Badge>
							) : (
								<Badge className="bg-amber-500/10 text-amber-500" variant="outline">
									Not Minted
								</Badge>
							)}
						</div>
					</div>

					{isMinted ? (
						<div className="rounded-lg bg-muted/30 p-3">
							<OwnershipCapTable ownership={ownership} />
						</div>
					) : (
						<div className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
							<span className="text-muted-foreground text-sm">
								This mortgage has not been minted in the ledger yet.
							</span>
							{showMintButton && (
								<Button
									className="gap-2"
									onClick={() => console.log("Mint clicked for", mortgageId)}
									size="sm"
									variant="outline"
								>
									<Sparkles className="size-4" />
									Mint Ownership
								</Button>
							)}
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

const meta: Meta<typeof MortgageOwnershipRowDisplay> = {
	title: "Admin/Ledger/MortgageOwnershipRow",
	component: MortgageOwnershipRowDisplay,
	parameters: {
		layout: "padded",
		docs: {
			description: {
				component:
					"Displays a mortgage's ownership status in the ledger. Shows whether ownership tokens have been minted and the current cap table distribution. Unminted mortgages show a mint action button.",
			},
		},
	},
	decorators: [
		(Story) => (
			<div className="w-full max-w-2xl">
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof MortgageOwnershipRowDisplay>;

/**
 * Minted with 100% FairLend ownership - the default initial state.
 */
export const MintedFairLend100: Story = {
	args: {
		mortgageId: "mortgage_abc123xyz",
		address: "123 Main Street, Toronto, ON M5V 1K4",
		loanAmount: 500000,
		ownership: [{ ownerId: "fairlend", percentage: 100 }],
	},
};

/**
 * Minted with fractional ownership - shows multiple investors in cap table.
 */
export const MintedFractionalOwnership: Story = {
	args: {
		mortgageId: "mortgage_def456uvw",
		address: "456 Oak Avenue, Vancouver, BC V6B 2W8",
		loanAmount: 750000,
		ownership: [
			{ ownerId: "fairlend", percentage: 40 },
			{ ownerId: "investor_user123", percentage: 35, label: "John Smith" },
			{ ownerId: "investor_user456", percentage: 25, label: "Jane Doe" },
		],
	},
};

/**
 * Not minted - mortgage exists in database but not yet in ledger.
 */
export const NotMinted: Story = {
	args: {
		mortgageId: "mortgage_ghi789rst",
		address: "789 Pine Road, Calgary, AB T2P 1G8",
		loanAmount: 425000,
		ownership: null,
	},
};

/**
 * Minted with many investors - complex cap table visualization.
 */
export const ManyInvestors: Story = {
	args: {
		mortgageId: "mortgage_jkl012mno",
		address: "321 Elm Street, Montreal, QC H3A 1B2",
		loanAmount: 1200000,
		ownership: [
			{ ownerId: "fairlend", percentage: 15 },
			{ ownerId: "investor_1", percentage: 20, label: "Large Investor A" },
			{ ownerId: "investor_2", percentage: 18, label: "Large Investor B" },
			{ ownerId: "investor_3", percentage: 15, label: "Medium Investor" },
			{ ownerId: "investor_4", percentage: 12, label: "Small Investor A" },
			{ ownerId: "investor_5", percentage: 10, label: "Small Investor B" },
			{ ownerId: "investor_6", percentage: 10, label: "Small Investor C" },
		],
	},
};

/**
 * Fully investor-owned - FairLend has sold 100% to investors.
 */
export const FullyInvestorOwned: Story = {
	args: {
		mortgageId: "mortgage_pqr345stu",
		address: "555 Maple Lane, Ottawa, ON K1A 0B1",
		loanAmount: 350000,
		ownership: [
			{ ownerId: "investor_primary", percentage: 60, label: "Primary Investor" },
			{ ownerId: "investor_secondary", percentage: 40, label: "Secondary Investor" },
		],
	},
};

/**
 * High-value mortgage - tests formatting of large loan amounts.
 */
export const HighValueMortgage: Story = {
	args: {
		mortgageId: "mortgage_vwx678yza",
		address: "1 Luxury Drive, West Vancouver, BC V7W 1A1",
		loanAmount: 5500000,
		ownership: [{ ownerId: "fairlend", percentage: 100 }],
	},
};
