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
import { Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";
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
import { FormErrorSummary } from "./FormErrorSummary";
import {
	type ListingDocumentType,
	useListingCreationStore,
	validateListingForm,
} from "./useListingCreationStore";

const DOCUMENT_OPTIONS: { key: ListingDocumentType; label: string }[] = [
	{ key: "appraisal", label: "Appraisal" },
	{ key: "title", label: "Title" },
	{ key: "inspection", label: "Inspection" },
	{ key: "loan_agreement", label: "Loan Agreement" },
	{ key: "insurance", label: "Insurance" },
];

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
	const updateImage = useListingCreationStore((state) => state.updateImage);
	const removeImage = useListingCreationStore((state) => state.removeImage);
	const addDocument = useListingCreationStore((state) => state.addDocument);
	const updateDocument = useListingCreationStore(
		(state) => state.updateDocument
	);
	const removeDocument = useListingCreationStore(
		(state) => state.removeDocument
	);
	const addComparable = useListingCreationStore(
		(state) => state.addComparable
	);
	const updateComparable = useListingCreationStore(
		(state) => state.updateComparable
	);
	const removeComparable = useListingCreationStore(
		(state) => state.removeComparable
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

	const emailForLookup = borrower.email.trim();
	const shouldLookup =
		emailForLookup.length > 2 && emailForLookup.includes("@");
	const borrowerSuggestions = useQuery(
		api.borrowers.searchBorrowersByEmail,
		shouldLookup ? { email: emailForLookup } : "skip"
	);

	const handleImageUpload = async (files: FileList | null) => {
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
					type: document.type,
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
			})),
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
						Add comparable property data from the appraisal to support valuation.
					</Description>
					<div className="space-y-4">
						{errors.comparables && (
							<p className="text-danger text-sm" role="alert">
								{errors.comparables}
							</p>
						)}
						{comparables.map((comp, index) => (
							<div
								className="rounded-md border border-border bg-surface-2 p-4"
								key={`comparable-${index}`}
							>
								<div className="mb-3 flex items-center justify-between">
									<h4 className="font-medium text-foreground">
										Comparable #{index + 1}
									</h4>
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
										<TextField isRequired name={`comparables.${index}.saleDate`}>
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
									<TextField
										isRequired
										name={`comparables.${index}.distance`}
									>
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
						<Button
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
						<div className="flex items-center justify-between">
							<h3 className="font-medium text-foreground">Property Images</h3>
							<Button
								isDisabled={isUploadingMedia}
								onPress={() => imageInputRef.current?.click()}
								size="sm"
								variant="ghost"
							>
								<Upload aria-hidden="true" className="h-4 w-4" />
								Upload image
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
							<p className="text-danger text-sm" role="alert">
								{errors.images}
							</p>
						)}
						<div className="grid gap-3 md:grid-cols-2">
							{images.map((image, index) => (
								<div
									className="rounded-md border border-border bg-surface-2 p-3"
									key={`${image.storageId}-${index}`}
								>
									<div className="flex items-center justify-between">
										<p className="font-medium text-foreground text-sm">
											Image #{index + 1}
										</p>
										<Button
											aria-label={`Remove image ${index + 1}`}
											isIconOnly
											onPress={() => removeImage(index)}
											size="sm"
											variant="ghost"
										>
											<Trash2 aria-hidden="true" className="h-4 w-4" />
										</Button>
									</div>
									<p className="mt-1 text-foreground/70 text-xs">
										Storage ID: {image.storageId}
									</p>
									<div className="mt-3">
										<TextField name={`images.${index}.alt`}>
											<Label>Alt text</Label>
											<Input
												className="placeholder:text-foreground/50"
												onChange={(e) =>
													updateImage(index, { alt: e.target.value })
												}
												placeholder="Front elevation"
												value={image.alt}
											/>
										</TextField>
									</div>
								</div>
							))}
						</div>
					</div>

					<Separator />

					<div className="space-y-3">
						<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
							<div className="flex gap-3">
								<Select
									onValueChange={(value) => {
										setDocumentType(value as ListingDocumentType);
									}}
									value={documentType}
								>
									<SelectTrigger className="md:w-60">
										<SelectValue placeholder="Select document type" />
									</SelectTrigger>
									<SelectContent>
										{DOCUMENT_OPTIONS.map((option) => (
											<SelectItem key={option.key} value={String(option.key)}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<Button
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
