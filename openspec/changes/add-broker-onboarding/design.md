# Design: Broker Onboarding and Portal Management

## Context

The platform currently implements investor onboarding as an XState-driven state machine with Convex persistence and admin approval workflows. Broker functionality exists only as stubs in the machine and hardcoded constants. We need to extend this architecture to support full broker onboarding with compliance flows, vanity subdomains, branding, client management, and Formance-led commission tracking.

### Existing Patterns to Leverage

1. **Onboarding Journey Infrastructure**: `onboarding_journeys` table with XState serialization, persona-specific contexts, status workflow (draft → awaiting_admin → approved/rejected), and admin review queue.
2. **State Machine Pattern**: XState machine in `components/onboarding/machine.ts` with linear states, context persistence, rollback guard support, and event-driven transitions.
3. **Subdomain Routing**: Existing `lib/subdomains.ts` with dynamic subdomain parsing (`getSubdomain`), root domain inference, and localhost development support.
4. **WorkOS Integration**: Auto-provisioning via webhooks, organizations table, memberships table, role-based access control via `convex/lib/server.ts` authorized functions.
5. **Formance Ledger Integration**: Ownership ledger in `convex/lib/ownershipLedger.ts` with numscript execution, account patterns, idempotency keys, and metadata logging.
6. **Admin Dashboard Pattern**: Queue-based approval interfaces (`openspec/changes/introduce-investor-onboarding-flow`), role-based access control, and notification/alerts.

## Goals

- Enable resumable, auditable broker onboarding with explicit state transitions and rollback support before final approval
- Provide vanity subdomain routing for broker and client portals with dynamic branding
- Provision WorkOS organizations for brokers and their clients with role-based isolation
- Support broker-facilitated client onboarding with configurable listing filters
- Track broker commissions and client return adjustments via Formance ledger
- Deliver admin interfaces for broker review, management, and stats
- Provide broker dashboards for client management and portfolio oversight

## Non-Goals

- Full compliance automation (architecture supports future integration once requirements are defined)
- Money movement orchestration in Formance (ledger-only recording of commissions and adjustments)
- Broker marketplace discovery or self-serve marketing pages
- Custom broker domain (SSL, DNS management beyond vanity subdomains)
- Advanced broker analytics beyond initial KPIs

## Decisions

### 1. Extend `onboarding_journeys` Table (Not Separate `brokers` Table)

**Decision**: Broker onboarding state and draft data will be stored in the existing `onboarding_journeys` table with a new `broker` branch in the context, rather than creating a separate `broker_applications` table.

**Rationale**:
- Leverages existing infrastructure for state machine persistence, admin queue indexing, and status workflows
- Provides consistent migration path for user persona transitions (member → broker)
- Aligns with existing `investor` context pattern
- Reduces schema duplication and maintenance burden

**Broker Context Structure**:
```typescript
context: v.object({
  broker: v.optional(v.object({
    // Company information
    companyInfo: v.optional(v.object({
      companyName: v.string(),
      entityType: v.union(v.literal("sole_proprietorship"), v.literal("partnership"), v.literal("corporation")),
      registrationNumber: v.string(),
      registeredAddress: v.object({
        street: v.string(),
        city: v.string(),
        state: v.string(),
        zip: v.string(),
        country: v.string(),
      }),
      businessPhone: v.string(),
      businessEmail: v.string(),
    })),
    // Licensing information
    licensing: v.optional(v.object({
      licenseType: v.union(v.literal("mortgage_broker"), v.literal("investment_broker"), v.literal("mortgage_dealer")),
      licenseNumber: v.string(),
      issuer: v.string(),
      issuedDate: v.string(), // ISO date
      expiryDate: v.string(), // ISO date
      jurisdictions: v.array(v.string()), // e.g., ["Ontario", "British Columbia"]
    })),
    // Representative information
    representatives: v.optional(v.array(v.object({
      firstName: v.string(),
      lastName: v.string(),
      role: v.string(),
      email: v.string(),
      phone: v.string(),
      hasAuthority: v.boolean(),
    }))),
    // Documents
    documents: v.optional(v.array(v.object({
      storageId: v.id("_storage"),
      label: v.string(),
      type: v.string(), // e.g., "license", "insurance", "agreement"
      uploadedAt: v.string(), // ISO timestamp
    }))),
    // Timeline of admin requests and broker responses
    adminRequestTimeline: v.optional(v.array(v.object({
      id: v.string(), // UUID
      type: v.union(v.literal("info_request"), v.literal("document_request"), v.literal("clarification")),
      requestedBy: v.id("users"),
      requestedAt: v.string(), // ISO timestamp
      message: v.string(),
      resolved: v.boolean(),
      resolvedAt: v.optional(v.string()), // ISO timestamp
      response: v.optional(v.string()),
      responseDocuments: v.optional(v.array(v.object({
        storageId: v.id("_storage"),
        label: v.string(),
      }))),
    }))),
    // Proposed subdomain (subject to availability check)
    proposedSubdomain: v.optional(v.string()),
  })),
})
```

**Alternatives Considered**:
- Separate `broker_applications` table: Would duplicate state machine logic, require separate admin queue, and break consistency with investor pattern. Rejected due to maintenance burden.

### 2. Dedicated `brokers` Table for Approved Broker Configuration

