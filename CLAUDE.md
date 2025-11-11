# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack TypeScript application that combines Convex as the backend, Next.js as the frontend framework, and WorkOS AuthKit for authentication. The project uses modern React patterns with TypeScript, Tailwind CSS for styling, and includes comprehensive testing setup with Vitest and Playwright.

## Development Commands

### Essential Development Commands

```bash
# Start full development environment (frontend + backend)
pnpm run dev

# Start only frontend
pnpm run dev:frontend

# Start only backend (Convex)
pnpm run dev:backend

# Initial setup - starts Convex and opens dashboard
pnpm run predev
```

### Build and Deployment

```bash
# Build for production
pnpm run build

# Start production server
pnpm run start
```

### Testing Commands

```bash
# Run unit tests in watch mode
pnpm run test

# Run unit tests once
pnpm run test:once

# Run tests with coverage
pnpm run test:coverage

# Debug tests
pnpm run test:debug

# Run E2E tests
pnpm run e2e

# Run E2E tests with UI
pnpm run e2e:ui
```

### Code Quality

```bash
# Lint code
pnpm run lint

# Format code
pnpm run format

# Run all checks (lint + format)
pnpm run check

# Type checking
pnpm run check-types

# Generate TypeScript types
pnpm run tsgo
```

### Storybook

```bash
# Start Storybook development server
pnpm run storybook

# Build Storybook
pnpm run build-storybook
```

## Architecture Overview

### Core Stack

- **Backend**: Convex (database + serverless functions)
- **Frontend**: Next.js 15 with App Router
- **Authentication**: WorkOS AuthKit with redirect-based flow
- **Styling**: Tailwind CSS v4
- **UI Components**: HeroUI (custom NextUI fork) + Radix UI primitives
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Linting/Formatting**: Biome
- **Logging**: Custom centralized logging with Pino

### Key Architectural Patterns

#### Authentication Flow
- WorkOS AuthKit handles authentication via redirect-based flow
- Middleware (`middleware.ts`) protects routes and manages session state
- `ConvexClientProvider` bridges WorkOS auth with Convex authentication
- Unauthenticated paths: `/`, `/sign-in`, `/sign-up`

#### Client-Side Data Fetching with Authentication
**⚠️ CRITICAL: For REACTIVE data with AUTH, use reactive client-side queries (NOT preload patterns)**

**✅ CORRECT: Reactive Auth Query Pattern**

**Client Component:**
```typescript
"use client";
import { useConvexAuth } from "convex/react";
import { useAuthenticatedQuery } from "@/convex/lib/client";
import { api } from "@/convex/_generated/api";

export function ProfileComponent() {
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
  const profile = useAuthenticatedQuery(api.users.getProfile, {});

  // Always check authLoading FIRST (prevents race condition)
  if (authLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <SignInPrompt />;
  if (!profile) return <LoadingData />;

  return <ProfileCard {...profile} />;
}
```

**Key Points:**
- Use `useAuthenticatedQuery` or `useAuthenticatedQueryWithStatus` from `@/convex/lib/client`
- Always check `authLoading` from `useConvexAuth()` before rendering
- Query automatically skips when not authenticated
- Data updates reactively when auth state changes
- Allows static rendering (better performance)

**❌ ANTI-PATTERN: Preloading Authenticated Data**

**DO NOT use this pattern for authenticated data:**
```typescript
// ❌ WRONG - Prevents static rendering, stale data
// Server Component
export default async function Page() {
  const { accessToken } = await withAuth();
  const preloaded = await preloadQuery(
    api.users.getProfile,
    {},
    { token: accessToken }
  );
  return <Client preloaded={preloaded} />;
}

// Client Component
"use client";
function Client({ preloaded }) {
  const data = usePreloadedQuery(preloaded); // ⚠️ WRONG!
  return <div>{data.email}</div>;
}
```

**Why This Fails:**
- Prevents Next.js static optimization (forces dynamic rendering)
- Data frozen at server render time
- Doesn't react to auth changes (logout, refresh)
- Creates security vulnerability (stale auth data)

**When to Use Preloading:**
- Only for truly public/unauthenticated data
- Never use `preloadQuery` with `accessToken` for authenticated content

#### Convex Data Fetching Patterns: Complete Guide

Convex provides three distinct patterns for fetching data in Next.js applications. **Understanding when to use each is critical** for performance, security, and user experience.

##### Pattern 1: `fetchQuery` - One-Time Server Fetching

**Use for:**
- Server-side rendering (SSR) of metadata (`generateMetadata`)
- One-time data fetching where real-time updates aren't needed
- API routes that need direct data access without reactivity

