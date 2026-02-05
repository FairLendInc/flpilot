"use client";

import { format } from "date-fns";
import { ChevronDown, ChevronRight, Hash } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { CopyButton } from "./CopyButton";
import { PostingRow } from "./PostingRow";

type Posting = {
	source: string;
	destination: string;
	amount: number | string;
	asset: string;
};

type TransactionCardProps = {
	id: string;
	timestamp: string | Date;
	postings: Posting[];
	reference?: string;
	metadata?: Record<string, unknown>;
	className?: string;
};

export function TransactionCard({
	id,
	timestamp,
	postings,
	reference,
	metadata,
	className,
}: TransactionCardProps) {
	const [isMetadataOpen, setIsMetadataOpen] = useState(false);
	const hasMetadata = metadata && Object.keys(metadata).length > 0;

	const formattedDate = format(new Date(timestamp), "MMM d, yyyy HH:mm:ss");

	return (
		<Card className={cn("overflow-hidden", className)}>
			<CardContent className="p-4">
				<div className="flex flex-col gap-4">
					{/* Header */}
					<div className="flex items-start justify-between">
						<div className="flex items-center gap-3">
							<div className="rounded-lg bg-muted p-2">
								<Hash className="size-4 text-muted-foreground" />
							</div>
							<div className="flex flex-col gap-0.5">
								<div className="flex items-center gap-2">
									<span className="font-mono font-semibold text-foreground text-sm">
										#{id}
									</span>
									<CopyButton text={id} />
								</div>
								<span className="text-muted-foreground text-xs">
									{formattedDate}
								</span>
							</div>
						</div>

						{reference && (
							<div className="flex items-center gap-1.5 rounded-md bg-muted/50 px-2 py-1">
								<span className="text-[10px] text-muted-foreground">ref:</span>
								<span className="max-w-[200px] truncate font-mono text-xs">
									{reference}
								</span>
								<CopyButton text={reference} />
							</div>
						)}
					</div>

					{/* Postings */}
					<div className="flex flex-col gap-2 rounded-lg bg-muted/30 p-3">
						<span className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
							Postings
						</span>
						<div className="flex flex-col gap-2">
							{postings.map((posting, index) => (
								<PostingRow
									amount={posting.amount}
									asset={posting.asset}
									destination={posting.destination}
									key={`${posting.source}-${posting.destination}-${index}`}
									source={posting.source}
								/>
							))}
						</div>
					</div>

					{/* Metadata */}
					{hasMetadata && (
						<Collapsible onOpenChange={setIsMetadataOpen} open={isMetadataOpen}>
							<CollapsibleTrigger className="flex items-center gap-2 text-muted-foreground text-sm hover:text-foreground">
								{isMetadataOpen ? (
									<ChevronDown className="size-4" />
								) : (
									<ChevronRight className="size-4" />
								)}
								<span>Metadata</span>
								<span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px]">
									{Object.keys(metadata).length}
								</span>
							</CollapsibleTrigger>
							<CollapsibleContent className="mt-2">
								<div className="rounded-lg bg-muted/30 p-3">
									<pre className="overflow-x-auto font-mono text-xs">
										{JSON.stringify(metadata, null, 2)}
									</pre>
								</div>
							</CollapsibleContent>
						</Collapsible>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
