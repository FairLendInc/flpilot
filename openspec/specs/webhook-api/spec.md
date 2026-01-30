# webhook-api Specification

## Purpose

This specification defines the secure HTTP webhook API for external system integration with FairLend's core entities: borrowers, mortgages, and listings. All endpoints use API key authentication, Zod validation, and return consistent JSON responses. The API supports multiple lookup strategies (internal IDs, external IDs, natural keys) to accommodate various integration workflows.

## Requirements

### Requirement: API Key Authentication

The system SHALL validate API key authentication for all webhook endpoints before processing requests.

#### Scenario: Valid API key

- **WHEN** a request includes a valid `x-api-key` header matching `LISTINGS_WEBHOOK_API_KEY`
- **THEN** the system SHALL proceed with request processing
- **AND** log the successful authentication for audit purposes

#### Scenario: Missing API key

- **WHEN** a request does not include the `x-api-key` header
- **THEN** the system SHALL return 401 Unauthorized
- **AND** include `code: "invalid_api_key"` in the response body
- **AND** include `message: "Missing or invalid API key"` in the response body

#### Scenario: Invalid API key

- **WHEN** a request includes an `x-api-key` header that does not match the configured key
- **THEN** the system SHALL return 401 Unauthorized
- **AND** include `code: "invalid_api_key"` in the response body

#### Scenario: Unconfigured API key

- **WHEN** the `LISTINGS_WEBHOOK_API_KEY` environment variable is not set
- **THEN** the system SHALL return 500 Internal Server Error
- **AND** include `code: "configuration_error"` in the response body
- **AND** log the configuration error

### Requirement: CORS Support

The system SHALL include appropriate CORS headers on all webhook responses.

#### Scenario: OPTIONS preflight request

- **WHEN** an OPTIONS request is received on any webhook endpoint
- **THEN** the system SHALL return 204 No Content
- **AND** include `Access-Control-Allow-Origin` header
- **AND** include `Access-Control-Allow-Methods` header
- **AND** include `Access-Control-Allow-Headers: Content-Type, X-API-Key`

#### Scenario: Response CORS headers

- **WHEN** any webhook request is processed
- **THEN** the response SHALL include `Access-Control-Allow-Origin` header
- **AND** the response SHALL include `Content-Type: application/json` header

### Requirement: Borrower Create Endpoint

The system SHALL provide a `POST /borrowers/create` endpoint for creating borrower records.

#### Scenario: Create new borrower

- **WHEN** a valid request is received with name, email, and rotessaCustomerId
- **AND** no borrower exists with the given rotessaCustomerId
- **THEN** the system SHALL create a new borrower record
- **AND** return 201 Created
- **AND** include `code: "borrower_created"` in the response
- **AND** include the new borrowerId and `created: true` in the response

#### Scenario: Idempotent borrower creation

- **WHEN** a request is received with a rotessaCustomerId that already exists
- **THEN** the system SHALL NOT create a duplicate borrower
- **AND** return 200 OK
- **AND** include `code: "borrower_already_exists"` in the response
- **AND** include the existing borrowerId and `created: false` in the response

#### Scenario: Create borrower with optional phone

- **WHEN** a request includes optional phone field
- **THEN** the system SHALL store the phone number with the borrower record

#### Scenario: Invalid email format

- **WHEN** a request is received with an invalid email format
- **THEN** the system SHALL return 400 Bad Request
- **AND** include `code: "payload_validation_error"` in the response
- **AND** include specific error details with path and code

#### Scenario: Missing required fields

- **WHEN** a request is received without name, email, or rotessaCustomerId
- **THEN** the system SHALL return 400 Bad Request
- **AND** include `code: "payload_validation_error"` in the response
- **AND** list all missing field errors

### Requirement: Borrower Read Endpoint

The system SHALL provide a `GET /borrowers/get` endpoint for retrieving a single borrower record.

#### Scenario: Get borrower by internal ID

- **WHEN** a request is received with a valid borrowerId query parameter
- **THEN** the system SHALL return the borrower record
- **AND** return 200 OK
- **AND** include the full borrower document in the response

