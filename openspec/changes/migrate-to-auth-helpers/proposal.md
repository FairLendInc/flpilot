## Why

The application currently uses inconsistent authentication patterns across backend Convex functions and frontend React components. Some functions manually check authentication, some don't, and some use the anti-pattern of server-side preloading for authenticated data. This creates security vulnerabilities, race conditions, and prevents proper reactive data updates.

We've created standardized auth helpers (`authQuery`, `authMutation`, `authAction` in `convex/lib/server.ts` and `useAuthenticatedQuery`, `useAuthenticatedQueryWithStatus` in `convex/lib/client.ts`) that follow Convex best practices for preventing authentication race conditions. These helpers automatically enforce authentication, provide RBAC context, and prevent the security issues with preloading authenticated data.

## What Changes

- **Backend Migration**: All authenticated Convex functions (`query`, `mutation`, `action`) will be migrated to use `authQuery`, `authMutation`, `authAction` from `convex/lib/server.ts`
- **Frontend Migration**: All client-side `useQuery` calls requiring authentication will be migrated to `useAuthenticatedQuery` or `useAuthenticatedQueryWithStatus` from `convex/lib/client.ts`
- **Remove Preloading Anti-Pattern**: All server-side `preloadQuery` calls with authentication tokens will be replaced with reactive client-side queries
- **RBAC Context**: All migrated functions will have automatic access to WorkOS RBAC context (`role`, `roles`, `permissions`, `org_id`) without manual identity checks

**BREAKING**: This change modifies the API surface of all authenticated Convex functions. Functions that previously allowed unauthenticated access will now throw errors if called without authentication.

## Impact

- **Affected specs**: All capabilities that involve authenticated data access (listings, mortgages, borrowers, payments, comparables, ownership, admin-listing-creation, listing-detail)
- **Affected code**: 
  - Backend: All files in `convex/` directory with `query`, `mutation`, or `action` exports (~15 files, ~125 functions)
  - Frontend: All client components using `useQuery` or `preloadQuery` (~20+ files)
  - Server components: All pages using `preloadQuery` with auth tokens (~10 files)
- **Security**: Eliminates authentication race conditions and stale auth data vulnerabilities
- **Performance**: Enables static rendering where previously blocked by preloading, improves reactivity
- **Developer Experience**: Consistent auth patterns, automatic RBAC context, better TypeScript types