**Decision**: Create a separate `brokers` table to store approved broker configuration (subdomain, branding, commission rates, status) separate from onboarding journey data.

**Rationale**:
- Separates transient onboarding state from permanent broker configuration
- Enables efficient queries for routing (subdomain lookup) and stats aggregation
- Allows broker configuration updates without touching onboarding journey data
- Supports broker lifecycle management (suspend, revoke, re-activate)

**Schema**:
```typescript
brokers: defineTable({
  // References
  userId: v.id("users"), // Primary broker user
  workosOrgId: v.string(), // Broker's WorkOS organization
  // Subdomain configuration
  subdomain: v.string(), // e.g., "acmebrokers"
  // Branding configuration
  branding: v.object({
    logoStorageId: v.optional(v.id("_storage")),
    primaryColor: v.optional(v.string()), // hex color
    secondaryColor: v.optional(v.string()), // hex color
    brandName: v.optional(v.string()), // override default company name
  }),
  // Commission configuration
  commission: v.object({
    ratePercentage: v.number(), // e.g., 2.5 for 2.5%
    returnAdjustmentPercentage: v.number(), // e.g., 0.5 for 0.5% reduction
  }),
  // Status
  status: v.union(
    v.literal("active"),
    v.literal("suspended"),
    v.literal("revoked")
  ),
  // Timestamps
  approvedAt: v.string(), // ISO timestamp
  createdAt: v.string(),
  updatedAt: v.string(),
})
  .index("by_user", ["userId"])
  .index("by_subdomain", ["subdomain"])
  .index("by_workos_org", ["workosOrgId"])
  .index("by_status", ["status"])
```

**Alternatives Considered**:
- Store branding in `onboarding_journeys`: Would require complex queries for routing and would conflate transient and persistent data. Rejected.

### 3. Subdomain Routing Extension (Not Custom Routing Logic)

**Decision**: Extend existing `lib/subdomains.ts` and `proxy.ts` routing to handle broker subdomains, using the existing `getSubdomain` function with broker lookup in Convex.

**Rationale**:
- Reuses battle-tested subdomain parsing logic
- Avoids duplicated routing edge case handling (localhost, www prefix, custom domains)
- Consistent with current architecture patterns

**Implementation**:

1. Middleware (`proxy.ts`) extended subdomain routing:
```typescript
// Parse subdomain from incoming request
const { subdomain } = getSubdomain(host);

if (subdomain && subdomain !== 'www') {
  // Check if it's a broker subdomain
  const broker = await fetchBrokerBySubdomain(subdomain);

  if (broker) {
    // Route to broker portal or client portal
    // Apply branding context to all requests under this subdomain
    const branding = broker.branding;
    // Inject into Next.js context for access in components
  }
}
```

2. Broker subdomain uniqueness validation:
```typescript
// Convex query to check subdomain availability
export const isSubdomainAvailable = query({
  args: { subdomain: v.string() },
  handler: async (ctx, args) => {
    const broker = await ctx.db
      .query("brokers")
      .withIndex("by_subdomain", (q) => q.eq("subdomain", args.subdomain))
      .unique();
    return !broker; // true if available
  },
});
```

**Alternatives Considered**:
- Custom routing with Vercel middleware rewrite rules: Would duplicate logic and dev/prod environment complexity. Rejected.

### 4. WorkOS Organization Strategy: Broker Org + Per-Client Orgs

**Decision**: Each approved broker gets a dedicated WorkOS organization for their team members, and each client managed by the broker also gets a separate WorkOS organization for login/RBAC isolation.

**Rationale**:
- Maintains existing WorkOS integration patterns (orgs already support multi-tenancy)
- Enables brokers to invite team members with role-based access control
- Isolates client accounts from broker org (security boundary)
- Leverages existing `organization_memberships` table for role assignment

**Implementation**:

1. **Broker Org Creation** (on approval):
```typescript
// Convex internal action called during broker approval
export async function provisionBrokerOrganization(actionCtx, args: {
  brokerUserId: Id<"users">;
  organizationName: string;
}) {
  // Call WorkOS API to create organization
  const org = await workos.organizations.create({
    name: args.organizationName,
    domains: [], // Broker adds domains later
  });

  // Assign broker user as admin
  await workos.organizationMemberships.create({
    organizationId: org.id,
    userId: args.brokerUserWorkosId,
    role: {
      slug: "broker_admin",
    },
  });

  // Store org reference in brokers table
  await actionCtx.runMutation(internal.brokers.updateBrokerOrgId, {
    userId: args.brokerUserId,
    workosOrgId: org.id,
  });
}
```

2. **Client Org Creation** (during client onboarding):
```typescript
export async function provisionClientOrganization(actionCtx, args: {
  clientWorkosUserId: string;
  brokerOrgId: string;
  brokerBrandName: string;
}) {
  // Client gets their own organization for isolation
  const org = await workos.organizations.create({
    name: `${args.clientName} (Managed by ${args.brokerBrandName})`,
    domains: [],
  });

  // Link to broker via metadata for audit trail
  await workos.organizations.update(org.id, {
    metadata: {
      managedByBrokerOrgId: args.brokerOrgId,
    },
  });

  return org.id;
}
```

**Alternatives Considered**:
- Clients in broker's organization: Would break RBAC isolation, allow brokers to see client data directly, violate security principles. Rejected.

