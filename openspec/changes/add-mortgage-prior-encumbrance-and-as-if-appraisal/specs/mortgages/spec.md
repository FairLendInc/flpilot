# mortgages Specification Delta

## ADDED Requirements

### Requirement: Prior Encumbrance Field Support

The system SHALL support optional prior encumbrance data for mortgages with existing liens or secondary financing.

#### Scenario: Store prior encumbrance details
- **WHEN** a mortgage has existing debt from prior liens
- **THEN** the system SHALL accept optional `priorEncumbrance` object with `amount` and `lender` fields
- **AND** if provided, SHALL validate amount > 0
- **AND** if provided, SHALL validate lender is non-empty string
- **AND** SHALL store data in mortgage record for financial analysis

#### Scenario: Admin edits prior encumbrance via UI
- **WHEN** admin opens mortgage edit form in "Loan Details" tab
- **THEN** the system SHALL display "Add Prior Encumbrance" button by default
- **AND** when clicked, SHALL reveal amount and lender input fields
- **AND** SHALL provide "Remove" button to clear prior encumbrance data
- **AND** SHALL validate fields on save: amount > 0, lender non-empty
- **AND** SHALL show inline validation errors below each field

#### Scenario: Update mortgage with prior encumbrance
- **WHEN** admin submits mortgage update with prior encumbrance data
- **THEN** the system SHALL validate admin authorization
- **AND** SHALL validate amount > 0 if prior encumbrance is present
- **AND** SHALL validate lender is non-empty string if prior encumbrance is present
- **AND** SHALL update mortgage record with priorEncumbrance object
- **AND** SHALL trigger reactive query updates
- **AND** SHALL return success confirmation

#### Scenario: Remove prior encumbrance from existing mortgage
- **WHEN** admin removes prior encumbrance data from mortgage
- **THEN** the system SHALL set priorEncumbrance to null
- **AND** SHALL not validate absent fields
- **AND** SHALL update mortgage record successfully
- **AND** SHALL hide prior encumbrance from financial display

#### Scenario: Query mortgage with prior encumbrance
- **WHEN** querying mortgage by ID
- **THEN** the system SHALL include priorEncumbrance object if present
- **AND** SHALL return null if not present
- **AND** SHALL maintain type safety with optional field typing

### Requirement: As-If Complete Appraisal Field Support

The system SHALL support optional as-if complete appraisal data for mortgages with projected post-improvement valuations.

#### Scenario: Store as-if appraisal details
- **WHEN** a mortgage requires valuation based on completed improvements
- **THEN** the system SHALL accept optional `asIfAppraisal` object with marketValue, method, company, and date fields
- **AND** if provided, SHALL validate marketValue > 0
- **AND** if provided, SHALL validate method, company, and date are non-empty strings
- **AND** SHALL store data in mortgage record for financial analysis

#### Scenario: Admin edits as-if appraisal via UI
- **WHEN** admin opens mortgage edit form in "Property Info" tab
- **THEN** the system SHALL display "Add As-If Complete Appraisal" button by default
- **AND** when clicked, SHALL reveal marketValue, method, company, and date input fields
- **AND** SHALL provide date picker component for date field
- **AND** SHALL format marketValue as currency
- **AND** SHALL provide "Remove" button to clear as-if appraisal data
- **AND** SHALL show helper text: "Appraisal value if property improvements are completed"
- **AND** SHALL validate fields on save: marketValue > 0, all fields non-empty
- **AND** SHALL show inline validation errors below each field

#### Scenario: Update mortgage with as-if appraisal
- **WHEN** admin submits mortgage update with as-if appraisal data
- **THEN** the system SHALL validate admin authorization
- **AND** SHALL validate marketValue > 0 if as-if appraisal is present
- **AND** SHALL validate method, company, date are non-empty strings if as-if appraisal is present
- **AND** SHALL validate date is valid ISO date string format
- **AND** SHALL update mortgage record with asIfAppraisal object
- **AND** SHALL trigger reactive query updates
- **AND** SHALL return success confirmation

#### Scenario: Remove as-if appraisal from existing mortgage
- **WHEN** admin removes as-if appraisal data from mortgage
- **THEN** the system SHALL set asIfAppraisal to null
- **AND** SHALL not validate absent fields
- **AND** SHALL update mortgage record successfully
- **AND** SHALL hide as-if appraisal from financial display

#### Scenario: Query mortgage with as-if appraisal
- **WHEN** querying mortgage by ID
- **THEN** the system SHALL include asIfAppraisal object if present
- **AND** SHALL return null if not present
- **AND** SHALL maintain type safety with optional field typing

## MODIFIED Requirements

### Requirement: Mortgage Mutations

The system SHALL validate mortgage data and prevent duplicate records when creating or updating mortgages.

**Change**: Add validation for `priorEncumbrance` and `asIfAppraisal` optional fields.

#### Scenario: Validate prior encumbrance and as-if appraisal in mutations
- **WHEN** creating or updating a mortgage with optional fields
- **THEN** the system SHALL add `priorEncumbrance` and `asIfAppraisal` to mutation validators
- **AND** SHALL validate priorEncumbrance.amount > 0 if priorEncumbrance is present
- **AND** SHALL validate priorEncumbrance.lender is non-empty string if priorEncumbrance is present
- **AND** SHALL validate asIfAppraisal.marketValue > 0 if asIfAppraisal is present
- **AND** SHALL validate asIfAppraisal.method, company, date are non-empty strings if asIfAppraisal is present
- **AND** SHALL not validate these fields if they are absent/null
- **AND** SHALL maintain backward compatibility with existing mortgages

### Requirement: Admin Mortgage Update Operations

The system SHALL provide admin-only mutation function for updating mortgage properties with comprehensive UI components.

**Change**: Add form sections for prior encumbrance and as-if appraisal editing.

#### Scenario: Admin mortgage update form includes optional financial fields
- **WHEN** admin opens mortgage update sheet
- **THEN** the "Loan Details" tab SHALL include "Add Prior Encumbrance" section
- **AND** the "Property Info" tab SHALL include "Add As-If Complete Appraisal" section
- **AND** both sections SHALL be hidden by default (toggle pattern)
- **AND** clicking "Add" buttons SHALL reveal respective form fields
- **AND** form SHALL load existing data when editing mortgage with these fields
- **AND** form SHALL support removing fields via "Remove" button
- **AND** form SHALL validate all fields before submission
- **AND** form SHALL display inline errors for invalid data

## REMOVED Requirements

None.
