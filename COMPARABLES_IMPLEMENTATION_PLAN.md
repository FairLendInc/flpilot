# Comparables Implementation Plan
## Adding Comparables to Listing Creation Form and Webhook

### 1. Current Implementation Analysis

#### Database Schema
- **Table**: `appraisal_comparables` (lines 230-253 in convex/schema.ts)
  - Fields: mortgageId, address, saleAmount, saleDate, distance, squareFeet, bedrooms, bathrooms, propertyType, imageStorageId
  - Indexes: by_mortgage, by_sale_date
  - Status: ✅ Already exists and properly configured

#### Comparable API
- **File**: `convex/comparables.ts`
- **Key Functions**:
  - `bulkCreateComparables`: Creates multiple comparables in a single mutation (lines 116-157)
  - Validates mortgage exists before creation
  - Uses proper Convex validators
  - Returns array of created IDs
  - Status: ✅ Ready to use

#### Listing Creation Flow
- **Store**: `useListingCreationStore.ts` (Zustand state management)
- **Form**: `ListingCreationForm.tsx` (Multi-section form)
- **API**: `convex/listings.ts` (createFromPayload, createFromPayloadInternal)
- **Webhook**: `convex/http.ts` (HTTP endpoint with validation)

#### Current Form Sections
1. Borrower Details
2. Mortgage Basics
3. Property & Appraisal
4. Geographic Coordinates
5. Property Details & Appraisal
6. Listing Settings & Media (images + documents)

### 2. Data Shapes and Types

#### Comparable Property Structure (from comparables.ts)
```typescript
type ComparableProperty = {
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  saleAmount: number;
  saleDate: string;  // ISO date format
  distance: number;  // Miles from subject property
  squareFeet?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: string;
  imageStorageId?: Id<"_storage">;
};
```

#### Updated ListingCreationPayload Structure
```typescript
type ListingCreationPayload = {
  borrower: {
    name: string;
    email: string;
    rotessaCustomerId: string;
  };
  mortgage: {
    // ... existing fields ...
    images: Array<{ storageId: Id<"_storage">; alt?: string; order: number }>;
    documents: Array<{ name: string; type: DocumentType; storageId: Id<"_storage">; uploadDate: string; fileSize?: number }>;
    externalMortgageId: string;
  };
  listing: {
    visible: boolean;
  };
  comparables: ComparableProperty[];  // NEW
};
```

#### Webhook Payload Structure (to be added to http.ts)
```typescript
const comparablesWebhookSchema = z.array(
  z.object({
    address: z.object({
      street: z.string().min(1, "comparable.address.street.required"),
      city: z.string().min(1, "comparable.address.city.required"),
      state: z.string().min(1, "comparable.address.state.required"),
      zip: z.string().min(1, "comparable.address.zip.required"),
    }),
    saleAmount: z.number().gt(0, "comparable.saleAmount.positive"),
    saleDate: z.string().refine(
      (value) => !Number.isNaN(Date.parse(value)),
      "comparable.saleDate.invalid"
    ),
    distance: z.number().min(0, "comparable.distance.range"),
    squareFeet: z.number().positive("comparable.squareFeet.positive").optional(),
    bedrooms: z.number().int().min(0, "comparable.bedrooms.range").optional(),
    bathrooms: z.number().min(0, "comparable.bathrooms.range").optional(),
    propertyType: z.string().optional(),
    imageStorageId: z.string().min(1, "comparable.imageStorageId.required").optional(),
  })
);
```

### 3. Convex Best Practices Compliance

#### Validation Patterns (from convex_rules.mdc)
- ✅ Use new function syntax with `args` and `returns` validators
- ✅ Use `v.array()` for array validation
- ✅ Use `v.object()` with field validators
- ✅ Use `v.optional()` for optional fields
- ✅ Use `v.id("_storage")` for storage IDs
- ✅ Use `internalMutation` for private functions
- ✅ Always include argument and return validators

#### Transaction Patterns
- ✅ Convex functions are transactional by default
- ✅ `ctx.db.insert()` operations are atomic
- ✅ Use `internalMutation` to call from HTTP endpoints
- ✅ Error handling: throw on validation failure
- ✅ Rollback: Convex automatically rolls back on errors

