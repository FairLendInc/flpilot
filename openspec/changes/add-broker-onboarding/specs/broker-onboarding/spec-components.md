## ADDED Requirements

### Requirement: Convex Components Integration for Broker Onboarding

The system SHALL integrate Convex components (files-control, workflow, resend, rate-limiter, crons) to enhance the broker onboarding feature with enterprise-grade capabilities including secure document management, durable workflows, reliable notifications, and API protection.

#### Scenario: Install and configure Convex components

- **GIVEN** the broker onboarding feature exists
- **WHEN** the system integrates Convex components
- **THEN** the system SHALL install @gilhrpenner/convex-files-control, @convex-dev/workflow, @convex-dev/resend, @convex-dev/rate-limiter, and @convex-dev/crons components
- **AND** configure component paths in convex.config.js
- **AND** set required environment variables (RESEND_API_KEY)

#### Scenario: Components provide access to enhanced capabilities

- **GIVEN** Convex components are installed
- **WHEN** developers build broker onboarding features
- **THEN** they SHALL have access to files-control for secure document storage, workflow for durable approvals, resend for reliable email, rate-limiter for API protection, and crons for dynamic scheduling

---

### Requirement: Secure Document Management with files-control

The system SHALL use the files-control component to manage broker and client documents with access control, secure download grants, and audit trails, replacing the current manual storage approach.

#### Scenario: Broker uploads document with access control

- **GIVEN** a broker on the document upload step
- **WHEN** they select a file to upload
- **THEN** the system SHALL generate a presigned upload URL via files-control.generateUploadUrl
- **AND** after upload, finalize with access keys restricting access to the broker and admins
- **AND** store document metadata in the onboarding journey context

#### Scenario: Admin downloads broker document securely

- **GIVEN** an admin reviewing a broker application
- **WHEN** they request to download a document
- **THEN** the system SHALL verify admin role
- **AND** create a download grant via files-control.createDownloadGrant with single-use and 10-minute expiration
- **AND** return a secure download URL
- **AND** log the download event to the audit trail

#### Scenario: Document access is restricted by access keys

- **GIVEN** a document stored via files-control
- **WHEN** an unauthorized user attempts to access it
- **THEN** the system SHALL deny access unless the user has the correct access key (broker ID or "admin")

#### Scenario: Documents have lifecycle management

- **GIVEN** documents stored via files-control
- **WHEN** a broker onboarding journey expires or is rejected
- **THEN** the system SHALL automatically clean up documents via files-control's built-in cleanup mechanisms

---

### Requirement: Durable Approval Workflows with workflow Component

The system SHALL use the workflow component to implement durable, multi-step approval workflows for broker and client onboarding, with automatic retries, scheduled reminders, and human-in-the-loop approval steps.

#### Scenario: Broker approval workflow starts on submission

- **GIVEN** a broker submits their onboarding application
- **WHEN** the submitBrokerJourney mutation is called
- **THEN** the system SHALL start the brokerApprovalWorkflow via workflow component
- **AND** the workflow SHALL send notification to admin
- **AND** wait for admin decision event via ctx.awaitEvent
- **AND** survive server restarts during execution

#### Scenario: Admin approves broker via workflow event

- **GIVEN** a broker approval workflow is running and waiting for decision
- **WHEN** an admin clicks approve
- **THEN** the system SHALL emit "broker_approval_decision" event with approved: true
- **AND** the workflow SHALL resume, provision the broker organization
- **AND** send welcome email
- **AND** start reminder sequence workflow

#### Scenario: Admin rejects broker via workflow event

- **GIVEN** a broker approval workflow is running and waiting for decision
- **WHEN** an admin clicks reject with reason
- **THEN** the system SHALL emit "broker_approval_decision" event with approved: false
- **AND** the workflow SHALL send rejection email with reason
- **AND** update journey status to rejected

#### Scenario: Workflow sends automated reminders

- **GIVEN** a broker is approved and onboarded
- **WHEN** the brokerReminderWorkflow runs
- **THEN** the system SHALL send reminders at day 3, day 7, and day 14 via scheduled ctx.runAction calls with runAfter delays
- **AND** each reminder SHALL encourage profile completion

#### Scenario: Client approval workflow with broker review

- **GIVEN** a client completes their profile and submits for approval
- **WHEN** the client approval workflow starts
- **THEN** the system SHALL notify the broker
- **AND** wait for broker approval decision
- **AND** if approved, grant client access and send notification
- **AND** if rejected, send rejection email with reason

#### Scenario: Document request workflow with response tracking

- **GIVEN** an admin requests additional documents from a broker
- **WHEN** the documentRequestWorkflow starts
- **THEN** the system SHALL create a request in the timeline
- **AND** send notification to broker
- **AND** wait for broker response via "document_request_response" event
- **AND** upon response, notify admin and update timeline

