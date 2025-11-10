# appraisal-comparables Specification Delta

## ADDED Requirements

### Requirement: As-If Appraisal Comparable Classification

The system SHALL support classification of comparable properties as as-is or as-if complete valuations using a boolean flag.

#### Scenario: Store as-if classification flag
- **WHEN** a comparable is created
- **THEN** the system SHALL accept optional `asIf` boolean field
- **AND** SHALL default to false/undefined for as-is comparables
- **AND** SHALL set to true for as-if complete comparables
- **AND** SHALL enable filtering comparables by valuation type

#### Scenario: Create as-is comparable (default)
- **WHEN** creating comparable without asIf field
- **THEN** the system SHALL treat comparable as as-is valuation
- **AND** SHALL not require asIf field (optional, defaults to false/undefined)
- **AND** SHALL display in as-is appraisal section

#### Scenario: Create as-if comparable
- **WHEN** creating comparable with asIf: true
- **THEN** the system SHALL classify comparable as as-if complete valuation
- **AND** SHALL display in as-if appraisal section (separate from as-is)
- **AND** SHALL maintain all other comparable data fields

#### Scenario: Query comparables by valuation type
- **WHEN** displaying appraisal data
- **THEN** the system SHALL filter comparables by asIf field
- **AND** SHALL return as-is comparables when filtering by !asIf
- **AND** SHALL return as-if comparables when filtering by asIf === true
- **AND** SHALL enable separate display sections for each type

#### Scenario: Update comparable valuation type
- **WHEN** reclassifying comparable from as-is to as-if or vice versa
- **THEN** the system SHALL allow updating asIf field
- **AND** SHALL trigger reactive query updates
- **AND** SHALL automatically move comparable to appropriate display section

### Requirement: Separate As-Is and As-If Appraisal Display Sections

The system SHALL display comparable properties in separate sections based on valuation type.

#### Scenario: Display as-is appraisal comparables section
- **WHEN** viewing mortgage with comparables
- **THEN** the system SHALL display "As-Is Appraisal Comparables" section heading
- **AND** SHALL filter and show comparables where asIf is false/undefined
- **AND** SHALL maintain existing comparable card layout
- **AND** SHALL order by distance ascending (closest first)
- **AND** SHALL always display this section (as-is is default)

#### Scenario: Display as-if appraisal comparables section
- **WHEN** viewing mortgage with as-if comparables
- **THEN** the system SHALL display "As-If Complete Appraisal Comparables" section heading
- **AND** SHALL filter and show comparables where asIf === true
- **AND** SHALL mirror as-is section layout for consistency
- **AND** SHALL order by distance ascending (closest first)
- **AND** SHALL only display if as-if comparables exist (conditional render)

#### Scenario: Empty as-if section handling
- **WHEN** mortgage has no as-if comparables
- **THEN** the system SHALL not render as-if appraisal section
- **AND** SHALL only show as-is section
- **AND** SHALL not show empty state for as-if section

#### Scenario: Visual differentiation of sections
- **WHEN** both sections are displayed
- **THEN** the system SHALL clearly label each section with distinct headings
- **AND** SHALL provide visual separation between sections
- **AND** SHALL use consistent card styling within each section
- **AND** SHALL enable users to quickly distinguish valuation types

## MODIFIED Requirements

### Requirement: Appraisal Comparables Table Structure

The system SHALL define an `appraisal_comparables` table for storing comparable property data linked to mortgage appraisals.

**Change**: Add optional `asIf` boolean field to support as-if complete valuations.

#### Scenario: Create comparable with valuation type classification
- **WHEN** a comparable is created
- **THEN** the system SHALL accept optional asIf field in addition to existing fields
- **AND** SHALL validate asIf is boolean if provided
- **AND** SHALL store mortgageId, address, saleAmount, saleDate, distance, asIf (and other existing fields)
- **AND** SHALL maintain backward compatibility with existing comparables (no asIf field)

### Requirement: Comparable Queries

The system SHALL provide query functions for appraisal data access.

**Change**: Support filtering comparables by as-is vs as-if classification.

#### Scenario: Get comparables for mortgage with valuation type filter
- **WHEN** querying comparables by mortgageId
- **THEN** the system SHALL return all comparables using by_mortgage index
- **AND** SHALL include asIf field in results
- **AND** SHALL enable application-layer filtering by asIf value
- **AND** SHALL support separate queries for as-is (!asIf) and as-if (asIf === true) comparables
- **AND** SHALL order each filtered set by distance ascending

## REMOVED Requirements

None.
