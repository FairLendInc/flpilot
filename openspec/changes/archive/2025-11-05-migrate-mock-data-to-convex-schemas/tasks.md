# Implementation Tasks

## Phase 1: Schema Definition (Core Foundation) ✅

- [x] **Task 1.1**: Define `borrowers` table in `convex/schema.ts`
  - Add table with fields: name, email, rotessaCustomerId
  - Add indexes: by_rotessa_customer_id (unique), by_email
  - Validate schema compiles with `npx convex dev`

- [x] **Task 1.2**: Define `mortgages` table in `convex/schema.ts`
  - Add core loan fields: loanAmount, interestRate, originationDate, maturityDate, status
  - Add embedded property fields: address (street, city, state, zip, country), location (lat, lng), propertyType
  - Add borrowerId reference with validation
  - Add optional previousMortgageId for renewal tracking
  - Add documents array with storageId references
  - Add indexes: by_borrower, by_status, by_maturity_date
  - Validate schema compiles

- [x] **Task 1.3**: Define `mortgage_ownership` table in `convex/schema.ts`
  - Add fields: mortgageId, ownerId (string union type), ownershipPercentage
  - Add indexes: by_mortgage, by_owner, compound [mortgageId, ownerId]
  - Add validation comments for ownerId union behavior
  - Validate schema compiles

- [x] **Task 1.4**: Define `listings` table in `convex/schema.ts`
  - Add fields: mortgageId, visible, locked, lockedBy (optional), lockedAt (optional)
  - Add indexes: by_mortgage (unique), by_locked_status, by_locked_user
  - Validate schema compiles

- [x] **Task 1.5**: Define `appraisal_comparables` table in `convex/schema.ts`
  - Add fields: mortgageId, address (nested), saleAmount, saleDate, distance
  - Add optional fields: squareFeet, bedrooms, bathrooms, propertyType, imageUrl
  - Add indexes: by_mortgage, by_sale_date
  - Validate schema compiles

- [x] **Task 1.6**: Define `payments` table in `convex/schema.ts`
  - Add fields: mortgageId, amount, processDate, status, paymentId, customerId, transactionScheduleId
  - Add indexes: by_mortgage, by_status, by_process_date, by_payment_id (unique)
  - Validate schema compiles

- [x] **Task 1.7**: Run type generation
  - Execute `npx convex dev` to generate TypeScript types
  - Verify `convex/_generated/dataModel.d.ts` includes all new table types
  - Check Doc<"mortgages">, Id<"borrowers">, etc. are available

## Phase 2: Query Functions (Read Operations) ✅

- [x] **Task 2.1**: Create `convex/borrowers.ts` with query functions
  - Implement `getBorrower(id)` - get borrower by ID
  - Implement `getBorrowerByRotessaId(rotessaCustomerId)` - indexed lookup
  - Implement `listBorrowers()` - list all borrowers with pagination
  - Implement `searchBorrowersByEmail(email)` - email search

- [x] **Task 2.2**: Create `convex/mortgages.ts` with query functions
  - Implement `getMortgage(id)` - get mortgage with all details
  - Implement `listMortgagesByBorrower(borrowerId)` - borrower's mortgages
  - Implement `listMortgagesByStatus(status)` - filter by status
  - Implement `getMortgagesNearingMaturity(daysFromNow)` - maturity date range

- [x] **Task 2.3**: Create `convex/ownership.ts` with query functions
  - Implement `getMortgageOwnership(mortgageId)` - get cap table
  - Implement `getUserPortfolio(userId)` - user's owned mortgages
  - Implement `checkOwnership(mortgageId, ownerId)` - permission check
  - Implement `getInstitutionalPortfolio()` - FairLend's mortgages

- [x] **Task 2.4**: Create `convex/listings.ts` with query functions
  - Implement `getAvailableListings()` - visible and unlocked listings
  - Implement `getListingByMortgage(mortgageId)` - lookup listing
  - Implement `getUserLockedListings(userId)` - user's locked listings
  - Implement `getAllLockedListings()` - admin view
  - Implement `isListingAvailable(listingId)` - availability check

- [x] **Task 2.5**: Create `convex/comparables.ts` with query functions
  - Implement `getComparablesForMortgage(mortgageId)` - appraisal data
  - Implement `getComparablesWithinDistance(mortgageId, maxMiles)` - proximity filter

