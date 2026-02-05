"use client";

import { MortgageOwnershipTable } from "@/components/admin/ledger/MortgageOwnershipTable";

export default function MortgagesPage() {
	return (
		<div className="flex flex-col gap-6 overflow-auto p-6">
			<div>
				<h2 className="font-bold text-2xl tracking-tight">
					Mortgage Ownership
				</h2>
				<p className="text-muted-foreground text-sm">
					View mortgage ownership status in the ledger and mint new ownership
					records.
				</p>
			</div>

			<MortgageOwnershipTable />
		</div>
	);
}
