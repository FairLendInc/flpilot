import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for appraisal data section
 * Matches AppraisalData component layout
 */
export function AppraisalDataSkeleton() {
	return (
		<div className="mb-12">
			<Skeleton className="mb-4 h-7 w-48" />
			<div className="grid gap-4 md:grid-cols-3">
				{[1, 2, 3].map((i) => (
					<div className="space-y-2 rounded-lg border p-4" key={i}>
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-6 w-24" />
					</div>
				))}
			</div>
		</div>
	);
}
