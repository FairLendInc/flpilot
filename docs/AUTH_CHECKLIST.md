# Authentication Checklist for Convex Functions

This document tracks which Convex functions have proper authentication checks. All functions that handle sensitive data should require authentication.

**Legend**:
- ✅ = Has authentication check
- ❌ = Missing authentication check
- 🔒 = Has role-based authorization (admin, etc.)

---

## Lock Requests (`convex/lockRequests.ts`)

### Queries
- ✅🔒 `getLockRequest` - Admin or requester only
- ✅🔒 `getPendingLockRequests` - Admin only
- ✅🔒 `getPendingLockRequestsWithDetails` - Admin only
- ✅🔒 `getApprovedLockRequests` - Admin only
- ✅🔒 `getApprovedLockRequestsWithDetails` - Admin only
- ✅🔒 `getRejectedLockRequests` - Admin only
- ✅🔒 `getRejectedLockRequestsWithDetails` - Admin only
- ✅🔒 `getLockRequestsByListing` - Admin only
- ✅🔒 `getPendingLockRequestsByListing` - Admin only
- ✅ `getUserLockRequests` - User's own requests only
- ✅🔒 `getLockRequestWithDetails` - Admin only

### Mutations
- ✅ `createLockRequest` - Investor role required
- ✅🔒 `approveLockRequest` - Admin only
- ✅🔒 `rejectLockRequest` - Admin only
- ✅ `cancelLockRequest` - Request owner only

**Status**: ✅ All lock request functions secured

---

## Ownership (`convex/ownership.ts`)

### Queries
- ❌ `getMortgageOwnership` - **NEEDS AUTH**
- ❌ `getUserPortfolio` - **NEEDS AUTH**
- ❌ `checkOwnership` - **NEEDS AUTH**
- ❌ `getInstitutionalPortfolio` - **NEEDS AUTH**
- ❌ `getTotalOwnership` - **NEEDS AUTH**

### Mutations
- ❌ `createOwnership` - **NEEDS AUTH**
- ❌ `updateOwnershipPercentage` - **NEEDS AUTH**
- ❌ `transferOwnership` - **NEEDS AUTH**
- ❌ `deleteOwnership` - **NEEDS AUTH**

**Status**: ❌ 0/9 functions have auth (0%)

---

## Payments (`convex/payments.ts`)

### Queries
- ❌ `getPaymentsForMortgage` - **NEEDS AUTH**
- ❌ `getPaymentsByStatus` - **NEEDS AUTH**
- ❌ `getPaymentsByDateRange` - **NEEDS AUTH**
- ❌ `getPaymentByRotessaId` - **NEEDS AUTH**

### Mutations
- ❌ `createPayment` - **NEEDS AUTH**
- ❌ `updatePaymentStatus` - **NEEDS AUTH**
- ❌ `bulkCreatePayments` - **NEEDS AUTH**
- ❌ `syncPaymentFromRotessa` - **NEEDS AUTH**

**Status**: ❌ 0/8 functions have auth (0%)

---

## Borrowers (`convex/borrowers.ts`)

### Queries
- ❌ `getBorrower` - **NEEDS AUTH**
- ❌ `getBorrowerByRotessaId` - **NEEDS AUTH**
- ❌ `listBorrowers` - **NEEDS AUTH**
- ❌ `searchBorrowersByEmail` - **NEEDS AUTH**

### Mutations
- ❌ `createBorrower` - **NEEDS AUTH**
- ❌ `updateBorrower` - **NEEDS AUTH**

**Status**: ❌ 0/6 functions have auth (0%)

---

## Mortgages (`convex/mortgages.ts`)

### Queries
- ❌ `getMortgage` - **NEEDS AUTH**
- ❌ `listMortgagesByBorrower` - **NEEDS AUTH**
- ❌ `listMortgagesByStatus` - **NEEDS AUTH**
- ✅ `listAllMortgagesWithBorrowers` - Has auth check
- ❌ `getMortgagesNearingMaturity` - **NEEDS AUTH**

