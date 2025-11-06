# Appraisal Comparables Schema Specification

## ADDED Requirements

### Requirement: Appraisal Comparables Table Structure

The system SHALL define an `appraisal_comparables` table for storing comparable property data linked to mortgage appraisals.

#### Scenario: Create comparable property record
- **WHEN** a comparable is created
- **THEN** the system stores mortgageId, address, saleAmount, saleDate
- **AND** validates mortgageId references existing mortgage
- **AND** validates saleAmount > 0
- **AND** validates saleDate is valid ISO date string

#### Scenario: Store property characteristics
- **WHEN** creating comparable with property details
- **THEN** the system stores optional squareFeet, bedrooms, bathrooms, propertyType
- **AND** validates numeric fields are positive when present
- **AND** allows omitting optional fields

#### Scenario: Calculate distance from subject property
- **WHEN** storing comparable
- **THEN** the system stores distance in miles from subject property
- **AND** validates distance >= 0
- **AND** enables proximity-based sorting

#### Scenario: Store comparable image
- **WHEN** adding comparable property
- **THEN** the system stores imageUrl for visual reference
- **AND** validates URL format when provided
- **AND** supports placeholder images for missing photos

### Requirement: Comparable Relationships

The system SHALL link comparables to their associated mortgages.

#### Scenario: Multiple comparables per mortgage
- **WHEN** appraisal includes multiple comparable properties
- **THEN** the system allows multiple comparable records per mortgageId
- **AND** supports 3-10 comparables (typical appraisal range)
- **AND** enables comprehensive valuation context

#### Scenario: Query comparables for mortgage
- **WHEN** displaying mortgage appraisal data
- **THEN** the system returns all comparables for that mortgage
- **AND** orders by distance ascending (closest first)
- **AND** includes all property characteristics

#### Scenario: Orphan comparable prevention
- **WHEN** attempting to delete a mortgage
- **THEN** the system checks for linked comparables
- **AND** cascades delete to remove comparables
- **OR** rejects deletion with clear error

### Requirement: Comparable Queries

The system SHALL provide query functions for appraisal data access.

#### Scenario: Get comparables for mortgage
- **WHEN** querying comparables by mortgageId
- **THEN** the system uses by_mortgage index
- **AND** returns all comparables in O(log n) time
- **AND** orders by distance ascending

#### Scenario: Filter comparables by characteristics
- **WHEN** filtering comparables by property type or size
- **THEN** the system filters results in application layer
- **AND** supports matching similar properties
- **AND** enables appraisal analysis

#### Scenario: Get comparables within distance
- **WHEN** querying comparables within radius
- **THEN** the system filters by distance field
- **AND** returns only comparables within specified miles
- **AND** supports proximity-based analysis

#### Scenario: Sort comparables by sale date
- **WHEN** sorting by recency
- **THEN** the system orders by saleDate descending
- **AND** shows most recent sales first
- **AND** enables temporal market analysis

### Requirement: Comparable Mutations

The system SHALL provide mutation functions for comparable data management.

#### Scenario: Create comparable record
- **WHEN** adding comparable to appraisal
- **THEN** the system validates all required fields
- **AND** validates mortgage exists
- **AND** validates numeric constraints
- **AND** returns new comparable ID

#### Scenario: Bulk create comparables
- **WHEN** importing appraisal with multiple comparables
- **THEN** the system accepts array of comparable data
- **AND** creates all records in single operation
- **AND** maintains atomic consistency

#### Scenario: Update comparable data
- **WHEN** correcting comparable information
- **THEN** the system allows updating all fields except mortgageId
- **AND** validates updated data meets constraints
- **AND** triggers reactive query updates

#### Scenario: Delete comparable
- **WHEN** removing incorrect comparable
- **THEN** the system deletes record by ID
- **AND** maintains other comparables for mortgage
- **AND** updates appraisal display

#### Scenario: Delete all comparables for mortgage
- **WHEN** replacing appraisal data
- **THEN** the system deletes all comparables by mortgageId
- **AND** enables clean replacement of comparable set
- **AND** maintains referential integrity

### Requirement: Type Safety and Validation

The system SHALL enforce type safety and data validation at schema level.

#### Scenario: Validate required fields
- **WHEN** creating comparable
- **THEN** the system requires: mortgageId, address (street, city, state, zip), saleAmount, saleDate, distance
- **AND** rejects writes with missing required fields
- **AND** provides validation error messages

