## ADDED Requirements

### Requirement: Trace Span Recording
The system SHALL record execution spans for traced functions, capturing function name, arguments, auth context, timing, status, result or error, and parent-child relationships via trace ID and span ID.

#### Scenario: Mutation records a span on success
- **WHEN** a traced mutation executes successfully
- **THEN** a span is written to the `trace_spans` table with status `completed`, the full arguments, result, start time, end time, and duration

#### Scenario: Mutation records a span on error
- **WHEN** a traced mutation throws an error
- **THEN** a span is written to the `trace_spans` table with status `error`, the full arguments, error message, and stack trace

#### Scenario: Query logs span to console
- **WHEN** a traced query executes
- **THEN** the span data is logged to console (queries cannot write to DB) with the same structure as a persisted span

### Requirement: Trace Context Propagation
The system SHALL propagate trace context through function call chains so that all spans within a single request share a trace ID and maintain parent-child relationships.

#### Scenario: Child function inherits trace context
- **WHEN** a traced function calls another traced function and passes the `_trace` context
- **THEN** the child span has the same `traceId` as the parent and its `parentSpanId` equals the parent's `spanId`

#### Scenario: Root span creates new trace
- **WHEN** a traced function executes without an incoming `_trace` context
- **THEN** a new `traceId` and `spanId` are generated and the span has no `parentSpanId`

### Requirement: Request ID Correlation
The system SHALL generate a unique request ID for each incoming HTTP request and make it available for trace correlation.

#### Scenario: Proxy injects request ID header
- **WHEN** an HTTP request passes through the proxy
- **THEN** an `x-request-id` header is added with a unique UUID value

### Requirement: Full Payload Capture in Dev Mode
The system SHALL capture full function arguments, auth context, and return values without truncation when tracing is enabled in development mode.

#### Scenario: Large payload is stored without truncation
- **WHEN** a traced function receives arguments totaling 500KB of serialized JSON
- **THEN** the span stores the complete arguments without truncation

#### Scenario: Oversized payload is safely truncated
- **WHEN** a traced function's total span data would exceed the 1MB Convex document limit
- **THEN** the payload is truncated with a `[TRUNCATED]` marker and a warning is logged, but the span is still recorded

### Requirement: Traced Function Builders
The system SHALL provide `createTracedQuery`, `createTracedMutation`, and `createTracedAction` as drop-in replacements for `createAuthorizedQuery`, `createAuthorizedMutation`, and `createAuthorizedAction` that automatically record execution spans.

#### Scenario: Drop-in replacement preserves authorization
- **WHEN** a function is changed from `createAuthorizedMutation(["admin"])` to `createTracedMutation(["admin"])`
- **THEN** the function retains the same RBAC behavior and additionally records a trace span

### Requirement: Trace Admin Dashboard
The system SHALL provide an admin dashboard at `/dashboard/admin/traces` for viewing recent traces, inspecting span trees, and examining full span payloads.

#### Scenario: Admin views recent traces
- **WHEN** an admin navigates to the traces dashboard
- **THEN** a list of recent traces is displayed with trace ID, root function name, total duration, span count, and status

#### Scenario: Admin inspects trace detail
- **WHEN** an admin clicks on a trace
- **THEN** a span tree is displayed showing the parent-child hierarchy with timing bars and status indicators

#### Scenario: Admin inspects span payload
- **WHEN** an admin clicks on a span in the trace tree
- **THEN** the full span data is displayed including arguments, auth context, result or error, and timing

### Requirement: Trace Data Retention
The system SHALL automatically clean up trace spans older than the configured retention period to prevent unbounded storage growth.

#### Scenario: Expired traces are cleaned up
- **WHEN** the retention cron runs
- **THEN** all trace spans older than `TRACING_RETENTION_HOURS` (default 24) are deleted

### Requirement: Tracing Configuration
The system SHALL support configuration via environment variables to control whether tracing is enabled, the sampling rate, and the retention period.

#### Scenario: Tracing disabled in production
- **WHEN** `TRACING_ENABLED` is not set or set to `false`
- **THEN** traced function builders behave identically to their non-traced counterparts with zero overhead

#### Scenario: Tracing enabled in development
- **WHEN** `TRACING_ENABLED` is set to `true`
- **THEN** all traced functions record spans with full payloads
