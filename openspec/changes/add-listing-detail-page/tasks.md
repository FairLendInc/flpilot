# Implementation Tasks - Listing Detail Page

## 1. Project Setup and Configuration

- [ ] 1.1 Add Mapbox token to environment variables
  - Add `NEXT_PUBLIC_MAPBOX_TOKEN` to `.env.local.example`
  - Document token setup in project README
  - Add URL restrictions to Mapbox token in dashboard

- [ ] 1.2 Verify dependencies are installed
  - Confirm `mapbox-gl@3.16.0` is in package.json
  - Confirm `embla-carousel-react@8.6.0` is in package.json
  - Run `pnpm install` if needed

- [ ] 1.3 Create component directory structure
  - Create `components/listing-detail/` directory
  - Create `components/listing-detail/index.ts` barrel export

## 2. Database Schema and Backend

- [ ] 2.1 Define listings table in Convex schema
  - Add listings table to `convex/schema.ts`
  - Include all fields: title, address, location, images, financials, appraisal
  - Add indexes: `by_status`, `by_location` (for comparables)

- [ ] 2.2 Define payments table in Convex schema
  - Add payments table to `convex/schema.ts`
  - Include: listingId, amount, date, status, type
  - Add indexes: `by_listing`, `by_listing_date`

- [ ] 2.3 Create Convex query functions
  - Create `convex/listings.ts` with:
    - `getById(id)` - Fetch single listing
    - `getComparables(id, limit?)` - Find similar properties
  - Create `convex/payments.ts` with:
    - `getByListingId(listingId)` - Fetch payment history

- [ ] 2.4 Add sample seed data (for development)
  - Create sample listings with all required fields
  - Create sample payment history entries
  - Add seed script or manual insertion via Convex dashboard

## 3. Page Route and Layout

- [ ] 3.1 Create listing detail page route
  - Create `app/(auth)/listings/[id]/page.tsx`
  - Implement Server Component with params type
  - Add metadata generation for SEO

- [ ] 3.2 Implement server-side data fetching
  - Use Convex server-side query in page component
  - Fetch listing, payments, and comparables in parallel
  - Add error handling for missing listings (404)

- [ ] 3.3 Create page layout structure
  - Implement responsive grid layout
  - Add Suspense boundaries for loading states
  - Create loading skeleton components

- [ ] 3.4 Update listing card component
  - Add Link wrapper to card component
  - Link to `/listings/[id]` route
  - Ensure proper hover and click states

## 4. Image Carousel Component

- [ ] 4.1 Create base carousel component
  - Create `components/listing-detail/image-carousel.tsx`
  - Mark as Client Component (`"use client"`)
  - Integrate Embla Carousel with basic navigation

- [ ] 4.2 Implement image display with Next.js Image
  - Use Next.js Image component for optimization
  - Configure lazy loading (eager for first image)
  - Add blur placeholder data URLs

- [ ] 4.3 Add carousel navigation controls
  - Implement previous/next arrow buttons
  - Add keyboard navigation (arrow keys)
  - Implement touch/swipe gestures for mobile

- [ ] 4.4 Create thumbnail navigation
  - Display thumbnails below main image
  - Highlight active thumbnail
  - Make thumbnails clickable to select image

- [ ] 4.5 Add accessibility features
  - Add ARIA labels and roles
  - Announce slide changes to screen readers
  - Implement focus management

- [ ] 4.6 Handle edge cases
  - Single image: hide navigation controls
  - No images: show placeholder
  - Failed image loads: show error state

## 5. Mapbox Map Component

- [ ] 5.1 Create map component
  - Create `components/listing-detail/property-map.tsx`
  - Mark as Client Component
  - Initialize Mapbox GL with token from env

- [ ] 5.2 Implement map display
  - Center map on property coordinates
  - Set appropriate zoom level (14-15)
  - Add custom marker at property location

- [ ] 5.3 Optimize map loading
  - Lazy load map component (intersection observer)
  - Add loading placeholder
  - Implement timeout for slow API responses

- [ ] 5.4 Add error handling
  - Handle Mapbox API failures gracefully
  - Show fallback message if map doesn't load
  - Handle missing coordinate data

- [ ] 5.5 Implement responsive behavior
  - Adjust map size for different viewports
  - Optimize tile quality for mobile
  - Test on various screen sizes

