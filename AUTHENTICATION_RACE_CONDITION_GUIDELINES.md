# Authentication Race Condition Prevention Guidelines

## Executive Summary

**Issue**: Authentication race condition in Next.js + Convex + WorkOS AuthKit integration where client components attempt to query Convex before authentication tokens are available.

**Error**: `Uncaught Error: Authentication required` at `convex/mortgages.ts:315`

**Impact**: Occurs on rapid page reloads, causing failed authenticated queries

**Solution**: Use the server component pattern with `withAuth()` + `preloadQuery()` for all authenticated data fetching

---

## Root Cause Analysis

### The Race Condition Sequence

1. **Page Mount**: `app/(auth)/dashboard/admin/mortgages/manage/page.tsx` (client component) renders
2. **Immediate Query**: `useQuery(api.mortgages.listAllMortgagesWithBorrowers)` executes
3. **Convex Request**: Convex client sends request to backend
4. **Auth Check**: `ctx.auth.getUserIdentity()` is called in Convex function
5. **Token Missing**: No token was provided (still loading from WorkOS)
6. **Error Thrown**: "Authentication required" at `convex/mortgages.ts:315`

### Why It Happens

**WorkOS AuthKit Loading Flow** (from `components/ConvexClientProvider.tsx:26-61`):

```typescript
export function useAuthFromAuthKit() {
  const { user } = useAuth();  // ← User is asynchronously loaded
  const accessToken = useAccessToken();  // ← Depends on user

  const fetchAccessToken = useCallback(async () => {
    if (!user) return null;  // ← Returns null while user is loading
    // ... fetch token logic
  }, [user]);
}
```

On **rapid page reloads**, the timing issue becomes critical:
- The component mounts before WorkOS finishes loading the user session
- `useQuery` fires immediately
- No token is available
- Query fails

---

## Prevention Guidelines

### Rule 1: Use Server Components for Authenticated Data Fetching ✅

**ALWAYS** fetch authenticated Convex data in server components using the official pattern.

#### ✅ Correct Pattern (Server Component)

```typescript
// app/(auth)/dashboard/admin/mortgages/manage/page.tsx
import { withAuth } from "@workos-inc/authkit-nextjs";
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import ClientComponent from "./ClientComponent";

export default async function AdminMortgagesManagePage() {
  // Server-side: Get authenticated access token
  const { accessToken } = await withAuth();

  // Server-side: Preload query with auth token
  const preloaded = await preloadQuery(
    api.mortgages.listAllMortgagesWithBorrowers,
    {},
    { token: accessToken }  // CRITICAL: Pass token for authentication
  );

  // Pass preloaded data to client component
  return <ClientComponent preloaded={preloaded} />;
}
```

#### ❌ Incorrect Pattern (Direct Client Query)

```typescript
// DON'T DO THIS - Causes race condition
export default function AdminMortgagesManagePage() {
  const allMortgages = useQuery(api.mortgages.listAllMortgagesWithBorrowers);
  // ...
}
```

### Rule 2: Use `usePreloadedQuery` in Client Components

Client components should consume preloaded data, not make direct queries.

#### ✅ Client Component Pattern

```typescript
// app/(auth)/dashboard/admin/mortgages/manage/ClientComponent.tsx
"use client";

import { type Preloaded, usePreloadedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

type Props = {
  preloaded: Preloaded<typeof api.mortgages.listAllMortgagesWithBorrowers>;
};

export function ClientComponent({ preloaded }: Props) {
  // Use preloaded query - no race condition
  const allMortgages = usePreloadedQuery(preloaded);

  return (
    <div>
      {/* Render UI with allMortgages */}
    </div>
  );
}
```

### Rule 3: Never Mix Server and Client Data Fetching

Don't attempt to fetch data in both server and client components for the same feature.

#### ❌ Anti-Pattern: Double Fetching

```typescript
// DON'T DO THIS
export default async function Page() {
  const { accessToken } = await withAuth();
  const serverData = await preloadQuery(api.data.getData, {});
  return <ClientComponent serverData={serverData} />;
}

function ClientComponent({ serverData }: Props) {
  const clientData = useQuery(api.data.getData);  // Race condition!
  // ...
}
```

### Rule 4: Handle Loading States Properly

