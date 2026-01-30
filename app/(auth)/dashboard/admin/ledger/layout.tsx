"use client";

import { Suspense } from "react";
import { LedgerProvider } from "@/components/admin/ledger/LedgerContext";
import { LedgerSelector } from "@/components/admin/ledger/LedgerSelector";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

function LedgerSelectorFallback() {
	return <div className="h-8 w-[200px] animate-pulse rounded-md bg-muted" />;
}

export default function LedgerLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<Suspense fallback={null}>
			<LedgerProvider>
				<header className="flex h-16 shrink-0 items-center justify-between border-b px-4">
					<div className="flex items-center gap-2">
						<SidebarTrigger className="-ml-1" />
						<Separator className="mr-2 h-4" orientation="vertical" />
						<h1 className="font-semibold text-lg">Ledger View</h1>
					</div>
					<div className="flex items-center gap-4">
						<Suspense fallback={<LedgerSelectorFallback />}>
							<LedgerSelector />
						</Suspense>
					</div>
				</header>
				<div className="flex flex-1 flex-col overflow-hidden">{children}</div>
			</LedgerProvider>
		</Suspense>
	);
}
