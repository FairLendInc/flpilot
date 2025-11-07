# listing-detail Specification

## Purpose
TBD - created by archiving change add-listing-detail-page. Update Purpose after archive.
## Requirements
### Requirement: Page Routing and Access

The system SHALL provide a dedicated detail page for each property listing accessible via a unique URL path.

#### Scenario: Navigate to listing detail from card
- **WHEN** a user clicks on a listing card
- **THEN** the browser navigates to `/listings/[id]` where `[id]` is the unique listing identifier
- **AND** the page loads with full property details

#### Scenario: Direct URL access
- **WHEN** a user navigates directly to `/listings/[id]` via URL
- **THEN** the page loads with the corresponding listing details
- **AND** authentication is verified before displaying content

#### Scenario: Invalid listing ID
- **WHEN** a user navigates to `/listings/[id]` with a non-existent listing ID
- **THEN** the system displays a 404 error page
- **AND** provides a link to return to listings overview

#### Scenario: Unauthorized access attempt
- **WHEN** an unauthenticated user attempts to access `/listings/[id]`
- **THEN** the system redirects to the sign-in page
- **AND** preserves the intended URL for post-authentication redirect

### Requirement: Image Carousel Display

The system SHALL display property images in an interactive carousel component with navigation controls.

#### Scenario: Display multiple property images
- **WHEN** the listing detail page loads
- **THEN** the image carousel displays the first property image
- **AND** navigation controls (previous/next arrows) are visible
- **AND** thumbnail previews are shown below the main image

#### Scenario: Navigate between images with mouse
- **WHEN** a user clicks the next arrow
- **THEN** the carousel transitions to the next image
- **AND** the corresponding thumbnail is highlighted

#### Scenario: Navigate between images with keyboard
- **WHEN** the carousel has focus
- **AND** a user presses the right arrow key
- **THEN** the carousel advances to the next image
- **AND** the left arrow key moves to the previous image

#### Scenario: Click thumbnail to view image
- **WHEN** a user clicks a thumbnail preview
- **THEN** the carousel displays the selected image
- **AND** updates the highlighted thumbnail indicator

#### Scenario: Carousel with single image
- **WHEN** a listing has only one property image
- **THEN** the carousel displays the single image
- **AND** navigation controls are hidden

#### Scenario: Touch/swipe navigation on mobile
- **WHEN** a user swipes left on the carousel
- **THEN** the carousel advances to the next image
- **AND** swiping right moves to the previous image

#### Scenario: Lazy loading images
- **WHEN** the page loads
- **THEN** the first image loads immediately
- **AND** subsequent images load lazily as needed
- **AND** placeholder blur images display while loading

### Requirement: Interactive Map Display

The system SHALL display an interactive map centered on the property's location using Mapbox integration.

#### Scenario: Display map with property marker
- **WHEN** the listing detail page loads
- **THEN** the map displays centered on the property's coordinates
- **AND** a custom marker indicates the property location
- **AND** the zoom level shows neighborhood context (approximately 1-mile radius)

#### Scenario: Map positioning on page
- **WHEN** viewing the page on desktop (width ≥1024px)
- **THEN** the map appears adjacent to the image carousel
- **AND** both components have equal height

#### Scenario: Map positioning on mobile
- **WHEN** viewing the page on mobile (width <1024px)
- **THEN** the map appears below the image carousel
- **AND** the map height is optimized for mobile viewports

#### Scenario: Map loading failure
- **WHEN** the Mapbox API fails to load or times out
- **THEN** the map section displays an error message
- **AND** the page remains functional with other content visible

#### Scenario: Missing location data
- **WHEN** a listing does not have valid coordinates
- **THEN** the map section is hidden
- **AND** only the text address is displayed

### Requirement: Property Information Display

The system SHALL display comprehensive property details including title, address, and investor's summary.

#### Scenario: Display property header
- **WHEN** the listing detail page loads
- **THEN** the property title is displayed as the main heading (h1)
- **AND** the full property address is shown below the title
- **AND** the address is formatted as: "Street, City, State ZIP"

#### Scenario: Display investor's brief
- **WHEN** the listing has an investor's brief/summary
- **THEN** the brief is displayed in a dedicated section
- **AND** the text is rendered with proper formatting (paragraphs, line breaks)

#### Scenario: Missing investor brief
- **WHEN** the listing does not have an investor's brief
- **THEN** the investor brief section is hidden
- **AND** no placeholder or empty state is shown

#### Scenario: Display listing status
- **WHEN** the listing detail page loads
- **THEN** the current listing status is displayed (e.g., "Active", "Funded", "Closed")
- **AND** the status is styled with appropriate visual indicator (badge, color)

### Requirement: Key Financials Display

The system SHALL display critical investment financial metrics in a structured, easy-to-scan format.

#### Scenario: Display financial metrics grid
- **WHEN** the listing detail page loads
- **THEN** key financial metrics are displayed in a grid layout
- **AND** each metric includes a label and formatted value
- **AND** the grid is responsive (2 columns on mobile, 3-4 columns on desktop)