### 5. Broker-Facilitated Client Onboarding (Not Self-Serve Investor Flow)

**Decision**: Broker-managed client onboarding where broker initiates, configures listing filters, and approves the client before granting access. Clients receive a WorkOS org and are linked to their broker via relationship table.

**Rationale**:
- Brokers need control over who sees which listings (filter configuration)
- Ensures clients match broker's suitability criteria
- Enables broker oversight of all client activity
- Aligns with compliance requirements for broker-managed relationships

**Data Model**:

```typescript
broker_clients: defineTable({
  // References
  brokerId: v.id("brokers"),
  clientId: v.id("users"), // The client user
  workosOrgId: v.string(), // Client's WorkOS organization
  // Listing filter configuration (set by broker)
  filters: v.object({
    minLTV: v.optional(v.number()), // Minimum loan-to-value
    maxLTV: v.optional(v.number()), // Maximum loan-to-value
    minLoanAmount: v.optional(v.number()), // Minimum investment
    maxLoanAmount: v.optional(v.number()), // Maximum investment
    minInterestRate: v.optional(v.number()), // Minimum yield
    maxInterestRate: v.optional(v.number()), // Maximum yield
    propertyTypes: v.optional(v.array(v.string())), // e.g., ["residential", "commercial"]
    locations: v.optional(v.array(v.string())), // e.g., ["Ontario", "Alberta"]
    riskProfile: v.union(v.literal("conservative"), v.literal("balanced"), v.literal("growth")),
  }),
  // Return adjustment (applied to client's displayed returns)
  returnAdjustmentPercentage: v.number(),
  // Onboarding workflow
  onboardingStatus: v.union(
    v.literal("invited"),
    v.literal("in_progress"),
    v.literal("pending_approval"),
    v.literal("approved"),
    v.literal("rejected")
  ),
  // Timestamps
  invitedAt: v.string(),
  approvedAt: v.optional(v.string()),
  createdAt: v.string(),
  updatedAt: v.string(),
})
  .index("by_broker", ["brokerId"])
  .index("by_client", ["clientId"])
  .index("by_status", ["onboardingStatus"])
  .index("by_broker_status", ["brokerId", "onboardingStatus"])
```

**Workflow**:
1. Broker creates client onboarding invite with initial filter config
2. System generates invite link, provisions WorkOS client org
3. Client visits link, completes profile information
4. Broker reviews and approves client (or requests additional info)
5. System assigns `investor` role via WorkOS, grants access with filter constraints active
6. Client sees only listings matching their broker-configured filters

**Alternatives Considered**:
- Self-serve investor onboarding: Would bypass broker control, violate suitability requirements. Rejected.

### 6. Formance Ledger Integration: Commission Accounts Per Broker

**Decision**: Track broker commissions and client return adjustments using Formance ledger with dedicated accounts per broker, following existing ownership ledger patterns in `convex/lib/ownershipLedger.ts`.

**Rationale**:
- Leverages existing ledger infrastructure (accounts, numscript execution, idempotency)
- Provides audit trail for commission calculations
- Enables future reconciliation and reporting
- Maintains separation between ownership and commission tracking

**Account Structure**:

```
broker:{brokerId}:commission   - Broker commission pool (CAD/2)
client:{clientId}:adjustment   - Client return adjustments (CAD/2)
```

**Commission Tracking Numscript**:

```typescript
// Record broker commission when client invests capital
const recordBrokerCommission = async (ctx, {
  brokerId,
  clientId,
  capitalDeployed,
  commissionRate,
  reference, // Idempotency key
}) => {
  const commissionAmount = capitalDeployed * (commissionRate / 100);

  const script = `
vars {
  currency $currency
  account $broker_commission
  account $client_adjustment
}

send [COMMISSION ${commissionAmount}] (
  source = @fairlend:commission_pool
  destination = $broker_commission
)
`.trim();

  await ctx.runAction(api.ledger.executeNumscript, {
    ledgerName: DEFAULT_LEDGER,
    script,
    variables: {
      currency: "CAD/2",
      broker_commission: `broker:${brokerId}:commission`,
    },
    reference,
    metadata: {
      type: "broker_commission",
      brokerId,
      clientId,
      capitalDeployed,
      commissionRate,
    },
  });
};
```

**Return Adjustment Display**:

```typescript
// Calculate client-adjusted return display
// Returns are displayed as: (baseReturn - brokerAdjustmentRate)
export function calculateAdjustedReturn(
  baseReturnPercentage: number,
  brokerAdjustmentPercentage: number
): number {
  return baseReturnPercentage - brokerAdjustmentPercentage;
}
```

**Alternatives Considered**:
- Pure database tracking without ledger: Would lack audit trail, make reconciliation difficult, break existing integration patterns. Rejected.

### 7. Timeline-Based Admin Review Interface (Not Email-Based Communication)

**Decision**: Admin requests and broker responses are stored as structured timeline entries in `onboarding_journeys.context.broker.adminRequestTimeline`, with a chronologically sorted UI showing requests, responses, and document uploads.

**Rationale**:
- Enables persistent audit trail of all communications
- Avoids dependency on external email systems
- Supports rollback to earlier states by preserving request history
- Allows admins to view complete application timeline at a glance

**Implementation**:

