"use client";

import { useConvexAuth } from "convex/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { SpanInspector } from "@/components/admin/traces/SpanInspector";
import { TraceDAG } from "@/components/admin/traces/TraceDAG";
import { TraceTimeline } from "@/components/admin/traces/TraceTimeline";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { api } from "@/convex/_generated/api";
import { useAuthenticatedQuery } from "@/convex/lib/client";

type TabId = "dag" | "timeline" | "inspector";

export default function TraceDetailPage() {
	const params = useParams<{ traceId: string }>();
	const traceId = params.traceId;
	const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
	const [activeTab, setActiveTab] = useState<TabId>("dag");
	const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);

	const traceRun = useAuthenticatedQuery(
		api.lib.telemetry.queries.getTraceRun,
		{ traceId }
	);

	const spans = useAuthenticatedQuery(api.lib.telemetry.queries.getTraceSpans, {
		traceId,
	});

	if (authLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	if (!isAuthenticated) {
		return (
			<div className="flex h-64 items-center justify-center text-muted-foreground">
				Sign in required
			</div>
		);
	}

	const tabs: { id: TabId; label: string }[] = [
		{ id: "dag", label: "Call Graph" },
		{ id: "timeline", label: "Timeline" },
		{ id: "inspector", label: "Span Inspector" },
	];

	return (
		<>
			<header className="flex h-16 shrink-0 items-center justify-between border-b px-4">
				<div className="flex items-center gap-2">
					<SidebarTrigger className="-ml-1" />
					<Separator className="mr-2 h-4" orientation="vertical" />
					<Link
						className="text-muted-foreground text-sm hover:text-foreground"
						href="/dashboard/admin/traces"
					>
						Traces
					</Link>
					<span className="text-muted-foreground">/</span>
					<h1 className="font-mono font-semibold text-sm">
						{traceId.substring(0, 16)}...
					</h1>
					{traceRun && (
						<Badge
							variant={
								traceRun.status === "error"
									? "destructive"
									: traceRun.status === "completed"
										? "default"
										: "secondary"
							}
						>
							{traceRun.status}
						</Badge>
					)}
				</div>
				{traceRun && (
					<div className="flex items-center gap-4 text-muted-foreground text-sm">
						<span>
							{traceRun.durationMs !== undefined
								? `${Math.round(traceRun.durationMs)}ms`
								: "-"}
						</span>
						<span>{traceRun.spanCount ?? 0} spans</span>
						{traceRun.requestId && (
							<span className="font-mono text-xs">{traceRun.requestId}</span>
						)}
					</div>
				)}
			</header>

			{/* Tab navigation */}
			<div className="flex border-b px-4">
				{tabs.map((tab) => (
					<button
						className={`border-b-2 px-4 py-2 text-sm transition-colors ${
							activeTab === tab.id
								? "border-primary text-foreground"
								: "border-transparent text-muted-foreground hover:text-foreground"
						}`}
						key={tab.id}
						onClick={() => setActiveTab(tab.id)}
						type="button"
					>
						{tab.label}
					</button>
				))}
			</div>

			{/* Content */}
			<div className="flex-1 overflow-auto">
				{spans ? (
					spans.length === 0 ? (
						<div className="flex h-32 items-center justify-center text-muted-foreground">
							No spans recorded for this trace.
						</div>
					) : (
						<>
							{activeTab === "dag" && (
								<TraceDAG
									onSelectSpan={setSelectedSpanId}
									selectedSpanId={selectedSpanId}
									spans={spans}
								/>
							)}
							{activeTab === "timeline" && (
								<TraceTimeline
									onSelectSpan={setSelectedSpanId}
									selectedSpanId={selectedSpanId}
									spans={spans}
								/>
							)}
							{activeTab === "inspector" && (
								<SpanInspector
									onSelectSpan={setSelectedSpanId}
									selectedSpanId={selectedSpanId}
									spans={spans}
									traceId={traceId}
								/>
							)}
						</>
					)
				) : (
					<div className="flex h-32 items-center justify-center text-muted-foreground">
						Loading spans...
					</div>
				)}
			</div>
		</>
	);
}
