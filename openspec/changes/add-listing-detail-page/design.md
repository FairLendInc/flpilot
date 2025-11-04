# Listing Detail Page - Technical Design

## Context

The platform needs a detailed view for investment property listings that provides investors with comprehensive information to evaluate investment opportunities. Users arrive at this page by clicking listing cards from search results or dashboards.

**Constraints**:
- Must work with existing Convex backend and WorkOS authentication
- Must be responsive and performant on mobile devices
- Map integration requires external API (Mapbox)
- Must handle missing or incomplete data gracefully
- Must maintain consistent design with existing HeroUI/Radix UI components

**Stakeholders**:
- Investors (primary users) - need comprehensive property information
- Property managers - may need to update listing information
- Platform admins - need analytics on listing views

## Goals / Non-Goals

**Goals**:
- Provide comprehensive property information in a single page view
- Enable visual property assessment via image carousel
- Show property location context via interactive map
- Display financial performance data and payment history
- Show comparable properties for investment context
- Ensure page loads in <2 seconds on 3G connections
- Maintain accessibility standards (WCAG 2.1 AA)

**Non-Goals**:
- Real-time property value updates (static appraisal data is sufficient)
- Advanced map features (drawing tools, multiple layers, custom styling)
- Social features (comments, reviews, sharing - future iteration)
- Investment calculator or financial modeling tools
- Direct messaging to property owners
- Property comparison tool (multiple listings side-by-side)

## Decisions

### Decision 1: Page Architecture - Server Component with Client Islands

**Choice**: Use Next.js App Router Server Component for page with Client Component islands for interactive features

**Rationale**:
- Server Components for initial data fetching and SEO
- Client Components only for carousel, map, and interactive elements
- Reduces client-side bundle size
- Improves Time to First Byte (TTFB)

**Alternatives considered**:
- Full Client Component page - rejected due to larger bundle size and slower initial render
- Static generation (SSG) - rejected because listing data changes frequently
- Incremental Static Regeneration (ISR) - considered for future optimization

**Implementation**:
```typescript
// app/(auth)/listings/[id]/page.tsx - Server Component
export default async function ListingDetailPage({ params }: { params: { id: string } })

// Client islands:
// - components/listing-detail/image-carousel.tsx - "use client"
// - components/listing-detail/property-map.tsx - "use client"
```

### Decision 2: Image Carousel - Embla Carousel

**Choice**: Use Embla Carousel React library (already in dependencies)

**Rationale**:
- Already installed in package.json (`embla-carousel-react@8.6.0`)
- Lightweight (~6KB gzipped)
- Accessible by default (keyboard navigation, ARIA labels)
- Mobile-optimized with touch/swipe support
- Framework-agnostic core with React wrapper

**Alternatives considered**:
- Swiper - heavier library, more features than needed
- Build custom carousel - unnecessary complexity, accessibility concerns
- Framer Motion carousel - already have Embla installed

**Implementation approach**:
- Lazy load images using Next.js Image component
- Thumbnail navigation at bottom
- Keyboard shortcuts (arrows, escape)
- Fullscreen mode option

### Decision 3: Map Integration - Mapbox GL JS

**Choice**: Use Mapbox GL JS (already in package.json)

**Rationale**:
- Already installed (`mapbox-gl@3.16.0`)
- Superior performance with vector tiles
- Rich ecosystem and excellent documentation
- Custom styling and marker support
- Works well with Next.js

**Alternatives considered**:
- Google Maps - more expensive, already have Mapbox
- Leaflet - less performant for complex maps
- OpenStreetMap directly - requires more setup

**Implementation approach**:
```typescript
// components/listing-detail/property-map.tsx
- Single static marker at property location
- Default zoom level showing neighborhood context
- Disable interactions (dragging, zooming) for simplicity
- Optional: Click to open full interactive map
```

**Environment variable**:
```bash
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your-mapbox-token
```

### Decision 4: Data Fetching Strategy

**Choice**: Server-side Convex query with Suspense boundaries

