"use client";

import { create } from "zustand";

export type BorrowerSuggestion = {
	name: string;
	email: string;
	rotessaCustomerId: string;
};

export type BorrowerFormState = {
	name: string;
	email: string;
	rotessaCustomerId: string;
};

export type MortgageAddressState = {
	street: string;
	city: string;
	state: string;
	zip: string;
	country: string;
};

export type MortgageLocationState = {
	lat: string;
	lng: string;
};

export type ListingDocumentType = string; // Now supports dynamic document types

export type MortgageFormState = {
	loanAmount: string;
	interestRate: string;
	originationDate: string;
	maturityDate: string;
	status: "active" | "renewed" | "closed" | "defaulted";
	mortgageType: "1st" | "2nd" | "other";
	propertyType: string;
	appraisalMarketValue: string;
	appraisalMethod: string;
	appraisalCompany: string;
	appraisalDate: string;
	ltv: string;
	externalMortgageId: string;
	address: MortgageAddressState;
	location: MortgageLocationState;
};

export type ListingFormState = {
	visible: boolean;
};

export type ListingImageEntry = {
	storageId: string;
	alt: string;
	order: number;
	previewUrl?: string;
};

export type ListingDocumentEntry = {
	name: string;
	type: ListingDocumentType;
	storageId: string;
	uploadDate: string;
	fileSize?: number;
};

export type ComparableAddressState = {
	street: string;
	city: string;
	state: string;
	zip: string;
};

export type ComparableFormState = {
	id?: string; // Unique ID for React keys
	address: ComparableAddressState;
	saleAmount: string;
	saleDate: string;
	distance: string;
	squareFeet?: string;
	bedrooms?: string;
	bathrooms?: string;
	propertyType?: string;
	imageStorageId?: string;
	previewUrl?: string;
	asIf?: boolean; // Mark as "as-if complete" comparable (post-renovation value)
};

export type AsIfAppraisalFormState = {
	marketValue: string;
	method: string;
	company: string;
	date: string;
	// New optional fields for renovation details
	description: string;
	projectedCompletionDate: string;
	cost: string;
};

export type AsIfAppraisalImageEntry = {
	storageId: string;
	previewUrl?: string;
};

const createInitialBorrower = (): BorrowerFormState => ({
	name: "",
	email: "",
	rotessaCustomerId: "",
});

const createInitialMortgage = (): MortgageFormState => ({
	loanAmount: "",
	interestRate: "",
	originationDate: "",
	maturityDate: "",
	status: "active",
	mortgageType: "1st",
	propertyType: "",
	appraisalMarketValue: "",
	appraisalMethod: "",
	appraisalCompany: "",
	appraisalDate: "",
	ltv: "",
	externalMortgageId: "",
	address: {
		street: "",
		city: "",
		state: "",
		zip: "",
		country: "",
	},
	location: {
		lat: "",
		lng: "",
	},
});

const createInitialListing = (): ListingFormState => ({
	visible: true,
});

const _createInitialComparable = (): ComparableFormState => ({
	id: crypto.randomUUID(),
	address: {
		street: "",
		city: "",
		state: "",
		zip: "",
	},
	saleAmount: "",
	saleDate: "",
	distance: "",
});

const createInitialAsIfAppraisal = (): AsIfAppraisalFormState => ({
	marketValue: "",
	method: "",
	company: "",
	date: "",
	description: "",
	projectedCompletionDate: "",
	cost: "",
});

const removeError = (errors: Record<string, string>, field: string) => {
	if (!errors[field]) return errors;
	const { [field]: _removed, ...rest } = errors;
	return rest;
};

// Regex: requires non-space/non-@ chars before @, @, non-space/non-@ chars after @, dot, and non-space/non-@ chars after dot
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates an email address using a simple regex pattern.
 * Requires non-space/non-@ characters before and after @, and a dot in the domain.
 */
const isValidEmail = (email: string): boolean => {
	const trimmed = email.trim();
	return EMAIL_REGEX.test(trimmed);
};

