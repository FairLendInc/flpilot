import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { DealKanbanBoard } from "../../admin/deals/components/DealKanbanBoard";

export default function InvestorDealsPage() {
	return (
		<>
			<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator className="mr-2 h-4" orientation="vertical" />
				<h1 className="font-semibold text-lg">My Deals</h1>
			</header>

			<div className="flex flex-1 flex-col gap-6 p-6">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="font-bold text-3xl tracking-tight">My Deals</h2>
						<p className="mt-1 text-muted-foreground">
							Track the progress of your mortgage investments
						</p>
					</div>
				</div>

				<DealKanbanBoard
					readOnly
					dealBasePath="/dashboard/investor/deals"
				/>
			</div>
		</>
	);
}
