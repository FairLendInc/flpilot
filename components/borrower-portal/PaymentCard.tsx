"use client";

import { format, formatDistanceToNow } from "date-fns";
import {
	AlertTriangle,
	Calendar,
	CheckCircle2,
	Clock,
	MapPin,
	XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type PaymentStatus = "pending" | "cleared" | "failed";

type Payment = {
	id: string;
	dueDate: string;
	clearedDate?: string;
	amount: number;
	status: PaymentStatus;
	propertyAddress: string;
	description: string;
	mortgageId: string;
	failureReason?: string;
};

type PaymentCardProps = {
	payment: Payment;
	onRequestDeferral?: () => void;
	onContactSupport?: () => void;
	className?: string;
};

const statusConfig: Record<
	PaymentStatus,
	{
		icon: React.ElementType;
		label: string;
		cardClassName: string;
		badgeClassName: string;
	}
> = {
	cleared: {
		icon: CheckCircle2,
		label: "Cleared",
		cardClassName:
			"border-l-4 border-l-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20",
		badgeClassName:
			"bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
	},
	pending: {
		icon: Clock,
		label: "Pending",
		cardClassName:
			"border-l-4 border-l-amber-400 bg-amber-50/50 dark:bg-amber-950/20",
		badgeClassName:
			"bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
	},
	failed: {
		icon: XCircle,
		label: "Failed",
		cardClassName:
			"border-l-4 border-l-red-400 bg-red-50/50 dark:bg-red-950/20",
		badgeClassName: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
	},
};

function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("en-CA", {
		style: "currency",
		currency: "CAD",
	}).format(amount);
}

export function PaymentCard({
	payment,
	onRequestDeferral,
	onContactSupport,
	className,
}: PaymentCardProps) {
	const config = statusConfig[payment.status];
	const Icon = config.icon;
	const dueDate = new Date(payment.dueDate);

	return (
		<Card className={cn("overflow-hidden", config.cardClassName, className)}>
			<CardContent className="p-5">
				{/* Status badge */}
				<div className="mb-4 flex items-center justify-between">
					<Badge
						className={cn("gap-1.5", config.badgeClassName)}
						variant="secondary"
					>
						<Icon className="h-3.5 w-3.5" />
						{config.label}
					</Badge>
					<span className="font-bold text-xl tabular-nums">
						{formatCurrency(payment.amount)}
					</span>
				</div>

				{/* Date and property */}
				<div className="space-y-2.5">
					<div className="flex items-center gap-2 text-sm">
						<Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
						<span className="font-medium">
							{format(dueDate, "MMM d, yyyy")}
						</span>
					</div>

					<div className="flex items-start gap-2 text-sm">
						<MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
						<div>
							<p className="font-medium">{payment.propertyAddress}</p>
							<p className="text-muted-foreground text-xs">
								{payment.description}
							</p>
						</div>
					</div>
				</div>

				{/* Status-specific footer */}
				<div className="mt-4 border-border/50 border-t pt-3">
					{payment.status === "pending" && (
						<div className="flex items-center justify-between">
							<span className="text-amber-600 text-sm dark:text-amber-400">
								Due {formatDistanceToNow(dueDate, { addSuffix: true })}
							</span>
							{onRequestDeferral && (
								<Button onClick={onRequestDeferral} size="sm" variant="outline">
									Request Deferral
								</Button>
							)}
						</div>
					)}

					{payment.status === "cleared" && payment.clearedDate && (
						<p className="text-muted-foreground text-sm">
							Cleared {format(new Date(payment.clearedDate), "MMM d, yyyy")}
						</p>
					)}

					{payment.status === "failed" && (
						<div className="space-y-3">
							{payment.failureReason && (
								<div className="flex items-start gap-2 text-red-600 text-sm dark:text-red-400">
									<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
									<span>{payment.failureReason}</span>
								</div>
							)}
							{onContactSupport && (
								<Button
									className="w-full sm:w-auto"
									onClick={onContactSupport}
									size="sm"
									variant="outline"
								>
									Contact Support
								</Button>
							)}
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

export type { Payment, PaymentStatus };
