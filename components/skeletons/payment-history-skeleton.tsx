import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for payment history timeline
 * Matches PaymentHistory component layout with 12 months of payments
 */
export function PaymentHistorySkeleton() {
	return (
		<div className="mb-12">
			<Skeleton className="mb-4 h-7 w-48" />
			<div className="space-y-2">
				{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
					<div
						className="flex items-center gap-4 rounded-lg border p-4"
						key={i}
					>
						<Skeleton className="h-5 w-24" />
						<Skeleton className="h-5 w-32" />
						<Skeleton className="h-5 w-28" />
						<Skeleton className="ml-auto h-6 w-20" />
					</div>
				))}
			</div>
		</div>
	);
}
