# Deal Management Workflow - Pilot Program

**Status:** Draft  
**Created:** 2025-11-07  
**Author:** System  
**Type:** Feature Addition

## Overview

Implement a Kanban-based deal management workflow to track mortgage purchase deals from lock request approval through final ownership transfer. This bridges the gap between lock request approval and ownership reassignment for the pilot program where legal processes happen off-platform.

## Problem Statement

Currently, when an admin approves a lock request, the listing is locked but there's no workflow to manage the subsequent deal closing process. For the pilot program, document signing and legal processes happen off-platform, but we need:
- Visual deal pipeline management
- State tracking and auditability
- Admin tools to progress deals through stages
- Ownership transfer on deal completion
- In-app alerts for deal events

## Solution Design

### State Machine Architecture

**Technology:** XState v5 (stored in Convex backend)

**States:**
1. `locked` - Initial state after deal creation
2. `pending_lawyer` - Awaiting lawyer confirmation of representation
3. `pending_docs` - Awaiting document signing
4. `pending_transfer` - Awaiting fund transfer
5. `pending_verification` - Awaiting fund transfer verification
6. `completed` - Deal closed, ownership transferred
7. `cancelled` - Deal cancelled, reverted
8. `archived` - Completed/cancelled deals moved here for audit

**Transition Rules:**
- Forward transitions: Strictly linear (locked → lawyer → docs → transfer → verification → completed)
- Backward transitions: Allowed (any state can move backwards)
- Cancellation: Allowed from any state (except archived)
- Completion: Triggers ownership transfer mutation
- Archival: Manual admin action after completion/cancellation

**State Context (stored per deal):**
```typescript
{
  dealId: Id<"deals">,
  lockRequestId: Id<"lock_requests">,
  listingId: Id<"listings">,
  mortgageId: Id<"mortgages">,
  investorId: Id<"users"),
  currentState: string,
  purchasePercentage: number, // Always 100 for now
  dealValue: number,
  createdAt: number,
  updatedAt: number,
}
```

### Database Schema

**New Tables:**

#### `deals` Table
```typescript
deals: defineTable({
  lockRequestId: v.id("lock_requests"),
  listingId: v.id("listings"),
  mortgageId: v.id("mortgages"),
  investorId: v.id("users"),
  
  // XState machine state (serialized JSON)
  stateMachineState: v.string(),
  currentState: v.union(
    v.literal("locked"),
    v.literal("pending_lawyer"),
    v.literal("pending_docs"),
    v.literal("pending_transfer"),
    v.literal("pending_verification"),
    v.literal("completed"),
    v.literal("cancelled"),
    v.literal("archived")
  ),
  
  // Deal financial details
  purchasePercentage: v.number(), // 100 for pilot
  dealValue: v.number(), // Calculated at creation
  
  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
  completedAt: v.optional(v.number()),
  archivedAt: v.optional(v.number()),
  
  // Audit trail
  stateHistory: v.array(v.object({
    fromState: v.string(),
    toState: v.string(),
    timestamp: v.number(),
    triggeredBy: v.id("users"),
    notes: v.optional(v.string()),
  })),
  
  // Future: validation tracking
  validationChecks: v.optional(v.object({
    lawyerConfirmed: v.boolean(),
    docsComplete: v.boolean(),
    fundsReceived: v.boolean(),
    fundsVerified: v.boolean(),
  })),
})
  .index("by_lock_request", ["lockRequestId"])
  .index("by_listing", ["listingId"])
  .index("by_mortgage", ["mortgageId"])
  .index("by_investor", ["investorId"])
  .index("by_current_state", ["currentState"])
  .index("by_created_at", ["createdAt"])
```

#### `alerts` Table (new - for in-app notifications)
```typescript
alerts: defineTable({
  userId: v.id("users"), // Who should see this alert
  type: v.union(
    v.literal("deal_created"),
    v.literal("deal_state_changed"),
    v.literal("deal_completed"),
    v.literal("deal_cancelled"),
    v.literal("deal_stuck"), // Future: for time-based alerts
  ),
  severity: v.union(
    v.literal("info"),
    v.literal("warning"),
    v.literal("error"),
  ),
  title: v.string(),
  message: v.string(),
  
  // Alert metadata
  relatedDealId: v.optional(v.id("deals")),
  relatedListingId: v.optional(v.id("listings")),
  
  // State tracking
  read: v.boolean(),
  createdAt: v.number(),
  readAt: v.optional(v.number()),
})
  .index("by_user_read", ["userId", "read"])
  .index("by_user_created_at", ["userId", "createdAt"])
  .index("by_deal", ["relatedDealId"])
```

