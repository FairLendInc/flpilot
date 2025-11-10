# Proposal: Add Mortgage Prior Encumbrance and As-If Appraisal Support

## Change ID
`add-mortgage-prior-encumbrance-and-as-if-appraisal`

## Overview
Add full CRUD support for two optional mortgage fields: **prior encumbrance** (existing liens) and **as-if complete appraisal** (projected post-improvement value). This enables tracking of complex financing scenarios where properties have existing debt or are being valued based on planned improvements.

## Business Context
Real estate mortgages often involve:
1. **Prior Encumbrance**: Existing mortgages or liens that reduce the effective equity available. This is critical for calculating net LTV and investor risk.
2. **As-If Complete Appraisal**: Valuation of property assuming planned improvements are finished. Essential for construction loans and renovation financing.

Currently, the schema defines these fields but they are not:
- Editable through the admin interface
- Validated in backend mutations
- Displayed in financial metrics
- Differentiated in appraisal comparables (as-is vs as-if)

## Goals
1. **Enable admin editing** of prior encumbrance and as-if appraisal data
2. **Display financial impact** of prior encumbrance in key financials section
3. **Display as-if appraisal** details in dedicated section
4. **Separate comparables** into as-is and as-if sections based on new `asIf` flag
5. **Maintain data integrity** with proper validation and optional field handling

## Non-Goals
- Automated calculation of prior encumbrance from external data sources
- Historical tracking of appraisal changes over time
- Automated comparable classification (as-is vs as-if)
- Prior encumbrance subordination agreement tracking

## User Impact
**Admins** gain the ability to:
- Record prior liens when creating/editing mortgages
- Document as-if appraisals for construction/renovation loans
- See comprehensive financial picture including existing debt
- Track separate comparable sets for as-is and as-if valuations

**Investors** benefit from:
- Clear visibility into existing debt obligations
- Understanding of projected property values
- More accurate risk assessment
- Separation of current vs post-improvement valuations

## Technical Approach
See [`design.md`](./design.md) for detailed architectural decisions.

**Summary**:
1. Add `asIf` boolean field to `appraisal_comparables` schema
2. Add validators for `priorEncumbrance` and `asIfAppraisal` in backend mutations
3. Extend admin UI forms with toggle-based optional sections
4. Update financial metrics to display prior encumbrance card
5. Add as-if appraisal card to financial metrics
6. Split comparables display into two sections filtered by `asIf` flag
7. Update mock data generation for testing

## Capabilities Affected
- **mortgages**: Schema validators, admin mutations
- **appraisal-comparables**: Schema (add `asIf` field), queries, display logic
- **listing-detail**: Financial metrics display, comparables section split
- **admin-listing-creation**: Form state management, UI components (may need new spec for admin mortgage management)

## Dependencies
- Requires existing Convex schema fields (already defined)
- Requires existing admin UI infrastructure (MortgageUpdateSheet component)
- Requires existing financial metrics component structure

## Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|-----------|
| Breaking changes to existing mortgages without these fields | HIGH | Make fields optional everywhere, handle null/undefined gracefully |
| UI complexity with too many optional sections | MEDIUM | Use toggle buttons to hide/show, default to hidden state |
| Validation errors on legacy data | MEDIUM | Only validate when fields are present, skip if null |
| Comparables display confusion | LOW | Clear section headings, distinct visual separation |

## Testing Strategy
1. **Unit tests**: Validation logic for prior encumbrance and as-if appraisal
2. **Integration tests**: Backend mutations with optional fields
3. **Manual testing**: Admin UI workflows (add, edit, remove optional fields)
4. **Storybook stories**: Financial metrics cards, form sections, comparables separation
5. **Data migration verification**: Existing mortgages continue to work without new fields

## Success Criteria
- [ ] Admin can add/edit/remove prior encumbrance via UI
- [ ] Admin can add/edit/remove as-if appraisal via UI
- [ ] Prior encumbrance displays in financial metrics when present
- [ ] As-if appraisal displays in financial metrics when present
- [ ] Comparables split into as-is and as-if sections
- [ ] Validation prevents invalid data (negative amounts, missing required subfields)
- [ ] All type checks pass
- [ ] Existing mortgages without these fields continue to work
- [ ] Mock data generates realistic test cases

## Timeline Estimate
**Total**: ~6-8 hours

- Schema & backend: 1-2 hours
- Admin UI forms: 2-3 hours
- Financial metrics display: 1-2 hours
- Comparables section split: 1-2 hours
- Testing & validation: 1 hour

## Open Questions
- [x] Should prior encumbrance validation require both amount and lender? **Answer: Yes, if present**
- [x] Should as-if appraisal method be dropdown or free text? **Answer: Free text**
- [x] Should comparables `asIf` field default to false or undefined? **Answer: Undefined/false both mean as-is**
- [x] Where should we display as-if appraisal section? **Answer: Mirror as-is section layout**
