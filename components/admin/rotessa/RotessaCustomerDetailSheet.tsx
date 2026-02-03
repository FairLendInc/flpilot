"use client";

import {
	Building2,
	Calendar,
	CreditCard,
	DollarSign,
	Link,
	Loader2,
	Mail,
	Phone,
	RefreshCw,
	Trash2,
	User,
	UserPlus,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

export type RotessaPlatformBorrower = {
	id: string;
	name: string;
	email: string;
	phone?: string | null;
	status?: string | null;
	userId?: string | null;
};

export type RotessaPlatformUser = {
	id: string;
	idpId: string;
	email: string;
	firstName?: string | null;
	lastName?: string | null;
};

export type RotessaWorkOSMembership = {
	organizationId: string;
	organizationName: string;
	organizationExternalId?: string | null;
	roles: Array<{
		slug: string;
		name: string;
	}>;
	primaryRoleSlug?: string | null;
};

export type RotessaBrokerClient = {
	clientBrokerId: string;
	brokerId: string;
	brokerName: string;
	brokerStatus?: string | null;
	workosOrgId?: string | null;
	onboardingStatus?: string | null;
};

export type RotessaPlatformMortgage = {
	id: string;
	propertyAddress: string;
	status: string;
	rotessaScheduleId?: number | null;
};

export type RotessaPlatformInfo = {
	borrower?: RotessaPlatformBorrower;
	user?: RotessaPlatformUser;
	workosMemberships?: RotessaWorkOSMembership[];
	brokerClient?: RotessaBrokerClient;
	mortgages?: RotessaPlatformMortgage[];
};

export type RotessaCustomerDetail = {
	id: number;
	name: string;
	email: string;
	phone?: string | null;
	homePhone?: string | null;
	customerType?: "Personal" | "Business";
	customIdentifier?: string | null;
	active?: boolean;
	createdAt?: string;
	// Bank info (masked)
	institutionNumber?: string;
	transitNumber?: string;
	accountNumber?: string;
	bankAccountType?: "Savings" | "Checking";
	// Schedules and transactions
	transactionSchedules?: Array<{
		id: number;
		amount: number | string;
		frequency: string;
		processDate?: string;
		nextProcessDate?: string;
		installments?: number | null;
		comment?: string | null;
	}>;
	financialTransactions?: Array<{
		id: number;
		amount: number | string;
		processDate: string;
		status: string;
		statusReason?: string;
	}>;
	// Linked borrower info
	linkedBorrowerId?: string;
	linkedBorrowerName?: string;
	linkedUserId?: string; // WorkOS user ID if provisioned
	platform?: RotessaPlatformInfo;
};

type BrokerOption = {
	id: string;
	name: string;
	status?: string | null;
};

type RotessaCustomerDetailSheetProps = {
	customer: RotessaCustomerDetail | null;
	open: boolean;
	onClose: () => void;
	onSyncToConvex: () => Promise<void>;
	onProvisionUser?: () => void;
	onCreateSchedule: () => void;
	onDeleteSchedule?: (scheduleId: number) => Promise<void>;
	onLinkScheduleToMortgage?: (scheduleId: number) => void;
	isSyncing?: boolean;
	brokers?: BrokerOption[];
	isAssigningBroker?: boolean;
	onAssignBroker?: (args: {
		borrowerUserId: string;
		brokerId: string;
		workosOrgId: string;
	}) => Promise<void>;
};

export function RotessaCustomerDetailSheet({
	customer,
	open,
	onClose,
	onSyncToConvex,
	onProvisionUser,
	onCreateSchedule,
	onDeleteSchedule,
	onLinkScheduleToMortgage,
	isSyncing = false,
	brokers = [],
	isAssigningBroker = false,
	onAssignBroker,
}: RotessaCustomerDetailSheetProps) {
	// All hooks must be called before any early returns
	const [selectedBrokerId, setSelectedBrokerId] = useState<string>("");
	const [selectedOrgId, setSelectedOrgId] = useState<string>("");
	const lastInitKeyRef = useRef<string>("");

	// Extract platform data (safe to do before early return)
	const platform = customer?.platform;
	const platformBorrower = platform?.borrower;
	const platformUser = platform?.user;
	const workosMemberships = platform?.workosMemberships ?? [];
	const brokerClient = platform?.brokerClient;
	const platformMortgages = platform?.mortgages ?? [];
	const hasPlatformBorrower = Boolean(platformBorrower);
	const hasWorkosOrgs = workosMemberships.length > 0;

	useEffect(() => {
		if (!customer) return;
		const initKey = [
			customer.id,
			brokerClient?.brokerId ?? "",
			brokerClient?.workosOrgId ?? "",
			workosMemberships.length,
		].join("|");

		if (lastInitKeyRef.current === initKey) {
			return;
		}

		lastInitKeyRef.current = initKey;

		console.log("[RotessaDetail] Init broker selection", {
			customerId: customer.id,
			brokerId: brokerClient?.brokerId ?? null,
			workosOrgId: brokerClient?.workosOrgId ?? null,
			membershipCount: workosMemberships.length,
		});
		if (!selectedBrokerId) {
			setSelectedBrokerId(brokerClient?.brokerId ?? "");
		}

		if (!selectedOrgId) {
			if (brokerClient?.workosOrgId) {
				setSelectedOrgId(brokerClient.workosOrgId);
				return;
			}

			if (workosMemberships.length === 1) {
				setSelectedOrgId(workosMemberships[0]?.organizationId);
			}
		}
	}, [
		customer,
		brokerClient?.brokerId,
		brokerClient?.workosOrgId,
		workosMemberships.length,
		selectedBrokerId,
		selectedOrgId,
		workosMemberships,
	]);

	const canAssignBroker = Boolean(
		onAssignBroker &&
			platformBorrower?.userId &&
			selectedBrokerId &&
			(hasWorkosOrgs ? selectedOrgId : true)
	);

	// Early return after all hooks have been called
	if (!customer) return null;

	console.log("[RotessaDetail] Render", {
		customerId: customer.id,
		hasPlatformBorrower,
		selectedBrokerId,
		selectedOrgId,
		canAssignBroker,
	});

	const formatCurrency = (amount: number | string) => {
		const num = typeof amount === "string" ? Number.parseFloat(amount) : amount;
		return new Intl.NumberFormat("en-CA", {
			style: "currency",
			currency: "CAD",
		}).format(num);
	};

	const formatDate = (dateStr: string) =>
		new Date(dateStr).toLocaleDateString("en-CA", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});

	const getStatusColor = (status: string) => {
		switch (status.toLowerCase()) {
			case "approved":
			case "settled":
				return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
			case "pending":
			case "processing":
				return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
			case "declined":
			case "failed":
			case "nsf":
				return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
			default:
				return "";
		}
	};

	return (
		<Sheet onOpenChange={(isOpen) => !isOpen && onClose()} open={open}>
			<SheetContent className="w-full overflow-y-auto px-2 sm:max-w-xl">
				<SheetHeader>
					<SheetTitle className="flex items-center gap-2">
						{customer.customerType === "Business" ? (
							<Building2 className="h-5 w-5" />
						) : (
							<User className="h-5 w-5" />
						)}
						{customer.name}
					</SheetTitle>
					<SheetDescription>
						Rotessa Customer ID: {customer.id}
					</SheetDescription>
				</SheetHeader>

				<div className="mt-6 space-y-6">
					{/* Customer Info */}
					<div className="space-y-3">
						<h4 className="font-medium text-muted-foreground text-sm">
							Customer Information
						</h4>
						<div className="grid grid-cols-2 gap-3 text-sm">
							<div className="flex items-center gap-2">
								<Mail className="h-4 w-4 text-muted-foreground" />
								<span>{customer.email}</span>
							</div>
							{customer.phone && (
								<div className="flex items-center gap-2">
									<Phone className="h-4 w-4 text-muted-foreground" />
									<span>{customer.phone}</span>
								</div>
							)}
							{customer.customIdentifier && (
								<div className="flex items-center gap-2">
									<span className="text-muted-foreground">Custom ID:</span>
									<span className="font-mono">{customer.customIdentifier}</span>
								</div>
							)}
							<div>
								<Badge variant={customer.active ? "default" : "secondary"}>
									{customer.active ? "Active" : "Inactive"}
								</Badge>
							</div>
						</div>
					</div>

					<Separator />

					{/* Bank Info (masked) */}
					{customer.institutionNumber && (
						<>
							<div className="space-y-3">
								<h4 className="font-medium text-muted-foreground text-sm">
									Bank Account
								</h4>
								<div className="flex items-center gap-2 text-sm">
									<CreditCard className="h-4 w-4 text-muted-foreground" />
									<span className="font-mono">
										{customer.institutionNumber}-{customer.transitNumber}-****
										{customer.accountNumber?.slice(-4)}
									</span>
									<Badge variant="outline">{customer.bankAccountType}</Badge>
								</div>
							</div>
							<Separator />
						</>
					)}

					{/* Linked Borrower */}
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<h4 className="font-medium text-muted-foreground text-sm">
								Platform Integration
							</h4>
							<div className="flex gap-2">
								<Button
									disabled={isSyncing}
									onClick={onSyncToConvex}
									size="sm"
									variant="outline"
								>
									{isSyncing ? (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									) : (
										<RefreshCw className="mr-2 h-4 w-4" />
									)}
									Sync
								</Button>
								{/* Show provision button if handler provided and user not already provisioned */}
								{onProvisionUser && !customer.linkedUserId && (
									<Button
										disabled={isSyncing}
										onClick={onProvisionUser}
										size="sm"
										variant="outline"
									>
										<UserPlus className="mr-2 h-4 w-4" />
										Provision User
									</Button>
								)}
							</div>
						</div>
						{hasPlatformBorrower ? (
							<div className="space-y-4 rounded-lg border bg-muted/30 p-4">
								<div className="grid gap-3 sm:grid-cols-2">
									<div>
										<p className="text-muted-foreground text-xs uppercase tracking-widest">
											Borrower
										</p>
										<p className="font-medium text-sm">
											{platformBorrower?.name}
										</p>
										<p className="text-muted-foreground text-xs">
											{platformBorrower?.email}
										</p>
										{platformBorrower?.phone && (
											<p className="text-muted-foreground text-xs">
												{platformBorrower.phone}
											</p>
										)}
									</div>
									<div className="space-y-1 text-muted-foreground text-xs">
										<div className="flex items-center gap-2">
											<Badge variant="secondary">Status</Badge>
											<span className="text-sm">
												{platformBorrower?.status ?? "unknown"}
											</span>
										</div>
										<div className="font-mono">
											Borrower ID: {platformBorrower?.id}
										</div>
										<div className="font-mono">
											User ID: {platformBorrower?.userId ?? "—"}
										</div>
										{platformUser && (
											<div className="font-mono">
												WorkOS User: {platformUser.email}
											</div>
										)}
									</div>
								</div>

								<div className="space-y-2">
									<div className="font-semibold text-muted-foreground text-xs uppercase tracking-widest">
										WorkOS Organizations
									</div>
									{workosMemberships.length === 0 ? (
										<p className="text-muted-foreground text-sm">
											No WorkOS memberships found
										</p>
									) : (
										<div className="space-y-2">
											{workosMemberships.map((membership) => (
												<div
													className="rounded-md border bg-background p-3"
													key={membership.organizationId}
												>
													<div className="flex items-center justify-between gap-2">
														<div className="font-medium text-sm">
															{membership.organizationName ||
																membership.organizationId}
														</div>
														{membership.organizationExternalId && (
															<span className="text-muted-foreground text-xs">
																{membership.organizationExternalId}
															</span>
														)}
													</div>
													<div className="mt-2 flex flex-wrap gap-2">
														{(membership.roles.length > 0
															? membership.roles
															: [
																	{
																		slug:
																			membership.primaryRoleSlug ?? "member",
																		name:
																			membership.primaryRoleSlug ?? "member",
																	},
																]
														).map((role) => (
															<Badge
																className="capitalize"
																key={`${membership.organizationId}-${role.slug}`}
																variant="secondary"
															>
																{role.name}
															</Badge>
														))}
													</div>
												</div>
											))}
										</div>
									)}
								</div>

								<div className="space-y-2">
									<div className="font-semibold text-muted-foreground text-xs uppercase tracking-widest">
										Broker Link
									</div>
									<div className="flex items-center justify-between">
										<p className="font-medium text-sm">
											{brokerClient?.brokerName ?? "Not linked"}
										</p>
										<Badge variant={brokerClient ? "default" : "secondary"}>
											{brokerClient ? "Linked" : "Not linked"}
										</Badge>
									</div>
									{brokerClient?.onboardingStatus && (
										<p className="text-muted-foreground text-xs">
											Status: {brokerClient.onboardingStatus}
										</p>
									)}
								</div>

								<div className="space-y-2">
									<div className="font-semibold text-muted-foreground text-xs uppercase tracking-widest">
										Linked Mortgages
									</div>
									{platformMortgages.length === 0 ? (
										<p className="text-muted-foreground text-sm">
											No mortgages linked yet
										</p>
									) : (
										<div className="space-y-2">
											{platformMortgages.map((mortgage) => (
												<div
													className="flex items-center justify-between rounded-md border bg-background p-3"
													key={mortgage.id}
												>
													<div>
														<p className="font-medium text-sm">
															{mortgage.propertyAddress}
														</p>
														{mortgage.rotessaScheduleId && (
															<p className="text-muted-foreground text-xs">
																Schedule: {mortgage.rotessaScheduleId}
															</p>
														)}
													</div>
													<Badge variant="outline">{mortgage.status}</Badge>
												</div>
											))}
										</div>
									)}
								</div>

								{onAssignBroker && (
									<div className="space-y-3 rounded-md border bg-background p-3">
										<div className="font-semibold text-muted-foreground text-xs uppercase tracking-widest">
											Assign Broker
										</div>
										<div className="grid gap-3 sm:grid-cols-2">
											<div className="space-y-2">
												<div className="text-muted-foreground text-xs">
													Broker
												</div>
												<Select
													onValueChange={(value) => {
														console.log(
															"[RotessaDetail] Broker select change",
															{
																customerId: customer.id,
																value,
															}
														);
														setSelectedBrokerId(value);
													}}
													value={selectedBrokerId}
												>
													<SelectTrigger>
														<SelectValue placeholder="Select broker" />
													</SelectTrigger>
													<SelectContent portalled={false}>
														{brokers.map((broker) => (
															<SelectItem key={broker.id} value={broker.id}>
																{broker.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
											<div className="space-y-2">
												<div className="text-muted-foreground text-xs">
													WorkOS Organization
												</div>
												{hasWorkosOrgs ? (
													<Select
														onValueChange={(value) => {
															console.log("[RotessaDetail] Org select change", {
																customerId: customer.id,
																value,
															});
															setSelectedOrgId(value);
														}}
														value={selectedOrgId}
													>
														<SelectTrigger>
															<SelectValue placeholder="Select org" />
														</SelectTrigger>
														<SelectContent portalled={false}>
															{workosMemberships.map((membership) => (
																<SelectItem
																	key={membership.organizationId}
																	value={membership.organizationId}
																>
																	{membership.organizationName ||
																		membership.organizationId}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												) : (
													<div className="rounded-md border bg-muted/40 px-3 py-2 text-muted-foreground text-xs">
														No WorkOS orgs found. Assignment will use an empty
														org ID.
													</div>
												)}
											</div>
										</div>
										<Button
											disabled={!canAssignBroker || isAssigningBroker}
											onClick={() => {
												console.log("[RotessaDetail] Assign click", {
													customerId: customer.id,
													borrowerUserId: platformBorrower?.userId ?? null,
													selectedBrokerId,
													selectedOrgId,
													hasWorkosOrgs,
													canAssignBroker,
												});
												if (
													!(platformBorrower?.userId && selectedBrokerId) ||
													(hasWorkosOrgs && !selectedOrgId) ||
													!onAssignBroker
												) {
													return;
												}
												onAssignBroker({
													borrowerUserId: platformBorrower.userId,
													brokerId: selectedBrokerId,
													workosOrgId: hasWorkosOrgs ? selectedOrgId : "",
												}).catch((error) => {
													console.error("Failed to assign broker:", error);
												});
											}}
											size="sm"
											variant="outline"
										>
											{isAssigningBroker ? (
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											) : (
												<Link className="mr-2 h-4 w-4" />
											)}
											{brokerClient ? "Reassign Broker" : "Assign Broker"}
										</Button>
										{!platformBorrower?.userId && (
											<p className="text-muted-foreground text-xs">
												No borrower user account available yet.
											</p>
										)}
									</div>
								)}
							</div>
						) : customer.linkedBorrowerId ? (
							<div className="space-y-2">
								<div className="flex items-center gap-2 rounded-md bg-emerald-50 p-3 text-sm dark:bg-emerald-900/20">
									<Link className="h-4 w-4 text-emerald-600" />
									<span>
										Linked to borrower:{" "}
										<span className="font-medium">
											{customer.linkedBorrowerName}
										</span>
									</span>
								</div>
								<div className="rounded-md bg-amber-50 p-3 text-amber-700 text-sm dark:bg-amber-900/20 dark:text-amber-400">
									No user account - click &quot;Provision User&quot; to enable
									portal access
								</div>
							</div>
						) : (
							<div className="rounded-md bg-muted p-3 text-muted-foreground text-sm">
								Not linked to a platform borrower yet. Click &quot;Provision
								User&quot; to create both borrower and user account.
							</div>
						)}
					</div>

					<Separator />

					{/* Transaction Schedules */}
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<h4 className="font-medium text-muted-foreground text-sm">
								Transaction Schedules
							</h4>
							<Button onClick={onCreateSchedule} size="sm" variant="outline">
								<Calendar className="mr-2 h-4 w-4" />
								Add Schedule
							</Button>
						</div>

						{customer.transactionSchedules?.length ? (
							<div className="rounded-md border">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Amount</TableHead>
											<TableHead>Frequency</TableHead>
											<TableHead>Next Date</TableHead>
											<TableHead className="text-right">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{customer.transactionSchedules.map((schedule) => (
											<TableRow key={schedule.id}>
												<TableCell className="font-medium">
													{formatCurrency(schedule.amount)}
												</TableCell>
												<TableCell>{schedule.frequency}</TableCell>
												<TableCell>
													{schedule.nextProcessDate
														? formatDate(schedule.nextProcessDate)
														: schedule.processDate
															? formatDate(schedule.processDate)
															: "-"}
												</TableCell>
												<TableCell className="text-right">
													<div className="flex justify-end gap-1">
														{onLinkScheduleToMortgage && (
															<Button
																onClick={() =>
																	onLinkScheduleToMortgage(schedule.id)
																}
																size="icon"
																title="Link to Mortgage"
																variant="ghost"
															>
																<Link className="h-4 w-4" />
															</Button>
														)}
														{onDeleteSchedule && (
															<Button
																onClick={() => onDeleteSchedule(schedule.id)}
																size="icon"
																title="Delete Schedule"
																variant="ghost"
															>
																<Trash2 className="h-4 w-4" />
															</Button>
														)}
													</div>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						) : (
							<div className="rounded-md bg-muted p-4 text-center text-muted-foreground text-sm">
								No transaction schedules
							</div>
						)}
					</div>

					<Separator />

					{/* Recent Transactions */}
					<div className="space-y-3">
						<h4 className="font-medium text-muted-foreground text-sm">
							Recent Transactions
						</h4>

						{customer.financialTransactions?.length ? (
							<div className="space-y-2">
								{[...customer.financialTransactions]
									.sort(
										(a, b) =>
											new Date(b.processDate).getTime() -
											new Date(a.processDate).getTime()
									)
									.slice(0, 10)
									.map((tx) => (
										<div
											className="flex items-center justify-between rounded-md border p-3"
											key={tx.id}
										>
											<div className="flex items-center gap-3">
												<DollarSign className="h-4 w-4 text-muted-foreground" />
												<div>
													<p className="font-medium">
														{formatCurrency(tx.amount)}
													</p>
													<p className="text-muted-foreground text-xs">
														{formatDate(tx.processDate)}
													</p>
												</div>
											</div>
											<Badge className={getStatusColor(tx.status)}>
												{tx.status}
											</Badge>
										</div>
									))}
							</div>
						) : (
							<div className="rounded-md bg-muted p-4 text-center text-muted-foreground text-sm">
								No transactions yet
							</div>
						)}
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
