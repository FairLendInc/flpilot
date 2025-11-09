# Project Overview

## Purpose
This is **FairLend**, a full-stack TypeScript application that serves as "the MLS for private mortgages" - an end-to-end exchange where brokers originate mortgages with their MIC (Mortgage Investment Corporation), investors buy fully-managed, fractionalized mortgages, and servicing is automated from disbursal to default.

The application is built on a modern full-stack architecture combining Convex as the backend, Next.js 15 as the frontend framework, and WorkOS AuthKit for authentication.

## Tech Stack

### Core Technologies
- **Backend**: Convex (database + serverless functions)
- **Frontend**: Next.js 15 with App Router
- **Authentication**: WorkOS AuthKit with redirect-based flow
- **Styling**: Tailwind CSS v4
- **UI Components**: HeroUI (custom NextUI fork) + Radix UI primitives
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation

### Development Tools
- **Language**: TypeScript (with strict type checking)
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Linting/Formatting**: Biome with Ultracite preset
- **Logging**: Custom centralized logging with Pino
- **Storybook**: Component development and documentation

### Key Integrations
- **WorkOS**: Authentication and organization management
- **Convex**: Database and backend functions
- **Rotessa**: Payment processing integration
- **Storage**: Convex storage for file management

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   └── (auth)/            # Authenticated route groups
├── components/            # React components
├── convex/               # Convex backend
│   ├── schema.ts         # Database schema
│   ├── *.ts              # Backend functions
├── lib/                  # Shared utilities
├── hooks/                # Custom React hooks
├── stories/              # Storybook stories
├── unit-tests/           # Unit tests
├── e2e/                  # E2E tests
├── openspec/             # Spec-driven development
└── themes/               # Theme CSS files
```

## Database Schema
6 core tables in Convex:
- `mortgages` - Core loan + property records
- `borrowers` - Borrower profiles
- `mortgage_ownership` - Cap table (100% invariant)
- `listings` - Marketplace visibility
- `appraisal_comparables` - Comparable property data
- `payments` - Payment history

## Key Features
- **100% Ownership Invariant**: Every mortgage has exactly 100% ownership
- **Automatic user provisioning** with WorkOS
- **Theme management** with 20+ themes
- **React Compiler** for automatic performance optimization
- **Server-side data fetching** with authentication
- **Toast notifications** via Sonner
- **Centralized logging** across all layers

## Development Mode
- Uses React 19 (canary channel)
- React Compiler enabled for automatic optimization
- TypeScript strict mode
- Hot module replacement for both frontend and backend

## Environment Requirements
- Node.js compatible with React 19 canary
- pnpm package manager
- WorkOS account for authentication
- Convex account for backend