**Behavior:**
- ❌ No client-side caching
- ❌ No reactive updates
- ✅ Fetches data once on server and returns it
- ✅ Fast for SSR/metadata generation
- ❌ Data becomes stale immediately after render

**Example:**
```typescript
// Server Component - metadata generation
export async function generateMetadata({ params }: { params: { id: string } }) {
  const { accessToken } = await withAuth();
  const data = await fetchQuery(
    api.mortgages.getMortgage,
    { id: params.id as Id<"mortgages"> },
    { token: accessToken }
  );

  return { title: data?.title || "Listing" };
}
```

**Next.js CDN Caching:**
- ❌ **No HTML caching** - Dynamic, user-specific content renders per request
- ✅ Static assets (JS, CSS, images) still cached
- ✅ Browser caching of resources still applies

**Performance Trade-off:**
- Pros: Always fresh data at render time, user-specific, no stale data risks
- Cons: Higher server costs, slower TTFB, no CDN benefit for HTML, no reactivity

---

##### Pattern 2: `preloadQuery` + `usePreloadedQuery` - Server Preload with Client Reactivity

**Use for:**
- Public/unauthenticated data that benefits from SSR preload
- Content that needs fast initial render AND reactive updates
- Static or semi-static data (e.g., marketing pages, public listings)
- **Good for: Initial speed + client-side reactivity**

**Behavior:**
- ✅ Preloads data server-side for instant initial render
- ✅ Becomes fully reactive on client (updates when data changes)
- ✅ Combines SSR speed with client-side reactivity
- ❌ Not suitable for authenticated data (security risk)

**Example:**
```typescript
// Server Component - public data only
export default async function PublicPage() {
  const preloaded = await preloadQuery(api.publicData.getList, {});
  return <ClientComponent preloaded={preloaded} />;
}

// Client Component
"use client";
function ClientComponent({ preloaded }) {
  const data = usePreloadedQuery(preloaded);
  // Data is reactive - updates when backend changes!
  return <div>{data?.map(item => <span key={item.id}>{item.name}</span>)}</div>;
}
```

**Next.js CDN Caching:**
- ✅ **Can leverage CDN caching** - If data is truly public
- ✅ Set `export const revalidate = 3600` for ISR
- ✅ Static assets fully cached

**Performance Trade-off:**
- Pros: Fast initial load, reactive updates, can use CDN caching
- Cons: Security risk for authenticated data, still dynamic HTML

---

##### Pattern 3: `useQuery` / `useAuthenticatedQuery` - Pure Client-Side Reactive

**Use for:**
- Authenticated user data that needs real-time updates
- Data that changes based on user actions
- Dashboard components, user profiles, live data
- **This is the DEFAULT for authenticated user data**

**Behavior:**
- ✅ Full client-side caching and reactive updates
- ✅ Real-time data synchronization
- ✅ Updates when underlying data changes
- ✅ Best user experience for authenticated data
- ✅ Client-side only (good for static rendering)

**Example:**
```typescript
"use client";
import { useAuthenticatedQuery } from "@/convex/lib/client";
import { useConvexAuth } from "convex/react";

function AuthenticatedComponent() {
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
  const data = useAuthenticatedQuery(api.userData.getDashboard, {});

  if (authLoading) return <Spinner />;
  if (!isAuthenticated) return <SignIn />;
  if (!data) return <LoadingData />;

  return <div>{data.recentItems}</div>;
}
```

**Next.js CDN Caching:**
- ❌ **No HTML caching** - Dynamic, user-specific content
- ✅ Static assets fully cached
- ✅ Enables static page rendering with client-side data fetching

**Performance Trade-off:**
- Pros: Always fresh, reactive updates, best UX for authenticated users, enables static rendering
- Cons: Requires client hydration, requires careful auth loading states

---

##### Pattern Selection Guide

| Pattern | SSR Preload | Client Reactive | Cached? | CDN Cached? | Security | Use Case |
|---------|-------------|-----------------|---------|-------------|----------|----------|
| `fetchQuery` | ✅ Yes | ❌ No | ❌ No | ❌ No | ✅ Safe | SSR, metadata, one-time fetch |
| `preloadQuery` | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ❌ Unsafe for auth | Public data with reactivity |
| `useAuthenticatedQuery` | ❌ No | ✅ Yes | ✅ Yes | ❌ No | ✅ Safe | **Default for user data** |

**Decision Tree:**
1. **Is the data authenticated/user-specific?**
   - Yes → Use `useAuthenticatedQuery` (Pattern 3)
   - No → Continue to 2

2. **Do you need SSR preloading for performance?**
   - Yes → Use `preloadQuery` + `usePreloadedQuery` (Pattern 2) - only for public data
   - No → Use `fetchQuery` if one-time, or `useAuthenticatedQuery` if reactive (Pattern 1 or 3)

