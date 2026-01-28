"use client";

import { useAction } from "convex/react";
import {
	AlertCircle,
	ArrowRightLeft,
	CheckCircle2,
	Database,
	Loader2,
	Play,
	Plus,
	RefreshCw,
	Send,
	Wallet,
} from "lucide-react";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
// Numscript templates - mirroring the server-side definitions
import {
	NUMSCRIPT_TEMPLATES,
	type NumscriptTemplate,
	type NumscriptVariable,
} from "@/lib/formance/numscripts";
import { logger } from "@/lib/logger";

type LedgerInfo = {
	name: string;
	metadata?: Record<string, string>;
};

type Account = {
	address: string;
	metadata?: Record<string, string>;
	volumes?: Record<string, { input: bigint; output: bigint; balance: bigint }>;
};

type Transaction = {
	id: bigint;
	reference?: string;
	metadata?: Record<string, string>;
	postings: Array<{
		source: string;
		destination: string;
		asset: string;
		amount: bigint;
	}>;
	timestamp: string;
};

// Helper to serialize data with BigInt support
function formatData(data: unknown): string {
	return JSON.stringify(
		data,
		(_key, value) => (typeof value === "bigint" ? value.toString() : value),
		2
	);
}

export default function LedgerDemoPage() {
	// State
	const [selectedLedger, setSelectedLedger] = useState<string>("");
	const [ledgers, setLedgers] = useState<LedgerInfo[]>([]);
	const [accounts, setAccounts] = useState<Account[]>([]);
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [newLedgerName, setNewLedgerName] = useState("");
	const [selectedTemplate, setSelectedTemplate] = useState(
		NUMSCRIPT_TEMPLATES[0]
	);
	const [variableValues, setVariableValues] = useState<Record<string, string>>(
		{}
	);
	const [dryRun, setDryRun] = useState(true);
	const [executionResult, setExecutionResult] = useState<{
		success: boolean;
		data?: unknown;
		error?: string;
	} | null>(null);

	// Loading states
	const [isLoadingLedgers, setIsLoadingLedgers] = useState(false);
	const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
	const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
	const [isCreatingLedger, setIsCreatingLedger] = useState(false);
	const [isExecuting, setIsExecuting] = useState(false);
	const [isExecutingSimple, setIsExecutingSimple] = useState(false);

	// Simple Transaction State
	const [simpleTx, setSimpleTx] = useState({
		source: "world",
		destination: "",
		asset: "CAD",
		amount: "100",
		reference: "",
	});

	// Actions
	const listLedgersAction = useAction(api.ledger.listLedgers);
	const createLedgerAction = useAction(api.ledger.createLedger);
	const listAccountsAction = useAction(api.ledger.listAccounts);
	const listTransactionsAction = useAction(api.ledger.listTransactions);
	const executeNumscriptAction = useAction(api.ledger.executeNumscript);
	const createSimpleTransactionAction = useAction(
		api.ledger.createSimpleTransaction
	);

	// Initialize variable values when template changes
	useEffect(() => {
		const initial: Record<string, string> = {};
		for (const v of selectedTemplate.variables) {
			initial[v.name] = v.example || "";
		}
		setVariableValues(initial);
		setExecutionResult(null);
	}, [selectedTemplate]);

	const loadLedgers = useCallback(async () => {
		setIsLoadingLedgers(true);
		try {
			const result = await listLedgersAction({ pageSize: 50 });
			if (result.success && "data" in result && result.data) {
				const ledgerList =
					(
						result.data as {
							v2LedgerListResponse?: { cursor?: { data?: LedgerInfo[] } };
						}
					)?.v2LedgerListResponse?.cursor?.data || [];
				setLedgers(ledgerList);
				if (ledgerList.length > 0 && !selectedLedger) {
					setSelectedLedger(ledgerList[0].name);
				}
			}
		} catch (error) {
			logger.error("Failed to load ledgers", { error });
		} finally {
			setIsLoadingLedgers(false);
		}
	}, [listLedgersAction, selectedLedger]);

	const loadAccounts = useCallback(async () => {
		if (!selectedLedger) return;
		setIsLoadingAccounts(true);
		try {
			const result = await listAccountsAction({
				ledgerName: selectedLedger,
				pageSize: 100,
				expand: "volumes",
			});
			if (result.success && "data" in result && result.data) {
				const accountList =
					(
						result.data as {
							v2AccountsCursorResponse?: { cursor?: { data?: Account[] } };
						}
					)?.v2AccountsCursorResponse?.cursor?.data || [];
				setAccounts(accountList);
			}
		} catch (error) {
			console.error("Failed to load accounts:", error);
		} finally {
			setIsLoadingAccounts(false);
		}
	}, [listAccountsAction, selectedLedger]);

	const loadTransactions = useCallback(async () => {
		if (!selectedLedger) return;
		setIsLoadingTransactions(true);
		try {
			const result = await listTransactionsAction({
				ledgerName: selectedLedger,
				pageSize: 20,
			});
			if (result.success && "data" in result && result.data) {
				const txList =
					(
						result.data as {
							v2TransactionsCursorResponse?: {
								cursor?: { data?: Transaction[] };
							};
						}
					)?.v2TransactionsCursorResponse?.cursor?.data || [];
				setTransactions(txList);
			}
		} catch (error) {
			console.error("Failed to load transactions:", error);
		} finally {
			setIsLoadingTransactions(false);
		}
	}, [listTransactionsAction, selectedLedger]);

	// Load ledgers on mount
	useEffect(() => {
		loadLedgers();
	}, [loadLedgers]);

	// Load accounts and transactions when ledger changes
	useEffect(() => {
		if (selectedLedger) {
			loadAccounts();
			loadTransactions();
		}
	}, [selectedLedger, loadAccounts, loadTransactions]);

	const handleCreateLedger = async () => {
		if (!newLedgerName.trim()) return;
		setIsCreatingLedger(true);
		try {
			const result = await createLedgerAction({
				ledgerName: newLedgerName.trim(),
			});
			if (result.success) {
				setNewLedgerName("");
				await loadLedgers();
				setSelectedLedger(newLedgerName.trim());
			} else {
				const errorMessage = "error" in result ? result.error : "Unknown error";
				console.error(`Failed to create ledger: ${errorMessage}`);
			}
		} catch (error) {
			console.error("Failed to create ledger:", error);
		} finally {
			setIsCreatingLedger(false);
		}
	};

	const handleExecute = async () => {
		if (!selectedLedger) {
			setExecutionResult({ success: false, error: "No ledger selected" });
			return;
		}
		setIsExecuting(true);
		setExecutionResult(null);
		try {
			const result = await executeNumscriptAction({
				ledgerName: selectedLedger,
				script: selectedTemplate.script,
				variables: variableValues,
				dryRun,
			});
			setExecutionResult(result);
			if (result.success && !dryRun) {
				// Refresh accounts and transactions after successful execution
				await loadAccounts();
				await loadTransactions();
			}
		} catch (error) {
			setExecutionResult({
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			});
		} finally {
			setIsExecuting(false);
		}
	};

	const handleSimpleTransaction = async () => {
		if (!selectedLedger) {
			toast.error("No ledger selected");
			return;
		}
		if (!simpleTx.destination) {
			toast.error("Destination account is required");
			return;
		}

		setIsExecutingSimple(true);
		try {
			const result = await createSimpleTransactionAction({
				ledgerName: selectedLedger,
				...simpleTx,
				dryRun,
			});

			if (result.success) {
				toast.success(
					dryRun ? "Transaction validated!" : "Transaction created!"
				);
				if (!dryRun) {
					await loadAccounts();
					await loadTransactions();
				}
			} else {
				const errorMessage =
					"error" in result ? result.error || "Unknown error" : "Unknown error";

				toast.error("Transaction failed", {
					description: errorMessage,
					action: {
						label: "Copy Error",
						onClick: () => {
							navigator.clipboard.writeText(errorMessage);
							toast.success("Error copied to clipboard");
						},
					},
					duration: 10000,
				});
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			toast.error("Action call failed", {
				description: errorMessage,
				action: {
					label: "Copy Error",
					onClick: () => {
						navigator.clipboard.writeText(errorMessage);
						toast.success("Error copied to clipboard");
					},
				},
				duration: 10000,
			});
		} finally {
			setIsExecutingSimple(false);
		}
	};

	const refreshAll = () => {
		loadLedgers();
		if (selectedLedger) {
			loadAccounts();
			loadTransactions();
		}
	};

	return (
		<div className="container mx-auto space-y-6 py-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Ledger Demo</h1>
					<p className="text-muted-foreground">
						Interactive Formance Ledger testing environment
					</p>
				</div>
				<Button onClick={refreshAll} size="sm" variant="outline">
					<RefreshCw className="mr-2 h-4 w-4" />
					Refresh All
				</Button>
			</div>

			{/* Ledger Selector */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2 text-lg">
						<Database className="h-5 w-5" />
						Ledger
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-end gap-4">
						<div className="flex-1">
							<Label htmlFor="ledger-select">Select Ledger</Label>
							<Select onValueChange={setSelectedLedger} value={selectedLedger}>
								<SelectTrigger className="mt-1.5" id="ledger-select">
									<SelectValue
										placeholder={
											isLoadingLedgers ? "Loading..." : "Select a ledger"
										}
									/>
								</SelectTrigger>
								<SelectContent>
									{ledgers.map((l) => (
										<SelectItem key={l.name} value={l.name}>
											{l.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<Separator className="h-10" orientation="vertical" />
						<div className="flex items-end gap-2">
							<div>
								<Label htmlFor="new-ledger">Create New Ledger</Label>
								<Input
									className="mt-1.5 w-48"
									id="new-ledger"
									onChange={(e) => setNewLedgerName(e.target.value)}
									placeholder="ledger-name"
									value={newLedgerName}
								/>
							</div>
							<Button
								disabled={isCreatingLedger || !newLedgerName.trim()}
								onClick={handleCreateLedger}
							>
								{isCreatingLedger ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<Plus className="h-4 w-4" />
								)}
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Main Content */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				{/* Left Panel - Ledger State */}
				<div className="space-y-6">
					{/* Accounts */}
					<Card>
						<CardHeader className="pb-3">
							<div className="flex items-center justify-between">
								<CardTitle className="flex items-center gap-2 text-lg">
									<Wallet className="h-5 w-5" />
									Accounts
								</CardTitle>
								<Button
									disabled={isLoadingAccounts}
									onClick={loadAccounts}
									size="sm"
									variant="ghost"
								>
									{isLoadingAccounts ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										<RefreshCw className="h-4 w-4" />
									)}
								</Button>
							</div>
							<CardDescription>
								{accounts.length} accounts in ledger
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ScrollArea className="h-[300px]">
								{accounts.length === 0 ? (
									<div className="py-8 text-center text-muted-foreground">
										No accounts found. Execute a transaction to create accounts.
									</div>
								) : (
									<div className="space-y-3">
										{accounts.map((account) => (
											<div
												className="rounded-lg border bg-card p-3"
												key={account.address}
											>
												<div className="font-medium font-mono text-sm">
													{account.address}
												</div>
												{account.volumes &&
													Object.keys(account.volumes).length > 0 && (
														<div className="mt-2 flex flex-wrap gap-2">
															{Object.entries(account.volumes).map(
																([asset, vol]) => (
																	<Badge key={asset} variant="secondary">
																		{asset}: {vol.balance?.toString() || "0"}
																	</Badge>
																)
															)}
														</div>
													)}
											</div>
										))}
									</div>
								)}
							</ScrollArea>
						</CardContent>
					</Card>

					{/* Transactions */}
					<Card>
						<CardHeader className="pb-3">
							<div className="flex items-center justify-between">
								<CardTitle className="flex items-center gap-2 text-lg">
									<ArrowRightLeft className="h-5 w-5" />
									Recent Transactions
								</CardTitle>
								<Button
									disabled={isLoadingTransactions}
									onClick={loadTransactions}
									size="sm"
									variant="ghost"
								>
									{isLoadingTransactions ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										<RefreshCw className="h-4 w-4" />
									)}
								</Button>
							</div>
							<CardDescription>
								Latest {transactions.length} transactions
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ScrollArea className="h-[300px]">
								{transactions.length === 0 ? (
									<div className="py-8 text-center text-muted-foreground">
										No transactions yet. Execute a numscript to create one.
									</div>
								) : (
									<div className="space-y-3">
										{transactions.map((tx) => (
											<div
												className="rounded-lg border bg-card p-3"
												key={tx.id?.toString()}
											>
												<div className="mb-2 flex items-center justify-between">
													<Badge variant="outline">#{tx.id?.toString()}</Badge>
													{tx.reference && (
														<span className="text-muted-foreground text-xs">
															{tx.reference}
														</span>
													)}
												</div>
												{tx.postings?.map((posting, i) => (
													<div
														className="font-mono text-sm"
														key={`${posting.source}-${posting.destination}-${posting.asset}-${i}`}
													>
														<span className="text-muted-foreground">
															{posting.source}
														</span>
														<span className="mx-2">→</span>
														<span>{posting.destination}</span>
														<Badge className="ml-2" variant="secondary">
															{posting.asset} {posting.amount?.toString()}
														</Badge>
													</div>
												))}
											</div>
										))}
									</div>
								)}
							</ScrollArea>
						</CardContent>
					</Card>
				</div>

				{/* Right Panel - Execute Numscript */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<Play className="h-5 w-5" />
							Execute Numscript
						</CardTitle>
						<CardDescription>
							Run numscript templates against the selected ledger
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{/* Template Selector */}
						<Tabs
							onValueChange={(id) => {
								const template = NUMSCRIPT_TEMPLATES.find(
									(t: NumscriptTemplate) => t.id === id
								);
								if (template) setSelectedTemplate(template);
							}}
							value={selectedTemplate.id}
						>
							<TabsList className="grid grid-cols-2 lg:grid-cols-4">
								{NUMSCRIPT_TEMPLATES.map((t: NumscriptTemplate) => (
									<TabsTrigger className="text-xs" key={t.id} value={t.id}>
										{t.name}
									</TabsTrigger>
								))}
							</TabsList>
						</Tabs>

						<p className="text-muted-foreground text-sm">
							{selectedTemplate.description}
						</p>

						{/* Script Preview */}
						<div>
							<Label>Numscript</Label>
							<Textarea
								className="mt-1.5 h-32 font-mono text-xs"
								readOnly
								value={selectedTemplate.script}
							/>
						</div>

						{/* Variables */}
						<div className="space-y-3">
							<Label>Variables</Label>
							{selectedTemplate.variables.map((v: NumscriptVariable) => (
								<div key={v.name}>
									<div className="mb-1 flex items-center gap-2">
										<Label className="font-mono text-sm" htmlFor={v.name}>
											${v.name}
										</Label>
										<Badge className="text-xs" variant="outline">
											{v.type}
										</Badge>
									</div>
									<Input
										className="font-mono text-sm"
										id={v.name}
										onChange={(e) =>
											setVariableValues((prev) => ({
												...prev,
												[v.name]: e.target.value,
											}))
										}
										placeholder={v.example}
										value={variableValues[v.name] || ""}
									/>
								</div>
							))}
						</div>

						{/* Options */}
						<div className="flex items-center space-x-2">
							<Checkbox
								checked={dryRun}
								id="dry-run"
								onCheckedChange={(checked) => setDryRun(checked === true)}
							/>
							<Label className="text-sm" htmlFor="dry-run">
								Dry Run (validate without committing)
							</Label>
						</div>

						{/* Execute Button */}
						<Button
							className="w-full"
							disabled={isExecuting || !selectedLedger}
							onClick={handleExecute}
							size="lg"
						>
							{isExecuting ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Executing...
								</>
							) : (
								<>
									<Play className="mr-2 h-4 w-4" />
									{dryRun ? "Validate Transaction" : "Execute Transaction"}
								</>
							)}
						</Button>

						{/* Result */}
						{executionResult && (
							<div
								className={`rounded-lg border p-4 ${
									executionResult.success
										? "border-green-500/50 bg-green-500/10"
										: "border-red-500/50 bg-red-500/10"
								}`}
							>
								<div className="mb-2 flex items-center gap-2">
									{executionResult.success ? (
										<>
											<CheckCircle2 className="h-5 w-5 text-green-500" />
											<span className="font-medium text-green-500">
												{dryRun
													? "Validation Successful"
													: "Transaction Executed"}
											</span>
										</>
									) : (
										<>
											<AlertCircle className="h-5 w-5 text-red-500" />
											<span className="font-medium text-red-500">Error</span>
										</>
									)}
								</div>
								{executionResult.error && (
									<pre className="whitespace-pre-wrap text-red-500 text-sm">
										{executionResult.error}
									</pre>
								)}
								{executionResult.success && Boolean(executionResult.data) ? (
									<ScrollArea className="h-[150px]">
										<pre className="font-mono text-xs">
											{formatData(executionResult.data)}
										</pre>
									</ScrollArea>
								) : null}
							</div>
						)}
					</CardContent>
				</Card>

				{/* SDK Integration - Simple Transaction */}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="flex items-center gap-2 text-lg">
								<Send className="h-5 w-5" />
								SDK Integration: Simple Transaction
							</CardTitle>
							<Badge variant="outline">Official SDK</Badge>
						</div>
						<CardDescription>
							Create a standard transaction using the Formance SDK postings API.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="source">Source</Label>
								<Input
									className="font-mono text-sm"
									id="source"
									onChange={(e) =>
										setSimpleTx((prev) => ({ ...prev, source: e.target.value }))
									}
									placeholder="world"
									value={simpleTx.source}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="destination">Destination</Label>
								<Input
									className="font-mono text-sm"
									id="destination"
									onChange={(e) =>
										setSimpleTx((prev) => ({
											...prev,
											destination: e.target.value,
										}))
									}
									placeholder="account:123"
									value={simpleTx.destination}
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="asset">Asset</Label>
								<Input
									className="font-mono text-sm"
									id="asset"
									onChange={(e) =>
										setSimpleTx((prev) => ({ ...prev, asset: e.target.value }))
									}
									placeholder="CAD"
									value={simpleTx.asset}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="amount">Amount (Base Units)</Label>
								<Input
									className="font-mono text-sm"
									id="amount"
									onChange={(e) =>
										setSimpleTx((prev) => ({ ...prev, amount: e.target.value }))
									}
									placeholder="100"
									type="number"
									value={simpleTx.amount}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="reference">Reference (Optional)</Label>
							<Input
								id="reference"
								onChange={(e) =>
									setSimpleTx((prev) => ({
										...prev,
										reference: e.target.value,
									}))
								}
								placeholder="TX-REF-001"
								value={simpleTx.reference}
							/>
						</div>

						<div className="flex items-center space-x-2">
							<Checkbox
								checked={dryRun}
								id="dry-run-sdk"
								onCheckedChange={(checked) => setDryRun(checked === true)}
							/>
							<Label className="text-sm" htmlFor="dry-run-sdk">
								Dry Run (validate without committing)
							</Label>
						</div>

						<Button
							className="w-full"
							disabled={isExecutingSimple || !selectedLedger}
							onClick={handleSimpleTransaction}
							variant="secondary"
						>
							{isExecutingSimple ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Processing...
								</>
							) : (
								<>
									<Send className="mr-2 h-4 w-4" />
									{dryRun ? "Validate With SDK" : "Execute With SDK"}
								</>
							)}
						</Button>

						<p className="text-center text-muted-foreground text-xs italic">
							This uses the Formance SDK direct postings method instead of
							Numscript.
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
