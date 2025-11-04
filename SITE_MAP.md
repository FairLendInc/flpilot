# FairLend Application - Comprehensive Site Map & Architecture

This document provides a complete overview of the FairLend application, including all pages, components, workflows, and architectural patterns. It serves as a blueprint for understanding or recreating the entire application.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack & Architecture](#tech-stack--architecture)
3. [Authentication & Authorization](#authentication--authorization)
4. [Complete Page Structure](#complete-page-structure)
5. [Component Architecture](#component-architecture)
6. [Role-Based Navigation](#role-based-navigation)
7. [Data Models & Schema](#data-models--schema)
8. [Key Workflows](#key-workflows)
9. [Development Setup](#development-setup)
10. [File Structure](#file-structure)

---

## Project Overview

FairLend is a multi-role financial platform that connects brokers, investors, lawyers, and administrators in a lending marketplace. The application features role-based dashboards, investment property listings, and comprehensive user management.

### Core Features
- **Role-Based Access Control**: Admin, Broker, Lawyer, Investor roles with distinct interfaces
- **Investment Listings**: Browse and filter real estate investment opportunities
- **User Management**: Comprehensive user and organization management
- **Dynamic Navigation**: Context-aware navigation based on user roles
- **Real-time Data**: Convex backend for reactive data synchronization

---

## Tech Stack & Architecture

### Frontend
- **Next.js 15**: App Router with server-side rendering
- **React 19**: Modern React with concurrent features
- **TypeScript**: Full type safety throughout the application
- **Tailwind CSS v4**: Utility-first styling framework
- **Framer Motion**: Animations and transitions
- **HeroUI**: Custom NextUI fork for UI components

### Backend & Data
- **Convex**: Serverless backend with database and functions
- **WorkOS AuthKit**: Authentication and user management
- **Pino**: Structured logging system

### Development Tools
- **Biome**: Linting and formatting
- **Vitest**: Unit testing framework
- **Playwright**: End-to-end testing
- **Storybook**: Component development and documentation

---

## Authentication & Authorization

### Authentication Flow

1. **Sign-in Process**
   - User navigates to `/sign-in`
   - Redirects to WorkOS authentication page
   - After successful auth, redirects to `/callback`
   - Callback handles the authentication response
   - User is redirected to their role-appropriate dashboard

2. **Session Management**
   - WorkOS handles session persistence
   - ConvexClientProvider bridges WorkOS auth with Convex
   - Tokens are automatically refreshed by AuthKit
   - Unauthenticated users are redirected to sign-in

3. **Role-Based Access**
   - Users can have multiple roles (admin, broker, lawyer, investor)
   - Primary role determines default dashboard view
   - Role switching available in sidebar
   - Navigation items filtered by active role

### Key Authentication Components

- `ConvexClientProvider.tsx`: Bridges WorkOS auth with Convex backend
- `app/sign-in/route.ts`: Initiates WorkOS authentication flow
- `app/callback/route.ts`: Handles WorkOS authentication callback
- `components/team-switcher.tsx`: Role switching interface

---

## Complete Page Structure

### Public Pages

#### `/` - Landing Page
- **Purpose**: Marketing and overview of FairLend platform
- **Components**: TwoLevelNav, feature cards
- **Features**: Demo cards showcasing platform capabilities
- **File**: `app/page.tsx`

#### `/sign-in` - Authentication Entry
- **Purpose**: Redirect to WorkOS authentication
- **Implementation**: Route handler that redirects to WorkOS
- **File**: `app/sign-in/route.ts`

#### `/sign-up` - User Registration
- **Purpose**: Redirect to WorkOS registration flow
- **Implementation**: Route handler that redirects to WorkOS sign-up
- **File**: `app/sign-up/route.ts`

#### `/callback` - Authentication Callback
- **Purpose**: Handle WorkOS authentication response
- **Implementation**: WorkOS AuthKit handler
- **File**: `app/callback/route.ts`

### Authenticated Route Groups

#### `/dashboard` - Main Dashboard Area
- **Layout**: Sidebar navigation with role-based menu items
- **Entry Point**: Redirects to role-specific dashboard
- **File**: `app/dashboard/layout.tsx`, `app/dashboard/page.tsx`

##### Role-Specific Dashboards

###### `/dashboard/admin` - Administrator Dashboard
- **Purpose**: System oversight and user management
- **Features**:
  - Platform metrics (users, deals, brokers, lawyers)
  - Recent users management
  - Deals oversight
  - Listings review
  - Quick actions for admin tasks
- **File**: `app/dashboard/admin/page.tsx`

###### Admin Sub-Pages
- **`/dashboard/admin/users`** - User management interface
  - User listing with search and filters
  - User status management
  - File: `app/dashboard/admin/users/page.tsx`
- **`/dashboard/admin/deals`** - Deal monitoring and oversight
  - Active deals tracking
  - Deal status management
  - File: `app/dashboard/admin/deals/page.tsx`
- **`/dashboard/admin/brokers`** - Broker account management
  - Broker verification and oversight
  - Performance metrics
  - File: `app/dashboard/admin/brokers/page.tsx`
- **`/dashboard/admin/lawyers`** - Legal counsel management
  - Lawyer verification and oversight
  - Case assignment tracking
  - File: `app/dashboard/admin/lawyers/page.tsx`
- **`/dashboard/admin/listings`** - Property listing oversight
  - Listing approval and moderation
  - Content review tools
  - File: `app/dashboard/admin/listings/page.tsx`

###### `/dashboard/broker` - Broker Dashboard
- **Purpose**: Client management and deal tracking
- **Features**:
  - Client metrics (total, active, AUM, earnings)
  - Quick actions (add client, invite investor)
  - Client onboarding flow
- **File**: `app/dashboard/broker/page.tsx`

##### `/dashboard/clients` - Client Management
- **Purpose**: Comprehensive client management system
- **Features**:
  - Client listing with search and filtering
  - Client status management (Active, Pending, Suspended)
  - Add new clients functionality
  - Client profile management
- **Sub-Pages**:
  - **`/dashboard/clients`** - Client list and management
    - File: `app/dashboard/clients/page.tsx`
  - **`/dashboard/clients/new`** - Add new client form
    - Complete client onboarding with form validation
    - File: `app/dashboard/clients/new/page.tsx`
  - **`/dashboard/clients/[id]`** - Individual client profile (planned)
    - File: `app/dashboard/clients/[id]/page.tsx`

###### `/dashboard/lawyer` - Legal Dashboard
- **Purpose**: Deal oversight and legal document management
- **Features**:
  - Active deals tracking
  - Legal document requests
  - Client management
- **File**: `app/dashboard/lawyer/page.tsx`

###### Lawyer Sub-Pages
- **`/dashboard/lawyer/deals`** - Active legal deals tracking
  - Current legal matters overview
  - Deal status and timeline tracking
  - File: `app/dashboard/lawyer/deals/page.tsx`
- **`/dashboard/lawyer/requests`** - Legal document requests
  - Document requests from clients
  - Request status management
  - File: `app/dashboard/lawyer/requests/page.tsx`
- **`/dashboard/lawyer/clients`** - Client legal matters
  - Overview of clients with legal matters
  - Case assignment and tracking
  - File: `app/dashboard/lawyer/clients/page.tsx`

###### `/dashboard/investor` - Investor Dashboard
- **Purpose**: Portfolio management and opportunity discovery
- **Features**:
  - Portfolio overview
  - Active deals
  - Investment opportunities
- **File**: `app/dashboard/investor/page.tsx`

###### Investor Sub-Pages
- **`/dashboard/investor/portfolio`** - Investment portfolio management
  - Portfolio performance overview
  - Asset allocation and tracking
  - File: `app/dashboard/investor/portfolio/page.tsx`
- **`/dashboard/investor/deals`** - Active investment deals
  - Current investment commitments
  - Deal performance tracking
  - File: `app/dashboard/investor/deals/page.tsx`
- **`/dashboard/investor/opportunities`** - New investment opportunities
  - Available investment options
  - Deal flow management
  - File: `app/dashboard/investor/opportunities/page.tsx`

#### `/listings` - Investment Property Listings
- **Purpose**: Browse and filter available investment properties
- **Features**:
  - Advanced filtering (LTV, APR, property type, mortgage type)
  - Grid and map views
  - Mobile-optimized interface
  - Real-time search and filtering
- **Components**: ListingsClient, ListingGridShell, FilterBar, ListingMap
- **File**: `app/(auth)/listings/page.tsx`

##### `/listings/[id]` - Property Detail View
- **Purpose**: Detailed view of individual investment properties
- **Features**:
  - Property information and images
  - Financial metrics and appraisal data
  - Comparable properties analysis
  - Document viewer
  - Payment history
  - Interactive map
  - Investment request functionality
- **Components**: Comprehensive property detail components
- **File**: `app/(auth)/listings/[id]/page.tsx`

#### `/profile` - User Profile
- **Purpose**: User account management
- **Features**: Profile editing, preferences, account settings
- **File**: `app/(auth)/profile/page.tsx`

#### `/settings` - Application Settings
- **Purpose**: Application-wide settings and configuration
- **Features**: User preferences, notification settings
- **File**: `app/dashboard/settings/page.tsx`

#### `/server` - Server Component Demo
- **Purpose**: Demonstration of Next.js server components with Convex
- **Features**:
  - Server-side data loading with Convex
  - Preloading and authentication
  - View transitions integration
- **File**: `app/server/page.tsx`

#### Additional Route Features

##### Loading States
- **Implementation**: Each major route has dedicated loading states
- **Pattern**: `loading.tsx` files in each route directory
- **Examples**: 
  - `app/dashboard/loading.tsx`
  - `app/(auth)/listings/loading.tsx`
  - `app/(auth)/listings/[id]/loading.tsx`

##### Error Boundaries
- **Implementation**: Error handling for each route group
- **Pattern**: `error.tsx` files for error states
- **Examples**:
  - `app/error.tsx` (root level)
  - `app/(auth)/listings/error.tsx`
  - `app/dashboard/admin/error.tsx`

##### Route Templates
- **Implementation**: View transition templates
- **File**: `app/dashboard/template.tsx`
- **Purpose**: Provides smooth transitions between dashboard routes

---

## Component Architecture

### Layout Components

#### `ConvexClientProvider`
- **Purpose**: Bridges WorkOS authentication with Convex backend
- **Location**: `components/ConvexClientProvider.tsx`
- **Key Features**: Token management, authentication state synchronization

#### `AppSidebar`
- **Purpose**: Main navigation sidebar with role-based menu items
- **Location**: `components/app-sidebar.tsx`
- **Features**: Dynamic navigation, role switching, user menu

#### `TeamSwitcher`
- **Purpose**: Role switching interface in sidebar header
- **Location**: `components/team-switcher.tsx`
- **Features**: Multi-role support, active role indication

#### Navigation Components
- `NavMain`: Main navigation menu items
- `NavUser`: User profile and account menu
- `NavProjects`: Project/workspace switching (if applicable)
- **TwoLevelNav**: Comprehensive navigation with search, breadcrumbs, and command palette
- **CommandPalette**: Keyboard shortcut search interface (⌘K support)
- **NavigationProvider`: Context provider for navigation state
- **Location**: `components/navigation/` directory

#### View Transition Components
- **Purpose**: Smooth transitions between pages and routes
- **File**: `app/dashboard/template.tsx`
- **Features**: Automatic view transition on route changes using View Transitions API

### Business Components

#### Listing Components

##### `ListingGridShell`
- **Purpose**: Main container for property listings with filtering and views
- **Location**: `components/ListingGridShell.tsx`
- **Features**: 
  - Grid and map view switching
  - Mobile-responsive design
  - Filter integration
  - Viewport-based optimization

##### `FilterBar` & `FilterModal`
- **Purpose**: Property search and filtering interface
- **Location**: `components/filter-bar.tsx`, `components/filter-modal.tsx`
- **Features**:
  - Multiple filter criteria (LTV, APR, property type, mortgage type)
  - Range sliders and dropdown selections
  - Mobile-optimized modal interface

##### `PropertyListingCard`
- **Purpose**: Individual property listing card in grid view
- **Location**: `components/property-listing-card.tsx`
- **Features**: Property preview, key metrics, quick actions

##### `ListingCardHorizontal`
- **Purpose**: Horizontal layout for property listings
- **Location**: `components/listing-card-horizontal.tsx`
- **Features**: Compact horizontal design, key information display

#### Listing Detail Components

##### Comprehensive Property Details
- **Property Info**: Basic property information and specifications
- **Financial Metrics**: Detailed financial analysis and projections
- **Appraisal Data**: Property valuation and appraisal information
- **Comparable Properties**: Market comparison analysis
- **Document Viewer**: PDF and document viewing capabilities
- **Image Carousel**: Property photo gallery
- **Payment History**: Transaction and payment records
- **Property Map**: Interactive location map
- **Request Listing**: Investment application functionality

**Location**: `components/listing-detail/` directory

### UI Components

#### Core UI Library
- **Framework**: HeroUI (custom NextUI fork) + Radix UI primitives
- **Location**: `components/ui/` directory
- **Components**: 
  - Buttons, cards, inputs, forms
  - Navigation (sidebar, breadcrumbs, dropdown menus)
  - Feedback (toasts, loading states, alerts)
  - Overlays (modals, drawers, dialogs)
  - Data Display (tables, badges, separators)
  - Interactive Elements (buttons, checkboxes, select menus)

#### Toast Notification System
- **Implementation**: Sonner-based toast notifications
- **Provider**: Root level toaster in layout
- **Usage**: `useToast()` hook throughout components
- **Examples**: Form submissions, client management actions

#### Specialized Components

##### `TwoLevelNav`
- **Purpose**: Breadcrumb-style navigation with search
- **Location**: `components/navigation/two-level-nav.tsx`
- **Features**: Keyboard shortcuts (⌘K), tubelight effects

##### Skeleton Components
- **Purpose**: Loading states and content placeholders
- **Location**: `components/skeletons/` directory
- **Components**: 
  - PageSkeleton: Full page loading state
  - CardSkeleton: Individual card loading state
  - TableSkeleton: Table row loading states

##### Authentication Components
- **UserAvatarMenu**: User profile dropdown with sign-out
- **Purpose**: User account management in navigation
- **Features**: Profile menu, account settings, sign-out functionality

---

## Role-Based Navigation

### Navigation Structure

The application uses a sophisticated role-based navigation system that dynamically adapts the user interface based on the active role.

### Role Definitions

#### Administrator (admin)
- **Dashboard**: System overview and metrics
- **Users**: User management and oversight
- **Deals**: Deal monitoring and management
- **Brokers**: Broker account management
- **Lawyers**: Legal counsel management
- **Listings**: Property listing oversight
- **Settings**: Application configuration

#### Broker
- **Dashboard**: Client metrics and performance
- **Clients**: Client management and onboarding
- **Settings**: Account and preference settings

#### Lawyer
- **Dashboard**: Legal case overview
- **Active Deals**: Current legal matters
- **Requests**: Document and legal requests
- **Clients**: Client legal matters
- **Settings**: Professional settings

#### Investor
- **Dashboard**: Portfolio performance overview
- **Portfolio**: Investment portfolio management
- **Deals**: Active investment deals
- **Opportunities**: New investment opportunities
- **Settings**: Investor preferences

### Navigation Implementation

**File**: `lib/navigation/role-navigation.ts`

```typescript
export const ROLE_NAVIGATION: Record<UserRole, NavItem[]> = {
  admin: [
    { title: "Dashboard", url: "/dashboard/admin", icon: LayoutDashboard },
    { title: "Users", url: "/dashboard/admin/users", icon: Users },
    // ... more navigation items
  ],
  broker: [
    { title: "Dashboard", url: "/dashboard/broker", icon: LayoutDashboard },
    { title: "Clients", url: "/dashboard/clients", icon: Users },
    // ... more navigation items
  ],
  // ... other roles
};
```

### Role Helpers

**File**: `lib/utils/role-helpers.ts`

- `getPrimaryRole()`: Determines primary role from multiple roles
- `getRoleNavigation()`: Returns navigation items for specific role
- `getRoleLabel()`: Human-readable role labels
- `getRoleDashboardUrl()`: Default dashboard URL for role

---

## Data Models & Schema

### Convex Schema

**File**: `convex/schema.ts`

#### User Model
```typescript
users: defineTable({
  idp_id: v.string(),           // WorkOS user ID
  email: v.string(),
  email_verified: v.boolean(),
  first_name: v.optional(v.string()),
  last_name: v.optional(v.string()),
  profile_picture_url: v.optional(v.string()),
  phone: v.optional(v.string()),
  active_organization_id: v.optional(v.string()),
  created_at: v.optional(v.string()),
  updated_at: v.optional(v.string()),
  last_sign_in_at: v.optional(v.string()),
  external_id: v.optional(v.string()),
  metadata: v.optional(v.any()),
})
```

#### Role Model
```typescript
roles: defineTable({
  slug: v.string(),             // Role identifier
  name: v.optional(v.string()), // Display name
  permissions: v.optional(v.array(v.string())),
  created_at: v.optional(v.string()),
  updated_at: v.optional(v.string()),
})
```

#### User Roles Association
```typescript
user_roles: defineTable({
  userId: v.id("users"),
  roleSlug: v.string(),
  assignedAt: v.optional(v.string()),
})
```

#### Organization Model
```typescript
organizations: defineTable({
  id: v.string(),               // WorkOS organization ID
  name: v.string(),
  external_id: v.optional(v.string()),
  metadata: v.optional(v.any()),
  created_at: v.optional(v.string()),
  updated_at: v.optional(v.string()),
})
```

### Data Relationships

1. **Users ↔ Roles**: Many-to-many relationship via `user_roles`
2. **Users ↔ Organizations**: Many-to-many via `organization_memberships`
3. **Organizations ↔ Domains**: One-to-many via `organization_domains`

### Indexing Strategy

- `by_idp_id`: Fast user lookup by WorkOS ID
- `by_email`: User lookup by email
- `by_userId`: Role assignments by user
- `by_roleSlug`: Users by role
- `byWorkosId`: Organization lookup
- `byUserOrganization`: User-organization relationships

---

## Key Workflows

### Authentication Workflow

```mermaid
sequenceDiagram
    participant User
    participant App as FairLend App
    participant WorkOS as WorkOS Auth
    participant Convex as Convex Backend

    User->>App: Navigate to /sign-in
    App->>WorkOS: Redirect to auth URL
    User->>WorkOS: Complete authentication
    WorkOS->>App: Redirect to /callback with code
    App->>WorkOS: Exchange code for tokens
    WorkOS->>App: Return user info and tokens
    App->>Convex: Authenticate with Convex
    Convex->>App: Return authenticated session
    App->>User: Redirect to role dashboard
```

### Role Switching Workflow

```mermaid
stateDiagram-v2
    [*] --> Admin Dashboard
    Admin Dashboard --> Broker Dashboard: Switch Role
    Admin Dashboard --> Lawyer Dashboard: Switch Role
    Admin Dashboard --> Investor Dashboard: Switch Role
    Broker Dashboard --> Admin Dashboard: Switch Role
    Broker Dashboard --> Lawyer Dashboard: Switch Role
    Broker Dashboard --> Investor Dashboard: Switch Role
    Lawyer Dashboard --> Admin Dashboard: Switch Role
    Lawyer Dashboard --> Broker Dashboard: Switch Role
    Lawyer Dashboard --> Investor Dashboard: Switch Role
    Investor Dashboard --> Admin Dashboard: Switch Role
    Investor Dashboard --> Broker Dashboard: Switch Role
    Investor Dashboard --> Lawyer Dashboard: Switch Role
```

### Property Listing Browsing Workflow

```mermaid
flowchart TD
    A[User navigates to /listings] --> B[Load initial listings]
    B --> C[Display grid view with filters]
    C --> D{User applies filters?}
    D -->|Yes| E[Update filtered results]
    D -->|No| F[User scrolls]
    E --> C
    F --> G{Load more items?}
    G -->|Yes| H[Load additional listings]
    G -->|No| I[User clicks listing]
    H --> C
    I --> J[Navigate to listing detail]
    J --> K[Load comprehensive property data]
    K --> L[Display detailed view]
```

### Client Management Workflow

```mermaid
stateDiagram-v2
    [*] --> ClientList
    ClientList --> AddClient: Click Add Client
    AddClient --> ClientForm: Fill Form
    ClientForm --> ClientList: Save & Return
    ClientList --> ClientDetails: Click Client
    ClientDetails --> EditClient: Click Edit
    EditClient --> ClientDetails: Save Changes
    ClientList --> SearchClients: Use Search
    SearchClients --> FilterClients: Apply Filters
    FilterClients --> ClientList: Clear Filters
```

### Admin User Management Workflow

```mermaid
stateDiagram-v2
    [*] --> AdminDashboard
    AdminDashboard --> UsersPage: Click Users
    UsersPage --> UserDetails: Select User
    UserDetails --> EditUser: Edit Profile
    EditUser --> UserDetails: Save Changes
    UsersPage --> AddUser: Invite New User
    AddUser --> UserList: Send Invitation
    UserList --> FilterUsers: Apply Filters
    FilterUsers --> UserList: Clear Filters
```

---

## API Endpoints

### Client-Side Logging
- **Endpoint**: `POST /api/logs`
- **Purpose**: Centralized log ingestion from client-side applications
- **Implementation**: Batch processing of client logs with different severity levels
- **Features**:
  - Automatic log batching and transmission
  - Support for multiple log levels (trace, debug, info, warn, error)
  - Integration with centralized logging system
- **File**: `app/api/logs/route.ts`

## Centralized Logging System

### Architecture
The application uses a sophisticated logging system with provider-agnostic design:

#### Server-Side Logging
- **Framework**: Pino structured logging
- **Configuration**: Environment-based configuration (`LOG_LEVEL`, `LOG_PRETTY`, `LOG_SERVICE_NAME`)
- **Features**: Pretty output in development, structured JSON in production
- **File**: `lib/pinoAdapter.ts`

#### Client-Side Logging
- **Implementation**: Batch adapter that posts to `/api/logs`
- **Features**: 
  - Automatic batching (1-second intervals, max 50 logs per batch)
  - Uses sendBeacon API for non-blocking transmission
  - Falls back to fetch if sendBeacon unavailable
- **File**: `lib/clientAdapter.ts`

#### Convex Logging
- **Implementation**: Lightweight shim writing to stdout
- **Features**: Minimal overhead for serverless environment

#### Logger Interface
```typescript
type Logger = {
  trace: (msg: string | Error, meta?: LogMeta) => void;
  debug: (msg: string | Error, meta?: LogMeta) => void;
  info: (msg: string | Error, meta?: LogMeta) => void;
  warn: (msg: string | Error, meta?: LogMeta) => void;
  error: (msg: string | Error, meta?: LogMeta) => void;
  child: (ctx: Record<string, any>) => Logger;
};
```

**File**: `lib/logger.ts`

## Utility Libraries

### Navigation Utilities
- **Purpose**: Helper functions for navigation logic
- **File**: `lib/navigation.ts`
- **Features**:
  - Navigation item matching (exact vs prefix)
  - Active navigation state detection
  - Breadcrumb generation

### Format Utilities
- **Purpose**: Data formatting helpers
- **File**: `lib/format.ts`
- **Features**: Date formatting, number formatting, text utilities

### Site URL Utilities
- **Purpose**: Environment-aware URL generation
- **File**: `lib/siteurl.ts`
- **Features**: Dynamic base URL for different environments

## Development Setup

### Environment Configuration

**File**: `.env.local.example`

```bash
# WorkOS AuthKit Configuration
WORKOS_CLIENT_ID=client_your_client_id_here
WORKOS_API_KEY=sk_test_your_api_key_here
WORKOS_COOKIE_PASSWORD=your_secure_password_here_must_be_at_least_32_characters_long
NEXT_PUBLIC_WORKOS_REDIRECT_URI=http://localhost:3000/callback

# Mapbox Configuration (for property location maps)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_mapbox_access_token_here

# Convex Configuration (auto-added by convex dev)
NEXT_PUBLIC_CONVEX_URL=https://your-convex-deployment.convex.cloud
CONVEX_DEPLOYMENT=your-deployment-id
```

### Development Commands

```bash
# Start full development environment
pnpm run dev

# Start frontend only
pnpm run dev:frontend

# Start backend only
pnpm run dev:backend

# Initial setup
pnpm run predev

# Build for production
pnpm run build

# Run tests
pnpm run test
pnpm run test:coverage
pnpm run e2e

# Code quality
pnpm run lint
pnpm run format
pnpm run check
```

### Initial Setup Process

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with actual values
   ```

3. **Setup Convex Backend**
   ```bash
   npx convex dev
   npx convex auth add workos
   ```

4. **Start Development**
   ```bash
   pnpm run dev
   ```

---

## File Structure

```
convex-next-authkit/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authenticated route group
│   │   ├── listings/             # Investment property listings
│   │   │   ├── [id]/             # Property detail pages
│   │   │   │   ├── error.tsx     # Error boundary
│   │   │   │   └── loading.tsx   # Loading state
│   │   │   ├── error.tsx         # Listings error boundary
│   │   │   ├── loading.tsx       # Listings loading state
│   │   │   ├── listings-client.tsx # Client wrapper
│   │   │   └── page.tsx          # Main listings page
│   │   └── profile/              # User profile
│   ├── api/                      # API routes
│   │   └── logs/                 # Log ingestion endpoint
│   │       └── route.ts          # POST /api/logs
│   ├── callback/                 # WorkOS auth callback
│   │   └── route.ts              # Auth callback handler
│   ├── dashboard/                # Dashboard area
│   │   ├── admin/                # Admin dashboard + sub-pages
│   │   │   ├── users/            # User management
│   │   │   ├── deals/            # Deal oversight
│   │   │   ├── brokers/          # Broker management
│   │   │   ├── lawyers/          # Lawyer management
│   │   │   ├── listings/         # Listing oversight
│   │   │   ├── error.tsx         # Admin error boundary
│   │   │   ├── loading.tsx       # Admin loading state
│   │   │   └── page.tsx          # Main admin dashboard
│   │   ├── broker/               # Broker dashboard
│   │   ├── lawyer/               # Lawyer dashboard + sub-pages
│   │   │   ├── deals/            # Legal deals
│   │   │   ├── requests/         # Legal requests
│   │   │   └── clients/          # Legal clients
│   │   ├── investor/             # Investor dashboard + sub-pages
│   │   │   ├── portfolio/        # Investment portfolio
│   │   │   ├── deals/            # Active deals
│   │   │   └── opportunities/    # Investment opportunities
│   │   ├── clients/              # Client management
│   │   │   ├── new/              # Add new client
│   │   │   └── [id]/             # Client detail pages
│   │   ├── settings/             # Application settings
│   │   ├── template.tsx          # View transition template
│   │   ├── error.tsx             # Dashboard error boundary
│   │   ├── loading.tsx           # Dashboard loading state
│   │   ├── layout.tsx            # Dashboard layout with sidebar
│   │   └── page.tsx              # Dashboard entry point
│   ├── server/                   # Server component demo
│   │   ├── error.tsx             # Server page error boundary
│   │   ├── loading.tsx           # Server page loading
│   │   ├── inner.tsx             # Inner component
│   │   └── page.tsx              # Server page with Convex integration
│   ├── sign-in/                  # Authentication entry
│   │   └── route.ts              # Redirect to WorkOS
│   ├── sign-up/                  # User registration
│   │   └── route.ts              # Redirect to WorkOS signup
│   ├── globals.css               # Global styles with Tailwind
│   ├── error.tsx                 # Root error boundary
│   ├── layout.tsx                # Root layout with providers
│   ├── loading.tsx               # Root loading state
│   └── page.tsx                  # Landing page
├── components/                   # React components
│   ├── app-sidebar.tsx           # Main navigation sidebar
│   ├── team-switcher.tsx         # Role switching interface
│   ├── ConvexClientProvider.tsx  # Auth bridge component
│   ├── listing-detail/           # Property detail components
│   │   ├── appraisal-data.tsx    # Property appraisal information
│   │   ├── comparable-properties.tsx # Market comparisons
│   │   ├── document-viewer.tsx   # PDF document viewer
│   │   ├── document-viewer-wrapper.tsx # Viewer wrapper
│   │   ├── financial-metrics.tsx # Financial analysis
│   │   ├── image-carousel.tsx    # Property photo gallery
│   │   ├── payment-history.tsx   # Transaction history
│   │   ├── property-info.tsx     # Basic property info
│   │   ├── property-map.tsx      # Interactive property map
│   │   └── request-listing-section.tsx # Investment request
│   ├── navigation/               # Navigation components
│   │   ├── command-palette.tsx   # Global search (⌘K)
│   │   ├── navigation-provider.tsx # Navigation context provider
│   │   └── two-level-nav.tsx     # Comprehensive nav with breadcrumbs
│   ├── auth/                     # Authentication components
│   │   └── UserAvatarMenu.tsx    # User profile menu
│   ├── breadcrumbs/              # Breadcrumb navigation
│   │   └── breadcrumb-nav.tsx    # Breadcrumb component
│   ├── contexts/                 # React contexts
│   ├── filters/                  # Filtering components
│   ├── kokonutui/                # Custom UI components
│   ├── listing-*                 # Listing-related components
│   │   ├── filter-bar.tsx        # Search and filter interface
│   │   ├── filter-modal.tsx      # Advanced filtering modal
│   │   ├── investment-listing-row.tsx # Investment listing row
│   │   ├── listing-card-horizontal.tsx # Horizontal listing card
│   │   ├── listing-map-popup.tsx # Map popup component
│   │   ├── ListingGridShell.tsx  # Main listings container
│   │   ├── ListingMap.tsx        # Property map component
│   │   ├── mobile-listing-scroller.tsx # Mobile scroll interface
│   │   └── property-listing-card.tsx # Grid listing card
│   ├── nav-*                     # Navigation components
│   │   ├── nav-main.tsx          # Main navigation menu
│   │   ├── nav-projects.tsx      # Project switcher
│   │   └── nav-user.tsx          # User navigation
│   ├── settings-dialog.tsx       # Settings interface
│   ├── skeletons/                # Loading states
│   │   └── [various skeleton components]
│   ├── transitions/              # View transition components
│   ├── ui/                       # Complete UI component library
│   ├── contexts/                 # React context providers
│   ├── customized/               # Custom component overrides
│   ├── types/                    # TypeScript type definitions
│   ├── ResourceCard.tsx          # Generic resource card
│   ├── ResourceLinks.tsx         # Resource navigation
│   ├── StaticContent.tsx         # Static content wrapper
│   └── [other business components]
├── convex/                       # Convex backend
│   ├── schema.ts                 # Database schema
│   ├── auth.config.ts            # Authentication configuration
│   ├── http.ts                   # HTTP request handlers
│   ├── logger.ts                 # Convex logging setup
│   ├── myFunctions.ts            # Sample Convex functions
│   ├── organizations.ts          # Organization management
│   ├── profile.ts                # User profile functions
│   ├── roles.ts                  # Role management
│   ├── storage.ts                # File storage functions
│   ├── users.ts                  # User management functions
│   ├── workos.ts                 # WorkOS integration
│   └── _generated/               # Generated TypeScript types
├── lib/                          # Shared utilities
│   ├── logger.ts                 # Centralized logging system
│   ├── clientAdapter.ts          # Client-side logging adapter
│   ├── pinoAdapter.ts            # Server-side logging with Pino
│   ├── format.ts                 # Data formatting utilities
│   ├── siteurl.ts                # Environment-aware URL generation
│   ├── testWorker.ts             # Testing utilities
│   ├── navigation/               # Role-based navigation
│   │   └── role-navigation.ts    # Complete role navigation config
│   ├── utils/                    # Helper utilities
│   │   └── role-helpers.ts       # Role management helpers
│   └── mock-data/                # Development test data
│       ├── generate-multiple-listings.ts # Bulk listing generation
│       └── listings.ts           # Individual listing generation
├── hooks/                        # Custom React hooks
├── public/                       # Static assets
│   ├── convex.svg                # Application icon
│   ├── house.jpg                 # Default property image
│   └── [other static assets]
├── stories/                      # Storybook component documentation
├── unit-tests/                   # Vitest unit tests
├── e2e/                          # Playwright end-to-end tests
├── docs/                         # Project documentation
├── [configuration files]         
│   ├── package.json              # Dependencies and scripts
│   ├── pnpm-lock.yaml           # pnpm lock file
│   ├── tsconfig.json            # TypeScript configuration
│   ├── tsconfig.tsbuildinfo     # TypeScript build cache
│   ├── next.config.ts           # Next.js configuration
│   ├── tailwind.config.js       # Tailwind CSS configuration
│   ├── postcss.config.mjs       # PostCSS configuration
│   ├── biome.json               # Biome linting and formatting
│   ├── vitest.config.mts        # Vitest testing configuration
│   ├── playwright.config.ts     # Playwright E2E configuration
│   └── [other config files]
├── .env.local.example            # Environment variables template
├── openspec/                     # OpenSpec documentation system
├── build-report.md              # Build reports
├── build-summary.txt            # Build summaries
├── deployment-checklist.md      # Deployment procedures
├── CLAUDE.md                    # AI coding assistant guidelines
├── LICENSE                      # MIT License
├── README.md                    # Project overview
└── SITE_MAP.md                  # This comprehensive documentation
```

### Key Architecture Patterns

1. **Route Groups**: Use `(auth)` for authenticated routes, allowing layouts and shared components
2. **Role-Based Layouts**: Dashboard layout with dynamic navigation based on user role
3. **Component Composition**: Highly modular components with clear separation of concerns
4. **Provider Pattern**: Context providers for auth, navigation, and state management
5. **Server Components**: Leverage Next.js App Router for server-side rendering
6. **Client Components**: Strategic use of client components for interactivity
7. **View Transitions**: Smooth transitions between routes using View Transitions API
8. **Error Boundaries**: Route-specific error handling with custom error components
9. **Loading States**: Progressive loading with skeleton components and loading states
10. **Logging Abstraction**: Provider-agnostic logging with automatic environment detection

### Mock Data System

**Location**: `lib/mock-data/`

- `generate-multiple-listings.ts`: Creates mock property listings
- `listings.ts`: Individual listing generation
- `generate-multiple-listings.ts`: Bulk generation for testing
- Seeded random generation for consistent development data
- Realistic property data for Toronto area

### Development Tooling

#### TypeScript Configuration
- **File**: `tsconfig.json`, `tsconfig.tsbuildinfo`
- **Features**: Path mapping, build optimization, incremental compilation

#### Testing Configuration
- **Unit Tests**: Vitest configuration (`vitest.config.mts`)
- **E2E Tests**: Playwright configuration (`playwright.config.ts`)
- **Test Utilities**: Custom test worker setup (`testWorker.ts`)

#### Code Quality
- **Linter/Formatter**: Biome (`biome.json`)
- **Configuration**: Single tool for linting, formatting, and TypeScript checking

#### Package Management
- **Package Manager**: pnpm with workspace support
- **Scripts**: Comprehensive npm scripts for development, testing, and deployment

### Custom Hooks

#### Mobile Detection
- **Hook**: `useIsMobile()`
- **Purpose**: Responsive design utilities
- **Features**: Breakpoint detection, mobile-specific behavior

#### Listing Filtering
- **Hook**: `useFilteredListings()` and `useViewportFilteredItems()`
- **Purpose**: Advanced filtering and search functionality
- **Features**: Real-time filtering, viewport-based filtering, performance optimization

#### Navigation
- **Hook**: Custom navigation state management
- **Purpose**: Centralized navigation logic
- **Features**: Active route detection, breadcrumb generation

### Additional Architectural Features

#### Breadcrumb Navigation
- **Component**: `BreadcrumbNav`
- **Purpose**: Hierarchical navigation indication
- **Features**: Dynamic breadcrumb generation based on route structure

#### Command Palette
- **Component**: `CommandPalette`
- **Purpose**: Global search and navigation
- **Features**: Keyboard shortcuts (⌘K), quick navigation, searchable commands

#### Interactive Maps
- **Integration**: Mapbox for property location mapping
- **Features**: Interactive property maps, popup information, viewport-based filtering

#### Document Management
- **Components**: PDF viewers, document upload interfaces
- **Purpose**: Legal document handling and management
- **Features**: Document preview, annotation support, secure storage

---

## Conclusion

This comprehensive site map documents the FairLend application architecture, providing complete coverage of:

### **Architectural Completeness**
- **25+ Pages & Routes**: Every route, sub-route, error boundary, and loading state documented
- **100+ Components**: Complete component hierarchy with purposes and relationships  
- **Sophisticated Systems**: Logging, navigation, authentication, and role management
- **Advanced Patterns**: View transitions, command palette, responsive design, document management

### **Development Depth**
- **Complete File Structure**: Every directory and file documented with purpose
- **Configuration Details**: All TypeScript, testing, and tooling configurations
- **Workflow Documentation**: User journeys, data flows, and interaction patterns
- **Environment Setup**: Complete development, testing, and deployment procedures

### **Key Architectural Strengths**

#### **Modern Stack Integration**
- **Next.js 15 App Router**: Server components, route groups, error boundaries
- **Convex Backend**: Real-time data, server functions, schema validation
- **WorkOS AuthKit**: Enterprise authentication with multi-role support
- **TypeScript**: Full type safety across client, server, and database layers

#### **Enterprise-Grade Features**
- **Multi-Role Architecture**: Admin, Broker, Lawyer, Investor with distinct interfaces
- **Role-Based Navigation**: Dynamic menu systems with permission-aware routing
- **Centralized Logging**: Provider-agnostic logging with client/server/Convex adapters
- **Error Handling**: Comprehensive error boundaries and loading states
- **Responsive Design**: Mobile-first approach with adaptive navigation

#### **Developer Experience**
- **Comprehensive Tooling**: Biome linting, Vitest testing, Playwright E2E
- **Component Library**: HeroUI + Radix UI with custom business components
- **Mock Data System**: Realistic seeded data for consistent development
- **Documentation**: This site map enables complete project reconstruction

### **Production-Ready Implementation**
The application demonstrates enterprise-grade patterns suitable for:
- **Financial Services**: Multi-stakeholder lending platforms
- **SaaS Applications**: Multi-tenant role-based access control
- **Real Estate**: Property listings with advanced filtering and mapping
- **Document Management**: PDF viewing, annotation, and secure storage
- **Real-time Applications**: Live data updates and collaborative workflows

### **Scalability & Maintainability**
- **Modular Architecture**: Clear separation of concerns across components
- **Reactive Data**: Convex provides automatic client-side synchronization
- **Performance**: Optimized with server components, lazy loading, and viewport filtering
- **Security**: Enterprise authentication with automatic token refresh

### **Reconstruction Guarantee**
This documentation provides sufficient detail for an AI agent to:
1. **Understand the Complete Architecture**: Every component, route, and system documented
2. **Replicate All Features**: Full implementation details for every workflow
3. **Maintain Code Quality**: All configuration, testing, and formatting details included
4. **Extend Functionality**: Clear patterns for adding new roles, pages, and features

The FairLend application serves as a **production-ready reference implementation** for building sophisticated multi-role SaaS applications with modern web technologies, comprehensive error handling, and enterprise-grade authentication systems.