```typescript
// Admin sends follow-up request
export const sendAdminFollowUp = mutation({
  args: {
    journeyId: v.id("onboarding_journeys"),
    message: v.string(),
    requestType: v.union(v.literal("info_request"), v.literal("document_request")),
  },
  handler: async (ctx, args) => {
    const journey = await ctx.db.get(args.journeyId);
    if (!journey || journey.persona !== "broker") {
      throw new Error("Invalid journey");
    }

    const requestId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Add to timeline
    const newEntry = {
      id: requestId,
      type: args.requestType,
      requestedBy: await getCurrentUserId(ctx),
      requestedAt: now,
      message: args.message,
      resolved: false,
    };

    const updatedTimeline = [
      ...(journey.context.broker?.adminRequestTimeline ?? []),
      newEntry,
    ];

    await ctx.db.patch(args.journeyId, {
      context: {
        ...journey.context,
        broker: {
          ...journey.context.broker,
          adminRequestTimeline: updatedTimeline,
        },
      },
      lastTouchedAt: now,
    });
  },
});

// Broker responds to request
export const respondToAdminRequest = mutation({
  args: {
    journeyId: v.id("onboarding_journeys"),
    requestId: v.string(),
    response: v.string(),
    documentIds: v.array(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const journey = await ctx.db.get(args.journeyId);
    if (!journey || journey.persona !== "broker") {
      throw new Error("Invalid journey");
    }

    const timeline = journey.context.broker?.adminRequestTimeline ?? [];
    const entryIndex = timeline.findIndex((e) => e.id === args.requestId);

    if (entryIndex === -1) {
      throw new Error("Request not found");
    }

    const now = new Date().toISOString();

    // Update entry
    timeline[entryIndex] = {
      ...timeline[entryIndex],
      resolved: true,
      resolvedAt: now,
      response: args.response,
      responseDocuments: args.documentIds.map((id) => ({
        storageId: id,
        label: `Response document`,
      })),
    };

    await ctx.db.patch(args.journeyId, {
      context: {
        ...journey.context,
        broker: {
          ...journey.context.broker,
          adminRequestTimeline: timeline,
        },
      },
      lastTouchedAt: now,
    });
  },
});
```

**Alternatives Considered**:
- Email-based communication: Would create synchronization issues between email and Convex state, lose audit trail visibility. Rejected.

### 8. Page-Based Navigation (Not Hierarchical Menu Structure)

**Decision**: Implement a Notion/Twenty-style navigation model where each entity (broker, client, deal, listing) is a page with a URL path, and pages contain links to related entity pages (e.g., broker page links to client pages, client page links to their portfolio pages).

**Rationale**:
- Flexible and intuitive navigation pattern
- Enables contextual browsing through related entities
- Aligns with modern SaaS navigation trends
- Supports deep linking to specific entities

**URL Structure**:

```
// Broker portal (subdomain)
https://acmebroker.flpilot.com/dashboard                    - Broker home
https://acmebroker.flpilot.com/clients                        - Client list
https://acmebroker.flpilot.com/clients/{clientId}            - Client detail page
https://acmebroker.flpilot.com/clients/{clientId}/portfolio   - Client portfolio

// Client portal (same subdomain, branded by broker)
https://acmebroker.flpilot.com/portfolio                      - Client portfolio
https://acmebroker.flpilot.com/portfolio/listings/{listingId} - Listing detail
```

**Implementation**:

```typescript
// Client component to render entity links
export const EntityLink = ({ entityType, entityId, name }: EntityLinkProps) => {
  const router = useRouter();
  const { subdomain } = useSubdomain();

  const handleClick = () => {
    router.push(`/${entityType}s/${entityId}`);
  };

  return (
    <Button
      variant="link"
      onClick={handleClick}
      className="text-blue-600 hover:underline"
    >
      {name}
    </Button>
  );
};

// Example: Broker page showing clients
export const BrokerClientsList = ({ brokerId }: { brokerId: string }) => {
  const clients = useAuthenticatedQuery(api.brokers.listClients, { brokerId });

  return (
    <div>
      <h3>Clients ({clients?.length ?? 0})</h3>
      <table>
        {clients?.map((client) => (
          <tr key={client.id}>
            <td>
              <EntityLink
                entityType="client"
                entityId={client.id}
                name={client.name}
              />
            </td>
            <td>${client.aum.toLocaleString()}</td>
          </tr>
        ))}
      </table>
    </div>
  );
};
```

**Alternatives Considered**:
- Hierarchical menu structure: Would limit navigation flexibility, make deep linking harder. Rejected.

## Risks / Trade-offs

### Risk 1: Compliance Requirements May Change Significantly

**Impact**: Broker onboarding state machine may need to add new steps, validation rules, or conditional branches based on jurisdiction, broker type, or regulatory requirements.

**Mitigation**:
- XState machine is designed for easy modification—add states, transitions, and guards without major refactoring
- Separation of concern: state machine logic in frontend, persistence in Convex, validation in both layers
- Rollback mechanism (`ROLLBACK_TO_STATE` event) already supports sending brokers back to earlier steps
- Admin review timeline preserves full history even after rollback

**Trade-off**: Simplicity for initial scope vs. flexibility for future requirements. Accepting moderate complexity now for agility later.

### Risk 2: Subdomain Routing Edge Cases

**Impact**: Subdomain conflicts, DNS propagation delays, or edge cases (e.g., `www.broker.subdomain.com`) could cause routing failures or security issues.

