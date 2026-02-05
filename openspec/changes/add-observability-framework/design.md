## Context
The backend has 50+ Convex function files with complex cross-function call chains. Debugging requires manually correlating console logs. The existing audit events system captures business-level events but not execution-level traces. We need a development-first observability framework that captures full execution context without payload size limits.

### Constraints
- Convex functions run in a serverless environment with no native OTel support
- Convex document size limit is 1MB (sufficient for most function payloads)
- Must not impact production performance when tracing is disabled
- Must integrate with existing `createAuthorized*` function builders
- Cannot use `ctx.scheduler.runAfter()` inside queries (only mutations/actions)

### Stakeholders
- Developers debugging complex request chains
- Admins auditing system behavior
- Future: production monitoring integration

## Goals / Non-Goals
- Goals:
  - Capture full execution graph of any request chain with zero-truncation payloads in dev mode
  - Automatic instrumentation via function builder wrappers (drop-in replacement)
  - Request ID propagation from frontend through all backend functions
  - Admin dashboard for trace visualization with full payload inspection
  - Configurable: off / dev-full / production-sampled modes
- Non-Goals:
  - Production APM (future OTel export is out of scope for this change)
  - Client-side tracing (browser performance)
  - Replacing the existing audit events system (complementary, not replacement)
  - External event bus integration (Pulsar/Kafka remain future work)

## Decisions

### Decision 1: Custom tracing layer, not OTel SDK
- **What**: Build tracing primitives directly in Convex rather than wrapping OTel SDK
- **Why**: Convex has no native OTel integration. OTel SDK defaults truncate attributes to 128 bytes. Custom layer gives unlimited payloads and zero external dependencies.
- **Alternatives considered**: OTel SDK with raised limits → still constrained by collector/backend limits. SigNoz → requires infrastructure. Jaeger → UI breaks on large attributes.
- **Future**: Can add OTel exporter later that reads from `trace_spans` table.

### Decision 2: Store spans in Convex `trace_spans` table
- **What**: Use a Convex table as the span store
- **Why**: Zero additional infrastructure. Reactive queries enable real-time dashboard. 1MB document limit is sufficient. Automatic cleanup via cron.
- **Alternatives considered**: SQLite via webhook → adds infrastructure. External ClickHouse → overkill for dev. Console-only → no queryability.

### Decision 3: Traced function builders as drop-in wrappers
- **What**: `createTracedQuery/Mutation/Action` wrap the existing `createAuthorized*` builders
- **Why**: Adoption is a single import change. Existing RBAC, auth, and validation behavior unchanged. Functions that don't need tracing keep using `createAuthorized*`.
- **Pattern**:
  ```typescript
  // Before
  const myQuery = createAuthorizedQuery(["admin"]);
  // After (drop-in)
  const myQuery = createTracedQuery(["admin"]);
  ```

### Decision 4: Trace context propagation via `_trace` argument
- **What**: Traced functions accept an optional `_trace` field in args for parent span linkage
- **Why**: Convex functions can't share global state. Explicit context passing is the only reliable propagation mechanism in serverless.
- **Trade-off**: Callers must forward `_trace` manually when invoking child functions. This is acceptable because cross-function calls are already explicit in Convex.

### Decision 5: Dev-mode-only by default, configurable via environment
- **What**: Tracing records spans only when `TRACING_ENABLED=true` (default in dev). In production, defaults to off.
- **Why**: Zero performance overhead in production. Full visibility in development.
- **Configuration**: `TRACING_ENABLED`, `TRACING_SAMPLE_RATE`, `TRACING_RETENTION_HOURS`

## Risks / Trade-offs

- **Storage growth** → Mitigation: Automatic cron cleanup with configurable retention (default 24h in dev)
- **1MB document limit** → Mitigation: `safeSerialize()` utility truncates oversized payloads with a warning rather than failing
- **Manual context propagation** → Mitigation: Clear API, TypeScript types enforce shape, linting can catch missing propagation
- **Query tracing limitation** → Mitigation: Queries log spans to console in dev (cannot write to DB from queries). Mutations and actions write to `trace_spans` table.

## Migration Plan
1. Add `trace_spans` table to schema (non-breaking, additive)
2. Add tracing library files (no existing code changes)
3. Add traced function builders (no existing code changes)
4. Add admin dashboard pages (new routes, no conflicts)
5. Optionally migrate individual functions from `createAuthorized*` to `createTraced*` as needed
6. No rollback needed - existing functions continue to work unchanged

## Open Questions
- Should we add a `trace_spans` size monitoring alert when approaching storage limits?
- Should trace context be auto-injected into audit events for cross-referencing?
