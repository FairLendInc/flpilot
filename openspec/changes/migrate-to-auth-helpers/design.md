## Context

The application uses WorkOS AuthKit for authentication with Convex as the backend. Previously, authentication was handled inconsistently:
- Some backend functions manually checked `ctx.auth.getUserIdentity()`
- Some functions had no auth checks at all
- Frontend used `useQuery` without auth-gating
- Server components used `preloadQuery` with auth tokens (anti-pattern)

This created:
1. **Security vulnerabilities**: Race conditions where queries execute before auth completes
2. **Stale data**: Preloaded data doesn't react to auth changes (logout, token refresh)
3. **Inconsistent patterns**: Different auth checks in different places
4. **Missing RBAC**: No automatic access to WorkOS roles/permissions

## Goals / Non-Goals

### Goals
- Migrate all authenticated backend functions to use `authQuery`/`authMutation`/`authAction`
- Migrate all authenticated frontend queries to use `useAuthenticatedQuery`/`useAuthenticatedQueryWithStatus`
- Remove all `preloadQuery` usage for authenticated data
- Ensure consistent authentication enforcement across the app
- Provide automatic RBAC context to all authenticated functions

### Non-Goals
- Changing the authentication provider (staying with WorkOS)
- Modifying the RBAC system itself (only exposing it consistently)
- Migrating unauthenticated/public functions (they remain as-is)
- Performance optimizations beyond removing preloading anti-pattern

## Decisions

### Decision: Use `authQuery` wrapper instead of manual checks
**Rationale**: The `authQuery` wrapper from `convex-helpers` automatically enforces authentication and extends context with RBAC data. This eliminates manual `getUserIdentity()` calls and ensures consistency.

**Alternatives considered**:
- Manual checks in each function: More boilerplate, error-prone, inconsistent
- Custom middleware: More complex, harder to maintain

### Decision: Use `useAuthenticatedQuery` for standard cases, `useAuthenticatedQueryWithStatus` when needed
**Rationale**: `useAuthenticatedQuery` follows standard Convex patterns (`undefined` = loading). `useAuthenticatedQueryWithStatus` provides explicit status tracking for complex UIs that need granular error handling.

**Alternatives considered**:
- Always use status version: More boilerplate for simple cases
- Always use standard version: Missing error handling capabilities

### Decision: Remove preloading for authenticated data entirely
**Rationale**: Preloading authenticated data prevents static rendering, creates stale data, and introduces security vulnerabilities. Reactive queries handle auth state changes properly.

**Alternatives considered**:
- Keep preloading for some cases: Maintains security issues and prevents reactivity
- Hybrid approach: Adds complexity without clear benefits

### Decision: Migrate incrementally by capability/feature area
**Rationale**: Large migrations are risky. Migrating by capability allows testing each area independently and reduces risk of breaking changes.

**Alternatives considered**:
- All-at-once migration: Higher risk, harder to test
- By file type: Less logical grouping, harder to validate

## Risks / Trade-offs

### Risk: Breaking changes for unauthenticated access
**Mitigation**: Audit all functions to identify which should remain public. Create explicit `publicQuery` wrapper if needed for truly public functions.

### Risk: Performance regression from removing preloading
**Mitigation**: Preloading actually hurts performance by preventing static rendering. Reactive queries are more efficient and allow Next.js optimizations.

### Risk: Migration complexity across many files
**Mitigation**: Use incremental migration strategy, test each capability area independently, maintain backward compatibility during transition if needed.

### Risk: TypeScript type errors during migration
**Mitigation**: The helpers maintain full type safety. Type errors indicate actual issues that need fixing, not migration problems.

## Migration Plan

### Phase 1: Backend Core Functions (Week 1)
1. Migrate `convex/profile.ts` queries/mutations
2. Migrate `convex/users.ts` queries/mutations
3. Migrate `convex/roles.ts` queries
4. Test authentication flows

### Phase 2: Backend Domain Functions (Week 2)
1. Migrate `convex/listings.ts` (all queries/mutations)
2. Migrate `convex/mortgages.ts` (all queries/mutations)
3. Migrate `convex/borrowers.ts` (all queries/mutations)
4. Test domain-specific flows

### Phase 3: Backend Supporting Functions (Week 3)
1. Migrate `convex/payments.ts`
2. Migrate `convex/comparables.ts`
3. Migrate `convex/ownership.ts`
4. Migrate `convex/lockRequests.ts`
5. Migrate `convex/deals.ts`
6. Migrate `convex/alerts.ts`
7. Migrate `convex/onboarding.ts`

### Phase 4: Frontend Migration (Week 4)
1. Migrate profile pages
2. Migrate listings pages
3. Migrate dashboard pages
4. Migrate admin pages
5. Remove all `preloadQuery` usage

### Phase 5: Testing & Validation (Week 5)
1. E2E tests for all authenticated flows
2. Verify RBAC context is available everywhere
3. Performance testing
4. Security audit

## Open Questions

- Should we create a `publicQuery` wrapper for truly public functions (like `getUserTheme`)?
- Do we need migration scripts for existing data that might reference old patterns?
- Should we add linting rules to prevent future use of `preloadQuery` with auth?

