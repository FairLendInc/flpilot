"use client";

import {
	Button,
	Description,
	FieldError,
	FieldGroup,
	Fieldset,
	Form,
	Input,
	Label,
	Surface,
	Switch,
	TextField,
} from "@heroui/react";
import { useAction, useMutation, useQuery } from "convex/react";
import { ImagePlus, Trash2, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { DocumentTypeSelector } from "@/components/ui/document-type-selector";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { ListingCreationPayload } from "@/convex/listings";
import { cn } from "@/lib/utils";
import { FormErrorSummary } from "./FormErrorSummary";
import {
	type ListingDocumentType,
	useListingCreationStore,
	validateListingForm,
} from "./useListingCreationStore";

const MORTGAGE_STATUS_OPTIONS: Array<{
	key: ListingCreationPayload["mortgage"]["status"];
	label: string;
}> = [
	{ key: "active", label: "Active" },
	{ key: "renewed", label: "Renewed" },
	{ key: "closed", label: "Closed" },
	{ key: "defaulted", label: "Defaulted" },
];

const MORTGAGE_TYPE_OPTIONS: Array<{
	key: ListingCreationPayload["mortgage"]["mortgageType"];
	label: string;
}> = [
	{ key: "1st", label: "First Position" },
	{ key: "2nd", label: "Second Position" },
	{ key: "other", label: "Other" },
];

const DOCUMENT_OPTIONS: Array<{
	key: ListingDocumentType;
	label: string;
}> = [
	{ key: "appraisal", label: "Appraisal" },
	{ key: "title_search", label: "Title Search" },
	{ key: "credit_report", label: "Credit Report" },
	{ key: "income_verification", label: "Income Verification" },
	{ key: "other", label: "Other" },
];

const formatDate = (value: string) => (value ? new Date(value) : undefined);

const toIsoDate = (value: Date | undefined | null) =>
	value ? value.toISOString().slice(0, 10) : "";

export default function ListingCreationForm() {
	const router = useRouter();
	const createListing = useMutation(api.listings.createFromPayload);
	const generateUploadUrl = useAction(api.profile.generateUploadUrl);

	const borrower = useListingCreationStore((state) => state.borrower);
	const mortgage = useListingCreationStore((state) => state.mortgage);
	const listing = useListingCreationStore((state) => state.listing);
	const images = useListingCreationStore((state) => state.images);
	const documents = useListingCreationStore((state) => state.documents);
	const comparables = useListingCreationStore((state) => state.comparables);
	const asIfAppraisal = useListingCreationStore((state) => state.asIfAppraisal);
	const asIfAppraisalImages = useListingCreationStore(
		(state) => state.asIfAppraisalImages
	);
	const errors = useListingCreationStore((state) => state.errors);
	const isSubmitting = useListingCreationStore((state) => state.isSubmitting);

	const setBorrowerField = useListingCreationStore(
		(state) => state.setBorrowerField
	);
	const applyBorrowerSuggestion = useListingCreationStore(
		(state) => state.applyBorrowerSuggestion
	);
	const setMortgageField = useListingCreationStore(
		(state) => state.setMortgageField
	);
	const setMortgageAddressField = useListingCreationStore(
		(state) => state.setMortgageAddressField
	);
	const setMortgageLocationField = useListingCreationStore(
		(state) => state.setMortgageLocationField
	);
	const setListingVisibility = useListingCreationStore(
		(state) => state.setListingVisibility
	);
	const addImage = useListingCreationStore((state) => state.addImage);
	const _updateImage = useListingCreationStore((state) => state.updateImage);
	const _removeImage = useListingCreationStore((state) => state.removeImage);
	const addDocument = useListingCreationStore((state) => state.addDocument);
	const updateDocument = useListingCreationStore(
		(state) => state.updateDocument
	);
	const removeDocument = useListingCreationStore(
		(state) => state.removeDocument
	);
	const addComparable = useListingCreationStore((state) => state.addComparable);
	const updateComparable = useListingCreationStore(
		(state) => state.updateComparable
	);
	const removeComparable = useListingCreationStore(
		(state) => state.removeComparable
	);
	const setAsIfAppraisalField = useListingCreationStore(
		(state) => state.setAsIfAppraisalField
	);
	const addAsIfAppraisalImage = useListingCreationStore(
		(state) => state.addAsIfAppraisalImage
	);
	const removeAsIfAppraisalImage = useListingCreationStore(
		(state) => state.removeAsIfAppraisalImage
	);
	const setErrors = useListingCreationStore((state) => state.setErrors);
	const clearErrors = useListingCreationStore((state) => state.clearErrors);
	const setSubmitting = useListingCreationStore((state) => state.setSubmitting);
	const resetStore = useListingCreationStore((state) => state.reset);

	const [documentType, setDocumentType] =
		useState<ListingDocumentType>("appraisal");
	const [isUploadingMedia, setIsUploadingMedia] = useState(false);

	const imageInputRef = useRef<HTMLInputElement | null>(null);
	const documentInputRef = useRef<HTMLInputElement | null>(null);
	const comparableImageInputRefs = useRef<(HTMLInputElement | null)[]>([]);
	const asIfImageInputRef = useRef<HTMLInputElement | null>(null);
	const [uploadingComparableIndex, setUploadingComparableIndex] = useState<
		number | null
	>(null);
	const [isUploadingAsIfImages, setIsUploadingAsIfImages] = useState(false);

	const emailForLookup = borrower.email.trim();
	const shouldLookup =
		emailForLookup.length > 2 && emailForLookup.includes("@");
	const borrowerSuggestions = useQuery(
		api.borrowers.searchBorrowersByEmail,
		shouldLookup ? { email: emailForLookup } : "skip"
	);

	const _handleImageUpload = async (files: FileList | null) => {
		if (!files || files.length === 0) return;
		setIsUploadingMedia(true);
		try {
			for (const file of Array.from(files)) {
				if (!file.type.startsWith("image/")) {
					toast.error(`Unsupported file type for ${file.name}`);
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

	const handleDocumentUpload = async (
		file: File | null,
		type: ListingDocumentType
	) => {
		if (!file) return;
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
				type,
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

	const handleComparableImageUpload = async (
		index: number,
		file: File | null
	) => {
		if (!file) return;
		if (!file.type.startsWith("image/")) {
			toast.error("Please upload an image file");
			return;
		}

		setUploadingComparableIndex(index);
		try {
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
			updateComparable(index, {
				imageStorageId: json.storageId,
				previewUrl: URL.createObjectURL(file),
			});
			toast.success("Comparable image uploaded");
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Unable to upload image";
			toast.error(message);
		} finally {
			setUploadingComparableIndex(null);
			const inputRef = comparableImageInputRefs.current[index];
			if (inputRef) {
				inputRef.value = "";
			}
		}
	};

	const handleRemoveComparableImage = (index: number) => {
		const comp = comparables[index];
		// Revoke the preview URL to free memory
		if (comp?.previewUrl) {
			URL.revokeObjectURL(comp.previewUrl);
		}
		updateComparable(index, {
			imageStorageId: undefined,
			previewUrl: undefined,
		});
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
		const image = asIfAppraisalImages[index];
		if (image?.previewUrl) {
			URL.revokeObjectURL(image.previewUrl);
		}
		removeAsIfAppraisalImage(index);
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		clearErrors();

		const state = useListingCreationStore.getState();
		const validationErrors = validateListingForm(state);
		if (Object.keys(validationErrors).length > 0) {
			setErrors(validationErrors);
			toast.error("Please resolve the highlighted fields");
			return;
		}

		const payload: ListingCreationPayload = {
			borrower: {
				name: state.borrower.name.trim(),
				email: state.borrower.email.trim(),
				rotessaCustomerId: state.borrower.rotessaCustomerId.trim(),
			},
			mortgage: {
				loanAmount: Number(state.mortgage.loanAmount),
				interestRate: Number(state.mortgage.interestRate),
				originationDate: state.mortgage.originationDate,
				maturityDate: state.mortgage.maturityDate,
				status: state.mortgage.status,
				mortgageType: state.mortgage.mortgageType,
				address: {
					street: state.mortgage.address.street.trim(),
					city: state.mortgage.address.city.trim(),
					state: state.mortgage.address.state.trim(),
					zip: state.mortgage.address.zip.trim(),
					country: state.mortgage.address.country.trim(),
				},
				location: {
					lat: Number(state.mortgage.location.lat),
					lng: Number(state.mortgage.location.lng),
				},
				propertyType: state.mortgage.propertyType.trim(),
				appraisalMarketValue: Number(state.mortgage.appraisalMarketValue),
				appraisalMethod: state.mortgage.appraisalMethod.trim(),
				appraisalCompany: state.mortgage.appraisalCompany.trim(),
				appraisalDate: state.mortgage.appraisalDate,
				ltv: Number(state.mortgage.ltv),
				images: state.images.map((image, index) => ({
					storageId: image.storageId as Id<"_storage">,
					alt: image.alt.trim() || undefined,
					order: index,
				})),
				documents: state.documents.map((document) => ({
					name: document.name.trim(),
					// biome-ignore lint/suspicious/noExplicitAny: Type mismatch between local and Convex types
					type: document.type as any,
					storageId: document.storageId as Id<"_storage">,
					uploadDate: document.uploadDate,
					fileSize: document.fileSize,
				})),
				externalMortgageId: state.mortgage.externalMortgageId.trim(),
			},
			listing: {
				visible: state.listing.visible,
			},
			comparables: state.comparables.map((comp) => ({
				address: {
					street: comp.address.street.trim(),
					city: comp.address.city.trim(),
					state: comp.address.state.trim(),
					zip: comp.address.zip.trim(),
				},
				saleAmount: Number(comp.saleAmount),
				saleDate: comp.saleDate,
				distance: Number(comp.distance),
				squareFeet: comp.squareFeet ? Number(comp.squareFeet) : undefined,
				bedrooms: comp.bedrooms !== "" ? Number(comp.bedrooms) : undefined,
				bathrooms: comp.bathrooms !== "" ? Number(comp.bathrooms) : undefined,
				propertyType: comp.propertyType?.trim(),
				imageStorageId: comp.imageStorageId
					? (comp.imageStorageId as Id<"_storage">)
					: undefined,
				asIf: comp.asIf,
			})),
			// Include as-if appraisal when any comparable has asIf=true
			asIfAppraisal: state.comparables.some((c) => c.asIf)
				? {
						marketValue: Number(state.asIfAppraisal.marketValue),
						method: state.asIfAppraisal.method.trim(),
						company: state.asIfAppraisal.company.trim(),
						date: state.asIfAppraisal.date,
						// New optional fields
						description: state.asIfAppraisal.description.trim() || undefined,
						projectedCompletionDate:
							state.asIfAppraisal.projectedCompletionDate || undefined,
						cost: state.asIfAppraisal.cost
							? Number(state.asIfAppraisal.cost)
							: undefined,
						imageStorageIds:
							state.asIfAppraisalImages.length > 0
								? state.asIfAppraisalImages.map(
										(img) => img.storageId as Id<"_storage">
									)
								: undefined,
					}
				: undefined,
		};

		setSubmitting(true);
		try {
			const result = await createListing(payload);
			const created = result?.created ?? true;
			const message = created
				? "Listing created successfully"
				: "Listing already exists, returning existing record";
			toast.success(message);
			resetStore();
			router.push("/dashboard/admin/listings");
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Unable to create listing";
			toast.error(message);
		} finally {
			setSubmitting(false);
		}
	};

	// Convert errors object to validationErrors format for Form component
	const validationErrors = Object.entries(errors).reduce(
		(acc, [field, message]) => {
			acc[field] = message;
			return acc;
		},
		{} as Record<string, string>
	);

	const handleReset = () => {
		resetStore();
		if (imageInputRef.current) imageInputRef.current.value = "";
		if (documentInputRef.current) documentInputRef.current.value = "";
	};

	return (
		<Form
			className="space-y-6"
			onSubmit={handleSubmit}
			validationErrors={validationErrors}
		>
			<FormErrorSummary errors={errors} />
			<Surface
				className="flex flex-col gap-3 rounded-3xl p-6"
				variant="default"
			>
				<Fieldset.Root>
					<Fieldset.Legend className="text-foreground/70">
						Borrower Details
					</Fieldset.Legend>
					<Description className="text-foreground/50">
						Reuse an existing borrower or enter new contact information.
					</Description>
					<FieldGroup className="grid gap-x-4 md:grid-cols-3">
						<TextField isRequired name="borrower.name">
							<Label>Name</Label>
							<Input
								className="placeholder:text-foreground/50"
								onChange={(e) => setBorrowerField("name", e.target.value)}
								placeholder="Taylor Fairlend"
								value={borrower.name}
							/>
							<FieldError />
						</TextField>
						<TextField isRequired name="borrower.email">
							<Label>Email</Label>
							<Input
								className="placeholder:text-foreground/50"
								onChange={(e) => setBorrowerField("email", e.target.value)}
								placeholder="taylor@example.com"
								type="email"
								value={borrower.email}
							/>
							<FieldError />
						</TextField>
						<TextField isRequired name="borrower.rotessaCustomerId">
							<Label>Rotessa Customer ID</Label>
							<Input
								className="placeholder:text-foreground/50"
								onChange={(e) =>
									setBorrowerField("rotessaCustomerId", e.target.value)
								}
								placeholder="rotessa_123"
								value={borrower.rotessaCustomerId}
							/>
							<FieldError />
						</TextField>
					</FieldGroup>
					{Array.isArray(borrowerSuggestions) &&
						borrowerSuggestions.length > 0 && (
							<div className="mt-2 rounded-md border border-border bg-surface-2 p-3">
								<p className="mb-2 text-foreground/70 text-sm">
									Existing borrowers with this email:
								</p>
								<div className="flex flex-wrap gap-2">
									{borrowerSuggestions.map((suggestion) => (
										<Button
											key={suggestion._id}
											onPress={() =>
												applyBorrowerSuggestion({
													name: suggestion.name,
													email: suggestion.email,
													rotessaCustomerId: suggestion.rotessaCustomerId,
												})
											}
											size="sm"
											variant="ghost"
										>
											<span className="font-medium text-foreground">
												{suggestion.name}
											</span>
											<span className="block text-foreground/60 text-xs">
												{suggestion.email}
											</span>
										</Button>
									))}
								</div>
							</div>
						)}
				</Fieldset.Root>
			</Surface>

			<Separator className="my-6" />
			<Surface
				className="flex flex-col gap-3 rounded-3xl p-6"
				variant="default"
			>
				<Fieldset.Root>
					<Fieldset.Legend className="text-foreground/70">
						Mortgage Basics
					</Fieldset.Legend>
					<Description className="text-foreground/50">
						Loan details are shared between listings and the webhook payload.
					</Description>
					<FieldGroup className="grid gap-x-4 md:grid-cols-3">
						<TextField isRequired name="mortgage.loanAmount">
							<Label>Loan Amount</Label>
							<Input
								className="placeholder:text-foreground/50"
								onChange={(e) => setMortgageField("loanAmount", e.target.value)}
								placeholder="450000"
								type="number"
								value={mortgage.loanAmount}
							/>
							<FieldError />
						</TextField>
						<TextField isRequired name="mortgage.interestRate">
							<Label>Interest Rate (%)</Label>
							<Input
								className="placeholder:text-foreground/50"
								onChange={(e) =>
									setMortgageField("interestRate", e.target.value)
								}
								placeholder="5.25"
								type="number"
								value={mortgage.interestRate}
							/>
							<FieldError />
						</TextField>
						<TextField isRequired name="mortgage.ltv">
							<Label>LTV (%)</Label>
							<Input
								className="placeholder:text-foreground/50"
								onChange={(e) => setMortgageField("ltv", e.target.value)}
								placeholder="75"
								type="number"
								value={mortgage.ltv}
							/>
							<FieldError />
						</TextField>
						<div>
							<Label>Status</Label>
							<Select
								onValueChange={(value) => {
									const statusValue = value as
										| ListingCreationPayload["mortgage"]["status"]
										| undefined;
									if (statusValue) {
										setMortgageField("status", statusValue);
									}
								}}
								value={mortgage.status || ""}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select mortgage status" />
								</SelectTrigger>
								<SelectContent>
									{MORTGAGE_STATUS_OPTIONS.map((option) => (
										<SelectItem key={option.key} value={String(option.key)}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{errors["mortgage.status"] && (
								<p className="mt-1 text-danger text-sm" role="alert">
									{errors["mortgage.status"]}
								</p>
							)}
						</div>
						<div>
							<Label>Mortgage Type</Label>
							<Select
								onValueChange={(value) => {
									setMortgageField(
										"mortgageType",
										value as ListingCreationPayload["mortgage"]["mortgageType"]
									);
								}}
								value={mortgage.mortgageType || ""}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select mortgage type" />
								</SelectTrigger>
								<SelectContent>
									{MORTGAGE_TYPE_OPTIONS.map((option) => (
										<SelectItem key={option.key} value={String(option.key)}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{errors["mortgage.mortgageType"] && (
								<p className="mt-1 text-danger text-sm" role="alert">
									{errors["mortgage.mortgageType"]}
								</p>
							)}
						</div>
						<TextField isRequired name="mortgage.externalMortgageId">
							<Label>External Mortgage ID</Label>
							<Input
								className="placeholder:text-foreground/50"
								onChange={(e) =>
									setMortgageField("externalMortgageId", e.target.value)
								}
								placeholder="ext-mortgage-id"
								value={mortgage.externalMortgageId}
							/>
							<FieldError />
						</TextField>
						<div>
							<Label>Origination Date</Label>
							<DatePicker
								className="w-full"
								date={formatDate(mortgage.originationDate)}
								onDateChange={(date) =>
									setMortgageField("originationDate", toIsoDate(date))
								}
								placeholder="Select origination date"
							/>
							{errors["mortgage.originationDate"] && (
								<p className="mt-1 text-danger text-sm" role="alert">
									{errors["mortgage.originationDate"]}
								</p>
							)}
						</div>
						<div>
							<Label>Maturity Date</Label>
							<DatePicker
								className="w-full"
								date={formatDate(mortgage.maturityDate)}
								onDateChange={(date) =>
									setMortgageField("maturityDate", toIsoDate(date))
								}
								placeholder="Select maturity date"
							/>
							{errors["mortgage.maturityDate"] && (
								<p className="mt-1 text-danger text-sm" role="alert">
									{errors["mortgage.maturityDate"]}
								</p>
							)}
						</div>
						<div />
					</FieldGroup>
				</Fieldset.Root>
			</Surface>
			<Separator className="my-6" />

			<Surface
				className="flex flex-col gap-3 rounded-3xl p-6"
				variant="default"
			>
				<Fieldset.Root>
					<Fieldset.Legend className="text-foreground/70">
						Property &amp; Appraisal
					</Fieldset.Legend>
					<Description className="text-foreground/50">
						Provide property location and valuation data for investors.
					</Description>
					<FieldGroup className="grid gap-x-4 md:grid-cols-3">
						<div className="md:col-span-2">
							<TextField isRequired name="mortgage.address.street">
								<Label>Street Address</Label>
								<Input
									className="placeholder:text-foreground/50"
									onChange={(e) =>
										setMortgageAddressField("street", e.target.value)
									}
									placeholder="123 Market Street"
									value={mortgage.address.street}
								/>
								<FieldError />
							</TextField>
						</div>
						<TextField isRequired name="mortgage.address.city">
							<Label>City</Label>
							<Input
								className="placeholder:text-foreground/50"
								onChange={(e) =>
									setMortgageAddressField("city", e.target.value)
								}
								placeholder="Toronto"
								value={mortgage.address.city}
							/>
							<FieldError />
						</TextField>
						<TextField isRequired name="mortgage.address.state">
							<Label>State / Province</Label>
							<Input
								className="placeholder:text-foreground/50"
								onChange={(e) =>
									setMortgageAddressField("state", e.target.value)
								}
								placeholder="ON"
								value={mortgage.address.state}
							/>
							<FieldError />
						</TextField>
						<TextField isRequired name="mortgage.address.zip">
							<Label>Postal Code</Label>
							<Input
								className="placeholder:text-foreground/50"
								onChange={(e) => setMortgageAddressField("zip", e.target.value)}
								placeholder="M5J 2N1"
								value={mortgage.address.zip}
							/>
							<FieldError />
						</TextField>
						<TextField isRequired name="mortgage.address.country">
							<Label>Country</Label>
							<Input
								className="placeholder:text-foreground/50"
								onChange={(e) =>
									setMortgageAddressField("country", e.target.value)
								}
								placeholder="Canada"
								value={mortgage.address.country}
							/>
							<FieldError />
						</TextField>
					</FieldGroup>
				</Fieldset.Root>
			</Surface>

			<Separator className="my-6" />

			<div>
				<Surface
					className="flex flex-col gap-3 rounded-3xl p-6"
					variant="default"
				>
					<Fieldset.Root>
						<Fieldset.Legend className="text-foreground/70">
							Geographic Coordinates
						</Fieldset.Legend>
						<Description className="text-foreground/50">
							Provide the geographic coordinates of the property.
						</Description>
						<FieldGroup className="grid gap-x-4 md:grid-cols-2">
							<TextField isRequired name="mortgage.location.lat">
								<Label>Latitude</Label>
								<Input
									className="placeholder:text-foreground/50"
									onChange={(e) =>
										setMortgageLocationField("lat", e.target.value)
									}
									placeholder="45.4215"
									type="number"
									value={mortgage.location.lat}
								/>
								<FieldError />
							</TextField>
							<TextField isRequired name="mortgage.location.lng">
								<Label>Longitude</Label>
								<Input
									className="placeholder:text-foreground/50"
									onChange={(e) =>
										setMortgageLocationField("lng", e.target.value)
									}
									placeholder="-75.6972"
									type="number"
									value={mortgage.location.lng}
								/>
								<FieldError />
							</TextField>
						</FieldGroup>
					</Fieldset.Root>
				</Surface>
			</div>

			<Separator className="my-6" />

			<div>
				<Surface
					className="flex flex-col gap-1 rounded-3xl p-6"
					variant="default"
				>
					<Fieldset.Root>
						<Fieldset.Legend className="text-foreground/70">
							Property Details &amp; Appraisal
						</Fieldset.Legend>
						<Description className="text-foreground/50">
							Provide the property details and appraisal information.
						</Description>
						<FieldGroup className="grid gap-x-4 md:grid-cols-3">
							<TextField isRequired name="mortgage.propertyType">
								<Label>Property Type</Label>
								<Input
									className="placeholder:text-foreground/50"
									onChange={(e) =>
										setMortgageField("propertyType", e.target.value)
									}
									placeholder="Townhouse"
									value={mortgage.propertyType}
								/>
								<FieldError />
							</TextField>
							<TextField isRequired name="mortgage.appraisalMarketValue">
								<Label>Appraisal Value</Label>
								<Input
									className="placeholder:text-foreground/50"
									onChange={(e) =>
										setMortgageField("appraisalMarketValue", e.target.value)
									}
									placeholder="540000"
									type="number"
									value={mortgage.appraisalMarketValue}
								/>
								<FieldError />
							</TextField>
							<div>
								<Label>Appraisal Date</Label>
								<DatePicker
									className="w-full"
									date={formatDate(mortgage.appraisalDate)}
									onDateChange={(date) =>
										setMortgageField("appraisalDate", toIsoDate(date))
									}
									placeholder="Select appraisal date"
								/>
								{errors["mortgage.appraisalDate"] && (
									<p className="mt-1 text-danger text-sm" role="alert">
										{errors["mortgage.appraisalDate"]}
									</p>
								)}
							</div>
							<TextField isRequired name="mortgage.appraisalMethod">
								<Label>Appraisal Method</Label>
								<Input
									className="placeholder:text-foreground/50"
									onChange={(e) =>
										setMortgageField("appraisalMethod", e.target.value)
									}
									placeholder="Sales Comparison"
									value={mortgage.appraisalMethod}
								/>
								<FieldError />
							</TextField>
							<TextField isRequired name="mortgage.appraisalCompany">
								<Label>Appraisal Company</Label>
								<Input
									className="placeholder:text-foreground/50"
									onChange={(e) =>
										setMortgageField("appraisalCompany", e.target.value)
									}
									placeholder="Webhook Appraisals"
									value={mortgage.appraisalCompany}
								/>
								<FieldError />
							</TextField>
						</FieldGroup>
					</Fieldset.Root>
				</Surface>
			</div>

			<Separator className="my-6" />

			<Surface
				className="flex flex-col gap-3 rounded-3xl p-6"
				variant="default"
			>
				<Fieldset.Root>
					<Fieldset.Legend className="text-foreground/70">
						Comparable Properties
					</Fieldset.Legend>
					<Description className="text-foreground/50">
						Add comparable property data from the appraisal to support
						valuation. At least one comparable is required.
					</Description>
					<div className="space-y-4">
						{errors.comparables && (
							<p className="text-danger text-sm" role="alert">
								{errors.comparables}
							</p>
						)}
						{comparables.map((comp, index) => (
							<div
								className={cn(
									"rounded-md border p-4",
									comp.asIf
										? "border-amber-400/50 bg-amber-50/30 dark:bg-amber-950/10"
										: "border-border bg-surface-2"
								)}
								key={comp.id ?? `comparable-${index}`}
							>
								{/* Image upload section */}
								<div className="mb-4">
									{comp.previewUrl ? (
										<div className="relative aspect-video overflow-hidden rounded-md">
											{/* biome-ignore lint/performance/noImgElement: Dynamic image from blob URL */}
											<img
												alt={`Comparable property ${index + 1}`}
												className="h-full w-full object-cover"
												height={360}
												src={comp.previewUrl}
												width={640}
											/>
											<button
												aria-label="Remove image"
												className="absolute top-2 right-2 rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70"
												onClick={() => handleRemoveComparableImage(index)}
												type="button"
											>
												<X className="h-4 w-4" />
											</button>
										</div>
									) : (
										<button
											aria-label="Upload comparable property image"
											className="flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-border border-dashed bg-surface-3/50 transition-colors hover:border-primary/50 hover:bg-surface-3"
											disabled={uploadingComparableIndex === index}
											onClick={() =>
												comparableImageInputRefs.current[index]?.click()
											}
											type="button"
										>
											{uploadingComparableIndex === index ? (
												<div className="flex flex-col items-center gap-2">
													<div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
													<span className="text-foreground/50 text-sm">
														Uploading...
													</span>
												</div>
											) : (
												<>
													<ImagePlus className="h-8 w-8 text-foreground/40" />
													<span className="mt-2 text-foreground/50 text-sm">
														Click to upload image
													</span>
												</>
											)}
										</button>
									)}
									<input
										accept="image/*"
										className="hidden"
										onChange={(e) =>
											handleComparableImageUpload(
												index,
												e.target.files?.[0] ?? null
											)
										}
										ref={(el) => {
											comparableImageInputRefs.current[index] = el;
										}}
										type="file"
									/>
								</div>

								{/* Header with title, as-if toggle, and delete button */}
								<div className="mb-3 flex items-center justify-between">
									<div className="flex items-center gap-3">
										<h4 className="font-medium text-foreground">
											Comparable #{index + 1}
										</h4>
										{comp.asIf && <Badge variant="warning">As-If</Badge>}
									</div>
									<div className="flex items-center gap-3">
										<div className="flex items-center gap-2">
											<Checkbox
												checked={comp.asIf ?? false}
												id={`comparable-${index}-asif`}
												onCheckedChange={(checked) =>
													updateComparable(index, { asIf: checked === true })
												}
											/>
											<Label
												className="cursor-pointer text-foreground/70 text-sm"
												htmlFor={`comparable-${index}-asif`}
											>
												As-If Complete
											</Label>
										</div>
										<Button
											aria-label={`Remove comparable ${index + 1}`}
											isIconOnly
											onPress={() => removeComparable(index)}
											size="sm"
											variant="ghost"
										>
											<Trash2 aria-hidden="true" className="h-4 w-4" />
										</Button>
									</div>
								</div>
								<FieldGroup className="grid gap-x-4 md:grid-cols-3">
									<div className="md:col-span-2">
										<TextField
											isRequired
											name={`comparables.${index}.address.street`}
										>
											<Label>Street Address</Label>
											<Input
												className="placeholder:text-foreground/50"
												onChange={(e) =>
													updateComparable(index, {
														address: {
															...comp.address,
															street: e.target.value,
														},
													})
												}
												placeholder="123 Similar Street"
												value={comp.address.street}
											/>
											<FieldError />
										</TextField>
									</div>
									<TextField
										isRequired
										name={`comparables.${index}.address.city`}
									>
										<Label>City</Label>
										<Input
											className="placeholder:text-foreground/50"
											onChange={(e) =>
												updateComparable(index, {
													address: { ...comp.address, city: e.target.value },
												})
											}
											placeholder="Toronto"
											value={comp.address.city}
										/>
										<FieldError />
									</TextField>
									<TextField
										isRequired
										name={`comparables.${index}.address.state`}
									>
										<Label>State / Province</Label>
										<Input
											className="placeholder:text-foreground/50"
											onChange={(e) =>
												updateComparable(index, {
													address: { ...comp.address, state: e.target.value },
												})
											}
											placeholder="ON"
											value={comp.address.state}
										/>
										<FieldError />
									</TextField>
									<TextField
										isRequired
										name={`comparables.${index}.address.zip`}
									>
										<Label>Postal Code</Label>
										<Input
											className="placeholder:text-foreground/50"
											onChange={(e) =>
												updateComparable(index, {
													address: { ...comp.address, zip: e.target.value },
												})
											}
											placeholder="M5J 2N1"
											value={comp.address.zip}
										/>
										<FieldError />
									</TextField>
									<TextField
										isRequired
										name={`comparables.${index}.saleAmount`}
									>
										<Label>Sale Amount</Label>
										<Input
											className="placeholder:text-foreground/50"
											onChange={(e) =>
												updateComparable(index, { saleAmount: e.target.value })
											}
											placeholder="520000"
											type="number"
											value={comp.saleAmount}
										/>
										<FieldError />
									</TextField>
									<div>
										<TextField
											isRequired
											name={`comparables.${index}.saleDate`}
										>
											<Label>Sale Date</Label>
											<DatePicker
												className="w-full"
												date={formatDate(comp.saleDate)}
												onDateChange={(date) =>
													updateComparable(index, {
														saleDate: toIsoDate(date),
													})
												}
												placeholder="Select sale date"
											/>
											{errors[`comparables.${index}.saleDate`] && (
												<p className="mt-1 text-danger text-sm" role="alert">
													{errors[`comparables.${index}.saleDate`]}
												</p>
											)}
										</TextField>
									</div>
									<TextField isRequired name={`comparables.${index}.distance`}>
										<Label>Distance (miles)</Label>
										<Input
											className="placeholder:text-foreground/50"
											onChange={(e) =>
												updateComparable(index, { distance: e.target.value })
											}
											placeholder="0.5"
											type="number"
											value={comp.distance}
										/>
										<FieldError />
									</TextField>
									<TextField name={`comparables.${index}.squareFeet`}>
										<Label>Square Feet</Label>
										<Input
											className="placeholder:text-foreground/50"
											onChange={(e) =>
												updateComparable(index, { squareFeet: e.target.value })
											}
											placeholder="1800"
											type="number"
											value={comp.squareFeet}
										/>
										{errors[`comparables.${index}.squareFeet`] && (
											<p className="mt-1 text-danger text-sm" role="alert">
												{errors[`comparables.${index}.squareFeet`]}
											</p>
										)}
									</TextField>
									<TextField name={`comparables.${index}.bedrooms`}>
										<Label>Bedrooms</Label>
										<Input
											className="placeholder:text-foreground/50"
											onChange={(e) =>
												updateComparable(index, { bedrooms: e.target.value })
											}
											placeholder="3"
											type="number"
											value={comp.bedrooms}
										/>
										{errors[`comparables.${index}.bedrooms`] && (
											<p className="mt-1 text-danger text-sm" role="alert">
												{errors[`comparables.${index}.bedrooms`]}
											</p>
										)}
									</TextField>
									<TextField name={`comparables.${index}.bathrooms`}>
										<Label>Bathrooms</Label>
										<Input
											className="placeholder:text-foreground/50"
											onChange={(e) =>
												updateComparable(index, { bathrooms: e.target.value })
											}
											placeholder="2"
											type="number"
											value={comp.bathrooms}
										/>
										{errors[`comparables.${index}.bathrooms`] && (
											<p className="mt-1 text-danger text-sm" role="alert">
												{errors[`comparables.${index}.bathrooms`]}
											</p>
										)}
									</TextField>
									<TextField name={`comparables.${index}.propertyType`}>
										<Label>Property Type</Label>
										<Input
											className="placeholder:text-foreground/50"
											onChange={(e) =>
												updateComparable(index, {
													propertyType: e.target.value,
												})
											}
											placeholder="Townhouse"
											value={comp.propertyType}
										/>
									</TextField>
								</FieldGroup>
							</div>
						))}

						{/* As-If Appraisal Metadata Section */}
						{comparables.some((c) => c.asIf) && (
							<Surface className="flex flex-col gap-3 rounded-xl border-amber-400/30 bg-amber-50/20 p-6 dark:bg-amber-950/10">
								<Fieldset.Root>
									<Fieldset.Legend className="text-foreground/70">
										As-If Complete Appraisal Details
									</Fieldset.Legend>
									<Description className="text-foreground/50">
										Enter projected market value after improvements are
										complete. Required when using as-if comparables.
									</Description>
									<FieldGroup className="grid gap-x-4 md:grid-cols-2">
										<TextField isRequired name="asIfAppraisal.marketValue">
											<Label>Projected Market Value</Label>
											<Input
												className="placeholder:text-foreground/50"
												onChange={(e) =>
													setAsIfAppraisalField("marketValue", e.target.value)
												}
												placeholder="650000"
												type="number"
												value={asIfAppraisal.marketValue}
											/>
											{errors["asIfAppraisal.marketValue"] && (
												<p className="mt-1 text-danger text-sm" role="alert">
													{errors["asIfAppraisal.marketValue"]}
												</p>
											)}
										</TextField>
										<TextField isRequired name="asIfAppraisal.method">
											<Label>Appraisal Method</Label>
											<Input
												className="placeholder:text-foreground/50"
												onChange={(e) =>
													setAsIfAppraisalField("method", e.target.value)
												}
												placeholder="As-If Complete Sales Comparison"
												value={asIfAppraisal.method}
											/>
											{errors["asIfAppraisal.method"] && (
												<p className="mt-1 text-danger text-sm" role="alert">
													{errors["asIfAppraisal.method"]}
												</p>
											)}
										</TextField>
										<TextField isRequired name="asIfAppraisal.company">
											<Label>Appraisal Company</Label>
											<Input
												className="placeholder:text-foreground/50"
												onChange={(e) =>
													setAsIfAppraisalField("company", e.target.value)
												}
												placeholder="Renovation Appraisals Inc."
												value={asIfAppraisal.company}
											/>
											{errors["asIfAppraisal.company"] && (
												<p className="mt-1 text-danger text-sm" role="alert">
													{errors["asIfAppraisal.company"]}
												</p>
											)}
										</TextField>
										<div>
											<Label>Appraisal Date</Label>
											<DatePicker
												className="w-full"
												date={formatDate(asIfAppraisal.date)}
												onDateChange={(date) =>
													setAsIfAppraisalField("date", toIsoDate(date))
												}
												placeholder="Select as-if appraisal date"
											/>
											{errors["asIfAppraisal.date"] && (
												<p className="mt-1 text-danger text-sm" role="alert">
													{errors["asIfAppraisal.date"]}
												</p>
											)}
										</div>
									</FieldGroup>

									{/* Separator for new optional fields */}
									<Separator className="my-4" />

									{/* New optional fields */}
									<FieldGroup className="space-y-4">
										<TextField name="asIfAppraisal.description">
											<Label>Renovation Description</Label>
											<textarea
												className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
												onChange={(e) =>
													setAsIfAppraisalField("description", e.target.value)
												}
												placeholder="Describe the planned improvements..."
												value={asIfAppraisal.description}
											/>
										</TextField>

										<div className="grid gap-4 md:grid-cols-2">
											<div>
												<Label>Projected Completion Date</Label>
												<DatePicker
													className="w-full"
													date={formatDate(
														asIfAppraisal.projectedCompletionDate
													)}
													onDateChange={(date) =>
														setAsIfAppraisalField(
															"projectedCompletionDate",
															toIsoDate(date)
														)
													}
													placeholder="Select completion date"
												/>
											</div>
											<TextField name="asIfAppraisal.cost">
												<Label>Renovation Cost ($)</Label>
												<Input
													className="placeholder:text-foreground/50"
													onChange={(e) =>
														setAsIfAppraisalField("cost", e.target.value)
													}
													placeholder="50000"
													type="number"
													value={asIfAppraisal.cost}
												/>
											</TextField>
										</div>

										{/* Improvement Images */}
										<div className="space-y-3">
											<div className="flex items-center justify-between">
												<Label>Improvement Mockup Images</Label>
												<Button
													className="text-foreground"
													isDisabled={isUploadingAsIfImages}
													onPress={() => asIfImageInputRef.current?.click()}
													size="sm"
													variant="ghost"
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
												<div className="grid grid-cols-4 gap-2">
													{asIfAppraisalImages.map((image, index) => (
														<div
															className="group relative aspect-square overflow-hidden rounded-md border"
															key={image.storageId}
														>
															{/* biome-ignore lint/a11y/useAltText: decorative preview */}
															{/* biome-ignore lint/performance/noImgElement: Dynamic image from blob URL */}
															<img
																className="h-full w-full object-cover"
																height={200}
																src={
																	image.previewUrl ||
																	`/api/storage/${image.storageId}`
																}
																width={200}
															/>
															<button
																className="absolute top-1 right-1 rounded-full bg-destructive p-1 opacity-0 transition-opacity group-hover:opacity-100"
																onClick={() => handleRemoveAsIfImage(index)}
																type="button"
															>
																<X className="h-3 w-3 text-white" />
															</button>
														</div>
													))}
												</div>
											)}
											{asIfAppraisalImages.length === 0 && (
												<p className="text-foreground/50 text-sm">
													No improvement mockups uploaded yet.
												</p>
											)}
										</div>
									</FieldGroup>
								</Fieldset.Root>
							</Surface>
						)}

						<Button
							className={"text-foreground"}
							onPress={() =>
								addComparable({
									address: {
										street: "",
										city: "",
										state: "",
										zip: "",
									},
									saleAmount: "",
									saleDate: "",
									distance: "",
								})
							}
							size="sm"
							variant="ghost"
						>
							+ Add Comparable
						</Button>
					</div>
				</Fieldset.Root>
			</Surface>

			<Surface>
				<Fieldset.Root>
					<Fieldset.Legend>Listing Settings &amp; Media</Fieldset.Legend>
					<Description className="text-foreground/50">
						Control marketplace visibility and upload supporting assets.
					</Description>

					<div className="flex items-center justify-between gap-4 rounded-md border border-border bg-surface-2 px-4 py-3">
						<div>
							<h3 className="font-medium text-foreground text-sm">
								Marketplace visibility
							</h3>
							<p className="text-foreground/70 text-xs">
								Visible listings appear in investor dashboards.
							</p>
						</div>
						<Switch.Root
							isSelected={listing.visible}
							onChange={(isSelected) => setListingVisibility(isSelected)}
						>
							<Switch.Control>
								<Switch.Thumb />
							</Switch.Control>
							<Label>{listing.visible ? "Visible" : "Hidden"}</Label>
						</Switch.Root>
					</div>

					<div className="space-y-3">
						<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
							<div className="flex gap-3">
								<DocumentTypeSelector
									allowClear={true}
									className="md:w-60"
									onValueChange={(value) => {
										setDocumentType(value as ListingDocumentType);
									}}
									placeholder="Select document type..."
									showDescriptions={true}
									showRecentlyUsed={true}
									value={documentType}
								/>
							</div>
							<Button
								className="text-foreground"
								isDisabled={isUploadingMedia}
								onPress={() => documentInputRef.current?.click()}
								size="sm"
								variant="ghost"
							>
								<Upload aria-hidden="true" className="h-4 w-4" />
								Upload document
							</Button>
						</div>
						<input
							className="hidden"
							onChange={(event) =>
								handleDocumentUpload(
									event.target.files?.[0] ?? null,
									documentType
								)
							}
							ref={documentInputRef}
							type="file"
						/>
						{errors.documents && (
							<p className="text-danger text-sm" role="alert">
								{errors.documents}
							</p>
						)}
						<div className="grid gap-3 md:grid-cols-2">
							{documents.map((document, index) => (
								<div
									className="rounded-md border border-border bg-surface-2 p-3"
									key={`${document.storageId}-${index}`}
								>
									<div className="flex items-center justify-between">
										<p className="font-medium text-foreground text-sm">
											Document #{index + 1}
										</p>
										<Button
											aria-label={`Remove document ${index + 1}`}
											isIconOnly
											onPress={() => removeDocument(index)}
											size="sm"
											variant="ghost"
										>
											<Trash2 aria-hidden="true" className="h-4 w-4" />
										</Button>
									</div>
									<p className="mt-1 text-foreground/70 text-xs">
										Storage ID: {document.storageId}
									</p>
									<div className="mt-3">
										<TextField name={`documents.${index}.name`}>
											<Label>Name</Label>
											<Input
												className="placeholder:text-foreground/50"
												onChange={(e) =>
													updateDocument(index, { name: e.target.value })
												}
												placeholder="Appraisal.pdf"
												value={document.name}
											/>
										</TextField>
									</div>
									<div className="mt-3">
										<Label>Type</Label>
										<Select
											onValueChange={(value) => {
												updateDocument(index, {
													type: value as ListingDocumentType,
												});
											}}
											value={document.type}
										>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select document type" />
											</SelectTrigger>
											<SelectContent>
												{DOCUMENT_OPTIONS.map((option) => (
													<SelectItem
														key={option.key}
														value={String(option.key)}
													>
														{option.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<p className="mt-2 text-foreground/70 text-xs">
										Uploaded{" "}
										{new Date(document.uploadDate).toLocaleDateString()} •{" "}
										{document.fileSize
											? `${Math.round(document.fileSize / 1024)} KB`
											: "Size unknown"}
									</p>
								</div>
							))}
						</div>
					</div>
					<Fieldset.Actions>
						<Button
							isDisabled={isSubmitting || isUploadingMedia}
							onPress={handleReset}
							type="reset"
							variant="danger-soft"
						>
							Reset
						</Button>
						<Button
							isDisabled={isSubmitting || isUploadingMedia}
							type="submit"
							variant="primary"
						>
							{isSubmitting ? "Submitting…" : "Create Listing"}
						</Button>
					</Fieldset.Actions>
				</Fieldset.Root>
			</Surface>
		</Form>
	);
}
