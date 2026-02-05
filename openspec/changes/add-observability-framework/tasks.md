## 1. Schema & Core Tracing Library
- [x] 1.1 Add `trace_spans` table to `convex/schema.ts` with indexes
- [x] 1.2 Create `convex/lib/tracing.ts` with `TraceContext` type, `createTraceContext()`, `safeSerialize()`
- [x] 1.3 Create `convex/traces.ts` with span CRUD operations (recordSpan, getTraceSpans, getRecentTraces, cleanupTraces)

## 2. Traced Function Builders
- [x] 2.1 Create `convex/lib/tracedFunctions.ts` with `createTracedQuery`, `createTracedMutation`, `createTracedAction`
- [x] 2.2 Add tracing cron job to `convex/crons.ts` for trace retention cleanup

## 3. Request ID Propagation
- [x] 3.1 Add `x-request-id` header injection in `proxy.ts`

## 4. Admin Dashboard
- [x] 4.1 Create trace list page at `app/(auth)/dashboard/admin/traces/page.tsx`
- [x] 4.2 Create trace detail page at `app/(auth)/dashboard/admin/traces/[traceId]/page.tsx`
- [x] 4.3 Create `components/admin/traces/TraceList.tsx` component
- [x] 4.4 Create `components/admin/traces/SpanTree.tsx` component
- [x] 4.5 Create `components/admin/traces/SpanDetail.tsx` component

## 5. Testing & Validation
- [x] 5.1 Write unit tests for tracing primitives (`convex/tests/tracing.test.ts`)
- [x] 5.2 Run type checking (`pnpm run check-types`)
- [x] 5.3 Run linting (`pnpm run lint`)
- [x] 5.4 Run existing test suite to verify no regressions (`pnpm run test:once`)
