## ADDED Requirements

**Screen References**: This specification references screens and components defined in the [Screen and Component Manifest](../../design.md#screen-and-component-manifest). Key screens for tenant branding functionality:
- **S11**: Broker Branding & Subdomain Settings
- **S6**: Broker Portal Dashboard (uses branded layout)
- **S12**: Client Onboarding Portal (broker-branded layout)
- **S13**: Client Portfolio Portal (broker-branded layout)

### Requirement: Broker Subdomain Provisioning

The system SHALL provision unique vanity subdomains for approved brokers and enable routing to broker-branded portals via subdomain-based routing.

#### Scenario: Broker proposes subdomain during onboarding

- **GIVEN** a broker onboarding journey at "broker.company_info" state
- **WHEN** the broker enters a desired subdomain (e.g., "acmebrokers")
- **THEN** the system stores the proposal in `context.broker.proposedSubdomain` and validates format (alphanumeric lowercase, 3-50 characters, no special characters)

#### Scenario: System validates subdomain availability

- **GIVEN** a broker onboarding journey with a `proposedSubdomain` in context
- **WHEN** the broker advances past the company info step
- **THEN** the system checks the `brokers` table to verify no existing broker has the same subdomain

#### Scenario: Subdomain collision triggers error

- **GIVEN** a broker onboarding journey with a `proposedSubdomain` that already exists in the `brokers` table
- **WHEN** the broker attempts to proceed
- **THEN** the system displays an error message indicating the subdomain is already taken and prompts the broker to choose another

#### Scenario: Admin sees subdomain in application review

- **GIVEN** an admin reviewing a broker onboarding journey with `proposedSubdomain` set
- **WHEN** they view the application detail
- **THEN** the system displays the proposed subdomain prominently in the company information section

#### Scenario: Subdomain provisioned on approval

- **GIVEN** an admin approves a broker onboarding journey with a validated `proposedSubdomain`
- **WHEN** the approval function executes
- **THEN** the system creates a `brokers` table record with `subdomain: proposedSubdomain` and enables routing to that subdomain

#### Scenario: Subdomain is stored as lowercase

- **GIVEN** a broker enters a subdomain with mixed case (e.g., "AcmeBrokers")
- **WHEN** the subdomain is stored in the `brokers` table
- **THEN** the system converts it to lowercase ("acmebrokers") for consistent routing

---

### Requirement: Broker Branding Configuration

The system SHALL store broker-specific branding configuration (logo, colors, brand name) and apply it consistently to all pages under the broker's subdomain.

#### Scenario: Broker uploads logo during configuration

- **GIVEN** an approved broker accessing their branding settings page
- **WHEN** they upload a logo image file
- **THEN** the system stores the file in Convex storage and saves the `storageId` in `brokers.branding.logoStorageId`

#### Scenario: Broker configures brand colors

- **GIVEN** an approved broker accessing their branding settings page
- **WHEN** they set primary color (hex format, e.g., "#FF5733") and secondary color (hex format, e.g., "#666666")
- **THEN** the system validates the hex format and saves the colors in `brokers.branding.primaryColor` and `brokers.branding.secondaryColor`

#### Scenario: Broker sets custom brand name

- **GIVEN** an approved broker who wants to display a different brand name than their company name
- **WHEN** they enter a custom brand name (e.g., "Acme Investment Group")
- **THEN** the system saves the brand name in `brokers.branding.brandName`

#### Scenario: Branding preview shows live changes

- **GIVEN** a broker modifying any branding field (logo, colors, brand name)
- **WHEN** they make a change
- **THEN** the system immediately updates the branding preview component to reflect the new configuration

#### Scenario: Branding persists across page navigation

- **GIVEN** a configured broker portal with custom branding
- **WHEN** the user navigates between different pages under the broker's subdomain
- **THEN** the system applies the same branding configuration (logo, colors, brand name) to all pages

#### Scenario: Default branding applies when not configured

- **GIVEN** a new approved broker without any branding configuration
- **WHEN** users access the broker's portal
- **THEN** the system applies default platform branding (default logo, default colors, company name as brand name)

---

### Requirement: Subdomain-Based Routing

The system SHALL route requests to broker or client portals based on subdomain (e.g., `broker.flpilot.com`) and apply broker branding to all pages under that subdomain.

#### Scenario: Middleware detects broker subdomain

- **GIVEN** an incoming request with host header set to `acmebroker.flpilot.com`
- **WHEN** the middleware processes the request
- **THEN** the system parses the subdomain using `getSubdomain(host)` and identifies "acmebroker" as the subdomain

#### Scenario: Middleware looks up broker by subdomain

- **GIVEN** a subdomain parsed as "acmebroker"
- **WHEN** the middleware queries the `brokers` table
- **THEN** the system retrieves the broker record and loads the branding configuration into the request context

#### Scenario: Broker branding injected into page context

- **GIVEN** a request to `acmebroker.flpilot.com/dashboard` with valid broker lookup
- **WHEN** the page renders
- **THEN** the system provides the broker's `branding` object to all components via Next.js context

#### Scenario: Broker routes render with broker branding

- **GIVEN** a request to `acmebroker.flpilot.com/dashboard` with broker branding in context
- **WHEN** the dashboard page renders
- **THEN** the system displays the broker's logo, uses the broker's primary/secondary colors, and shows the broker's brand name

#### Scenario: Client routes under broker subdomain use broker branding

- **GIVEN** a client associated with the "acmebroker" broker accessing their portfolio at `acmebroker.flpilot.com/portfolio`
- **WHEN** the portfolio page renders
- **THEN** the system applies the broker's branding (logo, colors, brand name) despite being a client view

#### Scenario: Invalid subdomain redirects to main domain

- **GIVEN** an incoming request with subdomain "nonexistent" that has no matching broker
- **WHEN** the middleware fails to find a broker record
- **THEN** the system redirects the user to the main domain (e.g., `flpilot.com`) with a friendly error message

#### Scenario: Localhost development supports subdomain routing

- **GIVEN** a development environment with request to `acmebroker.localhost:3000`
- **WHEN** the middleware processes the request
- **THEN** the system correctly parses "acmebroker" as the subdomain (per `getSubdomain` implementation) and routes to the broker portal

---

### Requirement: Branding Application Consistency

The system SHALL apply broker branding consistently across all pages under the broker's subdomain, including layout components, navigation, headers, and content areas.

#### Scenario: Layout header shows broker logo

- **GIVEN** a page under `acmebroker.flpilot.com` with a configured logo
- **WHEN** the layout header renders
- **THEN** the system displays the broker's logo image instead of the default platform logo

#### Scenario: Navigation uses broker brand name

- **GIVEN** a branded broker portal page
- **WHEN** the navigation component renders
- **THEN** the system displays the broker's `brandName` in the navigation title or navbar

#### Scenario: Primary buttons use broker primary color

- **GIVEN** a branded broker portal page with primary color set to "#FF5733"
- **WHEN** primary action buttons render
- **THEN** the system applies the broker's primary color to the button backgrounds

#### Scenario: Secondary elements use broker secondary color

- **GIVEN** a branded broker portal page with secondary color set to "#666666"
- **WHEN** secondary UI elements render (cards, borders, muted text)
- **THEN** the system applies the broker's secondary color to these elements

#### Scenario: Theme colors propagate to child components

- **GIVEN** a branded broker portal with CSS variables set based on broker colors
- **WHEN** child components render nested within the branded layout
- **THEN** the system makes the CSS variables accessible to all child components via `BrandingProvider`

#### Scenario: Branding persists on page refresh

- **GIVEN** a user viewing a branded broker portal page
- **WHEN** they refresh the page
- **THEN** the middleware re-applies the broker branding before the page renders, ensuring consistent appearance

---

### Requirement: Branding Configuration Access Control

The system SHALL restrict branding configuration modifications to broker admins and allow read-only access to broker and client users.

#### Scenario: Broker admin can modify branding

- **GIVEN** a user with `broker_admin` role in the broker's WorkOS organization
- **WHEN** they navigate to the broker branding settings page
- **THEN** the system displays editable fields for logo, colors, and brand name

#### Scenario: Broker team member cannot modify branding

- **GIVEN** a user with `broker_team_member` role in the broker's WorkOS organization
- **WHEN** they attempt to access the branding settings page
- **THEN** the system displays an access denied error or redirects them to the dashboard

#### Scenario: Client cannot modify broker branding

- **GIVEN** a client user associated with the broker
- **WHEN** they attempt to access the broker branding settings page
- **THEN** the system displays an access denied error or redirects them to their portfolio page

#### Scenario: Non-authenticated user cannot access branding settings

- **GIVEN** an unauthenticated user attempting to access branding settings
- **WHEN** they navigate to `{subdomain}.flpilot.com/settings/branding`
- **THEN** the system redirects them to the sign-in page

#### Scenario: Admin can view broker branding

- **GIVEN** a platform admin viewing a broker management page
- **WHEN** they open a specific broker record
- **THEN** the system displays the broker's current branding configuration in read-only format