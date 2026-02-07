"use client";

import { useAction } from "convex/react";
import {
	AlertCircle,
	ArrowRight,
	Building2,
	Coins,
	Search,
	User,
	Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { MIC_LEDGER_NAME } from "@/lib/mic/numscripts";
import { cn } from "@/lib/utils";

type FormanceAccount = {
	address: string;
	metadata?: Record<string, string>;
	balances?: Record<string, bigint>;
	volumes?: Record<string, { input: bigint; output: bigint }>;
};

type FormanceTransaction = {
	id: string;
	timestamp: string;
	date?: string;
	postings: Array<{
		source: string;
		destination: string;
		amount: bigint;
		asset: string;
	}>;
	reference?: string;
	metadata?: Record<string, string>;
};

type AccountCategory =
	| "mic_core"
	| "investor"
	| "external"
	| "income"
	| "expense";

function categorizeAccount(address: string): AccountCategory {
	if (address.startsWith("mic:") && address.includes(":capital:investor:")) {
		return "investor";
	}
	if (address.startsWith("mic:") && address.includes(":income:")) {
		return "income";
	}
	if (address.startsWith("mic:") && address.includes(":expense:")) {
		return "expense";
	}
	if (address.startsWith("mic:")) {
		return "mic_core";
	}
	return "external";
}

function getAccountIcon(category: AccountCategory) {
	switch (category) {
		case "mic_core":
			return Building2;
		case "investor":
			return User;
		case "income":
			return Coins;
		case "expense":
			return Wallet;
		default:
			return AlertCircle;
	}
}

function getAccountColor(category: AccountCategory) {
	switch (category) {
		case "mic_core":
			return "text-blue-500 bg-blue-500/10";
		case "investor":
			return "text-emerald-500 bg-emerald-500/10";
		case "income":
			return "text-indigo-500 bg-indigo-500/10";
		case "expense":
			return "text-amber-500 bg-amber-500/10";
		default:
			return "text-slate-500 bg-slate-500/10";
	}
}

function formatBalance(account: FormanceAccount): string {
	if (account.volumes) {
		const entries = Object.entries(account.volumes);
		if (entries.length === 0) return "0";

		return entries
			.map(([asset, vol]) => {
				const balance = Number(vol.input) - Number(vol.output);
				if (asset.includes("/2")) {
					return `${(balance / 100).toLocaleString()} ${asset.split("/")[0]}`;
				}
				return `${balance.toLocaleString()} ${asset.split("/")[0]}`;
			})
			.join(", ");
	}

	if (account.balances) {
		const entries = Object.entries(account.balances);
		if (entries.length === 0) return "0";

		return entries
			.map(([asset, amount]) => {
				const numAmount = Number(amount);
				if (asset.includes("/2")) {
					return `${(numAmount / 100).toLocaleString()} ${asset.split("/")[0]}`;
				}
				return `${numAmount.toLocaleString()} ${asset.split("/")[0]}`;
			})
			.join(", ");
	}

	return "0";
}

export default function LedgerViewPage() {
	const [accounts, setAccounts] = useState<FormanceAccount[]>([]);
	const [transactions, setTransactions] = useState<FormanceTransaction[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");

	const listAccounts = useAction(api.ledger.listAccounts);
	const listTransactions = useAction(api.ledger.listTransactions);

	useEffect(() => {
		async function fetchData() {
			setIsLoading(true);
			try {
				const [accountsResult, txResult] = await Promise.all([
					listAccounts({
						ledgerName: MIC_LEDGER_NAME,
						pageSize: 100,
						expand: "volumes", // Include balances in response
					}),
					listTransactions({ ledgerName: MIC_LEDGER_NAME, pageSize: 50 }),
				]);

				// Type cast SDK response - actual structure from Formance SDK
				type AccountsResponse = {
					v2AccountsCursorResponse?: {
						cursor?: { data?: FormanceAccount[] };
					};
				};
				type TransactionsResponse = {
					v2TransactionsCursorResponse?: {
						cursor?: { data?: FormanceTransaction[] };
					};
				};

				const accountsData = ("data" in accountsResult
					? accountsResult.data
					: undefined) as AccountsResponse | undefined;
				const txData = ("data" in txResult
					? txResult.data
					: undefined) as TransactionsResponse | undefined;

				if (
					accountsResult.success &&
					accountsData?.v2AccountsCursorResponse?.cursor?.data
				) {
					setAccounts(accountsData.v2AccountsCursorResponse.cursor.data);
				} else if (!accountsResult.success) {
					const errorMessage =
						"error" in accountsResult
							? accountsResult.error
							: "Unknown error";
					toast.error(`Failed to load accounts: ${errorMessage}`);
				}

				if (
					txResult.success &&
					txData?.v2TransactionsCursorResponse?.cursor?.data
				) {
					setTransactions(txData.v2TransactionsCursorResponse.cursor.data);
				}
			} catch (error) {
				toast.error("Failed to connect to Formance ledger");
				console.error(error);
			} finally {
				setIsLoading(false);
			}
		}

		fetchData();
	}, [listAccounts, listTransactions]);

	const filteredAccounts = accounts.filter((acc) =>
		acc.address.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const investorAccounts = filteredAccounts.filter(
		(acc) => categorizeAccount(acc.address) === "investor"
	);
	const systemAccounts = filteredAccounts.filter(
		(acc) => categorizeAccount(acc.address) !== "investor"
	);

	if (isLoading) {
		return (
			<div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
				<Skeleton className="h-10 w-48" />
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
					<Skeleton className="h-[400px]" />
					<Skeleton className="h-[400px]" />
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-bold text-3xl tracking-tight">Ledger View</h2>
					<p className="mt-1 text-muted-foreground">
						Live account states and transaction history from Formance.
					</p>
				</div>
				<div className="relative w-64">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						className="pl-9"
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search accounts..."
						value={searchQuery}
					/>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				{/* System Accounts */}
				<div className="lg:col-span-2">
					<Card className="border-none shadow-sm dark:bg-slate-900/50">
						<CardHeader>
							<CardTitle className="font-bold text-muted-foreground/80 text-sm uppercase tracking-wider">
								System Accounts
							</CardTitle>
							<CardDescription className="text-xs">
								Deterministic MIC accounts for cash, fees, and treasury.
							</CardDescription>
						</CardHeader>
						<CardContent>
							{systemAccounts.length === 0 ? (
								<p className="py-8 text-center text-muted-foreground text-xs">
									No accounts found. Run the Live Demo to initialize the ledger.
								</p>
							) : (
								<div className="space-y-3">
									{systemAccounts.map((account) => {
										const category = categorizeAccount(account.address);
										const Icon = getAccountIcon(category);
										const colorClasses = getAccountColor(category);

										return (
											<div
												className="flex items-center justify-between rounded-xl border border-transparent bg-muted/30 p-4 transition-all hover:border-primary/10 hover:bg-muted/50"
												key={account.address}
											>
												<div className="flex items-center gap-3">
													<div
														className={cn(
															"flex size-10 items-center justify-center rounded-lg",
															colorClasses
														)}
													>
														<Icon className="size-5" />
													</div>
													<div>
														<p className="font-bold font-mono text-foreground text-sm">
															{account.address}
														</p>
														<p className="text-muted-foreground text-xs capitalize">
															{category.replace("_", " ")}
														</p>
													</div>
												</div>
												<span className="font-bold text-foreground text-lg">
													{formatBalance(account)}
												</span>
											</div>
										);
									})}
								</div>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Investor Accounts */}
				<div className="lg:col-span-1">
					<Card className="h-full border-none shadow-sm dark:bg-slate-900/50">
						<CardHeader>
							<CardTitle className="font-bold text-muted-foreground/80 text-sm uppercase tracking-wider">
								Investor Positions
							</CardTitle>
							<CardDescription className="text-xs">
								Non-deterministic investor capital accounts.
							</CardDescription>
						</CardHeader>
						<CardContent>
							{investorAccounts.length === 0 ? (
								<p className="py-8 text-center text-muted-foreground text-xs">
									No investor accounts yet.
								</p>
							) : (
								<div className="max-h-[400px] space-y-3 overflow-y-auto">
									{investorAccounts.map((account) => {
										const investorId = account.address.split(":investor:")[1];
										return (
											<div
												className="flex flex-col gap-2 rounded-xl bg-emerald-500/5 p-4 ring-1 ring-emerald-500/10"
												key={account.address}
											>
												<div className="flex items-center gap-2">
													<User className="size-4 text-emerald-500" />
													<span className="font-bold text-emerald-600 text-xs uppercase tracking-widest">
														{investorId || "Unknown"}
													</span>
												</div>
												<span className="font-bold text-foreground text-xl">
													{formatBalance(account)}
												</span>
											</div>
										);
									})}
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Transaction History */}
			<Card className="border-none shadow-sm dark:bg-slate-900/50">
				<CardHeader>
					<CardTitle className="font-bold text-muted-foreground/80 text-sm uppercase tracking-wider">
						Transaction History
					</CardTitle>
					<CardDescription className="text-xs">
						Recent ledger transactions.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{transactions.length === 0 ? (
						<p className="py-8 text-center text-muted-foreground text-xs">
							No transactions recorded yet.
						</p>
					) : (
						<div className="space-y-4">
							{transactions.slice(0, 10).map((tx) => (
								<div
									className="rounded-xl border border-muted/50 bg-muted/20 p-4"
									key={tx.id}
								>
									<div className="mb-2 flex items-center justify-between">
										<span className="font-bold font-mono text-foreground text-xs">
											TX #{tx.id}
										</span>
										<span className="text-muted-foreground text-xs">
											{(() => {
												const dateStr = tx.timestamp || tx.date;
												if (!dateStr) return "Unknown Date";
												const date = new Date(dateStr);
												return Number.isNaN(date.getTime())
													? dateStr
													: date.toLocaleString();
											})()}
										</span>
									</div>
									<div className="space-y-2">
										{tx.postings?.map((posting, idx) => (
											<div
												className="flex items-center gap-2 text-sm"
												key={`${tx.id}-${posting.source}-${posting.destination}-${idx}`}
											>
												<span className="max-w-[150px] truncate font-mono text-muted-foreground text-xs">
													{posting.source}
												</span>
												<ArrowRight className="size-3 text-muted-foreground" />
												<span className="max-w-[150px] truncate font-mono text-muted-foreground text-xs">
													{posting.destination}
												</span>
												<span className="ml-auto font-bold text-foreground">
													{Number(posting.amount).toLocaleString()}{" "}
													{posting.asset.split("/")[0]}
												</span>
											</div>
										))}
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
