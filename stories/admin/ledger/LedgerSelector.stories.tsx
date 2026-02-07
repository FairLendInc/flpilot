import type { Meta, StoryObj } from "@storybook/react";
import { Database, Loader2 } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

/**
 * Presentational component for Storybook that mirrors LedgerSelector UI
 * without requiring Convex context
 */
function LedgerSelectorDisplay({
	ledgers,
	selectedLedger,
	isLoading,
	error,
	onValueChange,
}: {
	ledgers: Array<{ name: string }>;
	selectedLedger: string;
	isLoading?: boolean;
	error?: string | null;
	onValueChange?: (value: string) => void;
}) {
	if (isLoading) {
		return (
			<div className="flex items-center gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm">
				<Loader2 className="size-4 animate-spin text-muted-foreground" />
				<span className="text-muted-foreground">Loading ledgers...</span>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center gap-2 rounded-md border border-danger/50 bg-danger/10 px-3 py-2 text-sm text-danger">
				<Database className="size-4" />
				<span>Error: {error}</span>
			</div>
		);
	}

	return (
		<Select value={selectedLedger} onValueChange={onValueChange}>
			<SelectTrigger className="w-[200px]" size="sm">
				<Database className="size-4 text-muted-foreground" />
				<SelectValue placeholder="Select ledger" />
			</SelectTrigger>
			<SelectContent>
				{ledgers.map((ledger) => (
					<SelectItem key={ledger.name} value={ledger.name}>
						{ledger.name}
					</SelectItem>
				))}
				{ledgers.length === 0 && (
					<div className="px-2 py-1.5 text-muted-foreground text-sm">
						No ledgers found
					</div>
				)}
			</SelectContent>
		</Select>
	);
}

const meta: Meta<typeof LedgerSelectorDisplay> = {
	title: "Admin/Ledger/LedgerSelector",
	component: LedgerSelectorDisplay,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Dropdown selector for choosing which Formance ledger to view. Displays available ledgers fetched from the API with loading and error states.",
			},
		},
	},
};

export default meta;
type Story = StoryObj<typeof LedgerSelectorDisplay>;

/**
 * Default state showing multiple ledgers with one selected.
 */
export const Default: Story = {
	args: {
		ledgers: [
			{ name: "production" },
			{ name: "staging" },
			{ name: "development" },
		],
		selectedLedger: "production",
		onValueChange: (value) => console.log("Selected:", value),
	},
};

/**
 * Loading state while fetching ledgers from the API.
 */
export const Loading: Story = {
	args: {
		ledgers: [],
		selectedLedger: "",
		isLoading: true,
	},
};

/**
 * Error state when ledger fetch fails.
 */
export const Error: Story = {
	args: {
		ledgers: [],
		selectedLedger: "",
		error: "Failed to connect to Formance API",
	},
};

/**
 * Empty state when no ledgers exist.
 */
export const Empty: Story = {
	args: {
		ledgers: [],
		selectedLedger: "",
	},
};

/**
 * Single ledger scenario - common for simple deployments.
 */
export const SingleLedger: Story = {
	args: {
		ledgers: [{ name: "main" }],
		selectedLedger: "main",
	},
};
