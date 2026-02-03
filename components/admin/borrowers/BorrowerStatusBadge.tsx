"use client";

import {
	Ban,
	CheckCircle2,
	Clock,
	type LucideIcon,
	MinusCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type BorrowerStatus =
	| "pending_approval"
	| "active"
	| "inactive"
	| "suspended";

type StatusConfig = {
	label: string;
	icon: LucideIcon;
	className: string;
};

const statusConfig: Record<BorrowerStatus, StatusConfig> = {
	pending_approval: {
		label: "Pending",
		icon: Clock,
		className:
			"bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
	},
	active: {
		label: "Active",
		icon: CheckCircle2,
		className:
			"bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
	},
	inactive: {
		label: "Inactive",
		icon: MinusCircle,
		className:
			"bg-muted text-muted-foreground border-border dark:bg-slate-800 dark:border-slate-700",
	},
	suspended: {
		label: "Suspended",
		icon: Ban,
		className:
			"bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
	},
};

type BorrowerStatusBadgeProps = {
	status: BorrowerStatus;
	className?: string;
	showIcon?: boolean;
};

export function BorrowerStatusBadge({
	status,
	className,
	showIcon = true,
}: BorrowerStatusBadgeProps) {
	const config = statusConfig[status];
	const Icon = config.icon;

	return (
		<Badge
			className={cn(
				"gap-1.5 border font-medium transition-colors",
				config.className,
				className
			)}
			variant="outline"
		>
			{showIcon && <Icon className="h-3 w-3" />}
			{config.label}
		</Badge>
	);
}