- [x] **Task 2.6**: Create `convex/payments.ts` with query functions
  - Implement `getPaymentsForMortgage(mortgageId)` - payment history
  - Implement `getPaymentsByStatus(status)` - filter by status
  - Implement `getPaymentsByDateRange(startDate, endDate)` - temporal filter
  - Implement `getPaymentByRotessaId(paymentId)` - idempotency lookup

## Phase 3: Mutation Functions (Write Operations) ✅

- [x] **Task 3.1**: Add borrower mutations to `convex/borrowers.ts`
  - Implement `createBorrower(name, email, rotessaCustomerId)` - with validation
  - Implement `updateBorrower(id, { name?, email? })` - prevent rotessaCustomerId changes
  - Implement validation for email format and unique Rotessa ID

- [x] **Task 3.2**: Add mortgage mutations to `convex/mortgages.ts`
  - Implement `createMortgage(data)` - with all required fields
  - Implement `updateMortgageStatus(id, status)` - status transitions
  - Implement `addDocumentToMortgage(id, document)` - append to documents array
  - Implement validation for numeric constraints and required fields

- [x] **Task 3.3**: Add ownership mutations to `convex/ownership.ts`
  - Implement `createOwnership(mortgageId, ownerId, ownershipPercentage)` - with validation
  - Implement `updateOwnershipPercentage(id, percentage)` - update percentage
  - Implement `transferOwnership(id, newOwnerId)` - change owner
  - Implement `deleteOwnership(id)` - remove ownership record

- [x] **Task 3.4**: Add listing mutations to `convex/listings.ts`
  - Implement `createListing(mortgageId, visible?)` - create marketplace listing
  - Implement `lockListing(listingId, userId)` - atomic lock operation
  - Implement `unlockListing(listingId, userId)` - atomic unlock
  - Implement `updateListingVisibility(listingId, visible)` - toggle visibility
  - Implement `deleteListing(listingId)` - remove from marketplace

- [x] **Task 3.5**: Add comparable mutations to `convex/comparables.ts`
  - Implement `createComparable(data)` - create single comparable
  - Implement `bulkCreateComparables(mortgageId, comparables[])` - import set
  - Implement `updateComparable(id, data)` - update fields
  - Implement `deleteComparable(id)` - remove single comparable
  - Implement `deleteAllComparablesForMortgage(mortgageId)` - clean replacement

- [x] **Task 3.6**: Add payment mutations to `convex/payments.ts`
  - Implement `createPayment(data)` - create payment record
  - Implement `updatePaymentStatus(id, status, processDate?)` - status transitions
  - Implement `bulkCreatePayments(payments[])` - schedule creation
  - Implement `syncPaymentFromRotessa(paymentId, data)` - idempotent sync

## Phase 4: Seed Data Creation ✅

- [x] **Task 4.1**: Create seed data script `convex/seed.ts`
  - Import mock data generators from `lib/mock-data/listings.ts`
  - Create helper to generate realistic seed data
  - Set up data relationships (borrowers → mortgages → ownership → listings)

- [x] **Task 4.2**: Seed borrowers table
  - Generate 20-30 borrower records with realistic names and emails
  - Assign unique Rotessa customer IDs (format: `rotessa_${uuid}`)
  - Insert into database and capture IDs

- [x] **Task 4.3**: Seed mortgages table
  - Generate 50+ mortgage records using mock data patterns
  - Link each mortgage to random borrower
  - Set realistic property addresses from Toronto area
  - Set varied loan amounts ($200K-$800K), interest rates (6-12%), dates
  - Mix of statuses: mostly "active", some "renewed", few "closed"
  - Added images field using Convex storage ID: kg25zy583vde1xsem8q17sjf6x7szpf6
  - Insert and capture mortgage IDs

- [x] **Task 4.4**: Handle document storage for seed data
  - Using Convex storage ID for property images: kg25zy583vde1xsem8q17sjf6x7szpf6
  - Documents field initialized as empty array (can be populated later)
  - Updated schema to support images with storageId, alt, and order

- [x] **Task 4.5**: Seed mortgage_ownership table
  - Create ownership record for each mortgage
  - 70% owned by "fairlend" (institutional), 30% by random users
  - All ownership percentages = 100 (single owner)
  - Validate cap table integrity

