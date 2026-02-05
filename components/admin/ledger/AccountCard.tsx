"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	formatBalance,
	getAccountColor,
	getAccountIcon,
	getNamespace,
} from "@/lib/ledger/utils";
import { cn } from "@/lib/utils";
import { CopyButton } from "./CopyButton";

type AccountBalance = {
	asset: string;
	balance: number | string;
};

type AccountVolumes = {
	input: Record<string, number | string>;
	output: Record<string, number | string>;
};

type AccountCardProps = {
	address: string;
	balances: AccountBalance[];
	metadata?: Record<string, string>;
	volumes?: AccountVolumes;
	className?: string;
};

export function AccountCard({
	address,
	balances,
	metadata,
	volumes,
	className,
}: AccountCardProps) {
	const [isMetadataOpen, setIsMetadataOpen] = useState(false);
	const namespace = getNamespace(address);
	const Icon = getAccountIcon(namespace);
	const colorClass = getAccountColor(namespace);

	const hasMetadata = metadata && Object.keys(metadata).length > 0;
	const hasVolumes =
		volumes &&
		(Object.keys(volumes.input).length > 0 ||
			Object.keys(volumes.output).length > 0);

	return (
		<Card className={cn("overflow-hidden", className)}>
			<CardContent className="p-4">
				<div className="flex items-start justify-between gap-4">
					<div className="flex items-start gap-3">
						<div className={cn("mt-0.5 rounded-lg p-2", colorClass)}>
							<Icon className="size-4" />
						</div>
						<div className="flex flex-col gap-1">
							<div className="flex items-center gap-2">
								<span className="font-medium font-mono text-foreground text-sm">
									{address}
								</span>
								<CopyButton text={address} />
							</div>
							<span className="text-[10px] text-muted-foreground uppercase tracking-wider">
								{namespace}
							</span>
						</div>
					</div>

					<div className="flex flex-col items-end gap-1">
						{balances.map(({ asset, balance }) => (
							<div className="flex items-center gap-2" key={asset}>
								<span className="font-bold font-mono text-foreground text-sm tabular-nums">
									{formatBalance(balance, asset)}
								</span>
								<span className="text-[10px] text-muted-foreground">
									{asset}
								</span>
							</div>
						))}
						{balances.length === 0 && (
							<span className="text-muted-foreground text-sm">No balances</span>
						)}
					</div>
				</div>

				{(hasMetadata || hasVolumes) && (
					<Collapsible
						className="mt-4"
						onOpenChange={setIsMetadataOpen}
						open={isMetadataOpen}
					>
						<CollapsibleTrigger className="flex w-full items-center gap-2 text-muted-foreground text-sm hover:text-foreground">
							{isMetadataOpen ? (
								<ChevronDown className="size-4" />
							) : (
								<ChevronRight className="size-4" />
							)}
							<span>Details</span>
						</CollapsibleTrigger>
						<CollapsibleContent className="mt-3">
							<div className="flex flex-col gap-4 rounded-lg bg-muted/30 p-3">
								{hasMetadata && (
									<div className="flex flex-col gap-2">
										<span className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
											Metadata
										</span>
										<div className="flex flex-wrap gap-2">
											{Object.entries(metadata).map(([key, value]) => (
												<span
													className="rounded-md bg-background px-2 py-1 font-mono text-xs"
													key={key}
												>
													<span className="text-muted-foreground">{key}:</span>{" "}
													<span className="text-foreground">{value}</span>
												</span>
											))}
										</div>
									</div>
								)}

								{hasVolumes && (
									<div className="flex flex-col gap-2">
										<span className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
											Volumes
										</span>
										<div className="grid grid-cols-2 gap-4 text-xs">
											<div>
												<span className="text-green-500">Input:</span>
												{Object.entries(volumes.input).map(
													([asset, amount]) => (
														<div className="font-mono" key={asset}>
															{formatBalance(amount, asset)}
														</div>
													)
												)}
											</div>
											<div>
												<span className="text-red-500">Output:</span>
												{Object.entries(volumes.output).map(
													([asset, amount]) => (
														<div className="font-mono" key={asset}>
															{formatBalance(amount, asset)}
														</div>
													)
												)}
											</div>
										</div>
									</div>
								)}
							</div>
						</CollapsibleContent>
					</Collapsible>
				)}
			</CardContent>
		</Card>
	);
}