3. **Is this for metadata generation?**
   - Yes → Use `fetchQuery` (Pattern 1)

**Summary:**
- **For authenticated user data → Always use `useAuthenticatedQuery`** (pure client-side reactive)
- **For public data needing SSR + reactivity → Use `preloadQuery`** (server preload + client reactive)
- **For SSR/metadata (one-time) → Use `fetchQuery`** (one-time server fetch)

**Key Insight:**
- Patterns 2 and 3 both provide reactive updates on the client
- Pattern 2 preloads server-side for faster initial render, then becomes reactive
- Pattern 3 is purely client-side from the start
- **For authenticated data, Pattern 3 is required for security (no server-side token preloading)**

#### Data Flow
- Convex schema defined in `convex/schema.ts` with 6 core tables:
  - `mortgages` - Core loan + property records with borrower reference
  - `borrowers` - Minimal borrower profiles with Rotessa integration
  - `mortgage_ownership` - Cap table tracking fractional ownership (100% invariant enforced)
  - `listings` - Marketplace visibility and lock state for mortgages
  - `appraisal_comparables` - Comparable property data linked to appraisals
  - `payments` - Payment history tracking (interest-only, Rotessa-integrated)
- Server functions in `convex/` directory handle all backend logic
- Client components use `useAuth()` and `useAccessToken()` hooks from AuthKit
- All data queries go through Convex's reactive query system
- **100% Ownership Invariant**: Every mortgage has exactly 100% ownership, with FairLend as the default remainder owner

#### Convex Best Practices
- **Always consult `.cursor/rules/convex_rules.mdc`** for Convex development patterns and guidelines
- **Use `authQuery`, `authMutation`, `authAction` from `convex/lib/server.ts`** for all authenticated functions - These automatically enforce authentication and provide RBAC context
- **Use `useAuthenticatedQuery` or `useAuthenticatedQueryWithStatus` from `convex/lib/client.ts`** for all authenticated client-side queries
- **Never use `preloadQuery` with authentication tokens** - Use reactive client-side queries instead
- **RBAC context is automatically available** - When using `authQuery`/`authMutation`/`authAction`, access `ctx.role`, `ctx.roles`, `ctx.permissions`, `ctx.org_id` directly without calling `ctx.auth.getUserIdentity()`
- Follow the new Convex function syntax with `args` and `returns` validators
- Use the OpenSpec spec-driven development workflow for all new features
- Leverage the 100% ownership invariant when working with mortgage ownership operations

**Backend Authentication Pattern:**
```typescript
import { authQuery } from "./lib/server";
import { v } from "convex/values";

export const getProfile = authQuery({
  args: {},
  returns: v.object({ name: v.string(), role: v.string() }),
  handler: async (ctx) => {
    // RBAC context automatically available:
    const { role, roles, permissions, org_id } = ctx;
    
    // Check permission before proceeding
    if (!permissions?.includes("read:profile")) {
      throw new Error("Permission denied");
    }
    
    return { name: ctx.first_name, role: ctx.role };
  }
});
```

**Frontend Authentication Pattern:**
```typescript
"use client";
import { useConvexAuth } from "convex/react";
import { useAuthenticatedQuery } from "@/convex/lib/client";
import { api } from "@/convex/_generated/api";

function MyComponent() {
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
  const data = useAuthenticatedQuery(api.myFunction.getData, {});
  
  if (authLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <SignInPrompt />;
  if (!data) return <LoadingData />;
  
  return <DataDisplay data={data} />;
}
```

#### Logging Architecture
- Centralized logging system with adapter pattern
- Server: Pino-based structured logging with pretty output in dev
- Client: Batching adapter that posts to `/api/logs`
- Convex: Lightweight shim writing to stdout
- Environment: `LOG_LEVEL`, `LOG_PRETTY`, `LOG_SERVICE_NAME`

#### Toast Notifications
- **Sonner** is used for all toast notifications (NOT `use-toast` hook)
- Import from `sonner`: `import { toast } from "sonner"`
- Usage: `toast.success("Message")`, `toast.error("Message")`, `toast.info("Message")`
- Toaster component is already configured in the app layout with custom icons
- Never create or import `@/hooks/use-toast` - use `sonner` directly

#### React Compiler Optimization
- **This project uses React Compiler for automatic performance optimization**
- **DO NOT manually use `useMemo` or `useCallback`** - React Compiler handles this automatically
- Write plain functions and let the compiler optimize them
- Remove dependency arrays - React Compiler tracks dependencies automatically
- Benefits:
  - ✅ Automatic memoization of expensive computations
  - ✅ Automatic dead code elimination
  - ✅ Automatic state transition tracking
  - ✅ Cleaner, more readable code
  - ✅ Better performance than manual optimization

