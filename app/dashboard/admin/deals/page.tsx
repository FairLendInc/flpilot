/**
 * Deal Management Kanban Board
 *
 * Admin-only page for managing mortgage purchase deals through their lifecycle.
 * Displays deals in a Kanban board grouped by state, with drag-and-drop to
 * transition between states.
 */

import { AlertBell } from "@/components/alerts/AlertBell";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { DealKanbanBoard } from "./components/DealKanbanBoard";

export const metadata = {
	title: "Deal Management | Admin",
	description: "Manage mortgage purchase deals through their lifecycle",
};

export default function DealsPage() {
	return (
		<>
			<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator className="mr-2 h-4" orientation="vertical" />
				<h1 className="font-semibold text-lg">Deal Management</h1>
				<div className="ml-auto">
					<AlertBell />
				</div>
			</header>

			<div className="flex flex-1 flex-col gap-6 p-6">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="font-bold text-3xl tracking-tight">Active Deals</h2>
						<p className="mt-1 text-muted-foreground">
							Track and manage mortgage purchase deals through completion
						</p>
					</div>
				</div>

				<DealKanbanBoard />
			</div>
		</>
	);
}
