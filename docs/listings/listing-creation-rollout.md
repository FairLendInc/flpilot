# Listing Creation Rollout Notes

## Smoke Test Summary

- Confirmed `listings.createFromPayload` mutation behaviour via automated unit tests (`pnpm test -- --run convex/tests/listingsCreateFromPayload.test.ts`).
- Exercised the authenticated webhook with success, invalid key, and validation failure cases (`pnpm test -- --run convex/tests/listingsWebhook.test.ts`).
- Store behaviour validated in isolation (`pnpm test -- --run unit-tests/listingCreationStore.test.ts`).
- Manual UI submission recommended before release: create a draft listing in `http://localhost:3000/dashboard/admin/listings/new`, verify success toast, and confirm listing visibility inside the listings dashboard.

## Webhook Configuration Checklist

1. Set `LISTINGS_WEBHOOK_API_KEY` in `.env.local` and deployment secrets.
2. (Optional) Set `LISTINGS_WEBHOOK_ALLOWED_ORIGIN` when the integration requires a specific origin.
3. Provide partners with the POST endpoint `https://<convex-deployment>/listings/create` and header `x-api-key`.
4. Share the example payload from `convex/tests/listingsWebhook.test.ts` as a starting point for integration testing.

## Stakeholder Demo Guidance

- Capture a screenshot of the populated Create Listing form after a successful submission (include borrower card, mortgage summary, and success toast).
- Record a short Loom walking through both the admin form and a sample webhook request (Postman or curl) that replays the same payload.
- Store assets alongside this document or attach them to the rollout announcement once captured.