#### Scenario: Validate numeric constraints
- **WHEN** setting numeric fields
- **THEN** the system validates saleAmount > 0
- **AND** validates distance >= 0
- **AND** validates squareFeet > 0 if present
- **AND** validates bedrooms >= 0 if present
- **AND** validates bathrooms >= 0 if present

#### Scenario: Validate address structure
- **WHEN** setting address fields
- **THEN** the system requires street, city, state, zip
- **AND** validates each field is non-empty
- **AND** stores as nested object structure

#### Scenario: Auto-generate TypeScript types
- **WHEN** schema is defined
- **THEN** Convex generates Doc<"appraisal_comparables"> type
- **AND** generates Id<"appraisal_comparables"> for IDs
- **AND** provides address object type definition

### Requirement: Indexing Strategy

The system SHALL provide indexed access patterns for comparable queries.

#### Scenario: Index by mortgage
- **WHEN** schema defines by_mortgage index
- **THEN** the system creates index on mortgageId
- **AND** enables O(log n) appraisal data lookups
- **AND** supports efficient comparable retrieval

#### Scenario: Index by sale date
- **WHEN** schema defines by_sale_date index
- **THEN** the system creates index on saleDate
- **AND** enables temporal filtering and sorting
- **AND** supports market trend analysis

### Requirement: Appraisal Data Display

The system SHALL support appraisal visualization and analysis features.

#### Scenario: Display comparable cards
- **WHEN** showing appraisal data on listing detail page
- **THEN** the system provides comparable data with images
- **AND** displays property characteristics
- **AND** shows distance and sale information

#### Scenario: Calculate average comparable value
- **WHEN** analyzing appraisal
- **THEN** application calculates average of comparable sale amounts
- **AND** compares to subject property loan amount
- **AND** derives LTV and valuation metrics

#### Scenario: Map comparable locations
- **WHEN** displaying appraisal map
- **THEN** application uses address to geocode locations
- **AND** displays markers for each comparable
- **AND** shows distance radius from subject property

#### Scenario: Compare property characteristics
- **WHEN** analyzing comparable validity
- **THEN** application compares squareFeet, bedrooms, bathrooms
- **AND** identifies similar vs dissimilar properties
- **AND** weights comparables by similarity

### Requirement: Appraisal Data Integrity

The system SHALL maintain integrity between comparables and mortgages.

#### Scenario: Link to appraisal document
- **WHEN** comparables are extracted from appraisal document
- **THEN** comparable data matches appraisal document in mortgage.documents
- **AND** imageUrl references actual comparable photos if available
- **AND** maintains data consistency with source document

#### Scenario: Validate comparable count
- **WHEN** appraisal is complete
- **THEN** mortgage should have 3-10 comparables (typical range)
- **AND** system warns if count is outside normal range
- **AND** allows any count but flags for review

#### Scenario: Historical comparable data
- **WHEN** mortgage is renewed or replaced
- **THEN** old mortgage retains original comparable data
- **AND** new mortgage gets fresh appraisal comparables
- **AND** preserves historical valuation context

### Requirement: Minimal Data Model

The system SHALL store essential comparable data following YAGNI principles.

#### Scenario: Exclude unnecessary details
- **WHEN** defining comparable schema
- **THEN** the system stores only essential appraisal data
- **AND** does not store lot size, year built, or detailed features
- **AND** keeps model simple and maintainable

#### Scenario: Optional characteristic fields
- **WHEN** comparable data is incomplete
- **THEN** the system allows omitting squareFeet, bedrooms, bathrooms, propertyType
- **AND** displays available data only
- **AND** handles missing data gracefully in UI

#### Scenario: Extensibility for future fields
- **WHEN** more detailed comparable data is needed
- **THEN** schema can add optional fields without migration
- **AND** existing records remain valid
- **AND** new fields default to undefined

### Requirement: Comparable Data Sources

The system SHALL support comparable data from various sources.

#### Scenario: Manual comparable entry
- **WHEN** appraiser manually enters comparable data
- **THEN** the system accepts direct input of all fields
- **AND** validates data meets schema requirements
- **AND** stores for appraisal display

#### Scenario: Imported appraisal data
- **WHEN** importing from appraisal document or API
- **THEN** the system parses comparable data structure
- **AND** maps to schema fields
- **AND** bulk creates all comparables

#### Scenario: Placeholder comparable data
- **WHEN** using mock/seed data for development
- **THEN** the system accepts generated comparable data
- **AND** uses placeholder images
- **AND** maintains realistic distance and sale amounts