### Backend API (Convex)

#### Deal Management Functions

**`convex/deals.ts`:**

```typescript
// Queries
export const getDeal(args: { dealId }) // Get single deal with full history
export const getAllDeals() // Admin: get all active deals for Kanban
export const getDealsByState(args: { state }) // Filter deals by current state
export const getArchivedDeals() // Get completed/cancelled deals
export const getDealMetrics() // Dashboard widgets data

// Mutations
export const createDeal(args: { lockRequestId }) // Create deal from approved lock request
export const transitionDealState(args: { dealId, toState, notes? }) // Move deal between states
export const cancelDeal(args: { dealId, reason }) // Cancel deal, unlock listing
export const completeDeal(args: { dealId }) // Final state: transfer ownership
export const archiveDeal(args: { dealId }) // Move to archive

// Internal helpers
internalMutation validateStateTransition() // Stub for future validation
internalMutation createDealAlert() // Create in-app alert
```

**`convex/alerts.ts`:**

```typescript
// Queries
export const getUserAlerts() // Get current user's unread alerts
export const getAllAlerts() // Admin: get all alerts with filters

// Mutations
export const markAlertAsRead(args: { alertId })
export const markAllAlertsAsRead()
export const deleteAlert(args: { alertId })
```

#### XState Machine Definition

**`convex/dealStateMachine.ts`:**

```typescript
import { setup, assign } from 'xstate';
import type { Id } from './_generated/dataModel';

export type DealContext = {
  dealId: Id<"deals">;
  lockRequestId: Id<"lock_requests">;
  listingId: Id<"listings">;
  mortgageId: Id<"mortgages">;
  investorId: Id<"users">;
  purchasePercentage: number;
  dealValue: number;
  currentState: string;
  stateHistory: Array<{
    fromState: string;
    toState: string;
    timestamp: number;
    triggeredBy: Id<"users">;
    notes?: string;
  }>;
};

export type DealEvent = 
  | { type: 'CONFIRM_LAWYER'; adminId: Id<"users">; notes?: string }
  | { type: 'COMPLETE_DOCS'; adminId: Id<"users">; notes?: string }
  | { type: 'RECEIVE_FUNDS'; adminId: Id<"users">; notes?: string }
  | { type: 'VERIFY_FUNDS'; adminId: Id<"users">; notes?: string }
  | { type: 'COMPLETE_DEAL'; adminId: Id<"users">; notes?: string }
  | { type: 'GO_BACK'; adminId: Id<"users">; toState: string; notes?: string }
  | { type: 'CANCEL'; adminId: Id<"users">; reason: string };

export const dealMachine = setup({
  types: {
    context: {} as DealContext,
    events: {} as DealEvent,
  },
  guards: {
    canTransitionForward: () => true, // Stub for future validation
    canTransitionBackward: () => true, // Always allowed
  },
  actions: {
    logTransition: assign(({ context, event }) => ({
      stateHistory: [
        ...context.stateHistory,
        {
          fromState: context.currentState,
          toState: 'pending_lawyer', // Updated per transition
          timestamp: Date.now(),
          triggeredBy: 'adminId' in event ? event.adminId : context.investorId,
          notes: 'notes' in event ? event.notes : undefined,
        },
      ],
    })),
  },
}).createMachine({
  id: 'dealWorkflow',
  initial: 'locked',
  context: ({ input }) => input,
  states: {
    locked: {
      on: {
        CONFIRM_LAWYER: { target: 'pending_lawyer', actions: 'logTransition' },
        CANCEL: { target: 'cancelled', actions: 'logTransition' },
      },
    },
    pending_lawyer: {
      on: {
        COMPLETE_DOCS: { target: 'pending_docs', actions: 'logTransition' },
        GO_BACK: { target: 'locked', actions: 'logTransition', guard: 'canTransitionBackward' },
        CANCEL: { target: 'cancelled', actions: 'logTransition' },
      },
    },
    pending_docs: {
      on: {
        RECEIVE_FUNDS: { target: 'pending_transfer', actions: 'logTransition' },
        GO_BACK: { target: 'pending_lawyer', actions: 'logTransition', guard: 'canTransitionBackward' },
        CANCEL: { target: 'cancelled', actions: 'logTransition' },
      },
    },
    pending_transfer: {
      on: {
        VERIFY_FUNDS: { target: 'pending_verification', actions: 'logTransition' },
        GO_BACK: { target: 'pending_docs', actions: 'logTransition', guard: 'canTransitionBackward' },
        CANCEL: { target: 'cancelled', actions: 'logTransition' },
      },
    },
    pending_verification: {
      on: {
        COMPLETE_DEAL: { target: 'completed', actions: 'logTransition' },
        GO_BACK: { target: 'pending_transfer', actions: 'logTransition', guard: 'canTransitionBackward' },
        CANCEL: { target: 'cancelled', actions: 'logTransition' },
      },
    },
    completed: {
      type: 'final',
      entry: 'triggerOwnershipTransfer', // Action that calls ownership mutation
    },
    cancelled: {
      type: 'final',
      entry: 'unlockListing', // Action that unlocks the listing
    },
    archived: {
      type: 'final',
    },
  },
});

// Export types for frontend consumption
export type DealState = typeof dealMachine.initialState;
export type DealStateValue = DealState['value'];
```

