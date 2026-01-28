## ADDED Requirements

> **Screen References**: Key screens for this spec:
> - S8. Broker Client Onboarding Workspace - Broker initiates client invites and configures filters
> - S9. Client Detail Page - Client portfolio, returns, and filters view
> - S12. Client Onboarding Portal - Client completes profile with broker branding
> - S13. Client Portfolio Portal - Client portfolio with adjusted returns
>
> See [`design.md`](../design.md#screen-and-component-manifest) for complete screen and component specifications.

### Requirement: Broker-Facilitated Client Onboarding Flow

The system SHALL provide a broker-facilitated client onboarding workflow where brokers initiate client invitations, configure listing filters, and approve clients before granting platform access, with clients receiving their own WorkOS organizations for RBAC isolation.

#### Scenario: Client receives broker invitation email

- **GIVEN** a broker who has sent an invitation to client's email
- **WHEN** the client receives the email
- **THEN** the email contains a unique invite link (e.g., `https://{subdomain}.flpilot.com/onboarding?token={inviteToken}`) and instructions to complete their profile

#### Scenario: Client accesses invite link

- **GIVEN** a client clicking the invite link from their email
- **WHEN** the onboarding page loads
- **THEN** the system validates the invite token, loads the broker's branding (logo, colors), and displays the onboarding workspace branded to the broker

#### Scenario: Client enters profile information

- **GIVEN** a client on the profile step of onboarding
- **WHEN** they enter their name, contact information, and complete identity verification
- **THEN** the system saves the profile data to their user record and advances to the review step

#### Scenario: Client review shows broker-configured filters

- **GIVEN** a client on the review step of onboarding
- **WHEN** the review page renders
- **THEN** the system displays:
  - Client's profile information
  - Broker-configured listing filters (ranges for LTV, loan amount, interest rate, property types, locations, risk profile)
  - Return adjustment percentage explanation ("Your returns are displayed adjusted by your broker's fee")

#### Scenario: Client submits profile for broker approval

- **GIVEN** a client on the review step with completed profile
- **WHEN** they click "Submit for Broker Approval"
- **THEN** the system sets the `broker_clients` record status to `pending_approval` and notifies the broker

#### Scenario: Client receives approval notification

- **GIVEN** a client with profile in `pending_approval` status
- **WHEN** the broker approves the client's profile
- **THEN** the system sends an email notification and in-app alert to the client indicating their account has been approved

#### Scenario: Client logs in after approval

- **GIVEN** an approved client navigating to `https://{subdomain}.flpilot.com`
- **WHEN** they sign in using WorkOS AuthKit
- **THEN** the system routes them to their portfolio page with broker branding applied and listing filters active

---

### Requirement: Client Listing Filter Application

The system SHALL apply broker-configured filter constraints and client-selected filter values to client queries, ensuring clients only see listings that match the criteria configured by their broker and selected by the client within those constraints.

#### Scenario: Client sees filtered listings based on their selected values

- **GIVEN** an approved client accessing the marketplace page
- **WHEN** the listings query executes
- **THEN** the system filters the listings based on the client's `broker_clients.filters.values` (selected min/max LTV, min/max loan amount, min/max interest rate, property types, locations, risk profile)

#### Scenario: Client constraints are validated before applying filters

- **GIVEN** a client attempting to save filter values
- **WHEN** any value violates the broker's constraints
- **THEN** the system displays a validation error indicating which constraints were violated

#### Scenario: Filters exclude out-of-range listings

- **GIVEN** a client with broker constraints minLTV: 50, maxLTV: 70 and client selected values minLTV: 60, maxLTV: 65
- **WHEN** viewing listings
- **THEN** the system excludes listings with LTV below 60% or above 65% from the results

#### Scenario: Filters apply to all client queries

- **GIVEN** a client searching, sorting, or filtering listings
- **WHEN** any listing query executes
- **THEN** the system always applies the client's selected filter values and broker's constraints first, then the client's additional search criteria on top

#### Scenario: Client can modify their selected values within constraints

- **GIVEN** a client viewing their profile page
- **WHEN** they modify filter values within broker constraints
- **THEN** the system validates against constraints and saves the new values, immediately applying them to listing queries

#### Scenario: Client cannot modify values outside constraints

- **GIVEN** a client attempting to set a filter value outside broker constraints
- **WHEN** they attempt to save
- **THEN** the system displays a validation error and prevents the save

#### Scenario: Zero results show helpful message

- **GIVEN** a client with restrictive filter values that exclude all available listings
- **WHEN** querying listings
- **THEN** the system displays an empty state message indicating no listings match their current criteria and suggesting they adjust their selected values or contact their broker to modify constraints

#### Scenario: Filter visibility shows both constraints and selected values

- **GIVEN** a client viewing their profile page
- **WHEN** the filter section renders
- **THEN** the system displays the broker's constraints as read-only indicators and the client's selected values as editable fields

---

### Requirement: Client Portfolio and Returns Display

The system SHALL display client portfolios with returns adjusted by the broker's return adjustment rate, clearly showing the base return and broker adjustment.

#### Scenario: Client views portfolio summary

- **GIVEN** an approved client accessing `https://{subdomain}.flpilot.com/portfolio`
- **WHEN** the portfolio page renders
- **THEN** the system displays:
  - Total invested capital
  - Number of active deals
  - Average return (adjusted)
  - Adjusted return calculation (base minus adjustment)

#### Scenario: Deal returns show adjustment

- **GIVEN** a client viewing individual deal returns in their portfolio
- **WHEN** the deal return displays
- **THEN** the system shows, e.g., "Return: 8.5% (Base: 9.0% - Broker Adjustment: 0.5%)"

#### Scenario: Return adjustment explanation is clear

- **GIVEN** a client seeing adjusted returns for the first time
- **WHEN** the returns display appears
- **THEN** the system includes a tooltip or help text explaining, "Your returns are displayed net of your broker's fee structure as set by your broker"

#### Scenario: Historical returns preserve original adjustment

- **GIVEN** a client viewing deals completed before a broker rate change
- **WHEN** the return display renders
- **THEN** the system returns show the adjustment rate in effect at the time of deal completion, not the current rate

#### Scenario: Portfolio metrics update in real-time

- **GIVEN** a client viewing their portfolio page
- **WHEN** a new deal completes involving this client
- **THEN** the system automatically updates the portfolio summary metrics without page refresh

---

### Requirement: Client Page Navigation under Broker Subdomain

The system SHALL broker all client traffic under the broker's subdomain with broker branding applied, while maintaining separate WorkOS organizations for client RBAC isolation.

#### Scenario: Client URL uses broker subdomain

- **GIVEN** an approved client associated with "acmebroker" broker
- **WHEN** the client accesses the platform
- **THEN** their URLs use the broker's subdomain (e.g., `https://acmebroker.flpilot.com/portfolio`), not a client-specific subdomain

#### Scenario: Client pages show broker branding

- **GIVEN** a client viewing any page under the broker's subdomain
- **WHEN** the page renders
- **THEN** the layout displays the broker's logo, colors, and brand name

#### Scenario: Client RBAC is separate from broker org

- **GIVEN** a client associated with a broker
- **WHEN** their WorkOS membership is queried
- **THEN** the client belongs to their own WorkOS organization, not the broker's organization (maintaining security isolation)

#### Scenario: Client can navigate to listing details

- **GIVEN** a client viewing a filtered listing
- **WHEN** they click on a listing name
- **THEN** the system navigates to the listing detail page at `https://{subdomain}.flpilot.com/listings/{listingId}` with broker branding maintained

#### Scenario: Client can navigate to their profile

- **GIVEN** a client viewing their portfolio page
- **WHEN** they click on their profile link
- **THEN** the system navigates to their profile page at `https://{subdomain}.flpilot.com/profile` with read-only filter configuration

---

### Requirement: Client Broker Communication

The system SHALL enable communication between brokers and clients, including admin follow-up requests and client responses, persisting chronologically in the client's timeline.

#### Scenario: Broker sends client follow-up request

- **GIVEN** a broker viewing a client's profile
- **WHEN** they click "Request Additional Information" and add a message
- **THEN** the system adds an entry to a client communications timeline and sends an in-app notification to the client

#### Scenario: Client responds to broker request

- **GIVEN** a client with a pending broker request
- **WHEN** they submit a response with optional document uploads
- **THEN** the system updates the timeline entry with the response and notifies the broker

#### Scenario: Timeline shows full communication history

- **GIVEN** a broker or client viewing a client's communication timeline
- **WHEN** the timeline renders
- **THEN** the system displays all communications chronologically, showing requests, responses, and document uploads with timestamps

#### Scenario: Communication is linked to onboarding process

- **GIVEN** a broker requesting additional information from a client during onboarding
- **WHEN** the client responds
- **THEN** the system can advance the onboarding status based on the broker's satisfaction with the response

---

### Requirement: Client Admin Follow-Up Requests

The system SHALL support admin requests for additional information from clients during broker review, with clients able to respond via in-app messaging and document uploads.

#### Scenario: Admin requests additional client information

- **GIVEN** an admin reviewing a client's profile during broker onboarding
- **WHEN** they click "Request Additional Information" and add a message
- **THEN** the system adds an entry to the client's communication timeline and notifies the client

#### Scenario: Client responds to admin request

- **GIVEN** a client with a pending admin information request
- **WHEN** they access their onboarding page and respond with a message and optional documents
- **THEN** the system updates the timeline entry with the response and documents and notifies the admin

#### Scenario: Admin sees client response notification

- **GIVEN** an admin who requested information from a client
- **WHEN** the client responds
- **THEN** the system displays an alert or notification indicating the client has responded

#### Scenario: Admin can approve based on response

- **GIVEN** an admin reviewing a client's response to an information request
- **WHEN** satisfied with the response, the admin approves the client
- **THEN** the system grants the client access to the platform with broker-assigned filters active

---

### Requirement: Client Document Storage

The system SHALL store client-uploaded documents (e.g., identity verification, accreditation, agreements) in Convex storage linked to the client's user record for audit and compliance documentation.

#### Scenario: Client uploads identity document

- **GIVEN** a client during profile completion
- **WHEN** they upload an identity verification document (e.g., passport)
- **THEN** the system stores the file in Convex storage and links the `storageId` to the client's user record with metadata (label, type, uploadedAt)

#### Scenario: Document metadata includes timestamp

- **GIVEN** a client uploading any document
- **WHEN** the document is stored
- **THEN** the system records the current ISO timestamp in the `uploadedAt` field

#### Scenario: Documents are linked to client record

- **GIVEN** a client viewing their profile page
- **WHEN** the documents section renders
- **THEN** the system displays all uploaded documents with labels and upload dates

#### Scenario: Admin can view client documents

- **GIVEN** a platform admin reviewing a client's record
- **WHEN** they access the documents section
- **THEN** the system displays all client-uploaded documents with the ability to download for review

#### Scenario: Documents persist beyond onboarding

- **GIVEN** a client who has completed onboarding
- **WHEN** they or admins view their profile
- **THEN** the system retains all uploaded documents for ongoing compliance requirements