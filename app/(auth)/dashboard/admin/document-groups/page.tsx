"use client";

import { useMutation, useQuery } from "convex/react";
import { Archive, Edit2, MoreHorizontal, Plus, Search } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

// Type icon component moved outside main component
const GroupIcon = ({ icon, color }: { icon?: string; color?: string }) => {
	if (!icon) {
		return (
			<div
				className="flex h-8 w-8 items-center justify-center rounded-lg font-medium text-sm"
				style={{ backgroundColor: color || "#6B7280", color: "white" }}
			>
				{icon ? icon[0]?.toUpperCase() : "?"}
			</div>
		);
	}

	return (
		<div
			className="flex h-8 w-8 items-center justify-center rounded-lg font-medium text-sm"
			style={{ backgroundColor: color || "#6B7280", color: "white" }}
		>
			{icon[0]?.toUpperCase()}
		</div>
	);
};

type DocumentGroupFormData = {
	name: string;
	displayName: string;
	description: string;
	icon: string;
	color: string;
};

type DocumentGroupType = {
	_id: Id<"document_groups">;
	name: string;
	displayName: string;
	description?: string;
	icon?: string;
	color?: string;
	isDefault?: boolean;
	isActive: boolean;
	createdBy: Id<"users">;
	createdAt: number;
	updatedAt: number;
	isUserEditable: boolean;
	isUserDeletable: boolean;
};

