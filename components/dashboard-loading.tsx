import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardLoading() {
	return (
		<>
			<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator className="mr-2 h-4" orientation="vertical" />
				<Skeleton className="h-6 w-32" />
			</header>

			<div className="flex flex-1 flex-col gap-6 p-6">
				{/* Metrics Cards Skeleton */}
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<div
							className="rounded-xl border bg-card p-6 shadow-sm"
							// biome-ignore lint/suspicious/noArrayIndexKey: this is static content
							key={`metric-${i}`}
						>
							<div className="flex items-center justify-between pb-2">
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-4 w-4" />
							</div>
							<Skeleton className="h-8 w-16" />
							<Skeleton className="mt-1 h-3 w-32" />
						</div>
					))}
				</div>

				{/* Content Skeleton */}
				<div className="rounded-xl border bg-card p-6 shadow-sm">
					<Skeleton className="h-6 w-48" />
					<div className="mt-6 space-y-4">
						{Array.from({ length: 3 }).map((_, i) => (
							<div
								className="flex items-center justify-between"
								// biome-ignore lint/suspicious/noArrayIndexKey: this is static content
								key={`content-skeleton-${i}`}
							>
								<div className="space-y-2">
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-3 w-48" />
								</div>
								<Skeleton className="h-9 w-20" />
							</div>
						))}
					</div>
				</div>
			</div>
		</>
	);
}
