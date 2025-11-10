# Onboarding Auth Bug Analysis

## Executive Summary

**Critical Issue**: Users with admin (or other elevated) roles in WorkOS are being forced through the investor onboarding flow when they don't exist in the Convex database. This violates the core architectural principle that **WorkOS is the source of truth for authentication and authorization**.

**Impact**:
- Admin users can be locked out of admin functions
- System behavior is unpredictable when Convex DB and WorkOS are out of sync
- Auth decisions are inconsistent across the application

**Root Cause**: `OnboardingGate.tsx` makes routing decisions based on Convex DB state (journey existence) rather than WorkOS identity data (user role from JWT).

---

## The Problem

### Observed Behavior

When a user logs in with admin status but does not exist in the Convex DB (`users` table, `onboarding_journeys` table), the onboarding flow is triggered. This should **NEVER** happen for users with elevated roles.

### Expected Behavior

1. User logs in via WorkOS → JWT contains `role: "admin"` (or broker/investor/lawyer)
2. System checks the user's **WorkOS role** (from JWT)
3. If role is admin/broker/investor/lawyer → grant access, skip onboarding
4. If role is "member" → check onboarding journey state
5. Only "member" role users should go through onboarding

---

## Root Cause Analysis

### Architecture Violation

The codebase has a clear architectural principle documented in `AGENTS.md` and `CLAUDE.md`:

> **Use `ctx.auth.getUserIdentity()` for all user role/permission checks** - WorkOS is the source of truth for authentication and authorization

However, `OnboardingGate.tsx` violates this principle by using **Convex DB state** as the source of truth for auth decisions.

### Current Flawed Logic in OnboardingGate.tsx

```typescript
// flpilot/components/onboarding/OnboardingGate.tsx
export function OnboardingGate() {
	const { user } = useAuth(); // WorkOS user
	const journey = useQuery(api.onboarding.getJourney); // Convex DB query

	// ... routing logic ...

	const requiresOnboarding =
		!journey ||                              // ❌ Problem: null if user not in DB
		journey.status === "draft" ||
		journey.status === "awaiting_admin" ||
		journey.status === "rejected";

	if (requiresOnboarding) {
		router.replace("/onboarding"); // ❌ Redirects admins to onboarding!
	}
}
```

### What `getJourney` Returns

```typescript
// flpilot/convex/onboarding.ts
export const getJourney = query({
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return null; // No auth
		}
		const user = await ctx.db
			.query("users")
			.withIndex("by_idp_id", (q) => q.eq("idp_id", identity.subject))
			.unique();
		if (!user) {
			return null; // ❌ User not provisioned in Convex DB
		}
		return await getJourneyForUser(ctx, user._id);
	},
});
```

**The Problem**: `journey === null` can mean:
1. User not authenticated (correct)
2. **User not in Convex DB** (incorrect assumption that they need onboarding)
3. Journey not created yet (potentially valid)

The gate treats all three cases the same: "needs onboarding". This is wrong for case #2, especially when the user has an elevated role in WorkOS.

---

## Architectural Inconsistency

### Correct Pattern (Used in Convex Functions)

```typescript
// flpilot/convex/auth.config.ts
export function hasRbacAccess(options: RbacOptions): boolean {
	const { user_identity } = options;

	// Extract role from identity (with fallback)
	const userRole = user_identity.role || user_identity.workosRole;

	// Admins bypass all checks ✅
	if (userRole === "admin") {
		return true;
	}

	// Check required roles from WorkOS identity ✅
	if (required_roles && !required_roles.includes(userRole)) {
		return false;
	}

	return true;
}
```

This pattern correctly uses WorkOS identity as the source of truth.

### Incorrect Pattern (Used in OnboardingGate)

```typescript
// OnboardingGate checks Convex DB state instead ❌
const journey = useQuery(api.onboarding.getJourney);
const requiresOnboarding = !journey || journey.status === "draft";
```

This pattern uses Convex DB as the source of truth, creating a dangerous divergence.

---

