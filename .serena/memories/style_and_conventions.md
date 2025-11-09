# Code Style and Conventions

## TypeScript

### Type Safety
- **Strict mode enabled** - no implicit any
- **Avoid `any` type** - use `unknown` or specific types instead
- **Use `Record<string, unknown>`** for flexible object types
- Define proper interfaces for all data structures
- Use Convex validators for runtime type safety

### Naming Conventions
- **Files**: kebab-case (e.g., `user-profile.tsx`)
- **Components**: PascalCase (e.g., `UserProfile`)
- **Variables/functions**: camelCase (e.g., `getUserData`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`)
- **Private properties**: prefix with underscore (e.g., `_internalState`)

### Code Organization
- **Imports**: group by type (external → internal → relative)
- **Export**: prefer named exports over default
- **Type exports**: use `export type { TypeName }` for type-only exports

## React/Next.js

### Component Structure
- **Server Components**: default for pages, use `"use client"` only when needed
- **Props**: use explicit typing with interfaces
- **Hooks**: custom hooks in `hooks/` directory
- **File naming**: use descriptive names, avoid generic names like `utils.tsx`

### React Compiler
- **DO NOT use `useMemo` or `useCallback`** - React Compiler handles optimization
- Write plain functions and let the compiler optimize
- Remove dependency arrays - compiler tracks dependencies automatically
- Write clean, readable code without manual optimization

### State Management
- **Zustand** for client-side state
- **Convex queries** for server state
- **React hooks** for local component state
- Avoid prop drilling - use context or state management

## Convex Backend

### Function Types
- **Queries**: for data fetching (read-only)
- **Mutations**: for data modification
- **Actions**: for side effects (external API calls)

### Function Structure
```typescript
export const myFunction = query({
  args: { /* Convex validators */ },
  returns: v.object({ /* return type */ }),
  handler: async (ctx, args) => {
    // Implementation
    return result;
  },
});
```

### Database Operations
- Use **indexes** for efficient queries
- Use `withIndex()` for indexed queries
- Use `ctx.auth.getUserIdentity()` for authentication
- Follow the 100% ownership invariant in mortgage operations

## Styling

### Tailwind CSS
- **Utility-first** approach
- Custom CSS variables for theming
- Dark mode support via `next-themes`
- Use semantic color tokens (e.g., `text-primary`, `bg-background`)

### Component Styling
- **Prefer Tailwind classes** over custom CSS
- Use `className` composition with `clsx`
- Responsive design with mobile-first approach

## Error Handling

### Frontend
- Use **Sonner** for toast notifications
- Type catch blocks as `unknown` before handling
- Provide user-friendly error messages
- Log errors with context using the logger

### Backend
- Throw errors with descriptive messages
- Use Convex error handling
- Log important operations via the centralized logger

## File Structure Conventions

```
app/
├── (auth)/              # Route groups for auth
│   ├── profile/
│   ├── listings/
│   └── page.tsx
├── api/                 # API routes
└── layout.tsx           # Root layout

components/
├── ui/                  # Reusable UI components
├── blocks/              # Feature-specific blocks
└── forms/               # Form components

convex/
├── schema.ts            # Database schema
├── *.ts                 # Backend functions
└── tests/               # Backend tests

hooks/                   # Custom React hooks
lib/                     # Utilities and configurations
```

## Authentication & Authorization

- **WorkOS AuthKit** handles all authentication
- Use `useAuth()` hook from AuthKit
- Check permissions server-side only (never in client)
- Use `ctx.auth.getUserIdentity()` in Convex functions
- Middleware protects routes automatically

## Logging

- Import logger from `lib/logger`
- Use `logger.child()` for request-scoped context
- Different adapters for client, server, and Convex
- Include relevant metadata for debugging

## Testing

### Unit Tests (Vitest)
- **Test files**: `*.test.ts` or `*.test.tsx`
- **Location**: `unit-tests/` directory or alongside source
- **Pattern**: Arrange-Act-Assert
- **Coverage**: Aim for meaningful coverage, not 100%

### E2E Tests (Playwright)
- **Test files**: `*.spec.ts` in `e2e/` directory
- **Page Object Model**: organize tests by page/feature
- **Auth**: handle WorkOS authentication flows

## Git Workflow

### Commit Messages
Format: `type: description`

Types:
- `feat`: new feature
- `fix`: bug fix
- `refactor`: code refactor
- `docs`: documentation updates
- `test`: test additions/updates
- `chore`: maintenance tasks
- `style`: formatting (use Biome instead)

### Branch Naming
- `feature/feature-name`
- `fix/issue-description`
- `refactor/scope-of-change`

## Performance

- Use React Compiler for automatic optimization
- Implement proper loading states
- Use Convex's reactive query system
- Lazy load routes and components
- Optimize images with Next.js Image component

## Security

- Validate all inputs (Convex validators)
- Use type-safe database operations
- Sanitize user inputs before rendering
- Use environment variables for secrets
- Implement proper authentication checks
- Follow the principle of least privilege