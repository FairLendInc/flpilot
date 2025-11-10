"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import {
	type DeleteResult,
	MortgageDeleteDialog,
} from "@/components/admin/mortgages/MortgageDeleteDialog";
import {
	type MortgageData,
	MortgageManagementTable,
} from "@/components/admin/mortgages/MortgageManagementTable";
import { MortgageUpdateSheet } from "@/components/admin/mortgages/MortgageUpdateSheet";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export default function AdminMortgagesManagePage() {
	// Query all mortgages with borrower information
	const allMortgages = useQuery(api.mortgages.listAllMortgagesWithBorrowers);

	const [editingMortgageId, setEditingMortgageId] =
		useState<Id<"mortgages"> | null>(null);
	const [deletingMortgage, setDeletingMortgage] = useState<{
		id: Id<"mortgages">;
		address: string;
	} | null>(null);

	const deleteMortgage = useMutation(api.mortgages.deleteMortgage);

	function handleEdit(mortgage: MortgageData) {
		setEditingMortgageId(mortgage._id);
	}

	function handleSaveComplete() {
		// The sheet handles saving internally, this is just for refresh
		setEditingMortgageId(null);
	}

	function handleDeleteClick(mortgageId: Id<"mortgages">, address: string) {
		setDeletingMortgage({ id: mortgageId, address });
	}

	async function handleDeleteConfirm(
		force: boolean
	): Promise<DeleteResult | undefined> {
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
			return result;
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";

			toast.error(`Failed to delete mortgage: ${errorMessage}`);
			return;
		}
	}

	const isLoading = allMortgages === undefined;

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
					mortgages={allMortgages || []}
					onDelete={handleDeleteClick}
					onEdit={handleEdit}
				/>

				{/* Update Sheet */}
				<MortgageUpdateSheet
					mortgageId={editingMortgageId}
					onOpenChange={(open) => !open && setEditingMortgageId(null)}
					onSaveComplete={handleSaveComplete}
					open={editingMortgageId !== null}
				/>

				<MortgageDeleteDialog
					mortgageAddress={deletingMortgage?.address}
					mortgageId={deletingMortgage?.id ?? null}
					onConfirm={handleDeleteConfirm}
					onOpenChange={(open) => !open && setDeletingMortgage(null)}
					open={deletingMortgage !== null}
				/>
			</div>
		</>
	);
}