## Broader Implications

### 1. Admin Lockout Risk
New admins added directly in WorkOS could be blocked from accessing admin functions if they don't have a corresponding Convex DB record.

### 2. Race Conditions
User provisioning in Convex is asynchronous. Even legitimate "member" users might temporarily hit this bug during the provisioning window.

### 3. System Behavior Unpredictability
If Convex DB gets out of sync with WorkOS (data loss, migration issues, manual changes), system behavior becomes unpredictable and potentially security-compromising.

### 4. Inconsistent Auth Logic
- **Server-side Convex functions**: Check WorkOS role via `ctx.auth.getUserIdentity()` ✅
- **Client-side routing (OnboardingGate)**: Check Convex DB state ❌

This inconsistency makes the system harder to reason about and more prone to bugs.

---

## The Fix

### 1. Modify OnboardingGate to Check WorkOS Role First

```typescript
// components/onboarding/OnboardingGate.tsx
"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { useQuery } from "convex/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "@/convex/_generated/api";

const ALLOWLIST = ["/onboarding", "/sign-in", "/sign-up", "/callback"];
const ELEVATED_ROLES = ["admin", "broker", "investor", "lawyer"];

export function OnboardingGate() {
	const { user } = useAuth();
	const pathname = usePathname();
	const router = useRouter();
	const journey = useQuery(api.onboarding.getJourney);
	const isAuthenticated = !!user;

	useEffect(() => {
		if (!(isAuthenticated && pathname)) {
			return;
		}

		// ✅ CHECK WORKOS ROLE FIRST - WorkOS is source of truth
		const userRole = (user as any)?.role || (user as any)?.workosRole;

		// ✅ Users with elevated roles skip onboarding entirely
		if (userRole && ELEVATED_ROLES.includes(userRole)) {
			// If they're on onboarding page, redirect to dashboard
			if (pathname.startsWith("/onboarding")) {
				router.replace("/dashboard");
			}
			return; // No onboarding check needed
		}

		// For /onboarding routes: check if approved users should exit
		if (pathname.startsWith("/onboarding")) {
			if (journey?.status === "approved") {
				router.replace("/dashboard");
			}
			return;
		}

		// Skip allowlisted routes
		const isAllowlisted = ALLOWLIST.some((prefix) =>
			pathname.startsWith(prefix)
		);
		if (isAllowlisted) {
			return;
		}

		// Wait for journey data to load
		if (journey === undefined) {
			return;
		}

		// ✅ Only "member" role users need onboarding
		// If we reach here, user is "member" (or has no role)
		const requiresOnboarding =
			!journey ||
			journey.status === "draft" ||
			journey.status === "awaiting_admin" ||
			journey.status === "rejected";

		if (requiresOnboarding) {
			router.replace("/onboarding");
		}
	}, [isAuthenticated, journey, pathname, router, user]);

	return null;
}
```

### 2. Add Type Safety for WorkOS User Object

```typescript
// types/workos.ts (new file)
export interface WorkOSUser {
	id: string;
	email: string;
	firstName?: string;
	lastName?: string;
	profilePictureUrl?: string;
	role?: string;
	permissions?: string[];
	organizationId?: string;
}
```

### 3. Server-Side Check in Onboarding Page

```typescript
// app/onboarding/page.tsx
import { withAuth } from "@workos-inc/authkit-nextjs";
import { preloadedQueryResult, preloadQuery } from "convex/nextjs";
import { redirect } from "next/navigation";
import { OnboardingExperience } from "@/components/onboarding/OnboardingExperience";
import { api } from "@/convex/_generated/api";

const ELEVATED_ROLES = ["admin", "broker", "investor", "lawyer"];

export default async function OnboardingPage() {
	const { user, accessToken } = await withAuth();

	// ✅ Server-side role check - WorkOS is source of truth
	const userRole = (user as any)?.role;
	if (userRole && ELEVATED_ROLES.includes(userRole)) {
		redirect("/dashboard");
	}

	const preloadedJourney = await preloadQuery(
		api.onboarding.getJourney,
		{},
		{ token: accessToken }
	);
	const journey = preloadedQueryResult(preloadedJourney);

	if (journey?.status === "approved") {
		redirect("/dashboard");
	}

	return <OnboardingExperience preloadedJourney={preloadedJourney} />;
}
```

