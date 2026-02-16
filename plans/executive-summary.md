**Executive Summary (Rewritten)**
Porting Twenty-style CRM to Convex is practical, but the winning strategy is mixed:

1. Use Convex primitives + existing components for workflow durability, scheduling, retries, migrations, aggregates, and file plumbing.
2. Build app-level “compilers” for metadata, views, and dynamic queries first.
3. Promote only the repeated hard parts into reusable Convex components after stabilizing behavior in production.

Short version by feature:

| Feature | Easiest Path Now | Build New Convex Component? |
|---|---|---|
| Dynamic schema + metadata | Convex tables + metadata control-plane + typed EAV value tables | Yes, later |
| Polymorphic/dynamic links | App-level edge table + integrity mutations | Yes, likely |
| Files + rich artifacts consistency | Convex storage + Files Control + artifact link tables | Maybe |
| Dynamic API generation parity | Metadata-driven generic function API (not runtime GraphQL schema generation) | Yes, later |
| Table/Kanban query performance | Precomputed indexes/materializations + Aggregate component | Maybe |
| Event + automation pipeline parity | Transactional outbox + Workpool/Workflow/Action Retrier | Yes, likely |
| Workflow/automation engine | Workflow + Workpool + Crons + Action Retrier | No (initially) |
| Field-type-driven view unlocks | Capability registry + view scaffolding service | Yes, likely |

---

## High-Level TDD: CRM Port to Convex

**Document Type**: Technical Design Document  
**Objective**: Define architecture and required capabilities to port a metadata-driven CRM to Convex while preserving dynamic objects, dynamic links, views (table/kanban/calendar), files/artifacts, events, and automations.

### 1. Goals
1. Preserve end-user flexibility to define custom objects and fields.
2. Support rich artifacts (files, notes, todos, timeline) linked to any record.
3. Preserve dynamic views and field-type-driven UX.
4. Preserve record-created/updated event triggers for automations.
5. Achieve reliable background execution with retries/idempotency.

### 2. Non-Goals
1. Full runtime GraphQL schema generation parity in v1.
2. SQL-style runtime DDL (create table/column/index per user action).
3. Zero-copy direct migration of existing backend internals.

### 3. Convex Constraints That Drive Design
1. Schema and indexes are declared in code, not user-runtime DDL.
2. Index budgets are finite (table/index limits), so dynamic querying requires planned index strategy.
3. Scheduled semantics differ by function type (mutation scheduling durability vs action at-most-once behavior).
4. Components are isolated and extensible, good for packaging repeated backend patterns.

### 4. Target Architecture

| Plane | Responsibility | Core Tables/Modules |
|---|---|---|
| Control Plane | Metadata, field definitions, view definitions, capabilities | `objectDefs`, `fieldDefs`, `viewDefs`, `viewFields`, `viewFilters`, `viewGroups`, `fieldCapabilities` |
| Data Plane | Record persistence for dynamic objects | `records`, typed value tables (`recordValuesText`, `recordValuesNumber`, etc), `recordLinks` |
| Artifact Plane | Files, notes, todos, timeline attachments | `files`, `attachments`, `notes`, `todos`, `timelineItems`, `artifactLinks` |
| Event Plane | Domain events and fanout | `domainEvents`, `eventDeliveries`, `webhookDeliveries` |
| Automation Plane | Workflow definitions/runs and trigger bindings | `automationRules`, `automationRuns`, `workflowDefs`, `workflowRuns` |

---

## 5. Capability Specs

### 5.1 Dynamic Schema + Metadata

**End-user capability**
Users can create custom objects/fields and immediately use them in forms, filters, sorting, and automation triggers.

**Convex gap**
No runtime physical schema/index creation equivalent to per-workspace DDL.

**Short-term fix (no dedicated component)**
1. Use stable Convex schema with metadata tables.
2. Store dynamic values in typed value tables.
3. Build metadata validator/compiler mutations (`createObject`, `createField`, `updateField`, `deleteField`).
4. Version metadata and gate reads/writes by active metadata version.

**Decision**
Use primitives first.

**Component recommendation**
Yes, create `dynamic-metadata` after proving model stability.
- Provides metadata versioning, field validation, migration helpers, and capability derivation.
- Worth it because almost every metadata-driven Convex app needs this.

---

### 5.2 Polymorphic/Dynamic Links

**End-user capability**
A record, note, task, or file can link to many object types; users can navigate related data consistently.

**Convex gap**
No built-in polymorphic FK/cascade integrity.

**Short-term fix**
1. `recordLinks` edge table with source/target object+record ids.
2. All link writes through guarded internal mutations.
3. Soft-delete cascades via scheduled jobs.
4. Integrity sweeps to detect/repair orphan links.

**Decision**
Use primitives first, but this is a high-friction area.

**Component recommendation**
Yes, likely `polymorphic-links`.
- Provides invariant enforcement, inverse edges, cascade policies, orphan repair.
- Strong candidate for Convex ecosystem PR.

---

### 5.3 Files + Rich Artifacts Consistency

**End-user capability**
Users can attach files, write notes, manage todos, and see timeline events on any record with correct permissions and cleanup.

**Convex gap**
No turnkey “artifact graph” that unifies ACL, retention, and cross-object linking.

**Short-term fix**
1. Use Convex storage and `Files Control` component.
2. Persist artifact docs in app tables and link via `artifactLinks`.
3. Enforce ACL and max-file rules in mutations.
4. Add cleanup workflows for orphaned files/artifacts.

**Decision**
Use existing primitives/components now.

**Component recommendation**
Maybe `artifact-graph` later if multiple apps need identical behavior.
- If this is product-specific, keep in-app.

---

### 5.4 Dynamic API Generation Parity

