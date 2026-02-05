# Research: Persona Identity Verification (Lawyer Onboarding)

Fetch timestamp (UTC): 2026-01-31T04:20:01Z
Change ID: add-lawyer-onboarding-workflow

## Sources
- Persona “Creating Inquiries” documentation. citeturn1view0
- Persona “Inquiry Templates” documentation. citeturn1view1
- Persona “Inquiry Fields” documentation. citeturn4view0
- Persona “Embedded Flow Parameters” documentation. citeturn5view0
- Persona “Hosted Flow Parameters” documentation. citeturn5view2
- Persona “Resuming Inquiries” documentation. citeturn2view2
- Persona “Inquiry Sessions” documentation. citeturn5view4
- Persona “Inquiry Expiration” documentation. citeturn4view5
- Persona “Webhook Best Practices” documentation. citeturn4view4
- Persona “API Keys” documentation. citeturn2view1

## Key Findings (Summary)
- Persona recommends API-based inquiry creation; client-side creation generates a fresh inquiry on each visit and exposes prefill data in query params, which is not suitable for strict name matching. citeturn1view0
- Inquiry templates are versioned; dynamic flow templates use `itmpl_` IDs and legacy templates (`tmpl_`) are deprecated. Dynamic Flow SDK migrations require JS SDK v4 (and v2 for iOS/Android) when using SDKs. citeturn1view1
- Inquiry fields are intended for customer-supplied data; Persona recommends not storing data that should be hidden from end users. Prefill can be used to later compare extracted ID data to the prefilled values. citeturn4view0
- Resuming pending inquiries requires a session token; session tokens are stored in session storage and are lost if the user reopens in a new window. citeturn2view2turn5view4
- Inquiries expire after 24 hours by default; resuming an inquiry resets the expiration window; sessions and one-time links expire when the inquiry expires. citeturn4view5
- Webhooks can be duplicated and arrive out of order; Persona recommends idempotent processing and ordering by `data.attributes.created-at`, and verifying signatures via the `Persona-Signature` header. citeturn4view4
- API keys are environment-specific; keep keys secret and scope permissions. citeturn2view1

## Integration Patterns & Architecture Guidance
### Inquiry Creation Strategy
- Prefer server-side (API) inquiry creation. Persona recommends API-based creation for control, stronger guardrails, and non-modifiable prefill fields; client-side creation creates a new inquiry per visit and exposes prefill values in query params. citeturn1view0
- When resuming, use `inquiryId` (and `sessionToken` for pending inquiries) and avoid passing template IDs to prevent creating new inquiries. citeturn5view0turn5view2

### Prefill & Name Matching
- Inquiry fields are meant for customer-supplied data and are readable/writable by the end user; do not store internal secrets there. citeturn4view0
- Persona supports prefilling fields at creation time and allows template checks that compare extracted ID data to prefilled values (e.g., name, DOB). This maps cleanly to strict name matching. citeturn4view0

### Hosted vs Embedded Parameters (Future Persona Integration)
- Hosted flow: use `inquiry-template-id` to create new inquiries; use `reference-id` or `account-id` to associate with an account; use `fields` to prefill. citeturn5view2
- Resuming in hosted flow: pass `inquiry-id` and `session-token` and do not pass template IDs. citeturn5view2
- Embedded flow: same resume guidance—use `inquiryId` and `sessionToken` and do not pass `templateId`/`templateVersionId` when resuming. citeturn5view0

### Sessions & Expiration
- Pending inquiries require a session token; tokens live in session storage and are lost across tabs/windows. citeturn2view2turn5view4
- Inquiry sessions are capped at 25 by default; session expiry tracks inquiry expiry and is not extended when the inquiry expiration is updated. citeturn5view4
- Default inquiry expiration is 24 hours; resuming resets the expiration and expires existing sessions and one-time links. citeturn4view5

### Webhooks (When Persona Integration Goes Live)
- Expect duplicate events; implement idempotency by storing processed event IDs. citeturn4view4
- Events are not ordered; use `data.attributes.created-at` to order. citeturn4view4
- Verify webhook signatures using the `Persona-Signature` header (timestamp + `v1` HMAC). citeturn4view4

## Configuration & Authentication
- Use environment-specific API keys and keep them secret; do not embed in client-side code. citeturn2view1
- Scope API key permissions to required resources (e.g., inquiry.write, webhook.read). citeturn2view1

## Implementation Guidance for flpilot (Mock Now, Swap Later)
- **Mock identity provider**: Provide `createInquiry`, `completeInquiry`, `getInquiryStatus`, and `getExtractedName` methods that simulate Persona outcomes without external calls. Keep stored inquiry IDs so the state machine can model resumes.
- **Name matching strategy**: Inject a strict matcher (exact match after normalization) and isolate it behind `NameMatchStrategy` so a fuzzy/normalized matcher can replace it later.
- **Future Persona adapter**: Mirror the mock interface to a real adapter that creates inquiries via API, stores `inquiryId`, resumes using `sessionToken`, and returns extracted fields for matching. The mock should make it easy to switch without touching the state machine.

## Code Examples (Pseudo; align to Persona API v1 patterns)
### Create inquiry (server-side)
```ts
// Persona API v1 (pseudo)
const res = await fetch("https://api.withpersona.com/api/v1/inquiries", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.PERSONA_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    data: {
      type: "inquiry",
      attributes: {
        template_id: "itmpl_...",
        fields: { name_first: "Ada", name_last: "Lovelace" },
      },
    },
  }),
});
```
This pattern aligns with Persona’s `/api/v1` endpoints and server-side inquiry creation guidance. citeturn1view0turn2view2

### Resume inquiry (server-side) and load embedded flow
```ts
// Resume inquiry to receive a session token (required for pending inquiries)
const resume = await fetch(
  `https://api.withpersona.com/api/v1/inquiries/${inquiryId}/resume`,
  { method: "POST", headers: { Authorization: `Bearer ${apiKey}` } }
);
const sessionToken = resume.meta["session-token"];

// Embedded flow parameters
const client = new Persona.Client({ inquiryId, sessionToken });
client.open();
```
Resume and embedded flow parameters require `inquiryId` + `sessionToken` for pending inquiries, and you should not pass template IDs when resuming. citeturn5view0turn2view2

### Webhook verification (server-side)
```ts
// Compute HMAC over `${timestamp}.${rawBody}` and compare to v1 signature
const signatureHeader = req.headers["persona-signature"]; // t=...,v1=...
// Verify signature before processing; then enforce idempotency by event ID.
```
Persona recommends signature verification and idempotent processing. citeturn4view4

## Testing Recommendations
- Unit test strict name matching and mismatch handling in the identity provider interface. (No external dependency.)
- Simulate inquiry resumption behavior and verify that pending inquiries require a session token path. citeturn5view0turn2view2
- Add tests that cover expiration behavior and session token loss to mimic real UX. citeturn4view5turn5view4
- If/when webhooks are added, test duplicate events, ordering, and signature verification. citeturn4view4

## Deprecated Methods / Migration Notes
- Legacy templates (`tmpl_`) are deprecated; use Dynamic Flow templates (`itmpl_`). citeturn1view1
- SDK integrations should use JS SDK v4 (and v2 for iOS/Android) when migrating to Dynamic Flow. citeturn1view1
