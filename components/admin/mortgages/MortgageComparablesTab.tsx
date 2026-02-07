"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import {
	ChevronDown,
	ChevronUp,
	ImagePlus,
	Plus,
	Trash2,
	X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

type MortgageComparablesTabProps = {
	mortgageId: Id<"mortgages">;
};

type ComparableFormData = {
	address: { street: string; city: string; state: string; zip: string };
	saleAmount: string;
	saleDate: string;
	distance: string;
	squareFeet?: string;
	bedrooms?: string;
	bathrooms?: string;
	propertyType?: string;
	imageStorageId?: Id<"_storage">;
	previewUrl?: string;
	asIf?: boolean;
};

const createEmptyFormData = (): ComparableFormData => ({
	address: { street: "", city: "", state: "", zip: "" },
	saleAmount: "",
	saleDate: "",
	distance: "",
});

const formatDate = (value: string) => (value ? new Date(value) : undefined);
const toIsoDate = (value: Date | undefined | null) =>
	value ? value.toISOString().slice(0, 10) : "";

export function MortgageComparablesTab({
	mortgageId,
}: MortgageComparablesTabProps) {
	const comparables = useQuery(api.comparables.getComparablesForMortgage, {
		mortgageId,
	});

	const createComparable = useMutation(api.comparables.createComparable);
	const updateComparable = useMutation(api.comparables.updateComparable);
	const deleteComparable = useMutation(api.comparables.deleteComparable);
	const generateUploadUrl = useAction(api.profile.generateUploadUrl);

	// Add new form state
	const [isAddingNew, setIsAddingNew] = useState(false);
	const [newComparable, setNewComparable] = useState<ComparableFormData>(
		createEmptyFormData()
	);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const imageInputRef = useRef<HTMLInputElement | null>(null);

	// Inline edit state for existing comparables
	const [editingComparableId, setEditingComparableId] =
		useState<Id<"appraisal_comparables"> | null>(null);
	const [editingUploading, setEditingUploading] = useState(false);
	const editImageInputRef = useRef<HTMLInputElement | null>(null);

	// Handlers for new comparable form
	const updateNewFormField = <K extends keyof ComparableFormData>(
		field: K,
		value: ComparableFormData[K]
	) => {
		setNewComparable({ ...newComparable, [field]: value });
	};

	const updateNewAddressField = (
		field: keyof ComparableFormData["address"],
		value: string
	) => {
		setNewComparable({
			...newComparable,
			address: { ...newComparable.address, [field]: value },
		});
	};

	const handleNewImageUpload = async (file: File | null) => {
		if (!file) return;
		if (!file.type.startsWith("image/")) {
			toast.error("Please upload an image file");
			return;
		}

		setIsUploading(true);
		try {
			const uploadUrl = await generateUploadUrl({});
			const response = await fetch(uploadUrl, {
				method: "POST",
				headers: { "Content-Type": file.type },
				body: file,
			});
			if (!response.ok) {
				throw new Error("Upload failed");
			}
			const json = (await response.json()) as { storageId: string };
			setNewComparable({
				...newComparable,
				imageStorageId: json.storageId as Id<"_storage">,
				previewUrl: URL.createObjectURL(file),
			});
			toast.success("Image uploaded");
		} catch (error) {
			toast.error(
				`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		} finally {
			setIsUploading(false);
			if (imageInputRef.current) {
				imageInputRef.current.value = "";
			}
		}
	};

	const handleRemoveNewImage = () => {
		if (newComparable.previewUrl?.startsWith("blob:")) {
			URL.revokeObjectURL(newComparable.previewUrl);
		}
		setNewComparable({
			...newComparable,
			imageStorageId: undefined,
			previewUrl: undefined,
		});
	};

	const validateForm = (form: ComparableFormData): string | null => {
		if (!form.address.street.trim()) return "Street is required";
		if (!form.address.city.trim()) return "City is required";
		if (!form.address.state.trim()) return "State is required";
		if (!form.address.zip.trim()) return "Postal code is required";

		const saleAmount = Number(form.saleAmount);
		if (!Number.isFinite(saleAmount) || saleAmount <= 0)
			return "Sale amount must be a positive number";

		if (!form.saleDate) return "Sale date is required";

		const distance = Number(form.distance);
		if (!Number.isFinite(distance) || distance < 0)
			return "Distance must be 0 or greater";

		return null;
	};

	const handleAddComparable = async () => {
		const validationError = validateForm(newComparable);
		if (validationError) {
			toast.error(validationError);
			return;
		}

		setIsSubmitting(true);
		try {
			await createComparable({
				mortgageId,
				address: newComparable.address,
				saleAmount: Number(newComparable.saleAmount),
				saleDate: newComparable.saleDate,
				distance: Number(newComparable.distance),
				squareFeet: newComparable.squareFeet
					? Number(newComparable.squareFeet)
					: undefined,
				bedrooms:
					newComparable.bedrooms !== ""
						? Number(newComparable.bedrooms)
						: undefined,
				bathrooms:
					newComparable.bathrooms !== ""
						? Number(newComparable.bathrooms)
						: undefined,
				propertyType: newComparable.propertyType?.trim() || undefined,
				imageStorageId: newComparable.imageStorageId,
				asIf: newComparable.asIf,
			});
			toast.success("Comparable added");
			// Reset form
			if (newComparable.previewUrl?.startsWith("blob:")) {
				URL.revokeObjectURL(newComparable.previewUrl);
			}
			setNewComparable(createEmptyFormData());
			setIsAddingNew(false);
		} catch (error) {
			toast.error(
				`Failed to add: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleCancelAdd = () => {
		if (newComparable.previewUrl?.startsWith("blob:")) {
			URL.revokeObjectURL(newComparable.previewUrl);
		}
		setNewComparable(createEmptyFormData());
		setIsAddingNew(false);
	};

	// Handlers for editing existing comparables
	const handleUpdateField = async (
		compId: Id<"appraisal_comparables">,
		field: string,
		value: unknown
	) => {
		try {
			await updateComparable({ id: compId, [field]: value });
		} catch (error) {
			toast.error(
				`Failed to update: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		}
	};

	const handleUpdateAddress = async (
		compId: Id<"appraisal_comparables">,
		currentAddress: ComparableFormData["address"],
		field: keyof ComparableFormData["address"],
		value: string
	) => {
		try {
			await updateComparable({
				id: compId,
				address: { ...currentAddress, [field]: value },
			});
		} catch (error) {
			toast.error(
				`Failed to update: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		}
	};

	const handleEditImageUpload = async (
		compId: Id<"appraisal_comparables">,
		file: File | null
	) => {
		if (!file) return;
		if (!file.type.startsWith("image/")) {
			toast.error("Please upload an image file");
			return;
		}

		setEditingComparableId(compId);
		setEditingUploading(true);
		try {
			const uploadUrl = await generateUploadUrl({});
			const response = await fetch(uploadUrl, {
				method: "POST",
				headers: { "Content-Type": file.type },
				body: file,
			});
			if (!response.ok) {
				throw new Error("Upload failed");
			}
			const json = (await response.json()) as { storageId: string };
			await updateComparable({
				id: compId,
				imageStorageId: json.storageId as Id<"_storage">,
			});
			toast.success("Image updated");
		} catch (error) {
			toast.error(
				`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		} finally {
			setEditingUploading(false);
			setEditingComparableId(null);
			if (editImageInputRef.current) {
				editImageInputRef.current.value = "";
			}
		}
	};

	const handleDelete = async (id: Id<"appraisal_comparables">) => {
		try {
			await deleteComparable({ id });
			toast.success("Comparable deleted");
		} catch (error) {
			toast.error(
				`Failed to delete: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<h3 className="font-semibold text-lg">Comparable Properties</h3>
					{comparables && comparables.length > 0 && (
						<Badge variant="secondary">{comparables.length}</Badge>
					)}
				</div>
				{!isAddingNew && (
					<Button
						onClick={() => setIsAddingNew(true)}
						size="sm"
						variant="outline"
					>
						<Plus className="mr-2 h-4 w-4" />
						Add Comparable
					</Button>
				)}
			</div>

			{/* Add New Section (Collapsible) */}
			<Collapsible onOpenChange={setIsAddingNew} open={isAddingNew}>
				<CollapsibleContent className="space-y-4">
					<div className="rounded-lg border border-primary/50 border-dashed bg-muted/30 p-4">
						<div className="mb-4 flex items-center justify-between">
							<h4 className="font-medium">New Comparable</h4>
							<Button
								disabled={isSubmitting}
								onClick={handleCancelAdd}
								size="sm"
								variant="ghost"
							>
								<X className="h-4 w-4" />
							</Button>
						</div>

						{/* Image Upload */}
						<div className="mb-4">
							<Label className="mb-2 block">Property Image</Label>
							{newComparable.previewUrl ? (
								<div className="relative aspect-video max-w-xs overflow-hidden rounded-md">
									{/* biome-ignore lint/performance/noImgElement: Dynamic image from blob URL */}
									<img
										alt="Comparable property"
										className="h-full w-full object-cover"
										height={360}
										src={newComparable.previewUrl}
										width={640}
									/>
									<button
										aria-label="Remove image"
										className="absolute top-2 right-2 rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70"
										disabled={isSubmitting}
										onClick={handleRemoveNewImage}
										type="button"
									>
										<X className="h-4 w-4" />
									</button>
								</div>
							) : (
								<button
									aria-label="Upload image"
									className="flex aspect-video max-w-xs cursor-pointer flex-col items-center justify-center rounded-md border-2 border-border border-dashed bg-muted/50 transition-colors hover:border-primary/50 hover:bg-muted"
									disabled={isUploading || isSubmitting}
									onClick={() => imageInputRef.current?.click()}
									type="button"
								>
									{isUploading ? (
										<div className="flex flex-col items-center gap-2">
											<div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
											<span className="text-muted-foreground text-sm">
												Uploading...
											</span>
										</div>
									) : (
										<>
											<ImagePlus className="h-8 w-8 text-muted-foreground" />
											<span className="mt-2 text-muted-foreground text-sm">
												Click to upload
											</span>
										</>
									)}
								</button>
							)}
							<input
								accept="image/*"
								className="hidden"
								onChange={(e) =>
									handleNewImageUpload(e.target.files?.[0] ?? null)
								}
								ref={imageInputRef}
								type="file"
							/>
						</div>

						{/* As-If Toggle */}
						<div className="mb-4 flex items-center gap-2">
							<Checkbox
								checked={newComparable.asIf ?? false}
								disabled={isSubmitting}
								id="new-asif-toggle"
								onCheckedChange={(checked) =>
									updateNewFormField("asIf", checked === true)
								}
							/>
							<Label
								className="cursor-pointer text-sm"
								htmlFor="new-asif-toggle"
							>
								As-If Complete (post-renovation value)
							</Label>
						</div>

						{/* Address Fields */}
						<div className="mb-4 grid gap-4 md:grid-cols-2">
							<div className="md:col-span-2">
								<Label htmlFor="new-street">Street Address *</Label>
								<Input
									disabled={isSubmitting}
									id="new-street"
									onChange={(e) =>
										updateNewAddressField("street", e.target.value)
									}
									placeholder="123 Similar Street"
									value={newComparable.address.street}
								/>
							</div>
							<div>
								<Label htmlFor="new-city">City *</Label>
								<Input
									disabled={isSubmitting}
									id="new-city"
									onChange={(e) =>
										updateNewAddressField("city", e.target.value)
									}
									placeholder="Toronto"
									value={newComparable.address.city}
								/>
							</div>
							<div>
								<Label htmlFor="new-state">State / Province *</Label>
								<Input
									disabled={isSubmitting}
									id="new-state"
									onChange={(e) =>
										updateNewAddressField("state", e.target.value)
									}
									placeholder="ON"
									value={newComparable.address.state}
								/>
							</div>
							<div>
								<Label htmlFor="new-zip">Postal Code *</Label>
								<Input
									disabled={isSubmitting}
									id="new-zip"
									onChange={(e) => updateNewAddressField("zip", e.target.value)}
									placeholder="M5J 2N1"
									value={newComparable.address.zip}
								/>
							</div>
						</div>

						{/* Sale Info */}
						<div className="mb-4 grid gap-4 md:grid-cols-3">
							<div>
								<Label htmlFor="new-saleAmount">Sale Amount *</Label>
								<Input
									disabled={isSubmitting}
									id="new-saleAmount"
									onChange={(e) =>
										updateNewFormField("saleAmount", e.target.value)
									}
									placeholder="520000"
									type="number"
									value={newComparable.saleAmount}
								/>
							</div>
							<div>
								<Label htmlFor="new-saleDate">Sale Date *</Label>
								<DatePicker
									className="w-full"
									date={formatDate(newComparable.saleDate)}
									onDateChange={(date) =>
										updateNewFormField("saleDate", toIsoDate(date))
									}
									placeholder="Select date"
								/>
							</div>
							<div>
								<Label htmlFor="new-distance">Distance (miles) *</Label>
								<Input
									disabled={isSubmitting}
									id="new-distance"
									onChange={(e) =>
										updateNewFormField("distance", e.target.value)
									}
									placeholder="0.5"
									type="number"
									value={newComparable.distance}
								/>
							</div>
						</div>

						{/* Optional Fields */}
						<div className="mb-4 grid gap-4 md:grid-cols-4">
							<div>
								<Label htmlFor="new-squareFeet">Square Feet</Label>
								<Input
									disabled={isSubmitting}
									id="new-squareFeet"
									onChange={(e) =>
										updateNewFormField("squareFeet", e.target.value)
									}
									placeholder="1800"
									type="number"
									value={newComparable.squareFeet ?? ""}
								/>
							</div>
							<div>
								<Label htmlFor="new-bedrooms">Bedrooms</Label>
								<Input
									disabled={isSubmitting}
									id="new-bedrooms"
									onChange={(e) =>
										updateNewFormField("bedrooms", e.target.value)
									}
									placeholder="3"
									type="number"
									value={newComparable.bedrooms ?? ""}
								/>
							</div>
							<div>
								<Label htmlFor="new-bathrooms">Bathrooms</Label>
								<Input
									disabled={isSubmitting}
									id="new-bathrooms"
									onChange={(e) =>
										updateNewFormField("bathrooms", e.target.value)
									}
									placeholder="2"
									type="number"
									value={newComparable.bathrooms ?? ""}
								/>
							</div>
							<div>
								<Label htmlFor="new-propertyType">Property Type</Label>
								<Input
									disabled={isSubmitting}
									id="new-propertyType"
									onChange={(e) =>
										updateNewFormField("propertyType", e.target.value)
									}
									placeholder="Townhouse"
									value={newComparable.propertyType ?? ""}
								/>
							</div>
						</div>

						<Separator className="my-4" />

						<div className="flex justify-end gap-2">
							<Button
								disabled={isSubmitting}
								onClick={handleCancelAdd}
								variant="outline"
							>
								Cancel
							</Button>
							<Button
								disabled={isSubmitting || isUploading}
								onClick={handleAddComparable}
							>
								{isSubmitting ? "Adding..." : "Add Comparable"}
							</Button>
						</div>
					</div>
				</CollapsibleContent>
			</Collapsible>

			{/* Hidden input for editing images */}
			<input
				accept="image/*"
				className="hidden"
				onChange={(e) => {
					if (editingComparableId) {
						handleEditImageUpload(
							editingComparableId,
							e.target.files?.[0] ?? null
						);
					}
				}}
				ref={editImageInputRef}
				type="file"
			/>

			{/* Existing Comparables List */}
			{comparables ? (
				comparables.length === 0 && !isAddingNew ? (
					<div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
						<ImagePlus className="mb-2 h-10 w-10 text-muted-foreground" />
						<p className="text-muted-foreground">No comparables yet</p>
						<p className="text-muted-foreground text-sm">
							Click "Add Comparable" to add comparable properties for this
							mortgage.
						</p>
					</div>
				) : (
					<div className="space-y-3">
						{comparables.map(
							(comp: NonNullable<typeof comparables>[number]) => (
								<ComparableCard
									comp={comp}
									isUploadingImage={
										editingUploading && editingComparableId === comp._id
									}
									key={comp._id}
									onDelete={handleDelete}
									onImageClick={() => {
										setEditingComparableId(comp._id);
										editImageInputRef.current?.click();
									}}
									onUpdateAddress={handleUpdateAddress}
									onUpdateField={handleUpdateField}
								/>
							)
						)}
					</div>
				)
			) : (
				<div className="flex items-center justify-center py-8">
					<span className="text-muted-foreground">Loading comparables...</span>
				</div>
			)}
		</div>
	);
}

// Comparable Card Component with inline editing
type ComparableCardProps = {
	comp: {
		_id: Id<"appraisal_comparables">;
		address: { street: string; city: string; state: string; zip: string };
		saleAmount: number;
		saleDate: string;
		distance: number;
		squareFeet?: number;
		bedrooms?: number;
		bathrooms?: number;
		propertyType?: string;
		asIf?: boolean;
		imageUrl: string | null;
		imageStorageId?: Id<"_storage">;
	};
	onUpdateField: (
		id: Id<"appraisal_comparables">,
		field: string,
		value: unknown
	) => Promise<void>;
	onUpdateAddress: (
		id: Id<"appraisal_comparables">,
		currentAddress: {
			street: string;
			city: string;
			state: string;
			zip: string;
		},
		field: "street" | "city" | "state" | "zip",
		value: string
	) => Promise<void>;
	onDelete: (id: Id<"appraisal_comparables">) => Promise<void>;
	onImageClick: () => void;
	isUploadingImage: boolean;
};

function ComparableCard({
	comp,
	onUpdateField,
	onUpdateAddress,
	onDelete,
	onImageClick,
	isUploadingImage,
}: ComparableCardProps) {
	const [isExpanded, setIsExpanded] = useState(false);

	return (
		<div
			className={cn(
				"rounded-lg border p-4 transition-colors",
				comp.asIf
					? "border-amber-400/50 bg-amber-50/30 dark:bg-amber-950/10"
					: "border-border"
			)}
		>
			<div className="flex gap-4">
				{/* Thumbnail */}
				<button
					className="relative h-20 w-28 shrink-0 overflow-hidden rounded-md bg-muted transition-opacity hover:opacity-80"
					disabled={isUploadingImage}
					onClick={onImageClick}
					type="button"
				>
					{isUploadingImage ? (
						<div className="flex h-full w-full items-center justify-center">
							<div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
						</div>
					) : comp.imageUrl ? (
						<>
							{/* biome-ignore lint/performance/noImgElement: Dynamic image from external source */}
							<img
								alt={comp.address.street}
								className="h-full w-full object-cover"
								height={80}
								src={comp.imageUrl}
								width={112}
							/>
						</>
					) : (
						<div className="flex h-full w-full flex-col items-center justify-center">
							<ImagePlus className="h-5 w-5 text-muted-foreground" />
							<span className="mt-1 text-muted-foreground text-xs">Add</span>
						</div>
					)}
				</button>

				{/* Main Info */}
				<div className="min-w-0 flex-1">
					<div className="flex items-start justify-between gap-2">
						<div className="min-w-0 flex-1">
							<div className="flex items-center gap-2">
								<p className="truncate font-medium">{comp.address.street}</p>
								{comp.asIf && <Badge variant="warning">As-If</Badge>}
							</div>
							<p className="truncate text-muted-foreground text-sm">
								{comp.address.city}, {comp.address.state} {comp.address.zip}
							</p>
							<p className="text-muted-foreground text-sm">
								${comp.saleAmount.toLocaleString()} •{" "}
								{new Date(comp.saleDate).toLocaleDateString()} • {comp.distance}{" "}
								mi
							</p>
						</div>
						<div className="flex shrink-0 gap-1">
							<Button
								onClick={() => setIsExpanded(!isExpanded)}
								size="sm"
								title={isExpanded ? "Collapse" : "Expand to edit"}
								variant="ghost"
							>
								{isExpanded ? (
									<ChevronUp className="h-4 w-4" />
								) : (
									<ChevronDown className="h-4 w-4" />
								)}
							</Button>
							<Button
								className="text-destructive hover:text-destructive"
								onClick={() => onDelete(comp._id)}
								size="sm"
								variant="ghost"
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						</div>
					</div>

					{/* Optional details shown inline */}
					{(comp.squareFeet ||
						comp.bedrooms ||
						comp.bathrooms ||
						comp.propertyType) && (
						<p className="mt-1 text-muted-foreground text-xs">
							{comp.squareFeet && `${comp.squareFeet.toLocaleString()} sqft`}
							{comp.squareFeet && (comp.bedrooms || comp.bathrooms) && " • "}
							{comp.bedrooms && `${comp.bedrooms} bed`}
							{comp.bedrooms && comp.bathrooms && " / "}
							{comp.bathrooms && `${comp.bathrooms} bath`}
							{(comp.squareFeet || comp.bedrooms || comp.bathrooms) &&
								comp.propertyType &&
								" • "}
							{comp.propertyType}
						</p>
					)}
				</div>
			</div>

			{/* Expanded Edit Form */}
			{isExpanded && (
				<div className="mt-4 space-y-4 border-t pt-4">
					{/* As-If Toggle */}
					<div className="flex items-center gap-2">
						<Checkbox
							checked={comp.asIf ?? false}
							id={`asif-${comp._id}`}
							onCheckedChange={(checked) =>
								onUpdateField(comp._id, "asIf", checked === true)
							}
						/>
						<Label
							className="cursor-pointer text-sm"
							htmlFor={`asif-${comp._id}`}
						>
							As-If Complete (post-renovation value)
						</Label>
					</div>

					{/* Address Fields */}
					<div className="grid gap-3 md:grid-cols-2">
						<div className="md:col-span-2">
							<Label className="text-xs">Street</Label>
							<Input
								defaultValue={comp.address.street}
								onBlur={(e) =>
									e.target.value !== comp.address.street &&
									onUpdateAddress(
										comp._id,
										comp.address,
										"street",
										e.target.value
									)
								}
								placeholder="Street address"
							/>
						</div>
						<div>
							<Label className="text-xs">City</Label>
							<Input
								defaultValue={comp.address.city}
								onBlur={(e) =>
									e.target.value !== comp.address.city &&
									onUpdateAddress(
										comp._id,
										comp.address,
										"city",
										e.target.value
									)
								}
								placeholder="City"
							/>
						</div>
						<div>
							<Label className="text-xs">State</Label>
							<Input
								defaultValue={comp.address.state}
								onBlur={(e) =>
									e.target.value !== comp.address.state &&
									onUpdateAddress(
										comp._id,
										comp.address,
										"state",
										e.target.value
									)
								}
								placeholder="State"
							/>
						</div>
						<div>
							<Label className="text-xs">Postal Code</Label>
							<Input
								defaultValue={comp.address.zip}
								onBlur={(e) =>
									e.target.value !== comp.address.zip &&
									onUpdateAddress(comp._id, comp.address, "zip", e.target.value)
								}
								placeholder="Postal code"
							/>
						</div>
					</div>

					{/* Sale Info */}
					<div className="grid gap-3 md:grid-cols-3">
						<div>
							<Label className="text-xs">Sale Amount</Label>
							<Input
								defaultValue={comp.saleAmount}
								onBlur={(e) => {
									const val = Number(e.target.value);
									if (val !== comp.saleAmount && val > 0) {
										onUpdateField(comp._id, "saleAmount", val);
									}
								}}
								type="number"
							/>
						</div>
						<div>
							<Label className="text-xs">Sale Date</Label>
							<Input
								defaultValue={comp.saleDate}
								onBlur={(e) =>
									e.target.value !== comp.saleDate &&
									onUpdateField(comp._id, "saleDate", e.target.value)
								}
								type="date"
							/>
						</div>
						<div>
							<Label className="text-xs">Distance (mi)</Label>
							<Input
								defaultValue={comp.distance}
								onBlur={(e) => {
									const val = Number(e.target.value);
									if (val !== comp.distance && val >= 0) {
										onUpdateField(comp._id, "distance", val);
									}
								}}
								type="number"
							/>
						</div>
					</div>

					{/* Optional Fields */}
					<div className="grid gap-3 md:grid-cols-4">
						<div>
							<Label className="text-xs">Square Feet</Label>
							<Input
								defaultValue={comp.squareFeet ?? ""}
								onBlur={(e) => {
									const val = e.target.value
										? Number(e.target.value)
										: undefined;
									if (val !== comp.squareFeet) {
										onUpdateField(comp._id, "squareFeet", val);
									}
								}}
								placeholder="Optional"
								type="number"
							/>
						</div>
						<div>
							<Label className="text-xs">Bedrooms</Label>
							<Input
								defaultValue={comp.bedrooms ?? ""}
								onBlur={(e) => {
									const val = e.target.value
										? Number(e.target.value)
										: undefined;
									if (val !== comp.bedrooms) {
										onUpdateField(comp._id, "bedrooms", val);
									}
								}}
								placeholder="Optional"
								type="number"
							/>
						</div>
						<div>
							<Label className="text-xs">Bathrooms</Label>
							<Input
								defaultValue={comp.bathrooms ?? ""}
								onBlur={(e) => {
									const val = e.target.value
										? Number(e.target.value)
										: undefined;
									if (val !== comp.bathrooms) {
										onUpdateField(comp._id, "bathrooms", val);
									}
								}}
								placeholder="Optional"
								type="number"
							/>
						</div>
						<div>
							<Label className="text-xs">Property Type</Label>
							<Input
								defaultValue={comp.propertyType ?? ""}
								onBlur={(e) => {
									const val = e.target.value.trim() || undefined;
									if (val !== comp.propertyType) {
										onUpdateField(comp._id, "propertyType", val);
									}
								}}
								placeholder="Optional"
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