If you must use client-side queries (not recommended), implement proper loading checks.

#### ⚠️ Acceptable Workaround (Not Recommended)

```typescript
export default function AdminMortgagesManagePage() {
  const { isLoading } = useAuth();  // Wait for auth to be ready

  // Skip query while loading
  const allMortgages = useQuery(
    isLoading ? "skip" : api.mortgages.listAllMortgagesWithBorrowers
  );

  if (isLoading || allMortgages === undefined) {
    return <LoadingSpinner />;
  }

  return <div>{/* Render UI */}</div>;
}
```

**Note**: Even with this workaround, rapid reloads can still cause issues. Server component pattern is strongly preferred.

---

## Implementation Checklist

When creating new pages with authenticated Convex queries, verify:

- [ ] Page is a **server component** (no `"use client"` directive at top)
- [ ] Uses `withAuth()` to get `accessToken` on the server
- [ ] Passes `{ token: accessToken }` to `preloadQuery()`
- [ ] Client component receives `Preloaded<T>` type
- [ ] Client component uses `usePreloadedQuery(preloaded)` to consume data
- [ ] No direct `useQuery` calls in server component pages

---

## Existing Examples in Codebase

### ✅ Good Examples (Server Component Pattern)

1. **`app/(auth)/listings/[id]/page.tsx`** - Uses `withAuth()` + `preloadQuery()` pattern
2. **`app/(auth)/listings/page.tsx`** - Another example of proper implementation

### ❌ Bad Examples (Client Component with Direct Query)

1. **`app/(auth)/dashboard/admin/mortgages/manage/page.tsx`** - Current broken implementation
   - Line 22: `const allMortgages = useQuery(...)` without waiting for auth
   - Causes: "Authentication required" error on rapid reloads

---

## Convex Best Practices Reference

Based on official Convex documentation (`convex_rules.mdc` lines 318-403):

### Server Component Data Fetching

```typescript
import { withAuth } from "@workos-inc/authkit-nextjs";
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export default async function ServerPage() {
  const { accessToken } = await withAuth();

  const preloaded = await preloadQuery(
    api.myFunctions.listData,
    {},
    { token: accessToken }
  );

  return <ClientComponent preloaded={preloaded} />;
}
```

### Client-Side Preloaded Query Consumption

```typescript
"use client";

import { type Preloaded, usePreloadedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function ClientComponent({
  preloaded,
}: {
  preloaded: Preloaded<typeof api.myFunctions.listData>;
}) {
  const data = usePreloadedQuery(preloaded);
  // ... use data
}
```

### Key Points from Official Docs

- **Server-side**: Use `preloadQuery` with optional authentication token
- **Client-side**: Use `usePreloadedQuery` to consume the preloaded data
- **Type safety**: `Preloaded<T>` generic type ensures type safety between server and client
- **Performance**: Data is fetched on the server and hydrated on the client
- **Reactivity**: Client components remain reactive even when using preloaded data

---

## Additional Resources

- **Convex Auth Interface**: `ctx.auth.getUserIdentity()` returns `null` if no user authenticated
- **WorkOS AuthKit**: Handles session management and token refresh automatically
- **Next.js App Router**: Server components execute on the server before client hydration

---

## Fixing the Current Issue

To fix `app/(auth)/dashboard/admin/mortgages/manage/page.tsx`:

1. Convert the page to a server component
2. Use `withAuth()` to get the access token
3. Use `preloadQuery()` with the token
4. Create a separate client component to consume the preloaded data
5. Pass the preloaded data via props

This follows the established pattern used successfully in other pages like `app/(auth)/listings/[id]/page.tsx`.

---

## Testing Recommendations

1. **Rapid Reload Test**: Reload the page multiple times quickly to check for race conditions
2. **Network Throttling**: Test with slow network to amplify timing issues
3. **Cold Cache**: Test with empty browser cache to simulate fresh loads
4. **Concurrent Navigation**: Navigate between pages rapidly while queries are loading

---

## Summary

The authentication race condition is a **well-known pattern** in Next.js applications with async authentication. The solution is straightforward:

**Server components for data fetching + Client components for rendering = No race conditions**

This pattern is officially documented by Convex and is the recommended approach for all authenticated queries in Next.js applications.
