"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { TraceList } from "@/components/admin/traces/TraceList";

export default function TracesPage() {
	return (
		<>
			<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator className="mr-2 h-4" orientation="vertical" />
				<h1 className="font-semibold text-lg">Traces</h1>
			</header>

			<div className="flex flex-1 flex-col gap-6 p-6">
				<div>
					<h2 className="font-bold text-2xl tracking-tight">
						Backend Observability
					</h2>
					<p className="text-muted-foreground text-sm">
						View execution traces across backend function calls. Enable tracing
						with TRACING_ENABLED=true.
					</p>
				</div>

				<TraceList />
			</div>
		</>
	);
}
