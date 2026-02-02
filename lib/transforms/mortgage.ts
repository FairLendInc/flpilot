/**
 * Transformation utilities for converting Convex Mortgage data
 * to component-friendly formats
 */

import type {
	AppraisalComparableWithUrl,
	MortgageDocument,
	MortgageImage,
	MortgageWithUrls,
	Payment,
} from "@/lib/types/convex";

/**
 * Transform mortgage images for ImageCarousel component
 */
export function transformMortgageToImages(mortgage: MortgageWithUrls) {
	return mortgage.images.map((img: MortgageImage, idx) => ({
		url: img.url || `/api/storage/${img.storageId}`,
		alt: img.alt ?? `Property view ${idx + 1}`,
		order: img.order,
	}));
}

/**
 * Transform mortgage data to financial metrics for FinancialMetrics component
 */
export function transformMortgageToFinancials(mortgage: MortgageWithUrls) {
	return {
		purchasePrice: Math.round(mortgage.appraisalMarketValue),
		currentValue: mortgage.appraisalMarketValue,
		monthlyPayment: Math.round(
			(mortgage.loanAmount * (mortgage.interestRate / 100)) / 12
		),
		interestRate: mortgage.interestRate,
		loanTerm: 12, // Not stored in schema, using placeholder
		maturityDate: mortgage.maturityDate,
		principalLoanAmount: mortgage.loanAmount,
		propertyType: mortgage.propertyType,
		ltv: mortgage.ltv,
		mortgageType:
			mortgage.mortgageType === "1st"
				? "1st Position"
				: mortgage.mortgageType === "2nd"
					? "2nd Position"
					: "Other Position",
		priorEncumbrance: mortgage.priorEncumbrance || null,
		asIfAppraisal: mortgage.asIfAppraisal || null,
	};
}

/**
 * Transform mortgage documents for DocumentViewer component
 */
export function transformMortgageToDocuments(mortgage: MortgageWithUrls) {
	return (mortgage.documents ?? []).map((doc: MortgageDocument) => ({
		_id: `${mortgage._id}-${doc.type}`,
		name: doc.name,
		type: (doc.type === "insurance" ? "loan" : doc.type) as
			| "appraisal"
			| "inspection"
			| "loan"
			| "title",
		url: doc.url || `/api/storage/${doc.storageId}`,
		uploadDate: doc.uploadDate,
		fileSize: doc.fileSize,
	}));
}

/**
 * Transform mortgage appraisal data for AppraisalData component
 */
export function transformMortgageToAppraisal(mortgage: MortgageWithUrls) {
	return {
		marketValue: mortgage.appraisalMarketValue,
		method: mortgage.appraisalMethod,
		company: mortgage.appraisalCompany,
		date: mortgage.appraisalDate,
	};
}

/**
 * Transform comparables for ComparableProperties component
 */
export function transformComparables(
	comparables: AppraisalComparableWithUrl[]
) {
	return comparables.map((comp: AppraisalComparableWithUrl) => ({
		_id: comp._id,
		address: comp.address,
		saleAmount: comp.saleAmount,
		saleDate: comp.saleDate,
		distance: comp.distance,
		squareFeet: comp.squareFeet,
		bedrooms: comp.bedrooms,
		bathrooms: comp.bathrooms,
		propertyType: comp.propertyType,
		imageUrl:
			comp.imageUrl ||
			(comp.imageStorageId
				? `/api/storage/${comp.imageStorageId}`
				: "/house.jpg"),
		asIf: comp.asIf,
	}));
}

/**
 * Transform payments for PaymentHistory component
 */
export function transformPayments(payments: Payment[], listingId: string) {
	return payments.map((payment) => ({
		...payment,
		listingId,
		date: payment.processDate,
		type: "interest" as const, // All payments are interest-only in our schema
	}));
}
