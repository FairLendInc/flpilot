"use client";

import { ArrowRight } from "lucide-react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	formatBalance,
	getAccountColor,
	getAccountIcon,
	getNamespace,
	truncateAddress,
} from "@/lib/ledger/utils";
import { cn } from "@/lib/utils";

type PostingRowProps = {
	source: string;
	destination: string;
	amount: number | string;
	asset: string;
	className?: string;
};

function AccountBadge({ address }: { address: string }) {
	const namespace = getNamespace(address);
	const Icon = getAccountIcon(namespace);
	const colorClass = getAccountColor(namespace);
	const truncated = truncateAddress(address, 20);

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<div
						className={cn(
							"flex items-center gap-1.5 rounded-md px-2 py-1",
							colorClass
						)}
					>
						<Icon className="size-3" />
						<span className="font-mono text-xs">{truncated}</span>
					</div>
				</TooltipTrigger>
				<TooltipContent>
					<span className="font-mono text-xs">{address}</span>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}

export function PostingRow({
	source,
	destination,
	amount,
	asset,
	className,
}: PostingRowProps) {
	return (
		<div className={cn("flex items-center gap-2", className)}>
			<AccountBadge address={source} />
			<ArrowRight className="size-4 shrink-0 text-muted-foreground" />
			<AccountBadge address={destination} />
			<div className="ml-auto">
				<span className="rounded-md bg-primary/10 px-2 py-1 font-bold font-mono text-primary text-xs">
					{formatBalance(amount, asset)}
				</span>
			</div>
		</div>
	);
}
