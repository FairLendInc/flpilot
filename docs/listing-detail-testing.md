# Listing Detail Page - Testing Guide

This guide explains how to test the newly implemented Listing Detail Page feature.

## Quick Start

1. **Start the development server:**
   ```bash
   pnpm run dev
   ```

2. **Seed sample data:**

   Open the Convex dashboard and run the seed mutation:
   ```bash
   npx convex run seed:seedListingDetailData
   ```

   This will create 3 sample property listings:
   - Malibu Beach Detached Villa (Malibu, CA)
   - Downtown Austin Commercial Property (Austin, TX)
   - Miami Beach Luxury Condo (Miami Beach, FL)

   Each listing includes 12 months of payment history.

3. **Get listing IDs:**

   The seed function returns the created listing IDs. Copy one of them from the Convex dashboard output.

4. **Test the detail page:**

   Navigate to `http://localhost:3000/listings/[LISTING_ID]` in your browser, replacing `[LISTING_ID]` with one of the IDs from step 3.

## Environment Setup

### Required Environment Variables

Add to your `.env.local` file:

```bash
# Mapbox Configuration (for property location maps)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_mapbox_access_token_here
```

**Getting a Mapbox Token:**
1. Sign up at https://www.mapbox.com/
2. Go to Account → Tokens
3. Copy your "Default public token" or create a new one
4. Paste it into `.env.local`
5. Restart your dev server

## Testing Checklist

### Core Functionality
- [ ] Page loads without errors for valid listing ID
- [ ] Returns 404 for invalid listing ID
- [ ] All sections render correctly:
  - [ ] Property info (title, address, status badge)
  - [ ] Image carousel with multiple images
  - [ ] Mapbox map centered on property location
  - [ ] Investor brief section
  - [ ] Financial metrics (6 cards)
  - [ ] Maturity date with countdown
  - [ ] Payment history timeline
  - [ ] Appraisal data (if available)
  - [ ] Comparable properties (if available)

### Image Carousel
- [ ] Images load correctly
- [ ] Next/Previous arrows work
- [ ] Keyboard navigation (arrow keys) works
- [ ] Thumbnails display below main image
- [ ] Clicking thumbnails changes main image
- [ ] Counter shows current image (e.g., "1 / 4")
- [ ] Screen reader announcements work

### Map Integration
- [ ] Map loads and centers on property location
- [ ] Red marker appears at property location
- [ ] Marker popup shows property address
- [ ] Zoom controls work
- [ ] Error handling for missing Mapbox token
- [ ] Graceful fallback if map fails to load

### Financial Metrics
- [ ] All 6 metric cards display correctly:
  1. Purchase Price
  2. Current Value
  3. Monthly Payment
  4. Interest Rate
  5. Loan Term
  6. Maturity Date
- [ ] Currency values formatted correctly ($X,XXX,XXX)
- [ ] Percentage values formatted correctly (X.X%)
- [ ] Maturity countdown shows days until maturity
- [ ] Responsive grid layout (2 cols mobile, 3-4 cols desktop)

### Payment History
- [ ] Payments sorted by date (most recent first)
- [ ] Timeline visualization displays correctly
- [ ] Status indicators color-coded:
  - Green for "paid"
  - Yellow/orange for "pending"
  - Red for "late"
- [ ] Payment type icons display
- [ ] Date formatting is consistent
- [ ] Empty state when no payments exist

### Appraisal Data
- [ ] Appraised value displays
- [ ] Appraisal date formatted correctly
- [ ] Value change calculation is accurate
- [ ] Percentage change displays with sign (+/-)
- [ ] Green for positive change, red for negative
- [ ] Appraiser and method information visible
- [ ] Section hidden when no appraisal data

### Comparable Properties
- [ ] Comparable properties display in grid
- [ ] Each card shows: image, title, address, price
- [ ] Distance badge shows miles from main property
- [ ] Clicking card navigates to that property's detail page
- [ ] Responsive layout (1 col mobile, 2-3 cols desktop)
- [ ] Section hidden when no comparables found

