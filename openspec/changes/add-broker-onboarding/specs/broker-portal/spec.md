## ADDED Requirements

**Screen References**: This specification references screens and components defined in the [Screen and Component Manifest](../../design.md#screen-and-component-manifest). Key screens for broker portal functionality:
- **S6**: Broker Portal Dashboard
- **S7**: Broker Clients List
- **S8**: Broker Client Onboarding Workspace
- **S9**: Client Detail Page
- **S11**: Broker Branding & Subdomain Settings

### Requirement: Broker Dashboard

The system SHALL provide a broker dashboard page displaying key performance indicators (KPIs) for the broker's business, including assets under management (AUM), client count, deal volume, and commissions earned.

#### Scenario: Broker views their dashboard

- **GIVEN** an authenticated broker accessing `https://{subdomain}.flpilot.com/dashboard`
- ** Screen**: S6. Broker Portal Dashboard
- ** Components**: BrokerKPICards, BrokerQuickActions, BrokerRecentActivity
- **WHEN** the dashboard page renders
- **THEN** the system displays KPI cards showing:
  - Total AUM across all clients (sum of client investments)
  - Total client count (approved clients only)
  - Total deal volume (sum of all deals with broker's clients)
  - Total commissions earned (ledger-based calculation)

#### Scenario: Dashboard KPIs update in real-time

- **GIVEN** a broker viewing their dashboard
- **WHEN** a new deal is completed with one of their clients
- **THEN** the system automatically recalculates and updates the displayed KPIs without page refresh (via Convex reactivity)

#### Scenario: Dashboard shows quick actions

- **GIVEN** a broker viewing their dashboard
- **WHEN** the dashboard renders
- **THEN** the system displays quick action buttons to:
  - View client list
  - Onboard new client
  - View portfolio overview
  - Access settings

#### Scenario: Dashboard shows recent activity

- **GIVEN** a broker viewing their dashboard
- **WHEN** the dashboard renders
- **THEN** the system displays a list of recent activities:
  - New client onboarded (date, client name)
  - New deal completed (date, deal value)
  - Commission earned (date, amount)

#### Scenario: Dashboard handles zero data state

- **GIVEN** a newly approved broker with no clients or deals
- **WHEN** they view their dashboard
- **THEN** the system displays KPI cards with "0" values and an empty state message encouraging client onboarding

---

### Requirement: Broker Client List

The system SHALL provide a broker client list page displaying all clients associated with the broker, with search, filter, and drill-down capabilities to individual client pages.

#### Scenario: Broker views client list

- **GIVEN** an authenticated broker accessing `https://{subdomain}.flpilot.com/clients`
- **WHEN** the client list page renders
- **THEN** the system displays a table of clients with columns:
  - Client name
  - Email
  - Onboarding status (invited, in_progress, pending_approval, approved, rejected)
  - AUM
  - Number of deals
  - Last activity date

#### Scenario: Client list supports search

- **GIVEN** a broker viewing the client list with 50 clients
- **WHEN** they type "john" into the search input
- **THEN** the system filters the list to show only clients with "john" in name or email

#### Scenario: Client list supports status filter

- **GIVEN** a broker viewing the client list
- **WHEN** they select "Pending Approval" from the status filter dropdown
- **THEN** the system filters the list to show only clients with `onboardingStatus: "pending_approval"`

#### Scenario: Client list supports sorting

- **GIVEN** a broker viewing the client list
- **WHEN** they click the "AUM" column header
- **THEN** the system sorts the clients by AUM in descending order (highest to lowest)

#### Scenario: Broker drills down to client detail

- **GIVEN** a broker viewing the client list
- **WHEN** they click on a client name link
- **THEN** the system navigates to the client detail page at `/clients/{clientId}`

#### Scenario: Client list shows onboarding notifications

- **GIVEN** a broker with clients in "pending_approval" status
- **WHEN** they view the client list
- **THEN** the system displays a notification badge indicating the number of clients awaiting approval

---

### Requirement: Broker Client Onboarding Workspace

The system SHALL provide a broker-facilitated client onboarding flow where brokers can invite clients, configure listing filter constraints (valid ranges and whitelisted options), and approve clients before granting platform access.

#### Scenario: Broker starts client onboarding

- **GIVEN** an authenticated broker accessing `https://{subdomain}.flpilot.com/clients/onboard`
- **WHEN** they click "Onboard New Client"
- **THEN** the system displays the onboarding workspace with steps:
  - Invite client (enter client email)
  - Configure listing filter constraints
  - Review and submit

#### Scenario: Broker sends client invite

- **GIVEN** a broker at the client invite step
- **WHEN** they enter the client's email and click "Send Invite"
- **THEN** the system creates a `broker_clients` record with `onboardingStatus: "invited"`, links the client to the FAIRLEND default broker temporarily, generates a unique invite link, provisions a WorkOS organization for the client, and sends an email to the client with the invite link

#### Scenario: Broker configures listing filter constraints

- **GIVEN** a broker at the listing filters configuration step
- **WHEN** they set min/max LTV constraints, min/max loan amount constraints, min/max interest rate constraints, allowed property types, allowed locations, and allowed risk profiles
- **THEN** the system saves the constraint configuration in `broker_clients.filters.constraints`

#### Scenario: Broker sets default client filter values

- **GIVEN** a broker at the listing filters configuration step
- **WHEN** they set initial client-selected values for filters (within constraints)
- **THEN** the system saves the values in `broker_clients.filters.values` ensuring they comply with the constraints

#### Scenario: Filter configuration validates ranges

- **GIVEN** a broker setting filters with minLTV: 70 and maxLTV: 60
- **WHEN** they attempt to save the configuration
- **THEN** the system displays a validation error requiring constraint min values to be less than or equal to constraint max values

#### Scenario: Broker reviews onboarding before submission

- **GIVEN** a broker at the review step with completed invite and filter configuration
- **WHEN** they click "Review and Submit"
- **THEN** the system displays a summary showing:
  - Client email
  - Configured filter ranges
  - Risk profile
  - Return adjustment percentage

#### Scenario: Broker submits client for approval

- **GIVEN** a broker at the review step
- **WHEN** they click "Submit for Client Approval"
- **THEN** the system sets `onboardingStatus: "pending_approval"` and notifies the broker when the client completes their profile

#### Scenario: Broker approves client profile

- **GIVEN** a broker with a client in "pending_approval" status who has completed their profile
- **WHEN** the broker reviews the client's profile and clicks "Approve Client"
- **THEN** the system sets `onboardingStatus: "approved"`, assigns the `investor` role via WorkOS, updates `approvedAt` timestamp, and grants the client access to the platform with configured filters active

#### Scenario: Broker requests additional client information

- **GIVEN** a broker reviewing a client's profile during approval
- **WHEN** they click "Request Additional Information" and add a message
- **THEN** the system sends an in-app notification to the client and allows the client to submit the requested information

---

### Requirement: Broker Client Detail Page

The system SHALL provide a client detail page showing comprehensive information about a specific client, including profile, portfolio, filters, and activity history.

#### Scenario: Broker views client detail

- **GIVEN** an authenticated broker accessing `https://{subdomain}.flpilot.com/clients/{clientId}`
- **WHEN** the client detail page renders
- **THEN** the system displays:
  - Client profile header (name, email, onboarding date)
  - Portfolio summary (AUM, number of deals, average return)
  - Listing filter configuration
  - Activity timeline

#### Scenario: Client detail shows adjusted returns

- **GIVEN** a broker viewing a client's portfolio summary
- **WHEN** the portfolio section renders
- **THEN** the system displays returns as "base return minus broker adjustment" (e.g., "Average Return: 8.5% (adjusted from 9.0%)")

#### Scenario: Client detail shows active filters

- **GIVEN** a broker viewing a client's listing filter configuration
- **WHEN** the filters section renders
- **THEN** the system displays all configured filters as human-readable ranges and selections (e.g., "LTV: 50-70%, Loan Amount: $50k-$200k")

#### Scenario: Broker can modify client filters

- **GIVEN** a broker viewing client detail with configured filters
- **WHEN** they click "Edit Filters"
- **THEN** the system displays an edit form with current filter values pre-populated, allowing the broker to modify ranges and selections

#### Scenario: Filter modifications apply immediately

- **GIVEN** a broker modifying a client's listing filters
- **WHEN** they save the updated configuration
- **THEN** the system updates the `broker_clients.filters` field and the client immediately sees only listings matching the new filter criteria

#### Scenario: Client detail shows deal history

- **GIVEN** a broker viewing a client's activity timeline
- **WHEN** the timeline renders
- **THEN** the system displays a chronological list of deals the client has participated in, showing:
  - Deal name/listing
  - Investment amount
  - Date of completion
  - Return earned (adjusted)

---

### Requirement: Broker Portfolio Overview

The system SHALL provide a portfolio overview page showing aggregated performance data across all broker clients and deals.

#### Scenario: Broker views portfolio overview

- **GIVEN** an authenticated broker accessing `https://{subdomain}.flpilot.com/portfolio`
- **WHEN** the portfolio overview page renders
- **THEN** the system displays:
  - Aggregate AUM across all clients
  - Top-performing clients by return
  - Geographic distribution of deals
  - Average portfolio metrics (yield, LTV, term)

#### Scenario: Portfolio overview shows client breakdown

- **GIVEN** a broker viewing portfolio overview
- **WHEN** the client breakdown section renders
- **THEN** the system displays a list of clients sorted by AUM with individual performance metrics

#### Scenario: Portfolio overview shows deal distribution

- **GIVEN** a broker viewing portfolio overview
- **WHEN** the deal distribution section renders
- **THEN** the system displays charts showing:
  - Deals by property type
  - Deals by location (by province/state)
  - Deals by loan amount range

#### Scenario: Portfolio overview updates in real-time

- **GIVEN** a broker viewing portfolio overview
- **WHEN** a new deal completes with one of their clients
- **THEN** the system automatically recalculates and updates the displayed portfolio metrics

---

### Requirement: Broker Settings Page

The system SHALL provide a broker settings page allowing brokers to manage their profile, branding configuration, and account preferences.

#### Scenario: Broker views settings

- **GIVEN** an authenticated broker accessing `https://{subdomain}.flpilot.com/settings`
- **WHEN** the settings page renders
- **THEN** the system displays sections for:
  - Profile (broker name, contact information)
  - Branding (logo, colors, brand name)
  - Commission rates (read-only, managed by FairLend)
  - Account preferences

#### Scenario: Broker updates profile information

- **GIVEN** a broker at the profile settings section
- **WHEN** they update their name or contact information and save
- **THEN** the system updates the `brokers` table with the new information

#### Scenario: Broker views branding settings

- **GIVEN** a broker at the branding settings section
- **WHEN** the section renders
- **THEN** the system displays current logo, colors, and brand name with edit capability

#### Scenario: Broker commission rates are read-only

- **GIVEN** a broker at the commission rates section
- **WHEN** the section renders
- **THEN** the system displays commission rate and return adjustment percentage as read-only fields with a note that rates are managed by FairLend

#### Scenario: Broker manages account preferences

- **GIVEN** a broker at the account preferences section
- **WHEN** they modify preferences (e.g., email notifications, language) and save
- **THEN** the system updates their user preferences in the `users` table