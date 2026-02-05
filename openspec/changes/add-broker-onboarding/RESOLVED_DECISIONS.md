# Broker Onboarding - Resolved Design Decisions

This document captures all decisions made for open questions in the broker onboarding feature.

---

## Resolved Decisions Summary

| Question | Decision | Impact |
|----------|----------|--------|
| 1. Regulatory Jurisdictions | Start with Ontario, design for future expansion | Schema includes jurisdiction field, XState extensible for branching |
| 2. Broker Tiering | No tiers, per-broker configurable rates only | No tier field in schema, simple rate configuration |
| 3. Client Self-Service Limits | Clients can modify values within broker constraints | Split filters into constraints (broker) and values (client), validation layer |
| 4. Multi-Broker Clients | NEVER - one broker per client, FAIRLEND default, admin/broker can reassign | Client-broker assignment management, revoke and switch functions |
| 5. Commission Payment Timing | Record at deal closing (completion state), not deployment | Trigger on `completed` state transition |
| 6. Return Adjustment Calculation | Non-retroactive, rate in effect at deal completion time | Rate history table, historical rate lookup per deal |

---

## Detailed Decisions

### 1. Regulatory Jurisdictions ✅

**Decision**: Start with Ontario-only workflow, but design the system to support jurisdiction-specific flows in the future. Collect jurisdiction information during onboarding even if not acting on it yet.

**Implementation**:
- Add `jurisdiction` field to `onboarding_journeys.context.broker.companyInfo` (required, default "Ontario")
- Design XState machine with extensible state structure for future branching
- Store jurisdiction in `brokers` table for future workflow routing
- Keep schema and API flexible

**Future Extension Path**:
- Add jurisdiction-specific state guards (e.g., `broker.licensing_bc` vs `broker.licensing_on`)
- Jurisdiction field serves as routing key for state machine

---

### 2. Broker Tiering ✅

**Decision**: No broker tiering. Each broker has individually configurable commission rates and return adjustment rates. All brokers have the same capabilities.

**Implementation**:
- Single broker type in schema
- Per-broker configuration fields for rates
- No `tier` field needed
- All brokers have access to the same features

---

### 3. Client Self-Service Limits ✅

**Decision**: Clients CAN modify filters within the constraints defined by the broker. Brokers set "valid ranges" and "whitelisted options" for each filter parameter. Clients can choose any value within those bounds. Admins can override any filter configuration.

**Implementation Changes**:

**Schema Update**:
```typescript
filters: v.object({
  // Broker-provided constraints (read-only to client)
  constraints: v.object({
    minLTV: v.optional(v.number()),
    maxLTV: v.optional(v.number()),
    minLoanAmount: v.optional(v.number()),
    maxLoanAmount: v.optional(v.number()),
    minInterestRate: v.optional(v.number()),
    maxInterestRate: v.optional(v.number()),
    allowedPropertyTypes: v.optional(v.array(v.string())),
    allowedLocations: v.optional(v.array(v.string())),
    allowedRiskProfiles: v.optional(v.array(...)),
  }),
  // Client-selected values (within constraints)
  values: v.object({
    minLTV: v.optional(v.number()),
    maxLTV: v.optional(v.number()),
    // ... (same structure as constraints but for client choices)
  }),
})
```

**Validation Layer**:
- Validate client's `values.minLTV` >= broker's `constraints.minLTV`
- Validate client's selected property types are subset of `allowedPropertyTypes`
- Admins bypass all validation via audit-trail logging

**Example**:
- Broker sets: `constraints.maxLTV: 70`, `allowedLocations: ["Ontario", "Alberta"]`
- Client valid: `values.maxLTV: 65`, `values.locations: ["Ontario"]`
- Client invalid: `values.maxLTV: 75` (exceeds constraint), `values.locations: ["BC"]` (not allowed)
- Admin override: Can set `values.maxLTV: 80` despite broker constraint

---

### 4. Client-Broker Relationship Management ✅

**Decision**: One client has exactly one broker at a time. NEVER multi-broker clients. Admins can switch a client's broker. Brokers can revoke a client from their space. Clients without a broker CANNOT operate on the platform. New users are created under the default FAIRLEND broker.

