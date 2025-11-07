# Lock Listing Request Feature - Questions & Clarifications

## Critical Questions Requiring Decisions

### 1. **Investor Role Identification**
**Question**: How should we identify if a user is an "investor" who can create lock requests?

**Context**: 
- System uses WorkOS RBAC with roles: `admin`, `broker`, `lawyer`, `investor`
- Users can potentially have multiple roles
- `hasRbacAccess` helper checks roles from `user_identity.role` or `user_identity.workosRole`

**Options**:
- **A)** Check if user has `investor` role via `hasRbacAccess({ required_roles: ["investor"] })`
- **B)** Check if user has `mortgage.buylock` permission (from `roles.ts`, investors have this)
- **C)** Allow any authenticated user (not just investors)
- **D)** Allow investors AND admins (admins can also be investors)

**Recommendation**: Option A - Check for `investor` role explicitly

**Clarification Needed**: ✅ **DECISION REQUIRED**

---

### 2. **Existing `lockListing` Mutation**
**Question**: What should happen to the existing `lockListing` mutation in `convex/listings.ts`?

**Context**:
- Current `lockListing` mutation directly locks listings without approval
- It's used by investors currently (or was intended to be)

**Options**:
- **A)** **Deprecate it** - Remove direct lock capability, force all locks through request system
- **B)** **Keep for admin use only** - Admins can still directly lock listings (bypass approval)
- **C)** **Keep for backward compatibility** - But add warning/deprecation notice
- **D)** **Keep but require approval** - Make it create a lock request instead of direct lock

**Recommendation**: Option B - Keep for admin use only (admins can bypass approval for urgent cases)

**Clarification Needed**: ✅ **DECISION REQUIRED**

---

### 3. **Relationship to `RequestListingSection` Component**
**Question**: Is the existing `RequestListingSection` component related to lock requests, or is it a separate feature?

**Context**:
- `components/listing-detail/request-listing-section.tsx` exists
- It's for lawyer selection and investment requests
- Appears to be a different workflow

**Options**:
- **A)** Separate features - `RequestListingSection` is for investment requests with lawyers, lock requests are different
- **B)** Related features - Lock request is part of the investment request flow
- **C)** Replace `RequestListingSection` - Lock request replaces the lawyer selection flow

**Recommendation**: Option A - Separate features (lock request is simpler, just locks the listing)

**Clarification Needed**: ✅ **CONFIRMATION NEEDED**

---

### 4. **Locked Listing Visibility**
**Question**: How should locked listings appear in the listings page (`/listings`)?

**Context**:
- Current `getAvailableListings` query filters: `visible: true AND locked: false`
- Locked listings disappear from public view

**Options**:
- **A)** **Hide locked listings** - Current behavior, locked listings don't appear in listings page
- **B)** **Show locked listings with badge** - Display "Locked" badge, but don't allow new requests
- **C)** **Show locked listings only to locker** - If user locked it, show it; otherwise hide
- **D)** **Show all listings with status** - Show locked listings with clear "Locked" indicator

**Recommendation**: Option A for Phase 1 (keep current behavior), Option C for Phase 2 (show to locker)

**Clarification Needed**: ✅ **DECISION REQUIRED**

---

### 5. **Admin Multi-Role Access**
**Question**: Can admins also be investors? Should admins be able to create lock requests?

**Context**:
- Users can have multiple roles
- Admins might also want to invest

**Options**:
- **A)** **Yes, admins can create lock requests** - If admin has investor role, they can request
- **B)** **No, admins bypass requests** - Admins can directly lock (use existing `lockListing` mutation)
- **C)** **Admins can request but auto-approve** - Admin requests are automatically approved

**Recommendation**: Option B - Admins bypass requests, use direct lock (simpler workflow)

**Clarification Needed**: ✅ **DECISION REQUIRED**

---

### 6. **Request Cancellation**
**Question**: Should investors be able to cancel their own pending lock requests?

**Context**:
- Investor might change their mind
- Admin might be reviewing request

**Options**:
- **A)** **Yes, allow cancellation** - Investor can cancel pending request anytime
- **B)** **No cancellation** - Once submitted, only admin can approve/reject
- **C)** **Cancellation with restrictions** - Can cancel only if admin hasn't started review

**Recommendation**: Option A - Allow cancellation (better UX, investor flexibility)

**Clarification Needed**: ✅ **CONFIRMATION NEEDED**

---

### 7. **Admin Dashboard Default View**
**Question**: What should the admin dashboard show by default - all requests or just pending?

**Context**:
- Admin needs to see pending requests for action
- But might also want to see history

**Options**:
- **A)** **Default to pending** - Show only pending requests, filter for others
- **B)** **Default to all** - Show all requests, filter for pending
- **C)** **Tabs** - Separate tabs for "Pending", "Approved", "Rejected"

**Recommendation**: Option A - Default to pending (most actionable), with filters for history

**Clarification Needed**: ✅ **DECISION REQUIRED**

---

### 8. **Request Notes Field**
**Question**: Should the request notes field have character limits or validation?

**Context**:
- Optional notes field for investor to add context
- Could be used for admin review

**Options**:
- **A)** **No limits** - Free text, any length
- **B)** **Character limit** - e.g., 500 characters max
- **C)** **Required field** - Force investor to provide context

**Recommendation**: Option B - 500 character limit (reasonable context without abuse)

**Clarification Needed**: ✅ **DECISION REQUIRED**

---

### 9. **Edge Cases: Listing Deletion**
**Question**: What happens if a listing is deleted while a lock request is pending?

**Context**:
- Admin might delete listing
- Request might be orphaned

