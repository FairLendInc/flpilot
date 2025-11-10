"use client";

import { create } from "zustand";
import type { Id } from "@/convex/_generated/dataModel";

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

export type MortgageDocumentType =
	| "appraisal"
	| "title"
	| "inspection"
	| "loan_agreement"
	| "insurance";

export type MortgageImageEntry = {
	storageId: string;
	alt: string;
	order: number;
	url?: string | null; // Signed URL from getMortgage query
	previewUrl?: string; // Object URL for newly uploaded images
};

export type MortgageDocumentEntry = {
	name: string;
	type: MortgageDocumentType;
	storageId: string;
	uploadDate: string;
	fileSize?: number;
	url?: string | null; // Signed URL from getMortgage query
};

const createInitialMortgage = (): {
	mortgageId: string | null;
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
	borrowerId: string;
	address: MortgageAddressState;
	location: MortgageLocationState;
	priorEncumbrance: { amount: number; lender: string } | null;
	asIfAppraisal: {
		marketValue: number;
		method: string;
		company: string;
		date: string;
	} | null;
} => ({
	mortgageId: null,
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
	borrowerId: "",
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
	priorEncumbrance: null,
	asIfAppraisal: null,
});

const removeError = (errors: Record<string, string>, field: string) => {
	if (!errors[field]) return errors;
	const { [field]: _removed, ...rest } = errors;
	return rest;
};

type MortgageUpdateStore = {
	// Mortgage data
	mortgageId: string | null;
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
	borrowerId: string;
	address: MortgageAddressState;
	location: MortgageLocationState;
	priorEncumbrance: { amount: number; lender: string } | null;
	asIfAppraisal: {
		marketValue: number;
		method: string;
		company: string;
		date: string;
	} | null;

	// Media arrays
	images: MortgageImageEntry[];
	documents: MortgageDocumentEntry[];

	// UI state
	errors: Record<string, string>;
	isSubmitting: boolean;
	isLoading: boolean;

	// Actions
	setField: <
		K extends keyof Omit<
			ReturnType<typeof createInitialMortgage>,
			"address" | "location" | "mortgageId"
		>,
	>(
		field: K,
		value: ReturnType<typeof createInitialMortgage>[K]
	) => void;
	setAddressField: <K extends keyof MortgageAddressState>(
		field: K,
		value: MortgageAddressState[K]
	) => void;
	setLocationField: <K extends keyof MortgageLocationState>(
		field: K,
		value: MortgageLocationState[K]
	) => void;
	setPriorEncumbrance: (
		data: { amount: number; lender: string } | null
	) => void;
	setAsIfAppraisal: (
		data: {
			marketValue: number;
			method: string;
			company: string;
			date: string;
		} | null
	) => void;
	addImage: (entry: MortgageImageEntry) => void;
	updateImage: (index: number, entry: Partial<MortgageImageEntry>) => void;
	removeImage: (index: number) => void;
	moveImageUp: (index: number) => void;
	moveImageDown: (index: number) => void;
	addDocument: (entry: MortgageDocumentEntry) => void;
	updateDocument: (
		index: number,
		entry: Partial<MortgageDocumentEntry>
	) => void;
	removeDocument: (index: number) => void;
	loadFromMortgage: (mortgage: {
		_id: Id<"mortgages">;
		loanAmount: number;
		interestRate: number;
		originationDate: string;
		maturityDate: string;
		status: "active" | "renewed" | "closed" | "defaulted";
		mortgageType: "1st" | "2nd" | "other";
		propertyType: string;
		appraisalMarketValue: number;
		appraisalMethod: string;
		appraisalCompany: string;
		appraisalDate: string;
		ltv: number;
		externalMortgageId?: string;
		borrowerId: Id<"borrowers">;
		address: {
			street: string;
			city: string;
			state: string;
			zip: string;
			country: string;
		};
		location: {
			lat: number;
			lng: number;
		};
		priorEncumbrance?: {
			amount: number;
			lender: string;
		} | null;
		asIfAppraisal?: {
			marketValue: number;
			method: string;
			company: string;
			date: string;
		} | null;
		images?: Array<{
			storageId: Id<"_storage">;
			alt?: string;
			order: number;
			url?: string | null;
		}>;
		documents?: Array<{
			name: string;
			type: MortgageDocumentType;
			storageId: Id<"_storage">;
			uploadDate: string;
			fileSize?: number;
			url?: string | null;
		}>;
	}) => void;
	setErrors: (errors: Record<string, string>) => void;
	clearError: (field: string) => void;
	clearErrors: () => void;
	setSubmitting: (isSubmitting: boolean) => void;
	setLoading: (isLoading: boolean) => void;
	reset: () => void;
	validate: () => Record<string, string>;
};

