/**
 * Convex type exports and utilities
 * Re-exports generated types and provides convenient type aliases
 */

import type { Doc, Id } from "@/convex/_generated/dataModel";

// Re-export core types
export type { Doc, Id };

// Table document type aliases
export type Borrower = Doc<"borrowers">;
export type Mortgage = Doc<"mortgages">;
export type MortgageOwnership = Doc<"mortgage_ownership">;
export type Listing = Doc<"listings">;
export type AppraisalComparable = Doc<"appraisal_comparables">;
export type Payment = Doc<"payments">;

// ID type aliases
export type BorrowerId = Id<"borrowers">;
export type MortgageId = Id<"mortgages">;
export type MortgageOwnershipId = Id<"mortgage_ownership">;
export type ListingId = Id<"listings">;
export type AppraisalComparableId = Id<"appraisal_comparables">;
export type PaymentId = Id<"payments">;

// Utility types for common patterns
export type MortgageWithBorrower = Mortgage & {
	borrower: Borrower;
};

export type MortgageWithOwnership = Mortgage & {
	ownership: MortgageOwnership[];
};

export type ListingWithMortgage = Listing & {
	mortgage: Mortgage;
};

export type ListingWithFullDetails = Listing & {
	mortgage: Mortgage;
	borrower: Borrower;
	ownership: MortgageOwnership[];
};

// Type guards
export function isFairlendOwned(ownership: MortgageOwnership): boolean {
	return ownership.ownerId === "fairlend";
}

export function isUserOwned(ownership: MortgageOwnership): boolean {
	return ownership.ownerId !== "fairlend";
}

// Status type guards
export function isActiveMortgage(mortgage: Mortgage): boolean {
	return mortgage.status === "active";
}

export function isActiveListingAvailable(listing: Listing): boolean {
	return listing.visible && !listing.locked;
}

export function isPaymentCleared(payment: Payment): boolean {
	return payment.status === "cleared";
}

// Calculation utilities
export function calculateMonthlyInterestPayment(mortgage: Mortgage): number {
	return Math.round((mortgage.loanAmount * (mortgage.interestRate / 100)) / 12);
}

export function calculateRemainingMonths(mortgage: Mortgage): number {
	const maturityDate = new Date(mortgage.maturityDate);
	const now = new Date();
	const diffTime = maturityDate.getTime() - now.getTime();
	const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
	return Math.max(0, diffMonths);
}

export function calculateDaysUntilMaturity(mortgage: Mortgage): number {
	const maturityDate = new Date(mortgage.maturityDate);
	const now = new Date();
	const diffTime = maturityDate.getTime() - now.getTime();
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	return Math.max(0, diffDays);
}

// LTV calculation and validation utilities
export function calculateLTV(loanAmount: number, marketValue: number): number {
	if (marketValue <= 0) return 0;
	return Number(((loanAmount / marketValue) * 100).toFixed(1));
}

export function calculateLTVFromMortgage(mortgage: Mortgage): number {
	return calculateLTV(mortgage.loanAmount, mortgage.appraisalMarketValue);
}

export function validateLTV(ltv: number): boolean {
	return ltv >= 0 && ltv <= 100;
}

export function getLTVCategory(ltv: number): "low" | "medium" | "high" {
	if (ltv < 60) return "low";
	if (ltv < 80) return "medium";
	return "high";
}

// Mortgage type utilities
export function isValidMortgageType(type: string): type is "1st" | "2nd" | "other" {
	return type === "1st" || type === "2nd" || type === "other";
}

export function getMortgageTypeDisplayName(type: "1st" | "2nd" | "other"): string {
	switch (type) {
		case "1st":
			return "First Mortgage";
		case "2nd":
			return "Second Mortgage";
		case "other":
			return "Other";
	}
}

// Address formatting utility
export function formatAddress(
	address: Mortgage["address"],
	format: "full" | "short" = "full"
): string {
	if (format === "short") {
		return `${address.city}, ${address.state}`;
	}
	return `${address.street}, ${address.city}, ${address.state} ${address.zip}, ${address.country}`;
}

// Comparable distance formatting
export function formatDistance(miles: number): string {
	if (miles < 0.1) return "< 0.1 miles";
	return `${miles.toFixed(1)} miles`;
}

// Currency formatting
export function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("en-CA", {
		style: "currency",
		currency: "CAD",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(amount);
}

// Percentage formatting
export function formatPercentage(value: number, decimals = 2): string {
	return `${value.toFixed(decimals)}%`;
}

// Date formatting utilities
export function formatDate(dateString: string): string {
	return new Date(dateString).toLocaleDateString("en-CA", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

export function formatShortDate(dateString: string): string {
	return new Date(dateString).toLocaleDateString("en-CA", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

export function formatRelativeDate(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const diffTime = now.getTime() - date.getTime();
	const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

	if (diffDays === 0) return "Today";
	if (diffDays === 1) return "Yesterday";
	if (diffDays < 7) return `${diffDays} days ago`;
	if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
	if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
	return `${Math.floor(diffDays / 365)} years ago`;
}