- [x] **Task 4.6**: Seed listings table
  - Create listings for active mortgages only (~75% of total)
  - Set visible = true for 90%, visible = false for 10%
  - All listings unlocked initially (locked = false)
  - 52 listings created for 60 mortgages

- [x] **Task 4.7**: Seed appraisal_comparables table
  - Generate 3-6 comparables per mortgage (first 30 mortgages)
  - Set realistic sale amounts (85-115% of mortgage amount)
  - Set distances (0.1-5.0 miles from property)
  - Vary sale dates (1-6 months ago)
  - Add property characteristics with some missing optionals
  - Use Convex storage ID for images: kg25zy583vde1xsem8q17sjf6x7szpf6

- [x] **Task 4.8**: Seed payments table
  - Generate 6-12 payment records per mortgage (6-12 months history)
  - Calculate monthly interest amount from mortgage.loanAmount * interestRate / 12
  - Set status: 85% "cleared", 12% "pending", 3% "failed"
  - Assign Rotessa IDs (format: `PAY_{mortgageIdx}_{month}_{timestamp}`)
  - Link to borrower's Rotessa customer ID
  - Set realistic process dates (monthly intervals)

- [x] **Task 4.9**: Verify seed data integrity
  - ✅ 25 borrowers created
  - ✅ 60 mortgages created with images
  - ✅ 60 ownership records (cap table integrity verified)
  - ✅ 52 listings created for active mortgages
  - ✅ 511 payment records with realistic history
  - ✅ 135 appraisal comparables with images

## Phase 5: Frontend Migration ✅

- [x] **Task 5.1**: Create generated types re-export `lib/types/convex.ts`
  - Re-export Doc, Id types from `convex/_generated/dataModel`
  - Create type aliases: `Mortgage = Doc<"mortgages">`, etc.
  - Add type utilities for common patterns (calculation, formatting helpers)

- [x] **Task 5.2**: Update `app/(auth)/listings/page.tsx`
  - Replace `generateMultipleListings()` with Convex query
  - Use `preloadQuery` and `preloadedQueryResult` from `convex/nextjs`
  - Query `listings:getAvailableListingsWithMortgages` for joined data
  - Transform Convex data to `ListingItem` format
  - Remove mock data imports
  - Add property type mapping from schema to frontend display

- [x] **Task 5.3**: Update `app/(auth)/listings/[id]/page.tsx`
  - Replace mock data with Convex queries
  - Query `mortgages:getMortgage(id)` for property details
  - Query `payments:getPaymentsForMortgage(id)` for payment history
  - Query `comparables:getComparablesForMortgage(id)` for appraisal
  - Remove mock data imports
  - Transform data to match component expectations
  - Handle status mapping (cleared → paid, insurance → loan)

- [x] **Task 5.4**: Update listing card component
  - Keep existing components - data transformation handles type conversion
  - Components receive transformed data that matches existing interfaces
  - Images use Convex storage API (`/api/storage/{storageId}`)

- [x] **Task 5.5**: Update property info components
  - Keep existing components - data transformation handles type conversion
  - Address and financial data properly mapped from embedded structure

- [x] **Task 5.6**: Update payment history component
  - Use Convex `Payment` type from `lib/types/convex.ts`
  - Status mapping: "cleared" → "paid", "failed", "pending" remain same
  - All payments are interest-only (type field added in transformation)
  - Payment data properly transformed for component compatibility

- [x] **Task 5.7**: Update appraisal comparables component
  - Use Convex `AppraisalComparable` type from `lib/types/convex.ts`
  - Image storage IDs mapped to URLs via Convex storage API
  - All optional fields (squareFeet, bedrooms, etc.) properly handled

## Phase 6: Validation and Testing

- [ ] **Task 6.1**: Test borrower CRUD operations
  - Create, read, update borrowers via dashboard
  - Verify Rotessa ID uniqueness enforcement
  - Test email validation
  - Verify by_rotessa_customer_id index works

- [ ] **Task 6.2**: Test mortgage CRUD operations
  - Create mortgages with various property types
  - Test renewal linking with previousMortgageId
  - Add documents to existing mortgages
  - Test status transitions and indexing
  - Verify borrower relationship queries work

