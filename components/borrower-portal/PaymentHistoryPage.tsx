"use client";

import { CheckCircle2, Clock, DollarSign } from "lucide-react";
import { useState } from "react";
import { DeferralRequestDialog } from "./DeferralRequestDialog";
import type { Payment } from "./PaymentCard";
import { PaymentHistoryFilters } from "./PaymentHistoryFilters";
import { groupPaymentsByMonth, PaymentTimeline } from "./PaymentTimeline";
import { SummaryCard } from "./SummaryCard";

type Property = {
	id: string;
	address: string;
};

type PaymentHistorySummary = {
	totalPaid: number;
	totalPayments: number;
	clearedAmount: number;
	clearedCount: number;
	pendingAmount: number;
	pendingCount: number;
	nextDueDate?: string;
};

type PaymentHistoryPageProps = {
	properties: Property[];
	payments: Payment[];
	summary: PaymentHistorySummary;
	hasMore: boolean;
	isLoading: boolean;
	onLoadMore: () => void;
	onFilterChange: (filters: {
		propertyId: string | null;
		statuses: ("pending" | "cleared" | "failed")[];
		dateRange: "30d" | "3m" | "6m" | "12m" | "all" | "custom";
	}) => void;
	// Deferral request props
	upcomingPayments: {
		id: string;
		dueDate: string;
		amount: number;
		propertyAddress: string;
		mortgageId: string;
	}[];
	checkEligibility: (mortgageId: string) => Promise<{
		eligible: boolean;
		reason?: string;
		previousDeferral?: { date: string; property: string };
	}>;
	onSubmitDeferral: (request: {
		paymentId: string;
		mortgageId: string;
		requestType: "one_time" | "hardship";
		requestedDeferralDate: string;
		reason?: string;
	}) => Promise<{ referenceNumber: string }>;
};

function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("en-CA", {
		style: "currency",
		currency: "CAD",
		maximumFractionDigits: 0,
	}).format(amount);
}

export function PaymentHistoryPage({
	properties,
	payments,
	summary,
	hasMore,
	isLoading,
	onLoadMore,
	onFilterChange,
	upcomingPayments,
	checkEligibility,
	onSubmitDeferral,
}: PaymentHistoryPageProps) {
	const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(
		null
	);
	const [selectedStatuses, setSelectedStatuses] = useState<
		("pending" | "cleared" | "failed")[]
	>(["pending", "cleared", "failed"]);
	const [dateRange, setDateRange] = useState<
		"30d" | "3m" | "6m" | "12m" | "all" | "custom"
	>("12m");

	const [deferralDialogOpen, setDeferralDialogOpen] = useState(false);
	const [preselectedPaymentId, setPreselectedPaymentId] = useState<string>();

	const handlePropertyChange = (id: string | null) => {
		setSelectedPropertyId(id);
		onFilterChange({
			propertyId: id,
			statuses: selectedStatuses,
			dateRange,
		});
	};

	const handleStatusChange = (
		statuses: ("pending" | "cleared" | "failed")[]
	) => {
		setSelectedStatuses(statuses);
		onFilterChange({
			propertyId: selectedPropertyId,
			statuses,
			dateRange,
		});
	};

	const handleDateRangeChange = (
		range: "30d" | "3m" | "6m" | "12m" | "all" | "custom"
	) => {
		setDateRange(range);
		onFilterChange({
			propertyId: selectedPropertyId,
			statuses: selectedStatuses,
			dateRange: range,
		});
	};

	const handleClearAll = () => {
		setSelectedPropertyId(null);
		setSelectedStatuses(["pending", "cleared", "failed"]);
		setDateRange("12m");
		onFilterChange({
			propertyId: null,
			statuses: ["pending", "cleared", "failed"],
			dateRange: "12m",
		});
	};

	const handleRequestDeferral = (paymentId: string) => {
		setPreselectedPaymentId(paymentId);
		setDeferralDialogOpen(true);
	};

	const handleContactSupport = (_paymentId: string) => {
		// Could open email or support chat
		window.location.href = "mailto:support@fairlend.com";
	};

	const groups = groupPaymentsByMonth(payments);

	return (
		<div className="space-y-8">
			{/* Header */}
			<div>
				<h1 className="font-bold text-2xl tracking-tight">Payment History</h1>
				<p className="mt-1 text-muted-foreground">
					Track all your mortgage payments
				</p>
			</div>

			{/* Summary cards */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<SummaryCard
					icon={DollarSign}
					subtitle={`${summary.totalPayments} payments`}
					title="Total Paid"
					value={formatCurrency(summary.totalPaid)}
				/>
				<SummaryCard
					icon={CheckCircle2}
					subtitle={`${summary.clearedCount} payments`}
					title="Cleared"
					value={formatCurrency(summary.clearedAmount)}
				/>
				<SummaryCard
					icon={Clock}
					subtitle={
						summary.nextDueDate
							? `${summary.pendingCount} payment${summary.pendingCount !== 1 ? "s" : ""} - Due ${summary.nextDueDate}`
							: `${summary.pendingCount} payments`
					}
					title="Pending"
					value={formatCurrency(summary.pendingAmount)}
				/>
			</div>

			{/* Filters */}
			<PaymentHistoryFilters
				dateRange={dateRange}
				onClearAll={handleClearAll}
				onDateRangeChange={handleDateRangeChange}
				onPropertyChange={handlePropertyChange}
				onStatusChange={handleStatusChange}
				properties={properties}
				selectedPropertyId={selectedPropertyId}
				selectedStatuses={selectedStatuses}
				totalResults={payments.length}
			/>

			{/* Payment timeline */}
			<PaymentTimeline
				groups={groups}
				hasMore={hasMore}
				isLoading={isLoading}
				onClearFilters={handleClearAll}
				onContactSupport={handleContactSupport}
				onLoadMore={onLoadMore}
				onRequestDeferral={handleRequestDeferral}
			/>

			{/* Deferral request dialog */}
			<DeferralRequestDialog
				checkEligibility={checkEligibility}
				onClose={() => {
					setDeferralDialogOpen(false);
					setPreselectedPaymentId(undefined);
				}}
				onSubmit={onSubmitDeferral}
				open={deferralDialogOpen}
				preselectedPaymentId={preselectedPaymentId}
				upcomingPayments={upcomingPayments}
			/>
		</div>
	);
}