#### Scenario: Workflow status is queryable

- **GIVEN** a workflow is running for a broker journey
- **WHEN** the frontend queries workflow status
- **THEN** the system SHALL return current status (pending, running, completed, failed), current step, start time, and completion time

---

### Requirement: Reliable Email Delivery with resend Component

The system SHALL use the resend component for all email notifications, providing reliable queuing, automatic retries, delivery tracking, and bounce/complaint handling.

#### Scenario: Send broker approval notification to admin

- **GIVEN** a broker submits their application
- **WHEN** the system needs to notify admin
- **THEN** the system SHALL queue email via resend.sendEmail with broker metadata
- **AND** automatically retry on failure with backoff
- **AND** track delivery status

#### Scenario: Send welcome email to approved broker

- **GIVEN** a broker is approved
- **WHEN** the workflow sends welcome email
- **THEN** the system SHALL use resend component with welcome template
- **AND** include broker portal URL
- **AND** track delivery

#### Scenario: Handle email delivery events

- **GIVEN** an email is sent via resend component
- **WHEN** delivery events occur (delivered, bounced, complained)
- **THEN** the system SHALL handle events via onEmailEvent handler
- **AND** log delivered emails to audit trail
- **AND** alert admin on bounced emails
- **AND** handle spam complaints

#### Scenario: Email batching for high volume

- **GIVEN** multiple emails need to be sent
- **WHEN** using resend component
- **THEN** the system SHALL automatically batch requests to Resend API
- **AND** respect rate limits

---

### Requirement: API Rate Limiting with rate-limiter Component

The system SHALL use the rate-limiter component to protect public endpoints from abuse, including subdomain enumeration, upload flooding, and API spam.

#### Scenario: Rate limit subdomain availability checks

- **GIVEN** a user checks subdomain availability
- **WHEN** they exceed 5 checks per minute
- **THEN** the system SHALL block further requests with "Rate limit exceeded" error
- **AND** return rateLimited: true status

#### Scenario: Rate limit document uploads per broker

- **GIVEN** a broker uploads documents
- **WHEN** they exceed 10 uploads per minute
- **THEN** the system SHALL reject additional uploads
- **AND** return rateLimited: true status
- **AND** display retry message to user

#### Scenario: Rate limit filter validation requests

- **GIVEN** a user validates filter constraints
- **WHEN** they exceed 20 validations per minute
- **THEN** the system SHALL block further validation requests temporarily

#### Scenario: Rate limit client invites per broker

- **GIVEN** a broker invites clients
- **WHEN** they exceed 10 invites per hour
- **THEN** the system SHALL block additional invites
- **AND** encourage quality over quantity

---

### Requirement: Dynamic Cron Scheduling with crons Component

The system SHALL use the crons component for dynamic, per-broker reminder schedules that can be created and cancelled based on broker state changes.

#### Scenario: Schedule document reminder when broker enters awaiting_documents state

- **GIVEN** a broker enters "awaiting_documents" state
- **WHEN** the state transition occurs
- **THEN** the system SHALL register a dynamic cron via crons.register
- **AND** schedule reminder for 48 hours later
- **AND** name the cron with journey ID for later cancellation

#### Scenario: Cancel reminder when documents uploaded

- **GIVEN** a reminder cron is scheduled for a broker
- **WHEN** the broker uploads required documents
- **THEN** the system SHALL cancel the cron via crons.delete
- **AND** prevent unnecessary reminder

#### Scenario: Per-broker reminder sequences

- **GIVEN** multiple brokers in different states
- **WHEN** each broker has different reminder needs
- **THEN** the system SHALL maintain separate cron schedules per broker
- **AND** dynamically adjust based on broker progress

---

## MODIFIED Requirements

### Requirement: Document Storage Architecture

**FROM:** Documents stored as raw storage IDs in onboarding journey context with no access control.

**TO:** Documents stored via files-control component with access key-based authorization, secure download grants, and automatic lifecycle management.

**Migration:** Existing documents will continue to work; new uploads use files-control. Gradual migration possible via background job.

#### Scenario: Backward compatible document access

- **GIVEN** existing documents stored as raw storage IDs
- **WHEN** accessed by authorized users
- **THEN** the system SHALL continue to serve them
- **AND** new documents SHALL use files-control access control

---

### Requirement: Approval Process Architecture

**FROM:** Synchronous approval mutations that update status and send notifications immediately, with no retry on failure.

**TO:** Event-driven workflow using workflow component with durable execution, automatic retries, scheduled reminders, and human-in-the-loop approvals.

**Migration:** Existing synchronous endpoints remain functional; workflows add durability layer on top.

#### Scenario: Parallel operation of sync and workflow

