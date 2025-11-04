# Project Context

## Purpose
This is a production-ready full-stack TypeScript application template that combines:
- **Convex** as the reactive backend database and serverless functions platform
- **Next.js 15** with App Router for the frontend framework
- **WorkOS AuthKit** for enterprise-grade authentication with redirect-based flow

The template provides automatic user provisioning, organization management, role-based access control (RBAC), and a comprehensive UI component library. It's designed as a starting point for building modern SaaS applications with enterprise authentication requirements.

## Tech Stack

### Core Framework
- **TypeScript 5** - Primary language for type safety across the entire stack
- **Next.js 16.0.0** - React framework with App Router
- **React 19.0.0** - UI library with React Compiler enabled
- **Convex 1.27.3** - Backend database + serverless functions with real-time reactivity

### Authentication & Authorization
- **WorkOS AuthKit 2.7.1** - Enterprise authentication with SAML, OAuth, MFA support
- **WorkOS Node SDK 7.71.0** - Server-side WorkOS integration
- **Auto-provisioning enabled** - Automatic user/org sync via webhooks

### UI & Styling
- **Tailwind CSS v4** - Utility-first CSS framework
- **HeroUI 3.0.0-alpha.35** - Custom NextUI fork for complex components
- **Radix UI** - Unstyled, accessible UI primitives (20+ components)
- **Framer Motion 12** - Animation library
- **Lucide React** - Icon library
- **next-themes** - Dark mode support

### Forms & Validation
- **React Hook Form 7.65.0** - Form state management
- **Zod 4.1.12** - Schema validation
- **@hookform/resolvers** - Integration between RHF and Zod

### Testing
- **Vitest 4.0.2** - Unit testing framework with coverage
- **Playwright 1.56.1** - End-to-end browser testing
- **convex-test** - Convex-specific testing utilities
- **@storybook/nextjs-vite** - Component development environment

### Code Quality
- **Biome 2.2.7** - Fast formatter and linter (ESLint + Prettier replacement)
- **TypeScript native preview** - Latest TypeScript features

### Logging & Observability
- **Pino 8.20.0** - Structured logging (server-side)
- **pino-pretty** - Pretty-printed logs in development
- Custom centralized logging system with adapters for server/client/Convex

### Additional Libraries
- **date-fns 4.1.0** - Date manipulation
- **cmdk** - Command palette component
- **sonner** - Toast notifications
- **recharts** - Charting library
- **mapbox-gl** - Interactive maps

## Project Conventions

### Code Style
**Formatting** (enforced by Biome):
- **Indentation**: Tabs (not spaces)
- **Quotes**: Double quotes for JavaScript/TypeScript
- **Line endings**: Auto-managed
- **Import organization**: Auto-sorted with Biome's source actions