#### Error Handling Best Practices
```typescript
// Validate before insertion
if (args.saleAmount <= 0) {
  throw new Error("Sale amount must be greater than 0");
}

// Validate referenced documents exist
const mortgage = await ctx.db.get(args.mortgageId);
if (!mortgage) {
  throw new Error("Mortgage not found");
}

// Use meaningful error messages
throw new Error("Comparable sale amount must be positive");
```

### 4. Integration Points

#### Form State Integration
- **Store**: Add `comparables` field to ListingCreationStore
- **Actions**: `addComparable`, `updateComparable`, `removeComparable`
- **Validation**: Add comparables to `validateListingForm`
- **Form**: Add "Appraisal Comparables" section with dynamic fields

#### Webhook Integration
- **Schema**: Add `comparableWebhookSchema` (Zod validation)
- **Payload**: Add comparables to `listingCreationWebhookSchema`
- **Transformer**: Update `toListingCreationPayload` to map comparables
- **Storage IDs**: Convert string to Id<"_storage"> for imageStorageId

#### Mutation Integration
- **Payload Type**: Update `listingCreationPayloadValidator` to include comparables
- **Core Logic**: Update `runListingCreation` to call `bulkCreateComparables` after mortgage creation
- **Error Handling**: Ensure comparables creation doesn't block listing creation

#### Data Flow
```
Form Submission → Store → Payload Construction → Mutation → Database
                                              ↓
                                        bulkCreateComparables → appraisal_comparables table
```

### 5. Implementation Plan

#### Phase 1: Update Type Definitions
**Files to modify:**
1. `convex/listings.ts` - Update `listingCreationPayloadValidator`
2. `convex/comparables.ts` - Export comparable property validator (reuse from bulkCreateComparables)

**Changes:**
```typescript
// In listings.ts
const comparablePropertyValidator = v.object({
  address: v.object({
    street: v.string(),
    city: v.string(),
    state: v.string(),
    zip: v.string(),
  }),
  saleAmount: v.number(),
  saleDate: v.string(),
  distance: v.number(),
  squareFeet: v.optional(v.number()),
  bedrooms: v.optional(v.number()),
  bathrooms: v.optional(v.number()),
  propertyType: v.optional(v.string()),
  imageStorageId: v.optional(v.id("_storage")),
});

const listingCreationPayloadValidator = v.object({
  borrower: borrowerPayloadValidator,
  mortgage: mortgageDetailsValidator,
  listing: listingOptionsValidator,
  comparables: v.optional(v.array(comparablePropertyValidator)),
});
```

#### Phase 2: Update Store (useListingCreationStore.ts)
**Additions:**
```typescript
export type ComparableFormState = {
  address: MortgageAddressState;
  saleAmount: string;
  saleDate: string;
  distance: string;
  squareFeet?: string;
  bedrooms?: string;
  bathrooms?: string;
  propertyType?: string;
  imageStorageId?: string;
  previewUrl?: string;
};

type ListingCreationStore = {
  // ... existing fields ...
  comparables: ComparableFormState[];
  // ... new actions ...
  addComparable: (comparable: ComparableFormState) => void;
  updateComparable: (index: number, comparable: Partial<ComparableFormState>) => void;
  removeComparable: (index: number) => void;
};
```

#### Phase 3: Update Form (ListingCreationForm.tsx)
**Additions:**
- New section: "Appraisal Comparables" after Property Details & Appraisal
- Upload functionality for comparable images
- Add/remove comparable entries dynamically
- Validation for each comparable entry
- Map to `ComparableFormState` type

**UI Pattern:**
- Similar to existing Images/Documents sections
- Add button to add new comparable
- Each comparable: address fields, sale amount/date, distance, optional details
- Image upload per comparable
- Remove button for each entry

