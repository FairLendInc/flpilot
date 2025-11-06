"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { toast } from "sonner";
import { MortgageUpdateDialog } from "@/components/admin/mortgages/MortgageUpdateDialog";
import { MortgageDeleteDialog } from "@/components/admin/mortgages/MortgageDeleteDialog";
import {
	MortgageManagementTable,
	type MortgageData,
} from "@/components/admin/mortgages/MortgageManagementTable";

export default function AdminMortgagesManagePage() {
	// Query all mortgages by status
	const activeMortgages = useQuery(api.mortgages.listMortgagesByStatus, {
		status: "active",
	});
	const renewedMortgages = useQuery(api.mortgages.listMortgagesByStatus, {
		status: "renewed",
	});
	const closedMortgages = useQuery(api.mortgages.listMortgagesByStatus, {
		status: "closed",
	});
	const defaultedMortgages = useQuery(api.mortgages.listMortgagesByStatus, {
		status: "defaulted",
	});

	const [editingMortgage, setEditingMortgage] = useState<MortgageData | null>(
		null
	);
	const [deletingMortgage, setDeletingMortgage] = useState<{
		id: Id<"mortgages">;
		address: string;
	} | null>(null);

	const updateMortgage = useMutation(api.mortgages.updateMortgage);
	const deleteMortgage = useMutation(api.mortgages.deleteMortgage);

	// Combine all mortgages
	const allMortgages: MortgageData[] = [
		...(activeMortgages || []),
		...(renewedMortgages || []),
		...(closedMortgages || []),
		...(defaultedMortgages || []),
	];

	function handleEdit(mortgage: MortgageData) {
		setEditingMortgage(mortgage);
	}

	async function handleSaveEdit(data: { loanAmount: number; interestRate: number }) {
		if (!editingMortgage) return;

		try {
			await updateMortgage({
				mortgageId: editingMortgage._id,
				...data,
			});
			toast.success("Mortgage updated successfully");
			setEditingMortgage(null);
		} catch (error) {
			toast.error(
				`Failed to update mortgage: ${
					error instanceof Error ? error.message : "Unknown error"
				}`
			);
		}
	}

	function handleDeleteClick(mortgageId: Id<"mortgages">, address: string) {
		setDeletingMortgage({ id: mortgageId, address });
	}

	async function handleDeleteConfirm(force = false) {
		if (!deletingMortgage) return;

		try {
			const result = await deleteMortgage({
				mortgageId: deletingMortgage.id,
				force,
			});
			toast.success(
				`Mortgage deleted successfully. Deleted: ${result.deletedCounts.listings} listings, ${result.deletedCounts.comparables} comparables, ${result.deletedCounts.ownership} ownership records, ${result.deletedCounts.payments} payments`
			);
			setDeletingMortgage(null);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";

			toast.error(`Failed to delete mortgage: ${errorMessage}`);
		}
	}

	const isLoading =
		!activeMortgages ||
		!renewedMortgages ||
		!closedMortgages ||
		!defaultedMortgages;

	if (isLoading) {
		return (
			<>
				<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
					<SidebarTrigger className="-ml-1" />
					<Separator className="mr-2 h-4" orientation="vertical" />
					<div>
						<h1 className="font-semibold text-lg">Manage Mortgages</h1>
						<p className="text-muted-foreground text-sm">
							View, edit, and delete mortgages
						</p>
					</div>
				</header>
				<div className="flex flex-1 items-center justify-center">
					<p className="text-muted-foreground">Loading mortgages...</p>
				</div>
			</>
		);
	}

	return (
		<>
			<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator className="mr-2 h-4" orientation="vertical" />
				<div>
					<h1 className="font-semibold text-lg">Manage Mortgages</h1>
					<p className="text-muted-foreground text-sm">
						View, edit, and delete mortgages
					</p>
				</div>
		</header>
		<div className="flex flex-1 flex-col gap-6 p-6">
			<MortgageManagementTable
				mortgages={allMortgages}
				onEdit={handleEdit}
				onDelete={handleDeleteClick}
			/>

			{/* Dialogs */}
			<MortgageUpdateDialog
				open={editingMortgage !== null}
				onOpenChange={(open) => !open && setEditingMortgage(null)}
				mortgageId={editingMortgage?._id ?? null}
				initialLoanAmount={editingMortgage?.loanAmount ?? 0}
				initialInterestRate={editingMortgage?.interestRate ?? 0}
				onSave={handleSaveEdit}
			/>

			<MortgageDeleteDialog
				open={deletingMortgage !== null}
				onOpenChange={(open) => !open && setDeletingMortgage(null)}
				mortgageId={deletingMortgage?.id ?? null}
				mortgageAddress={deletingMortgage?.address}
				onConfirm={handleDeleteConfirm}
			/>
		</div>
		</>
	);
}

