"use client";

import { useAction, useMutation } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp, Plus, Trash2, Upload, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useMortgageUpdateStore } from "@/app/(auth)/dashboard/admin/mortgages/manage/useMortgageUpdateStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuthenticatedQuery } from "@/convex/lib/client";

type BorrowerItem = (typeof api.borrowers.listBorrowers._returnType)[number];

import { MortgageDocumentTemplatesEditor } from "../MortgageDocumentTemplatesEditor";
import { MortgageComparablesTab } from "./MortgageComparablesTab";
import { MortgageOwnershipTab } from "./MortgageOwnershipTab";

type MortgageUpdateSheetProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	mortgageId: Id<"mortgages"> | null;
	onSaveComplete: () => void;
};

const DOCUMENT_TYPES = [
	{ key: "appraisal", label: "Appraisal" },
	{ key: "title", label: "Title" },
	{ key: "inspection", label: "Inspection" },
	{ key: "loan_agreement", label: "Loan Agreement" },
	{ key: "insurance", label: "Insurance" },
] as const;

// Maximum image file size: 5MB
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
// Maximum document file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function MortgageUpdateSheet({
	open,
	onOpenChange,
	mortgageId,
	onSaveComplete,
}: MortgageUpdateSheetProps) {
	const updateMortgage = useMutation(api.mortgages.updateMortgage);
	const generateUploadUrl = useAction(api.profile.generateUploadUrl);
	const borrowers = useAuthenticatedQuery(api.borrowers.listBorrowers, {});

	const fullMortgageData = useAuthenticatedQuery(
		api.mortgages.getMortgage,
		mortgageId ? { id: mortgageId } : "skip"
	);

	const store = useMortgageUpdateStore();
	const {
		loanAmount,
		interestRate,
		originationDate,
		maturityDate,
		status,
		mortgageType,
		propertyType,
		appraisalMarketValue,
		appraisalMethod,
		appraisalCompany,
		appraisalDate,
		ltv,
		externalMortgageId,
		borrowerId,
		address,
		location,
		priorEncumbrance,
		asIfAppraisal,
		asIfAppraisalImages,
		images,
		documents,
		errors,
		isSubmitting,
		setField,
		setAddressField,
		setLocationField,
		setPriorEncumbrance,
		setAsIfAppraisal,
		addAsIfAppraisalImage,
		removeAsIfAppraisalImage,
		addImage,
		updateImage,
		removeImage,
		moveImageUp,
		moveImageDown,
		addDocument,
		updateDocument,
		removeDocument,
		loadFromMortgage,
		clearErrors,
		setSubmitting,
		reset,
		validate,
	} = store;

	const [documentType, setDocumentType] = useState<
		"appraisal" | "title" | "inspection" | "loan_agreement" | "insurance"
	>("appraisal");
	const [isUploadingMedia, setIsUploadingMedia] = useState(false);
	const [isUploadingAsIfImages, setIsUploadingAsIfImages] = useState(false);
	const imageInputRef = useRef<HTMLInputElement | null>(null);
	const documentInputRef = useRef<HTMLInputElement | null>(null);
	const asIfImageInputRef = useRef<HTMLInputElement | null>(null);

	// Load mortgage data when it becomes available
	useEffect(() => {
		if (open && fullMortgageData && mortgageId) {
			// biome-ignore lint/suspicious/noExplicitAny: Type mismatch between local and Convex types
			loadFromMortgage(fullMortgageData as any);
		}
	}, [open, fullMortgageData, mortgageId, loadFromMortgage]);

	// Reset store when sheet closes
	useEffect(() => {
		if (!open) {
			reset();
		}
	}, [open, reset]);

	// Cleanup: Revoke all object URLs when component unmounts
	useEffect(() => {
		return () => {
			// Revoke all preview URLs on unmount
			for (const image of images) {
				if (image.previewUrl) {
					URL.revokeObjectURL(image.previewUrl);
				}
			}
			// Also revoke as-if appraisal image preview URLs
			for (const image of asIfAppraisalImages) {
				if (image.previewUrl) {
					URL.revokeObjectURL(image.previewUrl);
				}
			}
		};
	}, [images, asIfAppraisalImages]); // Include images in deps to capture current state

	const handleImageUpload = async (files: FileList | null) => {
		if (!files || files.length === 0) return;
		setIsUploadingMedia(true);
		try {
			for (const file of Array.from(files)) {
				// Client-side MIME type check (server will also validate)
				if (!file.type.startsWith("image/")) {
					toast.error(`Unsupported file type for ${file.name}`);
					continue;
				}

				// File size validation
				if (file.size > MAX_IMAGE_BYTES) {
					const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
					const maxMB = (MAX_IMAGE_BYTES / (1024 * 1024)).toFixed(0);
					toast.error(
						`${file.name} is too large (${sizeMB}MB). Maximum size is ${maxMB}MB.`
					);
					continue;
				}

				const uploadUrl = await generateUploadUrl({});
				const response = await fetch(uploadUrl, {
					method: "POST",
					headers: { "Content-Type": file.type },
					body: file,
				});
				if (!response.ok) {
					throw new Error(`Upload failed for ${file.name}`);
				}
				const json = (await response.json()) as { storageId: string };
				addImage({
					storageId: json.storageId,
					alt: "",
					order: images.length,
					previewUrl: URL.createObjectURL(file),
				});
			}
			toast.success("Image upload complete");
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Unable to upload image";
			toast.error(message);
		} finally {
			setIsUploadingMedia(false);
			if (imageInputRef.current) {
				imageInputRef.current.value = "";
			}
		}
	};

	const handleRemoveImage = (index: number) => {
		// Revoke object URL before removing image to prevent memory leaks
		const imageToRemove = images[index];
		if (imageToRemove?.previewUrl) {
			URL.revokeObjectURL(imageToRemove.previewUrl);
		}
		removeImage(index);
	};

	const handleAsIfImageUpload = async (files: FileList | null) => {
		if (!files || files.length === 0) return;
		setIsUploadingAsIfImages(true);
		try {
			for (const file of Array.from(files)) {
				if (!file.type.startsWith("image/")) {
					toast.error(`Unsupported file type for ${file.name}`);
					continue;
				}
				if (file.size > MAX_IMAGE_BYTES) {
					const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
					const maxMB = (MAX_IMAGE_BYTES / (1024 * 1024)).toFixed(0);
					toast.error(
						`${file.name} is too large (${sizeMB}MB). Maximum size is ${maxMB}MB.`
					);
					continue;
				}

				const uploadUrl = await generateUploadUrl({});
				const response = await fetch(uploadUrl, {
					method: "POST",
					headers: { "Content-Type": file.type },
					body: file,
				});
				if (!response.ok) {
					throw new Error(`Upload failed for ${file.name}`);
				}
				const json = (await response.json()) as { storageId: string };
				addAsIfAppraisalImage({
					storageId: json.storageId,
					previewUrl: URL.createObjectURL(file),
				});
			}
			toast.success("Improvement image upload complete");
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Unable to upload image";
			toast.error(message);
		} finally {
			setIsUploadingAsIfImages(false);
			if (asIfImageInputRef.current) {
				asIfImageInputRef.current.value = "";
			}
		}
	};

	const handleRemoveAsIfImage = (index: number) => {
		const imageToRemove = asIfAppraisalImages[index];
		if (imageToRemove?.previewUrl) {
			URL.revokeObjectURL(imageToRemove.previewUrl);
		}
		removeAsIfAppraisalImage(index);
	};

	const handleDocumentUpload = async (file: File | null) => {
		if (!file) return;

		// File size validation
		if (file.size > MAX_FILE_SIZE) {
			toast.error("File is too large. Maximum allowed size is 10MB.");
			if (documentInputRef.current) {
				documentInputRef.current.value = "";
			}
			return;
		}

		setIsUploadingMedia(true);
		try {
			const uploadUrl = await generateUploadUrl({});
			const response = await fetch(uploadUrl, {
				method: "POST",
				headers: { "Content-Type": file.type || "application/octet-stream" },
				body: file,
			});
			if (!response.ok) {
				throw new Error(`Upload failed for ${file.name}`);
			}
			const json = (await response.json()) as { storageId: string };
			addDocument({
				name: file.name,
				type: documentType,
				storageId: json.storageId,
				uploadDate: new Date().toISOString(),
				fileSize: file.size,
			});
			toast.success("Document uploaded");
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Unable to upload document";
			toast.error(message);
		} finally {
			setIsUploadingMedia(false);
			if (documentInputRef.current) {
				documentInputRef.current.value = "";
			}
		}
	};

	async function handleSave() {
		clearErrors();
		const validationErrors = validate();
		if (Object.keys(validationErrors).length > 0) {
			store.setErrors(validationErrors);
			toast.error("Please resolve the highlighted fields");
			return;
		}

		if (!mortgageId) return;

		setSubmitting(true);
		try {
			await updateMortgage({
				mortgageId,
				loanAmount: Number(loanAmount),
				interestRate: Number(interestRate),
				originationDate,
				maturityDate,
				status,
				mortgageType,
				address: {
					street: address.street.trim(),
					city: address.city.trim(),
					state: address.state.trim(),
					zip: address.zip.trim(),
					country: address.country.trim(),
				},
				location: {
					lat: Number(location.lat),
					lng: Number(location.lng),
				},
				propertyType: propertyType.trim(),
				appraisalMarketValue: Number(appraisalMarketValue),
				appraisalMethod: appraisalMethod.trim(),
				appraisalCompany: appraisalCompany.trim(),
				appraisalDate,
				ltv: Number(ltv),
				externalMortgageId: externalMortgageId.trim() || undefined,
				borrowerId: borrowerId as Id<"borrowers">,
				priorEncumbrance: priorEncumbrance || undefined,
				asIfAppraisal: asIfAppraisal
					? {
							...asIfAppraisal,
							imageStorageIds:
								asIfAppraisalImages.length > 0
									? asIfAppraisalImages.map(
											(img) => img.storageId as Id<"_storage">
										)
									: undefined,
						}
					: undefined,
				images: images.map((img: (typeof images)[0], index: number) => ({
					storageId: img.storageId as Id<"_storage">,
					alt: img.alt.trim() || undefined,
					order: index,
				})),
				documents: documents.map((doc: (typeof documents)[0]) => ({
					name: doc.name.trim(),
					type: doc.type,
					storageId: doc.storageId as Id<"_storage">,
					uploadDate: doc.uploadDate,
					fileSize: doc.fileSize,
				})),
			});
			toast.success("Mortgage updated successfully");
			onOpenChange(false);
			onSaveComplete();
		} catch (error) {
			toast.error(
				`Failed to update mortgage: ${
					error instanceof Error ? error.message : "Unknown error"
				}`
			);
		} finally {
			setSubmitting(false);
		}
	}

	const addressDisplay = fullMortgageData
		? `${fullMortgageData.address.street}, ${fullMortgageData.address.city}, ${fullMortgageData.address.state}`
		: "";

	return (
		<Sheet onOpenChange={onOpenChange} open={open}>
			<SheetContent className="flex flex-col sm:max-w-2xl" side="right">
				<SheetHeader>
					<SheetTitle>Edit Mortgage</SheetTitle>
					{addressDisplay && (
						<SheetDescription>{addressDisplay}</SheetDescription>
					)}
				</SheetHeader>

				<ScrollArea className="min-h-0 flex-1">
					<div className="px-4">
						<Tabs className="mt-4" defaultValue="loan">
							<TabsList className="grid w-full grid-cols-6">
								<TabsTrigger value="loan">Loan Details</TabsTrigger>
								<TabsTrigger value="property">Property Info</TabsTrigger>
								<TabsTrigger value="comparables">Comparables</TabsTrigger>
								<TabsTrigger value="media">Media</TabsTrigger>
								<TabsTrigger value="templates">Templates</TabsTrigger>
								<TabsTrigger value="ownership">Ownership</TabsTrigger>
							</TabsList>

							<TabsContent className="mt-4 space-y-4" value="loan">
								<div className="grid gap-4 md:grid-cols-2">
									<div className="space-y-2">
										<Label htmlFor="loanAmount">
											Loan Amount ($){" "}
											<span className="text-destructive">*</span>
										</Label>
										<Input
											id="loanAmount"
											onChange={(e) => {
												const value = Number.parseFloat(e.target.value);
												setField(
													"loanAmount",
													Number.isNaN(value) ? "" : String(value)
												);
											}}
											type="number"
											value={loanAmount}
										/>
										{errors.loanAmount && (
											<p className="text-destructive text-sm">
												{errors.loanAmount}
											</p>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="interestRate">
											Interest Rate (%){" "}
											<span className="text-destructive">*</span>
										</Label>
										<Input
											id="interestRate"
											max={100}
											min={0}
											onChange={(e) => {
												const value = Number.parseFloat(e.target.value);
												setField(
													"interestRate",
													Number.isNaN(value) ? "" : String(value)
												);
											}}
											type="number"
											value={interestRate}
										/>
										{errors.interestRate && (
											<p className="text-destructive text-sm">
												{errors.interestRate}
											</p>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="ltv">
											LTV (%) <span className="text-destructive">*</span>
										</Label>
										<Input
											id="ltv"
											max={100}
											min={0}
											onChange={(e) => {
												const value = Number.parseFloat(e.target.value);
												setField(
													"ltv",
													Number.isNaN(value) ? "" : String(value)
												);
											}}
											type="number"
											value={ltv}
										/>
										{errors.ltv && (
											<p className="text-destructive text-sm">{errors.ltv}</p>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="mortgageType">
											Mortgage Type <span className="text-destructive">*</span>
										</Label>
										<Select
											onValueChange={(value) =>
												setField(
													"mortgageType",
													value as "1st" | "2nd" | "other"
												)
											}
											value={mortgageType}
										>
											<SelectTrigger id="mortgageType">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="1st">1st</SelectItem>
												<SelectItem value="2nd">2nd</SelectItem>
												<SelectItem value="other">Other</SelectItem>
											</SelectContent>
										</Select>
									</div>

									<div className="space-y-2">
										<Label htmlFor="status">
											Status <span className="text-destructive">*</span>
										</Label>
										<Select
											onValueChange={(value) =>
												setField(
													"status",
													value as "active" | "renewed" | "closed" | "defaulted"
												)
											}
											value={status}
										>
											<SelectTrigger id="status">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="active">Active</SelectItem>
												<SelectItem value="renewed">Renewed</SelectItem>
												<SelectItem value="closed">Closed</SelectItem>
												<SelectItem value="defaulted">Defaulted</SelectItem>
											</SelectContent>
										</Select>
									</div>

									<div className="space-y-2">
										<Label htmlFor="borrowerId">
											Borrower <span className="text-destructive">*</span>
										</Label>
										<Select
											onValueChange={(value) => setField("borrowerId", value)}
											value={borrowerId}
										>
											<SelectTrigger id="borrowerId">
												<SelectValue placeholder="Select borrower" />
											</SelectTrigger>
											<SelectContent>
												{borrowers?.map((borrower: BorrowerItem) => (
													<SelectItem key={borrower._id} value={borrower._id}>
														{borrower.name} ({borrower.email})
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										{errors.borrowerId && (
											<p className="text-destructive text-sm">
												{errors.borrowerId}
											</p>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="originationDate">
											Origination Date{" "}
											<span className="text-destructive">*</span>
										</Label>
										<Input
											id="originationDate"
											onChange={(e) =>
												setField("originationDate", e.target.value)
											}
											type="date"
											value={originationDate}
										/>
										{errors.originationDate && (
											<p className="text-destructive text-sm">
												{errors.originationDate}
											</p>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="maturityDate">
											Maturity Date <span className="text-destructive">*</span>
										</Label>
										<Input
											id="maturityDate"
											onChange={(e) => setField("maturityDate", e.target.value)}
											type="date"
											value={maturityDate}
										/>
										{errors.maturityDate && (
											<p className="text-destructive text-sm">
												{errors.maturityDate}
											</p>
										)}
									</div>

									<div className="space-y-2 md:col-span-2">
										<Label htmlFor="externalMortgageId">
											External Mortgage ID
										</Label>
										<Input
											id="externalMortgageId"
											onChange={(e) =>
												setField("externalMortgageId", e.target.value)
											}
											value={externalMortgageId}
										/>
										{errors.externalMortgageId && (
											<p className="text-destructive text-sm">
												{errors.externalMortgageId}
											</p>
										)}
									</div>
								</div>

								{/* Prior Encumbrance Section */}
								<div className="mt-6 space-y-4 rounded-lg border p-4">
									<div className="flex items-center justify-between">
										<h3 className="font-semibold text-lg">Prior Encumbrance</h3>
										{priorEncumbrance ? (
											<Button
												onClick={() => setPriorEncumbrance(null)}
												size="sm"
												type="button"
												variant="ghost"
											>
												<X className="mr-2 h-4 w-4" />
												Remove
											</Button>
										) : (
											<Button
												onClick={() =>
													setPriorEncumbrance({ amount: 0, lender: "" })
												}
												size="sm"
												type="button"
												variant="outline"
											>
												<Plus className="mr-2 h-4 w-4" />
												Add Prior Encumbrance
											</Button>
										)}
									</div>

									{priorEncumbrance && (
										<div className="grid gap-4 md:grid-cols-2">
											<div className="space-y-2">
												<Label htmlFor="priorEncumbranceAmount">
													Amount ($)
												</Label>
												<Input
													id="priorEncumbranceAmount"
													onChange={(e) => {
														const value = Number.parseFloat(e.target.value);
														setPriorEncumbrance({
															...priorEncumbrance,
															amount: Number.isNaN(value) ? 0 : value,
														});
													}}
													type="number"
													value={priorEncumbrance.amount}
												/>
												{errors.priorEncumbranceAmount && (
													<p className="text-destructive text-sm">
														{errors.priorEncumbranceAmount}
													</p>
												)}
											</div>

											<div className="space-y-2">
												<Label htmlFor="priorEncumbranceLender">Lender</Label>
												<Input
													id="priorEncumbranceLender"
													onChange={(e) =>
														setPriorEncumbrance({
															...priorEncumbrance,
															lender: e.target.value,
														})
													}
													value={priorEncumbrance.lender}
												/>
												{errors.priorEncumbranceLender && (
													<p className="text-destructive text-sm">
														{errors.priorEncumbranceLender}
													</p>
												)}
											</div>
										</div>
									)}
								</div>
							</TabsContent>

							<TabsContent className="mt-4 space-y-6" value="property">
								<div className="space-y-4">
									<h3 className="font-semibold">Address</h3>
									<div className="grid gap-4 md:grid-cols-2">
										<div className="space-y-2 md:col-span-2">
											<Label htmlFor="street">
												Street <span className="text-destructive">*</span>
											</Label>
											<Input
												id="street"
												onChange={(e) =>
													setAddressField("street", e.target.value)
												}
												value={address.street}
											/>
											{errors["address.street"] && (
												<p className="text-destructive text-sm">
													{errors["address.street"]}
												</p>
											)}
										</div>

										<div className="space-y-2">
											<Label htmlFor="city">
												City <span className="text-destructive">*</span>
											</Label>
											<Input
												id="city"
												onChange={(e) =>
													setAddressField("city", e.target.value)
												}
												value={address.city}
											/>
											{errors["address.city"] && (
												<p className="text-destructive text-sm">
													{errors["address.city"]}
												</p>
											)}
										</div>

										<div className="space-y-2">
											<Label htmlFor="state">
												State / Province{" "}
												<span className="text-destructive">*</span>
											</Label>
											<Input
												id="state"
												onChange={(e) =>
													setAddressField("state", e.target.value)
												}
												value={address.state}
											/>
											{errors["address.state"] && (
												<p className="text-destructive text-sm">
													{errors["address.state"]}
												</p>
											)}
										</div>

										<div className="space-y-2">
											<Label htmlFor="zip">
												Postal Code <span className="text-destructive">*</span>
											</Label>
											<Input
												id="zip"
												onChange={(e) => setAddressField("zip", e.target.value)}
												value={address.zip}
											/>
											{errors["address.zip"] && (
												<p className="text-destructive text-sm">
													{errors["address.zip"]}
												</p>
											)}
										</div>

										<div className="space-y-2">
											<Label htmlFor="country">
												Country <span className="text-destructive">*</span>
											</Label>
											<Input
												id="country"
												onChange={(e) =>
													setAddressField("country", e.target.value)
												}
												value={address.country}
											/>
											{errors["address.country"] && (
												<p className="text-destructive text-sm">
													{errors["address.country"]}
												</p>
											)}
										</div>
									</div>
								</div>

								<div className="space-y-4">
									<h3 className="font-semibold">Location</h3>
									<div className="grid gap-4 md:grid-cols-2">
										<div className="space-y-2">
											<Label htmlFor="lat">
												Latitude <span className="text-destructive">*</span>
											</Label>
											<Input
												id="lat"
												onChange={(e) => {
													const value = Number.parseFloat(e.target.value);
													setLocationField(
														"lat",
														Number.isNaN(value) ? "" : String(value)
													);
												}}
												type="number"
												value={location.lat}
											/>
											{errors["location.lat"] && (
												<p className="text-destructive text-sm">
													{errors["location.lat"]}
												</p>
											)}
										</div>

										<div className="space-y-2">
											<Label htmlFor="lng">
												Longitude <span className="text-destructive">*</span>
											</Label>
											<Input
												id="lng"
												onChange={(e) => {
													const value = Number.parseFloat(e.target.value);
													setLocationField(
														"lng",
														Number.isNaN(value) ? "" : String(value)
													);
												}}
												type="number"
												value={location.lng}
											/>
											{errors["location.lng"] && (
												<p className="text-destructive text-sm">
													{errors["location.lng"]}
												</p>
											)}
										</div>
									</div>
								</div>

								<div className="space-y-4">
									<h3 className="font-semibold">Property Details</h3>
									<div className="space-y-2">
										<Label htmlFor="propertyType">
											Property Type <span className="text-destructive">*</span>
										</Label>
										<Input
											id="propertyType"
											onChange={(e) => setField("propertyType", e.target.value)}
											value={propertyType}
										/>
										{errors.propertyType && (
											<p className="text-destructive text-sm">
												{errors.propertyType}
											</p>
										)}
									</div>
								</div>

								<div className="space-y-4">
									<h3 className="font-semibold">Appraisal</h3>
									<div className="grid gap-4 md:grid-cols-2">
										<div className="space-y-2">
											<Label htmlFor="appraisalMarketValue">
												Market Value ($){" "}
												<span className="text-destructive">*</span>
											</Label>
											<Input
												id="appraisalMarketValue"
												onChange={(e) => {
													const value = Number.parseFloat(e.target.value);
													setField(
														"appraisalMarketValue",
														Number.isNaN(value) ? "" : String(value)
													);
												}}
												type="number"
												value={appraisalMarketValue}
											/>
											{errors.appraisalMarketValue && (
												<p className="text-destructive text-sm">
													{errors.appraisalMarketValue}
												</p>
											)}
										</div>

										<div className="space-y-2">
											<Label htmlFor="appraisalDate">
												Appraisal Date{" "}
												<span className="text-destructive">*</span>
											</Label>
											<Input
												id="appraisalDate"
												onChange={(e) =>
													setField("appraisalDate", e.target.value)
												}
												type="date"
												value={appraisalDate}
											/>
											{errors.appraisalDate && (
												<p className="text-destructive text-sm">
													{errors.appraisalDate}
												</p>
											)}
										</div>

										<div className="space-y-2">
											<Label htmlFor="appraisalMethod">
												Method <span className="text-destructive">*</span>
											</Label>
											<Input
												id="appraisalMethod"
												onChange={(e) =>
													setField("appraisalMethod", e.target.value)
												}
												value={appraisalMethod}
											/>
											{errors.appraisalMethod && (
												<p className="text-destructive text-sm">
													{errors.appraisalMethod}
												</p>
											)}
										</div>

										<div className="space-y-2">
											<Label htmlFor="appraisalCompany">
												Company <span className="text-destructive">*</span>
											</Label>
											<Input
												id="appraisalCompany"
												onChange={(e) =>
													setField("appraisalCompany", e.target.value)
												}
												value={appraisalCompany}
											/>
											{errors.appraisalCompany && (
												<p className="text-destructive text-sm">
													{errors.appraisalCompany}
												</p>
											)}
										</div>
									</div>
								</div>

								{/* As-If Complete Appraisal Section */}
								<div className="mt-6 space-y-4 rounded-lg border p-4">
									<div className="flex items-center justify-between">
										<div>
											<h3 className="font-semibold text-lg">
												As-If Complete Appraisal
											</h3>
											<p className="text-muted-foreground text-sm">
												Appraisal value if property improvements are completed
											</p>
										</div>
										{asIfAppraisal ? (
											<Button
												onClick={() => setAsIfAppraisal(null)}
												size="sm"
												type="button"
												variant="ghost"
											>
												<X className="mr-2 h-4 w-4" />
												Remove
											</Button>
										) : (
											<Button
												onClick={() =>
													setAsIfAppraisal({
														marketValue: 0,
														method: "",
														company: "",
														date: "",
													})
												}
												size="sm"
												type="button"
												variant="outline"
											>
												<Plus className="mr-2 h-4 w-4" />
												Add As-If Complete Appraisal
											</Button>
										)}
									</div>

									{asIfAppraisal && (
										<div className="space-y-4">
											<div className="grid gap-4 md:grid-cols-2">
												<div className="space-y-2">
													<Label htmlFor="asIfAppraisalMarketValue">
														Market Value ($)
													</Label>
													<Input
														id="asIfAppraisalMarketValue"
														onChange={(e) => {
															const value = Number.parseFloat(e.target.value);
															setAsIfAppraisal({
																...asIfAppraisal,
																marketValue: Number.isNaN(value) ? 0 : value,
															});
														}}
														type="number"
														value={asIfAppraisal.marketValue}
													/>
													{errors.asIfAppraisalMarketValue && (
														<p className="text-destructive text-sm">
															{errors.asIfAppraisalMarketValue}
														</p>
													)}
												</div>

												<div className="space-y-2">
													<Label htmlFor="asIfAppraisalMethod">Method</Label>
													<Input
														id="asIfAppraisalMethod"
														onChange={(e) =>
															setAsIfAppraisal({
																...asIfAppraisal,
																method: e.target.value,
															})
														}
														value={asIfAppraisal.method}
													/>
													{errors.asIfAppraisalMethod && (
														<p className="text-destructive text-sm">
															{errors.asIfAppraisalMethod}
														</p>
													)}
												</div>

												<div className="space-y-2">
													<Label htmlFor="asIfAppraisalCompany">Company</Label>
													<Input
														id="asIfAppraisalCompany"
														onChange={(e) =>
															setAsIfAppraisal({
																...asIfAppraisal,
																company: e.target.value,
															})
														}
														value={asIfAppraisal.company}
													/>
													{errors.asIfAppraisalCompany && (
														<p className="text-destructive text-sm">
															{errors.asIfAppraisalCompany}
														</p>
													)}
												</div>

												<div className="space-y-2">
													<Label htmlFor="asIfAppraisalDate">Date</Label>
													<Input
														id="asIfAppraisalDate"
														onChange={(e) =>
															setAsIfAppraisal({
																...asIfAppraisal,
																date: e.target.value,
															})
														}
														type="date"
														value={asIfAppraisal.date}
													/>
													{errors.asIfAppraisalDate && (
														<p className="text-destructive text-sm">
															{errors.asIfAppraisalDate}
														</p>
													)}
												</div>
											</div>

											{/* New fields: Description */}
											<div className="space-y-2">
												<Label htmlFor="asIfAppraisalDescription">
													Renovation Description
												</Label>
												<textarea
													className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
													id="asIfAppraisalDescription"
													onChange={(e) =>
														setAsIfAppraisal({
															...asIfAppraisal,
															description: e.target.value,
														})
													}
													placeholder="Describe the planned improvements..."
													value={asIfAppraisal.description ?? ""}
												/>
											</div>

											{/* New fields: Projected Completion Date and Cost */}
											<div className="grid gap-4 md:grid-cols-2">
												<div className="space-y-2">
													<Label htmlFor="asIfAppraisalProjectedCompletionDate">
														Projected Completion Date
													</Label>
													<Input
														id="asIfAppraisalProjectedCompletionDate"
														onChange={(e) =>
															setAsIfAppraisal({
																...asIfAppraisal,
																projectedCompletionDate: e.target.value,
															})
														}
														type="date"
														value={asIfAppraisal.projectedCompletionDate ?? ""}
													/>
												</div>

												<div className="space-y-2">
													<Label htmlFor="asIfAppraisalCost">
														Renovation Cost ($)
													</Label>
													<Input
														id="asIfAppraisalCost"
														onChange={(e) => {
															const value = Number.parseFloat(e.target.value);
															setAsIfAppraisal({
																...asIfAppraisal,
																cost: Number.isNaN(value) ? undefined : value,
															});
														}}
														placeholder="50000"
														type="number"
														value={asIfAppraisal.cost ?? ""}
													/>
												</div>
											</div>

											{/* New fields: Improvement Images */}
											<div className="space-y-3">
												<div className="flex items-center justify-between">
													<Label>Improvement Mockup Images</Label>
													<Button
														disabled={isUploadingAsIfImages}
														onClick={() => asIfImageInputRef.current?.click()}
														size="sm"
														type="button"
														variant="outline"
													>
														<Upload className="mr-2 h-4 w-4" />
														{isUploadingAsIfImages ? "Uploading..." : "Upload"}
													</Button>
												</div>
												<input
													accept="image/*"
													className="hidden"
													multiple
													onChange={(event) =>
														handleAsIfImageUpload(event.target.files)
													}
													ref={asIfImageInputRef}
													type="file"
												/>
												{asIfAppraisalImages.length > 0 && (
													<div className="grid grid-cols-3 gap-2">
														{asIfAppraisalImages.map((image, index) => (
															<div
																className="group relative aspect-square overflow-hidden rounded-md border"
																key={image.storageId}
															>
																<Image
																	alt={`Improvement mockup ${index + 1}`}
																	className="object-cover"
																	fill
																	src={
																		image.previewUrl ||
																		image.url ||
																		`/api/storage/${image.storageId}`
																	}
																	unoptimized={Boolean(image.previewUrl)}
																/>
																<button
																	aria-label="Remove improvement mockup"
																	className="absolute top-1 right-1 rounded-full bg-destructive p-1 opacity-0 transition-opacity group-hover:opacity-100"
																	onClick={() => handleRemoveAsIfImage(index)}
																	type="button"
																>
																	<X className="h-3 w-3 text-destructive-foreground" />
																</button>
															</div>
														))}
													</div>
												)}
												{asIfAppraisalImages.length === 0 && (
													<p className="text-muted-foreground text-sm">
														No improvement mockups uploaded yet.
													</p>
												)}
											</div>
										</div>
									)}
								</div>
							</TabsContent>

							<TabsContent className="mt-4 space-y-6" value="comparables">
								{mortgageId ? (
									<MortgageComparablesTab mortgageId={mortgageId} />
								) : (
									<div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
										<p className="text-muted-foreground">
											Please save the mortgage first to add comparables.
										</p>
									</div>
								)}
							</TabsContent>

							<TabsContent className="mt-4 space-y-6" value="media">
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<h3 className="font-semibold">Property Images</h3>
										<Button
											disabled={isUploadingMedia}
											onClick={() => imageInputRef.current?.click()}
											size="sm"
											variant="outline"
										>
											<Upload className="mr-2 h-4 w-4" />
											Upload Image
										</Button>
									</div>
									<input
										accept="image/*"
										className="hidden"
										multiple
										onChange={(event) => handleImageUpload(event.target.files)}
										ref={imageInputRef}
										type="file"
									/>
									{errors.images && (
										<p className="text-destructive text-sm" role="alert">
											{errors.images}
										</p>
									)}
									<div className="grid gap-3 md:grid-cols-2">
										<AnimatePresence mode="popLayout">
											{images.map(
												(image: (typeof images)[0], index: number) => (
													<motion.div
														animate={{ opacity: 1, scale: 1, y: 0 }}
														className="rounded-md border border-border bg-muted p-3"
														exit={{ opacity: 0, scale: 0.8, y: -20 }}
														initial={{ opacity: 0, scale: 0.8, y: 20 }}
														key={`${image.storageId}-${image.order}`}
														layout
														transition={{
															layout: { duration: 0.3, ease: "easeInOut" },
															opacity: { duration: 0.2 },
															scale: { duration: 0.2 },
														}}
													>
														<div className="mb-2 flex items-center justify-between">
															<p className="font-medium text-sm">
																Image #{index + 1}
															</p>
															<div className="flex gap-1">
																<Button
																	aria-label="Move image up"
																	disabled={index === 0}
																	onClick={() => moveImageUp(index)}
																	size="sm"
																	variant="ghost"
																>
																	<ChevronUp className="h-4 w-4" />
																</Button>
																<Button
																	aria-label="Move image down"
																	disabled={index === images.length - 1}
																	onClick={() => moveImageDown(index)}
																	size="sm"
																	variant="ghost"
																>
																	<ChevronDown className="h-4 w-4" />
																</Button>
																<Button
																	aria-label={`Remove image ${index + 1}`}
																	onClick={() => handleRemoveImage(index)}
																	size="sm"
																	variant="ghost"
																>
																	<Trash2 className="h-4 w-4" />
																</Button>
															</div>
														</div>
														{(image.url || image.previewUrl) && (
															<div className="relative mb-2 h-32 w-full">
																<Image
																	alt={image.alt || `Image ${index + 1}`}
																	className="rounded object-cover"
																	fill
																	src={image.previewUrl || image.url || ""}
																	unoptimized
																/>
															</div>
														)}
														<div className="space-y-2">
															<Label htmlFor={`image-alt-${index}`}>
																Alt Text
															</Label>
															<Input
																id={`image-alt-${index}`}
																onChange={(e) =>
																	updateImage(index, { alt: e.target.value })
																}
																placeholder="Front elevation"
																value={image.alt}
															/>
														</div>
													</motion.div>
												)
											)}
										</AnimatePresence>
										{images.length === 0 && (
											<p className="col-span-2 text-muted-foreground text-sm">
												No images uploaded. Click "Upload Image" to add images.
											</p>
										)}
									</div>
								</div>

								<div className="space-y-4">
									<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
										<div className="flex gap-3">
											<Select
												onValueChange={(value) =>
													setDocumentType(value as typeof documentType)
												}
												value={documentType}
											>
												<SelectTrigger className="md:w-60">
													<SelectValue placeholder="Select document type" />
												</SelectTrigger>
												<SelectContent>
													{DOCUMENT_TYPES.map((option) => (
														<SelectItem key={option.key} value={option.key}>
															{option.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<Button
												disabled={isUploadingMedia}
												onClick={() => documentInputRef.current?.click()}
												size="sm"
												variant="outline"
											>
												<Upload className="mr-2 h-4 w-4" />
												Upload Document
											</Button>
										</div>
									</div>
									<input
										accept="*/*"
										className="hidden"
										onChange={(event) =>
											handleDocumentUpload(event.target.files?.[0] || null)
										}
										ref={documentInputRef}
										type="file"
									/>
									{errors.documents && (
										<p className="text-destructive text-sm" role="alert">
											{errors.documents}
										</p>
									)}
									<div className="space-y-2">
										{documents.map(
											(document: (typeof documents)[0], index: number) => (
												<div
													className="flex items-center justify-between rounded-md border border-border bg-muted p-3"
													key={`${document.storageId}-${index}`}
												>
													<div className="flex-1">
														<div className="flex items-center gap-2">
															<Input
																className="flex-1"
																onChange={(e) =>
																	updateDocument(index, {
																		name: e.target.value,
																	})
																}
																value={document.name}
															/>
															<Badge variant="secondary">{document.type}</Badge>
														</div>
														<div className="mt-1 flex gap-4 text-muted-foreground text-xs">
															{document.fileSize && (
																<span>
																	{(document.fileSize / 1024).toFixed(2)} KB
																</span>
															)}
															<span>
																{new Date(
																	document.uploadDate
																).toLocaleDateString()}
															</span>
															{document.url && (
																<Link
																	className="text-primary hover:underline"
																	href={document.url}
																	prefetch={false}
																	rel="noopener noreferrer"
																	target="_blank"
																>
																	Download
																</Link>
															)}
														</div>
													</div>
													<Button
														aria-label={`Remove document ${index + 1}`}
														onClick={() => removeDocument(index)}
														size="sm"
														variant="ghost"
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											)
										)}
										{documents.length === 0 && (
											<p className="text-muted-foreground text-sm">
												No documents uploaded. Select a type and click "Upload
												Document" to add documents.
											</p>
										)}
									</div>
								</div>
							</TabsContent>

							<TabsContent className="mt-4 space-y-6" value="templates">
								{mortgageId ? (
									<MortgageDocumentTemplatesEditor
										mortgageId={mortgageId}
										templates={fullMortgageData?.documentTemplates || []}
									/>
								) : (
									<div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
										<p className="text-muted-foreground">
											Please save the mortgage first to add document templates.
										</p>
									</div>
								)}
							</TabsContent>

							<TabsContent className="mt-4 space-y-6" value="ownership">
								{mortgageId ? (
									<MortgageOwnershipTab
										mortgageAddress={addressDisplay}
										mortgageId={mortgageId}
									/>
								) : (
									<div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
										<p className="text-muted-foreground">
											Please save the mortgage first to view ownership.
										</p>
									</div>
								)}
							</TabsContent>
						</Tabs>
					</div>
				</ScrollArea>

				<SheetFooter className="border-t">
					<Button
						disabled={isSubmitting}
						onClick={() => onOpenChange(false)}
						variant="outline"
					>
						Cancel
					</Button>
					<Button disabled={isSubmitting} onClick={handleSave}>
						{isSubmitting ? "Saving..." : "Save Changes"}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
