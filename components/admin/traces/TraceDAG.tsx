"use client";

import { Badge } from "@/components/ui/badge";

type Span = {
	_id: string;
	traceId: string;
	spanId: string;
	parentSpanId?: string;
	functionName: string;
	kind: string;
	status: string;
	startedAt: number;
	endedAt?: number;
	durationMs?: number;
	error?: { message: string; code?: string };
};

type TraceDAGProps = {
	spans: Span[];
	selectedSpanId: string | null;
	onSelectSpan: (spanId: string | null) => void;
};

type TreeNode = Span & { children: TreeNode[] };

function buildTree(spans: Span[]): TreeNode[] {
	const byId = new Map<string, TreeNode>();
	for (const span of spans) {
		byId.set(span.spanId, { ...span, children: [] });
	}

	const roots: TreeNode[] = [];
	for (const node of byId.values()) {
		if (node.parentSpanId && byId.has(node.parentSpanId)) {
			byId.get(node.parentSpanId)!.children.push(node);
		} else {
			roots.push(node);
		}
	}

	return roots;
}

function statusColor(status: string) {
	switch (status) {
		case "completed":
			return "default";
		case "error":
			return "destructive";
		default:
			return "secondary";
	}
}

function kindBadgeColor(kind: string) {
	switch (kind) {
		case "query":
			return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
		case "mutation":
			return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
		case "action":
			return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
		default:
			return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
	}
}

function DAGNode({
	node,
	depth,
	selectedSpanId,
	onSelectSpan,
}: {
	node: TreeNode;
	depth: number;
	selectedSpanId: string | null;
	onSelectSpan: (spanId: string | null) => void;
}) {
	const isSelected = node.spanId === selectedSpanId;
	const duration =
		node.durationMs !== undefined ? `${Math.round(node.durationMs)}ms` : "-";

	return (
		<div style={{ marginLeft: depth * 24 }}>
			<button
				className={`mb-1 flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
					isSelected
						? "border-primary bg-primary/5"
						: "border-transparent hover:bg-muted/50"
				}`}
				onClick={() => onSelectSpan(isSelected ? null : node.spanId)}
				type="button"
			>
				{/* Connector line */}
				{depth > 0 && <span className="text-muted-foreground">└</span>}

				{/* Kind badge */}
				<span
					className={`inline-flex rounded px-1.5 py-0.5 font-medium text-xs ${kindBadgeColor(node.kind)}`}
				>
					{node.kind}
				</span>

				{/* Function name */}
				<span className="flex-1 truncate font-mono text-xs">
					{node.functionName}
				</span>

				{/* Duration */}
				<span className="text-muted-foreground text-xs tabular-nums">
					{duration}
				</span>

				{/* Status */}
				<Badge className="text-xs" variant={statusColor(node.status)}>
					{node.status}
				</Badge>
			</button>

			{node.children.map((child) => (
				<DAGNode
					depth={depth + 1}
					key={child.spanId}
					node={child}
					onSelectSpan={onSelectSpan}
					selectedSpanId={selectedSpanId}
				/>
			))}
		</div>
	);
}

export function TraceDAG({
	spans,
	selectedSpanId,
	onSelectSpan,
}: TraceDAGProps) {
	const roots = buildTree(spans);

	if (roots.length === 0) {
		return (
			<div className="flex h-32 items-center justify-center text-muted-foreground">
				No span hierarchy to display.
			</div>
		);
	}

	return (
		<div className="p-4">
			{roots.map((root) => (
				<DAGNode
					depth={0}
					key={root.spanId}
					node={root}
					onSelectSpan={onSelectSpan}
					selectedSpanId={selectedSpanId}
				/>
			))}
		</div>
	);
}