**Implementation**:
- Special FAIRLEND broker record exists (pre-provisioned, minimal rates)
- `broker_clients.brokerId` is required (never null)
- Create functions:
  - `switchClientBroker(clientId, newBrokerId)`: Admin-only, moves client between brokers
  - `revokeClient(clientId)`: Broker-only, moves client to FAIRLEND broker
- Middleware check: All client operations verify broker assignment

**Scenarios**:
- User signup → auto-assigned to FAIRLEND broker
- Admin switches client → moves immediately to new broker
- Broker revokes client → client moved to FAIRLEND broker
- Broker account deleted → all clients move to FAIRLEND broker
- Client without broker → cannot access platform until reassigned

---

### 5. Commission Payment Timing ✅

**Decision**: Record commission in Formance ledger when a deal closes (when deal reaches `completed` state). Not at deal creation or capital deployment.

**Implementation**:
- Trigger: In `convex/deals.ts`, when state transitions to `completed` via `CONFIRM_TRANSFER` event
- Call: Broker commission recording function
- Numscript: Post commission amount to broker's commission account
- Metadata: Include `dealId`, `clientId`, `brokerId`, `capitalDeployed`, `commissionRate`, `earnedAt` (deal completion timestamp)

**Why Change**: Previously assumed recording at capital deployment. Now correct to record at deal closing when value is realized.

---

### 6. Return Adjustment Calculation with Historical Rates ✅

**Decision**: Return adjustments are NOT retroactive. Rate in effect at deal completion time is the rate that applies to that deal forever. Historical deals use the rate in effect at their completion time, even if the broker's rate changes later.

**Implementation**:

**New Table**:
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

**Rate Lookup Logic**:
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

**Example Use Case**:
- Jan 1: Broker sets return adjustment to 0.1%
- Feb 1: Broker increases to 0.2%
- Deal A (closes Jan 15) → Adjustment = 0.1% (permanent)
- Deal B (closes Feb 10) → Adjustment = 0.2% (permanent)
- Both deals display their respective rates, even if rate changes again later

---

## Schema Changes Summary

### New Tables
1. `brokers` - Approved broker configuration (subdomain, branding, rates, status)
2. `broker_clients` - Client-broker relationships with constraints and values
3. `broker_rate_history` - Rate change history for non-retroactive calculations

### Extended Tables
1. `onboarding_journeys` - Added `broker` context branch with jurisdiction field

### Key Indexes
- `brokers`: by_user, by_subdomain, by_workos_org, by_status
- `broker_clients`: by_broker, by_client, by_status, by_broker_status
- `broker_rate_history`: by_broker, by_broker_type, by_effective

---

## Spec Updates

### Modified Files
1. `design.md` - Added resolved decisions section with implementation details
2. `broker-onboarding/spec.md` - Added jurisdiction field scenarios
3. `broker-portal/spec.md` - Updated filter constraint scenarios
4. `broker-client-workflow/spec.md` - Added constraint/value split scenarios
5. `broker-commissions/spec.md` - Updated commission timing, rate history scenarios

### New Files
1. `broker-client-workflow/spec-additions.md` - Client assignment, FAIRLEND broker, admin override scenarios
2. `broker-commissions/spec-additions.md` - Rate history, non-retroactive calculation scenarios

---

## Implementation Notes

### Priority Order
1. **Database Schema** - Add all new tables and extend onboarding_journeys
2. **Rate History** - Create broker_rate_history table before commission tracking
3. **FAIRLEND Broker** - Provision default broker record during migration
4. **Filter Validation** - Implement constraints vs values validation before client UI
5. **Rate Lookup** - Implement historical rate query before return display

### Critical Invariants
- Every client has exactly one broker (NEVER null)
- FairLend broker exists and is the permanent fallback
- Commission recorded only at deal completion
- Historical deals use the rate in effect at their completion time
- Client filter values always validated against broker constraints

---

## Validation Status

✅ All resolutions validated against OpenSpec strict mode
✅ All updated specs pass validation
✅ Design document updated with implementation details
✅ No breaking changes to existing investor onboarding flow