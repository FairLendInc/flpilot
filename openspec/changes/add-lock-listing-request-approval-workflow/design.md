# Lock Listing Request Approval Workflow - Design

## Context

This design implements an approval workflow for marketplace listing locks before payment integration. Investors submit requests, admins review and approve/reject them. The system must handle concurrent requests, race conditions, and maintain data integrity.

**Background:**
- Current: Direct lock via `lockListing` mutation (no oversight)
- Problem: No admin control, no payment gate, no approval process
- Solution: Approval workflow as interim solution before PayPal integration

**Constraints:**
- Convex reactive queries for real-time updates
- WorkOS RBAC for permission checks
- Atomic transactions required for race condition prevention
- Must support multiple pending requests per listing

**Stakeholders:**
- Investors: Need clear feedback on request status
- Admins: Need efficient approval workflow
- Platform: Need audit trail and data integrity

## Goals / Non-Goals

**Goals:**
- ✅ Enable investors to request listing locks with admin approval
- ✅ Provide admin dashboard for reviewing and managing requests
- ✅ Prevent race conditions when multiple admins approve different requests
- ✅ Maintain data integrity (100% ownership invariant, etc.)
- ✅ Support multiple pending requests per listing
- ✅ Enable investor request cancellation
- ✅ Provide audit trail for compliance

**Non-Goals:**
- ❌ Automatic request expiration (Phase 2)
- ❌ Email notifications (Phase 2)
- ❌ Bulk approve/reject actions (Phase 2)
- ❌ Payment integration (future PayPal work)
- ❌ Request prioritization/queuing (Phase 2)
- ❌ Complex workflow automation

## Decisions

### Decision 1: Multiple Pending Requests Per Listing
**Choice:** Allow multiple pending requests per listing; admin selects which to approve

**Rationale:**
- **Why not single request?** Limits investor flexibility, creates queue management complexity
- **Why allow multiple?** Investors can express interest concurrently, admin has choice
- **Trade-offs:**
  - ✅ Pro: Admin flexibility to select best investor
  - ✅ Pro: No request queue management needed
  - ✅ Pro: Investors don't wait for others to cancel
  - ⚠️ Con: Multiple pending requests may confuse investors
  - ⚠️ Con: Admin must manually reject other requests after approval
- **Mitigation:** UI clearly shows "X other pending requests" in admin detail view

**Alternatives considered:**
1. Single pending request (first-come-first-served) → Rejected: Too rigid, no admin choice
2. Request queue with priority → Rejected: Over-engineering for Phase 1
3. Auto-reject pending requests on lock → Rejected: Loses audit trail

### Decision 2: Investor Role Identification
**Choice:** Check for `investor` role via `hasRbacAccess({ required_roles: ["investor"] })`

**Rationale:**
- WorkOS RBAC is source of truth for authentication/authorization
- Consistent with project patterns (see `convex/listings.ts` admin checks)
- Admins can also create requests (useful for testing)

**Implementation:**
```typescript
const isInvestor = hasRbacAccess({
  required_roles: ["investor"],
  user_identity: identity,
});
```

### Decision 3: Existing `lockListing` Mutation
**Choice:** Keep for admin use only (admins can bypass approval workflow)

**Rationale:**
- **Why keep?** Admins need direct lock capability for urgent cases
- **Why restrict?** Investors should use approval workflow
- **Trade-offs:**
  - ✅ Pro: Admin flexibility for edge cases
  - ✅ Pro: Useful for testing and emergency situations
  - ⚠️ Con: Two lock paths (could be confusing)
- **Mitigation:** Document clearly in function comments

**Alternatives considered:**
1. Deprecate entirely → Rejected: Removes admin flexibility
2. Make it create request instead → Rejected: Changes existing behavior
3. Allow for backward compatibility → Rejected: Confusing dual behavior

### Decision 4: Atomic Approval Updates
**Choice:** Use Convex transactions for atomic read-check-update operations

**Rationale:**
- **Race condition scenario:** Two admins approve different requests simultaneously
- **Without atomicity:** Both could succeed, locking listing twice (data corruption)
- **With atomicity:** Only one approval succeeds, other gets clear error
- **Convex support:** Mutations are transactions by default

**Implementation:**
```typescript
// Atomic approval in single transaction:
// 1. Read listing and request
// 2. Verify listing is available (visible && !locked)
// 3. Verify request is pending
// 4. If checks pass, atomically:
//    - Update request status to "approved"
//    - Lock the listing
// 5. If checks fail, throw error
```

### Decision 5: Request Notes Validation
**Choice:** Optional notes field with 1000 character limit

**Rationale:**
- **Why optional?** Not all requests need context
- **Why 1000 chars?** Reasonable context without abuse
- **Trade-offs:**
  - ✅ Pro: Fast submission without required fields
  - ✅ Pro: Prevents spam/abuse
  - ⚠️ Con: Some admins may want required context
- **Mitigation:** UI encourages providing notes for faster approval

### Decision 6: Listing Deletion with Requests
**Choice:** Prevent deletion if any requests exist (pending, approved, or rejected)

