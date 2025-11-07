# Lock Listing Request Approval Workflow

## Why

Investors need a controlled process to express interest in purchasing a marketplace listing before payment integration is complete. Currently, listings can be locked directly without admin oversight, which creates challenges for marketplace management and quality control. This change establishes an approval workflow where investors submit lock requests that admins review and approve/reject, providing an interim solution before implementing PayPal payment gating.

## What Changes

**New Capability**: Lock Requests (new capability)
- Add `lock_requests` table to schema with status tracking (pending, approved, rejected, expired)
- Backend functions in `convex/lockRequests.ts` for request management
- Admin dashboard at `/dashboard/admin/lock-requests` with tabs (Pending, Approved, Rejected)
- Investor request flow integrated into listing detail pages
- Atomic approval updates to prevent race conditions
- Multiple pending requests per listing (admin selects which to approve)

**Modified Capability**: Listings
- Existing `lockListing` mutation restricted to admin-only use (bypass approval workflow)
- Lock state now managed through approval workflow for investors
- Listing deletion prevented if lock requests exist (must delete requests first)

**Technical Decisions** (see design.md):
- Allow multiple pending requests per listing (admin choice)
- Atomic transaction updates prevent race conditions
- Request notes: Optional, max 1000 characters
- No automatic expiration in Phase 1
- Real-time updates via Convex React hooks
- Investors can cancel their own pending requests
- Admins can bypass approval using existing `lockListing` mutation

## Impact

**Affected specs**:
- New: `lock-requests` (new capability)
- Modified: `listings` (lock workflow changes)

**Affected code**:
- `convex/schema.ts` - Add `lock_requests` table
- `convex/lockRequests.ts` - New file with request management functions
- `convex/listings.ts` - Update `lockListing` to admin-only, add request validation
- `app/dashboard/admin/lock-requests/page.tsx` - New admin dashboard page
- `app/(auth)/listings/[id]/page.tsx` - Add investor lock request UI
- `lib/navigation/role-navigation.ts` - Add "Lock Requests" menu item

**Breaking Changes**: None - New feature addition

**Database Changes**:
- New table: `lock_requests` with 3 indexes
- No changes to existing tables

**User Experience Changes**:
- Investors: Submit lock requests instead of direct lock (better UX with approval feedback)
- Admins: New dashboard for managing lock requests (improved control and oversight)

