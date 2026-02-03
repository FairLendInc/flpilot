"use client";

import { format, formatDistanceToNow } from "date-fns";
import { Calendar, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type UpcomingPayment = {
	id: string;
	dueDate: string;
	amount: number;
	propertyAddress: string;
	description: string;
	mortgageId: string;
};

type UpcomingPaymentCardProps = {
	payment: UpcomingPayment;
	onRequestDeferral: () => void;
	className?: string;
};

function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("en-CA", {
		style: "currency",
		currency: "CAD",
	}).format(amount);
}

export function UpcomingPaymentCard({
	payment,
	onRequestDeferral,
	className,
}: UpcomingPaymentCardProps) {
	const dueDate = new Date(payment.dueDate);
	const timeUntilDue = formatDistanceToNow(dueDate, { addSuffix: true });

	return (
		<Card
			className={cn(
				"group relative overflow-hidden border-l-4 border-l-amber-400 transition-all hover:shadow-md dark:border-l-amber-500",
				className
			)}
		>
			<CardContent className="p-5">
				<div className="flex items-start justify-between gap-4">
					{/* Left side - Payment info */}
					<div className="min-w-0 flex-1 space-y-3">
						{/* Date and amount header */}
						<div className="flex items-start justify-between">
							<div className="flex items-center gap-2 text-muted-foreground text-sm">
								<Calendar className="h-4 w-4 shrink-0" />
								<span className="font-medium text-foreground">
									{format(dueDate, "MMM d, yyyy")}
								</span>
							</div>
							<p className="font-bold text-foreground text-xl tabular-nums">
								{formatCurrency(payment.amount)}
							</p>
						</div>

						{/* Time until due */}
						<div className="flex items-center gap-1.5 text-amber-600 text-sm dark:text-amber-400">
							<Clock className="h-3.5 w-3.5" />
							<span>{timeUntilDue}</span>
						</div>

						{/* Property address */}
						<div className="flex items-start gap-1.5">
							<MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
							<div>
								<p className="font-medium text-sm">{payment.propertyAddress}</p>
								<p className="text-muted-foreground text-xs">
									{payment.description}
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Action button */}
				<div className="mt-4 border-t pt-3">
					<Button
						className="w-full sm:w-auto"
						onClick={onRequestDeferral}
						size="sm"
						variant="outline"
					>
						Request Deferral
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

export type { UpcomingPayment };