**Mitigation**:
- Existing `getSubdomain` handles common edge cases (`www`, localhost, port numbers)
- Subdomain uniqueness validation in Convex before approval
- Fallback to main domain if broker subdomain is misconfigured
- Middleware logging of routing decisions for debugging

**Trade-off**: Subdomain complexity vs. clean branded URLs. Accepting routing complexity for better branding.

### Risk 3: Broker Branding Consistency Across Pages

**Impact**: Branding configuration (logo, colors) might not apply consistently to all pages under broker subdomain, leading to jarring user experience.

**Mitigation**:
- Store branding in Next.js context from middleware, accessible in all components
- Create a `BrandingProvider` component to wrap broker client subroutes
- Use CSS variables for colors to ensure consistent application
- Implement preview mode during broker configuration

**Trade-off**: Branding customization overhead vs. brand differentiation value. Accepting development effort for improved broker satisfaction.

### Risk 4: Formance Ledger Integration Complexity

**Impact**: Commission tracking numscript failures, idempotency issues, or ledger state drift could cause incorrect commission calculation records.

**Mitigation**:
- Follow existing ownership ledger patterns (`convex/lib/ownershipLedger.ts`) for consistency
- Always use idempotency keys (`reference`) to prevent duplicate entries
- Log all ledger operations with metadata for audit trail
- Implement reconciliation queries to validate commission totals

**Trade-off**: Ledger complexity vs. audit trail and reconciliation value. Accepting integration complexity for financial accuracy requirements.

## Screen and Component Manifest

This section defines all screens and components required for the broker onboarding feature, organized by function area. Each screen follows a page-based navigation model (Notion/Twenty style) where entities link to related entity pages.

### Broker Onboarding Screens

#### S1. Broker Application Landing
**Purpose**: Entry point from invite link or self-serve broker sign-up.

**URL**: `/broker-onboarding` (main domain) or `/onboarding` (broker subdomain)

**Components**:
- `BrokerInviteCodeEntry` - Input field for invite code entry
- `BrokerSignUpCTA` - Sign-up call-to-action button
- `BrokerOnboardingOverview` - Overview of onboarding steps (stepper visualization)
- `BrokerContactSupportLink` - Link to support contact form

---

#### S2. Broker Application Workspace
**Purpose**: Main broker onboarding flow page with state machine-driven stepper.

**URL**: `/broker-onboarding/application` (journey-specific via Convex ID)

**Components**:
- `BrokerOnboardingStepper` - Stepper showing current state (intro → company_info → licensing → representatives → documents → review → admin)
- `BrokerCompanyInfoForm` - Form for company information (name, entity type, registration number, address, jurisdiction, phone, email)
- `BrokerLicensingForm` - Form for license information (type, number, issuer, dates, jurisdictions)
- `BrokerRepresentativesForm` - Array form for representatives with add/remove functionality
- `BrokerDocumentsUpload` - Document upload panel with labels and progress indicators
- `BrokerSaveResumeControls` - Save draft and continue/resume buttons
- `BrokerSubmissionSummary` - Summary panel showing all collected data before submission

---

#### S3. Broker Application Timeline
**Purpose**: Timeline of application updates, admin requests, and broker responses.

**URL**: `/broker-onboarding/timeline` (embedded in S5 as component)

**Components**:
- `BrokerTimelineCardList` - Chronological list of timeline entries (requests, responses, file uploads)
- `BrokerAdminRequestActions` - Admin interface to send new requests
- `BrokerResponseActions` - Broker interface to respond to requests
- `BrokerTimelineStatusBadge` - Status indicators (pending, resolved, new)
- `BrokerDocumentPreview` - Preview of uploaded documents in timeline

---

#### S4. Admin Broker Applications Queue
**Purpose**: Admin queue for reviewing all pending broker applications.

**URL**: `/dashboard/admin/brokers/applications`

**Components**:
- `BrokerApplicationsTable` - Filterable table showing status, submitted date, broker name, current step
- `BrokerQueueFilterDropdowns` - Filters for status ( draft, awaiting_admin, approved, rejected)
- `BrokerQueueSearchInput` - Search by broker name or email
- `BrokerBulkStatusActions` - Bulk approve/reject actions (future enhancement)
- `BrokerApplicationCard` - Summary card for queue (also used in table rows)
- `BrokerQueuePagination` - Pagination controls

---

#### S5. Admin Broker Application Detail (Broker Page)
**Purpose**: Admin review page for a single broker application with full visibility.

**URL**: `/dashboard/admin/brokers/applications/{journeyId}`

**Components**:
- `BrokerProfileHeader` - Header showing broker name, entity type, status, submitted date
- `BrokerApplicationDataViewer` - Full application data viewer tabbed by section
- `BrokerTimelinePanel` - Timeline panel (S3 embedded)
- `BrokerApproveButton` - Approve action button with confirmation dialog
- `BrokerRejectButton` - Reject action button with reason input dialog
- `BrokerRollbackDialog` - Rollback mechanism with step selection
- `BrokerSendFollowUpDialog` - Send follow-up request with message input

---

### Broker Portal Screens

#### S6. Broker Portal Dashboard
**Purpose**: Broker home dashboard showing KPIs and quick actions.

**URL**: `https://{subdomain}.flpilot.com/dashboard`