#### Scenario: Get borrower by Rotessa customer ID

- **WHEN** a request is received with a valid rotessaCustomerId query parameter
- **THEN** the system SHALL return the matching borrower record
- **AND** return 200 OK

#### Scenario: Get borrower by email

- **WHEN** a request is received with an email query parameter
- **THEN** the system SHALL return the first matching borrower record
- **AND** return 200 OK

#### Scenario: Borrower not found

- **WHEN** a request is received with an ID that does not match any borrower
- **THEN** the system SHALL return 404 Not Found
- **AND** include `code: "borrower_not_found"` in the response

#### Scenario: Missing identifier

- **WHEN** a request is received without borrowerId, rotessaCustomerId, or email
- **THEN** the system SHALL return 400 Bad Request
- **AND** include `code: "missing_identifier"` in the response
- **AND** include message explaining required parameters

#### Scenario: Identifier priority

- **WHEN** multiple identifiers are provided
- **THEN** the system SHALL use priority order: borrowerId > rotessaCustomerId > email

### Requirement: Borrower List Endpoint

The system SHALL provide a `GET /borrowers/list` endpoint for listing borrowers with filters.

#### Scenario: List all borrowers

- **WHEN** a request is received without filters
- **THEN** the system SHALL return paginated borrower list
- **AND** return 200 OK
- **AND** include borrowers array, nextCursor, hasMore, and total count

#### Scenario: Filter by email contains

- **WHEN** a request includes emailContains query parameter
- **THEN** the system SHALL return borrowers with emails containing the string (case-insensitive)

#### Scenario: Filter by name contains

- **WHEN** a request includes nameContains query parameter
- **THEN** the system SHALL return borrowers with names containing the string (case-insensitive)

#### Scenario: Filter by creation date range

- **WHEN** a request includes createdAfter and/or createdBefore query parameters
- **THEN** the system SHALL return borrowers created within the date range

#### Scenario: Pagination with limit

- **WHEN** a request includes limit query parameter
- **THEN** the system SHALL return at most that many borrowers
- **AND** default to 100 if not specified
- **AND** cap at 500 maximum

#### Scenario: Pagination with cursor

- **WHEN** a request includes cursor from previous response
- **THEN** the system SHALL return the next page of results
- **AND** maintain consistent ordering across pages

### Requirement: Borrower Update Endpoint

The system SHALL provide a `PATCH /borrowers/update` endpoint for updating borrower records.

#### Scenario: Update borrower by internal ID

- **WHEN** a request is received with a valid borrowerId and update fields
- **THEN** the system SHALL update the specified fields
- **AND** return 200 OK
- **AND** include `code: "borrower_updated"` in the response

#### Scenario: Update borrower by Rotessa ID

- **WHEN** a request is received with rotessaCustomerId instead of borrowerId
- **THEN** the system SHALL lookup and update the matching borrower
- **AND** return 200 OK

#### Scenario: Update name field

- **WHEN** a request includes name field
- **THEN** the system SHALL update the borrower's name

#### Scenario: Update email field

- **WHEN** a request includes email field
- **THEN** the system SHALL validate email format
- **AND** update the borrower's email if valid

#### Scenario: Update phone field

- **WHEN** a request includes phone field
- **THEN** the system SHALL update the borrower's phone number

#### Scenario: Borrower not found for update

- **WHEN** an update request is received for a non-existent borrower
- **THEN** the system SHALL return 404 Not Found
- **AND** include `code: "borrower_not_found"` in the response

#### Scenario: rotessaCustomerId is immutable

- **WHEN** a request attempts to update the rotessaCustomerId field
- **THEN** the system SHALL ignore the field
- **AND** process other valid fields normally

### Requirement: Borrower Delete Endpoint

The system SHALL provide a `DELETE /borrowers/delete` endpoint for removing borrower records.

#### Scenario: Delete borrower with no dependencies

- **WHEN** a delete request is received for a borrower with no linked mortgages
- **THEN** the system SHALL permanently delete the borrower record
- **AND** return 200 OK
- **AND** include `code: "borrower_deleted"` in the response