export default function DocumentGroupsPage() {
	const [searchQuery, setSearchQuery] = useState("");
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [editingGroup, setEditingGroup] = useState<DocumentGroupType | null>(
		null
	);
	const [formData, setFormData] = useState<DocumentGroupFormData>({
		name: "",
		displayName: "",
		description: "",
		icon: "",
		color: "#6B7280",
	});

	// Fetch document groups
	const groupsResult = useQuery(api.documentGroups.getDocumentGroups, {
		includeInactive: true,
	});
	const groups = groupsResult;
	const isLoading = groupsResult === undefined;
	const refetch = () => {
		// Placeholder function for data refetching
		// TODO: Implement proper refetch logic if needed
	};

	// Mutations
	const createGroup = useMutation(api.documentGroups.createDocumentGroup);
	const updateGroup = useMutation(api.documentGroups.updateDocumentGroup);
	const deactivateGroup = useMutation(
		api.documentGroups.deactivateDocumentGroup
	);
	const reactivateGroup = useMutation(
		api.documentGroups.reactivateDocumentGroup
	);

	// Filter groups based on search
	const filteredGroups = React.useMemo(() => {
		if (!(groups && searchQuery)) return groups;

		const query = searchQuery.toLowerCase();
		return groups.filter(
			// biome-ignore lint/suspicious/noExplicitAny: Type from Convex query result
			(group: any) =>
				group.name.toLowerCase().includes(query) ||
				group.displayName.toLowerCase().includes(query) ||
				group.description?.toLowerCase().includes(query)
		);
	}, [groups, searchQuery]);

	// Reset form
	const resetForm = () => {
		setFormData({
			name: "",
			displayName: "",
			description: "",
			icon: "",
			color: "#6B7280",
		});
		setEditingGroup(null);
	};

	// Handle form submission
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			if (editingGroup) {
				await updateGroup({
					groupId: editingGroup._id,
					displayName: formData.displayName,
					description: formData.description,
					icon: formData.icon,
					color: formData.color,
				});
				toast.success("Document group updated successfully");
			} else {
				await createGroup({
					name: formData.name,
					displayName: formData.displayName,
					description: formData.description,
					icon: formData.icon,
					color: formData.color,
				});
				toast.success("Document group created successfully");
			}

			setIsCreateDialogOpen(false);
			resetForm();
			refetch();
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Failed to save document group";
			toast.error(message);
		}
	};

	// Handle edit
	const handleEdit = (group: DocumentGroupType) => {
		setEditingGroup(group);
		setFormData({
			name: group.name,
			displayName: group.displayName,
			description: group.description || "",
			icon: group.icon || "",
			color: group.color || "#6B7280",
		});
		setIsCreateDialogOpen(true);
	};

	// Handle delete/deactivate
	const handleDeactivate = async (group: DocumentGroupType) => {
		// TODO: Replace with custom confirmation dialog component
		// Using window.confirm temporarily for admin interface
		if (
			// biome-ignore lint/suspicious/noAlert: Simple confirmation dialog is sufficient for admin interface
			!window.confirm(
				`Are you sure you want to deactivate "${group.displayName}"?`
			)
		) {
			return;
		}

		try {
			await deactivateGroup({ groupId: group._id });
			toast.success("Document group deactivated successfully");
			refetch();
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Failed to deactivate document group";
			toast.error(message);
		}
	};

	// Handle reactivate
	const handleReactivate = async (group: DocumentGroupType) => {
		try {
			await reactivateGroup({ groupId: group._id });
			toast.success("Document group reactivated successfully");
			refetch();
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Failed to reactivate document group";
			toast.error(message);
		}
	};

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="font-bold text-3xl">Document Groups</h1>
						<p className="text-muted-foreground">
							Manage document categorization groups
						</p>
					</div>
				</div>
				<div className="grid gap-4">
					{Array.from({ length: 5 }).map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton list for loading state
						<Card className="animate-pulse" key={i}>
							<CardHeader>
								<div className="flex items-center space-x-4">
									<div className="h-10 w-10 rounded-lg bg-muted" />
									<div className="space-y-2">
										<div className="h-4 w-32 rounded bg-muted" />
										<div className="h-3 w-48 rounded bg-muted" />
									</div>
								</div>
							</CardHeader>
						</Card>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl">Document Groups</h1>
					<p className="text-muted-foreground">
						Manage document categorization groups
					</p>
				</div>
				<Dialog onOpenChange={setIsCreateDialogOpen} open={isCreateDialogOpen}>
					<DialogTrigger asChild>
						<Button onClick={resetForm}>
							<Plus className="mr-2 h-4 w-4" />
							Create Group
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[425px]">
						<DialogHeader>
							<DialogTitle>
								{editingGroup ? "Edit Document Group" : "Create Document Group"}
							</DialogTitle>
							<DialogDescription>
								{editingGroup
									? "Update the document group details below."
									: "Create a new document group to categorize your documents."}
							</DialogDescription>
						</DialogHeader>
						<form onSubmit={handleSubmit}>
							<div className="grid gap-4 py-4">
								<div className="grid gap-2">
									<Label htmlFor="name">Name</Label>
									<Input
										disabled={!!editingGroup}
										id="name"
										onChange={(e) =>
											setFormData({
												...formData,
												name: e.target.value.toLowerCase(),
											})
										}
										placeholder="e.g., property"
										required // Name cannot be changed after creation
										value={formData.name}
									/>
									{editingGroup && (
										<p className="text-muted-foreground text-xs">
											Name cannot be changed after creation
										</p>
									)}
								</div>
								<div className="grid gap-2">
									<Label htmlFor="displayName">Display Name</Label>
									<Input
										id="displayName"
										onChange={(e) =>
											setFormData({ ...formData, displayName: e.target.value })
										}
										placeholder="e.g., Property Documents"
										required
										value={formData.displayName}
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="description">Description</Label>
									<Textarea
										id="description"
										onChange={(e) =>
											setFormData({ ...formData, description: e.target.value })
										}
										placeholder="Brief description of this document group"
										value={formData.description}
									/>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div className="grid gap-2">
										<Label htmlFor="icon">Icon (single character)</Label>
										<Input
											id="icon"
											maxLength={1}
											onChange={(e) =>
												setFormData({ ...formData, icon: e.target.value })
											}
											placeholder="P"
											value={formData.icon}
										/>
									</div>
									<div className="grid gap-2">
										<Label htmlFor="color">Color</Label>
										<Input
											id="color"
											onChange={(e) =>
												setFormData({ ...formData, color: e.target.value })
											}
											type="color"
											value={formData.color}
										/>
									</div>
								</div>
							</div>
							<DialogFooter>
								<Button
									onClick={() => setIsCreateDialogOpen(false)}
									type="button"
									variant="outline"
								>
									Cancel
								</Button>
								<Button type="submit">
									{editingGroup ? "Update" : "Create"}
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			{/* Search */}
			<div className="flex items-center space-x-2">
				<div className="relative max-w-sm flex-1">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
					<Input
						className="pl-10"
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search document groups..."
						value={searchQuery}
					/>
				</div>
			</div>

			{/* Groups Grid */}
			<div className="grid gap-4">
				{filteredGroups?.map(
					// biome-ignore lint/suspicious/noExplicitAny: Type from Convex query result
					(group: any) => (
						<Card
							className={group.isActive ? "" : "opacity-60"}
							key={group._id}
						>
							<CardHeader>
								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-4">
										<GroupIcon color={group.color} icon={group.icon} />
										<div>
											<CardTitle className="flex items-center space-x-2">
												<span>{group.displayName}</span>
												{group.isDefault && (
													<Badge variant="secondary">Default</Badge>
												)}
												{!group.isActive && (
													<Badge variant="destructive">Inactive</Badge>
												)}
											</CardTitle>
											<CardDescription>
												<span className="rounded bg-muted px-2 py-1 font-mono text-xs">
													{group.name}
												</span>
											</CardDescription>
											{group.description && (
												<p className="mt-1 text-muted-foreground text-sm">
													{group.description}
												</p>
											)}
										</div>
									</div>
									<div className="flex items-center space-x-2">
										<Switch
											checked={group.isActive}
											disabled={!group.isUserDeletable}
											onCheckedChange={() => {
												if (group.isActive) {
													handleDeactivate(group);
												} else {
													handleReactivate(group);
												}
											}}
										/>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button size="sm" variant="ghost">
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												{group.isUserEditable && (
													<DropdownMenuItem onClick={() => handleEdit(group)}>
														<Edit2 className="mr-2 h-4 w-4" />
														Edit
													</DropdownMenuItem>
												)}
												{group.isUserDeletable && (
													<>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															className="text-destructive"
															disabled={!group.isActive}
															onClick={() => handleDeactivate(group)}
														>
															<Archive className="mr-2 h-4 w-4" />
															Deactivate
														</DropdownMenuItem>
													</>
												)}
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								</div>
							</CardHeader>
						</Card>
					)
				)}
			</div>

			{filteredGroups?.length === 0 && (
				<div className="py-12 text-center">
					<p className="text-muted-foreground">
						{searchQuery
							? "No document groups found matching your search."
							: "No document groups found."}
					</p>
				</div>
			)}
		</div>
	);
}
