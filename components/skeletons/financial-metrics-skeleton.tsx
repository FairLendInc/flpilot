import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for financial metrics grid
 * Matches FinancialMetrics component layout
 */
export function FinancialMetricsSkeleton() {
	return (
		<div className="mb-12">
			<Skeleton className="mb-4 h-7 w-48" />
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
					<div className="space-y-2 rounded-lg border p-4" key={i}>
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-6 w-24" />
					</div>
				))}
			</div>
		</div>
	);
}