type ListingCreationStore = {
	borrower: BorrowerFormState;
	mortgage: MortgageFormState;
	listing: ListingFormState;
	images: ListingImageEntry[];
	documents: ListingDocumentEntry[];
	comparables: ComparableFormState[];
	asIfAppraisal: AsIfAppraisalFormState;
	asIfAppraisalImages: AsIfAppraisalImageEntry[];
	errors: Record<string, string>;
	isSubmitting: boolean;
	setBorrowerField: <K extends keyof BorrowerFormState>(
		field: K,
		value: BorrowerFormState[K]
	) => void;
	applyBorrowerSuggestion: (suggestion: BorrowerSuggestion) => void;
	setMortgageField: <
		K extends keyof Omit<MortgageFormState, "address" | "location">,
	>(
		field: K,
		value: MortgageFormState[K]
	) => void;
	setMortgageAddressField: <K extends keyof MortgageAddressState>(
		field: K,
		value: MortgageAddressState[K]
	) => void;
	setMortgageLocationField: <K extends keyof MortgageLocationState>(
		field: K,
		value: MortgageLocationState[K]
	) => void;
	setListingVisibility: (visible: boolean) => void;
	addImage: (entry: ListingImageEntry) => void;
	updateImage: (index: number, entry: Partial<ListingImageEntry>) => void;
	removeImage: (index: number) => void;
	addDocument: (entry: ListingDocumentEntry) => void;
	updateDocument: (index: number, entry: Partial<ListingDocumentEntry>) => void;
	removeDocument: (index: number) => void;
	addComparable: (entry: ComparableFormState) => void;
	updateComparable: (
		index: number,
		entry: Partial<ComparableFormState>
	) => void;
	removeComparable: (index: number) => void;
	setAsIfAppraisalField: <K extends keyof AsIfAppraisalFormState>(
		field: K,
		value: AsIfAppraisalFormState[K]
	) => void;
	addAsIfAppraisalImage: (entry: AsIfAppraisalImageEntry) => void;
	removeAsIfAppraisalImage: (index: number) => void;
	setErrors: (errors: Record<string, string>) => void;
	clearError: (field: string) => void;
	clearErrors: () => void;
	setSubmitting: (isSubmitting: boolean) => void;
	reset: () => void;
};