**Naming Conventions**:
- **Files/Directories**: kebab-case (e.g., `user-profile.tsx`, `auth-helpers/`)
- **Components**: PascalCase (e.g., `UserProfile`, `AuthButton`)
- **Functions/Variables**: camelCase (e.g., `getUserData`, `isAuthenticated`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`, `API_TIMEOUT`)
- **Types/Interfaces**: PascalCase (e.g., `User`, `AuthConfig`)

**Disabled Linting Rules** (intentional):
- Magic numbers allowed (common in UI measurements)
- Nested ternaries allowed (for concise conditional rendering)
- Console statements allowed (centralized logging handles this)
- TypeScript `@ts-ignore` allowed (for edge cases)
- `any` type allowed (for gradual typing migration)

### Architecture Patterns

**Authentication Flow**:
- Redirect-based OAuth flow via WorkOS AuthKit
- Middleware (`proxy.ts`) protects routes automatically
- `ConvexClientProvider` bridges WorkOS auth tokens to Convex
- Unauthenticated paths: `/`, `/sign-in`, `/sign-up`
- Eager auth mode: redirects unauthenticated users immediately

**Data Layer**:
- Convex serves as both database and API layer
- Schema defined in `convex/schema.ts` with TypeScript validators
- Real-time reactive queries using Convex hooks
- Server functions in `convex/` directory (queries, mutations, actions)
- Generated types in `convex/_generated/` provide end-to-end type safety

**Frontend Architecture**:
- Next.js App Router with file-based routing
- Server Components by default, Client Components marked with `"use client"`
- Route groups for organization: `(auth)/`, `(public)/`
- API routes in `app/api/` for server-side operations

**Component Organization**:
- Shared components in `components/` directory
- Storybook stories in `stories/` directory
- UI primitives from Radix UI + HeroUI for complex components
- Custom hooks in `hooks/` directory

**Logging Architecture**:
- Centralized logging with adapter pattern in `lib/logger.ts`
- Server: Pino-based structured logging with pretty output in development
- Client: Batching adapter posts to `/api/logs` endpoint
- Convex: Lightweight shim writes to stdout
- Request ID tracking via middleware for log correlation
- Environment variables: `LOG_LEVEL`, `LOG_PRETTY`, `LOG_SERVICE_NAME`

**State Management**:
- Convex handles server state with reactive queries
- React Hook Form for form state
- React Context for global client state (theme, etc.)
- No Redux/Zustand - Convex reactivity handles most needs

### Testing Strategy

**Unit Testing** (Vitest):
- Test files in `unit-tests/` directory (separate from source)
- Run with `pnpm run test` (watch mode) or `pnpm run test:once`
- Coverage reports with `pnpm run test:coverage` (target: 80%+ coverage)
- Convex testing utilities for backend function testing
- Debug mode: `pnpm run test:debug` with Node inspector

**E2E Testing** (Playwright):
- Tests in `e2e/` directory
- Run with `pnpm run e2e` or `pnpm run e2e:ui` (interactive mode)
- Multi-browser testing (Chromium, Firefox, WebKit)
- Tests critical user journeys: auth flows, protected routes, data mutations

**Component Testing** (Storybook):
- Stories in `stories/` directory
- Run dev server: `pnpm run storybook` (port 6006)
- Accessibility testing with @storybook/addon-a11y
- Visual regression testing support

**Testing Principles**:
- Test behavior, not implementation
- Integration tests preferred over pure unit tests
- E2E tests for critical user paths only (slow but high value)
- Mock external services (WorkOS, Convex) in unit tests
- Use real services in E2E tests when possible

### Git Workflow

**Branching Strategy**:
- `main` branch is production-ready at all times
- Feature branches: `feature/description` or `feat/description`
- Bug fixes: `fix/description`
- Hotfixes: `hotfix/description`
- No direct commits to `main` - use pull requests

**Commit Conventions**:
- Follow conventional commits format: `type(scope): description`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Examples:
  - `feat(auth): add SSO login support`
  - `fix(api): handle null user profile gracefully`
  - `docs(readme): update environment setup instructions`

**Pre-commit Checks**:
- Type checking: `pnpm run check-types`
- Linting: `pnpm run lint`
- Formatting: `pnpm run format`
- Unit tests should pass: `pnpm run test:once`

## Domain Context

**Authentication & User Management**:
- WorkOS handles all authentication (passwords, OAuth, SAML, MagicLink)
- User data synced to Convex via webhooks (automatic provisioning)
- User schema includes: email, name, profile picture, WorkOS IDP ID
- Email verification status tracked
- Last sign-in timestamp for activity monitoring

**Organizations & Multi-tenancy**:
- Organization-based access control with WorkOS organizations
- Organizations have domains for automatic user assignment
- Organization memberships track user-org relationships
- Support for multiple organizations per user

**Role-Based Access Control (RBAC)**:
- Roles defined by slug identifiers (e.g., `admin`, `member`, `viewer`)
- Roles contain permissions arrays for fine-grained access control
- User-role junction table for many-to-many relationships
- Organization memberships can have primary role + multiple additional roles

**Data Model Relationships**:
- Users ↔ Organizations (many-to-many via organization_memberships)
- Users ↔ Roles (many-to-many via user_roles)
- Organizations ↔ Domains (one-to-many via organization_domains)
- All WorkOS entities indexed by their IDP IDs for efficient webhook processing

## Important Constraints

**Technical Constraints**:
- **Convex schema is optional** - The app works without a schema, but schemas provide better TypeScript types
- **WorkOS redirect flow required** - No custom UI for login forms, WorkOS handles auth pages
- **Edge runtime compatibility** - Middleware runs on Edge, must use Edge-compatible APIs
- **React 19 features** - Uses React Compiler and modern patterns, may not work with older React ecosystems

**Environment Requirements**:
- Node.js 18+ required
- `NEXT_PUBLIC_WORKOS_REDIRECT_URI` must be set (e.g., `http://localhost:3000/callback`)
- `WORKOS_CLIENT_ID` and `WORKOS_API_KEY` from WorkOS dashboard
- `WORKOS_COOKIE_PASSWORD` must be 32+ characters for session encryption
- `NEXT_PUBLIC_CONVEX_URL` auto-generated by `npx convex dev`

**Authentication Constraints**:
- **Auto-provisioning enabled** - Users/orgs automatically synced from WorkOS webhooks
- **Eager auth mode** - Unauthenticated users immediately redirected to sign-in
- **Token refresh** - AuthKit handles refresh automatically, custom logic discouraged
- **Session management** - Encrypted cookies managed by WorkOS AuthKit, don't roll your own

**Deployment Constraints**:
- Vercel recommended for Next.js deployment
- Convex deployment separate from frontend (managed via Convex CLI)
- Environment variables must be configured in both platforms
- Webhook URLs must be publicly accessible for WorkOS integration

## External Dependencies

**WorkOS** (Authentication & Organization Management):
- **Service**: Enterprise-grade authentication platform
- **API Docs**: https://workos.com/docs
- **Dashboard**: https://dashboard.workos.com
- **Integration**: Webhook-based user/org sync, OAuth redirects
- **Critical APIs**: AuthKit, Organizations, Directory Sync, Admin Portal

**Convex** (Backend Database & Serverless Functions):
- **Service**: Reactive backend-as-a-service
- **API Docs**: https://docs.convex.dev
- **Dashboard**: Access via `npx convex dashboard`
- **Integration**: Real-time queries, serverless functions, file storage
- **Critical Features**: Schema validation, reactive queries, generated TypeScript types

**Vercel** (Recommended Frontend Hosting):
- **Service**: Next.js deployment platform
- **Docs**: https://vercel.com/docs
- **Integration**: Git-based deployments, edge functions, environment variables
- **Configuration**: Zero-config Next.js support

**External Services Not Yet Integrated** (but template-ready):
- Email delivery (for transactional emails)
- Payment processing (Stripe/WorkOS Payments)
- Analytics/monitoring (Vercel Analytics, Sentry)
- CDN for static assets (handled by Vercel/Next.js)

**Development Tools**:
- **Biome**: https://biomejs.dev - Linting and formatting
- **Vitest**: https://vitest.dev - Unit testing
- **Playwright**: https://playwright.dev - E2E testing
- **Storybook**: https://storybook.js.org - Component development