**Options**:
- **A)** **Cascade delete requests** - Delete all requests when listing deleted
- **B)** **Mark request as invalid** - Set status to "expired" or "invalid"
- **C)** **Prevent deletion** - Don't allow listing deletion if pending requests exist
- **D)** **Keep request, mark as invalid** - Request remains but marked invalid

**Recommendation**: Option B - Mark request as "expired" when listing deleted (maintains audit trail)

**Clarification Needed**: ✅ **DECISION REQUIRED**

---

### 10. **Edge Cases: Listing Already Locked**
**Question**: What happens if listing becomes locked (by admin or another process) while request is pending?

**Context**:
- Admin might manually lock listing
- Another investor's request might be approved first

**Options**:
- **A)** **Auto-reject pending requests** - When listing locks, reject all pending requests
- **B)** **Mark as invalid** - Set status to "expired" or "invalid"
- **C)** **Keep pending, show warning** - Keep request but show admin it's invalid
- **D)** **Prevent approval** - Don't allow approval if listing already locked

**Recommendation**: Option A - Auto-reject pending requests when listing locks (clean state)

**Clarification Needed**: ✅ **DECISION REQUIRED**

---

### 11. **Real-time Updates**
**Question**: Should the admin dashboard and investor views update in real-time when requests are approved/rejected?

**Context**:
- Convex provides reactive queries
- Could use Convex React hooks for auto-updates

**Options**:
- **A)** **Real-time updates** - Use Convex React hooks, auto-refresh
- **B)** **Manual refresh** - User must refresh page to see updates
- **C)** **Polling** - Periodic refresh every X seconds

**Recommendation**: Option A - Real-time updates via Convex React (better UX, already available)

**Clarification Needed**: ✅ **CONFIRMATION NEEDED**

---

### 12. **Request ID Display**
**Question**: Should lock requests have human-readable IDs or just use Convex document IDs?

**Context**:
- Convex provides `_id` (e.g., `kg25zy583vde1xsem8q17sjf6x7szpf6`)
- Not user-friendly for display

**Options**:
- **A)** **Use Convex ID** - Display full Convex document ID
- **B)** **Short ID** - Use first 8 characters of Convex ID (e.g., `kg25zy58`)
- **C)** **Sequential number** - Add `requestNumber: number` field (e.g., #001, #002)
- **D)** **Date-based ID** - Format like `LR-2025-01-15-001` (date + sequence)

**Recommendation**: Option B - Short ID (simple, unique enough for display)

**Clarification Needed**: ✅ **DECISION REQUIRED**

---

### 13. **Admin Notification Preferences**
**Question**: Should admins be notified when new lock requests are created? (Future consideration)

**Context**:
- Admin might not check dashboard frequently
- Email/in-app notifications could help

**Options**:
- **A)** **No notifications in Phase 1** - Manual check required
- **B)** **Email notifications** - Send email when new request created
- **C)** **In-app notifications** - Show notification badge in admin dashboard
- **D)** **Both email and in-app** - Comprehensive notification system

**Recommendation**: Option A for Phase 1 (manual check), Option C for Phase 2 (in-app notifications)

**Clarification Needed**: ✅ **CONFIRMATION NEEDED** (Phase 1 scope)

---

### 14. **Request Status Badge Colors**
**Question**: What colors should be used for request status badges in the admin dashboard?

**Context**:
- Need visual distinction between pending, approved, rejected
- Should match existing design system

**Options**:
- **A)** **Pending: Yellow/Orange, Approved: Green, Rejected: Red**
- **B)** **Pending: Blue, Approved: Green, Rejected: Red**
- **C)** **Pending: Gray, Approved: Green, Rejected: Red**

**Recommendation**: Option A - Yellow/Orange for pending (action needed), Green for success, Red for failure

**Clarification Needed**: ✅ **CONFIRMATION NEEDED** (Design preference)

---

### 15. **Bulk Actions Priority**
**Question**: Should bulk approve/reject be included in Phase 1 or deferred to Phase 2?

**Context**:
- Admin might have many requests
- Bulk actions improve efficiency

**Options**:
- **A)** **Include in Phase 1** - Build bulk actions from start
- **B)** **Defer to Phase 2** - Start with individual actions, add bulk later

**Recommendation**: Option B - Defer to Phase 2 (simpler initial implementation, validate workflow first)

**Clarification Needed**: ✅ **CONFIRMATION NEEDED**

---

## Summary of Required Decisions

### Must Decide Before Implementation:
1. ✅ **Investor role identification method** (Q1)
2. ✅ **Existing `lockListing` mutation handling** (Q2)
3. ✅ **Locked listing visibility behavior** (Q4)
4. ✅ **Admin multi-role access** (Q5)
5. ✅ **Request cancellation policy** (Q6)
6. ✅ **Admin dashboard default view** (Q7)
7. ✅ **Request notes validation** (Q8)
8. ✅ **Edge case: Listing deletion** (Q9)
9. ✅ **Edge case: Listing already locked** (Q10)
10. ✅ **Request ID display format** (Q12)

### Confirmations Needed (Recommended defaults provided):
- ✅ Relationship to `RequestListingSection` (Q3) - **Separate features**
- ✅ Real-time updates (Q11) - **Yes, use Convex React**
- ✅ Notifications scope (Q13) - **Phase 1: Manual, Phase 2: In-app**
- ✅ Status badge colors (Q14) - **Yellow/Orange/Green/Red**
- ✅ Bulk actions priority (Q15) - **Phase 2**

---

## Next Steps

Once decisions are made on the critical questions above, we can:
1. Update the brainstorming document with final decisions
2. Create OpenSpec change proposal (if required)
3. Begin implementation with clear requirements
4. Update schema and backend functions
5. Build admin dashboard UI
6. Build investor lock request flow