#### Scenario: Delete borrower by Rotessa ID

- **WHEN** a delete request uses rotessaCustomerId instead of borrowerId
- **THEN** the system SHALL lookup and delete the matching borrower

#### Scenario: Delete borrower with linked mortgages blocked

- **WHEN** a delete request is received for a borrower with linked mortgages
- **AND** force flag is not set or is false
- **THEN** the system SHALL NOT delete the borrower
- **AND** return 409 Conflict
- **AND** include `code: "borrower_has_dependencies"` in the response
- **AND** include the count of linked mortgages

#### Scenario: Force delete borrower with linked mortgages

- **WHEN** a delete request includes force=true
- **AND** borrower has linked mortgages
- **THEN** the system SHALL cascade delete mortgages and their listings
- **AND** delete the borrower
- **AND** return 200 OK with deletion counts

#### Scenario: Borrower not found for deletion

- **WHEN** a delete request is received for a non-existent borrower
- **THEN** the system SHALL return 404 Not Found
- **AND** include `code: "borrower_not_found"` in the response

### Requirement: Mortgage Create Endpoint

The system SHALL provide a `POST /mortgages/create` endpoint for creating standalone mortgage records.

#### Scenario: Create mortgage with borrowerId

- **WHEN** a request includes borrowerId referencing an existing borrower
- **THEN** the system SHALL create a mortgage linked to that borrower
- **AND** return 201 Created
- **AND** include mortgageId, borrowerId, created: true

#### Scenario: Create mortgage with borrowerRotessaId

- **WHEN** a request includes borrowerRotessaId instead of borrowerId
- **THEN** the system SHALL lookup borrower by Rotessa customer ID
- **AND** create mortgage linked to found borrower
- **AND** return 201 Created

#### Scenario: Create mortgage with inline borrower

- **WHEN** a request includes borrower object with name, email, rotessaCustomerId
- **THEN** the system SHALL create or reuse borrower (idempotent by rotessaCustomerId)
- **AND** create mortgage linked to that borrower
- **AND** return 201 Created
- **AND** include borrowerCreated: true/false indicating if borrower was new

#### Scenario: Idempotent mortgage creation

- **WHEN** a request includes externalMortgageId that already exists
- **THEN** the system SHALL NOT create a duplicate mortgage
- **AND** return 200 OK
- **AND** include `code: "mortgage_already_exists"` and existing mortgageId

#### Scenario: Invalid borrowerId

- **WHEN** a request includes borrowerId that does not exist
- **THEN** the system SHALL return 400 Bad Request
- **AND** include `code: "invalid_borrower_id"` in the response

#### Scenario: borrowerRotessaId not found

- **WHEN** a request includes borrowerRotessaId with no matching borrower
- **THEN** the system SHALL return 400 Bad Request
- **AND** include `code: "borrower_not_found"` in the response

#### Scenario: Missing borrower reference

- **WHEN** a request does not include borrowerId, borrowerRotessaId, or borrower object
- **THEN** the system SHALL return 400 Bad Request
- **AND** include error indicating one is required

#### Scenario: Maturity before origination validation

- **WHEN** a request has maturityDate before originationDate
- **THEN** the system SHALL return 400 Bad Request
- **AND** include validation error for date ordering

#### Scenario: LTV range validation

- **WHEN** a request has LTV outside 0-100 range
- **THEN** the system SHALL return 400 Bad Request

#### Scenario: All required mortgage fields

- **WHEN** creating a mortgage
- **THEN** the system SHALL require: externalMortgageId, loanAmount, interestRate, originationDate, maturityDate, mortgageType, address, location, propertyType, appraisalMarketValue, appraisalMethod, appraisalCompany, appraisalDate, ltv

### Requirement: Mortgage Read Endpoint

The system SHALL provide a `GET /mortgages/get` endpoint for retrieving a single mortgage record.

#### Scenario: Get mortgage by internal ID

- **WHEN** a request is received with mortgageId query parameter
- **THEN** the system SHALL return the mortgage record
- **AND** return 200 OK

