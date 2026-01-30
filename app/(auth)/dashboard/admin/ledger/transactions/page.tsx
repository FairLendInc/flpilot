"use client";

import { TransactionList } from "@/components/admin/ledger/TransactionList";

export default function TransactionsPage() {
	return (
		<div className="flex flex-col gap-6 overflow-auto p-6">
			<div>
				<h2 className="font-bold text-2xl tracking-tight">Transactions</h2>
				<p className="text-muted-foreground text-sm">
					View all transactions recorded in the selected ledger.
				</p>
			</div>

			<TransactionList />
		</div>
	);
}
