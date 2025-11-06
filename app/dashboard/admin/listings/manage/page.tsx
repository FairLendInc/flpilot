"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { toast } from "sonner";
import { ListingUpdateDialog } from "@/components/admin/listings/ListingUpdateDialog";
import { ListingDeleteDialog } from "@/components/admin/listings/ListingDeleteDialog";
import { ListingManagementTable } from "@/components/admin/listings/ListingManagementTable";

export default function AdminListingsManagePage() {
	const listings = useQuery(api.listings.getAvailableListingsWithMortgages);
	const [editingListing, setEditingListing] = useState<{
		id: Id<"listings">;
		visible: boolean;
		locked: boolean;
	} | null>(null);
	const [deletingListing, setDeletingListing] = useState<{
		id: Id<"listings">;
		address: string;
		locked: boolean;
		comparablesCount: number;
	} | null>(null);

	const updateListing = useMutation(api.listings.updateListing);
	const deleteListing = useMutation(api.listings.deleteListing);

	function handleEdit(
		listingId: Id<"listings">,
		currentVisible: boolean,
		currentLocked: boolean
	) {
		setEditingListing({
			id: listingId,
			visible: currentVisible,
			locked: currentLocked,
		});
	}

	async function handleSaveEdit(data: { visible: boolean; locked: boolean }) {
		if (!editingListing) return;

		try {
			await updateListing({
				listingId: editingListing.id,
				...data,
			});
			toast.success("Listing updated successfully");
			setEditingListing(null);
		} catch (error) {
			toast.error(
				`Failed to update listing: ${
					error instanceof Error ? error.message : "Unknown error"
				}`
			);
		}
	}

	function handleDeleteClick(
		listingId: Id<"listings">,
		address: string,
		locked: boolean
	) {
		// Count comparables for this listing
		const comparablesCount = 0; // TODO: Get actual count from query if needed
		setDeletingListing({ id: listingId, address, locked, comparablesCount });
	}

	async function handleDeleteConfirm(force = false) {
		if (!deletingListing) return;

		try {
			await deleteListing({
				listingId: deletingListing.id,
				force,
			});
			toast.success("Listing deleted successfully");
			setDeletingListing(null);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";

			toast.error(`Failed to delete listing: ${errorMessage}`);
		}
	}

	if (!listings) {
		return (
			<>
				<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
					<SidebarTrigger className="-ml-1" />
					<Separator className="mr-2 h-4" orientation="vertical" />
					<div>
						<h1 className="font-semibold text-lg">Manage Listings</h1>
						<p className="text-muted-foreground text-sm">
							View, edit, and delete marketplace listings
						</p>
					</div>
				</header>
				<div className="flex flex-1 items-center justify-center">
					<p className="text-muted-foreground">Loading listings...</p>
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
					<h1 className="font-semibold text-lg">Manage Listings</h1>
					<p className="text-muted-foreground text-sm">
						View, edit, and delete marketplace listings
					</p>
				</div>
			</header>
			<div className="flex flex-1 flex-col gap-6 p-6">
				<ListingManagementTable
					listings={listings}
					onEdit={handleEdit}
					onDelete={handleDeleteClick}
				/>

				{/* Dialogs */}
				<ListingUpdateDialog
					open={editingListing !== null}
					onOpenChange={(open) => !open && setEditingListing(null)}
					listingId={editingListing?.id ?? null}
					initialVisible={editingListing?.visible ?? true}
					initialLocked={editingListing?.locked ?? false}
					onSave={handleSaveEdit}
				/>

				<ListingDeleteDialog
					open={deletingListing !== null}
					onOpenChange={(open) => !open && setDeletingListing(null)}
					listingId={deletingListing?.id ?? null}
					listingAddress={deletingListing?.address}
					isLocked={deletingListing?.locked}
					comparablesCount={deletingListing?.comparablesCount}
					onConfirm={handleDeleteConfirm}
				/>
			</div>
		</>
	);
}

