# Implementation Tasks

## 1. Preparation - Skeleton Components
- [x] 1.1 Extract `PropertyInfoSkeleton` from `ListingDetailSkeleton` (lines 18-23)
- [x] 1.2 Extract `ImageCarouselSkeleton` from `ListingDetailSkeleton` (lines 28-40)
- [x] 1.3 Extract `PropertyMapSkeleton` from `ListingDetailSkeleton` (lines 43-54)
- [x] 1.4 Extract `FinancialMetricsSkeleton` from `ListingDetailSkeleton` (lines 58-68)
- [x] 1.5 Extract `PaymentHistorySkeleton` from `ListingDetailSkeleton` (lines 71-86)
- [x] 1.6 Extract `DocumentViewerSkeleton` from `ListingDetailSkeleton` (create new - no existing section)
- [x] 1.7 Extract `AppraisalDataSkeleton` from `ListingDetailSkeleton` (lines 89-99)
- [x] 1.8 Extract `ComparablePropertiesSkeleton` from `ListingDetailSkeleton` (lines 102-117)
- [x] 1.9 Extract `RequestListingSkeleton` from `ListingDetailSkeleton` (lines 120-124)
- [x] 1.10 Update `components/skeletons/index.ts` to export all new skeletons
- [x] 1.11 Verify all skeletons render correctly (visual test)

## 2. Preparation - Transformation Utilities
- [x] 2.1 Create `lib/transforms/mortgage.ts` file
- [x] 2.2 Extract `transformMortgageToFinancials` function
- [x] 2.3 Extract `transformMortgageToImages` function
- [x] 2.4 Extract `transformMortgageToDocuments` function
- [x] 2.5 Extract `transformMortgageToAppraisal` function
- [x] 2.6 Extract `transformComparables` function
- [x] 2.7 Write unit tests for transformation functions

## 3. Async Wrapper Components - High Priority Sections
- [x] 3.1 Create `components/listing-detail/image-carousel-async.tsx`
  - Fetches `mortgage.images` via `api.mortgages.getMortgage`
  - Transforms images using `transformMortgageToImages`
  - Returns `<ImageCarousel images={...} propertyTitle={...} />`
- [x] 3.2 Create `components/listing-detail/financial-metrics-async.tsx`
  - Fetches mortgage data via `api.mortgages.getMortgage`
  - Transforms to financials using `transformMortgageToFinancials`
  - Returns `<FinancialMetrics financials={...} />`
- [x] 3.3 Test high-priority async components in isolation

## 4. Async Wrapper Components - Medium Priority Sections
- [x] 4.1 Create `components/listing-detail/payment-history-async.tsx`
  - Fetches via `api.payments.getPaymentsForMortgage`
  - Transforms payments for component expectations
  - Returns `<PaymentHistory payments={...} />` or `null` if empty
- [x] 4.2 Create `components/listing-detail/appraisal-data-async.tsx`
  - Fetches mortgage appraisal data via `api.mortgages.getMortgage`
  - Transforms using `transformMortgageToAppraisal`
  - Returns `<AppraisalData appraisal={...} currentValue={...} />` or `null` if no appraisal
- [x] 4.3 Create `components/listing-detail/comparable-properties-async.tsx`
  - Fetches via `api.comparables.getComparablesForMortgage`
  - Transforms using `transformComparables`
  - Returns `<ComparableProperties comparables={...} />` or `null` if empty
- [x] 4.4 Test medium-priority async components in isolation

## 5. Async Wrapper Components - Low Priority Sections
- [x] 5.1 Create `components/listing-detail/property-map-async.tsx`
  - Fetches mortgage location via `api.mortgages.getMortgage`
  - Returns `<PropertyMapComponent address={...} location={...} />`
- [x] 5.2 Create `components/listing-detail/document-viewer-async.tsx`
  - Fetches mortgage documents via `api.mortgages.getMortgage`
  - Transforms using `transformMortgageToDocuments`
  - Returns `<DocumentViewerWrapper documents={...} />` or `null` if no documents
