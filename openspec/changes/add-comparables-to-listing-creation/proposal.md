## Why
Investors need comparable property data to evaluate mortgage investments, but the current listing creation form doesn't allow admins to add appraisal comparables. This means new listings are created without this critical investment context, making it harder for investors to assess property values and market conditions.

## What Changes
- Add a "Comparable Properties" section to the admin listing creation form
- Support dynamic addition/removal of N comparable properties (0 to many)
- Capture all comparable fields: address, sale amount, sale date, distance, property characteristics
- Integrate with existing comparable storage API and schema
- Update the form state management to include comparables data
- Submit comparables along with mortgage data during listing creation
- Add comparable support to the `/listings/create` webhook for external system integration
- Update webhook schema to accept optional comparables array
- Test webhook with comparable payload

## Impact
- Affected specs: admin-listing-creation (add comparables section + webhook support), appraisal-comparables (frontend integration)
- Affected code: ListingCreationForm.tsx, useListingCreationStore.ts (state management), convex/http.ts (webhook schema + validation), convex/listings.ts (createFromPayloadInternal + runListingCreation)
- Dependencies: Requires existing `bulkCreateComparables` mutation in comparables.ts
- Breaking: No breaking changes - additive only