#### Scenario: Get mortgage by external ID

- **WHEN** a request is received with externalMortgageId query parameter
- **THEN** the system SHALL return the matching mortgage record

#### Scenario: Include borrower data

- **WHEN** a request includes includeBorrower=true
- **THEN** the response SHALL include joined borrower data

#### Scenario: Include listing data

- **WHEN** a request includes includeListing=true
- **AND** mortgage has an associated listing
- **THEN** the response SHALL include joined listing data

#### Scenario: Mortgage not found

- **WHEN** a request references a non-existent mortgage
- **THEN** the system SHALL return 404 Not Found
- **AND** include `code: "mortgage_not_found"` in the response

### Requirement: Mortgage List Endpoint

The system SHALL provide a `GET /mortgages/list` endpoint for listing mortgages with filters.

#### Scenario: List all mortgages

- **WHEN** a request is received without filters
- **THEN** the system SHALL return paginated mortgage list

#### Scenario: Filter by borrowerId

- **WHEN** a request includes borrowerId query parameter
- **THEN** the system SHALL return only mortgages for that borrower

#### Scenario: Filter by borrowerRotessaId

- **WHEN** a request includes borrowerRotessaId query parameter
- **THEN** the system SHALL lookup borrower and return their mortgages

#### Scenario: Filter by status

- **WHEN** a request includes status query parameter (comma-separated)
- **THEN** the system SHALL return mortgages matching any listed status

#### Scenario: Filter by mortgage type

- **WHEN** a request includes mortgageType query parameter
- **THEN** the system SHALL return mortgages of that type

#### Scenario: Filter by LTV range

- **WHEN** a request includes minLtv and/or maxLtv
- **THEN** the system SHALL return mortgages within LTV range

#### Scenario: Filter by loan amount range

- **WHEN** a request includes minLoanAmount and/or maxLoanAmount
- **THEN** the system SHALL return mortgages within amount range

#### Scenario: Filter by maturity date range

- **WHEN** a request includes maturityAfter and/or maturityBefore
- **THEN** the system SHALL return mortgages maturing within date range

#### Scenario: Filter by creation date range

- **WHEN** a request includes createdAfter and/or createdBefore
- **THEN** the system SHALL return mortgages created within date range

#### Scenario: Filter by listing existence

- **WHEN** a request includes hasListing=true
- **THEN** the system SHALL return only mortgages that have listings
- **WHEN** hasListing=false
- **THEN** return only mortgages without listings

#### Scenario: Include borrower in list

- **WHEN** a request includes includeBorrower=true
- **THEN** each mortgage in results SHALL include joined borrower data

#### Scenario: Pagination

- **WHEN** a request includes limit and/or cursor
- **THEN** the system SHALL paginate results accordingly

### Requirement: Listing Read Endpoint

The system SHALL provide a `GET /listings/get` endpoint for retrieving a single listing record.

#### Scenario: Get listing by listing ID

- **WHEN** a request is received with listingId query parameter
- **THEN** the system SHALL return the listing record

#### Scenario: Get listing by mortgage ID

- **WHEN** a request is received with mortgageId query parameter
- **THEN** the system SHALL return the listing for that mortgage

#### Scenario: Get listing by external mortgage ID

- **WHEN** a request is received with externalMortgageId query parameter
- **THEN** the system SHALL lookup mortgage and return its listing

#### Scenario: Include mortgage data (default)

- **WHEN** includeMortgage is not specified or is true
- **THEN** the response SHALL include full mortgage data

#### Scenario: Exclude mortgage data

- **WHEN** includeMortgage=false
- **THEN** the response SHALL only include mortgageId reference

#### Scenario: Include borrower data

- **WHEN** includeBorrower=true
- **THEN** the response SHALL include borrower data from mortgage

#### Scenario: Include comparables

- **WHEN** includeComparables=true
- **THEN** the response SHALL include appraisal_comparables for the mortgage

#### Scenario: Listing not found