**Components**:
- `BrokerKPICards` - KPI cards showing AUM, client count, deal volume, commissions earned
- `BrokerQuickActions` - Quick action buttons (View Clients, Onboard Client, Portfolio, Settings)
- `BrokerRecentActivity` - List of recent activities (new client, completed deal, commission earned)
- `BrokerAnnouncementsPanel` - Announcements and alerts panel
- `BrokerDashboardLayout` - Dashboard layout with sidebar navigation

---

#### S7. Broker Clients List
**Purpose**: Manage broker's clients with search, filter, and drill-down capabilities.

**URL**: `https://{subdomain}.flpilot.com/clients`

**Components**:
- `BrokerClientListTable` - Table with columns (name, email, status, AUM, deals, last activity)
- `BrokerClientListSearch` - Search input for name/email
- `BrokerClientListStatusFilter` - Dropdown filter for onboarding status
- `BrokerClientListSortControls` - Sort controls for AUM, date, name
- `BrokerClientListPagination` - Pagination controls
- `BrokerClientListEmptyState` - Empty state when no clients
- `BrokerClientListNotificationBadge` - Badge showing pending approval count

---

#### S8. Broker Client Onboarding Workspace
**Purpose**: Broker-facilitated client onboarding flow.

**URL**: `https://{subdomain}.flpilot.com/clients/onboard`

**Components**:
- `BrokerClientOnboardingStepper` - Stepper showing steps (invite → filters → review → submit)
- `BrokerClientInviteForm` - Form to enter client email and generate invite link
- `BrokerFilterConfigurationForm` - Form to set constraint ranges and whitelisted options
- `BrokerFilterConstraintInputs` - Input fields for min/max LTV, loan amount, interest rate
- `BrokerFilterOptionSelectors` - Selectors for property types, locations, risk profiles
- `BrokerClientFilterValidation` - Validation messages for filter constraints
- `BrokerClientOnboardingReview` - Review summary showing client email, filters, return adjustment
- `BrokerClientSubmitButton` - Submit for broker approval button

---

#### S9. Client Detail Page
**Purpose**: Comprehensive client information view accessible from broker dashboard.

**URL**: `https://{subdomain}.flpilot.com/clients/{clientId}`

**Components**:
- `ClientProfileHeader` - Header showing client name, email, onboarding date, status
- `ClientPortfolioSummary` - Portfolio summary with AUM, deals count, average return
- `ClientAdjustedReturnsDisplay` - Returns display showing base return minus broker adjustment
- `ClientFilterConfigurationDisplay` - Display of active listing filters
- `ClientFilterEditForm` - Form to modify client filters (broker-only)
- `ClientActivityTimeline` - Timeline of client activities and broker interactions
- `ClientDealHistory` - Chronological list of client deals with investment amounts and returns
- `ClientRevokeButton` - Button to revoke client access (moves to default broker)

---

### Admin Broker Management Screens

#### S10. Admin Brokers Management
**Purpose**: Admin management view of all approved brokers.

**URL**: `/dashboard/admin/brokers`

**Components**:
- `AdminBrokersTable` - Table showing broker name, subdomain, status, AUM, client count, deal volume
- `AdminBrokerStatusFilter` - Filter by status (active, suspended, revoked)
- `AdminBrokerSearch` - Search by broker name or subdomain
- `AdminBrokerSuspendButton` - Suspend broker button
- `AdminBrokerRevokeButton` - Revoke broker button with client reassignment dialog
- `AdminBrokerStatsOverview` - Summary KPIs across all brokers
- `AdminBrokerLink` - Link to broker detail page (S5)

---

#### S11. Broker Branding & Subdomain Settings
**Purpose**: Broker portal configuration (broker settings page).

**URL**: `https://{subdomain}.flpilot.com/settings/branding`

**Components**:
- `BrokerSubdomainDisplay` - Read-only subdomain display (approved brokers)
- `BrokerLogoUploader` - Logo upload with preview
- `BrokerColorPickers` - Primary and secondary color pickers
- `BrokerBrandNameInput` - Brand name override input
- `BrokerBrandingPreview` - Live preview panel showing how branding looks
- `BrokerProfileForm` - Form to update broker name and contact information
- `BrokerCommissionRatesDisplay` - Read-only display of commission rates
- `BrokerAccountPreferencesForm` - Form to manage email notifications and other preferences

---

### Client Portal Screens (Broker Subdomain)

#### S12. Client Onboarding Portal
**Purpose**: Client-facing onboarding flow after accepting broker invitation.

**URL**: `https://{subdomain}.flpilot.com/onboarding?token={inviteToken}`

**Components**:
- `ClientOnboardingIntro` - Welcome screen with broker branding
- `ClientProfileForm` - Form for client personal information and identity verification
- `ClientDocumentUpload` - Document upload for identity verification
- `ClientReviewSummary` - Review showing profile info and broker-configured filters
- `ClientReturnAdjustmentDisplay` - Display showing broker adjustment explanation
- `ClientBrokerBrandedHeader` - Header with broker logo and colors
- `ClientSubmitForApprovalButton` - Submit for broker approval button

---

#### S13. Client Portfolio Portal
**Purpose**: Client portfolio view with adjusted returns and broker branding.

**URL**: `https://{subdomain}.flpilot.com/portfolio`

