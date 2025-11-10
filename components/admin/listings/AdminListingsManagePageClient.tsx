"use client";

import type { Preloaded } from "convex/react";
import { useMutation, usePreloadedQuery, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { ListingDeleteDialog } from "@/components/admin/listings/ListingDeleteDialog";
import { ListingManagementTable } from "@/components/admin/listings/ListingManagementTable";
import { ListingUpdateDialog } from "@/components/admin/listings/ListingUpdateDialog";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type Props = {
	preloaded: Preloaded<typeof api.listings.getAvailableListingsWithMortgages>;
};

export function AdminListingsManagePageClient({ preloaded }: Props) {
	const listings = usePreloadedQuery(preloaded);

	const [editingListing, setEditingListing] = useState<{
		id: Id<"listings">;
		visible: boolean;
		locked: boolean;
	} | null>(null);
	const [deletingListing, setDeletingListing] = useState<{
		id: Id<"listings">;
		address: string;
		locked: boolean;
	} | null>(null);

	const updateListing = useMutation(api.listings.updateListing);
	const deleteListing = useMutation(api.listings.deleteListing);

	// Fetch comparables count when a listing is selected for deletion
	const comparablesCount = useQuery(
		api.comparables.getComparablesCountForListing,
		deletingListing ? { listingId: deletingListing.id } : "skip"
	);

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
		setDeletingListing({ id: listingId, address, locked });
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
					onDelete={handleDeleteClick}
					onEdit={handleEdit}
				/>

				{/* Dialogs */}
				<ListingUpdateDialog
					initialLocked={editingListing?.locked ?? false}
					initialVisible={editingListing?.visible ?? true}
					listingId={editingListing?.id ?? null}
					onOpenChange={(open) => !open && setEditingListing(null)}
					onSave={handleSaveEdit}
					open={editingListing !== null}
				/>

				<ListingDeleteDialog
					comparablesCount={comparablesCount}
					isLocked={deletingListing?.locked}
					listingAddress={deletingListing?.address}
					listingId={deletingListing?.id ?? null}
					onConfirm={handleDeleteConfirm}
					onOpenChange={(open) => !open && setDeletingListing(null)}
					open={deletingListing !== null}
				/>
			</div>
		</>
	);
}
