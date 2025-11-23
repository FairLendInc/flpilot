"use client";

import { useMutation, useQuery } from "convex/react";
import {
	Archive,
	Edit2,
	FileText,
	MoreHorizontal,
	Plus,
	Search,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type DocumentTypeFormData = {
	name: string;
	displayName: string;
	description: string;
	groupName: string;
	icon: string;
};

type DocumentType = {
	_id: Id<"document_types">;
	name: string;
	displayName: string;
	description?: string;
	groupName: string;
	icon?: string;
	validationRules?: Record<string, unknown>;
	isActive: boolean;
	createdBy: Id<"users">;
	createdAt: number;
	updatedAt: number;
	isUserEditable: boolean;
	isUserDeletable: boolean;
	group?: {
		name: string;
		displayName: string;
		icon?: string;
		color?: string;
	};
};

// Type icon component
const TypeIcon = ({ icon, color }: { icon?: string; color?: string }) => {
	if (!icon) {
		return (
			<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
				<FileText className="h-4 w-4" />
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

export default function DocumentTypesPage() {
	const [searchQuery, setSearchQuery] = useState("");
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [editingType, setEditingType] = useState<DocumentType | null>(null);
	const [formData, setFormData] = useState<DocumentTypeFormData>({
		name: "",
		displayName: "",
		description: "",
		groupName: "",
		icon: "",
	});

	// Fetch document types and groups
	const typesResult = useQuery(api.documentTypes.getDocumentTypes, {
		groupName: undefined,
		includeInactive: true,
	});
	const types = typesResult;
	const isLoading = typesResult === undefined;

	const groupsResult = useQuery(api.documentGroups.getDocumentGroups, {
		includeInactive: false,
	});
	const groups = groupsResult;

	// Mutations
	const createType = useMutation(api.documentTypes.createDocumentType);
	const updateType = useMutation(api.documentTypes.updateDocumentType);
	const deactivateType = useMutation(api.documentTypes.deactivateDocumentType);

	// Filter types based on search
	const filteredTypes = React.useMemo(() => {
		if (!(types && searchQuery)) return types;

		const query = searchQuery.toLowerCase();
		return types.filter(
			// biome-ignore lint/suspicious/noExplicitAny: Joined type from Convex
			(type: any) =>
				type.name.toLowerCase().includes(query) ||
				type.displayName.toLowerCase().includes(query) ||
				type.description?.toLowerCase().includes(query) ||
				type.groupName.toLowerCase().includes(query)
		);
	}, [types, searchQuery]);

	// Reset form
	const resetForm = () => {
		setFormData({
			name: "",
			displayName: "",
			description: "",
			groupName: "",
			icon: "",
		});
		setEditingType(null);
	};

	// Handle form submission
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			if (editingType) {
				await updateType({
					typeId: editingType._id,
					displayName: formData.displayName,
					description: formData.description,
					groupName: formData.groupName,
					icon: formData.icon,
				});
				toast.success("Document type updated successfully");
			} else {
				await createType({
					name: formData.name,
					displayName: formData.displayName,
					description: formData.description,
					groupName: formData.groupName,
					icon: formData.icon,
				});
				toast.success("Document type created successfully");
			}

			setIsCreateDialogOpen(false);
			resetForm();
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to save document type";
			toast.error(message);
		}
	};

	// Handle edit
	const handleEdit = (type: DocumentType) => {
		setEditingType(type);
		setFormData({
			name: type.name,
			displayName: type.displayName,
			description: type.description || "",
			groupName: type.groupName,
			icon: type.icon || "",
		});
		setIsCreateDialogOpen(true);
	};

	// Handle delete/deactivate
	const handleDeactivate = async (type: DocumentType) => {
		if (
			// biome-ignore lint/suspicious/noAlert: Simple confirmation dialog is sufficient for admin interface
			!confirm(`Are you sure you want to deactivate "${type.displayName}"?`)
		) {
			return;
		}

		try {
			await deactivateType({ typeId: type._id });
			toast.success("Document type deactivated successfully");
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Failed to deactivate document type";
			toast.error(message);
		}
	};

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="font-bold text-3xl">Document Types</h1>
						<p className="text-muted-foreground">
							Manage document types and their categorization
						</p>
					</div>
				</div>
				<div className="space-y-2">
					{Array.from({ length: 8 }).map((_, i) => (
						<div
							className="flex animate-pulse items-center space-x-4 rounded-lg border p-4"
							// biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton list
							key={i}
						>
							<div className="h-8 w-8 rounded-lg bg-muted" />
							<div className="flex-1 space-y-2">
								<div className="h-4 w-32 rounded bg-muted" />
								<div className="h-3 w-48 rounded bg-muted" />
							</div>
						</div>
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
					<h1 className="font-bold text-3xl">Document Types</h1>
					<p className="text-muted-foreground">
						Manage document types and their categorization
					</p>
				</div>
				<Dialog onOpenChange={setIsCreateDialogOpen} open={isCreateDialogOpen}>
					<DialogTrigger asChild>
						<Button onClick={resetForm}>
							<Plus className="mr-2 h-4 w-4" />
							Create Type
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[425px]">
						<DialogHeader>
							<DialogTitle>
								{editingType ? "Edit Document Type" : "Create Document Type"}
							</DialogTitle>
							<DialogDescription>
								{editingType
									? "Update the document type details below."
									: "Create a new document type to categorize your documents."}
							</DialogDescription>
						</DialogHeader>
						<form onSubmit={handleSubmit}>
							<div className="grid gap-4 py-4">
								<div className="grid gap-2">
									<Label htmlFor="name">Name</Label>
									<Input
										disabled={!!editingType}
										id="name"
										onChange={(e) =>
											setFormData({
												...formData,
												name: e.target.value.toLowerCase(),
											})
										}
										placeholder="e.g., appraisal"
										required // Name cannot be changed after creation
										value={formData.name}
									/>
									{editingType && (
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
										placeholder="e.g., Property Appraisal"
										required
										value={formData.displayName}
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="groupName">Group</Label>
									<Select
										onValueChange={(value) =>
											setFormData({ ...formData, groupName: value })
										}
										value={formData.groupName}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select a group" />
										</SelectTrigger>
										<SelectContent>
											{groups?.map(
												// biome-ignore lint/suspicious/noExplicitAny: Type from Convex query result
												(group: any) => (
													<SelectItem key={group._id} value={group.name}>
														{group.displayName}
													</SelectItem>
												)
											)}
										</SelectContent>
									</Select>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="description">Description</Label>
									<Textarea
										id="description"
										onChange={(e) =>
											setFormData({ ...formData, description: e.target.value })
										}
										placeholder="Brief description of this document type"
										value={formData.description}
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="icon">Icon (single character)</Label>
									<Input
										id="icon"
										maxLength={1}
										onChange={(e) =>
											setFormData({ ...formData, icon: e.target.value })
										}
										placeholder="A"
										value={formData.icon}
									/>
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
									{editingType ? "Update" : "Create"}
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
						placeholder="Search document types..."
						value={searchQuery}
					/>
				</div>
			</div>

			{/* Types List */}
			<div className="space-y-2">
				{filteredTypes?.map(
					// biome-ignore lint/suspicious/noExplicitAny: Type from Convex query result
					(type: any) => (
						<Card className={type.isActive ? "" : "opacity-60"} key={type._id}>
							<CardContent className="p-4">
								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-4">
										<TypeIcon color={type.group?.color} icon={type.icon} />
										<div className="flex-1">
											<div className="flex items-center space-x-2">
												<span className="font-medium">{type.displayName}</span>
												{!type.isActive && (
													<Badge variant="destructive">Inactive</Badge>
												)}
											</div>
											<div className="mt-1 flex items-center space-x-2">
												<Badge className="text-xs" variant="outline">
													{type.group?.displayName || type.groupName}
												</Badge>
												<span className="rounded bg-muted px-2 py-1 font-mono text-muted-foreground text-xs">
													{type.name}
												</span>
											</div>
											{type.description && (
												<p className="mt-2 text-muted-foreground text-sm">
													{type.description}
												</p>
											)}
										</div>
									</div>
									<div className="flex items-center space-x-2">
										<Switch
											checked={type.isActive}
											disabled={!type.isUserDeletable}
											onCheckedChange={() => handleDeactivate(type)}
										/>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button size="sm" variant="ghost">
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												{type.isUserEditable && (
													<DropdownMenuItem onClick={() => handleEdit(type)}>
														<Edit2 className="mr-2 h-4 w-4" />
														Edit
													</DropdownMenuItem>
												)}
												{type.isUserDeletable && (
													<>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															className="text-destructive"
															disabled={!type.isActive}
															onClick={() => handleDeactivate(type)}
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
							</CardContent>
						</Card>
					)
				)}
			</div>

			{filteredTypes?.length === 0 && (
				<div className="py-12 text-center">
					<p className="text-muted-foreground">
						{searchQuery
							? "No document types found matching your search."
							: "No document types found."}
					</p>
				</div>
			)}
		</div>
	);
}
