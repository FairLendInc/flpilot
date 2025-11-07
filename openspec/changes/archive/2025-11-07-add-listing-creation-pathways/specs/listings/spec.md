# Listings Capability - Listing Creation Webhook

## MODIFIED Requirements

### Requirement: Listing Mutations
The listing lifecycle SHALL support orchestrated creation that validates upstream mortgage and borrower data.

#### Scenario: Orchestrated listing creation with mortgage payload
- **WHEN** the platform receives a create-listing request (from admin UI or webhook)
- **THEN** the mutation SHALL validate borrower details (email format, Rotessa ID uniqueness) and create or reuse the borrower
- **AND** it SHALL create the mortgage with all required property, appraisal, and financial fields, applying the same business rules as `mortgages.createMortgage`
- **AND** it SHALL insert the listing referencing the new mortgage while ensuring the one-listing-per-mortgage invariant

## ADDED Requirements

### Requirement: Listing Creation Webhook
Convex SHALL expose an authenticated HTTP endpoint that accepts a full listing payload and produces a marketplace listing.

#### Scenario: API key authentication
- **WHEN** an HTTP request hits `/listings/create`
- **THEN** the handler SHALL verify a shared secret provided via `x-api-key` header that matches a configured environment value
- **AND** it SHALL reject missing or invalid keys with a 401 response before reading or mutating data

#### Scenario: Payload validation and error reporting
- **WHEN** the webhook receives a JSON payload
- **THEN** it SHALL validate borrower, mortgage, and listing fields using application-level checks (email format, numeric ranges, coordinate bounds, date ordering, LTV within 0-100)
- **AND** any validation failure SHALL return a 400 response with machine-readable error codes
- **AND** the webhook SHALL NOT rely solely on Convex type validation to catch bad input

#### Scenario: Reuse borrower and enforce listing uniqueness
- **WHEN** the payload references a borrower email or Rotessa ID that already exists
- **THEN** the webhook SHALL reuse that borrower record
- **AND** it SHALL ensure that no listing already exists for the payload’s mortgage by checking an `externalMortgageId` identifier supplied in the payload
- **AND** duplicate submissions that reuse the same `externalMortgageId` SHALL return an idempotent success response without creating a second listing
