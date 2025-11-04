import type { Metadata } from "next";
import { ViewTransition } from "react";
// import {
// 	AppraisalData,
// 	ComparableProperties,
// 	FinancialMetrics,
// 	ImageCarousel,
// 	PaymentHistory,
// 	PropertyInfo,
// 	PropertyMapComponent,
// } from "@/components/listing-detail";
import { AppraisalData } from "@/components/listing-detail/appraisal-data";
import { ComparableProperties } from "@/components/listing-detail/comparable-properties";
import { DocumentViewerWrapper } from "@/components/listing-detail/document-viewer-wrapper";
import { FinancialMetrics } from "@/components/listing-detail/financial-metrics";
import { ImageCarousel } from "@/components/listing-detail/image-carousel";
import { PaymentHistory } from "@/components/listing-detail/payment-history";
import { PropertyInfo } from "@/components/listing-detail/property-info";
import { PropertyMapComponent } from "@/components/listing-detail/property-map";
import { RequestListingSection } from "@/components/listing-detail/request-listing-section";
import {
	generateComparables,
	generateListing,
	generatePayments,
} from "@/lib/mock-data/listings";

type ListingDetailPageProps = {
	params: Promise<{
		id: string;
	}>;
};

export async function generateMetadata({
	params,
}: ListingDetailPageProps): Promise<Metadata> {
	const { id } = await params;

	try {
		// Generate mock listing data based on ID
		const listing = generateListing(id);

		return {
			title: `${listing.title} - Investment Property`,
			description:
				listing.investorBrief ||
				`Property located at ${listing.address.street}, ${listing.address.city}, ${listing.address.state}`,
			openGraph: {
				title: listing.title,
				description: listing.investorBrief,
				images: listing.images.length > 0 ? [listing.images[0].url] : [],
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

	// Generate mock data based on ID (consistent across page loads)
	const listing = generateListing(id);
	const payments = generatePayments(id, 12);
	const comparables = generateComparables(id, 6);

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
					<PaymentHistory payments={payments} />
				</div>

				{/* Document Viewer */}
				{listing.documents && listing.documents.length > 0 && (
					<div className="mb-12">
						<DocumentViewerWrapper documents={listing.documents} />
					</div>
				)}

				{/* Appraisal Data (only if available) */}
				{listing.appraisal && (
					<div className="mb-12">
						<AppraisalData
							appraisal={listing.appraisal}
							currentValue={listing.financials.currentValue}
						/>
					</div>
				)}

				{/* Comparable Properties */}
				{comparables.length > 0 && (
					<div className="mb-12">
						<ComparableProperties comparables={comparables} />
					</div>
				)}

				{/* Request Listing Section */}
				<RequestListingSection listing={listing} />
			</div>
		</ViewTransition>
	);
}
