"use client";

import {
	AlertTriangle,
	CheckCircle2,
	Clock,
	type LucideIcon,
	XCircle,
} from "lucide-react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type RotessaStatus = "connected" | "pending" | "not_connected" | "error";

type StatusConfig = {
	icon: LucideIcon;
	tooltip: string;
	className: string;
};

const rotessaStatusConfig: Record<RotessaStatus, StatusConfig> = {
	connected: {
		icon: CheckCircle2,
		tooltip: "Rotessa connected",
		className: "text-emerald-500 dark:text-emerald-400",
	},
	pending: {
		icon: Clock,
		tooltip: "Setting up Rotessa",
		className: "text-amber-500 dark:text-amber-400",
	},
	not_connected: {
		icon: XCircle,
		tooltip: "Rotessa not connected",
		className: "text-muted-foreground/50",
	},
	error: {
		icon: AlertTriangle,
		tooltip: "Rotessa sync error",
		className: "text-red-500 dark:text-red-400",
	},
};

type RotessaStatusIconProps = {
	status: RotessaStatus;
	customerId?: string;
	className?: string;
};

export function RotessaStatusIcon({
	status,
	customerId,
	className,
}: RotessaStatusIconProps) {
	const config = rotessaStatusConfig[status];
	const Icon = config.icon;

	const tooltipContent = customerId
		? `${config.tooltip} (${customerId})`
		: config.tooltip;

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<span className={cn("inline-flex", className)}>
						<Icon className={cn("h-4 w-4", config.className)} />
					</span>
				</TooltipTrigger>
				<TooltipContent>
					<p className="text-xs">{tooltipContent}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
