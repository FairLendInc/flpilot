"use client";

import { cn } from "@/lib/utils";

type OwnershipEntry = {
	ownerId: string;
	percentage: number;
	label?: string;
};

type OwnershipCapTableProps = {
	ownership: OwnershipEntry[];
	className?: string;
};

function getOwnerColor(ownerId: string, index: number): string {
	if (ownerId === "fairlend") {
		return "bg-blue-500";
	}

	const colors = [
		"bg-green-500",
		"bg-purple-500",
		"bg-amber-500",
		"bg-pink-500",
		"bg-cyan-500",
		"bg-red-500",
	];

	return colors[index % colors.length] || "bg-gray-500";
}

function getOwnerLabel(ownerId: string, label?: string): string {
	if (label) return label;
	if (ownerId === "fairlend") return "FairLend";
	return `Investor ${ownerId.slice(0, 8)}...`;
}

export function OwnershipCapTable({
	ownership,
	className,
}: OwnershipCapTableProps) {
	const totalPercentage = ownership.reduce((sum, o) => sum + o.percentage, 0);
	const isValid = Math.abs(totalPercentage - 100) < 0.01;

	return (
		<div className={cn("flex flex-col gap-3", className)}>
			{/* Ownership bar */}
			<div className="flex h-4 w-full overflow-hidden rounded-full bg-muted">
				{ownership.map((entry, index) => (
					<div
						className={cn(
							"h-full transition-all",
							getOwnerColor(entry.ownerId, index)
						)}
						key={entry.ownerId}
						style={{ width: `${entry.percentage}%` }}
						title={`${getOwnerLabel(entry.ownerId, entry.label)}: ${entry.percentage}%`}
					/>
				))}
			</div>

			{/* Legend */}
			<div className="flex flex-wrap gap-3">
				{ownership.map((entry, index) => (
					<div className="flex items-center gap-2" key={entry.ownerId}>
						<div
							className={cn(
								"size-3 rounded-full",
								getOwnerColor(entry.ownerId, index)
							)}
						/>
						<span className="text-sm">
							{getOwnerLabel(entry.ownerId, entry.label)}:{" "}
							<span className="font-mono font-semibold">
								{entry.percentage}%
							</span>
						</span>
					</div>
				))}
			</div>

			{/* Validation */}
			<div className="flex items-center gap-2 text-xs">
				{isValid ? (
					<>
						<span className="size-2 rounded-full bg-green-500" />
						<span className="text-muted-foreground">
							Total: {totalPercentage}% ✓
						</span>
					</>
				) : (
					<>
						<span className="size-2 rounded-full bg-red-500" />
						<span className="text-red-500">
							Warning: Total is {totalPercentage}% (should be 100%)
						</span>
					</>
				)}
			</div>
		</div>
	);
}