- **WHEN** a request references a non-existent listing
- **THEN** the system SHALL return 404 Not Found
- **AND** include `code: "listing_not_found"` in the response

### Requirement: Listing List Endpoint

The system SHALL provide a `GET /listings/list` endpoint for listing marketplace entries with filters.

#### Scenario: List all listings

- **WHEN** a request is received without filters
- **THEN** the system SHALL return paginated listing list

#### Scenario: Filter by visibility

- **WHEN** a request includes visible=true
- **THEN** the system SHALL return only visible listings
- **WHEN** visible=false
- **THEN** return only hidden listings

#### Scenario: Filter by lock status

- **WHEN** a request includes locked=true
- **THEN** the system SHALL return only locked listings
- **WHEN** locked=false
- **THEN** return only unlocked listings

#### Scenario: Filter by availability shortcut

- **WHEN** a request includes available=true
- **THEN** the system SHALL return listings where visible=true AND locked=false

#### Scenario: Filter by lockedBy user

- **WHEN** a request includes lockedBy query parameter
- **THEN** the system SHALL return listings locked by that user

#### Scenario: Filter by borrower

- **WHEN** a request includes borrowerId query parameter
- **THEN** the system SHALL return listings for mortgages owned by that borrower

#### Scenario: Filter by LTV range

- **WHEN** a request includes minLtv and/or maxLtv
- **THEN** the system SHALL return listings for mortgages within LTV range

#### Scenario: Filter by loan amount range

- **WHEN** a request includes minLoanAmount and/or maxLoanAmount
- **THEN** the system SHALL return listings for mortgages within amount range

#### Scenario: Filter by property type

- **WHEN** a request includes propertyType query parameter
- **THEN** the system SHALL return listings for matching property types

#### Scenario: Filter by location (state)

- **WHEN** a request includes state query parameter
- **THEN** the system SHALL return listings for properties in that state

#### Scenario: Filter by location (city)

- **WHEN** a request includes city query parameter
- **THEN** the system SHALL return listings for properties in that city

#### Scenario: Include mortgage in list

- **WHEN** includeMortgage is not specified or is true
- **THEN** each listing in results SHALL include joined mortgage data

#### Scenario: Pagination

- **WHEN** a request includes limit and/or cursor
- **THEN** the system SHALL paginate results accordingly

### Requirement: Error Response Format

The system SHALL return consistent error response format across all endpoints.

#### Scenario: Validation error format

- **WHEN** payload validation fails
- **THEN** the response SHALL include:
  - `code`: Machine-readable error category (e.g., "payload_validation_error")
  - `message`: Human-readable description
  - `errors`: Array of specific validation failures with path and code

#### Scenario: Processing error format

- **WHEN** a business logic error occurs during processing
- **THEN** the response SHALL include:
  - `code`: Machine-readable error category (e.g., "processing_error")
  - `message`: Human-readable error description

#### Scenario: Not found error format

- **WHEN** a requested resource is not found
- **THEN** the response SHALL include:
  - `code`: Entity-specific not found code (e.g., "borrower_not_found")
  - `message`: Human-readable description

#### Scenario: Dependency conflict format

- **WHEN** a delete operation is blocked by dependencies
- **THEN** the response SHALL include:
  - `code`: "entity_has_dependencies"
  - `message`: Description of blocking dependencies
  - Counts of dependent records

#### Scenario: Invalid JSON format

- **WHEN** request body is not valid JSON
- **THEN** the system SHALL return 400 Bad Request
- **AND** include `code: "invalid_json"` in the response

### Requirement: Pagination Response Format

The system SHALL use consistent pagination response format across all list endpoints.

#### Scenario: Paginated response structure

- **WHEN** a list endpoint returns results
- **THEN** the response SHALL include:
  - Entity array (borrowers, mortgages, or listings)
  - `nextCursor`: String for next page (null if no more)
  - `hasMore`: Boolean indicating more results exist
  - `total`: Total count of matching records (when available)

#### Scenario: Empty results

- **WHEN** no records match the filter criteria
- **THEN** the response SHALL include empty array
- **AND** hasMore: false
- **AND** total: 0
