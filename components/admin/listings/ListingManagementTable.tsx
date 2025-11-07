"use client";

import { Edit, Eye, EyeOff, Lock, Trash2, Unlock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { Id } from "@/convex/_generated/dataModel";

export type ListingWithMortgage = {
	listing: {
		_id: Id<"listings">;
		mortgageId: Id<"mortgages">;
		visible: boolean;
		locked: boolean;
		lockedBy?: Id<"users">;
		_creationTime: number;
	};
	mortgage: {
		_id: Id<"mortgages">;
		loanAmount: number;
		status: string;
		address: {
			street: string;
			city: string;
			state: string;
			zip: string;
		};
	};
};

type ListingManagementTableProps = {
	listings: ListingWithMortgage[];
	onEdit: (
		listingId: Id<"listings">,
		visible: boolean,
		locked: boolean
	) => void;
	onDelete: (
		listingId: Id<"listings">,
		address: string,
		locked: boolean
	) => void;
};

export function ListingManagementTable({
	listings,
	onEdit,
	onDelete,
}: ListingManagementTableProps) {
	if (listings.length === 0) {
		return (
			<div className="flex flex-1 items-center justify-center py-12">
				<p className="text-muted-foreground">No listings found</p>
			</div>
		);
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Property Address</TableHead>
					<TableHead>Loan Amount</TableHead>
					<TableHead>Status</TableHead>
					<TableHead>Visibility</TableHead>
					<TableHead>Lock Status</TableHead>
					<TableHead className="text-right">Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{listings.map(({ listing, mortgage }) => (
					<TableRow key={listing._id}>
						<TableCell>
							<div>
								<p className="font-medium">{mortgage.address.street}</p>
								<p className="text-muted-foreground text-sm">
									{mortgage.address.city}, {mortgage.address.state}{" "}
									{mortgage.address.zip}
								</p>
							</div>
						</TableCell>
						<TableCell>${mortgage.loanAmount.toLocaleString()}</TableCell>
						<TableCell>
							<Badge
								variant={mortgage.status === "active" ? "default" : "secondary"}
							>
								{mortgage.status}
							</Badge>
						</TableCell>
						<TableCell>
							<div className="flex items-center gap-2">
								{listing.visible ? (
									<>
										<Eye className="h-4 w-4 text-green-600" />
										<span className="text-sm">Visible</span>
									</>
								) : (
									<>
										<EyeOff className="h-4 w-4 text-muted-foreground" />
										<span className="text-sm">Hidden</span>
									</>
								)}
							</div>
						</TableCell>
						<TableCell>
							<div className="flex items-center gap-2">
								{listing.locked ? (
									<>
										<Lock className="h-4 w-4 text-orange-600" />
										<span className="text-sm">Locked</span>
									</>
								) : (
									<>
										<Unlock className="h-4 w-4 text-muted-foreground" />
										<span className="text-sm">Unlocked</span>
									</>
								)}
							</div>
						</TableCell>
						<TableCell className="text-right">
							<div className="flex justify-end gap-2">
								<Button
									onClick={() =>
										onEdit(listing._id, listing.visible, listing.locked)
									}
									size="sm"
									variant="outline"
								>
									<Edit className="mr-2 h-4 w-4" />
									Edit
								</Button>
								<Button
									onClick={() =>
										onDelete(
											listing._id,
											`${mortgage.address.street}, ${mortgage.address.city}, ${mortgage.address.state} ${mortgage.address.zip}`,
											listing.locked
										)
									}
									size="sm"
									variant="destructive"
								>
									<Trash2 className="mr-2 h-4 w-4" />
									Delete
								</Button>
							</div>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}
