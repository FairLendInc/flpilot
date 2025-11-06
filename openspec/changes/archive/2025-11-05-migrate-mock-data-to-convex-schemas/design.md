# Database Schema Design

## Overview

This document outlines the architectural decisions and technical reasoning behind the Convex database schema design for the mortgage marketplace platform.

## Design Philosophy

### YAGNI (You Ain't Gonna Need It)
- Start with minimal implementation
- Add complexity only when requirements are clear
- Avoid premature optimization
- Build extensible foundation without implementing unused features

### Loose Coupling
- Separate tables for distinct concerns
- Avoid tight coupling between unrelated domains
- Enable independent evolution of features
- Prepare for future requirements without blocking current work

## Schema Architecture

### Core Entity: Mortgages

**Decision**: Embed property data directly in mortgages table (denormalized approach)

**Rationale**:
- Properties and mortgages have 1:1 relationship in current requirements
- Simplifies queries (single table lookup)
- Reduces join complexity for common operations
- Property data is specific to the loan context
- Can refactor to normalized properties table later if multi-mortgage properties become common

**Trade-offs**:
- ❌ Property history across multiple mortgages requires separate tracking
- ✅ Simpler schema and faster queries for single-mortgage use cases
- ✅ Property data contextualized to specific loan terms
- ✅ Easier to understand and maintain initially

### Borrower Separation

**Decision**: Separate `borrowers` table with no link to `users` table

**Rationale**:
- Borrowers can exist without platform accounts (tracking only)
- Borrowers and investors are distinct user types with different access needs
- Rotessa customer records need stable identifiers independent of auth system
- Loose coupling enables different authentication patterns for borrowers if needed later

**Implementation**:
```typescript
borrowers: {
  name: string
  email: string
  rotessaCustomerId: string
}

// Future: Could add optional userId field when borrower creates account
```

### Ownership Model

**Decision**: Cap table structure (`mortgage_ownership`) with union type owner references

**Rationale**:
- **Extensibility**: Prepared for fractional ownership without implementing distribution logic
- **Flexibility**: Supports both individual users and institutional owners ("fairlend")
- **Simplicity**: Each entry is `{ mortgageId, ownerId, ownershipPercentage }`
- **Future-proof**: Adding fractional ownership requires no schema changes

**Owner Type Union**:
```typescript
ownerId: string  // Either userId from users table OR "fairlend" literal

// Validation in application layer:
// - "fairlend" = institutional ownership by FairLend
// - Valid userId = individual investor ownership
// - Sum of ownershipPercentage per mortgage = 100%
```

**Trade-offs**:
- ❌ Type safety relies on application validation (string could be invalid)
- ✅ No additional tables or complex joins required now
- ✅ Clear migration path to separate institutions table later
- ✅ Supports immediate development needs

**Future Evolution**:
```typescript
// Phase 2: Add institutions table
institutions: {
  name: string
  type: "lender" | "investor" | "servicer"
}

// ownerId can reference institutions._id instead of "fairlend" string
```

### Listing State Management

**Decision**: Separate `listings` table for marketplace visibility and locks

**Rationale**:
- Not all mortgages are listed for sale (separates concerns)
- Listing state (visible, locked) changes independently of mortgage data
- Lock timing and user tracking are marketplace-specific concerns
- Clear separation between asset (mortgage) and marketplace (listing)

**State Transitions**:
```
Not Listed → Listed (visible=true, locked=false)
Listed → Locked (user starts purchase, locked=true, lockedBy=userId)
Locked → Listed (deal canceled, locked=false, lockedBy=null)
Locked → Deal Closed (ownership transferred, listing deleted or archived)
```

### Payment Data Structure

**Decision**: Payments table as front-end view, Rotessa is source of truth

**Rationale**:
- Rotessa handles actual payment processing
- Convex stores presentational data for UI performance
- Rotessa IDs enable reconciliation and sync
- Interest-only payments simplify data model

**Fields**:
```typescript
payments: {
  mortgageId: string       // Link to mortgage
  amount: number           // Payment amount
  processDate: string      // When payment processed
  status: "pending" | "cleared" | "failed"
  paymentId: string        // Rotessa payment identifier
  customerId: string       // Rotessa customer identifier
  transactionScheduleId: string  // Rotessa schedule reference
}
```

**Omissions** (YAGNI):
- No payment type (all are interest-only)
- No escrow tracking
- No principal breakdown
- No payment method details (Rotessa handles)

### Appraisal Comparables

**Decision**: Separate table linked to mortgage, not listing

**Rationale**:
- Comparables are part of mortgage appraisal (loan underwriting)
- Appraisal belongs to mortgage regardless of listing status
- Multiple comparables per mortgage (one-to-many)
- Comparable data is stable and doesn't change with listing state

### Document Storage

**Decision**: Use Convex storage IDs for documents

**Rationale**:
- Convex file storage provides built-in CDN and access control
- Storage IDs are strongly typed and validated by Convex
- Avoid external file hosting dependencies
- Simplifies permission management (Convex auth integration)

