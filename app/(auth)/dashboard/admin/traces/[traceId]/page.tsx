"use client";

import { SpanDetail } from "@/components/admin/traces/SpanDetail";
import { SpanTree } from "@/components/admin/traces/SpanTree";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { useAuthenticatedQuery } from "@/convex/lib/client";
import { ArrowLeft, Clock, Layers, Timer } from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";

function formatDuration(ms: number | undefined): string {
	if (ms === undefined || ms === null) return "—";
	if (ms < 1) return "<1ms";
	if (ms < 1000) return `${Math.round(ms)}ms`;
	return `${(ms / 1000).toFixed(2)}s`;
}

function formatTimestamp(ts: number): string {
	return new Date(ts).toLocaleString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	});
}

export default function TraceDetailPage({
	params,
}: {
	params: Promise<{ traceId: string }>;
}) {
	const { traceId } = use(params);
	const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);

	const spans = useAuthenticatedQuery(api.traces.getTraceSpans, {
		traceId,
	});

	const selectedSpan = spans?.find((s) => s.spanId === selectedSpanId) ?? null;

	// Compute trace-level stats
	const rootSpan = spans?.find((s) => !s.parentSpanId);
	const totalDuration = rootSpan?.duration;
	const hasErrors = spans?.some((s) => s.status === "error");

	return (
		<>
			<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator className="mr-2 h-4" orientation="vertical" />
				<Link href="/dashboard/admin/traces">
					<Button variant="ghost" size="sm" className="gap-1">
						<ArrowLeft className="h-4 w-4" />
						Back
					</Button>
				</Link>
				<Separator className="mr-2 h-4" orientation="vertical" />
				<h1 className="font-semibold text-lg">Trace Detail</h1>
			</header>

			<div className="flex flex-1 flex-col gap-6 p-6">
				{spans ? spans.length === 0 ? (
					<div className="py-12 text-center text-muted-foreground">
						<p>Trace not found or has been cleaned up</p>
						<Link href="/dashboard/admin/traces">
							<Button variant="link" className="mt-2">
								Back to traces
							</Button>
						</Link>
					</div>
				) : (
					<>
						{/* Trace Summary */}
						<div className="grid grid-cols-4 gap-3">
							<Card>
								<CardContent className="flex items-center gap-3 pt-4 pb-4">
									<Timer className="h-5 w-5 text-muted-foreground" />
									<div>
										<p className="font-medium font-mono text-lg">
											{formatDuration(totalDuration)}
										</p>
										<p className="text-muted-foreground text-xs">
											Total Duration
										</p>
									</div>
								</CardContent>
							</Card>
							<Card>
								<CardContent className="flex items-center gap-3 pt-4 pb-4">
									<Layers className="h-5 w-5 text-muted-foreground" />
									<div>
										<p className="font-medium text-lg">{spans.length}</p>
										<p className="text-muted-foreground text-xs">Spans</p>
									</div>
								</CardContent>
							</Card>
							<Card>
								<CardContent className="flex items-center gap-3 pt-4 pb-4">
									<Clock className="h-5 w-5 text-muted-foreground" />
									<div>
										<p className="text-sm">
											{rootSpan ? formatTimestamp(rootSpan.startTime) : "—"}
										</p>
										<p className="text-muted-foreground text-xs">Started</p>
									</div>
								</CardContent>
							</Card>
							<Card>
								<CardContent className="flex items-center gap-3 pt-4 pb-4">
									<div>
										<Badge
											variant={hasErrors ? "destructive" : "secondary"}
											className={
												hasErrors
													? ""
													: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
											}
										>
											{hasErrors ? "Has Errors" : "Success"}
										</Badge>
										<p className="mt-1 text-muted-foreground text-xs">Status</p>
									</div>
								</CardContent>
							</Card>
						</div>

						{/* Trace ID */}
						<div className="flex items-center gap-2 text-muted-foreground text-xs">
							<span>Trace ID:</span>
							<code className="rounded bg-muted px-1.5 py-0.5 font-mono">
								{traceId}
							</code>
							{rootSpan?.requestId && (
								<>
									<span className="mx-1">|</span>
									<span>Request ID:</span>
									<code className="rounded bg-muted px-1.5 py-0.5 font-mono">
										{rootSpan.requestId}
									</code>
								</>
							)}
						</div>

						{/* Span Tree + Detail */}
						<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
							<Card>
								<CardHeader>
									<CardTitle className="text-base">Span Tree</CardTitle>
								</CardHeader>
								<CardContent className="p-0">
									<SpanTree
										spans={spans}
										selectedSpanId={selectedSpanId}
										onSelectSpan={setSelectedSpanId}
									/>
								</CardContent>
							</Card>

							<SpanDetail span={selectedSpan} />
						</div>
					</>
				) : (
					<div className="space-y-4">
						<Skeleton className="h-24 w-full" />
						<Skeleton className="h-64 w-full" />
					</div>
				)}
			</div>
		</>
	);
}
