"use client";

import { InvestorAccountsList } from "@/components/admin/ledger/InvestorAccountsList";

export default function InvestorsPage() {
	return (
		<div className="flex flex-col gap-6 overflow-auto p-6">
			<div>
				<h2 className="font-bold text-2xl tracking-tight">Investor Accounts</h2>
				<p className="text-muted-foreground text-sm">
					View investor account provisioning status and create missing ledger
					accounts.
				</p>
			</div>

			<InvestorAccountsList />
		</div>
	);
}
