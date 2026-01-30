"use client";

import { Database, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
	icon?: LucideIcon;
	title: string;
	description?: string;
	action?: {
		label: string;
		onClick: () => void;
	};
	className?: string;
};

export function EmptyState({
	icon: Icon = Database,
	title,
	description,
	action,
	className,
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center gap-4 py-12 text-center",
				className
			)}
		>
			<div className="rounded-full bg-muted p-4">
				<Icon className="size-8 text-muted-foreground" />
			</div>
			<div className="flex flex-col gap-1">
				<h3 className="font-semibold text-foreground text-lg">{title}</h3>
				{description && (
					<p className="max-w-sm text-muted-foreground text-sm">
						{description}
					</p>
				)}
			</div>
			{action && (
				<Button onClick={action.onClick} variant="outline">
					{action.label}
				</Button>
			)}
		</div>
	);
}
