# Listing Detail Page

## Why

Investors need a comprehensive view of individual property listings to make informed investment decisions. Currently, clicking on a listing card has no destination, preventing users from accessing critical property details, financial information, payment history, and comparable properties. This gap blocks a core user journey in the investment platform.

## What Changes

- **New route**: `/listings/[id]` - Dynamic page for individual listing details
- **Image carousel component**: Display multiple property images with navigation controls
- **Mapbox integration**: Interactive map centered on property location with custom marker
- **Property information section**: Display title, address, and investor's brief/summary
- **Financial data display**: Show key investment metrics and maturity date
- **Payment history component**: Timeline visualization of payment records
- **Appraisal data section**: Display property valuation information
- **Comparable properties section**: List similar properties in the area for context

**New dependencies**:
- Mapbox GL JS already in package.json (`mapbox-gl@3.16.0`)
- Embla Carousel already in package.json (`embla-carousel-react@8.6.0`)

**UI Components needed**:
- Custom image carousel using Embla Carousel
- Mapbox map wrapper component
- Financial metrics cards using HeroUI/Radix UI
- Payment history timeline component
- Comparable properties list/grid

## Impact

### Affected Specs
- **NEW**: `listing-detail` - Complete new capability for detailed property viewing

### Affected Code
- **New files**:
  - `app/(auth)/listings/[id]/page.tsx` - Main listing detail page
  - `components/listing-detail/image-carousel.tsx` - Image carousel component
  - `components/listing-detail/property-map.tsx` - Mapbox map component
  - `components/listing-detail/property-info.tsx` - Property information display
  - `components/listing-detail/financial-metrics.tsx` - Key financials display
  - `components/listing-detail/payment-history.tsx` - Payment timeline
  - `components/listing-detail/appraisal-data.tsx` - Appraisal information
  - `components/listing-detail/comparable-properties.tsx` - Comparable properties list

- **Modified files**:
  - Listing card component - Add navigation link to detail page

- **Convex backend**:
  - `convex/schema.ts` - Add listings table definition (if not exists)
  - `convex/listings.ts` - Query functions for listing details, comparables
  - `convex/payments.ts` - Query for payment history by listing

### Environment Requirements
- **NEXT_PUBLIC_MAPBOX_TOKEN** - Mapbox access token for map display

### Breaking Changes
None - This is a purely additive feature

### Migration Required
None - No data migration needed
