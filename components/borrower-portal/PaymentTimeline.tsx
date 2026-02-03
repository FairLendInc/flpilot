"use client";

import { format } from "date-fns";
import { FileX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type Payment, PaymentCard } from "./PaymentCard";

type PaymentGroup = {
	month: string;
	payments: Payment[];
};

type PaymentTimelineProps = {
	groups: PaymentGroup[];
	hasMore: boolean;
	isLoading: boolean;
	onLoadMore: () => void;
	onRequestDeferral: (paymentId: string) => void;
	onContactSupport: (paymentId: string) => void;
	onClearFilters?: () => void;
	className?: string;
};

export function PaymentTimeline({
	groups,
	hasMore,
	isLoading,
	onLoadMore,
	onRequestDeferral,
	onContactSupport,
	onClearFilters,
	className,
}: PaymentTimelineProps) {
	if (groups.length === 0 && !isLoading) {
		return (
			<div
				className={cn(
					"flex flex-col items-center justify-center py-16 text-center",
					className
				)}
			>
				<div className="mb-4 rounded-full bg-muted p-4">
					<FileX className="h-8 w-8 text-muted-foreground" />
				</div>
				<h3 className="mb-1 font-semibold text-lg">No Payments Found</h3>
				<p className="mb-4 max-w-sm text-muted-foreground text-sm">
					No payments match your current filters.
				</p>
				{onClearFilters && (
					<Button onClick={onClearFilters} variant="outline">
						Clear Filters
					</Button>
				)}
			</div>
		);
	}

	return (
		<div className={cn("space-y-8", className)}>
			{groups.map((group) => (
				<div key={group.month}>
					{/* Month header */}
					<div className="sticky top-0 z-10 mb-4 bg-background/95 py-2 backdrop-blur-sm">
						<h3 className="font-semibold text-foreground text-lg">
							{group.month}
						</h3>
						<div className="mt-2 h-px bg-border" />
					</div>

					{/* Payments for this month */}
					<div className="space-y-4">
						{group.payments.map((payment) => (
							<PaymentCard
								key={payment.id}
								onContactSupport={
									payment.status === "failed"
										? () => onContactSupport(payment.id)
										: undefined
								}
								onRequestDeferral={
									payment.status === "pending"
										? () => onRequestDeferral(payment.id)
										: undefined
								}
								payment={payment}
							/>
						))}
					</div>
				</div>
			))}

			{/* Load more */}
			{(hasMore || isLoading) && (
				<div className="flex justify-center pt-4">
					<Button
						className="min-w-32"
						disabled={isLoading}
						onClick={onLoadMore}
						variant="outline"
					>
						{isLoading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Loading...
							</>
						) : (
							"Load More"
						)}
					</Button>
				</div>
			)}
		</div>
	);
}

/**
 * Utility function to group payments by month
 */
export function groupPaymentsByMonth(payments: Payment[]): PaymentGroup[] {
	const groups = new Map<string, Payment[]>();

	for (const payment of payments) {
		const monthKey = format(new Date(payment.dueDate), "MMMM yyyy");
		const existing = groups.get(monthKey) || [];
		groups.set(monthKey, [...existing, payment]);
	}

	// Convert to array and sort by date descending
	return Array.from(groups.entries())
		.map(([month, monthPayments]) => ({ month, payments: monthPayments }))
		.sort((a, b) => {
			const dateA = new Date(a.payments[0].dueDate);
			const dateB = new Date(b.payments[0].dueDate);
			return dateB.getTime() - dateA.getTime();
		});
}

export type { PaymentGroup };
