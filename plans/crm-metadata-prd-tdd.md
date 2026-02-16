# CRM Metadata Engine: PRD + Technical Design Document

**Author**: AI-Assisted
**Date**: 2026-02-15
**Status**: Draft
**Scope**: Minimum Viable CRM Metadata — Dynamic Objects, Links, and View Unlocking
**Parent**: `plans/executive-summary.md` (8-capability CRM port roadmap)

---

## Table of Contents

- [Part 1: Product Requirements Document](#part-1-product-requirements-document)
  - [1.1 Executive Summary](#11-executive-summary)
  - [1.2 Problem Statement](#12-problem-statement)
  - [1.3 Scope Boundary](#13-scope-boundary)
  - [1.4 User Personas](#14-user-personas)
  - [1.5 User Stories](#15-user-stories)
  - [1.6 Functional Requirements](#16-functional-requirements)
  - [1.7 Non-Functional Requirements](#17-non-functional-requirements)
  - [1.8 Acceptance Criteria](#18-acceptance-criteria)
- [Part 2: Technical Design Document](#part-2-technical-design-document)
  - [2.1 Architecture Overview](#21-architecture-overview)
  - [2.2 Schema Design](#22-schema-design)
  - [2.3 The Metadata Compiler](#23-the-metadata-compiler)
  - [2.4 Typed EAV Data Plane](#24-typed-eav-data-plane)
  - [2.5 Polymorphic Links](#25-polymorphic-links)
  - [2.6 System Object Adapters](#26-system-object-adapters)
  - [2.7 View Engine](#27-view-engine)
  - [2.8 Convex Function Surface Area](#28-convex-function-surface-area)
  - [2.9 Index Strategy](#29-index-strategy)
  - [2.10 Multi-Tenancy & Authorization](#210-multi-tenancy--authorization)
  - [2.11 Migration Strategy](#211-migration-strategy)
  - [2.12 Performance Considerations](#212-performance-considerations)
  - [2.13 Risks and Mitigations](#213-risks-and-mitigations)
  - [2.14 Build Sequence](#214-build-sequence)

---

# Part 1: Product Requirements Document

## 1.1 Executive Summary

This document defines the **minimum viable CRM metadata engine** for FairLend Pilot — a vertical slice of the full CRM port described in `plans/executive-summary.md`. Rather than building all 8 capability areas across 4 phases, this scope delivers the three capabilities that unlock the highest-value user-facing functionality:

1. **Dynamic Schema + Metadata Compiler** (§5.1) — Users define custom objects and fields at runtime
2. **Polymorphic Dynamic Links** (§5.2) — N-to-N associations between any object types
3. **Field-Type-Driven View Unlocking** (§5.8) — Adding a select field auto-enables kanban; a date field auto-enables calendar

These three capabilities are mutually reinforcing: the metadata compiler defines what objects look like, links connect them, and view unlocking makes them immediately useful in the UI without custom code per object type.

4. **Native Entity Integration** — Existing hard-coded entities (mortgages, borrowers, deals) are surfaced as read-only **system objects** in the metadata engine, and custom records can **link to native table rows**. This bridges the metadata engine with the existing platform data model.

### What This Deliberately Excludes

| Excluded Capability | Reason |
|---|---|
| Files + Rich Artifacts (§5.3) | Notes, todos, file attachments. Valuable but not needed for metadata engine loop. |
| Dynamic API Generation (§5.4) | External API facade. Internal functions are sufficient for now. |
| Event + Automation Pipeline (§5.6) | Domain events and webhooks. Important for automation but not for core UX. |
| Workflow/Automation Engine (§5.7) | User-built automations. Depends on event pipeline. |
| Table/Kanban Query Performance (§5.5) | Materialized views and aggregates. Basic indexes are sufficient for MVP. |

## 1.2 Problem Statement

FairLend currently manages its domain entities (mortgages, borrowers, deals, etc.) through hard-coded Convex schema tables. Each new entity type requires:

- Schema changes in `convex/schema.ts`
- New Convex functions for CRUD operations
- New React components for display
- New page routes for navigation

This creates a bottleneck: every new entity type requires a developer. A metadata-driven CRM engine removes this bottleneck by allowing administrators to define new object types, their fields, and their relationships — then immediately use them in table, kanban, and calendar views.

### Core User Need

> "I want to create a new entity type (e.g., 'Referral Source', 'Appraisal Vendor', 'Insurance Policy'), define its fields, link it to existing records, and start using it in different views — all without writing code."

## 1.3 Scope Boundary

### In Scope

| Area | What's Included |
|---|---|
| **Object Definition** | Create, update, soft-delete custom object types with display names, icons, descriptions |
| **Field Definition** | Create fields of types: text, number, date, datetime, boolean, select, multi-select, email, phone, url, currency, percentage, rich-text, user-reference |
| **Field Capabilities** | Automatic derivation of view capabilities from field types (select → kanban, date → calendar, etc.) |
| **Record CRUD** | Generic create/read/update/delete for records of any defined object type |
| **Record Values** | Typed EAV storage with separate tables per value type for indexable queries |
| **Polymorphic Links** | Create/delete/query bidirectional links between records of any object types |
| **Link Type Definitions** | Define named link types (e.g., "referred by", "insured by", "appraised by") |
| **View Definitions** | Create table, kanban, and calendar views bound to specific objects and capability fields |
| **View Configuration** | Column selection, filter conditions, sort orders, kanban group mapping |
| **System Object Adapters** | Existing native tables (mortgages, borrowers, deals, etc.) represented as read-only system objects in the metadata engine with auto-derived field definitions and view capabilities |
| **Native Entity Links** | Custom metadata records can link to native table rows (e.g., link a custom "Insurance Policy" record to a mortgage) |
| **Organization Scoping** | All metadata and data scoped to WorkOS organization |

### Out of Scope

| Area | Why |
|---|---|
| File attachments on records | Deferred to artifact plane (§5.3) |
| Domain event emission on record changes | Deferred to event pipeline (§5.6) |
| Automation triggers ("when record created, do X") | Deferred to automation engine (§5.7) |
| External/OpenAPI access to dynamic objects | Deferred to dynamic API (§5.4) |
| Materialized view indexes for large datasets | Basic indexes sufficient for MVP scale |
| Custom EAV fields on native entities | Adding custom fields to mortgages/borrowers requires hybrid adapter (deferred) |
| Write-through to native tables | System object views are read-only; editing mortgages still uses existing mutations |
| Import/export of object definitions | Nice-to-have, not MVP |
| Metadata versioning and migration tooling | "Latest wins" for MVP |
| Computed/formula fields | Future enhancement |
| Conditional field visibility | Future enhancement |
| Record-level permissions (beyond org scoping) | Future enhancement |

## 1.4 User Personas

### Admin / System Architect

- **Role**: FairLend platform administrator
- **Goal**: Define and manage custom object types to extend the platform without code changes
- **Tasks**: Create objects, define fields, configure views, set up link types

### Operations User

- **Role**: Broker, operations staff, or investor relations manager
- **Goal**: Use custom objects to track entities and workflows relevant to their role
- **Tasks**: Create records, update field values, navigate linked records, switch between views

### Viewer

- **Role**: Any authenticated user with read access
- **Goal**: Browse and filter records in table, kanban, or calendar views
- **Tasks**: Apply filters, sort records, switch views, click through to record details

## 1.5 User Stories

### Epic 1: Object Definition

| ID | Story | Priority |
|---|---|---|
| OBJ-1 | As an admin, I can create a new object type with a name, icon, and description so that I can model a new business entity. | P0 |
| OBJ-2 | As an admin, I can rename or update the description of an existing object type. | P0 |
| OBJ-3 | As an admin, I can soft-delete an object type, hiding it from navigation while preserving data. | P1 |
| OBJ-4 | As an admin, I can see a list of all object types with their field counts and record counts. | P0 |

### Epic 2: Field Definition

| ID | Story | Priority |
|---|---|---|
| FLD-1 | As an admin, I can add a field to an object by specifying name, type, and whether it's required. | P0 |
| FLD-2 | As an admin, I can define select/multi-select fields with an ordered list of options, each with a label, value, and optional color. | P0 |
| FLD-3 | As an admin, I can reorder fields to control their display sequence in forms and tables. | P1 |
| FLD-4 | As an admin, I can update a field's label, description, and options without losing existing data. | P0 |
| FLD-5 | As an admin, I can soft-delete a field, hiding it from forms while preserving stored values. | P1 |
| FLD-6 | When I create a select field, the system automatically recognizes it as kanban-capable. | P0 |
| FLD-7 | When I create a date/datetime field, the system automatically recognizes it as calendar-capable. | P0 |

### Epic 3: Record Management

| ID | Story | Priority |
|---|---|---|
| REC-1 | As a user, I can create a new record for any object type and fill in its field values. | P0 |
| REC-2 | As a user, I can update individual field values on an existing record. | P0 |
| REC-3 | As a user, I can soft-delete a record. | P1 |
| REC-4 | As a user, I can view a record's detail page showing all its field values and linked records. | P0 |

### Epic 4: Polymorphic Links

| ID | Story | Priority |
|---|---|---|
| LNK-1 | As an admin, I can define a link type between two object types (e.g., "Contact" ← referred by → "Referral Source"). | P0 |
| LNK-2 | As a user, I can link a record to another record of a compatible type. | P0 |
| LNK-3 | As a user, I can view all records linked to the current record, grouped by link type. | P0 |
| LNK-4 | As a user, I can remove a link between two records. | P0 |
| LNK-5 | As an admin, I can define whether a link is one-to-many or many-to-many. | P1 |

### Epic 5: Native Entity Integration

| ID | Story | Priority |
|---|---|---|
| NAT-1 | As an admin, I can see existing platform entities (Mortgages, Borrowers, Deals) as read-only system objects in the object list, with their native columns represented as field definitions. | P0 |
| NAT-2 | As a user, I can view Mortgages in a **kanban view** grouped by status (active/renewed/closed/defaulted) without any additional setup. | P0 |
| NAT-3 | As a user, I can view Mortgages in a **calendar view** by maturity date. | P0 |
| NAT-4 | As a user, I can link a custom metadata record (e.g., "Insurance Policy") to a native mortgage row. | P0 |
| NAT-5 | As a user, I can see all linked custom records from a native entity's detail page. | P1 |
| NAT-6 | As a user, I can create table/kanban/calendar views for any system object just like custom objects. | P0 |

### Epic 6: View Engine

| ID | Story | Priority |
|---|---|---|
| VW-1 | As a user, I can view records of any object type in a **table view** with sortable, filterable columns. | P0 |
| VW-2 | As a user, I can view records in a **kanban view** when a select/multi-select field exists, with records grouped into columns by select value. | P0 |
| VW-3 | As a user, I can view records in a **calendar view** when a date/datetime field exists, with records plotted on a monthly/weekly calendar. | P0 |
| VW-4 | As a user, I can create multiple views of the same object (e.g., "Pipeline Board" and "Stale Leads Board" both from the same object). | P0 |
| VW-5 | As a user, I can save filter and sort configurations per view. | P1 |
| VW-6 | As a user, I can choose which columns are visible in a table view. | P1 |
| VW-7 | As a user, I can drag records between kanban columns to update the grouping field value. | P1 |

## 1.6 Functional Requirements

### FR-1: Field Type System

The metadata engine must support the following field types:

| Field Type | Storage | Indexable | Filterable | Capabilities Unlocked |
|---|---|---|---|---|
| `text` | `recordValuesText` | Yes | equals, contains, starts_with | — |
| `number` | `recordValuesNumber` | Yes | equals, gt, lt, gte, lte, between | — |
| `boolean` | `recordValuesBoolean` | Yes | equals | — |
| `date` | `recordValuesDate` | Yes | equals, before, after, between | **Calendar view** |
| `datetime` | `recordValuesDate` | Yes | equals, before, after, between | **Calendar view** |
| `select` | `recordValuesSelect` | Yes | equals, in | **Kanban view** |
| `multi_select` | `recordValuesMultiSelect` | No (array) | contains, contains_any | **Kanban view** (first value) |
| `email` | `recordValuesText` | Yes | equals | — |
| `phone` | `recordValuesText` | Yes | equals | — |
| `url` | `recordValuesText` | No | — | — |
| `currency` | `recordValuesNumber` | Yes | equals, gt, lt, between | — |
| `percentage` | `recordValuesNumber` | Yes | equals, gt, lt, between | — |
| `rich_text` | `recordValuesRichText` | No | full_text (future) | — |
| `user_ref` | `recordValuesUserRef` | Yes | equals | — |

### FR-2: Capability Derivation Rules

When a field is created or updated, the metadata compiler applies these rules:

```
if field.type ∈ {select, multi_select}    → emit capability "kanban"
if field.type ∈ {date, datetime}          → emit capability "calendar"
if field.type ∈ {any}                     → emit capability "table" (always)
if field.type ∈ {select}                  → emit capability "group_by"
if field.type ∈ {number, currency, pct}   → emit capability "aggregate"
if field.type ∈ {date, datetime, number}  → emit capability "sort"
```

### FR-3: View Creation from Capabilities

When creating a view, the system:

1. Queries `fieldCapabilities` for the target object + desired view type
2. Presents eligible fields to the user
3. On view creation, initializes view-specific configuration:
   - **Table**: All non-hidden fields as columns, default sort by creation time
   - **Kanban**: Maps select field options to columns, creates one column per option + "No Value" column
   - **Calendar**: Binds chosen date field as the calendar event date

### FR-4: Link Integrity

- Links are bidirectional: creating A→B also makes B→A queryable
- Links reference both the objectDef ID and the record ID on each side
- Deleting a record soft-deletes all its links (mark as `deleted`, do not remove rows)
- Link types define which object pairs are valid (enforced on link creation)

## 1.7 Non-Functional Requirements

| Requirement | Target | Rationale |
|---|---|---|
| **Latency: Record list** | < 200ms for 100 records | Acceptable for MVP table/kanban load |
| **Latency: Record detail** | < 150ms | Single record + linked records |
| **Latency: Object schema load** | < 100ms | Cached client-side via Convex reactivity |
| **Latency: View switch** | < 300ms | Switching table↔kanban↔calendar |
| **Data isolation** | Organization-scoped | All metadata and data scoped by WorkOS org_id |
| **Concurrent editors** | Optimistic updates | Convex handles OCC natively |
| **Field limit per object** | 100 fields | Reasonable upper bound; EAV scales linearly |
| **Object limit per org** | 50 objects | Can increase later; indexes are shared across all |
| **Record limit per object** | 100K records | Paginated queries; materialization deferred |
| **Link limit per record** | 1000 links | Paginated; soft limit enforced in mutation |

## 1.8 Acceptance Criteria

### AC-1: Object + Field Definition Loop

- [ ] Admin creates object "Referral Source" with fields: Name (text, required), Type (select: "Individual", "Company", "Partner"), First Contact Date (date), Revenue Generated (currency)
- [ ] System derives capabilities: kanban (from Type), calendar (from First Contact Date)
- [ ] Object appears in navigation with 0 records

### AC-2: Record CRUD

- [ ] User creates a record for "Referral Source" with all fields populated
- [ ] Record appears in default table view
- [ ] User updates the "Type" field from "Individual" to "Partner"
- [ ] Change is reflected in all active views within 1 second (Convex reactivity)

### AC-3: View Unlocking

- [ ] User creates a kanban view selecting "Type" as the grouping field
- [ ] Kanban shows columns: "Individual", "Company", "Partner", "No Value"
- [ ] User creates a calendar view selecting "First Contact Date" as the date field
- [ ] Calendar shows records plotted on their respective dates
- [ ] Both views are accessible from the same object's view switcher

### AC-4: Polymorphic Links

- [ ] Admin defines link type "referred_by" between "Referral Source" and an existing object (e.g., a Borrower concept)
- [ ] User links a Referral Source record to a Borrower record
- [ ] Both records show the link in their detail pages
- [ ] Removing the link from either side removes it from both

### AC-5: Native Entity Integration

- [ ] Mortgages, Borrowers, and Deals appear in the object list as system objects with a "system" badge
- [ ] The Mortgage system object exposes fields: loanAmount, interestRate, status, maturityDate, propertyType, ltv, etc.
- [ ] The Mortgage "status" field (select: active/renewed/closed/defaulted) is recognized as kanban-capable
- [ ] The Mortgage "maturityDate" field is recognized as calendar-capable
- [ ] User creates a kanban view for Mortgages grouped by status — columns show actual mortgage records from the native table
- [ ] User creates a custom "Insurance Policy" record and links it to an existing mortgage
- [ ] The mortgage's detail page (or linked records panel) shows the linked Insurance Policy
- [ ] System objects cannot be deleted or renamed by admins
- [ ] System object fields cannot be added, removed, or reordered (they mirror the native schema)

### AC-6: Multi-tenancy

- [ ] Object definitions created by Org A are not visible to Org B
- [ ] Records created in Org A are not queryable by Org B
- [ ] Link types defined in Org A cannot reference objects in Org B

---

# Part 2: Technical Design Document

## 2.1 Architecture Overview

The metadata engine is organized into three planes, plus an adapter layer that bridges to existing native tables:

```
┌──────────────────────────────────────────────────────────────┐
│                      CONTROL PLANE                           │
│  objectDefs ─── fieldDefs ─── fieldCapabilities              │
│  linkTypeDefs ─── viewDefs ─── viewFields/Filters/Groups     │
│                                                              │
│  "The Compiler" — defines shapes, derives capabilities       │
│                                                              │
│  objectDefs can be:                                          │
│    isSystem: false → custom EAV objects (user-created)        │
│    isSystem: true  → system adapters (proxy native tables)    │
└───────────────────────────┬──────────────────────────────────┘
                            │ references
┌───────────────────────────▼──────────────────────────────────┐
│                       DATA PLANE                             │
│                                                              │
│  Custom Objects (EAV):                                       │
│    records ─── recordValuesText ─── recordValuesNumber ──    │
│                recordValuesDate ─── recordValuesSelect ──    │
│                recordValuesBoolean ─── recordValuesRichText  │
│                recordValuesMultiSelect ─ recordValuesUserRef │
│                                                              │
│  System Objects (Native Adapters):                           │
│    mortgages ──┐                                             │
│    borrowers ──┤ Queried directly via adapter functions       │
│    deals ──────┘ that translate fieldDefs → native columns    │
│                                                              │
│  Cross-cutting:                                              │
│    recordLinks ── polymorphic edges (EAV↔EAV, EAV↔native)   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Why Typed EAV Instead of JSON Blobs?

Convex indexes require known field paths. A `v.any()` JSON blob cannot be indexed. By splitting values into typed tables (`recordValuesDate`, `recordValuesSelect`, etc.), each table gets purpose-built indexes:

- `recordValuesDate` has `by_object_field_value` for calendar range queries
- `recordValuesSelect` has `by_object_field_value` for kanban grouping
- `recordValuesNumber` has `by_object_field_value` for sorted/filtered number columns

This is the same pattern Twenty.com uses internally (separate typed column tables), adapted for Convex's document-oriented index model.

## 2.2 Schema Design

### Control Plane Tables

```typescript
// ============================================================================
// CRM Metadata Engine — Control Plane
// ============================================================================

/**
 * Object definitions — the "tables" of the user's data model.
 * Each object type is like a custom entity (e.g., "Lead", "Vendor", "Policy").
 */
objectDefs: defineTable({
  // Organization scoping (WorkOS org ID)
  orgId: v.string(),
  // Object identity
  name: v.string(),           // Machine-safe slug: "referral_source"
  singularLabel: v.string(),  // "Referral Source"
  pluralLabel: v.string(),    // "Referral Sources"
  description: v.optional(v.string()),
  icon: v.optional(v.string()),  // Lucide icon name: "users", "building"
  color: v.optional(v.string()), // Tailwind color: "blue", "emerald"
  // Lifecycle
  isActive: v.boolean(),        // Soft-delete flag
  isSystem: v.boolean(),        // true = platform-defined, cannot be deleted
  // System adapter config (only set when isSystem: true)
  // Identifies the native Convex table this object proxies
  nativeTable: v.optional(v.string()),  // e.g., "mortgages", "borrowers", "deals"
  // Display
  labelFieldId: v.optional(v.id("fieldDefs")),  // Which field is the "name/title"
  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
  createdBy: v.string(),  // WorkOS user subject ID
})
  .index("by_org", ["orgId"])
  .index("by_org_name", ["orgId", "name"])
  .index("by_org_active", ["orgId", "isActive"]),

/**
 * Field definitions — columns within an object.
 * Each field has a type that determines storage location and capabilities.
 */
fieldDefs: defineTable({
  orgId: v.string(),
  objectDefId: v.id("objectDefs"),
  // Field identity
  name: v.string(),           // Machine-safe slug: "first_contact_date"
  label: v.string(),          // "First Contact Date"
  description: v.optional(v.string()),
  // Type system
  fieldType: v.union(
    v.literal("text"),
    v.literal("number"),
    v.literal("boolean"),
    v.literal("date"),
    v.literal("datetime"),
    v.literal("select"),
    v.literal("multi_select"),
    v.literal("email"),
    v.literal("phone"),
    v.literal("url"),
    v.literal("currency"),
    v.literal("percentage"),
    v.literal("rich_text"),
    v.literal("user_ref"),
  ),
  // Constraints
  isRequired: v.boolean(),
  isUnique: v.optional(v.boolean()),
  defaultValue: v.optional(v.string()),  // JSON-encoded default
  // Select/multi-select options
  options: v.optional(v.array(v.object({
    value: v.string(),
    label: v.string(),
    color: v.optional(v.string()),  // Tailwind color for kanban columns
    order: v.number(),
  }))),
  // System adapter config (only set when parent objectDef.isSystem: true)
  // Maps this fieldDef to a column path on the native table
  nativeColumnPath: v.optional(v.string()),  // e.g., "loanAmount", "address.city"
  nativeReadOnly: v.optional(v.boolean()),   // true for system fields (default)
  // Display
  order: v.number(),     // Display order within the object
  isHidden: v.boolean(), // Hidden from default views but data preserved
  // Lifecycle
  isActive: v.boolean(),
  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
  createdBy: v.string(),
})
  .index("by_object", ["objectDefId"])
  .index("by_object_order", ["objectDefId", "order"])
  .index("by_object_name", ["objectDefId", "name"])
  .index("by_org", ["orgId"]),

/**
 * Field capabilities — derived by the metadata compiler.
 * Maps field types to view types they can power.
 *
 * These are denormalized from fieldDefs for fast queries:
 * "What fields on this object can power a kanban view?"
 */
fieldCapabilities: defineTable({
  orgId: v.string(),
  objectDefId: v.id("objectDefs"),
  fieldDefId: v.id("fieldDefs"),
  // The capability this field provides
  capability: v.union(
    v.literal("kanban"),
    v.literal("calendar"),
    v.literal("table"),
    v.literal("group_by"),
    v.literal("aggregate"),
    v.literal("sort"),
  ),
  // Timestamps
  createdAt: v.number(),
})
  .index("by_object_capability", ["objectDefId", "capability"])
  .index("by_field", ["fieldDefId"]),

/**
 * Link type definitions — defines valid associations between object types.
 * E.g., "Contact" can be "referred_by" → "Referral Source"
 */
linkTypeDefs: defineTable({
  orgId: v.string(),
  // Link identity
  name: v.string(),                  // Machine-safe: "referred_by"
  label: v.string(),                 // "Referred By"
  inverseLabel: v.string(),          // "Referrals" (label from the other side)
  description: v.optional(v.string()),
  // Endpoints
  sourceObjectDefId: v.id("objectDefs"),
  targetObjectDefId: v.id("objectDefs"),
  // Cardinality
  cardinality: v.union(
    v.literal("one_to_one"),
    v.literal("one_to_many"),
    v.literal("many_to_many"),
  ),
  // Lifecycle
  isActive: v.boolean(),
  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
  createdBy: v.string(),
})
  .index("by_org", ["orgId"])
  .index("by_source", ["sourceObjectDefId"])
  .index("by_target", ["targetObjectDefId"])
  .index("by_org_name", ["orgId", "name"]),
```

### View Definition Tables

```typescript
/**
 * View definitions — saved view configurations for an object.
 * Each view has a type (table/kanban/calendar) and is bound to specific fields.
 */
viewDefs: defineTable({
  orgId: v.string(),
  objectDefId: v.id("objectDefs"),
  // View identity
  name: v.string(),           // "Pipeline Board"
  description: v.optional(v.string()),
  icon: v.optional(v.string()),
  // View type
  viewType: v.union(
    v.literal("table"),
    v.literal("kanban"),
    v.literal("calendar"),
  ),
  // Capability field binding (which field powers this view?)
  // Required for kanban (select field) and calendar (date field)
  // Optional for table (no specific field binding)
  boundFieldId: v.optional(v.id("fieldDefs")),
  // Whether this is the default view for the object
  isDefault: v.boolean(),
  // Sort configuration
  defaultSort: v.optional(v.object({
    fieldDefId: v.id("fieldDefs"),
    direction: v.union(v.literal("asc"), v.literal("desc")),
  })),
  // Lifecycle
  isActive: v.boolean(),
  // Shared vs personal
  visibility: v.union(
    v.literal("org"),       // Visible to all org members
    v.literal("personal"),  // Only visible to creator
  ),
  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
  createdBy: v.string(),
})
  .index("by_object", ["objectDefId"])
  .index("by_object_type", ["objectDefId", "viewType"])
  .index("by_org", ["orgId"])
  .index("by_creator", ["createdBy"]),

/**
 * View field configurations — which fields are visible in a table view
 * and in what order. Each row = one column in the table.
 */
viewFields: defineTable({
  viewDefId: v.id("viewDefs"),
  fieldDefId: v.id("fieldDefs"),
  // Display configuration
  order: v.number(),
  width: v.optional(v.number()),  // Column width in pixels
  isVisible: v.boolean(),
})
  .index("by_view", ["viewDefId"])
  .index("by_view_order", ["viewDefId", "order"]),

/**
 * View filters — saved filter conditions per view.
 * Multiple filters are ANDed together.
 */
viewFilters: defineTable({
  viewDefId: v.id("viewDefs"),
  fieldDefId: v.id("fieldDefs"),
  // Filter operation
  operator: v.union(
    v.literal("equals"),
    v.literal("not_equals"),
    v.literal("contains"),
    v.literal("starts_with"),
    v.literal("gt"),
    v.literal("gte"),
    v.literal("lt"),
    v.literal("lte"),
    v.literal("between"),
    v.literal("in"),
    v.literal("is_empty"),
    v.literal("is_not_empty"),
  ),
  // Value (JSON-encoded to support different types)
  value: v.string(),
  // Order for UI display
  order: v.number(),
})
  .index("by_view", ["viewDefId"]),

/**
 * View kanban groups — maps select field options to kanban columns.
 * Allows reordering columns and hiding specific options.
 */
viewKanbanGroups: defineTable({
  viewDefId: v.id("viewDefs"),
  // The select option value this group represents
  optionValue: v.string(),
  // Display
  label: v.string(),
  color: v.optional(v.string()),
  order: v.number(),
  isVisible: v.boolean(),
  // Column collapse state
  isCollapsed: v.boolean(),
})
  .index("by_view", ["viewDefId"])
  .index("by_view_order", ["viewDefId", "order"]),
```

### Data Plane Tables

```typescript
// ============================================================================
// CRM Metadata Engine — Data Plane
// ============================================================================

/**
 * Records — one row per entity instance.
 * The "header" of a record; field values are in typed value tables.
 */
records: defineTable({
  orgId: v.string(),
  objectDefId: v.id("objectDefs"),
  // Lifecycle
  isDeleted: v.boolean(),
  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
  createdBy: v.string(),  // WorkOS user subject ID
  updatedBy: v.string(),
})
  .index("by_org_object", ["orgId", "objectDefId"])
  .index("by_object", ["objectDefId"])
  .index("by_object_created", ["objectDefId", "createdAt"])
  .index("by_object_updated", ["objectDefId", "updatedAt"]),

/**
 * Typed value tables — Entity-Attribute-Value storage with typed indexes.
 * One table per value type enables type-specific indexes and queries.
 */

// Text values (text, email, phone, url)
recordValuesText: defineTable({
  recordId: v.id("records"),
  fieldDefId: v.id("fieldDefs"),
  objectDefId: v.id("objectDefs"),  // Denormalized for index efficiency
  value: v.string(),
})
  .index("by_record", ["recordId"])
  .index("by_record_field", ["recordId", "fieldDefId"])
  .index("by_object_field_value", ["objectDefId", "fieldDefId", "value"]),

// Number values (number, currency, percentage)
recordValuesNumber: defineTable({
  recordId: v.id("records"),
  fieldDefId: v.id("fieldDefs"),
  objectDefId: v.id("objectDefs"),
  value: v.number(),
})
  .index("by_record", ["recordId"])
  .index("by_record_field", ["recordId", "fieldDefId"])
  .index("by_object_field_value", ["objectDefId", "fieldDefId", "value"]),

// Boolean values
recordValuesBoolean: defineTable({
  recordId: v.id("records"),
  fieldDefId: v.id("fieldDefs"),
  objectDefId: v.id("objectDefs"),
  value: v.boolean(),
})
  .index("by_record", ["recordId"])
  .index("by_record_field", ["recordId", "fieldDefId"])
  .index("by_object_field_value", ["objectDefId", "fieldDefId", "value"]),

// Date/datetime values
recordValuesDate: defineTable({
  recordId: v.id("records"),
  fieldDefId: v.id("fieldDefs"),
  objectDefId: v.id("objectDefs"),
  value: v.number(),  // Unix timestamp (ms) for range queries
})
  .index("by_record", ["recordId"])
  .index("by_record_field", ["recordId", "fieldDefId"])
  .index("by_object_field_value", ["objectDefId", "fieldDefId", "value"]),

// Select values (single select)
recordValuesSelect: defineTable({
  recordId: v.id("records"),
  fieldDefId: v.id("fieldDefs"),
  objectDefId: v.id("objectDefs"),
  value: v.string(),  // The option value string
})
  .index("by_record", ["recordId"])
  .index("by_record_field", ["recordId", "fieldDefId"])
  .index("by_object_field_value", ["objectDefId", "fieldDefId", "value"]),

// Multi-select values (stored as array)
recordValuesMultiSelect: defineTable({
  recordId: v.id("records"),
  fieldDefId: v.id("fieldDefs"),
  objectDefId: v.id("objectDefs"),
  values: v.array(v.string()),  // Array of option value strings
})
  .index("by_record", ["recordId"])
  .index("by_record_field", ["recordId", "fieldDefId"]),
  // Note: no by_object_field_value — arrays can't be indexed for equality

// Rich text values
recordValuesRichText: defineTable({
  recordId: v.id("records"),
  fieldDefId: v.id("fieldDefs"),
  objectDefId: v.id("objectDefs"),
  value: v.string(),  // HTML or Markdown content
})
  .index("by_record", ["recordId"])
  .index("by_record_field", ["recordId", "fieldDefId"]),

// User reference values (links to WorkOS user subjects)
recordValuesUserRef: defineTable({
  recordId: v.id("records"),
  fieldDefId: v.id("fieldDefs"),
  objectDefId: v.id("objectDefs"),
  value: v.string(),  // WorkOS user subject ID
})
  .index("by_record", ["recordId"])
  .index("by_record_field", ["recordId", "fieldDefId"])
  .index("by_object_field_value", ["objectDefId", "fieldDefId", "value"]),

/**
 * Record links — polymorphic edges between records AND native entities.
 * Bidirectional: creating A→B also makes B→A queryable.
 *
 * Each side is a "ref" that can point to either:
 *   - A metadata record: { kind: "record", id: Id<"records"> }
 *   - A native table row: { kind: "native", table: "mortgages", id: "abc123" }
 *
 * To keep indexes usable, we use a flattened representation:
 *   sourceKind + sourceId (string) where sourceId is either records._id or native doc._id
 *   targetKind + targetId (string) where targetId is either records._id or native doc._id
 *
 * The string-typed IDs sacrifice Convex type safety at the schema level,
 * but link creation mutations validate references exist before inserting.
 */
recordLinks: defineTable({
  orgId: v.string(),
  linkTypeDefId: v.id("linkTypeDefs"),
  // Source side
  sourceObjectDefId: v.id("objectDefs"),
  sourceKind: v.union(v.literal("record"), v.literal("native")),
  sourceId: v.string(),   // records._id or native doc._id (as string)
  // Target side
  targetObjectDefId: v.id("objectDefs"),
  targetKind: v.union(v.literal("record"), v.literal("native")),
  targetId: v.string(),   // records._id or native doc._id (as string)
  // Lifecycle
  isDeleted: v.boolean(),
  // Timestamps
  createdAt: v.number(),
  createdBy: v.string(),
})
  .index("by_source", ["sourceId"])
  .index("by_target", ["targetId"])
  .index("by_source_type", ["sourceId", "linkTypeDefId"])
  .index("by_target_type", ["targetId", "linkTypeDefId"])
  .index("by_link_type", ["linkTypeDefId"])
  .index("by_org", ["orgId"]),
```

### Table Count Summary

| Plane | Tables | Purpose |
|---|---|---|
| Control | 8 | objectDefs (incl. system adapters), fieldDefs (incl. native column mappings), fieldCapabilities, linkTypeDefs, viewDefs, viewFields, viewFilters, viewKanbanGroups |
| Data | 10 | records, 8 typed value tables, recordLinks (with native entity refs) |
| Native (read via adapters) | 3+ | mortgages, borrowers, deals (existing tables, no new schema) |
| **New Tables Total** | **18** | (Native tables already exist — zero additions to them) |

## 2.3 The Metadata Compiler

The "compiler" is not a separate service — it's a set of rules that execute within Convex mutations when fields are created or updated. Its job is to derive `fieldCapabilities` from `fieldDefs`.

### Compilation Flow

```
User creates/updates fieldDef
          │
          ▼
  ┌───────────────────┐
  │  compileField()   │  ← Internal mutation helper
  │                   │
  │  1. Delete old    │
  │     capabilities  │
  │  2. Apply rules   │
  │  3. Insert new    │
  │     capabilities  │
  └───────────────────┘
          │
          ▼
  fieldCapabilities table updated
          │
          ▼
  Reactive queries automatically
  update any open views
```

### Compilation Rules (Pseudocode)

```typescript
function deriveCapabilities(fieldDef: FieldDef): Capability[] {
  const caps: Capability[] = ["table"]; // Every field supports table view

  switch (fieldDef.fieldType) {
    case "select":
      caps.push("kanban", "group_by");
      break;
    case "multi_select":
      caps.push("kanban"); // Group by first value
      break;
    case "date":
    case "datetime":
      caps.push("calendar", "sort");
      break;
    case "number":
    case "currency":
    case "percentage":
      caps.push("aggregate", "sort");
      break;
  }

  return caps;
}
```

### Why Not Compute Capabilities On-Read?

Capabilities could be computed at query time by joining `fieldDefs` and applying rules. However, pre-computing and storing them in `fieldCapabilities` provides:

1. **Indexed queries**: "Give me all kanban-capable fields for object X" is a single index scan
2. **Decoupled evolution**: Adding new capability rules doesn't require re-querying all field types
3. **View creation validation**: Can validate that a view's bound field actually has the required capability via a simple `db.get()`

The cost is maintaining consistency — but since capabilities only change when fields are created/updated/deleted, the write amplification is minimal (1 field change = delete + insert a few capability rows).

## 2.4 Typed EAV Data Plane

### Record Creation Flow

When a user creates a record:

```
1. Validate: Fetch objectDef + all active fieldDefs
2. Type-check: For each provided value, verify it matches the field's type
3. Required check: Verify all isRequired fields have values
4. Insert record: Create row in `records` table
5. Fan out values: For each field value, insert into the appropriate typed table:
   - text/email/phone/url → recordValuesText
   - number/currency/pct → recordValuesNumber
   - boolean → recordValuesBoolean
   - date/datetime → recordValuesDate (converted to unix ms)
   - select → recordValuesSelect
   - multi_select → recordValuesMultiSelect
   - rich_text → recordValuesRichText
   - user_ref → recordValuesUserRef
```

### Record Query Flow (Table View)

```
1. Load view definition (viewDef + viewFields + viewFilters)
2. Query `records` by objectDefId with pagination
3. For each record, load all values from typed tables via by_record index
4. Apply client-side filters for non-indexed operations
5. Apply sort order
6. Return assembled record objects
```

### Record Query Flow (Kanban View)

```
1. Load view definition + bound select field
2. Load kanban groups (viewKanbanGroups)
3. For each group (select option value):
   - Query recordValuesSelect by_object_field_value(objectDefId, fieldDefId, value)
   - Load corresponding records
4. Load records with no value for this field (the "No Value" column)
5. Return grouped record sets
```

### Record Query Flow (Calendar View)

```
1. Load view definition + bound date field
2. Determine date range (current month ± buffer)
3. Query recordValuesDate by_object_field_value with range filter:
   - objectDefId = target object
   - fieldDefId = bound date field
   - value >= rangeStart AND value <= rangeEnd
4. Load corresponding records
5. Return records with their date values
```

## 2.5 Polymorphic Links

### Design Decisions

**Single edge table (not two-row bidirectional)**

Links are stored as a single row with source and target. Bidirectional queries work via two indexes:
- `by_source` — "What is this record linked to?"
- `by_target` — "What links point to this record?"

This is simpler than inserting two mirrored rows and avoids consistency issues (if one mirror is deleted but not the other).

**Link type validation**

When creating a link, the mutation checks that:
1. The source record's `objectDefId` matches `linkTypeDef.sourceObjectDefId`
2. The target record's `objectDefId` matches `linkTypeDef.targetObjectDefId`
3. Both records are in the same org
4. For `one_to_many`: the source doesn't already have a link of this type
5. For `one_to_one`: neither side already has a link of this type

**Soft-delete cascade**

When a record is soft-deleted, a follow-up internal mutation marks all its links as `isDeleted: true`. This preserves data for audit/recovery while removing links from active queries.

## 2.6 System Object Adapters

System object adapters bridge the metadata engine to existing native Convex tables. They allow existing entities like `mortgages`, `borrowers`, and `deals` to appear in the view engine — surfacing kanban, calendar, and table views over native data without duplicating storage.

### How It Works

A **system object** is an `objectDef` with `isSystem: true` and `nativeTable: "mortgages"`. Its `fieldDefs` have `nativeColumnPath` set (e.g., `"loanAmount"`, `"address.city"`), which tells the query adapter how to extract values from native documents.

```
System objectDef: "Mortgage"
  isSystem: true
  nativeTable: "mortgages"
  │
  ├── fieldDef: "loanAmount"
  │     fieldType: "currency"
  │     nativeColumnPath: "loanAmount"
  │     → capability: aggregate, sort, table
  │
  ├── fieldDef: "status"
  │     fieldType: "select"
  │     nativeColumnPath: "status"
  │     options: [{value:"active"}, {value:"renewed"}, {value:"closed"}, {value:"defaulted"}]
  │     → capability: kanban, group_by, table
  │
  ├── fieldDef: "maturityDate"
  │     fieldType: "date"
  │     nativeColumnPath: "maturityDate"
  │     → capability: calendar, sort, table
  │
  └── fieldDef: "propertyCity"
        fieldType: "text"
        nativeColumnPath: "address.city"
        → capability: table
```

### Query Adapter Pattern

The `queryRecords()` function checks `objectDef.isSystem`:

```typescript
async function queryRecords(ctx, { objectDefId, viewDefId, filters, sort, cursor, limit }) {
  const objectDef = await ctx.db.get(objectDefId);

  if (objectDef.isSystem && objectDef.nativeTable) {
    // System object: query the native table directly
    return queryNativeRecords(ctx, objectDef, { viewDefId, filters, sort, cursor, limit });
  }

  // Custom object: query EAV tables
  return queryEAVRecords(ctx, objectDef, { viewDefId, filters, sort, cursor, limit });
}
```

The `queryNativeRecords` adapter:

1. Loads fieldDefs for the system object
2. Queries the native table using native Convex indexes (e.g., `mortgages.by_status`)
3. Maps native document columns → fieldDef values using `nativeColumnPath`
4. Returns records in the same shape as EAV records (array of `{ _id, fields: { fieldName: value } }`)

```typescript
async function queryNativeRecords(ctx, objectDef, opts) {
  const fieldDefs = await ctx.db
    .query("fieldDefs")
    .withIndex("by_object", q => q.eq("objectDefId", objectDef._id))
    .filter(q => q.eq(q.field("isActive"), true))
    .collect();

  // Query native table
  const nativeDocs = await ctx.db
    .query(objectDef.nativeTable)  // e.g., "mortgages"
    .take(opts.limit || 25);

  // Map native docs → metadata record shape
  return nativeDocs.map(doc => ({
    _id: doc._id,  // Native doc ID (used for linking)
    _kind: "native" as const,
    objectDefId: objectDef._id,
    fields: Object.fromEntries(
      fieldDefs.map(fd => [
        fd.name,
        resolveColumnPath(doc, fd.nativeColumnPath)
      ])
    ),
    createdAt: doc._creationTime,
    updatedAt: doc._creationTime,
  }));
}

function resolveColumnPath(doc: any, path: string): unknown {
  return path.split(".").reduce((obj, key) => obj?.[key], doc);
}
```

### Kanban Query for System Objects

For kanban views over system objects, the adapter uses native indexes when available:

```typescript
// Mortgage kanban by status — uses mortgages.by_status index
const activeRecords = await ctx.db
  .query("mortgages")
  .withIndex("by_status", q => q.eq("status", "active"))
  .take(GROUP_PAGE_SIZE);
```

This is significantly faster than the EAV kanban query because it uses the existing native index directly, rather than going through a typed value table.

### Calendar Query for System Objects

Similarly, calendar range queries use native indexes:

```typescript
// Mortgage calendar by maturity date — uses mortgages.by_maturity_date index
const rangeRecords = await ctx.db
  .query("mortgages")
  .withIndex("by_maturity_date", q =>
    q.gte("maturityDate", rangeStart).lte("maturityDate", rangeEnd)
  )
  .collect();
```

### Bootstrapping System Objects

System objects are seeded on first load for an organization (or on deployment). A bootstrap mutation creates the objectDef + fieldDefs + capabilities for each registered native table:

```typescript
// Registry of native tables → metadata definitions
const SYSTEM_OBJECT_REGISTRY: SystemObjectConfig[] = [
  {
    nativeTable: "mortgages",
    name: "mortgage",
    singularLabel: "Mortgage",
    pluralLabel: "Mortgages",
    icon: "landmark",
    labelField: "externalMortgageId",
    fields: [
      { name: "loanAmount", label: "Loan Amount", fieldType: "currency", path: "loanAmount" },
      { name: "interestRate", label: "Interest Rate", fieldType: "percentage", path: "interestRate" },
      { name: "status", label: "Status", fieldType: "select", path: "status",
        options: [
          { value: "active", label: "Active", color: "green" },
          { value: "renewed", label: "Renewed", color: "blue" },
          { value: "closed", label: "Closed", color: "gray" },
          { value: "defaulted", label: "Defaulted", color: "red" },
        ]
      },
      { name: "maturityDate", label: "Maturity Date", fieldType: "date", path: "maturityDate" },
      { name: "originationDate", label: "Origination Date", fieldType: "date", path: "originationDate" },
      { name: "ltv", label: "LTV", fieldType: "percentage", path: "ltv" },
      { name: "propertyType", label: "Property Type", fieldType: "text", path: "propertyType" },
      { name: "propertyCity", label: "City", fieldType: "text", path: "address.city" },
      { name: "propertyState", label: "Province/State", fieldType: "text", path: "address.state" },
      { name: "mortgageType", label: "Mortgage Type", fieldType: "select", path: "mortgageType",
        options: [
          { value: "1st", label: "1st Mortgage", color: "blue" },
          { value: "2nd", label: "2nd Mortgage", color: "yellow" },
          { value: "other", label: "Other", color: "gray" },
        ]
      },
    ],
  },
  {
    nativeTable: "borrowers",
    name: "borrower",
    singularLabel: "Borrower",
    pluralLabel: "Borrowers",
    icon: "user",
    labelField: "name",
    fields: [
      { name: "name", label: "Name", fieldType: "text", path: "name" },
      { name: "email", label: "Email", fieldType: "email", path: "email" },
      { name: "phone", label: "Phone", fieldType: "phone", path: "phone" },
      { name: "status", label: "Status", fieldType: "select", path: "status",
        options: [
          { value: "pending_approval", label: "Pending", color: "yellow" },
          { value: "active", label: "Active", color: "green" },
          { value: "inactive", label: "Inactive", color: "gray" },
          { value: "suspended", label: "Suspended", color: "red" },
        ]
      },
    ],
  },
  {
    nativeTable: "deals",
    name: "deal",
    singularLabel: "Deal",
    pluralLabel: "Deals",
    icon: "handshake",
    labelField: "currentState",
    fields: [
      { name: "currentState", label: "State", fieldType: "select", path: "currentState",
        options: [
          { value: "locked", label: "Locked", color: "blue" },
          { value: "pending_lawyer", label: "Pending Lawyer", color: "yellow" },
          { value: "pending_docs", label: "Pending Docs", color: "yellow" },
          { value: "pending_transfer", label: "Pending Transfer", color: "orange" },
          { value: "pending_verification", label: "Pending Verification", color: "orange" },
          { value: "pending_ownership_review", label: "Ownership Review", color: "purple" },
          { value: "completed", label: "Completed", color: "green" },
          { value: "cancelled", label: "Cancelled", color: "red" },
          { value: "archived", label: "Archived", color: "gray" },
        ]
      },
      { name: "dealValue", label: "Deal Value", fieldType: "currency", path: "dealValue" },
      { name: "purchasePercentage", label: "Purchase %", fieldType: "percentage", path: "purchasePercentage" },
      { name: "createdAt", label: "Created", fieldType: "datetime", path: "createdAt" },
    ],
  },
];
```

### Linking Custom Records to Native Entities

With the flattened `recordLinks` schema, linking a custom "Insurance Policy" record to a native mortgage is straightforward:

```typescript
// Creating a link: custom record → native mortgage
await ctx.db.insert("recordLinks", {
  orgId,
  linkTypeDefId,
  sourceObjectDefId: insurancePolicyObjectDefId,  // custom objectDef
  sourceKind: "record",
  sourceId: insurancePolicyRecordId,               // Id<"records">
  targetObjectDefId: mortgageObjectDefId,           // system objectDef
  targetKind: "native",
  targetId: mortgageDocId,                          // Id<"mortgages"> as string
  isDeleted: false,
  createdAt: Date.now(),
  createdBy: ctx.subject,
});
```

When querying linked records from a native entity, the `getLinkedRecords` function detects `targetKind: "native"` and loads the target from the native table instead of the `records` table.

### Constraints

- **System objects are read-only**: No createRecord/updateRecord for system objects. Modifications go through existing mutations (e.g., `convex/mortgages.ts`).
- **No custom fields on system objects**: Field definitions mirror the native schema exactly. Adding custom EAV fields on top of native entities is a future enhancement (Option C from the architectural options).
- **Native index dependency**: Kanban/calendar queries for system objects rely on existing native indexes. If a native table lacks an index on a field used for kanban/calendar, the query falls back to full-table scan + filter.

## 2.7 View Engine

### View Type Behaviors

| View Type | Bound Field | Query Strategy | Interaction |
|---|---|---|---|
| **Table** | None (shows all) | Paginated full-object query with sort + filter | Column resize, sort, filter |
| **Kanban** | Select field | Grouped query by select option value | Drag between columns = update field value |
| **Calendar** | Date field | Range query on date value table | Click date to create, drag to reschedule |

### View Lifecycle

```
Object has fields with capabilities
          │
  User clicks "Create View"
          │
          ▼
  System shows eligible view types:
  - Table (always available)
  - Kanban (if select/multi_select field exists)
  - Calendar (if date/datetime field exists)
          │
  User selects type + bound field
          │
          ▼
  ┌─────────────────────────────────────┐
  │  initializeView() mutation          │
  │                                     │
  │  Table:                             │
  │    - Create viewFields for all      │
  │      active fields in order         │
  │                                     │
  │  Kanban:                            │
  │    - Create viewKanbanGroups from   │
  │      select field options           │
  │    - Add "No Value" group           │
  │                                     │
  │  Calendar:                          │
  │    - Bind date field (no extra      │
  │      config needed)                 │
  └─────────────────────────────────────┘
```

## 2.8 Convex Function Surface Area

### Control Plane Functions

```typescript
// ── Object Management ──────────────────────────────────────
convex/crm/objects.ts

createObject(args: { name, singularLabel, pluralLabel, description?, icon?, color? })
  → returns Id<"objectDefs">
  → Auth: admin role required
  → Validates name uniqueness within org
  → Sets isActive: true, isSystem: false

updateObject(args: { objectDefId, updates: { singularLabel?, pluralLabel?, description?, icon?, color? } })
  → Auth: admin role required
  → Cannot update name (slug is immutable)

deleteObject(args: { objectDefId })
  → Auth: admin role required
  → Sets isActive: false (soft delete)
  → Cannot delete isSystem objects

listObjects(args: { includeInactive?: boolean })
  → Auth: any authenticated user
  → Returns objects for current org
  → Includes field count and record count

getObjectSchema(args: { objectDefId })
  → Auth: any authenticated user
  → Returns object + all active fields + capabilities


// ── Field Management ───────────────────────────────────────
convex/crm/fields.ts

createField(args: { objectDefId, name, label, fieldType, isRequired, options?, defaultValue?, order? })
  → returns Id<"fieldDefs">
  → Auth: admin role required
  → Validates name uniqueness within object
  → Runs compileField() to derive capabilities
  → Auto-assigns order if not provided

updateField(args: { fieldDefId, updates: { label?, description?, isRequired?, options?, order?, isHidden? } })
  → Auth: admin role required
  → Re-runs compileField() if type-affecting properties change
  → Validates select option changes don't remove in-use values

deleteField(args: { fieldDefId })
  → Auth: admin role required
  → Sets isActive: false
  → Removes associated capabilities
  → Does NOT delete stored values (data preservation)

reorderFields(args: { objectDefId, fieldIds: Id<"fieldDefs">[] })
  → Auth: admin role required
  → Bulk-updates order property

getEligibleFields(args: { objectDefId, viewType: "kanban" | "calendar" })
  → Auth: any authenticated user
  → Queries fieldCapabilities by object + capability
  → Returns field definitions that can power the requested view type


// ── Link Type Management ───────────────────────────────────
convex/crm/linkTypes.ts

createLinkType(args: { name, label, inverseLabel, sourceObjectDefId, targetObjectDefId, cardinality })
  → returns Id<"linkTypeDefs">
  → Auth: admin role required

updateLinkType(args: { linkTypeDefId, updates: { label?, inverseLabel?, description? } })
  → Auth: admin role required
  → Cannot change source/target objects or cardinality after creation

deleteLinkType(args: { linkTypeDefId })
  → Auth: admin role required
  → Soft-deletes associated links

listLinkTypes(args: { objectDefId })
  → Auth: any authenticated user
  → Returns link types where this object is source OR target
```

### Data Plane Functions

```typescript
// ── Record CRUD ────────────────────────────────────────────
convex/crm/records.ts

createRecord(args: { objectDefId, values: Record<string, unknown> })
  → returns Id<"records">
  → Auth: any authenticated user
  → Validates values against field definitions
  → Fans out values to typed tables
  → Validates required fields are present

updateRecord(args: { recordId, values: Record<string, unknown> })
  → Auth: any authenticated user (must be in same org)
  → Partial update: only provided fields are changed
  → Upserts into typed value tables
  → Updates record.updatedAt

deleteRecord(args: { recordId })
  → Auth: any authenticated user (must be in same org)
  → Sets isDeleted: true
  → Schedules link soft-deletion via internal mutation

getRecord(args: { recordId })
  → Auth: any authenticated user (must be in same org)
  → Returns record with all field values assembled
  → Includes linked records summary

queryRecords(args: { objectDefId, viewDefId?, filters?, sort?, cursor?, limit? })
  → Auth: any authenticated user
  → Generic query powering all view types
  → Applies view-saved filters if viewDefId provided
  → Returns paginated results with cursor


// ── Record Links ───────────────────────────────────────────
convex/crm/links.ts

createLink(args: { linkTypeDefId, sourceRecordId, targetRecordId })
  → returns Id<"recordLinks">
  → Auth: any authenticated user
  → Validates both records exist and match link type's object defs
  → Enforces cardinality constraints

deleteLink(args: { linkId })
  → Auth: any authenticated user (must be in same org)
  → Sets isDeleted: true

getLinkedRecords(args: { recordId, linkTypeDefId?, direction?: "source" | "target" | "both" })
  → Auth: any authenticated user
  → Returns linked records with their label field values
  → Supports filtering by link type
```

### View Functions

```typescript
// ── View Management ────────────────────────────────────────
convex/crm/views.ts

createView(args: { objectDefId, name, viewType, boundFieldId?, isDefault? })
  → returns Id<"viewDefs">
  → Auth: any authenticated user
  → Validates boundFieldId has required capability for viewType
  → Auto-initializes view config (columns for table, groups for kanban)

updateView(args: { viewDefId, updates: { name?, defaultSort?, isDefault? } })
  → Auth: creator or admin
  → Cannot change viewType or boundFieldId after creation

deleteView(args: { viewDefId })
  → Auth: creator or admin
  → Cascades: deletes viewFields, viewFilters, viewKanbanGroups

getViewsForObject(args: { objectDefId })
  → Auth: any authenticated user
  → Returns all active views for this object (org + personal)

getViewConfig(args: { viewDefId })
  → Auth: any authenticated user
  → Returns full view config: definition + fields + filters + kanban groups

updateViewFields(args: { viewDefId, fields: { fieldDefId, order, width?, isVisible }[] })
  → Auth: creator or admin

updateViewFilters(args: { viewDefId, filters: { fieldDefId, operator, value }[] })
  → Auth: creator or admin

updateKanbanGroups(args: { viewDefId, groups: { optionValue, order, isVisible, isCollapsed }[] })
  → Auth: creator or admin
```

### System Adapter Functions

```typescript
// ── System Object Bootstrapping ────────────────────────────
convex/crm/systemObjects.ts

bootstrapSystemObjects(args: {})
  → returns void
  → Auth: admin role required (or internal mutation on deployment)
  → Idempotent: checks if system objects already exist for org
  → Creates objectDefs, fieldDefs, and fieldCapabilities from SYSTEM_OBJECT_REGISTRY
  → Runs compileField() for each system field

getSystemObjectRegistry(args: {})
  → Auth: any authenticated user
  → Returns the list of registered native tables with their field mappings
  → Used by admin UI to show which native tables are available


// ── Native Query Adapters ──────────────────────────────────
convex/crm/adapters.ts (internal helpers, not exported as public API)

queryNativeRecords(ctx, objectDef, opts)
  → Internal helper called by queryRecords() when objectDef.isSystem
  → Queries native table directly using native indexes
  → Maps native documents → metadata record shape

resolveNativeRecord(ctx, objectDef, nativeId)
  → Internal helper called by getLinkedRecords() for native targets
  → Loads a single native document and maps it to record shape
```

### Function Count Summary

| Module | Queries | Mutations | Total |
|---|---|---|---|
| objects.ts | 2 | 3 | 5 |
| fields.ts | 1 | 4 | 5 |
| linkTypes.ts | 1 | 3 | 4 |
| records.ts | 2 | 3 | 5 |
| links.ts | 1 | 2 | 3 |
| views.ts | 2 | 5 | 7 |
| systemObjects.ts | 1 | 1 | 2 |
| adapters.ts | 0 (internal) | 0 (internal) | 2 (helpers) |
| **Total** | **10** | **21** | **33** |

## 2.9 Index Strategy

### Index Budget Analysis

Convex has a limit of **32 indexes per table**. Here's the budget usage for the most indexed tables:

| Table | Indexes Used | Budget Remaining |
|---|---|---|
| records | 4 | 28 |
| recordValuesText | 3 | 29 |
| recordValuesNumber | 3 | 29 |
| recordValuesDate | 3 | 29 |
| recordValuesSelect | 3 | 29 |
| recordLinks | 6 | 26 |
| objectDefs | 3 | 29 |
| fieldDefs | 4 | 28 |

All tables are well within the 32-index limit. The three-part compound index `by_object_field_value` on typed value tables is the key performance enabler — it supports both the kanban grouping query and the calendar range query.

### Critical Query Patterns

| Query | Index Used | Expected Performance |
|---|---|---|
| "All records for object X, page 1" | `records.by_object_created` | O(page_size) — index range scan |
| "Records where Status = 'Active'" | `recordValuesSelect.by_object_field_value` | O(result_set) — exact match |
| "Records with date in March 2026" | `recordValuesDate.by_object_field_value` | O(result_set) — range scan |
| "All links from record R" | `recordLinks.by_source` | O(link_count) — index scan |
| "Kanban-capable fields for object X" | `fieldCapabilities.by_object_capability` | O(small) — typically 1-5 results |

## 2.10 Multi-Tenancy & Authorization

### Data Isolation

Every control-plane and data-plane table includes `orgId` (WorkOS organization ID). All queries filter by `orgId` extracted from the authenticated user's JWT claims via `ctx.org_id`.

```typescript
// Pattern used in all CRM queries:
const adminMutation = createAuthorizedMutation(["admin"]);

export const createObject = adminMutation({
  args: { name: v.string(), /* ... */ },
  handler: async (ctx, args) => {
    const orgId = ctx.org_id;
    if (!orgId) throw new Error("Organization context required");

    // Validate uniqueness within org
    const existing = await ctx.db
      .query("objectDefs")
      .withIndex("by_org_name", q => q.eq("orgId", orgId).eq("name", args.name))
      .unique();

    if (existing) throw new Error(`Object "${args.name}" already exists`);

    return await ctx.db.insert("objectDefs", {
      orgId,
      name: args.name,
      // ...
    });
  },
});
```

### Authorization Model

| Operation | Required Role | Additional Checks |
|---|---|---|
| Create/update/delete object defs | `admin` | — |
| Create/update/delete field defs | `admin` | — |
| Create/update/delete link types | `admin` | — |
| Create/update/delete records | `any` (authenticated) | Must be in same org |
| Create/delete links | `any` (authenticated) | Both records in same org |
| Create/update/delete views | `any` (authenticated) | Only creator or admin can modify |
| Query records/views | `any` (authenticated) | Scoped by org |

This follows the existing `createAuthorizedMutation`/`createAuthorizedQuery` pattern from `convex/lib/server.ts`.

## 2.11 Migration Strategy

### Existing Schema Coexistence

The CRM metadata engine adds **new tables alongside existing ones**. It does not modify or migrate any existing tables (`mortgages`, `borrowers`, `deals`, etc.). This means:

- Zero risk to existing functionality
- No data migration required
- Existing hard-coded entities continue to work exactly as before
- Hard-coded entities are surfaced through **system object adapters** that proxy reads to native tables

### Bootstrapping

On first load for an organization (or triggered by admin), the `bootstrapSystemObjects` mutation:

1. Checks if system objectDefs already exist for the org (idempotent)
2. For each entry in `SYSTEM_OBJECT_REGISTRY`:
   - Creates an `objectDef` with `isSystem: true`, `nativeTable: "mortgages"`, etc.
   - Creates `fieldDefs` with `nativeColumnPath` mappings for each registered column
   - Runs `compileField()` to derive capabilities (kanban, calendar, etc.)
3. System objects appear immediately in the object list with a "system" badge
4. Admin can then create custom objects through the UI alongside system objects

The bootstrap is **additive**: if new native tables are registered in `SYSTEM_OBJECT_REGISTRY` in a future deployment, re-running bootstrap adds them without affecting existing objects.

### Registry Evolution

Adding a new native table to the metadata engine requires:

1. Add an entry to `SYSTEM_OBJECT_REGISTRY` in `convex/crm/systemObjects.ts`
2. Add a case to the `queryNativeRecords` adapter in `convex/crm/adapters.ts`
3. Run `bootstrapSystemObjects` for existing organizations (migration cron or manual trigger)

## 2.12 Performance Considerations

### Read Path Optimization

The primary performance concern is the **record assembly query**: loading a page of records requires joining across multiple typed value tables.

**Approach: Parallel fan-out reads**

```typescript
// Load a page of 25 records
const recordPage = await ctx.db
  .query("records")
  .withIndex("by_object_created", q => q.eq("objectDefId", objectDefId))
  .order("desc")
  .take(25);

// Fan out to all value tables in parallel
const recordIds = recordPage.map(r => r._id);
const [texts, numbers, dates, selects, booleans] = await Promise.all([
  loadValuesForRecords(ctx, "recordValuesText", recordIds),
  loadValuesForRecords(ctx, "recordValuesNumber", recordIds),
  loadValuesForRecords(ctx, "recordValuesDate", recordIds),
  loadValuesForRecords(ctx, "recordValuesSelect", recordIds),
  loadValuesForRecords(ctx, "recordValuesBoolean", recordIds),
]);

// Assemble into record objects
return assembleRecords(recordPage, { texts, numbers, dates, selects, booleans });
```

For 25 records with 10 fields each, this is:
- 1 query (records) + 5 parallel queries (value tables) = **6 total queries**
- Each value query returns ~250 rows (25 records × 10 fields) via `by_record` index
- Expected latency: **50-150ms** depending on field count

### Write Path Optimization

Record creation fans out to multiple typed value tables. For a record with 10 fields:
- 1 insert (records) + 10 inserts (values) = **11 writes**
- All within a single mutation (transactional)
- Convex handles this well — mutations are serialized per-document

### Kanban Query Optimization

Kanban views are the most expensive query because they need records grouped by column. Rather than loading all records and grouping client-side:

```typescript
// Query per kanban group (parallel)
const groupQueries = kanbanGroups.map(group =>
  ctx.db.query("recordValuesSelect")
    .withIndex("by_object_field_value", q =>
      q.eq("objectDefId", objectDefId)
       .eq("fieldDefId", boundFieldId)
       .eq("value", group.optionValue)
    )
    .take(GROUP_PAGE_SIZE)
);
const groupResults = await Promise.all(groupQueries);
```

This scales linearly with the number of kanban columns (typically 3-8), not the total record count.

### Future Optimization Path (Post-MVP)

If performance becomes an issue at scale:

1. **Denormalized record cache**: Store assembled record JSON in a `recordCache` table, invalidated on value writes
2. **Aggregate component**: Use Convex Aggregate for kanban column counts
3. **Materialized views**: Pre-compute filtered/sorted result sets for hot views
4. **Pagination cursors**: Efficient cursor-based pagination using compound indexes

## 2.13 Risks and Mitigations

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| **EAV query performance degrades at scale** | High | Medium | Parallel fan-out queries; denormalized cache as escape hatch. Monitor P99 latency. |
| **Index budget exhaustion** | Medium | Low | Current usage is 3-6 per table out of 32. New composite indexes can be added. |
| **Field type changes break existing data** | High | Medium | Field type is immutable after creation. Users must create a new field and migrate data manually (or admin tooling future). |
| **Orphaned values after field deletion** | Low | High | By design: soft-delete preserves values. Cleanup cron is a future enhancement. |
| **Kanban drag-drop race conditions** | Medium | Medium | Convex OCC handles this — conflicting writes retry automatically. |
| **Link cardinality violations** | Medium | Low | Enforced in mutation with index-backed uniqueness check. |
| **Org data leakage** | Critical | Low | All queries filter by `orgId` from auth context. No user-provided org filtering. |
| **Native schema drift** | Medium | Medium | If native table columns are renamed/removed, system adapter fieldDefs become stale. Mitigated by `resolveColumnPath` returning undefined for missing paths (graceful degradation). |
| **Native table lacks required index** | Medium | Low | Kanban/calendar queries for system objects fall back to `.filter()` if native index doesn't exist. Document required indexes per registered table. |

## 2.14 Build Sequence

### Phase 1: Foundation (Control Plane)

**Goal**: Admin can define objects and fields; compiler derives capabilities.

| Step | Deliverable | Dependencies |
|---|---|---|
| 1.1 | Schema additions: `objectDefs`, `fieldDefs`, `fieldCapabilities` | None |
| 1.2 | `convex/crm/objects.ts` — CRUD mutations + queries | 1.1 |
| 1.3 | `convex/crm/fields.ts` — CRUD mutations + compiler | 1.1, 1.2 |
| 1.4 | `getEligibleFields()` query | 1.3 |
| 1.5 | Admin UI: Object list + create modal | 1.2 |
| 1.6 | Admin UI: Field list + create/edit forms | 1.3 |

### Phase 2: Data Plane (Records)

**Goal**: Users can create and query records of custom object types.

| Step | Deliverable | Dependencies |
|---|---|---|
| 2.1 | Schema additions: `records`, all typed value tables | 1.1 |
| 2.2 | `convex/crm/records.ts` — createRecord, updateRecord, deleteRecord | 2.1, 1.3 |
| 2.3 | `queryRecords()` with pagination and assembly | 2.2 |
| 2.4 | `getRecord()` with full value assembly | 2.2 |
| 2.5 | Record creation form (dynamic from fieldDefs) | 2.2, 1.6 |
| 2.6 | Record detail page (dynamic field display) | 2.4 |

### Phase 3: Views

**Goal**: Table, kanban, and calendar views are functional.

| Step | Deliverable | Dependencies |
|---|---|---|
| 3.1 | Schema additions: `viewDefs`, `viewFields`, `viewFilters`, `viewKanbanGroups` | 2.1 |
| 3.2 | `convex/crm/views.ts` — createView, getViewConfig | 3.1, 1.4 |
| 3.3 | Table view component (columns from viewFields) | 3.2, 2.3 |
| 3.4 | Kanban view component (columns from kanban groups) | 3.2, 2.3 |
| 3.5 | Calendar view component (events from date values) | 3.2, 2.3 |
| 3.6 | View switcher UI (table/kanban/calendar tabs) | 3.3, 3.4, 3.5 |
| 3.7 | View filter builder UI | 3.2 |

### Phase 4: System Object Adapters

**Goal**: Native tables (mortgages, borrowers, deals) appear as system objects with views.

| Step | Deliverable | Dependencies |
|---|---|---|
| 4.1 | `SYSTEM_OBJECT_REGISTRY` definition | 1.1 |
| 4.2 | `convex/crm/systemObjects.ts` — bootstrapSystemObjects mutation | 4.1, 1.3 |
| 4.3 | `convex/crm/adapters.ts` — queryNativeRecords, resolveNativeRecord | 4.1, 2.3 |
| 4.4 | Wire `queryRecords()` to branch on `objectDef.isSystem` | 4.3 |
| 4.5 | Verify kanban view works for Mortgage status | 4.4, 3.4 |
| 4.6 | Verify calendar view works for Mortgage maturity date | 4.4, 3.5 |
| 4.7 | System object badge in object list UI | 4.2, 1.5 |

### Phase 5: Links (with Native Entity Support)

**Goal**: Records can be linked across object types, including to native entities.

| Step | Deliverable | Dependencies |
|---|---|---|
| 5.1 | Schema additions: `linkTypeDefs`, `recordLinks` (with kind/string ID support) | 2.1, 4.1 |
| 5.2 | `convex/crm/linkTypes.ts` — CRUD (supports system objects on either side) | 5.1, 1.2 |
| 5.3 | `convex/crm/links.ts` — createLink, deleteLink, getLinkedRecords (handles native refs) | 5.1, 2.2, 4.3 |
| 5.4 | Link type admin UI | 5.2 |
| 5.5 | Linked records panel on record detail page (both custom and native) | 5.3, 2.6 |
| 5.6 | Link creation modal (search custom records + native entities) | 5.3 |

---

## Appendix A: Field Type to Storage Table Mapping

| Field Type | Storage Table | Value Column Type | Indexed? |
|---|---|---|---|
| `text` | `recordValuesText` | `v.string()` | Yes |
| `email` | `recordValuesText` | `v.string()` | Yes |
| `phone` | `recordValuesText` | `v.string()` | Yes |
| `url` | `recordValuesText` | `v.string()` | No (too long) |
| `number` | `recordValuesNumber` | `v.number()` | Yes |
| `currency` | `recordValuesNumber` | `v.number()` | Yes |
| `percentage` | `recordValuesNumber` | `v.number()` | Yes |
| `boolean` | `recordValuesBoolean` | `v.boolean()` | Yes |
| `date` | `recordValuesDate` | `v.number()` (unix ms) | Yes |
| `datetime` | `recordValuesDate` | `v.number()` (unix ms) | Yes |
| `select` | `recordValuesSelect` | `v.string()` | Yes |
| `multi_select` | `recordValuesMultiSelect` | `v.array(v.string())` | No (array) |
| `rich_text` | `recordValuesRichText` | `v.string()` | No (large) |
| `user_ref` | `recordValuesUserRef` | `v.string()` | Yes |

## Appendix B: Capability Derivation Matrix

| Field Type | table | kanban | calendar | group_by | aggregate | sort |
|---|---|---|---|---|---|---|
| `text` | Y | — | — | — | — | — |
| `number` | Y | — | — | — | Y | Y |
| `boolean` | Y | — | — | — | — | — |
| `date` | Y | — | Y | — | — | Y |
| `datetime` | Y | — | Y | — | — | Y |
| `select` | Y | Y | — | Y | — | — |
| `multi_select` | Y | Y | — | — | — | — |
| `email` | Y | — | — | — | — | — |
| `phone` | Y | — | — | — | — | — |
| `url` | Y | — | — | — | — | — |
| `currency` | Y | — | — | — | Y | Y |
| `percentage` | Y | — | — | — | Y | Y |
| `rich_text` | Y | — | — | — | — | — |
| `user_ref` | Y | — | — | — | — | — |

## Appendix C: Example Data Flow — "Create Lead Pipeline"

### Step 1: Admin creates "Lead" object

```
POST createObject({ name: "lead", singularLabel: "Lead", pluralLabel: "Leads", icon: "user-plus" })
→ objectDefs row created: { _id: "obj_123", orgId: "org_abc", name: "lead", ... }
```

### Step 2: Admin adds fields

```
POST createField({ objectDefId: "obj_123", name: "company_name", label: "Company Name", fieldType: "text", isRequired: true })
→ fieldDefs row + fieldCapabilities: [{ capability: "table" }]

POST createField({ objectDefId: "obj_123", name: "status", label: "Status", fieldType: "select", isRequired: true,
  options: [
    { value: "new", label: "New", color: "blue", order: 0 },
    { value: "contacted", label: "Contacted", color: "yellow", order: 1 },
    { value: "qualified", label: "Qualified", color: "green", order: 2 },
    { value: "lost", label: "Lost", color: "red", order: 3 },
  ]
})
→ fieldDefs row + fieldCapabilities: [{ capability: "table" }, { capability: "kanban" }, { capability: "group_by" }]

POST createField({ objectDefId: "obj_123", name: "next_followup", label: "Next Follow-up", fieldType: "date", isRequired: false })
→ fieldDefs row + fieldCapabilities: [{ capability: "table" }, { capability: "calendar" }, { capability: "sort" }]

POST createField({ objectDefId: "obj_123", name: "deal_value", label: "Deal Value", fieldType: "currency", isRequired: false })
→ fieldDefs row + fieldCapabilities: [{ capability: "table" }, { capability: "aggregate" }, { capability: "sort" }]
```

### Step 3: User creates views

```
POST createView({ objectDefId: "obj_123", name: "All Leads", viewType: "table" })
→ viewDefs row + viewFields for all 4 fields

POST createView({ objectDefId: "obj_123", name: "Pipeline Board", viewType: "kanban", boundFieldId: "fld_status" })
→ viewDefs row + viewKanbanGroups: ["New", "Contacted", "Qualified", "Lost", "No Value"]

POST createView({ objectDefId: "obj_123", name: "Follow-up Calendar", viewType: "calendar", boundFieldId: "fld_next_followup" })
→ viewDefs row (no additional config needed)
```

### Step 4: User creates records

```
POST createRecord({ objectDefId: "obj_123", values: {
  "company_name": "Acme Corp",
  "status": "new",
  "next_followup": "2026-03-01",
  "deal_value": 250000
}})
→ records row + 4 value rows:
  - recordValuesText: { recordId, fieldDefId: "fld_company_name", value: "Acme Corp" }
  - recordValuesSelect: { recordId, fieldDefId: "fld_status", value: "new" }
  - recordValuesDate: { recordId, fieldDefId: "fld_next_followup", value: 1772524800000 }
  - recordValuesNumber: { recordId, fieldDefId: "fld_deal_value", value: 250000 }
```

### Step 5: User views in kanban

```
GET queryRecords for Pipeline Board:
  "New" column: [Acme Corp ($250K)]
  "Contacted" column: []
  "Qualified" column: []
  "Lost" column: []

User drags "Acme Corp" to "Contacted" column:
→ POST updateRecord({ recordId, values: { "status": "contacted" } })
→ recordValuesSelect updated: value = "contacted"
→ Kanban reactively updates
```

---

**End of Document**