**Rationale:**
- **Why prevent?** Maintains audit trail and data integrity
- **Data relationship:** Requests reference listings via `listingId`
- **Trade-offs:**
  - ✅ Pro: Preserves audit trail
  - ✅ Pro: Prevents orphaned requests
  - ⚠️ Con: Admin must manually delete requests first
- **Mitigation:** Clear error message with instructions

**Alternatives considered:**
1. Cascade delete requests → Rejected: Loses audit trail
2. Mark requests as "expired" → Considered for Phase 2
3. Soft delete listings → Rejected: Over-complicates schema

### Decision 7: Locked Listing Handling
**Choice:** Auto-reject pending requests when listing becomes locked

**Rationale:**
- **Scenario:** Admin manually locks listing or another request is approved
- **Why auto-reject?** Pending requests are no longer actionable
- **Clean state:** All pending requests for locked listings are rejected
- **Trade-offs:**
  - ✅ Pro: Clean state, no stale pending requests
  - ✅ Pro: Clear feedback to investors
  - ⚠️ Con: Automatic rejection may surprise investors
- **Mitigation:** Clear rejection reason: "Listing was locked"

### Decision 8: Real-time Updates
**Choice:** Use Convex React hooks for automatic real-time updates

**Rationale:**
- **Convex feature:** Reactive queries update automatically
- **Better UX:** Admins/investors see changes immediately
- **No cost:** Already available, no extra implementation
- **Trade-offs:**
  - ✅ Pro: Excellent UX
  - ✅ Pro: No manual refresh needed
  - ✅ Pro: Zero additional code

**Alternatives considered:**
1. Manual refresh → Rejected: Poor UX
2. Polling → Rejected: Inefficient, already have better solution

### Decision 9: Request ID Display
**Choice:** Show first 8 characters of Convex ID (e.g., `kg25zy58`)

**Rationale:**
- **Full Convex ID:** `kg25zy583vde1xsem8q17sjf6x7szpf6` (not user-friendly)
- **Short ID:** Unique enough for display, easy to read
- **Trade-offs:**
  - ✅ Pro: Simple implementation (`.slice(0, 8)`)
  - ✅ Pro: Unique enough for UI display
  - ⚠️ Con: Not as readable as sequential numbers
- **Mitigation:** Only used for display, full ID used internally

**Alternatives considered:**
1. Full Convex ID → Rejected: Too long for UI
2. Sequential numbers → Rejected: Requires counter management
3. Date-based ID → Rejected: Over-engineering

## Risks / Trade-offs

### Risk 1: Multiple Pending Requests Confusion
**Risk:** Investors may be confused if multiple users request same listing

**Mitigation:**
- UI shows "X other pending requests for this listing" in admin view
- Investors see their own request status clearly
- Admin can view all pending requests for context

### Risk 2: Race Conditions on Approval
**Risk:** Two admins approve different requests simultaneously

**Mitigation:**
- Atomic transactions prevent double-locking
- Clear error message: "Listing was locked by another admin"
- Failed approval shows which request was approved

### Risk 3: Stale Pending Requests
**Risk:** Pending requests accumulate without expiration

**Mitigation (Phase 1):**
- Manual admin review and rejection
- Admin dashboard shows all pending requests
- Investors can cancel their own requests

**Future (Phase 2):**
- Automatic expiration after configurable timeout
- Cron job to clean up stale requests

### Risk 4: Request Spam/Abuse
**Risk:** Investors submit many requests to spam system

**Mitigation:**
- 1000 character limit on notes
- Admin dashboard shows all requests per investor
- Future: Rate limiting (Phase 2)

### Risk 5: Admin Workflow Bottleneck
**Risk:** Many requests overwhelm admin capacity

**Mitigation (Phase 1):**
- Efficient UI with filters and search
- Pending tab defaults to most actionable items
- Real-time updates reduce manual refresh

**Future (Phase 2):**
- Bulk approve/reject actions
- Email notifications to admins
- Request prioritization

## Migration Plan

**Schema Migration:**
1. Add `lock_requests` table to `convex/schema.ts`
2. Run `npx convex dev` to apply schema changes
3. No data migration needed (new table)

**Code Deployment:**
1. Deploy backend functions (`convex/lockRequests.ts`)
2. Update `convex/listings.ts` with admin-only checks
3. Deploy frontend (admin dashboard, investor UI)
4. Update navigation menu

**Rollback Plan:**
1. Remove `lock_requests` table from schema
2. Revert `convex/listings.ts` changes
3. Remove frontend components
4. Revert navigation changes
5. No data loss (requests deleted with table)

**Testing:**
1. Unit tests for backend functions
2. E2E tests for approval workflow
3. Race condition testing (concurrent approvals)
4. Role-based access testing

## Open Questions

1. **Request expiration timeout:** What duration? (Deferred to Phase 2)
2. **Email notifications:** To whom and when? (Deferred to Phase 2)
3. **Bulk actions priority:** MVP or Phase 2? → **Decision:** Phase 2
4. **Status badge colors:** Yellow/Orange/Green/Red? → **Decision:** Yes, follow HeroUI design tokens
5. **Request priority:** FIFO or admin choice? → **Decision:** Admin choice (no priority)