#### Phase 4: Update Webhook (convex/http.ts)
**Additions:**
```typescript
// Add comparable webhook schema
const comparableWebhookSchema = z.object({
  address: z.object({
    street: z.string().min(1, "comparable.address.street.required"),
    city: z.string().min(1, "comparable.address.city.required"),
    state: z.string().min(1, "comparable.address.state.required"),
    zip: z.string().min(1, "comparable.address.zip.required"),
  }),
  saleAmount: z.number().gt(0, "comparable.saleAmount.positive"),
  saleDate: z.string().refine(
    (value) => !Number.isNaN(Date.parse(value)),
    "comparable.saleDate.invalid"
  ),
  distance: z.number().min(0, "comparable.distance.range"),
  squareFeet: z.number().positive("comparable.squareFeet.positive").optional(),
  bedrooms: z.number().int().min(0, "comparable.bedrooms.range").optional(),
  bathrooms: z.number().min(0, "comparable.bathrooms.range").optional(),
  propertyType: z.string().optional(),
  imageStorageId: z.string().min(1, "comparable.imageStorageId.required").optional(),
});

// Add to listingCreationWebhookSchema
const listingCreationWebhookSchema = z.object({
  borrower: borrowerWebhookSchema,
  mortgage: mortgageWebhookSchema,
  listing: listingWebhookSchema,
  comparables: v.optional(v.array(comparableWebhookSchema)),
});
```

#### Phase 5: Update Core Logic (convex/listings.ts)
**Additions to `runListingCreation`:**
```typescript
const runListingCreation = async (
  ctx: MutationCtx,
  payload: ListingCreationPayload
): Promise<ListingCreationResult> => {
  const borrowerId = await ensureBorrowerForPayload(ctx, payload.borrower);
  
  const mortgageId = await ensureMortgage(ctx, {
    borrowerId,
    ...payload.mortgage,
  });
  
  // Create listing
  const existingListing = await ctx.db
    .query("listings")
    .withIndex("by_mortgage", (q) => q.eq("mortgageId", mortgageId))
    .first();
  
  let listingId: Id<"listings">;
  let created: boolean;
  
  if (existingListing) {
    listingId = existingListing._id;
    created = false;
  } else {
    listingId = await ctx.db.insert("listings", {
      mortgageId,
      visible: payload.listing.visible ?? true,
      locked: false,
    });
    created = true;
  }
  
  // Create comparables if provided
  if (payload.comparables && payload.comparables.length > 0) {
    await ctx.runMutation(
      internal.comparables.bulkCreateComparables,
      {
        mortgageId,
        comparables: payload.comparables.map(comp => ({
          address: comp.address,
          saleAmount: comp.saleAmount,
          saleDate: comp.saleDate,
          distance: comp.distance,
          squareFeet: comp.squareFeet,
          bedrooms: comp.bedrooms,
          bathrooms: comp.bathrooms,
          propertyType: comp.propertyType,
          imageStorageId: comp.imageStorageId,
        })),
      }
    );
  }
  
  return {
    borrowerId,
    mortgageId,
    listingId,
    created,
  };
};
```

#### Phase 6: Update Form Submission (ListingCreationForm.tsx)
**Changes in `handleSubmit`:**
```typescript
const payload: ListingCreationPayload = {
  borrower: {
    name: state.borrower.name.trim(),
    email: state.borrower.email.trim(),
    rotessaCustomerId: state.borrower.rotessaCustomerId.trim(),
  },
  mortgage: {
    // ... existing mortgage fields ...
  },
  listing: {
    visible: state.listing.visible,
  },
  comparables: state.comparables.map((comp) => ({
    address: {
      street: comp.address.street.trim(),
      city: comp.address.city.trim(),
      state: comp.address.state.trim(),
      zip: comp.address.zip.trim(),
    },
    saleAmount: Number(comp.saleAmount),
    saleDate: comp.saleDate,
    distance: Number(comp.distance),
    squareFeet: comp.squareFeet ? Number(comp.squareFeet) : undefined,
    bedrooms: comp.bedrooms ? Number(comp.bedrooms) : undefined,
    bathrooms: comp.bathrooms ? Number(comp.bathrooms) : undefined,
    propertyType: comp.propertyType?.trim(),
    imageStorageId: comp.imageStorageId as Id<"_storage">,
  })),
};
```