#### Scenario: Display purchase price
- **WHEN** the financials section renders
- **THEN** the purchase price is displayed
- **AND** the value is formatted as currency (e.g., "$500,000")

#### Scenario: Display current value
- **WHEN** the financials section renders
- **THEN** the current property value is displayed
- **AND** the value is formatted as currency

#### Scenario: Display monthly payment
- **WHEN** the financials section renders
- **THEN** the monthly payment amount is displayed
- **AND** the value is formatted as currency

#### Scenario: Display interest rate
- **WHEN** the financials section renders
- **THEN** the interest rate is displayed
- **AND** the value is formatted as percentage (e.g., "4.5%")

#### Scenario: Display loan term
- **WHEN** the financials section renders
- **THEN** the loan term is displayed
- **AND** the value is formatted as years or months (e.g., "30 years")

#### Scenario: Display maturity date
- **WHEN** the financials section renders
- **THEN** the maturity date is prominently displayed
- **AND** the date is formatted as readable text (e.g., "December 31, 2045")
- **AND** a visual indicator shows time remaining until maturity

### Requirement: Payment History Display

The system SHALL display the complete payment history for the listing in chronological order.

#### Scenario: Display payment timeline
- **WHEN** the listing has payment history
- **THEN** payments are displayed in a timeline format
- **AND** the most recent payment appears at the top
- **AND** each payment shows date, amount, and status

#### Scenario: Payment status indicators
- **WHEN** displaying each payment entry
- **THEN** the payment status is visually indicated
- **AND** paid payments show a success indicator (green check)
- **AND** late payments show a warning indicator (yellow/orange alert)
- **AND** pending payments show an info indicator (blue clock)

#### Scenario: Payment type categorization
- **WHEN** displaying payment details
- **THEN** the payment type is shown (e.g., "Principal", "Interest", "Escrow")
- **AND** types are color-coded or icon-differentiated

#### Scenario: Empty payment history
- **WHEN** a listing has no payment history yet
- **THEN** an empty state message is displayed
- **AND** the message explains that payments will appear after the first payment is made

#### Scenario: Payment history on mobile
- **WHEN** viewing payment history on mobile devices
- **THEN** the timeline is vertically oriented
- **AND** each payment entry is collapsible for space efficiency
- **AND** essential info (date, amount, status) is visible in collapsed state

### Requirement: Appraisal Data Display

The system SHALL display property appraisal information when available.

#### Scenario: Display appraisal details
- **WHEN** the listing has appraisal data
- **THEN** the appraised value is prominently displayed
- **AND** the appraisal date is shown
- **AND** the appraiser name/company is displayed
- **AND** the appraisal method is indicated (e.g., "Comparative Market Analysis")

#### Scenario: Compare appraisal to current value
- **WHEN** both appraisal and current value exist
- **THEN** the system calculates and displays the value change
- **AND** the change is shown as both absolute value and percentage
- **AND** positive changes are indicated with green styling
- **AND** negative changes are indicated with red styling

#### Scenario: Missing appraisal data
- **WHEN** a listing does not have appraisal information
- **THEN** the appraisal section is hidden entirely
- **AND** no empty state or placeholder is shown

### Requirement: Comparable Properties Display

The system SHALL display similar properties in the area to provide investment context.

#### Scenario: Display comparable properties list
- **WHEN** comparable properties are found for the listing
- **THEN** up to 5 comparable properties are displayed
- **AND** each comparable shows: thumbnail image, address, price, and key metrics
- **AND** comparables are sorted by proximity to the main property

#### Scenario: Navigate to comparable property
- **WHEN** a user clicks on a comparable property
- **THEN** the browser navigates to that property's detail page
- **AND** the navigation maintains the same tab/window context

#### Scenario: Comparable properties on mobile
- **WHEN** viewing comparables on mobile devices
- **THEN** comparables are displayed in a vertical list
- **AND** each comparable is displayed as a compact card
- **AND** horizontal scrolling is enabled if space-constrained

#### Scenario: No comparable properties found
- **WHEN** no comparable properties exist for the listing
- **THEN** the comparables section is hidden
- **AND** no empty state message is displayed

#### Scenario: Comparable property criteria
- **WHEN** the system searches for comparable properties
- **THEN** properties must be within 5 miles of the main property
- **AND** properties must be within 20% of the price range
- **AND** properties must have the same status (active, funded, etc.)

### Requirement: Responsive Layout

The system SHALL provide an optimized layout for all device sizes.

#### Scenario: Desktop layout (≥1024px width)
- **WHEN** viewing the page on desktop
- **THEN** the image carousel and map are displayed side-by-side
- **AND** financial metrics use a 4-column grid
- **AND** the content width is constrained to a maximum of 1440px
- **AND** content is centered on screen

#### Scenario: Tablet layout (768px - 1023px width)
- **WHEN** viewing the page on tablet
- **THEN** the image carousel appears above the map
- **AND** financial metrics use a 3-column grid
- **AND** all content remains readable and interactive