export const useListingCreationStore = create<ListingCreationStore>(
	// biome-ignore lint/correctness/noUnusedFunctionParameters: we need the get function for the reset function
	(set, get) => ({
		borrower: createInitialBorrower(),
		mortgage: createInitialMortgage(),
		listing: createInitialListing(),
		images: [],
		documents: [],
		comparables: [],
		asIfAppraisal: createInitialAsIfAppraisal(),
		asIfAppraisalImages: [],
		errors: {},
		isSubmitting: false,
		setBorrowerField: (field, value) =>
			set((state) => {
				// Normalize email: trim and lowercase
				const normalizedValue =
					field === "email" && typeof value === "string"
						? value.trim().toLowerCase()
						: value;
				return {
					borrower: { ...state.borrower, [field]: normalizedValue },
					errors: removeError(state.errors, `borrower.${String(field)}`),
				};
			}),
		applyBorrowerSuggestion: (suggestion) =>
			set((state) => {
				const nextErrors = [
					"borrower.name",
					"borrower.email",
					"borrower.rotessaCustomerId",
				].reduce((acc, key) => removeError(acc, key), state.errors);
				return {
					borrower: {
						name: suggestion.name,
						email: suggestion.email.trim().toLowerCase(),
						rotessaCustomerId: suggestion.rotessaCustomerId,
					},
					errors: nextErrors,
				};
			}),
		setMortgageField: (field, value) =>
			set((state) => ({
				mortgage: { ...state.mortgage, [field]: value } as MortgageFormState,
				errors: removeError(state.errors, `mortgage.${String(field)}`),
			})),
		setMortgageAddressField: (field, value) =>
			set((state) => ({
				mortgage: {
					...state.mortgage,
					address: { ...state.mortgage.address, [field]: value },
				},
				errors: removeError(state.errors, `mortgage.address.${String(field)}`),
			})),
		setMortgageLocationField: (field, value) =>
			set((state) => ({
				mortgage: {
					...state.mortgage,
					location: { ...state.mortgage.location, [field]: value },
				},
				errors: removeError(state.errors, `mortgage.location.${String(field)}`),
			})),
		setListingVisibility: (visible) =>
			set((state) => ({
				listing: { ...state.listing, visible },
				errors: removeError(state.errors, "listing.visible"),
			})),
		addImage: (entry) =>
			set((state) => ({
				images: [...state.images, { ...entry, order: state.images.length }],
			})),
		updateImage: (index, entry) =>
			set((state) => ({
				images: state.images.map((image, i) =>
					i === index ? { ...image, ...entry } : image
				),
			})),
		removeImage: (index) =>
			set((state) => {
				const nextImages = state.images
					.filter((_, i) => i !== index)
					.map((image, i) => ({
						...image,
						order: i,
					}));
				return { images: nextImages };
			}),
		addDocument: (entry) =>
			set((state) => ({ documents: [...state.documents, entry] })),
		updateDocument: (index, entry) =>
			set((state) => ({
				documents: state.documents.map((doc, i) =>
					i === index ? { ...doc, ...entry } : doc
				),
			})),
		removeDocument: (index) =>
			set((state) => ({
				documents: state.documents.filter((_, i) => i !== index),
			})),
		addComparable: (entry) =>
			set((state) => ({
				comparables: [
					...state.comparables,
					{ ...entry, id: entry.id ?? crypto.randomUUID() },
				],
			})),
		updateComparable: (index, entry) =>
			set((state) => ({
				comparables: state.comparables.map((comp, i) =>
					i === index ? { ...comp, ...entry } : comp
				),
			})),
		removeComparable: (index) =>
			set((state) => ({
				comparables: state.comparables.filter((_, i) => i !== index),
			})),
		setAsIfAppraisalField: (field, value) =>
			set((state) => ({
				asIfAppraisal: { ...state.asIfAppraisal, [field]: value },
				errors: removeError(state.errors, `asIfAppraisal.${String(field)}`),
			})),
		addAsIfAppraisalImage: (entry) =>
			set((state) => ({
				asIfAppraisalImages: [...state.asIfAppraisalImages, entry],
			})),
		removeAsIfAppraisalImage: (index) =>
			set((state) => ({
				asIfAppraisalImages: state.asIfAppraisalImages.filter(
					(_, i) => i !== index
				),
			})),
		setErrors: (errors) => set({ errors }),
		clearError: (field) =>
			set((state) => ({ errors: removeError(state.errors, field) })),
		clearErrors: () => set({ errors: {} }),
		setSubmitting: (isSubmitting) => set({ isSubmitting }),
		reset: () =>
			set({
				borrower: createInitialBorrower(),
				mortgage: createInitialMortgage(),
				listing: createInitialListing(),
				images: [],
				documents: [],
				comparables: [],
				asIfAppraisal: createInitialAsIfAppraisal(),
				asIfAppraisalImages: [],
				errors: {},
				isSubmitting: false,
			}),
	})
);

