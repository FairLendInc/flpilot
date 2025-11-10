# listing-detail Specification Delta

## ADDED Requirements

### Requirement: As-If Appraisal Financial Metrics Display

The system SHALL display as-if complete appraisal details in the key financials section when present.

#### Scenario: Display as-if appraisal card in financial metrics
- **WHEN** viewing listing detail with mortgage that has asIfAppraisal data
- **THEN** the system SHALL display "As-If Complete Appraisal" card in key financials section
- **AND** SHALL show market value formatted as currency
- **AND** SHALL show appraisal method (free text)
- **AND** SHALL show appraisal company name
- **AND** SHALL show appraisal date formatted as readable date
- **AND** SHALL use blue/cyan theme to differentiate from prior encumbrance
- **AND** SHALL use building or file-check icon

#### Scenario: Hide as-if appraisal card when not present
- **WHEN** viewing listing detail with mortgage without asIfAppraisal data
- **THEN** the system SHALL not render as-if appraisal card
- **AND** SHALL not show empty state or placeholder
- **AND** SHALL seamlessly display other financial metrics

#### Scenario: As-if appraisal card layout
- **WHEN** as-if appraisal card is rendered
- **THEN** the system SHALL use 2-column card layout matching existing financial metric cards
- **AND** SHALL display fields as label-value pairs
- **AND** SHALL ensure responsive design on mobile devices
- **AND** SHALL maintain visual consistency with other metric cards

#### Scenario: As-if appraisal data formatting
- **WHEN** displaying as-if appraisal fields
- **THEN** the system SHALL format marketValue as: "$XXX,XXX" (currency with commas)
- **AND** SHALL display method as provided (no formatting)
- **AND** SHALL display company as provided (no formatting)
- **AND** SHALL format date as human-readable (e.g., "March 15, 2024")

## MODIFIED Requirements

### Requirement: Financial Metrics Display

The system SHALL display comprehensive financial metrics for listed mortgages in the listing detail view.

**Change**: Add as-if appraisal card to financial metrics alongside existing prior encumbrance display.

#### Scenario: Financial metrics section includes optional appraisal data
- **WHEN** viewing listing detail key financials
- **THEN** the system SHALL display all existing metrics (loan amount, interest rate, LTV, etc.)
- **AND** SHALL display prior encumbrance card if priorEncumbrance data exists (already implemented)
- **AND** SHALL display as-if appraisal card if asIfAppraisal data exists (new)
- **AND** SHALL order cards logically: core metrics → prior encumbrance → as-if appraisal
- **AND** SHALL maintain consistent spacing and visual hierarchy

#### Scenario: Financial metrics type safety
- **WHEN** defining FinancialMetricsProps type
- **THEN** the system SHALL include optional asIfAppraisal field in financials object
- **AND** SHALL type as: `{ marketValue: number; method: string; company: string; date: string } | null`
- **AND** SHALL maintain type safety for optional field access
- **AND** SHALL provide IntelliSense and autocomplete for new field

### Requirement: Appraisal Data Display

The system SHALL support appraisal visualization and analysis features for listed mortgages.

**Change**: Split comparable properties display into separate as-is and as-if sections.

#### Scenario: Comparables section split by valuation type
- **WHEN** viewing listing detail appraisal data
- **THEN** the system SHALL display "As-Is Appraisal Comparables" section first
- **AND** SHALL show comparables where asIf is false/undefined
- **AND** SHALL display "As-If Complete Appraisal Comparables" section below (if as-if comparables exist)
- **AND** SHALL show comparables where asIf === true
- **AND** SHALL maintain identical card layout and styling in both sections
- **AND** SHALL order comparables by distance ascending within each section

#### Scenario: As-is comparables section always visible
- **WHEN** viewing listing detail with comparables
- **THEN** the system SHALL always display "As-Is Appraisal Comparables" section
- **AND** SHALL show heading even if section is empty (rare)
- **AND** SHALL filter and display comparables where !asIf
- **AND** SHALL use existing comparable card component

#### Scenario: As-if comparables section conditional display
- **WHEN** viewing listing detail
- **THEN** the system SHALL only render "As-If Complete Appraisal Comparables" section if as-if comparables exist
- **AND** SHALL not show section if all comparables are as-is (!asIf)
- **AND** SHALL not show empty state for as-if section
- **AND** SHALL seamlessly show only as-is section when appropriate

#### Scenario: Visual separation of appraisal sections
- **WHEN** both as-is and as-if sections are displayed
- **THEN** the system SHALL provide clear heading for each section
- **AND** SHALL use visual spacing to separate sections
- **AND** SHALL maintain consistent styling within each section
- **AND** SHALL enable users to easily distinguish valuation types

## REMOVED Requirements

None.
