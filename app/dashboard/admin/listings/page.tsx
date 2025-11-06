"use client";

import { Button } from "@heroui/react";
import { useQuery } from "convex/react";
import { Edit, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ListingDeleteDialog } from "./components/ListingDeleteDialog";
import { ListingUpdateForm } from "./components/ListingUpdateForm";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

export default function AdminListingsPage() {
	const listings = useQuery(api.listings.getAllListings);
	const [editingListingId, setEditingListingId] = useState<Id<"listings"> | null>(
		null
	);
	const [deletingListingId, setDeletingListingId] = useState<
		Id<"listings"> | null
	>(null);

	const editingListing = listings?.find((l) => l._id === editingListingId);
	const deletingListing = listings?.find((l) => l._id === deletingListingId);

	if (listings === undefined) {
		return (
			<>
				<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
					<SidebarTrigger className="-ml-1" />
					<Separator className="mr-2 h-4" orientation="vertical" />
					<h1 className="font-semibold text-lg">Listing Management</h1>
				</header>
				<div className="flex flex-1 flex-col gap-6 p-6">
					<Card>
						<CardContent className="flex flex-col items-center justify-center py-12">
							<p className="text-muted-foreground text-sm">Loading listings...</p>
						</CardContent>
					</Card>
				</div>
			</>
		);
	}

	return (
		<>
			<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator className="mr-2 h-4" orientation="vertical" />
				<h1 className="font-semibold text-lg">Listing Management</h1>
			</header>

			<div className="flex flex-1 flex-col gap-6 p-6">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="font-semibold text-xl">All Listings</h2>
						<p className="text-muted-foreground text-sm">
							Manage marketplace listings and their visibility
						</p>
					</div>
					<Button asChild variant="primary">
						<Link href="/dashboard/admin/listings/new">
							<Plus className="h-4 w-4" />
							Create Listing
						</Link>
					</Button>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Listings ({listings.length})</CardTitle>
					</CardHeader>
					<CardContent>
						{listings.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-12">
								<p className="text-muted-foreground text-sm">
									No listings found. Create your first listing to get started.
								</p>
							</div>
						) : (
							<div className="space-y-4">
								{listings.map((listing) => (
									<div
										key={listing._id}
										className="flex items-center justify-between rounded-md border border-border bg-surface-2 p-4"
									>
										<div className="flex-1">
											<div className="flex items-center gap-2">
												<h3 className="font-medium text-foreground">
													Listing {listing._id}
												</h3>
												{listing.visible && (
													<span className="rounded-full bg-success/10 px-2 py-1 text-success text-xs">
														Visible
													</span>
												)}
												{listing.locked && (
													<span className="rounded-full bg-warning/10 px-2 py-1 text-warning text-xs">
														Locked
													</span>
												)}
											</div>
											<p className="mt-1 text-foreground/60 text-sm">
												Mortgage ID: {listing.mortgageId}
											</p>
										</div>
										<div className="flex items-center gap-2">
											<Button
												isIconOnly
												size="sm"
												variant="ghost"
												onPress={() => setEditingListingId(listing._id)}
											>
												<Edit className="h-4 w-4" />
											</Button>
											<Button
												isIconOnly
												size="sm"
												variant="ghost"
												onPress={() => setDeletingListingId(listing._id)}
											>
												<Trash2 className="h-4 w-4 text-destructive" />
											</Button>
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				{editingListing && (
					<Dialog
						open={editingListingId !== null}
						onOpenChange={(open) => !open && setEditingListingId(null)}
					>
						<DialogContent className="max-w-2xl">
							<DialogHeader>
								<DialogTitle>Edit Listing</DialogTitle>
							</DialogHeader>
							<ListingUpdateForm
								listingId={editingListing._id}
								initialVisible={editingListing.visible}
								initialLocked={editingListing.locked ?? false}
								onSuccess={() => setEditingListingId(null)}
							/>
						</DialogContent>
					</Dialog>
				)}

				{deletingListing && (
					<ListingDeleteDialog
						listingId={deletingListing._id}
						isLocked={deletingListing.locked ?? false}
						mortgageId={deletingListing.mortgageId}
						open={deletingListingId !== null}
						onOpenChange={(open) => !open && setDeletingListingId(null)}
						onSuccess={() => setDeletingListingId(null)}
					/>
				)}
			</div>
		</>
	);
}
