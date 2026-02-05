"use client";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Id } from "@/convex/_generated/dataModel";
import {
	AlertCircle,
	CheckCircle2,
	ChevronDown,
	ChevronRight,
	Clock,
	Minus,
} from "lucide-react";
import { useState } from "react";

type Span = {
	_id: Id<"trace_spans">;
	_creationTime: number;
	traceId: string;
	spanId: string;
	parentSpanId?: string;
	requestId?: string;
	functionName: string;
	functionType: string;
	startTime: number;
	endTime?: number;
	duration?: number;
	status: string;
	args?: unknown;
	result?: unknown;
	error?: { message: string; stack?: string };
	authContext?: {
		subject?: string;
		role?: string;
		org_id?: string;
		permissions?: string[];
	};
	truncated?: boolean;
};

type SpanTreeNode = Span & {
	children: SpanTreeNode[];
	depth: number;
};

function buildSpanTree(spans: Span[]): SpanTreeNode[] {
	const nodeMap = new Map<string, SpanTreeNode>();
	const roots: SpanTreeNode[] = [];

	// Create nodes
	for (const span of spans) {
		nodeMap.set(span.spanId, { ...span, children: [], depth: 0 });
	}

	// Build tree
	for (const node of nodeMap.values()) {
		if (node.parentSpanId && nodeMap.has(node.parentSpanId)) {
			const parent = nodeMap.get(node.parentSpanId);
			if (parent) {
				node.depth = parent.depth + 1;
				parent.children.push(node);
			}
		} else {
			roots.push(node);
		}
	}

	return roots;
}

function formatDuration(ms: number | undefined): string {
	if (ms === undefined || ms === null) return "—";
	if (ms < 1) return "<1ms";
	if (ms < 1000) return `${Math.round(ms)}ms`;
	return `${(ms / 1000).toFixed(2)}s`;
}

function StatusIcon({ status }: { status: string }) {
	if (status === "error") {
		return <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
	}
	if (status === "completed") {
		return (
			<CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
		);
	}
	return <Clock className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" />;
}

function SpanRow({
	node,
	selectedSpanId,
	onSelect,
	traceStartTime,
	traceDuration,
}: {
	node: SpanTreeNode;
	selectedSpanId: string | null;
	onSelect: (spanId: string) => void;
	traceStartTime: number;
	traceDuration: number;
}) {
	const [expanded, setExpanded] = useState(true);
	const hasChildren = node.children.length > 0;
	const isSelected = node.spanId === selectedSpanId;

	// Calculate timing bar position and width
	const offsetPercent =
		traceDuration > 0
			? ((node.startTime - traceStartTime) / traceDuration) * 100
			: 0;
	const widthPercent =
		traceDuration > 0 && node.duration
			? (node.duration / traceDuration) * 100
			: 1;

	return (
		<>
			<button
				type="button"
				className={`flex w-full items-center gap-2 border-b px-2 py-1.5 text-left transition-colors hover:bg-muted/50 ${
					isSelected ? "bg-muted" : ""
				}`}
				onClick={() => onSelect(node.spanId)}
			>
				{/* Indent + expand toggle */}
				<div
					className="flex shrink-0 items-center"
					style={{ paddingLeft: `${node.depth * 16}px` }}
				>
					{hasChildren ? (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								setExpanded(!expanded);
							}}
							className="rounded p-0.5 hover:bg-muted-foreground/20"
						>
							{expanded ? (
								<ChevronDown className="h-3.5 w-3.5" />
							) : (
								<ChevronRight className="h-3.5 w-3.5" />
							)}
						</button>
					) : (
						<Minus className="h-3.5 w-3.5 text-muted-foreground/30" />
					)}
				</div>

				{/* Status icon */}
				<StatusIcon status={node.status} />

				{/* Function name */}
				<span className="min-w-0 flex-1 truncate font-mono text-xs">
					{node.functionName}
				</span>

				{/* Type badge */}
				<Badge variant="outline" className="shrink-0 font-mono text-[10px]">
					{node.functionType}
				</Badge>

				{/* Duration */}
				<span className="w-16 shrink-0 text-right font-mono text-muted-foreground text-xs">
					{formatDuration(node.duration)}
				</span>

				{/* Timing bar */}
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<div className="relative h-4 w-32 shrink-0 rounded bg-muted">
								<div
									className={`absolute top-0.5 bottom-0.5 rounded ${
										node.status === "error"
											? "bg-destructive/70"
											: "bg-blue-500/70"
									}`}
									style={{
										left: `${Math.min(offsetPercent, 99)}%`,
										width: `${Math.max(widthPercent, 1)}%`,
									}}
								/>
							</div>
						</TooltipTrigger>
						<TooltipContent className="font-mono text-xs">
							<p>Start: +{formatDuration(node.startTime - traceStartTime)}</p>
							<p>Duration: {formatDuration(node.duration)}</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>

				{/* Truncation indicator */}
				{node.truncated && (
					<Badge
						variant="outline"
						className="shrink-0 text-[10px] text-yellow-600"
					>
						truncated
					</Badge>
				)}
			</button>

			{/* Children */}
			{expanded &&
				node.children.map((child) => (
					<SpanRow
						key={child.spanId}
						node={child}
						selectedSpanId={selectedSpanId}
						onSelect={onSelect}
						traceStartTime={traceStartTime}
						traceDuration={traceDuration}
					/>
				))}
		</>
	);
}

export function SpanTree({
	spans,
	selectedSpanId,
	onSelectSpan,
}: {
	spans: Span[];
	selectedSpanId: string | null;
	onSelectSpan: (spanId: string) => void;
}) {
	if (spans.length === 0) {
		return (
			<div className="py-8 text-center text-muted-foreground">
				No spans found
			</div>
		);
	}

	const tree = buildSpanTree(spans);
	const traceStartTime = Math.min(...spans.map((s) => s.startTime));
	const traceEndTime = Math.max(...spans.map((s) => s.endTime ?? s.startTime));
	const traceDuration = traceEndTime - traceStartTime;

	return (
		<ScrollArea className="h-[500px]">
			<div className="min-w-[600px]">
				{/* Header */}
				<div className="flex items-center gap-2 border-b bg-muted/30 px-2 py-1.5 font-medium text-muted-foreground text-xs">
					<div className="w-6" />
					<div className="w-4" />
					<div className="flex-1">Function</div>
					<div className="w-16">Type</div>
					<div className="w-16 text-right">Duration</div>
					<div className="w-32 text-center">Timeline</div>
					<div className="w-16" />
				</div>

				{/* Span rows */}
				{tree.map((root) => (
					<SpanRow
						key={root.spanId}
						node={root}
						selectedSpanId={selectedSpanId}
						onSelect={onSelectSpan}
						traceStartTime={traceStartTime}
						traceDuration={traceDuration}
					/>
				))}
			</div>
		</ScrollArea>
	);
}
