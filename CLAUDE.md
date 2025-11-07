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

#### Server-Side Data Fetching with Authentication
For authenticated server components that need to preload Convex data, follow this pattern:

**Server Component (page.tsx):**
```typescript
import { withAuth } from "@workos-inc/authkit-nextjs";
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export default async function Page() {
  const { accessToken } = await withAuth();

  // Preload query with auth token
  const preloaded = await preloadQuery(
    api.yourFunction.queryName,
    { /* args */ },
    { token: accessToken }  // CRITICAL: Pass token for authentication
  );

  return <ClientComponent preloaded={preloaded} />;
}
```

**Client Component:**
```typescript
"use client";
import { type Preloaded, usePreloadedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

type Props = {
  preloaded: Preloaded<typeof api.yourFunction.queryName>;
};

export function ClientComponent({ preloaded }: Props) {
  const data = usePreloadedQuery(preloaded);
  // Use data...
}
```

**Key Points:**
- Server: Use `withAuth()` to get `accessToken`
- Server: Pass `{ token: accessToken }` as third argument to `preloadQuery`
- Client: Import `Preloaded` and `usePreloadedQuery` from `convex/react`
- Client: Use `usePreloadedQuery()` hook with preloaded data
- Client: Type preloaded prop as `Preloaded<typeof api.yourFunction.queryName>`

See [app/server/page.tsx](app/server/page.tsx) and [app/(auth)/listings/page.tsx](app/(auth)/listings/page.tsx) for examples.

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
- **Use `ctx.auth.getUserIdentity()` for all user role/permission checks** - WorkOS is the source of truth for authentication and authorization
- Follow the new Convex function syntax with `args` and `returns` validators
- Use the OpenSpec spec-driven development workflow for all new features
- Leverage the 100% ownership invariant when working with mortgage ownership operations

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
   - `NEXT_PUBLIC_WORKOS_REDIRECT_URI` (e.g., `http://localhost:3000/callback`)

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