## 6. Property Information Component

- [ ] 6.1 Create property info component
  - Create `components/listing-detail/property-info.tsx`
  - Display property title as h1
  - Display formatted address

- [ ] 6.2 Format and display investor brief
  - Render investor brief with proper formatting
  - Handle missing brief (hide section)
  - Sanitize HTML if brief contains rich text

- [ ] 6.3 Add listing status badge
  - Display current listing status
  - Style badges based on status type
  - Include visual indicators (colors, icons)

## 7. Financial Metrics Component

- [ ] 7.1 Create financial metrics component
  - Create `components/listing-detail/financial-metrics.tsx`
  - Implement responsive grid layout (2-4 columns)

- [ ] 7.2 Display individual metrics
  - Purchase price (formatted as currency)
  - Current value (formatted as currency)
  - Monthly payment (formatted as currency)
  - Interest rate (formatted as percentage)
  - Loan term (formatted as years/months)

- [ ] 7.3 Create maturity date display
  - Format maturity date as readable text
  - Calculate and show time remaining
  - Add visual countdown indicator (optional)

- [ ] 7.4 Style metric cards
  - Use HeroUI Card components
  - Add icons for each metric type
  - Ensure responsive layout

## 8. Payment History Component

- [ ] 8.1 Create payment history component
  - Create `components/listing-detail/payment-history.tsx`
  - Implement timeline layout

- [ ] 8.2 Display payment entries
  - Sort payments by date (most recent first)
  - Show date, amount, status, type for each payment
  - Format dates consistently

- [ ] 8.3 Add status indicators
  - Paid: green check icon
  - Late: yellow/orange warning icon
  - Pending: blue clock icon

- [ ] 8.4 Implement mobile optimization
  - Vertical timeline on mobile
  - Collapsible entries for space efficiency
  - Ensure touch-friendly interaction

- [ ] 8.5 Handle empty state
  - Show message when no payment history exists
  - Style empty state appropriately

## 9. Appraisal Data Component

- [ ] 9.1 Create appraisal component
  - Create `components/listing-detail/appraisal-data.tsx`
  - Display appraisal value, date, appraiser, method

- [ ] 9.2 Calculate value comparison
  - Compare appraisal value to current value
  - Display absolute and percentage change
  - Style positive changes (green) and negative (red)

- [ ] 9.3 Handle missing appraisal
  - Hide section when appraisal data unavailable
  - No empty state needed

## 10. Comparable Properties Component

- [ ] 10.1 Create comparable properties component
  - Create `components/listing-detail/comparable-properties.tsx`
  - Display up to 5 comparable properties

- [ ] 10.2 Design comparable property cards
  - Thumbnail image
  - Address
  - Price
  - Key metrics (compact format)

- [ ] 10.3 Make cards interactive
  - Link each card to its detail page
  - Add hover states
  - Ensure proper click/tap targets

- [ ] 10.4 Implement responsive layout
  - Grid layout on desktop (2-3 columns)
  - Vertical list on mobile
  - Optional horizontal scroll on tablet

- [ ] 10.5 Handle no comparables case
  - Hide section when no comparables found
  - Verify backend query works correctly

## 11. Testing

### Unit Tests

- [ ] 11.1 Test image carousel component
  - Navigation (arrows, keyboard, thumbnails)
  - Edge cases (single image, no images)
  - Accessibility (ARIA, keyboard)

- [ ] 11.2 Test property map component
  - Map rendering with valid coordinates
  - Error handling (API failure, missing coords)
  - Loading states

- [ ] 11.3 Test financial metrics component
  - Currency formatting
  - Percentage formatting
  - Responsive grid layout

- [ ] 11.4 Test payment history component
  - Timeline rendering
  - Status indicators
  - Empty state

- [ ] 11.5 Test appraisal component
  - Value comparison calculation
  - Conditional rendering

- [ ] 11.6 Test comparable properties component
  - Card rendering
  - Navigation links
  - Responsive layout

### Integration Tests (Playwright)

- [ ] 11.7 Test full page load
  - Navigate from listing card to detail page
  - Verify all sections render
  - Check for console errors

- [ ] 11.8 Test carousel interactions
  - Click next/previous arrows
  - Use keyboard navigation
  - Click thumbnails
  - Swipe on mobile