### Mutations
- ❌ `createMortgage` - **NEEDS AUTH**
- ❌ `updateMortgageStatus` - **NEEDS AUTH**
- ❌ `addDocumentToMortgage` - **NEEDS AUTH**
- ✅🔒 `updateMortgage` - Admin only (has auth)
- ❌ `deleteMortgage` - **NEEDS AUTH** (has admin check but missing base auth)

**Status**: ⚠️ 2/10 functions have auth (20%)

---

## Listings (`convex/listings.ts`)

### Queries
- ❌ `getAvailableListings` - **NEEDS AUTH**
- ❌ `getAvailableListingsWithMortgages` - **NEEDS AUTH**
- ❌ `getListingByMortgage` - **NEEDS AUTH**
- ❌ `getListingById` - **NEEDS AUTH**
- ❌ `getUserLockedListings` - **NEEDS AUTH**
- ❌ `getAllLockedListings` - **NEEDS AUTH**
- ❌ `isListingAvailable` - **NEEDS AUTH**

### Mutations
- ✅🔒 `createFromPayload` - Admin only (webhook, has auth)
- ❌ `createListing` - **NEEDS AUTH**
- ✅ `lockListing` - Has auth check
- ✅ `unlockListing` - Has auth check
- ❌ `updateListingVisibility` - **NEEDS AUTH**
- ✅🔒 `updateListing` - Admin only (has auth)
- ✅🔒 `deleteListing` - Admin only (has auth)

**Status**: ⚠️ 5/14 functions have auth (36%)

---

## Comparables (`convex/comparables.ts`)

### Queries
- ❌ `getComparablesForMortgage` - **NEEDS AUTH**
- ❌ `getComparablesWithinDistance` - **NEEDS AUTH**
- ❌ `getComparablesCountForListing` - **NEEDS AUTH**

### Mutations
- ❌ `createComparable` - **NEEDS AUTH**
- ❌ `updateComparable` - **NEEDS AUTH**
- ❌ `deleteComparable` - **NEEDS AUTH**
- ❌ `deleteAllComparablesForMortgage` - **NEEDS AUTH**

**Status**: ❌ 0/7 functions have auth (0%)

---

## Overall Summary

| Module | Total Functions | With Auth | Percentage |
|--------|----------------|-----------|------------|
| Lock Requests | 15 | 15 | 100% ✅ |
| Ownership | 9 | 0 | 0% ❌ |
| Payments | 8 | 0 | 0% ❌ |
| Borrowers | 6 | 0 | 0% ❌ |
| Mortgages | 10 | 2 | 20% ⚠️ |
| Listings | 14 | 5 | 36% ⚠️ |
| Comparables | 7 | 0 | 0% ❌ |
| **TOTAL** | **69** | **22** | **32%** |

**Functions needing auth**: 47

---

## Implementation Notes

### Auth Helper Pattern

After updating `hasRbacAccess` with admin bypass, use this pattern:

```typescript
import { requireAuth } from "./auth.config";

export const someFunction = query({
  args: { ... },
  returns: ...,
  handler: async (ctx, args) => {
    		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Authentication required");
		};
    // ... rest of function logic
  },
});
```

### Admin Bypass

The `hasRbacAccess` helper will be updated to automatically return `true` for admin users:

```typescript
export function hasRbacAccess(options: RbacOptions): boolean {
  if (!user_identity) return false;
  
  const userRole = user_identity.role || user_identity.workosRole;
  
  // Admins bypass all checks
  if (userRole === "admin") {
    return true;
  }
  
  // ... existing role/permission checks
}
```

This means:
- All existing `hasRbacAccess` calls will automatically grant admin access
- New `requireAuth` calls only check authentication, not roles
- Admins can execute any function in the system

---

## Next Steps

1. Update `hasRbacAccess` and `checkRbac` with admin bypass
2. Create `requireAuth` helper function
3. Add auth to all 47 functions marked with ❌
4. Test admin access works across all functions
5. Test non-admin users are properly restricted

