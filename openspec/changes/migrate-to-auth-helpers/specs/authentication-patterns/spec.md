## ADDED Requirements

### Requirement: Backend Authentication Enforcement

All Convex backend functions that require authentication SHALL use the standardized auth helpers (`authQuery`, `authMutation`, `authAction`) from `convex/lib/server.ts` instead of manual authentication checks.

#### Scenario: Query function requires authentication
- **WHEN** a backend query function requires user authentication
- **THEN** it SHALL use `authQuery` wrapper instead of `query`
- **AND** authentication SHALL be automatically enforced before handler execution
- **AND** RBAC context (role, roles, permissions, org_id) SHALL be automatically available in the handler context

#### Scenario: Mutation function requires authentication
- **WHEN** a backend mutation function requires user authentication
- **THEN** it SHALL use `authMutation` wrapper instead of `mutation`
- **AND** authentication SHALL be automatically enforced before handler execution
- **AND** RBAC context SHALL be automatically available in the handler context

#### Scenario: Action function requires authentication
- **WHEN** a backend action function requires user authentication
- **THEN** it SHALL use `authAction` wrapper instead of `action`
- **AND** authentication SHALL be automatically enforced before handler execution
- **AND** RBAC context SHALL be automatically available in the handler context

#### Scenario: Unauthenticated access to protected function
- **WHEN** an unauthenticated user attempts to call an authenticated function
- **THEN** the function SHALL throw an error with message "Not authenticated!"
- **AND** the function SHALL not execute its handler logic

### Requirement: Frontend Authentication-Aware Queries

All client-side React components that query authenticated data SHALL use the standardized authenticated query hooks (`useAuthenticatedQuery`, `useAuthenticatedQueryWithStatus`) from `convex/lib/client.ts` instead of standard `useQuery`.

#### Scenario: Component queries authenticated data
- **WHEN** a client component needs to query data that requires authentication
- **THEN** it SHALL use `useAuthenticatedQuery` or `useAuthenticatedQueryWithStatus` instead of `useQuery`
- **AND** the query SHALL automatically skip execution when user is not authenticated
- **AND** the query SHALL automatically resume when user becomes authenticated

#### Scenario: Component checks authentication state
- **WHEN** a component uses authenticated queries
- **THEN** it SHALL check `authLoading` from `useConvexAuth()` before rendering
- **AND** it SHALL handle the loading state appropriately
- **AND** it SHALL handle the unauthenticated state appropriately

### Requirement: Reactive Data Loading for Authenticated Content

The system SHALL use reactive client-side queries for all authenticated data instead of server-side preloading.

#### Scenario: Server component needs authenticated data
- **WHEN** a server component needs authenticated data
- **THEN** it SHALL NOT use `preloadQuery` with authentication tokens
- **AND** it SHALL pass data loading to a client component
- **AND** the client component SHALL use `useAuthenticatedQuery` or `useAuthenticatedQueryWithStatus`

#### Scenario: Page requires authenticated data
- **WHEN** a page requires authenticated data
- **THEN** it SHALL use client components with reactive queries
- **AND** it SHALL NOT use `preloadQuery` with `accessToken`
- **AND** data SHALL update reactively when authentication state changes

#### Scenario: Preloading prevents reactivity
- **WHEN** authenticated data is preloaded on the server
- **THEN** the data SHALL be frozen at server render time
- **AND** the data SHALL NOT update when authentication state changes
- **AND** the page SHALL be forced into dynamic rendering mode
- **AND** this pattern SHALL be considered an anti-pattern

### Requirement: RBAC Context Availability

All authenticated backend functions SHALL have automatic access to WorkOS RBAC context without manual identity checks.

#### Scenario: Function needs user role
- **WHEN** an authenticated function needs to check user role
- **THEN** it SHALL access `ctx.role` directly without calling `ctx.auth.getUserIdentity()`
- **AND** the role SHALL be automatically populated from WorkOS identity

#### Scenario: Function needs permissions
- **WHEN** an authenticated function needs to check permissions
- **THEN** it SHALL access `ctx.permissions` directly
- **AND** permissions SHALL be automatically populated from WorkOS identity
- **AND** permissions SHALL be an array of permission strings

#### Scenario: Function needs organization context
- **WHEN** an authenticated function needs organization context
- **THEN** it SHALL access `ctx.org_id` directly
- **AND** org_id SHALL be automatically populated from WorkOS identity