- [ ] 11.9 Test responsive behavior
  - Desktop layout (≥1024px)
  - Tablet layout (768-1023px)
  - Mobile layout (<768px)

- [ ] 11.10 Test error scenarios
  - Invalid listing ID (404 page)
  - Unauthenticated access (redirect)
  - Network failures (error handling)

### Performance Tests

- [ ] 11.11 Run Lighthouse audit
  - Performance score ≥90
  - Accessibility score ≥95
  - LCP <2.5s, FID <100ms, CLS <0.1

- [ ] 11.12 Test bundle size
  - Page-specific bundle <100KB gzipped
  - Verify code splitting for Mapbox/Embla

- [ ] 11.13 Test image optimization
  - Verify lazy loading
  - Check WebP/AVIF formats
  - Validate blur placeholders

## 12. Accessibility Compliance

- [ ] 12.1 Verify keyboard navigation
  - All interactive elements accessible via Tab
  - Focus indicators visible
  - Logical tab order

- [ ] 12.2 Test with screen reader
  - VoiceOver (macOS/iOS) or NVDA (Windows)
  - Verify alt text on images
  - Check heading hierarchy
  - Confirm carousel announcements

- [ ] 12.3 Check color contrast
  - Run automated contrast checker
  - Verify 4.5:1 ratio for normal text
  - Verify 3:1 ratio for large text

- [ ] 12.4 Test reduced motion
  - Enable `prefers-reduced-motion`
  - Verify animations are disabled/simplified
  - Ensure functionality remains

## 13. Performance Optimization

- [ ] 13.1 Optimize images
  - Configure Next.js Image with appropriate sizes
  - Use responsive images (srcset)
  - Implement priority loading for first image

- [ ] 13.2 Code splitting
  - Verify Mapbox is lazy loaded
  - Verify Embla Carousel is lazy loaded
  - Check for unnecessary third-party imports

- [ ] 13.3 Reduce bundle size
  - Run bundle analyzer
  - Remove unused code
  - Tree-shake dependencies

- [ ] 13.4 Optimize data fetching
  - Verify parallel queries
  - Add appropriate Convex indexes
  - Consider caching strategy

## 14. Documentation

- [ ] 14.1 Update project README
  - Document new route and features
  - Add Mapbox token setup instructions
  - Update environment variables section

- [ ] 14.2 Add component documentation
  - Add JSDoc comments to components
  - Document props and usage
  - Include examples in Storybook (optional)

- [ ] 14.3 Update API documentation
  - Document Convex query functions
  - Include parameter descriptions
  - Add usage examples

## 15. Analytics and Monitoring

- [ ] 15.1 Add page view tracking
  - Implement analytics event on page load
  - Record listing ID and user ID
  - Increment view count in database

- [ ] 15.2 Add error monitoring
  - Log API failures (Mapbox, Convex)
  - Track 404 errors
  - Monitor performance metrics

- [ ] 15.3 Set up alerts
  - Configure alerts for high error rates
  - Monitor Mapbox API usage
  - Track Core Web Vitals degradation

## 16. Final Review and Deployment

- [ ] 16.1 Code review
  - Request peer review of implementation
  - Address feedback and make revisions
  - Verify adherence to coding standards

- [ ] 16.2 QA testing
  - Manual testing on multiple devices
  - Cross-browser testing (Chrome, Firefox, Safari)
  - Mobile testing (iOS and Android)

- [ ] 16.3 Security review
  - Verify input validation
  - Check authorization logic
  - Review Mapbox token restrictions

- [ ] 16.4 Performance validation
  - Run final Lighthouse audit
  - Verify bundle size targets
  - Test on 3G network simulation

- [ ] 16.5 Deploy to staging
  - Deploy to staging environment
  - Run smoke tests
  - Verify environment variables

- [ ] 16.6 Production deployment
  - Deploy to production
  - Monitor error rates
  - Verify functionality
  - Update archived proposal status

## 17. Post-Deployment

- [ ] 17.1 Monitor metrics
  - Track page views and engagement
  - Monitor error rates
  - Review performance data

- [ ] 17.2 Gather user feedback
  - Collect feedback from early users
  - Document improvement opportunities
  - Prioritize future iterations

- [ ] 17.3 Archive proposal
  - Move proposal to `openspec/changes/archive/`
  - Update `openspec/specs/listing-detail/spec.md`
  - Run `openspec validate --strict`