**Components**:
- `ClientBrokerBrandedLayout` - Branded layout with broker logo and colors
- `ClientPortfolioSummary` - Summary of invested capital, active deals, adjusted returns
- `ClientDealList` - List of client deals with investment amounts and adjusted returns
- `ClientReturnCalculationTooltip` - Tooltip explaining return adjustment
- `ClientFilterVisibilityDisplay` - Display showing broker constraints and client selected values
- `ClientListingFilterForm` - Form for clients to modify their filter values (within constraints)
- `ClientCommunicationTimeline` - Timeline of broker-client communications

---

### Component Reusability Notes

- `BrokerTimelineCardList` and `ClientCommunicationTimeline` share similar structure for displaying chronological events
- `FilterConfigurationForm` is shared between broker client onboarding (S8) and client portfolio (S13) with different access modes (read-write vs read-only)
- `BrandedLayout` components apply broker branding consistently across broker and client portals
- Page-based navigation uses `EntityLink` pattern to link between broker, client, and deal pages

## Migration Plan

No data migration required for initial implementation (no existing broker data).

### Step 1: Schema Migration
```bash
# Extend onboarding_journeys table (Convex handles schema evolution)
# Create brokers table
# Create broker_clients table
# Create indexes
```

### Step 2: Convex Functions Implementation
- Add `convex/brokers/onboarding.ts` for broker journey functions
- Add `convex/brokers/management.ts` for broker configuration
- Add `convex/brokers/clients.ts` for client management
- Add `convex/brokers/commissions.ts` for Formance integration

### Step 3: State Machine Extension
- Extend `components/onboarding/machine.ts` with broker flow states
- Add broker-specific context validation

### Step 4: Routing and Branding
- Extend `proxy.ts` for subdomain routing
- Create `BrandingContext` provider
- Add branded layout components

### Step 5: Frontend Implementation
- Create broker portal pages (`app/(auth)/dashboard/broker/`)
- Create admin broker management pages (`app/(auth)/dashboard/admin/brokers/`)
- Implement client onboarding workflow UI

### Step 6: Integration Testing
- Test broker onboarding full flow (submit → admin review → approve)
- Test subdomain routing and branding application
- Test client onboarding and filter application
- Test Formance commission tracking
- Test admin timeline interface

### Step 7: Rollback Plan
- If issues arise, set feature flag `BROKER_ONBOARDING_ENABLED=false` to disable
- Existing investor onboarding flow unaffected (separate persona)
- No breaking changes to database schema (additive changes only)

## Open Questions - RESOLVED

**All open questions have been resolved and incorporated into the design below.**

---

## Resolved Design Decisions

### 1. Regulatory Jurisdictions

**DECISION**: Start with Ontario-only workflow, but design the system to support jurisdiction-specific flows in the future. Collect jurisdiction information during onboarding even if not acting on it yet.

**Implementation**:
- Add `jurisdiction` field to `onboarding_journeys.context.broker.companyInfo` (required field, default "Ontario" for initial scope)
- Design XState machine with extensible state structure to support future jurisdiction branching
- Store jurisdiction in `brokers` table for future workflow routing
- Keep schema and API flexible to add jurisdiction-specific validation rules without major refactoring

**Future Extension Path**:
- When adding new jurisdiction (e.g., British Columbia), add jurisdiction-specific state guards
- Example: `broker.licensing_bc` state with different requirements than `broker.licensing_on`
- Jurisdiction field serves as routing key for state machine

---

### 2. Broker Tiering

**DECISION**: No broker tiering. Each broker has individually configurable commission rates and return adjustment rates. All brokers have the same capabilities.

**Implementation**:
- Single broker type in schema
- Commission rate and return adjustment rate are per-broker configuration fields
- No `tier` field needed in `brokers` table
- All brokers have access to same features and capabilities

**Why**: Simplicity for initial scope avoids unnecessary complexity. Business requirements don't indicate tiered capabilities needed.

---

### 3. Client Self-Service Limits

**DECISION**: Clients CAN modify filters within the constraints defined by the broker. Brokers set "valid ranges" and "whitelisted options" for each filter parameter. Clients can choose any value within those bounds. Admins can override any filter configuration.

**Implementation**:
- Update `broker_clients.filters` schema to include both "broker-provided constraints" and "client-selected values":

```typescript
filters: v.object({
  // Broker-provided constraints (set by broker, read-only to client)
  constraints: v.object({
    minLTV: v.optional(v.number()),
    maxLTV: v.optional(v.number()),
    minLoanAmount: v.optional(v.number()),
    maxLoanAmount: v.optional(v.number()),
    minInterestRate: v.optional(v.number()),
    maxInterestRate: v.optional(v.number()),
    allowedPropertyTypes: v.optional(v.array(v.string())),
    allowedLocations: v.optional(v.array(v.string())),
    allowedRiskProfiles: v.optional(v.array(v.union(v.literal("conservative"), v.literal("balanced"), v.literal("growth")))),
  }),
  // Client-selected values (within constraints)
  values: v.object({
    minLTV: v.optional(v.number()),
    maxLTV: v.optional(v.number()),
    minLoanAmount: v.optional(v.number()),
    maxLoanAmount: v.optional(v.number()),
    minInterestRate: v.optional(v.number()),
    maxInterestRate: v.optional(v.number()),
    propertyTypes: v.array(v.string()),
    locations: v.array(v.string()),
    riskProfile: v.union(v.literal("conservative"), v.literal("balanced"), v.literal("growth")),
  }),
}),
```

