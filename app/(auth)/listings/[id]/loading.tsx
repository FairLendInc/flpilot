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

export default function Loading() {
	return (
		<div className="container mx-auto max-w-7xl px-4 py-8">
			{/* Property Info */}
			<div className="mb-8">
				<PropertyInfoSkeleton />
			</div>

			{/* Image Carousel and Map Grid */}
			<div className="mb-12 grid gap-6 lg:grid-cols-2">
				<ImageCarouselSkeleton />
				<PropertyMapSkeleton />
			</div>

			{/* Financial Metrics */}
			<FinancialMetricsSkeleton />

			{/* Payment History */}
			<PaymentHistorySkeleton />

			{/* Document Viewer */}
			<DocumentViewerSkeleton />

			{/* Appraisal Data */}
			<AppraisalDataSkeleton />

			{/* Comparable Properties */}
			<ComparablePropertiesSkeleton />

			{/* Request Listing Section */}
			<RequestListingSkeleton />
		</div>
	);
}
