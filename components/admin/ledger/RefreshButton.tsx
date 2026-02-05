"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RefreshButtonProps = {
	onClick: () => void;
	isLoading?: boolean;
	className?: string;
};

export function RefreshButton({
	onClick,
	isLoading,
	className,
}: RefreshButtonProps) {
	return (
		<Button
			className={cn("gap-2", className)}
			disabled={isLoading}
			onClick={onClick}
			size="sm"
			variant="outline"
		>
			<RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
			{isLoading ? "Refreshing..." : "Refresh"}
		</Button>
	);
}
