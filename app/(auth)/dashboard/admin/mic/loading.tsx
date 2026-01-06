import { Skeleton } from "@/components/ui/skeleton";

export default function MICLoading() {
	return (
		<div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
			<div className="flex items-center justify-between">
				<div className="space-y-2">
					<Skeleton className="h-10 w-48" />
					<Skeleton className="h-4 w-64" />
				</div>
				<div className="flex gap-3">
					<Skeleton className="h-10 w-32" />
					<Skeleton className="h-10 w-32" />
				</div>
			</div>

			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
				{[1, 2, 3, 4].map((i) => (
					<Skeleton className="h-32 w-full rounded-xl" key={i} />
				))}
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<div className="lg:col-span-2">
					<Skeleton className="h-[400px] w-full rounded-xl" />
				</div>
				<div className="lg:col-span-1">
					<Skeleton className="h-[400px] w-full rounded-xl" />
				</div>
			</div>
		</div>
	);
}
