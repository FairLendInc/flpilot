"use client";

import { useConvexAuth } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { api } from "@/convex/_generated/api";
import { useAuthenticatedQuery } from "@/convex/lib/client";

type StatusFilter = "started" | "completed" | "error" | undefined;

function statusColor(status: string) {
	switch (status) {
		case "completed":
			return "default";
		case "error":
			return "destructive";
		case "started":
			return "secondary";
		default:
			return "outline";
	}
}

function formatDuration(ms: number | undefined) {
	if (ms === undefined) return "-";
	if (ms < 1) return "<1ms";
	if (ms < 1000) return `${Math.round(ms)}ms`;
	return `${(ms / 1000).toFixed(2)}s`;
}

function formatTime(ts: number) {
	return new Date(ts).toLocaleString();
}

export default function TracesListPage() {
	const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
	const [statusFilter, setStatusFilter] = useState<StatusFilter>(undefined);

	const traces = useAuthenticatedQuery(
		api.lib.telemetry.queries.listTraceRuns,
		{ status: statusFilter, limit: 100 }
	);

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

	return (
		<>
			<header className="flex h-16 shrink-0 items-center justify-between border-b px-4">
				<div className="flex items-center gap-2">
					<SidebarTrigger className="-ml-1" />
					<Separator className="mr-2 h-4" orientation="vertical" />
					<h1 className="font-semibold text-lg">Traces</h1>
				</div>
				<div className="flex items-center gap-2">
					{(["all", "completed", "error", "started"] as const).map((filter) => (
						<button
							className={`rounded-md px-3 py-1 text-sm transition-colors ${
								(filter === "all" && !statusFilter) || filter === statusFilter
									? "bg-primary text-primary-foreground"
									: "bg-muted text-muted-foreground hover:bg-muted/80"
							}`}
							key={filter}
							onClick={() =>
								setStatusFilter(filter === "all" ? undefined : filter)
							}
							type="button"
						>
							{filter === "all" ? "All" : filter}
						</button>
					))}
				</div>
			</header>

			<div className="flex-1 overflow-auto p-4">
				{traces ? (
					traces.length === 0 ? (
						<div className="flex h-32 items-center justify-center text-muted-foreground">
							No traces found. Enable telemetry with OTEL_ENABLED=true.
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Trace ID</TableHead>
									<TableHead>Root Function</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Duration</TableHead>
									<TableHead>Spans</TableHead>
									<TableHead>Started</TableHead>
									<TableHead>Request ID</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{traces.map((trace) => (
									<TableRow key={trace._id}>
										<TableCell>
											<Link
												className="font-mono text-blue-600 text-sm hover:underline dark:text-blue-400"
												href={`/dashboard/admin/traces/${trace.traceId}`}
											>
												{trace.traceId.substring(0, 12)}...
											</Link>
										</TableCell>
										<TableCell className="font-mono text-sm">
											{trace.rootFunction}
										</TableCell>
										<TableCell>
											<Badge variant={statusColor(trace.status)}>
												{trace.status}
											</Badge>
										</TableCell>
										<TableCell className="tabular-nums">
											{formatDuration(trace.durationMs)}
										</TableCell>
										<TableCell className="tabular-nums">
											{trace.spanCount ?? 0}
										</TableCell>
										<TableCell className="text-muted-foreground text-sm">
											{formatTime(trace.startedAt)}
										</TableCell>
										<TableCell className="font-mono text-muted-foreground text-xs">
											{trace.requestId ?? "-"}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)
				) : (
					<div className="flex h-32 items-center justify-center text-muted-foreground">
						Loading traces...
					</div>
				)}
			</div>
		</>
	);
}
