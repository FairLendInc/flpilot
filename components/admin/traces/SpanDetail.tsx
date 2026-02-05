"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Id } from "@/convex/_generated/dataModel";
import {
	AlertCircle,
	CheckCircle2,
	Clock,
	Code2,
	ShieldCheck,
	Timer,
} from "lucide-react";

type SpanData = {
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
		fractionalSecondDigits: 3,
	});
}

function JsonViewer({ data, label }: { data: unknown; label: string }) {
	if (data === undefined || data === null) {
		return (
			<div className="py-4 text-center text-muted-foreground text-sm">
				No {label.toLowerCase()} data
			</div>
		);
	}

	let formatted: string;
	try {
		formatted = JSON.stringify(data, null, 2);
	} catch {
		formatted = String(data);
	}

	return (
		<ScrollArea className="max-h-[400px]">
			<pre className="whitespace-pre-wrap rounded-md bg-muted/50 p-4 font-mono text-xs leading-relaxed">
				{formatted}
			</pre>
		</ScrollArea>
	);
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="flex items-start gap-3 py-1.5">
			<span className="w-28 shrink-0 text-muted-foreground text-xs">
				{label}
			</span>
			<span className="min-w-0 flex-1 font-mono text-xs">{value}</span>
		</div>
	);
}

export function SpanDetail({ span }: { span: SpanData | null }) {
	if (!span) {
		return (
			<Card className="h-full">
				<CardContent className="flex h-full items-center justify-center py-12">
					<div className="text-center text-muted-foreground">
						<Code2 className="mx-auto mb-2 h-8 w-8 opacity-50" />
						<p className="text-sm">Select a span to view details</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="h-full">
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<CardTitle className="font-mono text-base">
						{span.functionName}
					</CardTitle>
					<div className="flex items-center gap-2">
						<Badge variant="outline" className="font-mono text-xs">
							{span.functionType}
						</Badge>
						{span.status === "error" ? (
							<Badge variant="destructive" className="gap-1">
								<AlertCircle className="h-3 w-3" />
								Error
							</Badge>
						) : span.status === "completed" ? (
							<Badge
								variant="secondary"
								className="gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
							>
								<CheckCircle2 className="h-3 w-3" />
								OK
							</Badge>
						) : (
							<Badge variant="outline" className="gap-1">
								<Clock className="h-3 w-3" />
								{span.status}
							</Badge>
						)}
					</div>
				</div>
			</CardHeader>

			<CardContent>
				{/* Metadata */}
				<div className="mb-4 rounded-md border p-3">
					<div className="mb-2 flex items-center gap-2">
						<Timer className="h-4 w-4 text-muted-foreground" />
						<span className="font-medium text-sm">Timing</span>
					</div>
					<MetaRow label="Duration" value={formatDuration(span.duration)} />
					<MetaRow label="Start" value={formatTimestamp(span.startTime)} />
					{span.endTime && (
						<MetaRow label="End" value={formatTimestamp(span.endTime)} />
					)}
					<Separator className="my-2" />
					<MetaRow label="Trace ID" value={span.traceId} />
					<MetaRow label="Span ID" value={span.spanId} />
					{span.parentSpanId && (
						<MetaRow label="Parent Span" value={span.parentSpanId} />
					)}
					{span.requestId && (
						<MetaRow label="Request ID" value={span.requestId} />
					)}
					{span.truncated && (
						<MetaRow
							label="Truncated"
							value={
								<Badge variant="outline" className="text-xs text-yellow-600">
									Payload was truncated due to size limits
								</Badge>
							}
						/>
					)}
				</div>

				{/* Auth Context */}
				{span.authContext && (
					<div className="mb-4 rounded-md border p-3">
						<div className="mb-2 flex items-center gap-2">
							<ShieldCheck className="h-4 w-4 text-muted-foreground" />
							<span className="font-medium text-sm">Auth Context</span>
						</div>
						{span.authContext.subject && (
							<MetaRow label="Subject" value={span.authContext.subject} />
						)}
						{span.authContext.role && (
							<MetaRow
								label="Role"
								value={<Badge variant="outline">{span.authContext.role}</Badge>}
							/>
						)}
						{span.authContext.org_id && (
							<MetaRow label="Org ID" value={span.authContext.org_id} />
						)}
						{span.authContext.permissions &&
							span.authContext.permissions.length > 0 && (
								<MetaRow
									label="Permissions"
									value={
										<div className="flex flex-wrap gap-1">
											{span.authContext.permissions.map((p) => (
												<Badge
													key={p}
													variant="outline"
													className="text-[10px]"
												>
													{p}
												</Badge>
											))}
										</div>
									}
								/>
							)}
					</div>
				)}

				{/* Payload Tabs */}
				<Tabs defaultValue={span.error ? "error" : "args"}>
					<TabsList className="w-full">
						<TabsTrigger value="args" className="flex-1">
							Arguments
						</TabsTrigger>
						<TabsTrigger value="result" className="flex-1">
							Result
						</TabsTrigger>
						{span.error && (
							<TabsTrigger value="error" className="flex-1 text-destructive">
								Error
							</TabsTrigger>
						)}
					</TabsList>

					<TabsContent value="args">
						<JsonViewer data={span.args} label="Arguments" />
					</TabsContent>

					<TabsContent value="result">
						<JsonViewer data={span.result} label="Result" />
					</TabsContent>

					{span.error && (
						<TabsContent value="error">
							<div className="space-y-3">
								<div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
									<p className="font-mono text-destructive text-sm">
										{span.error.message}
									</p>
								</div>
								{span.error.stack && (
									<ScrollArea className="max-h-[300px]">
										<pre className="whitespace-pre-wrap rounded-md bg-muted/50 p-3 font-mono text-[11px] text-muted-foreground leading-relaxed">
											{span.error.stack}
										</pre>
									</ScrollArea>
								)}
							</div>
						</TabsContent>
					)}
				</Tabs>
			</CardContent>
		</Card>
	);
}