**Example - DON'T DO THIS (Manual Optimization):**
```typescript
// ❌ Manual optimization - NOT needed with React Compiler
const derivedData = useMemo(() => {
  return expensiveComputation(data);
}, [data]);

const handleClick = useCallback((id: string) => {
  doSomething(id);
}, [doSomething]);
```

**Example - DO THIS (React Compiler):**
```typescript
// ✅ Let React Compiler handle optimization automatically
function getDerivedData(data: typeof userData) {
  return expensiveComputation(data);
}

function handleClick(id: string) {
  doSomething(id);
}
```

### Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   └── (auth)/            # Authenticated route groups
├── components/            # React components
├── convex/               # Convex backend (schema + functions)
│   ├── schema.ts         # Database schema with 6 tables
│   ├── mortgages.ts      # Mortgage operations
│   ├── borrowers.ts      # Borrower profiles
│   ├── ownership.ts      # Ownership cap table (100% invariant)
│   ├── listings.ts       # Marketplace listings
│   ├── comparables.ts    # Appraisal comparables
│   └── payments.ts       # Payment history
├── lib/                  # Shared utilities and configurations
├── hooks/                # Custom React hooks
├── stories/              # Storybook stories
├── unit-tests/           # Unit test files
├── e2e/                  # Playwright E2E tests
├── docs/                 # Project documentation
└── openspec/             # Spec-driven development
    ├── AGENTS.md         # OpenSpec instructions
    ├── specs/            # Current specifications (6 capabilities)
    ├── changes/          # Active change proposals
    └── changes/archive/  # Completed changes
```

### Environment Setup

Copy `.env.local.example` to `.env.local` and configure:

1. **WorkOS Configuration**:
   - `WORKOS_CLIENT_ID`
   - `WORKOS_API_KEY`
   - `WORKOS_COOKIE_PASSWORD` (32+ characters)
   - `NEXT_PUBLIC_WORKOS_REDIRECT_URI` (e.g., `http://localhost:3000/callback`) - **Only needed for local development**
   - **Production:** `VERCEL_URL` is automatically set by Vercel, or set `NEXT_PUBLIC_SITE_URL` for custom domains

2. **Convex Configuration**:
   - `NEXT_PUBLIC_CONVEX_URL` (auto-added by `npx convex dev`)
   - `CONVEX_DEPLOYMENT` (for production)

3. **Logging Configuration**:
   - `LOG_LEVEL` (default: `info`)
   - `LOG_PRETTY` (default: `true` in development)
   - `LOG_SERVICE_NAME` (default: `convex-next-authkit`)

### Development Workflow

1. **Initial Setup**:
   ```bash
   pnpm install
   cp .env.local.example .env.local
   # Configure environment variables
   npx convex dev
   npx convex auth add workos
   ```

2. **Daily Development**:
   ```bash
   pnpm run dev  # Starts both frontend and backend
   ```

3. **Testing Workflow**:
   ```bash
   pnpm run test        # Run unit tests while developing
   pnpm run e2e         # Run E2E tests before commits
   pnpm run check-types # Type checking
   ```

### Key Integration Points

#### WorkOS + Convex Integration
- `components/ConvexClientProvider.tsx` bridges AuthKit with Convex
- Custom `useAuthFromAuthKit()` function provides Convex-compatible auth interface
- Token refresh handled automatically by AuthKit components

#### Middleware Protection
- `middleware.ts` implements route protection and request ID tracking
- Eager authentication mode redirects unauthenticated users to sign-in
- Request IDs automatically added to headers for log correlation

#### Logging Integration
- Import from `lib/logger.ts` everywhere (server, client, Convex)
- Use `logger.child()` for request-scoped context
- Client logs automatically forwarded to server logging infrastructure

## Important Notes

- This is a WorkOS AuthKit template with automatic provisioning enabled
- **Convex database**: Full schema with 6 tables (mortgages, borrowers, ownership, listings, comparables, payments)
- All authentication state management is handled by AuthKit
- **100% Ownership Invariant**: Every mortgage has exactly 100% ownership; FairLend owns remainder by default
- **Spec-driven development**: All new features require OpenSpec change proposals - see `openspec/AGENTS.md`
- Current specifications in `openspec/specs/` define the 6 core capabilities
- Logging is centralized and provider-agnostic for easy future migrations
- The project uses modern React patterns with TypeScript throughout
- THIS PROJECT USES proxy.ts instead of middleware.ts middleware.ts was depreciated as part of the move from NextJs15->16
- When working on an openspec change YOU MUST update the tasks file in openspec as you work. If you have to stop to stop to ask the usert to validate something do so.