- **GIVEN** both synchronous and workflow-based approvals exist
- **WHEN** admin approves via new workflow-enabled UI
- **THEN** the system SHALL use workflow for durability
- **AND** when approved via old UI, synchronous logic still works

---

### Requirement: Email Delivery Architecture

**FROM:** Direct fetch() calls to Resend API with no retry logic.

**TO:** Queued email delivery via resend component with automatic retries, batching, and delivery tracking.

**Migration:** Replace fetch() calls with resend.sendEmail(); no breaking changes to email templates.

#### Scenario: Transparent email upgrade

- **GIVEN** emails sent via direct API calls
- **WHEN** migrated to resend component
- **THEN** email content and recipients remain unchanged
- **AND** delivery becomes more reliable

---

## RENAMED Requirements

- **FROM:** `Requirement: Manual Document Storage`
- **TO:** `Requirement: Secure Document Management with files-control`

- **FROM:** `Requirement: Synchronous Approval Mutations`
- **TO:** `Requirement: Durable Approval Workflows with workflow Component`

- **FROM:** `Requirement: Direct Email API Calls`
- **TO:** `Requirement: Reliable Email Delivery with resend Component`

---

## Component Integration Specifications

### Files-Control Component

**Installation:**
```bash
npx convex component install @gilhrpenner/convex-files-control
```

**Configuration:**
```javascript
// convex.config.js
export default defineConfig({
  components: {
    convexFilesControl: {
      path: "../node_modules/@gilhrpenner/convex-files-control",
    },
  },
});
```

**Key Functions:**
- `files.generateUploadUrl()` - Generate presigned upload URL
- `files.finalizeUpload()` - Finalize upload with access keys
- `files.createDownloadGrant()` - Create secure download grant
- `buildDownloadUrl()` - Build download URL from grant

### Workflow Component

**Installation:**
```bash
npx convex component install @convex-dev/workflow
```

**Key Features:**
- `workflow.define()` - Define durable workflows
- `ctx.awaitEvent()` - Wait for human approval
- `ctx.runAction()` - Execute actions with scheduling
- `ctx.runWorkflow()` - Start child workflows

**Workflows to Implement:**
1. brokerApprovalWorkflow - Multi-step broker approval
2. brokerReminderWorkflow - Automated reminder sequence
3. clientApprovalWorkflow - Client onboarding approval
4. documentRequestWorkflow - Document request/response

### Resend Component

**Installation:**
```bash
npx convex component install @convex-dev/resend
```

**Configuration:**
```bash
RESEND_API_KEY=re_xxxxxxxx
```

**Key Functions:**
- `resend.sendEmail()` - Queue email with retry
- `onEmailEvent` handler - Handle delivery events

**Emails to Migrate:**
- Broker approval notifications
- Welcome emails
- Rejection emails
- Reminder emails
- Client notifications

### Rate-Limiter Component

**Installation:**
```bash
npx convex component install @convex-dev/rate-limiter
```

**Rate Limits:**
- subdomainCheck: 5 per minute per IP
- documentUpload: 10 per minute per user
- filterValidation: 20 per minute per user
- clientInvite: 10 per hour per broker

### Crons Component

**Installation:**
```bash
npx convex component install @convex-dev/crons
```

**Use Cases:**
- Dynamic reminder scheduling per broker
- Self-deleting one-time reminders
- Per-broker cleanup jobs

---

## Migration Path

### Phase 1: Component Installation (2 hours)
1. Install all 5 components
2. Configure environment variables
3. Set up webhook endpoints
4. Create component initialization file

### Phase 2: Document Security (4 hours)
1. Create document management module
2. Implement secure upload flow
3. Implement secure download with grants
4. Update frontend components

### Phase 3: Workflow Automation (5 hours)
1. Define approval workflows
2. Create event handlers
3. Integrate with existing mutations
4. Add workflow status queries

### Phase 4: Reliable Notifications (3 hours)
1. Set up resend integration
2. Create email module
3. Migrate existing email calls
4. Set up event handling

### Phase 5: API Protection (2 hours)
1. Configure rate limits
2. Add rate limiting to endpoints
3. Create UI feedback

### Phase 6: Dynamic Scheduling (1 hour)
1. Implement per-broker reminders
2. Add cron cancellation logic

---

## Benefits Summary

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Code Lines | ~3,500 | ~2,100 | -40% |
| Document Security | None | Access control, grants | ++++ |
| Approval Reliability | Manual retries | Automatic retries | ++++ |
| Email Delivery | Direct API | Queued with tracking | +++ |
| API Protection | None | Rate limiting | +++ |
| Maintainability | Medium | High | +++ |

---

## Next Steps

1. **Review this spec** with stakeholders
2. **Approve component adoption** strategy
3. **Begin Phase 1** (Component Installation)
4. **Execute phases** in order
5. **Test thoroughly** after each phase
6. **Deploy incrementally** with feature flags