**Migration Required**:
- Convert mock URL strings to actual file uploads
- Store files in Convex storage during seed data creation

## Indexes

### Mortgages Table
```typescript
.index("by_borrower", ["borrowerId"])
.index("by_status", ["status"])
.index("by_maturity_date", ["maturityDate"])
```

**Rationale**:
- Borrower lookups for payment/loan history
- Filter by status (active, renewed, closed)
- Sort by maturity date for timeline views

### Listings Table
```typescript
.index("by_mortgage", ["mortgageId"])
.index("by_locked_status", ["locked"])
.index("by_locked_user", ["lockedBy"])
```

**Rationale**:
- Single listing per mortgage (unique constraint via index)
- Filter available vs locked listings
- User's locked listings dashboard

### Mortgage Ownership
```typescript
.index("by_mortgage", ["mortgageId"])
.index("by_owner", ["ownerId"])
```

**Rationale**:
- Cap table for specific mortgage
- User's ownership portfolio

### Payments
```typescript
.index("by_mortgage", ["mortgageId"])
.index("by_status", ["status"])
.index("by_process_date", ["processDate"])
```

**Rationale**:
- Payment history for mortgage
- Filter pending/failed payments
- Chronological sorting

## Type Safety

### Convex Schema Validators

**Decision**: Use Convex `v` validators for all fields

**Benefits**:
- Runtime validation on writes
- Auto-generated TypeScript types
- Editor autocomplete and IntelliSense
- Compile-time type checking
- GraphQL-like developer experience

**Example**:
```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

mortgages: defineTable({
  borrowerId: v.id("borrowers"),
  loanAmount: v.number(),
  interestRate: v.number(),
  // ... more fields
}).index("by_borrower", ["borrowerId"])
```

### Generated Types

Convex auto-generates:
- `Doc<"mortgages">` - Full document type
- `Id<"mortgages">` - Strongly-typed ID
- Type-safe query/mutation parameters

## Future Extensibility

### Prepared for Fractional Ownership

**Current Implementation**:
- Cap table structure exists
- Most mortgages have single 100% owner
- Application validates sum(ownershipPercentage) = 100%

**Future Addition** (no schema changes needed):
- Multiple ownership records per mortgage
- UI for ownership distribution
- Transfer/sale of fractional shares
- Dividend distribution logic

### Prepared for Multiple Institutions

**Current Implementation**:
- `ownerId: "fairlend"` string literal

**Future Migration Path**:
```typescript
// Add institutions table
institutions: defineTable({
  name: v.string(),
  type: v.union(
    v.literal("lender"),
    v.literal("investor"),
    v.literal("servicer")
  ),
})

// Update mortgage_ownership
// Change ownerId validation to:
// - v.id("users") OR
// - v.id("institutions")
```

### Prepared for Deal Workflow

**Current Implementation**:
- Listings table tracks lock state
- Lock indicates deal in progress

**Future Addition**:
```typescript
deals: defineTable({
  listingId: v.id("listings"),
  buyerId: v.id("users"),
  status: v.union(
    v.literal("locked"),
    v.literal("pending_lawyer_confirmation"),
    v.literal("pending_doc_signing"),
    v.literal("pending_fund_transfer"),
    v.literal("pending_fund_transfer_confirmation"),
    v.literal("deal_closed")
  ),
  events: v.array(v.object({
    timestamp: v.number(),
    type: v.string(),
    actor: v.id("users"),
    data: v.any()
  }))
})
```

## Performance Considerations

### Denormalization Trade-offs
- **Embedded property data**: Faster reads, potential duplicate data if property has multiple mortgages
- **Acceptable**: Current requirements suggest 1:1 property-mortgage relationship
- **Migration path**: Extract properties table if needed, join on propertyId

### Query Patterns
- **List all available listings**: Single query on listings table with `locked = false`
- **Mortgage detail with payments**: Two queries (mortgage, then payments by mortgageId)
- **User portfolio**: Query mortgage_ownership by userId, then fetch mortgage details
- **Convex reactivity**: Real-time updates as data changes

### Indexing Strategy
- Index on foreign keys (mortgageId, borrowerId, ownerId)
- Index on filter fields (status, locked, processDate)
- No full-text search indexes needed yet (small dataset)

## Migration from Mock Data

### Phase 1: Schema Definition
1. Define all tables in `convex/schema.ts`
2. Run type generation: `npx convex dev`
3. Validate generated types compile

### Phase 2: Function Implementation
1. Create query/mutation functions per table
2. Implement basic CRUD operations
3. Add index-based queries

### Phase 3: Seed Data
1. Create seed script using mock data generators
2. Upload documents to Convex storage
3. Populate all tables with relationships

### Phase 4: Frontend Migration
1. Replace mock imports with Convex queries
2. Update components to use generated types
3. Test reactive updates
4. Remove mock data dependencies from production code

### Phase 5: Storybook Migration
1. Create test fixtures for Storybook
2. Update stories to use fixture data
3. Remove mock generators from stories
4. Optional: Use Convex test backend for stories
