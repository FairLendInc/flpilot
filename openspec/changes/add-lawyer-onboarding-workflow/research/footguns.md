# Footguns & Gotchas: Persona Integration (Future)

Fetch timestamp (UTC): 2026-01-31T04:20:01Z
Change ID: add-lawyer-onboarding-workflow

## High-Risk Pitfalls
- **Client-side inquiry creation** creates a brand-new inquiry on every visit and exposes prefill values via query parameters; this can lead to duplicate inquiries and weak control over immutable fields. Prefer server-side inquiry creation. citeturn1view0
- **Prefill fields are user-readable**; do not store sensitive or internal-only data in Persona fields, since they are intended for customer-supplied input. citeturn4view0
- **Inquiry resume requires session tokens** when the inquiry is pending; tokens live in session storage, so reopening in a new window loses the session. Plan for a re-resume path. citeturn2view2turn5view4
- **Inquiry sessions are capped (25)**; long-running or repeated resumes can hit session limits. citeturn5view4
- **Inquiries expire after 24 hours** by default; resuming resets expiration but also invalidates existing sessions and one-time links. citeturn4view5
- **Webhook events can be duplicated and out of order**; treat them as at-least-once and order by created timestamp. citeturn4view4
- **Signature verification is required**; validate the `Persona-Signature` HMAC (timestamp + v1 signature) before processing webhooks. citeturn4view4

## Integration Traps
- Passing `templateId`/`templateVersionId` while resuming an inquiry can create a new inquiry instead of resuming; use `inquiryId` + `sessionToken` only for pending inquiries. citeturn5view0turn5view2
- Legacy templates (`tmpl_`) are deprecated; use Dynamic Flow templates (`itmpl_`) and the compatible SDK versions when using SDKs. citeturn1view1
- API keys are environment-specific and must stay secret; do not ship them to the browser. citeturn2view1
