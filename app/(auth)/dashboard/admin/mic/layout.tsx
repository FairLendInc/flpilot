"use client";

import { useMICDemo } from "@/components/admin/mic/demo/hooks/useMICDemo";
import { LiveDemoTrigger } from "@/components/admin/mic/demo/LiveDemoTrigger";
import { MICLiveDemoModal } from "@/components/admin/mic/demo/MICLiveDemoModal";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function MICLayout({ children }: { children: React.ReactNode }) {
	const demo = useMICDemo();

	return (
		<>
			<header className="flex h-16 shrink-0 items-center justify-between border-b px-4">
				<div className="flex items-center gap-2">
					<SidebarTrigger className="-ml-1" />
					<Separator className="mr-2 h-4" orientation="vertical" />
					<h1 className="font-semibold text-lg">MIC Management</h1>
				</div>
				<div className="flex items-center gap-4">
					<LiveDemoTrigger onClick={() => demo.setIsOpen(true)} />
				</div>
			</header>
			<div className="flex flex-1 flex-col overflow-hidden">{children}</div>
			<MICLiveDemoModal
				activeTransaction={demo.activeTransaction}
				currentPhase={demo.currentPhase}
				isExecuting={demo.isExecuting}
				isFinished={demo.isFinished}
				ledgerAccounts={demo.ledgerAccounts}
				onNext={demo.isFinished ? demo.proceedToNextPhase : demo.handleNext}
				onOpenChange={demo.setIsOpen}
				onPrevious={demo.handlePrevious}
				open={demo.isOpen}
				phaseConfig={demo.phaseConfig}
			/>
		</>
	);
}