### Responsive Design
- [ ] Mobile (<768px): Single column layout, vertical timeline
- [ ] Tablet (768-1023px): 2 column grid, responsive components
- [ ] Desktop (≥1024px): Full multi-column layout, horizontal timeline
- [ ] All images responsive with proper aspect ratios
- [ ] Touch gestures work on mobile (carousel swipe)

### Accessibility
- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible
- [ ] ARIA labels present on icons and buttons
- [ ] Screen reader announcements for carousel
- [ ] Proper heading hierarchy (h1 → h2 → h3)
- [ ] Alt text on all images
- [ ] Color contrast meets WCAG 2.1 AA (4.5:1)

### Performance
- [ ] Initial load <3s on slow 3G
- [ ] Images lazy load (except first image)
- [ ] Mapbox only loads when visible
- [ ] No layout shift (CLS <0.1)
- [ ] First Contentful Paint <1.8s
- [ ] Largest Contentful Paint <2.5s

### Error Handling
- [ ] Invalid listing ID shows 404 page
- [ ] Missing images show placeholder
- [ ] Mapbox errors display fallback message
- [ ] Empty payment history shows appropriate message
- [ ] Network errors handled gracefully

## Connecting to Listing Cards

### Update Listing Card Component

To make existing listing cards link to the detail page, pass the listing ID:

```tsx
<Horizontal
  id={listing._id}  // Add this line
  title={listing.title}
  address={`${listing.address.city}, ${listing.address.state}`}
  imageSrc={listing.images[0]?.url}
  ltv={80}
  apr={listing.financials.interestRate}
  principal={listing.financials.purchasePrice}
  maturityDate={listing.financials.maturityDate}
/>
```

## Sample Data Structure

### Listing Object
```typescript
{
  _id: "abc123...",
  title: "Malibu Beach Detached Villa",
  address: {
    street: "123 Pacific Coast Highway",
    city: "Malibu",
    state: "CA",
    zip: "90265",
    country: "USA"
  },
  location: {
    lat: 34.0259,
    lng: -118.7798
  },
  investorBrief: "Prime beachfront property...",
  images: [
    { url: "...", alt: "...", order: 0 },
    ...
  ],
  financials: {
    purchasePrice: 2500000,
    currentValue: 2750000,
    monthlyPayment: 12500,
    interestRate: 9.5,
    loanTerm: 360,
    maturityDate: "2029-12-31"
  },
  appraisal: {
    value: 2600000,
    date: "2024-10-15",
    appraiser: "Pacific Coast Appraisals, Inc.",
    method: "comparative"
  },
  status: "active",
  viewCount: 0,
  createdAt: "2024-10-27T...",
  updatedAt: "2024-10-27T..."
}
```

### Payment Object
```typescript
{
  _id: "xyz789...",
  listingId: "abc123...",
  amount: 12500,
  date: "2024-10-01",
  status: "paid",
  type: "principal"
}
```

## Clearing Sample Data

When you're done testing, clear the sample data:

```bash
npx convex run seed:clearListingDetailData
```

This will only remove the property listings created by `seedListingDetailData` and their associated payments, leaving other data intact.

## Troubleshooting

### Map doesn't load
- Check that `NEXT_PUBLIC_MAPBOX_TOKEN` is set in `.env.local`
- Verify the token is valid and has the correct permissions
- Restart your dev server after adding the token

### Images don't load
- Check network tab for CORS errors
- Verify Unsplash URLs are accessible
- Replace with local images if needed

### 404 errors
- Verify you're using a valid listing ID from the seed function output
- Check that the listing exists in the Convex dashboard
- Ensure you're on the correct route pattern: `/listings/[id]`

### Type errors
- Run `pnpm run tsgo` to regenerate Convex types
- Restart TypeScript server in your IDE

## Next Steps

After testing, consider:
1. Adding unit tests for individual components
2. Writing E2E tests with Playwright
3. Running Lighthouse audit for performance
4. Testing with screen readers for accessibility
5. Adding real data from your production database
