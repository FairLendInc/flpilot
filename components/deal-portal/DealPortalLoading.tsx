import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DealPortalLoading() {
	return (
		<div className="fade-in flex flex-1 animate-in flex-col gap-6 p-6 duration-300">
			{/* Header Skeleton */}
			<div className="flex items-center justify-between">
				<div className="space-y-2">
					<Skeleton className="h-8 w-64" />
					<Skeleton className="h-4 w-48" />
				</div>
				<Skeleton className="h-10 w-32" />
			</div>

			{/* Progress Overview Skeleton */}
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-40" />
				</CardHeader>
				<CardContent>
					<Skeleton className="mb-4 h-4 w-full" />
					<div className="flex justify-between">
						<Skeleton className="h-3 w-24" />
						<Skeleton className="h-3 w-16" />
					</div>
				</CardContent>
			</Card>

			{/* Document Groups Skeleton */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
				{[0, 1, 2].map((groupIdx) => (
					<Card className="overflow-hidden" key={`doc-group-${groupIdx}`}>
						<div className="h-1 w-full animate-pulse bg-muted" />
						<CardHeader className="pb-2">
							<div className="flex items-center justify-between">
								<Skeleton className="h-5 w-32" />
								<Skeleton className="h-5 w-20 rounded-full" />
							</div>
						</CardHeader>
						<CardContent className="pt-2">
							<Skeleton className="mb-2 h-2 w-full" />
							<div className="mb-4 flex justify-between">
								<Skeleton className="h-3 w-20" />
								<Skeleton className="h-3 w-16" />
							</div>
							{/* Step indicators */}
							<div className="mt-4 flex items-center justify-between">
								{[0, 1, 2].map((stepIdx) => (
									<div
										className="flex flex-col items-center gap-1"
										key={`step-${groupIdx}-${stepIdx}`}
									>
										<Skeleton className="h-6 w-6 rounded-full" />
										<Skeleton className="h-2 w-12" />
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Actions Section Skeleton */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<Skeleton className="h-5 w-5" />
						<Skeleton className="h-6 w-32" />
					</div>
				</CardHeader>
				<CardContent className="space-y-3">
					{[0, 1].map((actionIdx) => (
						<div
							className="flex items-center gap-3 rounded-lg border p-3"
							key={`action-${actionIdx}`}
						>
							<Skeleton className="h-4 w-4" />
							<div className="flex-1 space-y-1">
								<Skeleton className="h-4 w-40" />
								<Skeleton className="h-3 w-24" />
							</div>
							<Skeleton className="h-4 w-4" />
						</div>
					))}
				</CardContent>
			</Card>
		</div>
	);
}

export function DocumentCardSkeleton() {
	return (
		<Card className="overflow-hidden">
			<div className="h-1 w-full animate-pulse bg-muted" />
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between">
					<Skeleton className="h-5 w-32" />
					<Skeleton className="h-5 w-20 rounded-full" />
				</div>
			</CardHeader>
			<CardContent className="pt-2">
				<Skeleton className="mb-2 h-2 w-full" />
				<div className="mb-4 flex justify-between">
					<Skeleton className="h-3 w-20" />
					<Skeleton className="h-3 w-16" />
				</div>
				<div className="mt-4 flex items-center justify-between">
					{[0, 1, 2].map((stepIdx) => (
						<div
							className="flex flex-col items-center gap-1"
							key={`step-skel-${stepIdx}`}
						>
							<Skeleton className="h-6 w-6 rounded-full" />
							<Skeleton className="h-2 w-12" />
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

export function DocumentListSkeleton() {
	return (
		<div className="fade-in animate-in space-y-3 duration-200">
			{[0, 1, 2].map((idx) => (
				<Card className="p-4" key={`doc-list-${idx}`}>
					<div className="flex items-center gap-4">
						<Skeleton className="h-10 w-10 rounded" />
						<div className="flex-1 space-y-2">
							<Skeleton className="h-4 w-48" />
							<Skeleton className="h-3 w-32" />
						</div>
						<Skeleton className="h-6 w-20 rounded-full" />
					</div>
				</Card>
			))}
		</div>
	);
}

export function DocumentDetailSkeleton() {
	return (
		<div className="fade-in animate-in space-y-6 duration-200">
			{/* Document header */}
			<div className="flex items-start justify-between">
				<div className="space-y-2">
					<Skeleton className="h-6 w-64" />
					<Skeleton className="h-4 w-40" />
				</div>
				<Skeleton className="h-9 w-24" />
			</div>

			{/* Document preview area */}
			<Card className="p-6">
				<Skeleton className="h-[400px] w-full rounded-lg" />
			</Card>

			{/* Action buttons */}
			<div className="flex gap-3">
				<Skeleton className="h-10 w-32" />
				<Skeleton className="h-10 w-32" />
			</div>
		</div>
	);
}
