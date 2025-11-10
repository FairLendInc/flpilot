# Onboarding Auth Fix - Quick Summary

## What Was Fixed

**Critical Bug**: Admins and other elevated roles were being forced through investor onboarding when they didn't exist in Convex DB.

**Root Cause**: `OnboardingGate` checked Convex DB state before checking WorkOS role (violating "WorkOS is source of truth" principle).

**Solution**: Check WorkOS role FIRST. Elevated roles (admin/broker/investor/lawyer) skip onboarding entirely.

---

## Files Changed

1. ✅ `components/onboarding/OnboardingGateWrapper.tsx` - NEW: Server component that fetches role from Convex
2. ✅ `components/onboarding/OnboardingGate.tsx` - Client component accepts role as prop
3. ✅ `app/layout.tsx` - Uses OnboardingGateWrapper instead of OnboardingGate
4. ✅ `app/onboarding/page.tsx` - Added server-side role validation
5. ✅ `types/workos.ts` - NEW: Type-safe WorkOS helpers
6. ✅ `convex/auth.config.ts` - Updated to use type-safe helpers
7. ✅ `convex/schema.ts` - Made firstName/lastName optional (backward compat)
8. ✅ `convex/onboarding.ts` - Runtime validation for new submissions

---

## Key Code Change

### Before (BUGGY):
```typescript
// Client component tries to get role from useAuth()
const { user } = useAuth();
const userRole = extractRole(user); // ❌ RBAC claims not available client-side!
const journey = useQuery(api.onboarding.getJourney);
const requiresOnboarding = !journey || journey.status === "draft";
// ❌ Problem: Role is undefined, and !journey is true when user not in DB
```

### After (FIXED):
```typescript
// SERVER COMPONENT - Fetch role from Convex where RBAC claims are available
export async function OnboardingGateWrapper() {
    const identity = await preloadQuery(api.profile.getUserIdentity, ...);
    const userRole = extractRole(identity); // ✅ RBAC claims available!
    return <OnboardingGate userRole={userRole} />;
}

// CLIENT COMPONENT - Use server-provided role
export function OnboardingGate({ userRole }: OnboardingGateProps) {
    if (isElevatedRole(userRole)) {
        return; // ✅ Skip onboarding for admin/broker/investor/lawyer
    }
    // THEN check journey for member users only
}
```

---

## Testing Quick Guide

### Test 1: Admin Without DB Record
```
1. Create admin in WorkOS
2. Delete from Convex DB (if exists)
3. Log in
✅ Expected: Direct to /dashboard (NOT /onboarding)
```

### Test 2: Member User
```
1. Create member in WorkOS
2. Log in
✅ Expected: Redirect to /onboarding
```

### Test 3: Admin Accessing Onboarding
```
1. Log in as admin
2. Navigate to /onboarding
✅ Expected: Redirect to /dashboard
```

---

## How It Works Now

```
User Logs In
    ↓
OnboardingGateWrapper (Server Component)
    ↓
Fetch role from Convex (ctx.auth.getUserIdentity)
    ↓ Role includes RBAC claims
    ↓
Pass role to OnboardingGate (Client Component)
    ↓
Is role admin/broker/investor/lawyer?
    ↓ YES → Access dashboard (skip onboarding)
    ↓ NO (member)
        ↓
    Check Convex journey state
        ↓
    No journey or draft? → Onboarding
    Approved? → Dashboard
```

---

## Why Server Component?

**Problem**: Client-side `useAuth()` only provides basic user info:
- ✅ `id`, `email`, `firstName`, `lastName`
- ❌ NO `role`, NO `permissions` (RBAC claims)

**Solution**: RBAC claims only available server-side:
- Server components with `withAuth()`
- Convex queries with `ctx.auth.getUserIdentity()`

## Deployment Status

- [x] Code implemented with server-side role fetching
- [x] Type safety added
- [x] Documentation complete
- [ ] Testing in staging
- [ ] Production deployment

---

## Next Steps

1. **Test in staging** using test plan: `ONBOARDING_AUTH_FIX_TEST_PLAN.md`
2. **Verify** all 4 elevated roles work correctly
3. **Monitor** logs after production deployment
4. **Document** any issues discovered

---

## Rollback

If issues occur, revert these files to previous versions:
- `components/onboarding/OnboardingGateWrapper.tsx` (delete)
- `components/onboarding/OnboardingGate.tsx`
- `app/layout.tsx`
- `app/onboarding/page.tsx`
- `convex/auth.config.ts`
- `convex/onboarding.ts`
- `convex/schema.ts`
- Delete `types/workos.ts`

---

## More Information

- **Full Analysis**: `ONBOARDING_AUTH_BUG_ANALYSIS.md`
- **Test Plan**: `ONBOARDING_AUTH_FIX_TEST_PLAN.md`
- **Implementation Details**: `ONBOARDING_AUTH_FIX_IMPLEMENTATION.md`

---

## Quick Reference

**Elevated Roles** (skip onboarding):
- `admin`
- `broker`
- `investor`
- `lawyer`

**Member Role** (requires onboarding):
- `member`

**Type-Safe Helpers** (from `types/workos.ts`):
- `extractRole(user)` - Get role from user/identity
- `isElevatedRole(role)` - Check if role skips onboarding
- `extractPermissions(user)` - Get permissions array
- `extractOrgId(user)` - Get organization ID
