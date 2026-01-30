import { redirect } from "next/navigation";

export default function LedgerPage() {
	redirect("/dashboard/admin/ledger/accounts");
}