### Frontend Components

#### Admin Dashboard Layout

**`/dashboard/admin/deals/page.tsx`** - Kanban Board
**`/dashboard/admin/deals/[id]/page.tsx`** - Deal Detail
**`/dashboard/admin/deals/archived/page.tsx`** - Archived Deals
**`/dashboard/admin/deals/components/`** - Reusable components

#### Dashboard Widgets

**Location:** `/dashboard/admin/page.tsx` (admin dashboard home)

**Widgets:**
1. **Active Deals Overview**
   - Total active deals
   - Deals by state (pie chart)
   - Average days per stage

2. **Recent Deal Activity**
   - Last 5 state transitions
   - Quick links to deals

3. **Deals Requiring Attention**
   - Stuck deals (future)
   - Deals in each stage count

#### Kanban Board Component

**Adaptation of `components/ui/kanban-board.tsx`:**
- Map deal states to columns
- Deal cards show: property address, investor name, deal value, days in state
- Drag & drop triggers `transitionDealState` mutation
- Click card → navigate to detail page
- Filter by investor, date range
- Real-time updates via Convex reactivity

### Integration Points

#### Lock Request Approval Flow

**Before:**
```typescript
Admin approves lock request → Listing locked → End
```

**After:**
```typescript
Admin approves lock request → Listing locked
Admin sees "Create Deal" button on approved request
Admin clicks "Create Deal" → Deal created in "locked" state
Admin navigates to Deals Kanban → Progresses deal through stages
Deal reaches "completed" → Admin clicks "Transfer Ownership"
Ownership transferred → Deal can be archived
```

**Changes to `convex/lockRequests.ts`:**
- `getApprovedLockRequestsWithDetails()` - Add check for existing deal
- No automatic deal creation on approval

**New Component:** `components/admin/CreateDealButton.tsx`
- Shows on approved lock requests without existing deals
- Calls `createDeal` mutation
- Redirects to deal detail page

### Validation & Guards (Future)

**Stubbed Functions:**
```typescript
// convex/deals.ts
async function validateLawyerConfirmation(dealId: Id<"deals">) {
  // TODO: Check lawyer credentials, confirmation email, etc.
  return true; // Pass-through for now
}

async function validateDocumentCompletion(dealId: Id<"deals">) {
  // TODO: Check document uploads, signatures, etc.
  return true; // Pass-through for now
}

async function validateFundTransfer(dealId: Id<"deals">) {
  // TODO: Integration with payment processor
  return true; // Pass-through for now
}

async function validateFundVerification(dealId: Id<"deals">) {
  // TODO: Verify funds cleared, match deal value
  return true; // Pass-through for now
}
```

**XState Guards:**
```typescript
guards: {
  canConfirmLawyer: async ({ context }) => {
    return await validateLawyerConfirmation(context.dealId);
  },
  canCompleteDocs: async ({ context }) => {
    return await validateDocumentCompletion(context.dealId);
  },
  // ... etc
}
```

### Ownership Transfer Integration

**Flow:**
1. Deal reaches `completed` state
2. Admin views deal detail page
3. "Transfer Ownership" button visible (only in completed state)
4. Admin clicks button → confirmation modal
5. Calls `completeDeal` mutation:
   - Calls `createOwnership` from `ownership.ts`
   - Transfers 100% ownership from FairLend to investor
   - Updates deal `completedAt` timestamp
   - Creates alert for investor
   - Updates listing status (mark as sold?)

**Future:** Support partial ownership transfer (configurable percentage)

### Alert System

**Alert Triggers:**
- Deal created → Alert to admins
- State transition → Alert to admins (and investor if investor-facing)
- Deal completed → Alert to investor
- Deal cancelled → Alert to investor and admins
- Deal stuck (future) → Alert to admins