**End-user capability**
New objects/fields become usable immediately via API and UI without backend rewrites.

**Convex gap**
No runtime GraphQL schema generation/caching model equivalent.

**Short-term fix**
1. Expose generic metadata-driven functions:
- `queryRecords(objectId, viewId, filter, sort, page)`
- `upsertRecord(objectId, payload)`
- `deleteRecord(objectId, recordId)`
2. Generate client types from metadata snapshots for frontend DX.
3. Optionally expose HTTP/OpenAPI façade for external consumers.

**Decision**
Use generic function API first.

**Component recommendation**
Yes, later `dynamic-api`.
- Useful if you need repeatable API contracts across many metadata-driven apps.

---

### 5.5 Table/Kanban Query Performance

**End-user capability**
Fast switching between table/kanban/calendar with large datasets and dynamic filters.

**Convex gap**
Dynamic field/query combinations can exceed index practicality if naive.

**Short-term fix**
1. Typed value tables per data type.
2. Precompute per-view materializations for hot views.
3. Use `Aggregate` for grouped counts/sums.
4. Maintain “view stats” tables updated on record writes.

**Decision**
Use primitives + `Aggregate` now.

**Component recommendation**
Maybe `view-index-advisor`.
- Build only if many tenants create many heavy dynamic views and ops pain becomes recurring.

---

### 5.6 Event + Automation Pipeline Parity

**End-user capability**
“When record created/updated” triggers reliably run automations/webhooks with retry and dedupe.

**Convex gap**
No single built-in outbox bus with replay, dedupe, fanout policies as CRM product primitive.

**Short-term fix**
1. On mutation, write `domainEvents` in same transaction.
2. Dispatch via `Workpool`.
3. Execute external side effects with `Action Retrier`.
4. Store idempotency keys and delivery state.
5. Replay dead-lettered events with admin functions.

**Decision**
Use existing components now, but pattern is central.

**Component recommendation**
Yes, likely `event-outbox`.
- Broadly reusable and high value for the Convex ecosystem.

---

### 5.7 Workflow/Automation Engine

**End-user capability**
Users design automations with triggers, conditions, delays, and actions; runs are observable and resumable.

**Convex gap**
No CRM-specific visual DSL out of the box, but execution durability primitives exist.

**Short-term fix**
1. Use `Workflow` component for orchestration.
2. Use `Workpool` for prioritization and concurrency control.
3. Use `Crons` for recurring triggers.
4. Persist rule definitions and run logs in app tables.

**Decision**
Do not build new low-level component initially.

**Component recommendation**
No at first. Build a product-level automation builder in-app; componentize only trigger DSL compiler later if reused elsewhere.

---

### 5.8 Field-Type-Driven View Unlocking (Your explicit requirement)

**End-user capability**
Adding a field automatically unlocks relevant views:
1. Select/union-select field unlocks Kanban.
2. Date/datetime field unlocks Calendar.
3. Multiple eligible fields are selectable per view.
4. Users can create multiple table/kanban/calendar views from the same object.

**Convex gap**
No standard capability inference/scaffolding layer.

**Short-term fix**
1. Derive `fieldCapabilities` at field create/update.
2. `getEligibleFields(objectId, viewType)` query.
3. `createView(objectId, viewType, fieldId)` mutation with defaults:
- Kanban: initialize groups from select options.
- Calendar: bind chosen date field.
- Table: default visible columns from metadata.
4. Keep all view behavior metadata-driven.

**Decision**
Use app-level service first.

**Component recommendation**
Yes, likely `view-capabilities`.
- Good candidate for reusable Convex backend component.

---

## 6. Build-vs-Component Recommendation Matrix

| Capability | Short-Term Build In App | Component Later? | Priority |
|---|---|---|---|
| Dynamic metadata compiler | Yes | Yes | P0 |
| Polymorphic links integrity | Yes | Yes | P0 |
| Artifact graph | Yes | Maybe | P1 |
| Dynamic API layer | Yes | Yes | P1 |
| View performance planner | Yes | Maybe | P1 |
| Event outbox/fanout | Yes | Yes | P0 |
| Workflow runtime | No (use existing Workflow stack) | No (initially) | P0 |
| Field capability/view scaffolding | Yes | Yes | P0 |

---

## 7. Phased Delivery Plan

| Phase | Deliverables |
|---|---|
| Phase 1 | Metadata model, record/value storage, polymorphic links, table view, domain outbox |
| Phase 2 | Kanban/calendar dynamic views, artifacts/files integration, trigger-based automations |
| Phase 3 | Workflow builder UX, replay/admin tools, performance materializations |
| Phase 4 | Extract proven modules into reusable Convex components and upstream PRs |

---

## 8. Acceptance Criteria (High-Level)
1. Admin can create object + fields and immediately create records.
2. A select/union-select field can power Kanban view creation.
3. A date field can power Calendar view creation.
4. Notes/todos/files attach to arbitrary record types with permissions enforced.
5. Record create/update emits durable domain events and triggers automation exactly once at business level (idempotent side effects).
6. Workflow runs are traceable with status history and retry behavior.
7. Large-view read paths stay within agreed latency SLO via index/materialization strategy.

---

## 9. Convex Components to Leverage Immediately
- [Workflow](https://www.convex.dev/components)
- [Workpool](https://www.convex.dev/components)
- [Action Retrier](https://www.convex.dev/components)
- [Crons](https://www.convex.dev/components)
- [Aggregate](https://www.convex.dev/components)
- [Migrations](https://www.convex.dev/components)
- [Files Control](https://www.convex.dev/components)
- [Collaborative Text Editor Sync](https://www.convex.dev/components)

If you want, I can turn this into a concrete implementation blueprint next: proposed `convex/schema.ts` table set, function surface area, and a week-by-week build order.