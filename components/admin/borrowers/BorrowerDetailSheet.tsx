"use client";

import { formatDistanceToNow } from "date-fns";
import {
	AlertTriangle,
	CheckCircle2,
	ClipboardCopy,
	CreditCard,
	Edit,
	ExternalLink,
	Home,
	MapPin,
	RefreshCw,
	User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import {
	type BorrowerStatus,
	BorrowerStatusBadge,
} from "./BorrowerStatusBadge";
import { type RotessaStatus, RotessaStatusIcon } from "./RotessaStatusIcon";

// Types
type Address = {
	street: string;
	city: string;
	province: string;
	postalCode: string;
	country: string;
};

type Mortgage = {
	id: Id<"mortgages">;
	propertyAddress: string;
	principal: number;
	interestRate: number;
	monthlyPayment: number;
	status: "active" | "completed" | "default";
	termMonths: number;
	remainingMonths: number;
	rotessaScheduleId?: string;
};

type Payment = {
	id: string;
	date: string;
	amount: number;
	status: "cleared" | "pending" | "failed";
	propertyAddress: string;
	ledgerTransactionId?: string;
};

type ActivityItem = {
	id: string;
	timestamp: string;
	type: string;
	description: string;
	details?: string;
};

type BorrowerDetail = {
	id: Id<"borrowers">;
	name: string;
	email: string;
	phone?: string;
	status: BorrowerStatus;
	address?: Address;
	rotessaCustomerId?: string;
	rotessaStatus: RotessaStatus;
	rotessaLastSyncAt?: number;
	userId?: Id<"users">;
	idVerificationStatus?: string;
	kycAmlStatus?: string;
	createdAt?: string;
	updatedAt?: string;
};

type BorrowerDetailSheetProps = {
	open: boolean;
	onClose: () => void;
	borrower: BorrowerDetail | null;
	mortgages?: Mortgage[];
	recentPayments?: Payment[];
	activity?: ActivityItem[];
	onEdit?: () => void;
	onSyncRotessa?: () => void;
	onSuspend?: () => void;
};

function CopyButton({ value, label }: { value: string; label: string }) {
	const handleCopy = async () => {
		await navigator.clipboard.writeText(value);
		toast.success(`${label} copied to clipboard`);
	};

	return (
		<Button
			className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
			onClick={handleCopy}
			size="sm"
			variant="ghost"
		>
			<ClipboardCopy className="h-3 w-3" />
		</Button>
	);
}

function DataRow({
	label,
	value,
	copyable,
	mono,
}: {
	label: string;
	value: string | undefined;
	copyable?: boolean;
	mono?: boolean;
}) {
	if (!value) return null;

	return (
		<div className="flex items-center justify-between py-2">
			<span className="text-muted-foreground text-sm">{label}</span>
			<div className="flex items-center gap-2">
				<span className={cn("text-sm", mono && "font-mono text-xs")}>
					{value}
				</span>
				{copyable && <CopyButton label={label} value={value} />}
			</div>
		</div>
	);
}

function getInitials(name: string): string {
	return name
		.split(" ")
		.map((n) => n.charAt(0))
		.slice(0, 2)
		.join("")
		.toUpperCase();
}

function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("en-CA", {
		style: "currency",
		currency: "CAD",
	}).format(amount);
}