export const useMortgageUpdateStore = create<MortgageUpdateStore>(
	(set, get) => ({
		...createInitialMortgage(),
		images: [],
		documents: [],
		errors: {},
		isSubmitting: false,
		isLoading: false,

		setField: (field, value) =>
			set(
				(state) =>
					({
						...state,
						[field]: value,
						errors: removeError(state.errors, String(field)),
					}) as MortgageUpdateStore
			),

		setAddressField: (field, value) =>
			set((state) => ({
				address: { ...state.address, [field]: value },
				errors: removeError(state.errors, `address.${String(field)}`),
			})),

		setLocationField: (field, value) =>
			set((state) => ({
				location: { ...state.location, [field]: value },
				errors: removeError(state.errors, `location.${String(field)}`),
			})),

		setPriorEncumbrance: (data) =>
			set((state) => {
				let errors = { ...state.errors };
				if (data === null) {
					// Remove errors when field is cleared
					errors = removeError(errors, "priorEncumbranceAmount");
					errors = removeError(errors, "priorEncumbranceLender");
				}
				return { priorEncumbrance: data, errors };
			}),

		setAsIfAppraisal: (data) =>
			set((state) => {
				let errors = { ...state.errors };
				if (data === null) {
					// Remove errors when field is cleared
					errors = removeError(errors, "asIfAppraisalMarketValue");
					errors = removeError(errors, "asIfAppraisalMethod");
					errors = removeError(errors, "asIfAppraisalCompany");
					errors = removeError(errors, "asIfAppraisalDate");
				}
				return { asIfAppraisal: data, errors };
			}),

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

		moveImageUp: (index) =>
			set((state) => {
				if (index === 0) return state;
				const images = [...state.images];
				const temp = images[index - 1];
				images[index - 1] = { ...images[index], order: index - 1 };
				images[index] = { ...temp, order: index };
				return { images };
			}),

		moveImageDown: (index) =>
			set((state) => {
				if (index === state.images.length - 1) return state;
				const images = [...state.images];
				const temp = images[index];
				images[index] = { ...images[index + 1], order: index };
				images[index + 1] = { ...temp, order: index + 1 };
				return { images };
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

		loadFromMortgage: (mortgage) => {
			// Convert ISO date strings to YYYY-MM-DD format for HTML date inputs
			const formatDateForInput = (isoDate: string): string => {
				if (!isoDate) return "";
				const date = new Date(isoDate);
				if (Number.isNaN(date.getTime())) return isoDate; // Return as-is if invalid
				const year = date.getFullYear();
				const month = String(date.getMonth() + 1).padStart(2, "0");
				const day = String(date.getDate()).padStart(2, "0");
				return `${year}-${month}-${day}`;
			};

			set({
				mortgageId: mortgage._id,
				loanAmount: String(mortgage.loanAmount),
				interestRate: String(mortgage.interestRate),
				originationDate: formatDateForInput(mortgage.originationDate),
				maturityDate: formatDateForInput(mortgage.maturityDate),
				status: mortgage.status,
				mortgageType: mortgage.mortgageType,
				propertyType: mortgage.propertyType,
				appraisalMarketValue: String(mortgage.appraisalMarketValue),
				appraisalMethod: mortgage.appraisalMethod,
				appraisalCompany: mortgage.appraisalCompany,
				appraisalDate: formatDateForInput(mortgage.appraisalDate),
				ltv: String(mortgage.ltv),
				externalMortgageId: mortgage.externalMortgageId ?? "",
				borrowerId: mortgage.borrowerId,
				address: {
					street: mortgage.address.street,
					city: mortgage.address.city,
					state: mortgage.address.state,
					zip: mortgage.address.zip,
					country: mortgage.address.country,
				},
				location: {
					lat: String(mortgage.location.lat),
					lng: String(mortgage.location.lng),
				},
				priorEncumbrance: mortgage.priorEncumbrance ?? null,
				asIfAppraisal: mortgage.asIfAppraisal ?? null,
				images: (mortgage.images ?? []).map((img) => ({
					storageId: img.storageId,
					alt: img.alt ?? "",
					order: img.order,
					url: img.url ?? null,
				})),
				documents: (mortgage.documents ?? []).map((doc) => ({
					name: doc.name,
					type: doc.type,
					storageId: doc.storageId,
					uploadDate: doc.uploadDate,
					fileSize: doc.fileSize,
					url: doc.url ?? null,
				})),
				errors: {},
			});
		},

		setErrors: (errors) => set({ errors }),
		clearError: (field) =>
			set((state) => ({ errors: removeError(state.errors, field) })),
		clearErrors: () => set({ errors: {} }),
		setSubmitting: (isSubmitting) => set({ isSubmitting }),
		setLoading: (isLoading) => set({ isLoading }),
		reset: () =>
			set({
				...createInitialMortgage(),
				images: [],
				documents: [],
				errors: {},
				isSubmitting: false,
				isLoading: false,
			}),

		validate: () => {
			const state = get();
			const errors: Record<string, string> = {};

			const loanAmount = Number(state.loanAmount);
			if (!Number.isFinite(loanAmount) || loanAmount <= 0) {
				errors.loanAmount = "Loan amount must be a positive number";
			}

			const interestRate = Number(state.interestRate);
			if (
				!Number.isFinite(interestRate) ||
				interestRate <= 0 ||
				interestRate >= 100
			) {
				errors.interestRate = "Interest rate must be between 0 and 100";
			}

			if (!state.originationDate) {
				errors.originationDate = "Origination date is required";
			}
			if (!state.maturityDate) {
				errors.maturityDate = "Maturity date is required";
			}

			if (state.originationDate && state.maturityDate) {
				const origination = Date.parse(state.originationDate);
				const maturity = Date.parse(state.maturityDate);
				if (
					!(Number.isNaN(origination) || Number.isNaN(maturity)) &&
					origination > maturity
				) {
					errors.maturityDate = "Maturity date must be after origination date";
				}
			}

			if (!state.propertyType.trim()) {
				errors.propertyType = "Property type is required";
			}

			const appraisalMarketValue = Number(state.appraisalMarketValue);
			if (!Number.isFinite(appraisalMarketValue) || appraisalMarketValue <= 0) {
				errors.appraisalMarketValue = "Appraisal value must be positive";
			}

			if (!state.appraisalMethod.trim()) {
				errors.appraisalMethod = "Appraisal method is required";
			}

			if (!state.appraisalCompany.trim()) {
				errors.appraisalCompany = "Appraisal company is required";
			}

			if (state.appraisalDate) {
				const parsedDate = Date.parse(state.appraisalDate);
				if (Number.isNaN(parsedDate)) {
					errors.appraisalDate = "Appraisal date must be valid";
				} else if (parsedDate > Date.now()) {
					errors.appraisalDate = "Appraisal date cannot be in the future";
				}
			} else {
				errors.appraisalDate = "Appraisal date is required";
			}

			const ltv = Number(state.ltv);
			if (!Number.isFinite(ltv) || ltv < 0 || ltv > 100) {
				errors.ltv = "LTV must be between 0 and 100";
			}

			if (!state.address.street.trim()) {
				errors["address.street"] = "Street is required";
			}
			if (!state.address.city.trim()) {
				errors["address.city"] = "City is required";
			}
			if (!state.address.state.trim()) {
				errors["address.state"] = "State / Province is required";
			}
			if (!state.address.zip.trim()) {
				errors["address.zip"] = "Postal code is required";
			}
			if (!state.address.country.trim()) {
				errors["address.country"] = "Country is required";
			}

			const lat = Number(state.location.lat);
			if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
				errors["location.lat"] = "Latitude must be between -90 and 90";
			}
			const lng = Number(state.location.lng);
			if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
				errors["location.lng"] = "Longitude must be between -180 and 180";
			}

			if (!state.borrowerId) {
				errors.borrowerId = "Borrower is required";
			}

			if (state.images.some((image) => !image.storageId)) {
				errors.images = "All uploaded images must have a storage ID";
			}
			if (state.documents.some((document) => !document.storageId)) {
				errors.documents = "All uploaded documents must have a storage ID";
			}

			// Validate prior encumbrance if present
			if (state.priorEncumbrance) {
				if (state.priorEncumbrance.amount <= 0) {
					errors.priorEncumbranceAmount =
						"Prior encumbrance amount must be greater than 0";
				}
				if (!state.priorEncumbrance.lender.trim()) {
					errors.priorEncumbranceLender = "Lender name is required";
				}
			}

			// Validate as-if appraisal if present
			if (state.asIfAppraisal) {
				if (state.asIfAppraisal.marketValue <= 0) {
					errors.asIfAppraisalMarketValue =
						"Market value must be greater than 0";
				}
				if (!state.asIfAppraisal.method.trim()) {
					errors.asIfAppraisalMethod = "Appraisal method is required";
				}
				if (!state.asIfAppraisal.company.trim()) {
					errors.asIfAppraisalCompany = "Appraisal company is required";
				}
				if (!state.asIfAppraisal.date.trim()) {
					errors.asIfAppraisalDate = "Appraisal date is required";
				}
			}

			return errors;
		},
	})
);