### 4. Auto-Provision Users with Elevated Roles

Add a helper to ensure users with elevated roles are provisioned in Convex DB:

```typescript
// convex/onboarding.ts - add this function
export const ensureUserProvisioned = query({
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return { provisioned: false, needsProvisioning: false };
		}

		const userRole = identity.role || (identity as any).workosRole;

		// Check if user exists
		const user = await ctx.db
			.query("users")
			.withIndex("by_idp_id", (q) => q.eq("idp_id", identity.subject))
			.unique();

		if (user) {
			return { provisioned: true, needsProvisioning: false };
		}

		// Users with elevated roles should be auto-provisioned
		const elevatedRoles = ["admin", "broker", "investor", "lawyer"];
		const needsProvisioning = userRole && elevatedRoles.includes(userRole);

		return {
			provisioned: false,
			needsProvisioning,
			role: userRole
		};
	},
});
```

---

## Testing Plan

### 1. Admin User Without Convex DB Record
1. Create admin user in WorkOS
2. Delete their record from Convex DB (if exists)
3. Log in as admin
4. **Expected**: Direct access to `/dashboard/admin`
5. **Should NOT**: Redirect to `/onboarding`

### 2. Member User Without Journey
1. Create member user in WorkOS
2. Ensure no journey exists
3. Log in as member
4. **Expected**: Redirect to `/onboarding`

### 3. Approved User
1. User with approved journey
2. Log in
3. **Expected**: Direct access to dashboard
4. Visiting `/onboarding` should redirect to dashboard

### 4. Broker/Investor/Lawyer Without DB Record
1. Create user with elevated role in WorkOS
2. Ensure no Convex DB record
3. Log in
4. **Expected**: Access granted, no onboarding

---

## Prevention Strategies

### 1. Architectural Review
Add to code review checklist:
- [ ] Auth decisions use WorkOS identity, not Convex DB state
- [ ] Role checks use `ctx.auth.getUserIdentity()` or `useAuth()` user object
- [ ] Convex DB is treated as secondary storage, not auth source of truth

### 2. Type Safety
Create proper TypeScript types for WorkOS session objects to make role checking explicit and type-safe.

### 3. Testing
Add integration tests that verify auth behavior works correctly when:
- User exists in WorkOS but not Convex
- User role changes in WorkOS
- Convex DB is out of sync

### 4. Documentation
Update architecture docs to explicitly state:
- WorkOS JWT claims are the **only** source of truth for auth decisions
- Convex DB is for **data storage**, not **auth decisions**
- All routing/access control must check WorkOS role first

---

## Related Code Locations

### Files to Modify
- `components/onboarding/OnboardingGate.tsx` - Main fix
- `app/onboarding/page.tsx` - Server-side role check
- `convex/onboarding.ts` - Consider helper functions

### Files That Follow Correct Pattern
- `convex/auth.config.ts` - `hasRbacAccess()`, `checkRbac()`
- `convex/listings.ts` - Role checks using `hasRbacAccess()`
- `convex/deals.ts` - Admin checks using WorkOS identity

### Documentation
- `AGENTS.md` - Architecture principles
- `CLAUDE.md` - Auth guidelines
- `openspec/changes/introduce-investor-onboarding-flow/` - Onboarding spec

---

## Conclusion

This bug represents a fundamental architectural violation where auth decisions are being made based on Convex DB state rather than WorkOS identity data. The fix is straightforward: check the user's WorkOS role before checking Convex journey state.

**Priority**: Critical - This affects admin access and violates security principles.

**Effort**: Low - Single component fix with proper role checking logic.

**Risk**: Low - Fix aligns with existing patterns used throughout the Convex functions.