**Alert UI:**
- Bell icon in navbar with unread count badge
- Dropdown panel showing recent alerts
- "View All Alerts" link to dedicated page
- Mark as read on click
- Severity-based styling (info/warning/error)

### Type Safety Strategy

**Problem:** XState machine on backend, but frontend needs type-safe state handling

**Solution:**
1. Define machine in `convex/dealStateMachine.ts`
2. Export type definitions:
   ```typescript
   export type { DealContext, DealEvent, DealStateValue };
   ```
3. Create shared types in `lib/types/dealTypes.ts`:
   ```typescript
   import type { DealContext, DealEvent, DealStateValue } from '@/convex/dealStateMachine';
   export { DealContext, DealEvent, DealStateValue };
   
   // Frontend-specific display types
   export const DEAL_STATE_LABELS: Record<DealStateValue, string> = {
     locked: 'Locked',
     pending_lawyer: 'Pending Lawyer Confirmation',
     pending_docs: 'Pending Document Signing',
     pending_transfer: 'Pending Fund Transfer',
     pending_verification: 'Pending Verification',
     completed: 'Completed',
     cancelled: 'Cancelled',
     archived: 'Archived',
   };
   
   export const DEAL_STATE_COLORS: Record<DealStateValue, string> = {
     locked: '#8B7355',
     pending_lawyer: '#CD853F',
     pending_docs: '#DAA520',
     pending_transfer: '#6B8E23',
     pending_verification: '#556B2F',
     completed: '#228B22',
     cancelled: '#8B4513',
     archived: '#696969',
   };
   ```
4. Frontend components import from shared types:
   ```typescript
   import type { DealContext } from '@/lib/types/dealTypes';
   import { DEAL_STATE_LABELS } from '@/lib/types/dealTypes';
   ```

### Testing Strategy

**Unit Tests:**
- XState machine state transitions
- Validation guards (when implemented)
- Ownership transfer logic

**Integration Tests:**
- Full deal lifecycle: create → progress → complete → archive
- Cancellation flow: create → cancel → verify listing unlocked
- Backward transitions: progress → move back → verify audit trail

**E2E Tests (Playwright):**
- Admin creates deal from approved lock request
- Admin drags deal through Kanban board
- Admin transfers ownership on completion
- Verify alerts appear correctly

### Migration & Rollout

**Phase 1: Schema & Backend**
1. Add `deals` and `alerts` tables to schema
2. Implement XState machine and Convex functions
3. Add "Create Deal" button to lock requests

**Phase 2: Kanban UI**
1. Create deals admin page with Kanban board
2. Wire up drag-and-drop state transitions
3. Add deal detail page

**Phase 3: Dashboard Widgets**
1. Add deal metrics widgets to admin dashboard
2. Implement alert system UI

**Phase 4: Ownership Integration**
1. Connect "Transfer Ownership" to ownership mutations
2. Test full lifecycle with real data
3. Add archival functionality

**Phase 5: Polish & Alerts**
1. Refine UI/UX based on feedback
2. Add comprehensive alerts
3. Performance optimization

## Success Metrics

- [ ] Admin can create deals from approved lock requests
- [ ] Deals progress through all 6 states via Kanban
- [ ] Backward transitions work correctly
- [ ] Cancellation reverts listing and creates alert
- [ ] Ownership transfer completes successfully
- [ ] Audit trail captures all state changes
- [ ] Dashboard widgets display accurate metrics
- [ ] Alerts appear for all deal events
- [ ] No data loss or consistency issues

## Future Enhancements

1. **Validation Integration**
   - Lawyer credential verification API
   - Document upload and signature tracking
   - Payment processor integration
   - Automated fund verification

2. **Time-Based Alerts**
   - Deals stuck in state > X days
   - Automated reminders to admins
   - Escalation workflows

3. **Partial Ownership Transfers**
   - Configurable purchase percentage per deal
   - Multiple investors per mortgage
   - Complex ownership structures

4. **Investor Portal**
   - Investors view their deal progress
   - Upload documents
   - Receive status updates

5. **Analytics & Reporting**
   - Deal velocity metrics
   - Bottleneck analysis
   - Historical trends

## Questions & Decisions

- [x] State machine location: Backend (Convex)
- [x] Deal creation: Manual "Create Deal" button
- [x] Ownership transfer: Explicit admin action
- [x] Audit trail: Rich (Option B)
- [x] Cancellation: Supported, reverts everything
- [x] Notifications: In-app alerts
- [x] Validation: Stubbed for future
- [x] Dashboard placement: Separate section

