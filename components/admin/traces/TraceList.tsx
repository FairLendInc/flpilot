"use client";

import { api } from "@/convex/_generated/api";
import { useAuthenticatedQuery } from "@/convex/lib/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Activity,
	AlertCircle,
	CheckCircle2,
	Clock,
	Layers,
	Search,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

function formatDuration(ms: number | undefined): string {
	if (ms === undefined || ms === null) return "—";
	if (ms < 1) return "<1ms";
	if (ms < 1000) return `${Math.round(ms)}ms`;
	return `${(ms / 1000).toFixed(2)}s`;
}

function formatTime(timestamp: number): string {
	return new Date(timestamp).toLocaleString(undefined, {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		fractionalSecondDigits: 3,
	});
}

function StatusBadge({ status }: { status: string }) {
	if (status === "error") {
		return (
			<Badge variant="destructive" className="gap-1">
				<AlertCircle className="h-3 w-3" />
				Error
			</Badge>
		);
	}
	if (status === "completed") {
		return (
			<Badge
				variant="secondary"
				className="gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
			>
				<CheckCircle2 className="h-3 w-3" />
				OK
			</Badge>
		);
	}
	return (
		<Badge variant="outline" className="gap-1">
			<Clock className="h-3 w-3" />
			{status}
		</Badge>
	);
}

export function TraceList() {
	const [functionFilter, setFunctionFilter] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");

	const traces = useAuthenticatedQuery(api.traces.getRecentTraces, {
		limit: 50,
		functionNameFilter: functionFilter || undefined,
		statusFilter: statusFilter === "all" ? undefined : statusFilter,
	});

	return (
		<div className="flex flex-col gap-4">
			{/* Filters */}
			<div className="flex items-center gap-3">
				<div className="relative flex-1">
					<Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Filter by function name..."
						value={functionFilter}
						onChange={(e) => setFunctionFilter(e.target.value)}
						className="pl-9"
					/>
				</div>
				<Select value={statusFilter} onValueChange={setStatusFilter}>
					<SelectTrigger className="w-[140px]">
						<SelectValue placeholder="Status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All</SelectItem>
						<SelectItem value="completed">Completed</SelectItem>
						<SelectItem value="error">Error</SelectItem>
						<SelectItem value="started">In Progress</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Stats */}
			{traces && (
				<div className="grid grid-cols-3 gap-3">
					<Card>
						<CardContent className="flex items-center gap-3 pt-4 pb-4">
							<Activity className="h-5 w-5 text-muted-foreground" />
							<div>
								<p className="font-medium text-2xl">{traces.length}</p>
								<p className="text-muted-foreground text-xs">Total Traces</p>
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="flex items-center gap-3 pt-4 pb-4">
							<AlertCircle className="h-5 w-5 text-destructive" />
							<div>
								<p className="font-medium text-2xl">
									{traces.filter((t) => t.hasErrors).length}
								</p>
								<p className="text-muted-foreground text-xs">With Errors</p>
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="flex items-center gap-3 pt-4 pb-4">
							<Layers className="h-5 w-5 text-muted-foreground" />
							<div>
								<p className="font-medium text-2xl">
									{traces.reduce((sum, t) => sum + t.spanCount, 0)}
								</p>
								<p className="text-muted-foreground text-xs">Total Spans</p>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Table */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Recent Traces</CardTitle>
				</CardHeader>
				<CardContent>
					{traces ? traces.length === 0 ? (
						<div className="py-8 text-center text-muted-foreground">
							<Activity className="mx-auto mb-2 h-8 w-8 opacity-50" />
							<p>No traces found</p>
							<p className="text-xs">
								Set TRACING_ENABLED=true and use createTracedMutation/Action to
								start recording
							</p>
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Function</TableHead>
									<TableHead>Type</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Duration</TableHead>
									<TableHead>Spans</TableHead>
									<TableHead>Time</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{traces.map((trace) => (
									<TableRow key={trace.traceId} className="cursor-pointer">
										<TableCell>
											<Link
												href={`/dashboard/admin/traces/${trace.traceId}`}
												className="font-mono text-sm hover:underline"
											>
												{trace.rootFunctionName}
											</Link>
										</TableCell>
										<TableCell>
											<Badge variant="outline" className="font-mono text-xs">
												{trace.rootFunctionType}
											</Badge>
										</TableCell>
										<TableCell>
											<StatusBadge status={trace.status} />
										</TableCell>
										<TableCell className="font-mono text-sm">
											{formatDuration(trace.duration)}
										</TableCell>
										<TableCell>
											<span className="font-mono text-sm">
												{trace.spanCount}
											</span>
										</TableCell>
										<TableCell className="text-muted-foreground text-xs">
											{formatTime(trace.startTime)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					) : (
						<div className="space-y-3">
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