- [x] 5.3 Create `components/listing-detail/request-listing-section-async.tsx`
  - Fetches via `api.listings.getListingByMortgage`
  - Returns `<RequestListingSection isLocked={...} listing={...} listingId={...} />` or `null` if no listing
- [x] 5.4 Test low-priority async components in isolation

## 6. Page Component Refactoring
- [x] 6.1 Refactor `app/(auth)/listings/[id]/page.tsx`:
  - Remove `Promise.all()` that fetches all data
  - Remove page-level fetch (all sections load independently)
  - Add Suspense boundary for `PropertyInfoAsync` with `PropertyInfoSkeleton`
  - Add Suspense boundary for `ImageCarouselAsync` with `ImageCarouselSkeleton`
  - Add Suspense boundary for `PropertyMapAsync` with `PropertyMapSkeleton`
  - Add Suspense boundary for `FinancialMetricsAsync` with `FinancialMetricsSkeleton`
  - Add Suspense boundary for `PaymentHistoryAsync` with `PaymentHistorySkeleton`
  - Add Suspense boundary for `DocumentViewerAsync` with `DocumentViewerSkeleton`
  - Add Suspense boundary for `AppraisalDataAsync` with `AppraisalDataSkeleton`
  - Add Suspense boundary for `ComparablePropertiesAsync` with `ComparablePropertiesSkeleton`
  - Add Suspense boundary for `RequestListingSectionAsync` with `RequestListingSkeleton`
- [x] 6.2 Remove `transformMortgageForComponents` function from page (no longer needed)
- [x] 6.3 Create `PropertyInfoAsync` wrapper component with independent data fetching
- [x] 6.4 Verify all 9 sections have independent Suspense boundaries and stream in progressively

## 7. Cleanup and Optimization
- [x] 7.1 Update or remove `app/(auth)/listings/[id]/loading.tsx` (may no longer be needed)
- [x] 7.2 Update `generateMetadata` to use shared transformation utilities if applicable
- [x] 7.3 Remove any unused imports from page.tsx
- [x] 7.4 Run TypeScript type checking (`pnpm run check-types`)
- [x] 7.5 Run linting (`pnpm run lint`)
- [x] 7.6 Run formatting (`pnpm run format`)

## 8. Testing and Validation
- [ ] 8.1 Manual testing - fast connection:
  - Navigate to listing detail page
  - Verify all sections load correctly
  - Verify no visual regressions
  - Check browser DevTools for React Suspense boundaries
- [ ] 8.2 Manual testing - slow connection (Chrome DevTools throttling):
  - Navigate to listing detail page with "Slow 3G" throttling
  - Verify PropertyInfo appears immediately
  - Verify skeletons appear for pending sections
  - Verify sections stream in progressively
  - Verify no layout shift (check CLS score in Lighthouse)
- [ ] 8.3 Accessibility testing:
  - Verify keyboard navigation still works
  - Verify screen reader announces loading states
  - Run axe DevTools for accessibility violations
- [ ] 8.4 Performance testing:
  - Run Lighthouse audit (target: LCP < 2.5s, FCP < 1.8s, CLS < 0.1)
  - Compare before/after metrics
  - Verify FCP improvement on slow connections
- [ ] 8.5 Error handling testing:
  - Test with invalid mortgage ID (404 handling)
  - Test with missing data (empty comparables, no documents)
  - Test with Convex query failures (mock error)

## 9. Documentation
- [ ] 9.1 Update CLAUDE.md if any new patterns are introduced
- [ ] 9.2 Add JSDoc comments to async wrapper components
- [ ] 9.3 Update any component documentation about data fetching patterns
- [ ] 9.4 Document performance improvements in commit message or PR description

## 10. Deployment Validation
- [ ] 10.1 Deploy to staging/preview environment
- [ ] 10.2 Smoke test all listing detail pages in staging
- [ ] 10.3 Monitor Core Web Vitals in production (if available)
- [ ] 10.4 Monitor error rates for listing detail page
- [ ] 10.5 Verify no increase in Convex query errors or timeouts
