## Why
The Convex backend has grown to 50+ function files with complex cross-function call chains (deals → ownership → ledger → audit). Debugging requires manually correlating console logs across multiple function invocations. There is no way to see the full execution graph of a request, inspect the arguments and state at each step, or understand performance characteristics. The existing audit events system captures business events but not execution traces.

## What Changes
- Add a `trace_spans` table to Convex schema for storing execution spans with full payloads
- Create traced function wrappers (`createTracedQuery`, `createTracedMutation`, `createTracedAction`) that automatically capture function name, arguments, auth context, timing, results, and errors
- Implement `TraceContext` propagation so child function calls link to parent spans via `traceId`/`parentSpanId`
- Add trace CRUD operations (record spans, query traces, cleanup retention)
- Build an admin dashboard at `/dashboard/admin/traces` with trace list, span tree, and full payload inspection
- Add request ID generation in `proxy.ts` so frontend-originated requests can be correlated to backend traces
- Dev mode captures full payloads (args, state, results); production mode can be toggled off or sampled

## Impact
- Affected specs: New `observability` capability (no existing specs modified)
- Affected code:
  - `convex/schema.ts` - New `trace_spans` table
  - `convex/lib/tracing.ts` - New tracing primitives
  - `convex/lib/tracedFunctions.ts` - New traced function builders
  - `convex/traces.ts` - New trace CRUD operations
  - `proxy.ts` - Request ID header injection
  - `app/(auth)/dashboard/admin/traces/` - New admin pages
  - `components/admin/traces/` - New visualization components