### 6. Validation Strategy

#### Client-Side Validation (Store)
- Validate required fields: address, saleAmount, saleDate, distance
- Validate numeric ranges: saleAmount > 0, distance >= 0
- Validate date format: ISO string
- Validate optional fields: squareFeet > 0, bedrooms >= 0, bathrooms >= 0

#### Server-Side Validation (Convex)
- Re-validate all client data
- Validate mortgage exists before creating comparables
- Validate storage IDs point to existing files
- Throw meaningful errors on validation failure

#### Webhook Validation (Zod)
- Match Convex validators
- Provide i18n-ready error messages
- Validate imageStorageId is valid string (converted to Id in transformer)

### 7. Error Handling

#### Transaction Safety
- If comparables creation fails, listing creation still succeeds
- Use separate mutation for comparables to isolate failures
- Log comparable creation errors without blocking primary flow

#### Error Messages
- Form: Display field-level errors with paths like `comparables.0.saleAmount`
- Webhook: Return structured errors with paths
- Logs: Include mortgageId and comparable count for debugging

### 8. Testing Strategy

#### Unit Tests
- Store validation logic
- Form payload construction
- Webhook schema validation

#### Integration Tests
- End-to-end form submission with comparables
- Webhook payload with comparables
- Comparable retrieval after creation

#### Test Cases
1. Form with no comparables (optional field)
2. Form with single comparable
3. Form with multiple comparables
4. Form with comparable image upload
5. Webhook with comparables
6. Webhook without comparables
7. Validation failures (invalid dates, negative amounts, etc.)

### 9. Migration Strategy

#### Backward Compatibility
- Comparables field is optional in all payloads
- Existing listings without comparables continue to work
- Webhook gracefully handles missing comparables

#### Data Integrity
- All comparables are tied to existing mortgages
- No orphaned comparables (deleted if mortgage is deleted)
- Ownership invariant unaffected (comparables don't change ownership)

### 10. Implementation Checklist

- [ ] Update comparablePropertyValidator in listings.ts
- [ ] Add comparables to listingCreationPayloadValidator
- [ ] Add comparables field to useListingCreationStore
- [ ] Add ComparableFormState type
- [ ] Add addComparable, updateComparable, removeComparable actions
- [ ] Update validateListingForm to validate comparables
- [ ] Add "Appraisal Comparables" section to ListingCreationForm
- [ ] Add image upload for comparables
- [ ] Update handleSubmit to include comparables in payload
- [ ] Add comparableWebhookSchema to http.ts
- [ ] Add comparables to listingCreationWebhookSchema
- [ ] Update toListingCreationPayload to map comparables
- [ ] Update runListingCreation to call bulkCreateComparables
- [ ] Add unit tests for store validation
- [ ] Add integration tests for form submission
- [ ] Add integration tests for webhook payload
- [ ] Test edge cases (0 comparables, max comparables, validation failures)

### 11. Estimated Implementation Time

- **Phase 1** (Type Definitions): 30 minutes
- **Phase 2** (Store): 1 hour
- **Phase 3** (Form UI): 2 hours
- **Phase 4** (Webhook): 1 hour
- **Phase 5** (Core Logic): 1 hour
- **Phase 6** (Form Submission): 30 minutes
- **Testing**: 2 hours
- **Total**: ~8 hours

### 12. Key Considerations

1. **Image Storage**: Comparable images use same storage system as mortgage images
2. **Validation Consistency**: Client, webhook, and server validation must match
3. **Optional Field**: Comparables are always optional in all entry points
4. **Transaction Boundaries**: Comparables creation is separate from listing creation
5. **Error Isolation**: Comparable failures don't block listing creation
6. **Type Safety**: All conversions use proper TypeScript types
7. **Performance**: bulkCreateComparables uses Promise.all for efficiency

### 13. Code Quality Standards

- Follow existing code patterns in form and store
- Use TypeScript strict mode types
- Include JSDoc comments for new functions
- Maintain consistent error message format
- Follow Convex best practices from convex_rules.mdc
- Use meaningful variable names
- Keep functions focused and small
- Add comprehensive validation at all layers