export function BorrowerDetailSheet({
	open,
	onClose,
	borrower,
	mortgages = [],
	recentPayments = [],
	activity = [],
	onEdit,
	onSyncRotessa,
	onSuspend,
}: BorrowerDetailSheetProps) {
	const [activeTab, setActiveTab] = useState<
		"profile" | "mortgages" | "payments" | "activity"
	>("profile");

	if (!borrower) return null;

	// Payment summary
	const totalPaid = recentPayments
		.filter((p) => p.status === "cleared")
		.reduce((sum, p) => sum + p.amount, 0);
	const totalPending = recentPayments
		.filter((p) => p.status === "pending")
		.reduce((sum, p) => sum + p.amount, 0);
	const totalFailed = recentPayments
		.filter((p) => p.status === "failed")
		.reduce((sum, p) => sum + p.amount, 0);

	return (
		<Sheet onOpenChange={(o) => !o && onClose()} open={open}>
			<SheetContent className="w-full overflow-y-auto border-none px-4 backdrop-blur-xl sm:max-w-[600px] dark:bg-slate-900/95">
				<SheetHeader className="pb-4">
					<div className="flex items-start gap-4">
						<Avatar className="h-16 w-16 border-2 border-primary/20">
							<AvatarFallback className="bg-primary/10 font-bold text-primary text-xl">
								{getInitials(borrower.name)}
							</AvatarFallback>
						</Avatar>
						<div className="min-w-0 flex-1">
							<SheetTitle className="truncate font-bold text-2xl tracking-tight">
								{borrower.name}
							</SheetTitle>
							<SheetDescription className="text-sm">
								{borrower.email}
							</SheetDescription>
							<div className="mt-2 flex items-center gap-3">
								<BorrowerStatusBadge status={borrower.status} />
								<div className="flex items-center gap-1.5 text-muted-foreground text-sm">
									<RotessaStatusIcon
										customerId={borrower.rotessaCustomerId}
										status={borrower.rotessaStatus}
									/>
									{borrower.rotessaCustomerId && (
										<span className="font-mono text-xs">
											{borrower.rotessaCustomerId}
										</span>
									)}
								</div>
							</div>
						</div>
					</div>
				</SheetHeader>

				<Tabs
					className="mt-6"
					onValueChange={(v) => setActiveTab(v as typeof activeTab)}
					value={activeTab}
				>
					<TabsList className="grid w-full grid-cols-4 bg-muted/50">
						<TabsTrigger value="profile">Profile</TabsTrigger>
						<TabsTrigger value="mortgages">
							Mortgages
							{mortgages.length > 0 && (
								<Badge
									className="ml-1.5 h-5 min-w-[20px] justify-center text-xs"
									variant="secondary"
								>
									{mortgages.length}
								</Badge>
							)}
						</TabsTrigger>
						<TabsTrigger value="payments">Payments</TabsTrigger>
						<TabsTrigger value="activity">Activity</TabsTrigger>
					</TabsList>

					{/* Profile Tab */}
					<TabsContent className="mt-6 space-y-6" value="profile">
						{/* Personal Information */}
						<section>
							<div className="mb-3 flex items-center justify-between">
								<h3 className="font-bold text-muted-foreground text-xs uppercase tracking-widest">
									Personal Information
								</h3>
								{onEdit && (
									<Button
										className="h-7 gap-1.5 text-xs"
										onClick={onEdit}
										size="sm"
										variant="ghost"
									>
										<Edit className="h-3 w-3" />
										Edit
									</Button>
								)}
							</div>
							<Card className="bg-muted/30">
								<CardContent className="divide-y p-0 px-4">
									<DataRow label="Full Name" value={borrower.name} />
									<DataRow copyable label="Email" value={borrower.email} />
									<DataRow label="Phone" value={borrower.phone} />
								</CardContent>
							</Card>
						</section>

						{/* Address */}
						{borrower.address && (
							<section>
								<h3 className="mb-3 font-bold text-muted-foreground text-xs uppercase tracking-widest">
									Address
								</h3>
								<Card className="bg-muted/30">
									<CardContent className="p-4">
										<div className="flex items-start gap-3">
											<MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
											<div>
												<p className="text-sm">{borrower.address.street}</p>
												<p className="text-muted-foreground text-sm">
													{borrower.address.city}, {borrower.address.province}{" "}
													{borrower.address.postalCode}
												</p>
												<p className="text-muted-foreground text-sm">
													{borrower.address.country}
												</p>
											</div>
										</div>
									</CardContent>
								</Card>
							</section>
						)}

						{/* Verification Status */}
						<section>
							<h3 className="mb-3 font-bold text-muted-foreground text-xs uppercase tracking-widest">
								Verification Status
							</h3>
							<Card className="bg-muted/30">
								<CardContent className="divide-y p-0 px-4">
									<DataRow
										label="Identity"
										value={
											borrower.idVerificationStatus === "verified"
												? "✓ Verified"
												: borrower.idVerificationStatus === "not_started"
													? "○ Not Required"
													: borrower.idVerificationStatus || "—"
										}
									/>
									<DataRow
										label="KYC/AML"
										value={
											borrower.kycAmlStatus === "passed"
												? "✓ Passed"
												: borrower.kycAmlStatus === "not_started"
													? "○ Not Required"
													: borrower.kycAmlStatus || "—"
										}
									/>
								</CardContent>
							</Card>
						</section>

						{/* Rotessa Integration */}
						<section>
							<div className="mb-3 flex items-center justify-between">
								<h3 className="font-bold text-muted-foreground text-xs uppercase tracking-widest">
									Rotessa Integration
								</h3>
								{onSyncRotessa && (
									<Button
										className="h-7 gap-1.5 text-xs"
										onClick={onSyncRotessa}
										size="sm"
										variant="ghost"
									>
										<RefreshCw className="h-3 w-3" />
										Sync
									</Button>
								)}
							</div>
							<Card className="bg-muted/30">
								<CardContent className="divide-y p-0 px-4">
									<DataRow
										copyable
										label="Customer ID"
										mono
										value={borrower.rotessaCustomerId}
									/>
									<DataRow
										label="Status"
										value={
											borrower.rotessaStatus === "connected"
												? "✓ Active"
												: borrower.rotessaStatus === "pending"
													? "○ Pending"
													: borrower.rotessaStatus === "error"
														? "✗ Error"
														: "—"
										}
									/>
									{borrower.rotessaLastSyncAt && (
										<DataRow
											label="Last Synced"
											value={formatDistanceToNow(
												new Date(borrower.rotessaLastSyncAt),
												{ addSuffix: true }
											)}
										/>
									)}
								</CardContent>
							</Card>
						</section>

						{/* Account Details */}
						<section>
							<h3 className="mb-3 font-bold text-muted-foreground text-xs uppercase tracking-widest">
								Account Details
							</h3>
							<Card className="bg-muted/30">
								<CardContent className="divide-y p-0 px-4">
									<DataRow
										copyable
										label="Borrower ID"
										mono
										value={borrower.id}
									/>
									{borrower.userId && (
										<DataRow
											copyable
											label="User ID"
											mono
											value={borrower.userId}
										/>
									)}
									{borrower.createdAt && (
										<DataRow
											label="Created"
											value={new Date(borrower.createdAt).toLocaleDateString(
												"en-US",
												{
													year: "numeric",
													month: "long",
													day: "numeric",
												}
											)}
										/>
									)}
								</CardContent>
							</Card>
						</section>
					</TabsContent>

					{/* Mortgages Tab */}
					<TabsContent className="mt-6 space-y-4" value="mortgages">
						{mortgages.length === 0 ? (
							<div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
								<div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
									<Home className="h-8 w-8 text-muted-foreground/50" />
								</div>
								<div>
									<p className="font-medium">No linked mortgages</p>
									<p className="text-muted-foreground text-sm">
										This borrower doesn't have any mortgages yet
									</p>
								</div>
							</div>
						) : (
							<div className="space-y-3">
								<h3 className="font-bold text-muted-foreground text-xs uppercase tracking-widest">
									Linked Mortgages ({mortgages.length})
								</h3>
								{mortgages.map((mortgage) => (
									<Card
										className="cursor-pointer bg-muted/30 transition-colors hover:bg-muted/50"
										key={mortgage.id}
									>
										<CardContent className="p-4">
											<div className="mb-3 flex items-start justify-between">
												<div>
													<h4 className="font-medium text-sm">
														{mortgage.propertyAddress}
													</h4>
													{mortgage.rotessaScheduleId && (
														<p className="font-mono text-muted-foreground text-xs">
															Schedule: {mortgage.rotessaScheduleId}
														</p>
													)}
												</div>
												<Badge
													className={cn(
														mortgage.status === "active"
															? "border-emerald-200 bg-emerald-50 text-emerald-700"
															: mortgage.status === "completed"
																? "border-border bg-muted text-muted-foreground"
																: "border-red-200 bg-red-50 text-red-700"
													)}
													variant="outline"
												>
													{mortgage.status}
												</Badge>
											</div>
											<div className="grid grid-cols-3 gap-4 text-center">
												<div>
													<p className="text-muted-foreground text-xs">
														Principal
													</p>
													<p className="font-semibold tabular-nums">
														{formatCurrency(mortgage.principal)}
													</p>
												</div>
												<div>
													<p className="text-muted-foreground text-xs">Rate</p>
													<p className="font-semibold">
														{mortgage.interestRate}%
													</p>
												</div>
												<div>
													<p className="text-muted-foreground text-xs">
														Monthly
													</p>
													<p className="font-semibold tabular-nums">
														{formatCurrency(mortgage.monthlyPayment)}
													</p>
												</div>
											</div>
											<div className="mt-3 flex items-center justify-between border-border/50 border-t pt-3 text-muted-foreground text-xs">
												<span>
													Term: {mortgage.termMonths} months (
													{mortgage.remainingMonths} remaining)
												</span>
												<ExternalLink className="h-3 w-3" />
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						)}
					</TabsContent>

					{/* Payments Tab */}
					<TabsContent className="mt-6 space-y-6" value="payments">
						{/* Summary Cards */}
						<div className="grid grid-cols-3 gap-3">
							<Card className="border-emerald-200/50 bg-emerald-50/50 dark:bg-emerald-950/20">
								<CardContent className="p-3 text-center">
									<p className="font-medium text-emerald-600 text-xs dark:text-emerald-400">
										Cleared
									</p>
									<p className="font-bold text-emerald-700 text-lg tabular-nums dark:text-emerald-300">
										{formatCurrency(totalPaid)}
									</p>
								</CardContent>
							</Card>
							<Card className="border-amber-200/50 bg-amber-50/50 dark:bg-amber-950/20">
								<CardContent className="p-3 text-center">
									<p className="font-medium text-amber-600 text-xs dark:text-amber-400">
										Pending
									</p>
									<p className="font-bold text-amber-700 text-lg tabular-nums dark:text-amber-300">
										{formatCurrency(totalPending)}
									</p>
								</CardContent>
							</Card>
							<Card className="border-red-200/50 bg-red-50/50 dark:bg-red-950/20">
								<CardContent className="p-3 text-center">
									<p className="font-medium text-red-600 text-xs dark:text-red-400">
										Failed
									</p>
									<p className="font-bold text-lg text-red-700 tabular-nums dark:text-red-300">
										{formatCurrency(totalFailed)}
									</p>
								</CardContent>
							</Card>
						</div>

						{/* Recent Payments */}
						<div className="space-y-3">
							<h3 className="font-bold text-muted-foreground text-xs uppercase tracking-widest">
								Recent Payments
							</h3>
							{recentPayments.length === 0 ? (
								<div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
									<CreditCard className="h-8 w-8 text-muted-foreground/50" />
									<p className="text-muted-foreground text-sm">
										No payment history yet
									</p>
								</div>
							) : (
								<div className="space-y-2">
									{[...recentPayments]
										.sort(
											(a, b) =>
												new Date(b.date).getTime() - new Date(a.date).getTime()
										)
										.map((payment) => (
											<div
												className={cn(
													"flex items-center justify-between rounded-lg border p-3",
													payment.status === "cleared"
														? "border-emerald-200/50 bg-emerald-50/30 dark:bg-emerald-950/10"
														: payment.status === "pending"
															? "border-amber-200/50 bg-amber-50/30 dark:bg-amber-950/10"
															: "border-red-200/50 bg-red-50/30 dark:bg-red-950/10"
												)}
												key={payment.id}
											>
												<div className="flex items-center gap-3">
													{payment.status === "cleared" ? (
														<CheckCircle2 className="h-4 w-4 text-emerald-500" />
													) : payment.status === "pending" ? (
														<RefreshCw className="h-4 w-4 text-amber-500" />
													) : (
														<AlertTriangle className="h-4 w-4 text-red-500" />
													)}
													<div>
														<p className="font-medium text-sm">
															{new Date(payment.date).toLocaleDateString(
																"en-US",
																{
																	month: "short",
																	day: "numeric",
																	year: "numeric",
																}
															)}
														</p>
														<p className="max-w-[180px] truncate text-muted-foreground text-xs">
															{payment.propertyAddress}
														</p>
													</div>
												</div>
												<div className="text-right">
													<p className="font-semibold tabular-nums">
														{formatCurrency(payment.amount)}
													</p>
													{payment.ledgerTransactionId && (
														<p className="font-mono text-muted-foreground text-xs">
															{payment.ledgerTransactionId.slice(0, 12)}...
														</p>
													)}
												</div>
											</div>
										))}
								</div>
							)}
						</div>
					</TabsContent>

					{/* Activity Tab */}
					<TabsContent className="mt-6" value="activity">
						<h3 className="mb-4 font-bold text-muted-foreground text-xs uppercase tracking-widest">
							Activity Timeline
						</h3>
						{activity.length === 0 ? (
							<div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
								<div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
									<User className="h-8 w-8 text-muted-foreground/50" />
								</div>
								<p className="text-muted-foreground text-sm">
									No activity recorded yet
								</p>
							</div>
						) : (
							<div className="relative space-y-0">
								{/* Timeline line */}
								<div className="absolute top-2 bottom-2 left-[7px] w-px bg-border" />

								{activity.map((item, _index) => (
									<div
										className="relative flex gap-4 pb-6 last:pb-0"
										key={item.id}
									>
										{/* Timeline dot */}
										<div className="relative z-10 mt-1.5">
											<div className="h-3.5 w-3.5 rounded-full border-2 border-primary bg-primary/20" />
										</div>

										{/* Content */}
										<div className="min-w-0 flex-1">
											<p className="text-muted-foreground text-xs">
												{new Date(item.timestamp).toLocaleString("en-US", {
													month: "short",
													day: "numeric",
													year: "numeric",
													hour: "numeric",
													minute: "2-digit",
												})}
											</p>
											<p className="mt-0.5 font-medium text-sm">{item.type}</p>
											<p className="text-muted-foreground text-sm">
												{item.description}
											</p>
											{item.details && (
												<p className="mt-1 font-mono text-muted-foreground text-xs">
													{item.details}
												</p>
											)}
										</div>
									</div>
								))}
							</div>
						)}
					</TabsContent>
				</Tabs>

				{/* Footer Actions */}
				<Separator className="mt-8" />
				<div className="flex items-center justify-between gap-2 py-4">
					{borrower.status === "active" && onSuspend && (
						<Button
							className="text-destructive hover:text-destructive"
							onClick={onSuspend}
							size="sm"
							variant="outline"
						>
							Suspend
						</Button>
					)}
					<div className="flex-1" />
					{onSyncRotessa && (
						<Button
							className="gap-1.5"
							onClick={onSyncRotessa}
							size="sm"
							variant="outline"
						>
							<RefreshCw className="h-4 w-4" />
							Sync Rotessa
						</Button>
					)}
					{onEdit && (
						<Button className="gap-1.5" onClick={onEdit} size="sm">
							<Edit className="h-4 w-4" />
							Edit Borrower
						</Button>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}
