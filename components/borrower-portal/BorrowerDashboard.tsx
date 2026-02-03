"use client";

import { ArrowRight, Calendar, Home, PiggyBank, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DeferralRequestDialog } from "./DeferralRequestDialog";
import { LoanCard, type Mortgage } from "./LoanCard";
import {
	type Activity,
	RecentActivityTimeline,
} from "./RecentActivityTimeline";
import { SummaryCard } from "./SummaryCard";
import {
	type UpcomingPayment,
	UpcomingPaymentCard,
} from "./UpcomingPaymentCard";

type BorrowerDashboardData = {
	borrowerName: string;
	stats: {
		activeLoans: number;
		totalPrincipal: number;
		nextPaymentAmount: number;
		nextPaymentDate: string;
		daysUntilNextPayment: number;
		totalPaidThisYear: number;
	};
	upcomingPayments: UpcomingPayment[];
	recentActivity: Activity[];
	mortgages: Mortgage[];
};

type BorrowerDashboardProps = {
	data: BorrowerDashboardData;
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

export function BorrowerDashboard({
	data,
	checkEligibility,
	onSubmitDeferral,
}: BorrowerDashboardProps) {
	const router = useRouter();
	const [deferralDialogOpen, setDeferralDialogOpen] = useState(false);
	const [preselectedPaymentId, setPreselectedPaymentId] = useState<string>();

	const handleRequestDeferral = (paymentId?: string) => {
		setPreselectedPaymentId(paymentId);
		setDeferralDialogOpen(true);
	};

	const handleViewMortgage = (mortgageId: string) => {
		router.push(`/dashboard/borrower/loans/${mortgageId}`);
	};

	const handleViewAllPayments = () => {
		router.push("/dashboard/borrower/payments");
	};

	const handleViewAllActivity = () => {
		router.push("/dashboard/borrower/payments");
	};

	return (
		<div className="space-y-8">
			{/* Welcome header */}
			<div>
				<h1 className="font-bold text-2xl tracking-tight">
					Welcome back, {data.borrowerName.split(" ")[0]}!
				</h1>
				<p className="mt-1 text-muted-foreground">Here's your loan overview</p>
			</div>

			{/* Summary cards */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<SummaryCard
					icon={Wallet}
					subtitle={`Total: ${formatCurrency(data.stats.totalPrincipal)}`}
					title="Active Loans"
					value={data.stats.activeLoans}
				/>
				<SummaryCard
					icon={Calendar}
					subtitle={`Due ${data.stats.nextPaymentDate} (in ${data.stats.daysUntilNextPayment} days)`}
					title="Next Payment"
					value={formatCurrency(data.stats.nextPaymentAmount)}
				/>
				<SummaryCard
					icon={PiggyBank}
					subtitle="This Year"
					title="Total Paid"
					value={formatCurrency(data.stats.totalPaidThisYear)}
				/>
			</div>

			{/* Two column layout for upcoming payments and activity */}
			<div className="grid gap-6 lg:grid-cols-2">
				{/* Upcoming payments */}
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="font-semibold text-lg">Upcoming Payments</h2>
						{data.upcomingPayments.length > 0 && (
							<Button
								className="gap-1.5 text-sm"
								onClick={handleViewAllPayments}
								size="sm"
								variant="ghost"
							>
								View All
								<ArrowRight className="h-4 w-4" />
							</Button>
						)}
					</div>
					{data.upcomingPayments.length === 0 ? (
						<div className="flex flex-col items-center justify-center rounded-lg border bg-muted/20 py-12 text-center">
							<Calendar className="mb-3 h-10 w-10 text-muted-foreground/30" />
							<p className="text-muted-foreground text-sm">
								No upcoming payments
							</p>
						</div>
					) : (
						<div className="space-y-3">
							{data.upcomingPayments.slice(0, 3).map((payment) => (
								<UpcomingPaymentCard
									key={payment.id}
									onRequestDeferral={() => handleRequestDeferral(payment.id)}
									payment={payment}
								/>
							))}
						</div>
					)}
				</div>

				{/* Recent activity */}
				<RecentActivityTimeline
					activities={data.recentActivity}
					maxItems={5}
					onViewAll={handleViewAllActivity}
				/>
			</div>

			{/* My loans section */}
			<div className="space-y-4">
				<h2 className="font-semibold text-lg">My Loans</h2>
				{data.mortgages.length === 0 ? (
					<div className="flex flex-col items-center justify-center rounded-lg border bg-muted/20 py-16 text-center">
						<Home className="mb-4 h-12 w-12 text-muted-foreground/30" />
						<h3 className="mb-1 font-semibold text-lg">No Active Loans</h3>
						<p className="max-w-sm text-muted-foreground text-sm">
							You don't have any active loans at this time. Questions? Contact
							us at support@fairlend.com
						</p>
					</div>
				) : (
					<div className="grid gap-4 lg:grid-cols-2">
						{data.mortgages.map((mortgage) => (
							<LoanCard
								key={mortgage.id}
								mortgage={mortgage}
								onView={() => handleViewMortgage(mortgage.id)}
							/>
						))}
					</div>
				)}
			</div>

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
				upcomingPayments={data.upcomingPayments}
			/>
		</div>
	);
}
