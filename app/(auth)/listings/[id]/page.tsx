import { preloadedQueryResult, preloadQuery } from "convex/nextjs";
import type { Metadata } from "next";
import { ViewTransition } from "react";
import { AppraisalData } from "@/components/listing-detail/appraisal-data";
import { ComparableProperties } from "@/components/listing-detail/comparable-properties";
import { DocumentViewerWrapper } from "@/components/listing-detail/document-viewer-wrapper";
import { FinancialMetrics } from "@/components/listing-detail/financial-metrics";
import { ImageCarousel } from "@/components/listing-detail/image-carousel";
import { PaymentHistory } from "@/components/listing-detail/payment-history";
import { PropertyInfo } from "@/components/listing-detail/property-info";
import { PropertyMapComponent } from "@/components/listing-detail/property-map";
import { RequestListingSection } from "@/components/listing-detail/request-listing-section";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type {
	AppraisalComparable,
	Mortgage,
	Payment,
} from "@/lib/types/convex";

type ListingDetailPageProps = {
	params: Promise<{
		id: string;
	}>;
};

/**
 * Transform Convex Mortgage to mock-like format for components
 * Uses pre-fetched signed URLs from Convex queries
 */
function transformMortgageForComponents(mortgage: Mortgage) {
	// Use pre-fetched signed URLs from Convex query
	// TypeScript doesn't know about the runtime-added 'url' property, so we use type assertion
	const images = mortgage.images.map((img: any, idx) => ({
		url: img.url || `/api/storage/${img.storageId}`,
		alt: img.alt ?? `Property view ${idx + 1}`,
		order: img.order,
	}));

	// Transform financial data to match component expectations
	const financials = {
		purchasePrice: Math.round(mortgage.appraisalMarketValue), // Use actual appraisal value
		currentValue: mortgage.appraisalMarketValue, // Real market value from appraisal
		monthlyPayment: Math.round(
			(mortgage.loanAmount * (mortgage.interestRate / 100)) / 12
		),
		interestRate: mortgage.interestRate,
		loanTerm: 12, // Not stored in schema, using placeholder
		maturityDate: mortgage.maturityDate,
		principalLoanAmount: mortgage.loanAmount,
		propertyType: mortgage.propertyType,
		ltv: mortgage.ltv, // Real LTV from database
	};

	// Transform documents - use pre-fetched signed URLs
	const documents = (mortgage.documents ?? []).map((doc: any) => ({
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

	// Map mortgage type for display
	const mortgageTypeDisplay =
		mortgage.mortgageType === "1st"
			? "First"
			: mortgage.mortgageType === "2nd"
				? "Second"
				: "Other";

	return {
		_id: mortgage._id,
		title: `${mortgage.address.street}`,
		address: mortgage.address,
		location: mortgage.location,
		images,
		financials,
		documents,
		status: mortgage.status,
		mortgageType: mortgageTypeDisplay,
		appraisalData: {
			marketValue: mortgage.appraisalMarketValue,
			method: mortgage.appraisalMethod,
			company: mortgage.appraisalCompany,
			date: mortgage.appraisalDate,
		},
		investorBrief: `Investment opportunity at ${mortgage.address.street}, ${mortgage.address.city}. ${mortgageTypeDisplay} ${mortgage.propertyType} with ${mortgage.interestRate}% interest rate. Appraised at $${mortgage.appraisalMarketValue.toLocaleString()} with ${mortgage.ltv}% LTV.`,
	};
}

export async function generateMetadata({
	params,
}: ListingDetailPageProps): Promise<Metadata> {
	const { id } = await params;

	try {
		// Preload mortgage data from Convex
		const preloadedMortgage = await preloadQuery(api.mortgages.getMortgage, {
			id: id as Id<"mortgages">,
		});

		if (!preloadedMortgage) {
			return {
				title: "Listing Not Found",
			};
		}

		const mortgage = preloadedQueryResult(preloadedMortgage);
		if (!mortgage) {
			return {
				title: "Listing Not Found",
			};
		}

		const transformed = transformMortgageForComponents(mortgage);

		return {
			title: `${transformed.title} - Investment Property`,
			description:
				transformed.investorBrief ||
				`Property located at ${transformed.address.street}, ${transformed.address.city}`,
			openGraph: {
				title: transformed.title,
				description: transformed.investorBrief,
				images:
					transformed.images.length > 0 ? [transformed.images[0].url] : [],
			},
		};
	} catch (error) {
		console.error("Error generating metadata:", error);
		return {
			title: "Listing Details",
		};
	}
}

export default async function ListingDetailPage({
	params,
}: ListingDetailPageProps) {
	const { id } = await params;

	// Preload all required data from Convex
	const [preloadedMortgage, preloadedPayments, preloadedComparables, preloadedListing] =
		await Promise.all([
			preloadQuery(api.mortgages.getMortgage, {
				id: id as Id<"mortgages">,
			}),
			preloadQuery(api.payments.getPaymentsForMortgage, {
				mortgageId: id as Id<"mortgages">,
			}),
			preloadQuery(api.comparables.getComparablesForMortgage, {
				mortgageId: id as Id<"mortgages">,
			}),
			preloadQuery(api.listings.getListingByMortgage, {
				mortgageId: id as Id<"mortgages">,
			}),
		]);

	// Extract actual data from preloaded results
	const mortgage = preloadedQueryResult(preloadedMortgage);
	const payments = (preloadedQueryResult(preloadedPayments) as Payment[]) || [];
	const comparables =
		(preloadedQueryResult(preloadedComparables) as AppraisalComparable[]) || [];
	const listingData = preloadedQueryResult(preloadedListing);

	if (!mortgage) {
		return (
			<div className="container mx-auto max-w-7xl px-4 py-8">
				<h1 className="font-bold text-2xl">Listing not found</h1>
			</div>
		);
	}

	// Transform mortgage data for components
	const listing = transformMortgageForComponents(mortgage);

	// Transform comparables to match component expectations
	// Use pre-fetched signed URLs from Convex query
	const transformedComparables = comparables.map((comp: any) => ({
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
	}));

	// Transform payments to match component expectations
	const transformedPayments = payments.map((payment) => ({
		...payment,
		listingId: id,
		date: payment.processDate,
		type: "interest" as const, // All payments are interest-only in our schema
	}));

	return (
		<ViewTransition name={`listing-${listing._id}`}>
			<div className="container mx-auto max-w-7xl px-4 py-8">
				{/* Property Info */}
				<div className="mb-8">
					<PropertyInfo
						address={listing.address}
						investorBrief={listing.investorBrief}
						status={listing.status}
						title={listing.title}
					/>
				</div>

				{/* Image Carousel and Map Grid */}
				<div className="mb-12 grid gap-6 lg:grid-cols-2">
					<ImageCarousel
						images={listing.images}
						propertyTitle={listing.title}
					/>
					<PropertyMapComponent
						address={listing.address}
						location={listing.location}
					/>
				</div>

				{/* Financial Metrics */}
				<div className="mb-12">
					<FinancialMetrics financials={listing.financials} />
				</div>

				{/* Payment History */}
				<div className="mb-12">
					<PaymentHistory payments={transformedPayments} />
				</div>

				{/* Document Viewer */}
				{listing.documents && listing.documents.length > 0 && (
					<div className="mb-12">
						<DocumentViewerWrapper documents={listing.documents} />
					</div>
				)}

				{/* Appraisal Data */}
				<div className="mb-12">
					<AppraisalData
						appraisal={{
							value: listing.appraisalData?.marketValue || 0,
							date: listing.appraisalData?.date || new Date().toISOString(),
							appraiser: listing.appraisalData?.company || "Not Available",
							method: listing.appraisalData?.method || "comparative",
						}}
						currentValue={listing.financials?.currentValue || 0}
					/>
				</div>

				{/* Comparable Properties */}
				{transformedComparables.length > 0 && (
					<div className="mb-12">
						<ComparableProperties comparables={transformedComparables} />
					</div>
				)}

				{/* Request Listing Section */}
				{listingData && (
					<RequestListingSection
						listing={listing as any}
						listingId={listingData._id}
					/>
				)}
			</div>
		</ViewTransition>
	);
}
