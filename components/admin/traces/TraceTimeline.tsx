"use client";

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
};

type TraceTimelineProps = {
	spans: Span[];
	selectedSpanId: string | null;
	onSelectSpan: (spanId: string | null) => void;
};

function kindColor(kind: string) {
	switch (kind) {
		case "query":
			return "bg-blue-500";
		case "mutation":
			return "bg-amber-500";
		case "action":
			return "bg-purple-500";
		default:
			return "bg-gray-400";
	}
}

export function TraceTimeline({
	spans,
	selectedSpanId,
	onSelectSpan,
}: TraceTimelineProps) {
	if (spans.length === 0) {
		return (
			<div className="flex h-32 items-center justify-center text-muted-foreground">
				No spans to display.
			</div>
		);
	}

	// Calculate time bounds
	const minStart = Math.min(...spans.map((s) => s.startedAt));
	const maxEnd = Math.max(...spans.map((s) => s.endedAt ?? s.startedAt));
	const totalDuration = maxEnd - minStart || 1; // avoid division by zero

	// Sort by start time
	const sorted = [...spans].sort((a, b) => a.startedAt - b.startedAt);

	return (
		<div className="p-4">
			{/* Time axis header */}
			<div className="mb-2 flex items-center justify-between text-muted-foreground text-xs">
				<span>0ms</span>
				<span>{Math.round(totalDuration)}ms</span>
			</div>

			{/* Span rows */}
			<div className="space-y-1">
				{sorted.map((span) => {
					const startOffset =
						((span.startedAt - minStart) / totalDuration) * 100;
					const duration =
						((span.endedAt ?? span.startedAt) - span.startedAt) / totalDuration;
					const widthPercent = Math.max(duration * 100, 0.5); // min 0.5% visible width
					const isSelected = span.spanId === selectedSpanId;

					return (
						<button
							className={`flex w-full items-center gap-2 rounded border px-2 py-1.5 text-left transition-colors ${
								isSelected
									? "border-primary bg-primary/5"
									: "border-transparent hover:bg-muted/50"
							}`}
							key={span.spanId}
							onClick={() => onSelectSpan(isSelected ? null : span.spanId)}
							type="button"
						>
							{/* Label */}
							<span className="w-48 shrink-0 truncate font-mono text-xs">
								{span.functionName}
							</span>

							{/* Timeline bar */}
							<div className="relative h-5 flex-1 rounded bg-muted/30">
								<div
									className={`absolute top-0 h-full rounded ${kindColor(span.kind)} opacity-80`}
									style={{
										left: `${startOffset}%`,
										width: `${widthPercent}%`,
									}}
								/>
							</div>

							{/* Duration label */}
							<span className="w-16 shrink-0 text-right text-muted-foreground text-xs tabular-nums">
								{span.durationMs !== undefined
									? `${Math.round(span.durationMs)}ms`
									: "-"}
							</span>
						</button>
					);
				})}
			</div>

			{/* Legend */}
			<div className="mt-4 flex items-center gap-4 text-muted-foreground text-xs">
				<span className="flex items-center gap-1">
					<span className="inline-block h-3 w-3 rounded bg-blue-500" />
					query
				</span>
				<span className="flex items-center gap-1">
					<span className="inline-block h-3 w-3 rounded bg-amber-500" />
					mutation
				</span>
				<span className="flex items-center gap-1">
					<span className="inline-block h-3 w-3 rounded bg-purple-500" />
					action
				</span>
				<span className="flex items-center gap-1">
					<span className="inline-block h-3 w-3 rounded bg-gray-400" />
					internal
				</span>
			</div>
		</div>
	);
}
