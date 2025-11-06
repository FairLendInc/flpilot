## 1. Type Definitions & Validators (Backend)
- [x] 1.1 Create comparablePayloadValidator in convex/comparables.ts
- [x] 1.2 Add comparables field to listingCreationPayloadValidator in convex/listings.ts
- [x] 1.3 Update runListingCreation to call bulkCreateComparables with atomic operation

## 2. State Management Updates (Frontend Store)
- [x] 2.1 Add ComparableFormState and ComparableAddressState types
- [x] 2.2 Add createInitialComparable() function
- [x] 2.3 Add comparables array to the useListingCreationStore state
- [x] 2.4 Add addComparable action to the store
- [x] 2.5 Add updateComparable action to the store
- [x] 2.6 Add removeComparable action to the store
- [x] 2.7 Update form reset to clear comparables
- [x] 2.8 Add validateListingForm for comparables validation

## 4. Backend Integration
- [x] 4.1 Update createFromPayload mutation to accept comparables
- [x] 4.2 Call bulkCreateComparables after mortgage creation
- [x] 4.3 Handle error cases (rollback mortgage if comparables fail)
- [x] 4.4 Add validation for comparable count (optional, 0-10 range)

## 5. Webhook Integration
- [x] 5.1 Add comparableAddressWebhookSchema for comparable address validation
- [x] 5.2 Create comparableWebhookSchema for validation
- [x] 5.3 Update listingCreationWebhookSchema to include comparables field
- [x] 5.4 Update toListingCreationPayload to pass comparables through
- [x] 5.5 Verify createFromPayloadInternal passes comparables to runListingCreation
- [x] 5.6 Verify runListingCreation calls bulkCreateComparables (already implemented)

## 6. Testing
- [ ] 6.1 Test form with 0 comparables (should work)
- [ ] 6.2 Test form with multiple comparables
- [ ] 6.3 Test form validation for required fields
- [ ] 6.4 Test add/remove comparable functionality
- [ ] 6.5 Test form reset clears all comparables
- [ ] 6.6 Test error handling for failed comparable creation
- [ ] 6.7 Test webhook with comparables in payload
- [ ] 6.8 Test webhook validation for comparable fields
- [ ] 6.9 Test webhook with zero comparables
- [ ] 6.10 Test webhook error handling for comparable failures

## 7. Documentation
- [ ] 7.1 Update form documentation/comments
- [ ] 7.2 Verify integration with existing ComparableProperties display component
- [ ] 7.3 Update webhook API documentation to include comparables field