**Rationale**:
- Fetch all data server-side for initial page load
- Use Suspense for loading states
- Parallel queries for independent data (property info, payments, comparables)
- Client-side Convex hooks for real-time updates (optional)

**Implementation**:
```typescript
// Parallel data fetching
const [listing, payments, comparables] = await Promise.all([
  convex.query(api.listings.getById, { id }),
  convex.query(api.payments.getByListingId, { listingId: id }),
  convex.query(api.listings.getComparables, { id })
]);
```

### Decision 5: Component Organization

**Choice**: Feature-based component directory under `components/listing-detail/`

**Rationale**:
- Keeps related components together
- Easier to test and maintain
- Clear ownership boundaries
- Follows existing project patterns

**Structure**:
```
components/listing-detail/
├── image-carousel.tsx        # Main carousel with navigation
├── property-map.tsx           # Mapbox integration
├── property-info.tsx          # Title, address, summary
├── financial-metrics.tsx      # Key financials grid/cards
├── payment-history.tsx        # Timeline component
├── appraisal-data.tsx         # Valuation information
├── comparable-properties.tsx  # Comp list with mini cards
└── index.ts                   # Barrel export
```

### Decision 6: Styling Approach

**Choice**: Tailwind CSS + HeroUI/Radix UI primitives

**Rationale**:
- Consistent with existing project styling
- HeroUI for complex components (cards, grids)
- Radix UI for accessible primitives (accordion, tabs)
- Tailwind for custom layout and spacing

**Component choices**:
- Cards: HeroUI Card component
- Tabs (if needed): Radix UI Tabs
- Accordion (for payment history): Radix UI Accordion
- Timeline: Custom component with Tailwind

## Risks / Trade-offs

### Risk 1: Mapbox Token Exposure
**Risk**: Client-side token visible in browser could be abused
**Mitigation**:
- Use URL restrictions on Mapbox token (restrict to domain)
- Monitor usage via Mapbox dashboard
- Set rate limits and budget alerts
- Consider proxy endpoint for production

### Risk 2: Large Image Loading Performance
**Risk**: Multiple high-resolution images could slow page load
**Mitigation**:
- Use Next.js Image component with lazy loading
- Serve optimized WebP/AVIF formats
- Implement blur placeholder strategy
- Load first image eagerly, rest lazy
- Consider image CDN (Convex file storage or Cloudinary)

### Risk 3: Incomplete or Missing Data
**Risk**: Listings may have missing appraisal data, payment history, or comparables
**Mitigation**:
- Graceful fallbacks for missing sections
- Empty state components with helpful messaging
- Optional sections hidden when no data available
- Schema validation to ensure minimum required fields

### Risk 4: Mobile Performance
**Risk**: Map + carousel + data could be heavy on mobile
**Mitigation**:
- Lazy load map component (below fold)
- Reduce map tile quality on mobile
- Implement intersection observer for below-fold content
- Test on real mobile devices (not just emulators)
- Performance budget: <2s load time on 3G

### Trade-off 1: Interactivity vs Performance
**Decision**: Static map by default, interactive on demand
**Rationale**: Most users just need location context, not full map interaction. Saves ~50KB of JavaScript and improves initial load time.

### Trade-off 2: Real-time Updates vs Simplicity
**Decision**: Static data on page load, no WebSocket subscriptions
**Rationale**: Property data changes infrequently. Real-time updates add complexity without significant user benefit. Can add later if needed.

## Data Schema Requirements

### Listings Table (Convex)
```typescript
listings: defineTable({
  // Basic info
  title: v.string(),
  address: v.object({
    street: v.string(),
    city: v.string(),
    state: v.string(),
    zip: v.string(),
    country: v.string(),
  }),
  location: v.object({
    lat: v.number(),
    lng: v.number(),
  }),

  // Investor info
  investorBrief: v.string(),

  // Images
  images: v.array(v.object({
    url: v.string(),
    alt: v.optional(v.string()),
    order: v.number(),
  })),

  // Financial data
  financials: v.object({
    purchasePrice: v.number(),
    currentValue: v.number(),
    monthlyPayment: v.number(),
    interestRate: v.number(),
    loanTerm: v.number(), // months
    maturityDate: v.string(), // ISO date
  }),

  // Appraisal
  appraisal: v.optional(v.object({
    value: v.number(),
    date: v.string(),
    appraiser: v.string(),
    method: v.string(), // "comparative", "income", "cost"
  })),

  // Status
  status: v.string(), // "active", "funded", "closed"
  createdAt: v.string(),
  updatedAt: v.string(),
})
  .index('by_status', ['status'])
```