#### Scenario: Mobile layout (<768px width)
- **WHEN** viewing the page on mobile
- **THEN** all sections stack vertically
- **AND** the image carousel is full-width
- **AND** the map is full-width
- **AND** financial metrics use a 2-column grid
- **AND** text sizes are optimized for small screens

### Requirement: Accessibility Compliance

The system SHALL meet WCAG 2.1 AA accessibility standards for the listing detail page.

#### Scenario: Keyboard navigation support
- **WHEN** a user navigates the page using only keyboard
- **THEN** all interactive elements are reachable via Tab key
- **AND** focus indicators are clearly visible
- **AND** the carousel supports arrow key navigation
- **AND** the tab order is logical (top to bottom, left to right)

#### Scenario: Screen reader compatibility
- **WHEN** a user navigates with a screen reader
- **THEN** all images have descriptive alt text
- **AND** carousel slide changes are announced
- **AND** section headings use proper hierarchy (h1, h2, h3)
- **AND** financial values include readable labels

#### Scenario: Color contrast requirements
- **WHEN** displaying any text content
- **THEN** the color contrast ratio is at least 4.5:1 for normal text
- **AND** the ratio is at least 3:1 for large text
- **AND** status indicators do not rely solely on color

#### Scenario: Reduced motion support
- **WHEN** a user has "prefers-reduced-motion" enabled
- **THEN** carousel transitions are instantaneous (no animation)
- **AND** all other animations are disabled or simplified
- **AND** functionality remains intact

### Requirement: Performance Optimization

The system SHALL meet defined performance targets for page load and interactivity.

#### Scenario: Initial page load performance
- **WHEN** a user navigates to the listing detail page
- **THEN** the initial page load completes in under 2 seconds on 3G
- **AND** the Largest Contentful Paint (LCP) occurs within 2.5 seconds
- **AND** the First Input Delay (FID) is less than 100 milliseconds

#### Scenario: Progressive image loading
- **WHEN** the page loads with multiple images
- **THEN** the first carousel image loads with high priority
- **AND** subsequent images load lazily
- **AND** blur placeholders display while images load
- **AND** images are served in modern formats (WebP/AVIF)

#### Scenario: Bundle size optimization
- **WHEN** the listing detail page is built
- **THEN** the page-specific JavaScript bundle is under 100KB (gzipped)
- **AND** third-party libraries (Mapbox, Embla) are code-split
- **AND** unused code is tree-shaken during build

#### Scenario: Cumulative Layout Shift prevention
- **WHEN** the page loads and renders
- **THEN** the Cumulative Layout Shift (CLS) score is below 0.1
- **AND** image dimensions are reserved to prevent layout shift
- **AND** the map container has fixed dimensions

### Requirement: Error Handling

The system SHALL handle errors gracefully without breaking the user experience.

#### Scenario: Convex query failure
- **WHEN** the Convex database query fails
- **THEN** the page displays a user-friendly error message
- **AND** provides a "Retry" button to reload data
- **AND** logs the error for monitoring

#### Scenario: Partial data availability
- **WHEN** some listing data is available but other sections fail
- **THEN** the available data is displayed normally
- **AND** failed sections show specific error messages
- **AND** the page remains functional

#### Scenario: Mapbox API failure
- **WHEN** the Mapbox API fails to load
- **THEN** the map section displays a fallback message
- **AND** the rest of the page functions normally
- **AND** the error is logged for monitoring

#### Scenario: Image loading failures
- **WHEN** property images fail to load
- **THEN** a placeholder image is displayed
- **AND** an error icon or message indicates the failure
- **AND** other page content continues to function

### Requirement: Data Freshness

The system SHALL display up-to-date property information.

#### Scenario: Server-side data fetching
- **WHEN** a user navigates to the listing detail page
- **THEN** the data is fetched server-side on each request
- **AND** the page displays the most current information from the database
- **AND** no stale cached data is displayed

#### Scenario: Client-side updates (optional)
- **WHEN** the page is already loaded in the browser
- **AND** the underlying listing data changes
- **THEN** the system MAY update the display with new data
- **AND** any updates happen without full page refresh

### Requirement: Analytics Tracking

The system SHALL track listing views for analytics purposes.

#### Scenario: Record listing view
- **WHEN** a user successfully loads a listing detail page
- **THEN** the system records a view event
- **AND** the event includes: listing ID, user ID (if authenticated), timestamp
- **AND** the view count is incremented for the listing

#### Scenario: Privacy compliance
- **WHEN** recording analytics events
- **THEN** no personally identifiable information (PII) is included
- **AND** the tracking complies with privacy regulations
- **AND** users can opt out via browser settings

### Requirement: SEO Optimization

The system SHALL optimize the listing detail page for search engine discoverability.

#### Scenario: Meta tags generation
- **WHEN** the listing detail page renders
- **THEN** the page includes proper meta tags (title, description)
- **AND** the title includes the property address
- **AND** the description includes key property details
- **AND** Open Graph tags are included for social sharing

#### Scenario: Structured data markup
- **WHEN** the page is indexed by search engines
- **THEN** the HTML includes structured data (JSON-LD)
- **AND** the structured data follows RealEstateListing schema
- **AND** property details are machine-readable

