"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { api } from "@/convex/_generated/api";
import { useAuthenticatedQuery } from "@/convex/lib/client";

type Span = {
	_id: string;
	spanId: string;
	parentSpanId?: string;
	functionName: string;
	kind: string;
	status: string;
	startedAt: number;
	endedAt?: number;
	durationMs?: number;
	attributes?: Record<string, unknown>;
	payloadRef?: string;
	error?: { message: string; code?: string; stack?: string };
};

type SpanInspectorProps = {
	traceId: string;
	spans: Span[];
	selectedSpanId: string | null;
	onSelectSpan: (spanId: string | null) => void;
};

function JsonViewer({ data, label }: { data: unknown; label: string }) {
	const [expanded, setExpanded] = useState(false);
	const content =
		typeof data === "string" ? data : JSON.stringify(data, null, 2);

	return (
		<div className="rounded border">
			<button
				className="flex w-full items-center justify-between px-3 py-2 text-left font-medium text-sm hover:bg-muted/50"
				onClick={() => setExpanded(!expanded)}
				type="button"
			>
				<span>{label}</span>
				<span className="text-muted-foreground text-xs">
					{expanded ? "collapse" : "expand"}
				</span>
			</button>
			{expanded && (
				<div className="border-t">
					<pre className="overflow-auto p-3 text-xs">{content}</pre>
					<div className="border-t px-3 py-1.5">
						<button
							className="text-muted-foreground text-xs hover:text-foreground"
							onClick={() => navigator.clipboard.writeText(content)}
							type="button"
						>
							Copy to clipboard
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

function PayloadViewer({
	traceId,
	spanId,
}: {
	traceId: string;
	spanId: string;
}) {
	const payloads = useAuthenticatedQuery(
		api.lib.telemetry.queries.getSpanPayloads,
		{ traceId, spanId }
	);

	if (!payloads) {
		return (
			<div className="text-muted-foreground text-sm">Loading payloads...</div>
		);
	}

	if (payloads.length === 0) {
		return (
			<div className="text-muted-foreground text-sm">
				No captured payloads. Enable with OTEL_CAPTURE_PAYLOADS=true.
			</div>
		);
	}

	return (
		<div className="space-y-2">
			{payloads.map((payload) => (
				<div key={payload._id}>
					<JsonViewer
						data={payload.content}
						label={`${payload.kind} (${payload.sizeBytes} bytes${payload.redacted ? ", redacted" : ""})`}
					/>
				</div>
			))}
		</div>
	);
}

export function SpanInspector({
	traceId,
	spans,
	selectedSpanId,
	onSelectSpan,
}: SpanInspectorProps) {
	const selectedSpan = selectedSpanId
		? spans.find((s) => s.spanId === selectedSpanId)
		: null;

	return (
		<div className="flex h-full">
			{/* Span list sidebar */}
			<div className="w-64 shrink-0 overflow-auto border-r">
				<div className="p-2 font-medium text-muted-foreground text-xs">
					Spans ({spans.length})
				</div>
				{spans.map((span) => (
					<button
						className={`flex w-full flex-col gap-0.5 border-l-2 px-3 py-2 text-left text-sm transition-colors ${
							span.spanId === selectedSpanId
								? "border-l-primary bg-primary/5"
								: "border-l-transparent hover:bg-muted/50"
						}`}
						key={span.spanId}
						onClick={() => onSelectSpan(span.spanId)}
						type="button"
					>
						<span className="truncate font-mono text-xs">
							{span.functionName}
						</span>
						<div className="flex items-center gap-1">
							<Badge
								className="px-1 py-0 text-[10px]"
								variant={span.status === "error" ? "destructive" : "secondary"}
							>
								{span.kind}
							</Badge>
							<span className="text-[10px] text-muted-foreground tabular-nums">
								{span.durationMs !== undefined
									? `${Math.round(span.durationMs)}ms`
									: "-"}
							</span>
						</div>
					</button>
				))}
			</div>

			{/* Detail panel */}
			<div className="flex-1 overflow-auto p-4">
				{selectedSpan ? (
					<div className="space-y-4">
						{/* Header */}
						<div>
							<h2 className="font-mono font-semibold text-lg">
								{selectedSpan.functionName}
							</h2>
							<div className="mt-1 flex items-center gap-2 text-muted-foreground text-sm">
								<Badge
									variant={
										selectedSpan.status === "error" ? "destructive" : "default"
									}
								>
									{selectedSpan.status}
								</Badge>
								<span>{selectedSpan.kind}</span>
								<span>
									{selectedSpan.durationMs !== undefined
										? `${Math.round(selectedSpan.durationMs)}ms`
										: "-"}
								</span>
							</div>
						</div>

						{/* Metadata */}
						<div className="grid grid-cols-2 gap-2 text-sm">
							<div>
								<span className="text-muted-foreground">Span ID:</span>{" "}
								<span className="font-mono">{selectedSpan.spanId}</span>
							</div>
							{selectedSpan.parentSpanId && (
								<div>
									<span className="text-muted-foreground">Parent:</span>{" "}
									<button
										className="font-mono text-blue-600 hover:underline dark:text-blue-400"
										onClick={() => onSelectSpan(selectedSpan.parentSpanId!)}
										type="button"
									>
										{selectedSpan.parentSpanId}
									</button>
								</div>
							)}
							<div>
								<span className="text-muted-foreground">Started:</span>{" "}
								{new Date(selectedSpan.startedAt).toLocaleString()}
							</div>
							{selectedSpan.endedAt && (
								<div>
									<span className="text-muted-foreground">Ended:</span>{" "}
									{new Date(selectedSpan.endedAt).toLocaleString()}
								</div>
							)}
						</div>

						{/* Error details */}
						{selectedSpan.error && (
							<div className="rounded border border-destructive/30 bg-destructive/5 p-3">
								<div className="font-medium text-destructive text-sm">
									Error
								</div>
								<pre className="mt-1 whitespace-pre-wrap text-xs">
									{selectedSpan.error.message}
								</pre>
								{selectedSpan.error.stack && (
									<pre className="mt-2 max-h-40 overflow-auto text-[10px] text-muted-foreground">
										{selectedSpan.error.stack}
									</pre>
								)}
							</div>
						)}

						{/* Attributes */}
						{selectedSpan.attributes && (
							<JsonViewer data={selectedSpan.attributes} label="Attributes" />
						)}

						{/* Captured payloads */}
						<div>
							<h3 className="mb-2 font-medium text-sm">Captured Payloads</h3>
							<PayloadViewer spanId={selectedSpan.spanId} traceId={traceId} />
						</div>
					</div>
				) : (
					<div className="flex h-32 items-center justify-center text-muted-foreground">
						Select a span to inspect.
					</div>
				)}
			</div>
		</div>
	);
}
