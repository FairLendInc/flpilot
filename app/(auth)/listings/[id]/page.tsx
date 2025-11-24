import { withAuth } from "@workos-inc/authkit-nextjs";
import { fetchQuery } from "convex/nextjs";
import type { Metadata } from "next";
import { Suspense, ViewTransition } from "react";
import { AppraisalDataAsync } from "@/components/listing-detail/appraisal-data-async";
import { ComparablePropertiesAsync } from "@/components/listing-detail/comparable-properties-async";
import { DocumentViewerAsync } from "@/components/listing-detail/document-viewer-async";
import { FinancialMetricsAsync } from "@/components/listing-detail/financial-metrics-async";
import { ImageCarouselAsync } from "@/components/listing-detail/image-carousel-async";
import { PaymentHistoryAsync } from "@/components/listing-detail/payment-history-async";
import { PropertyInfoAsync } from "@/components/listing-detail/property-info-async";
import { PropertyMapAsync } from "@/components/listing-detail/property-map-async";
import { RequestListingSectionAsync } from "@/components/listing-detail/request-listing-section-async";
import {
	AppraisalDataSkeleton,
	ComparablePropertiesSkeleton,
	DocumentViewerSkeleton,
	FinancialMetricsSkeleton,
	ImageCarouselSkeleton,
	PaymentHistorySkeleton,
	PropertyInfoSkeleton,
	PropertyMapSkeleton,
	RequestListingSkeleton,
} from "@/components/skeletons";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { MortgageWithUrls } from "@/lib/types/convex";

type ListingDetailPageProps = {
	params: Promise<{
		id: string;
	}>;
};

export async function generateMetadata({
	params,
}: ListingDetailPageProps): Promise<Metadata> {
	const { id } = await params;
	const { accessToken } = await withAuth();
	try {
		// Preload mortgage data from Convex
		const preloadedMortgage = await fetchQuery(
			api.mortgages.getMortgage,
			{
				id: id as Id<"mortgages">,
			},
			{ token: accessToken }
		);

		if (!preloadedMortgage) {
			return {
				title: "Listing Not Found",
			};
		}

		const mortgage = preloadedMortgage as MortgageWithUrls | null;
		if (!mortgage) {
			return {
				title: "Listing Not Found",
			};
		}

		const title = `${mortgage.address.street}`;
		const mortgageTypeDisplay =
			mortgage.mortgageType === "1st"
				? "First"
				: mortgage.mortgageType === "2nd"
					? "Second"
					: "Other";
		const investorBrief = `Investment opportunity at ${mortgage.address.street}, ${mortgage.address.city}. ${mortgageTypeDisplay} ${mortgage.propertyType} with ${mortgage.interestRate}% interest rate. Appraised at $${mortgage.appraisalMarketValue.toLocaleString()} with ${mortgage.ltv}% LTV.`;

		return {
			title: `${title} - Investment Property`,
			description:
				investorBrief ||
				`Property located at ${mortgage.address.street}, ${mortgage.address.city}`,
			openGraph: {
				title,
				description: investorBrief,
				images:
					mortgage.images.length > 0
						? [
								mortgage.images[0].url ||
									`/api/storage/${mortgage.images[0].storageId}`,
							]
						: [],
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

	return (
		<ViewTransition name={`listing-${id}`}>
			<div className="container mx-auto flex max-w-7xl flex-col gap-y-8 px-4 py-8 lg:gap-y-12">
				{/* Property Info - High Priority */}
				<div>
					<Suspense fallback={<PropertyInfoSkeleton />}>
						<PropertyInfoAsync mortgageId={id as Id<"mortgages">} />
					</Suspense>
				</div>

				{/* Image Carousel and Map Grid - High Priority */}
				<div className="grid gap-6 lg:grid-cols-2">
					<Suspense fallback={<ImageCarouselSkeleton />}>
						<ImageCarouselAsync mortgageId={id as Id<"mortgages">} />
					</Suspense>
					<Suspense fallback={<PropertyMapSkeleton />}>
						<PropertyMapAsync mortgageId={id as Id<"mortgages">} />
					</Suspense>
				</div>

				{/* Financial Metrics - High Priority */}
				<Suspense fallback={<FinancialMetricsSkeleton />}>
					<FinancialMetricsAsync mortgageId={id as Id<"mortgages">} />
				</Suspense>

				{/* Payment History - Medium Priority */}
				<Suspense fallback={<PaymentHistorySkeleton />}>
					<PaymentHistoryAsync mortgageId={id as Id<"mortgages">} />
				</Suspense>

				{/* Document Viewer - Low Priority */}
				<Suspense fallback={<DocumentViewerSkeleton />}>
					<DocumentViewerAsync mortgageId={id as Id<"mortgages">} />
				</Suspense>

				{/* Appraisal Data - Medium Priority */}
				<Suspense fallback={<AppraisalDataSkeleton />}>
					<AppraisalDataAsync mortgageId={id as Id<"mortgages">} />
				</Suspense>

				{/* Comparable Properties - Medium Priority */}
				<Suspense fallback={<ComparablePropertiesSkeleton />}>
					<ComparablePropertiesAsync mortgageId={id as Id<"mortgages">} />
				</Suspense>

				{/* Request Listing Section - Low Priority */}
				<Suspense fallback={<RequestListingSkeleton />}>
					<RequestListingSectionAsync mortgageId={id as Id<"mortgages">} />
				</Suspense>
			</div>
		</ViewTransition>
	);
}