- Client filter validation: When client saves filter changes, system validates:
  - Client's `minLTV` must be >= broker's `constraints.minLTV`
  - Client's `maxLTV` must be <= broker's `constraints.maxLTV`
  - Client's selected property types must be subset of broker's `allowedPropertyTypes`
  - Same validation for other fields

- Admin override: Admin users can bypass validation and set any values

**Example**:
- Broker sets: `constraints.maxLTV: 70`, `allowedLocations: ["Ontario", "Alberta"]`
- Client can choose: `values.maxLTV: 65` (valid), `values.locations: ["Ontario"]` (valid)
- Client cannot choose: `values.maxLTV: 75` (invalid - exceeds constraint), `values.locations: ["BC"]` (invalid - not allowed)
- Admin can override and set `values.maxLTV: 80` despite broker constraint

---

### 4. Client-Broker Relationship Management

**DECISION**: One client has exactly one broker at a time. NEVER multi-broker clients. Admins can switch a client's broker. Brokers can revoke a client from their space. Clients without a broker CANNOT operate on the platform. New users are created under the default FAIRLEND broker.

**Implementation**:
- `brokers` table includes a special record for the default FAIRLEND broker
- `broker_clients.brokerId` is a required field (no null)
- Create Convex functions:
  - `switchClientBroker` (admin-only): Moves client from one broker to another:
    - Updates `brokerClients.brokerId`
    - Logs audit trail for compliance
    - Notifies both old and new broker
  - `revokeClient` (broker-only): Removes client from broker:
    - Moves client to FAIRLEND broker (never leave client without broker)
    - Logs audit trail
    - Notifies client and admin
- Middleware check: All client operations verify client has an active broker assignment

**Scenarios**:
- `switchClientBroker(clientId, newBrokerId)`: Client moves from broker A to broker B immediately
- `revokeClient(clientId)`: Broker removes client → client reassigned to FAIRLEND broker
- Client deletion: If broker account is deleted, all clients move to FAIRLEND broker

**Why**: Simplicity for compliance, clear audit trail, prevents data fragmentation, ensures clients always have broker oversight

---

### 5. Commission Payment Timing

**DECISION**: Record commission in Formance ledger when a deal closes (when deal reaches `completed` state). Commission is earned and recorded at that point, not earlier.

**Implementation**:
- Trigger: In `convex/deals.ts`, when state transitions to `completed` via `CONFIRM_TRANSFER` event
- Call: Broker commission recording function
- Numscript: Post commission amount to broker's commission account in Formance
- Metadata: Include `dealId`, `clientId`, `brokerId`, `capitalDeployed`, `commissionRate`, `earnedAt` (deal completion timestamp)

**Changed from previous assumption**: Previously assumed recording at capital deployment time. Now correct to record at deal closing.

**Audit trail**: All commissions are timestamped with deal completion date for accurate reporting

---

### 6. Return Adjustment Calculation with Historical Rates

**DECISION**: Return adjustments are NOT retroactive. Rate in effect at deal completion time is the rate that applies to that deal forever. If broker rate changes partway through the month, deals closed before the rate change use the old rate, deals closed after use the new rate.

**Implementation**:
- Create `broker_rate_history` table to track rate changes over time:

```typescript
broker_rate_history: defineTable({
  brokerId: v.id("brokers"),
  type: v.union(v.literal("commission"), v.literal("return_adjustment")),
  oldRate: v.number(),
  newRate: v.number(),
  effectiveAt: v.string(), // ISO timestamp when new rate took effect
  changedBy: v.id("users"), // Admin who made the change
  approvedAt: v.string(),
})
  .index("by_broker", ["brokerId"])
  .index("by_broker_type", ["brokerId", "type"])
  .index("by_effective", ["effectiveAt"])
```

- When displaying client returns for a deal, calculate adjustment based on rate at deal completion time:
  1. Find deal's `completedAt` timestamp
  2. Query `broker_rate_history` for the broker's most recent adjustment rate BEFORE `completedAt`
  3. Use that rate for return calculation

**Example**:
- Broker sets return adjustment to 0.1% on January 1, 2026
- Broker increases to 0.2% on February 1, 2026
- Deal A closes on January 15 → adjustment = 0.1%
- Deal B closes on February 10 → adjustment = 0.2%
- Both deals permanently use their respective rates, even if rate changes again later

**Implementation queries**:
```typescript
// Get adjustment rate for a specific deal
export async function getAdjustmentRateForDeal(ctx, {
  brokerId,
  dealCompletedAt,
}): Promise<number> {
  // Find most recent adjustment rate BEFORE deal completion
  const rateEntry = await ctx.db
    .query("broker_rate_history")
    .withIndex("by_broker_type", (q) =>
      q.eq("brokerId", brokerId)
       .eq("type", "return_adjustment")
    )
    .filter((q) => q.lt(q.field("effectiveAt"), dealCompletedAt))
    .order("desc")
    .first();

  // If no history, use current broker rate
  if (!rateEntry) {
    const broker = await ctx.db.get(brokerId);
    return broker.commission.returnAdjustmentPercentage;
  }

  return rateEntry.newRate;
}
```