### Payment History Table
```typescript
payments: defineTable({
  listingId: v.id('listings'),
  amount: v.number(),
  date: v.string(),
  status: v.string(), // "paid", "pending", "late"
  type: v.string(), // "principal", "interest", "escrow"
})
  .index('by_listing', ['listingId'])
  .index('by_listing_date', ['listingId', 'date'])
```

## Migration Plan

### Phase 1: Core Page (Week 1)
1. Create route and basic page structure
2. Implement property info and financial metrics sections
3. Add image carousel component
4. Deploy and test

### Phase 2: Enhanced Features (Week 2)
1. Integrate Mapbox map component
2. Add payment history timeline
3. Add appraisal data section
4. Deploy and test

### Phase 3: Comparables (Week 3)
1. Implement comparable properties algorithm (Convex query)
2. Create comparable properties component
3. Optimize performance and bundle size
4. Final testing and deployment

### Rollback Plan
- Feature flag for new route (can disable in middleware)
- Listing cards can fall back to modal/drawer if route disabled
- No data migration required (all additive)

## Performance Targets

- **Initial Page Load**: <2 seconds on 3G
- **Time to Interactive (TTI)**: <3 seconds
- **Largest Contentful Paint (LCP)**: <2.5 seconds
- **First Input Delay (FID)**: <100ms
- **Cumulative Layout Shift (CLS)**: <0.1
- **Bundle Size**: <100KB for listing detail code (excluding images)

**Measurement**:
- Use Lighthouse CI in GitHub Actions
- Real User Monitoring (RUM) via Vercel Analytics
- Core Web Vitals tracking

## Accessibility Requirements

- **WCAG 2.1 AA compliance**
- Keyboard navigation for carousel (arrows, Enter, Escape)
- Screen reader announcements for carousel slide changes
- Proper heading hierarchy (h1 for title, h2 for sections)
- Sufficient color contrast (4.5:1 minimum)
- Alt text for all property images
- Focus management (trap focus in fullscreen mode)
- Reduced motion support (respect `prefers-reduced-motion`)

## Security Considerations

- **Input validation**: Validate listing ID parameter (prevent injection)
- **Authorization**: Ensure user has permission to view listing (via Convex auth)
- **Rate limiting**: Protect against scraping (Vercel Edge Config)
- **Mapbox token**: URL restrictions, usage monitoring
- **XSS prevention**: Sanitize user-generated content (investor brief)

## Testing Strategy

### Unit Tests (Vitest)
- Component rendering with mock data
- Edge cases (missing data, invalid IDs)
- Accessibility checks (axe-core)

### Integration Tests (Playwright)
- Full page load and navigation
- Carousel interaction (click, keyboard)
- Map rendering and interaction
- Responsive behavior (mobile, tablet, desktop)

### Performance Tests
- Lighthouse CI for Core Web Vitals
- Bundle size monitoring
- Image optimization verification

## Open Questions

1. **Should we support video tours in addition to images?**
   - Deferred to future iteration
   - Would require video player component and storage

2. **Should comparable properties be sorted by distance, price, or similarity score?**
   - Start with distance-based sorting
   - Can add multi-factor scoring later

3. **Do we need print stylesheet for property reports?**
   - Not in v1
   - Can add CSS print styles in future iteration

4. **Should we track analytics for listing views?**
   - Yes - add simple page view tracking
   - Use Convex mutation to record view count
   - Privacy-compliant (no PII in analytics)

5. **What happens if Mapbox API fails or is slow?**
   - Show static image fallback (or hide map section)
   - Implement timeout (5 seconds max)
   - Graceful degradation without breaking page