- [ ] **Task 6.3**: Test ownership operations
  - Create ownership records for test mortgages
  - Verify 100% validation in application layer
  - Test portfolio queries for users and "fairlend"
  - Transfer ownership and verify cap table updates

- [ ] **Task 6.4**: Test listing lock/unlock workflow
  - Create listing, verify appears in available listings
  - Lock listing as user, verify locked state
  - Attempt double-lock, verify rejection
  - Unlock listing, verify available again
  - Test visibility toggle

- [ ] **Task 6.5**: Test payment sync scenarios
  - Create pending payments
  - Update to cleared status
  - Simulate Rotessa webhook sync
  - Test idempotency with duplicate paymentId
  - Verify payment history queries

- [ ] **Task 6.6**: Test frontend data display
  - Browse listings page, verify all data displays
  - Click into listing detail, verify full page renders
  - Check image carousel (if using placeholder images)
  - Verify map displays with property location
  - Check payment history timeline
  - Verify appraisal comparables section

- [ ] **Task 6.7**: Run type checking
  - Execute `pnpm run check-types`
  - Fix any type errors from Convex migration
  - Verify no `MockListing` imports remain in production code

- [ ] **Task 6.8**: Run linting
  - Execute `pnpm run lint`
  - Fix any linting issues from schema changes
  - Ensure code follows project conventions

- [ ] **Task 6.9**: Run unit tests
  - Execute `pnpm run test:once`
  - Update tests that used mock data
  - Add tests for Convex query/mutation functions
  - Ensure tests pass

- [ ] **Task 6.10**: Run E2E tests
  - Execute `pnpm run e2e`
  - Update E2E tests for new data source
  - Test critical user flows: browse → detail → payment history
  - Ensure tests pass

## Phase 7: Documentation and Cleanup

- [ ] **Task 7.1**: Update README or docs
  - Document new Convex schema structure
  - Add instructions for running seed script
  - Document relationship between tables
  - Add schema diagram if helpful

- [ ] **Task 7.2**: Add JSDoc comments to Convex functions
  - Document query parameters and return types
  - Add usage examples for complex queries
  - Explain validation rules in mutations

- [ ] **Task 7.3**: Update Storybook stories (optional)
  - Keep using mock data in Storybook OR
  - Create test fixtures for Storybook OR
  - Use Convex test backend for stories
  - Ensure stories still work

- [ ] **Task 7.4**: Clean up mock data references
  - Grep for remaining `mock-data/listings` imports: `rg "mock-data/listings" --type ts`
  - Remove unused mock generator functions (keep for Storybook if needed)
  - Update comments referencing mock data
  - Clean up unused type definitions

- [ ] **Task 7.5**: Update CLAUDE.md project documentation
  - Document Convex schema architecture
  - Add data model relationships section
  - Update development workflow to include seed data
  - Add Convex query/mutation patterns

## Phase 8: Deployment Preparation

- [ ] **Task 8.1**: Test in Convex production environment
  - Deploy schema to production: `npx convex deploy`
  - Run seed script in production (or use different seed data)
  - Verify all queries work in production

- [ ] **Task 8.2**: Set up Convex backups (if not already configured)
  - Configure automated backups in Convex dashboard
  - Document backup/restore procedures
  - Test backup restoration process

- [ ] **Task 8.3**: Deploy frontend with new Convex integration
  - Update environment variables in Vercel
  - Deploy to staging environment
  - Verify frontend works with production Convex

- [ ] **Task 8.4**: Final QA and user acceptance testing
  - Test all user workflows end-to-end
  - Verify data integrity across tables
  - Check performance of indexed queries
  - Gather user feedback on data display

## Notes

- **Parallel work**: Tasks 2.1-2.6 (queries) can be done in parallel after Phase 1
- **Parallel work**: Tasks 3.1-3.6 (mutations) can be done in parallel after Phase 2
- **Parallel work**: Tasks 4.2-4.8 (seed data) should be done sequentially due to dependencies
- **Dependencies**: Phase 5 (frontend) requires Phase 4 (seed data) completion
- **Testing**: Phase 6 can overlap with Phase 5 as components are migrated
- **Critical path**: Phase 1 → Phase 2 → Phase 4 → Phase 5 → Phase 6