export const validateListingForm = ({
	borrower,
	mortgage,
	listing,
	images,
	documents,
	comparables,
	asIfAppraisal,
	asIfAppraisalImages,
}: Pick<
	ListingCreationStore,
	| "borrower"
	| "mortgage"
	| "listing"
	| "images"
	| "documents"
	| "comparables"
	| "asIfAppraisal"
	| "asIfAppraisalImages"
>) => {
	const errors: Record<string, string> = {};

	if (!borrower.name.trim()) {
		errors["borrower.name"] = "Borrower name is required";
	}
	const trimmedEmail = borrower.email.trim();
	if (!trimmedEmail) {
		errors["borrower.email"] = "Borrower email is required";
	} else if (!isValidEmail(trimmedEmail)) {
		errors["borrower.email"] = "Borrower email must be valid";
	}
	if (!borrower.rotessaCustomerId.trim()) {
		errors["borrower.rotessaCustomerId"] = "Rotessa customer ID is required";
	}

	const loanAmount = Number(mortgage.loanAmount);
	if (!Number.isFinite(loanAmount) || loanAmount <= 0) {
		errors["mortgage.loanAmount"] = "Loan amount must be a positive number";
	}

	const interestRate = Number(mortgage.interestRate);
	if (
		!Number.isFinite(interestRate) ||
		interestRate <= 0 ||
		interestRate >= 100
	) {
		errors["mortgage.interestRate"] = "Interest rate must be between 0 and 100";
	}

	if (!mortgage.originationDate) {
		errors["mortgage.originationDate"] = "Origination date is required";
	}
	if (!mortgage.maturityDate) {
		errors["mortgage.maturityDate"] = "Maturity date is required";
	}

	if (mortgage.originationDate && mortgage.maturityDate) {
		const origination = Date.parse(mortgage.originationDate);
		const maturity = Date.parse(mortgage.maturityDate);
		if (
			!(Number.isNaN(origination) || Number.isNaN(maturity)) &&
			origination > maturity
		) {
			errors["mortgage.maturityDate"] =
				"Maturity date must be after origination date";
		}
	}

	if (!mortgage.propertyType.trim()) {
		errors["mortgage.propertyType"] = "Property type is required";
	}

	const appraisalMarketValue = Number(mortgage.appraisalMarketValue);
	if (!Number.isFinite(appraisalMarketValue) || appraisalMarketValue <= 0) {
		errors["mortgage.appraisalMarketValue"] =
			"Appraisal value must be positive";
	}

	if (!mortgage.appraisalMethod.trim()) {
		errors["mortgage.appraisalMethod"] = "Appraisal method is required";
	}

	if (!mortgage.appraisalCompany.trim()) {
		errors["mortgage.appraisalCompany"] = "Appraisal company is required";
	}

	if (mortgage.appraisalDate) {
		const parsedDate = Date.parse(mortgage.appraisalDate);
		if (Number.isNaN(parsedDate)) {
			errors["mortgage.appraisalDate"] = "Appraisal date must be valid";
		} else if (parsedDate > Date.now()) {
			errors["mortgage.appraisalDate"] =
				"Appraisal date cannot be in the future";
		}
	} else {
		errors["mortgage.appraisalDate"] = "Appraisal date is required";
	}

	const ltv = Number(mortgage.ltv);
	if (!Number.isFinite(ltv) || ltv < 0 || ltv > 100) {
		errors["mortgage.ltv"] = "LTV must be between 0 and 100";
	}

	if (!mortgage.externalMortgageId.trim()) {
		errors["mortgage.externalMortgageId"] =
			"External mortgage ID is required for webhook idempotency";
	}

	if (!mortgage.address.street.trim()) {
		errors["mortgage.address.street"] = "Street is required";
	}
	if (!mortgage.address.city.trim()) {
		errors["mortgage.address.city"] = "City is required";
	}
	if (!mortgage.address.state.trim()) {
		errors["mortgage.address.state"] = "State / Province is required";
	}
	if (!mortgage.address.zip.trim()) {
		errors["mortgage.address.zip"] = "Postal code is required";
	}
	if (!mortgage.address.country.trim()) {
		errors["mortgage.address.country"] = "Country is required";
	}

	const lat = Number(mortgage.location.lat);
	if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
		errors["mortgage.location.lat"] = "Latitude must be between -90 and 90";
	}
	const lng = Number(mortgage.location.lng);
	if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
		errors["mortgage.location.lng"] = "Longitude must be between -180 and 180";
	}

	if (listing.visible === undefined) {
		errors["listing.visible"] = "Listing visibility must be specified";
	}

	if (images.some((image) => !image.storageId)) {
		errors.images = "All uploaded images must have a storage ID";
	}
	if (documents.some((document) => !document.storageId)) {
		errors.documents = "All uploaded documents must have a storage ID";
	}

	// Validate comparables
	if (comparables.length === 0) {
		errors.comparables = "At least one comparable is required";
	} else if (comparables.length > 10) {
		errors.comparables = "Maximum 10 comparables allowed";
	}

	comparables.forEach((comp, index) => {
		// Validate address fields
		if (!comp.address.street.trim()) {
			errors[`comparables.${index}.address.street`] = "Street is required";
		}
		if (!comp.address.city.trim()) {
			errors[`comparables.${index}.address.city`] = "City is required";
		}
		if (!comp.address.state.trim()) {
			errors[`comparables.${index}.address.state`] =
				"State / Province is required";
		}
		if (!comp.address.zip.trim()) {
			errors[`comparables.${index}.address.zip`] = "Postal code is required";
		}

		// Validate sale amount
		const saleAmount = Number(comp.saleAmount);
		if (!Number.isFinite(saleAmount) || saleAmount <= 0) {
			errors[`comparables.${index}.saleAmount`] =
				"Sale amount must be a positive number";
		}

		// Validate sale date
		if (comp.saleDate) {
			const parsedDate = Date.parse(comp.saleDate);
			if (Number.isNaN(parsedDate)) {
				errors[`comparables.${index}.saleDate`] = "Sale date must be valid";
			} else if (parsedDate > Date.now()) {
				errors[`comparables.${index}.saleDate`] =
					"Sale date cannot be in the future";
			}
		} else {
			errors[`comparables.${index}.saleDate`] = "Sale date is required";
		}

		// Validate distance
		const distance = Number(comp.distance);
		if (!Number.isFinite(distance) || distance < 0) {
			errors[`comparables.${index}.distance`] = "Distance must be 0 or greater";
		}

		// Validate optional numeric fields
		if (comp.squareFeet) {
			const squareFeet = Number(comp.squareFeet);
			if (!Number.isFinite(squareFeet) || squareFeet <= 0) {
				errors[`comparables.${index}.squareFeet`] =
					"Square feet must be positive";
			}
		}
		if (comp.bedrooms !== undefined && comp.bedrooms !== "") {
			const bedrooms = Number(comp.bedrooms);
			if (!Number.isFinite(bedrooms) || bedrooms < 0) {
				errors[`comparables.${index}.bedrooms`] =
					"Bedrooms must be 0 or greater";
			}
		}
		if (comp.bathrooms !== undefined && comp.bathrooms !== "") {
			const bathrooms = Number(comp.bathrooms);
			if (!Number.isFinite(bathrooms) || bathrooms < 0) {
				errors[`comparables.${index}.bathrooms`] =
					"Bathrooms must be 0 or greater";
			}
		}
	});

	// Validate as-if appraisal when any comparable has asIf=true
	const hasAsIfComparable = comparables.some((comp) => comp.asIf === true);
	if (hasAsIfComparable) {
		const asIfMarketValue = Number(asIfAppraisal.marketValue);
		if (!Number.isFinite(asIfMarketValue) || asIfMarketValue <= 0) {
			errors["asIfAppraisal.marketValue"] =
				"As-if market value must be a positive number";
		}

		if (!asIfAppraisal.method.trim()) {
			errors["asIfAppraisal.method"] = "As-if appraisal method is required";
		}

		if (!asIfAppraisal.company.trim()) {
			errors["asIfAppraisal.company"] = "As-if appraisal company is required";
		}

		if (asIfAppraisal.date) {
			const parsedDate = Date.parse(asIfAppraisal.date);
			if (Number.isNaN(parsedDate)) {
				errors["asIfAppraisal.date"] = "As-if appraisal date must be valid";
			} else if (parsedDate > Date.now()) {
				errors["asIfAppraisal.date"] =
					"As-if appraisal date cannot be in the future";
			}
		} else {
			errors["asIfAppraisal.date"] = "As-if appraisal date is required";
		}
	}

	return errors;
};
