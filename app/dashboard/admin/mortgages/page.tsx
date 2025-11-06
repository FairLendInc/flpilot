"use client";

import { Button } from "@heroui/react";
import { useQuery } from "convex/react";
import { Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { MortgageDeleteDialog } from "./components/MortgageDeleteDialog";
import { MortgageUpdateForm } from "./components/MortgageUpdateForm";

export default function AdminMortgagesPage() {
	const mortgages = useQuery(api.mortgages.getAllMortgages);
	const [editingMortgageId, setEditingMortgageId] = useState<
		Id<"mortgages"> | null
	>(null);
	const [deletingMortgageId, setDeletingMortgageId] = useState<
		Id<"mortgages"> | null
	>(null);

	if (mortgages === undefined) {
		return (
			<>
				<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
					<SidebarTrigger className="-ml-1" />
					<Separator className="mr-2 h-4" orientation="vertical" />
					<h1 className="font-semibold text-lg">Mortgage Management</h1>
				</header>
				<div className="flex flex-1 flex-col gap-6 p-6">
					<Card>
						<CardContent className="flex flex-col items-center justify-center py-12">
							<p className="text-muted-foreground text-sm">Loading mortgages...</p>
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
				<h1 className="font-semibold text-lg">Mortgage Management</h1>
			</header>

			<div className="flex flex-1 flex-col gap-6 p-6">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="font-semibold text-xl">All Mortgages</h2>
						<p className="text-muted-foreground text-sm">
							Manage mortgage records and their details
						</p>
					</div>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Mortgages ({mortgages.length})</CardTitle>
					</CardHeader>
					<CardContent>
						{mortgages.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-12">
								<p className="text-muted-foreground text-sm">
									No mortgages found.
								</p>
							</div>
						) : (
							<div className="space-y-4">
								{mortgages.map((mortgage) => (
									<div
										key={mortgage._id}
										className="flex items-center justify-between rounded-md border border-border bg-surface-2 p-4"
									>
										<div className="flex-1">
											<div className="flex items-center gap-2">
												<h3 className="font-medium text-foreground">
													Mortgage {mortgage._id}
												</h3>
												<span className="rounded-full bg-primary/10 px-2 py-1 text-primary text-xs">
													{mortgage.status}
												</span>
											</div>
											<p className="mt-1 text-foreground/60 text-sm">
												${mortgage.loanAmount.toLocaleString()} @{" "}
												{mortgage.interestRate}% • {mortgage.mortgageType}
											</p>
											<p className="mt-1 text-foreground/60 text-sm">
												{mortgage.address.street}, {mortgage.address.city},{" "}
												{mortgage.address.state}
											</p>
										</div>
										<div className="flex items-center gap-2">
											<Button
												isIconOnly
												size="sm"
												variant="ghost"
												onPress={() => setEditingMortgageId(mortgage._id)}
											>
												<Edit className="h-4 w-4" />
											</Button>
											<Button
												isIconOnly
												size="sm"
												variant="ghost"
												onPress={() => setDeletingMortgageId(mortgage._id)}
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

				{editingMortgageId && (
					<Dialog
						open={editingMortgageId !== null}
						onOpenChange={(open) => !open && setEditingMortgageId(null)}
					>
						<DialogContent className="max-w-2xl">
							<DialogHeader>
								<DialogTitle>Edit Mortgage</DialogTitle>
							</DialogHeader>
							<MortgageUpdateForm
								mortgageId={editingMortgageId}
								onSuccess={() => setEditingMortgageId(null)}
							/>
						</DialogContent>
					</Dialog>
				)}

				{deletingMortgageId && (
					<MortgageDeleteDialog
						mortgageId={deletingMortgageId}
						open={deletingMortgageId !== null}
						onOpenChange={(open) => !open && setDeletingMortgageId(null)}
						onSuccess={() => setDeletingMortgageId(null)}
					/>
				)}
			</div>
		</>
	);
}

