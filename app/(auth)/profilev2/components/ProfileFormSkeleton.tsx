import { Skeleton } from "@/components/ui/skeleton";

/**
 * ProfileFormSkeleton - Loading skeleton for ProfileForm
 *
 * Matches the layout structure of ProfileForm:
 * - Hero banner with avatar and user info
 * - Two-column layout (Organization Switcher + Form | Roles & Permissions)
 * - Settings tabs at bottom
 */
export function ProfileFormSkeleton() {
	return (
		<div className="space-y-8">
			{/* HERO BANNER - Full width with dramatic gradient */}
			<div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8 shadow-lg">
				<div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
					{/* Avatar skeleton */}
					<Skeleton className="size-24 rounded-full" />

					{/* User info skeleton */}
					<div className="flex-1 space-y-3 text-center sm:text-left">
						<Skeleton className="mx-auto h-8 w-48 sm:mx-0" />
						<Skeleton className="mx-auto h-4 w-64 sm:mx-0" />
						<Skeleton className="mx-auto h-4 w-32 sm:mx-0" />
					</div>

					{/* Role badge skeleton */}
					<Skeleton className="h-6 w-24" />
				</div>
			</div>

			{/* TWO COLUMN LAYOUT */}
			<div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
				{/* LEFT COLUMN */}
				<div className="space-y-8">
					{/* Organization Switcher skeleton */}
					<div className="rounded-xl border bg-card p-6 shadow-sm">
						<Skeleton className="mb-4 h-5 w-40" />
						<div className="space-y-3">
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-3/4" />
						</div>
					</div>

					{/* Profile Form skeleton */}
					<div className="rounded-xl border bg-card p-6 shadow-sm">
						<Skeleton className="mb-6 h-6 w-32" />
						<div className="space-y-4">
							<div className="space-y-2">
								<Skeleton className="h-4 w-20" />
								<Skeleton className="h-10 w-full" />
							</div>
							<div className="space-y-2">
								<Skeleton className="h-4 w-20" />
								<Skeleton className="h-10 w-full" />
							</div>
							<div className="space-y-2">
								<Skeleton className="h-4 w-20" />
								<Skeleton className="h-10 w-full" />
							</div>
							<div className="space-y-2">
								<Skeleton className="h-4 w-20" />
								<Skeleton className="h-10 w-full" />
							</div>
							<Skeleton className="mt-4 h-10 w-24" />
						</div>
					</div>
				</div>

				{/* RIGHT COLUMN - Roles & Permissions skeleton */}
				<div>
					<div className="rounded-xl border bg-card p-6 shadow-sm">
						<Skeleton className="mb-6 h-6 w-48" />
						<div className="space-y-4">
							<div className="space-y-2">
								<Skeleton className="h-4 w-32" />
								<div className="space-y-2 pl-4">
									<Skeleton className="h-3 w-full" />
									<Skeleton className="h-3 w-5/6" />
									<Skeleton className="h-3 w-4/6" />
								</div>
							</div>
							<div className="space-y-2">
								<Skeleton className="h-4 w-40" />
								<div className="space-y-2 pl-4">
									<Skeleton className="h-3 w-full" />
									<Skeleton className="h-3 w-5/6" />
									<Skeleton className="h-3 w-4/6" />
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* FULL WIDTH - Settings Tabs skeleton */}
			<div className="rounded-xl border bg-card p-6 shadow-sm">
				<Skeleton className="mb-6 h-6 w-32" />
				<div className="space-y-4">
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-20 w-full" />
				</div>
			</div>
		</div>
	);
}
