# notifications Specification

## ADDED Requirements

### Requirement: Notification Preferences Management

Users SHALL be able to configure their notification preferences by channel and notification type. The system SHALL enforce that at least one delivery channel is always enabled.

#### Scenario: User views default preferences

- **GIVEN** a new user with no saved preferences
- **WHEN** the user accesses notification settings
- **THEN** the system returns default preferences with all channels enabled and sensible type defaults

#### Scenario: User updates channel preferences

- **GIVEN** an authenticated user
- **WHEN** the user disables email notifications but keeps SMS enabled
- **THEN** the preferences are saved successfully
- **AND** future notifications respect the new channel settings

#### Scenario: User attempts to disable all channels

- **GIVEN** an authenticated user with email as the only enabled channel
- **WHEN** the user attempts to disable email
- **THEN** the system rejects the update with error "At least one channel must be enabled"
- **AND** the preferences remain unchanged

#### Scenario: User updates type preferences

- **GIVEN** an authenticated user
- **WHEN** the user disables "weekly_suggestions" notifications
- **THEN** the preferences are saved successfully
- **AND** weekly digest emails are no longer sent to this user

#### Scenario: Mandatory notification types cannot be disabled

- **GIVEN** an authenticated user viewing preferences
- **WHEN** the preferences UI renders notification types
- **THEN** mandatory types (deal_update, action_required, security_alert) are displayed as always-on
- **AND** no toggle control is provided for mandatory types

---

### Requirement: User-Defined Rate Limits

Users SHALL be able to configure their own rate limits per channel, with a system maximum of 10 notifications per channel per day.

#### Scenario: User sets custom rate limits

- **GIVEN** an authenticated user configuring notification preferences
- **WHEN** the user sets email limit to 8, SMS limit to 5, phone limit to 2
- **THEN** the preferences are saved with the custom limits
- **AND** future notifications respect these limits

#### Scenario: Rate limit cannot exceed system maximum

- **GIVEN** an authenticated user configuring notification preferences
- **WHEN** the user attempts to set email limit to 15
- **THEN** the system rejects the update with error "Rate limit cannot exceed 10 per day"
- **AND** the preferences remain unchanged

#### Scenario: Notifications blocked when rate limit exceeded

- **GIVEN** a user with email rate limit of 5
- **AND** the user has received 5 emails today
- **WHEN** another email notification is triggered
- **THEN** the email delivery is skipped for today
- **AND** the notification is converted to in-app only

---

### Requirement: Channel Deduplication with Priority

When a notification triggers multiple enabled channels, the system SHALL select only the highest-priority external channel to avoid notification fatigue. In-app alerts are always sent regardless of other channels.

#### Scenario: Priority selection with multiple channels enabled

- **GIVEN** a user with Phone, SMS, and Email channels enabled
- **WHEN** a notification is triggered
- **THEN** the system selects Phone (highest priority)
- **AND** only one Phone notification is queued
- **AND** SMS and Email are NOT queued
- **AND** an in-app alert is ALWAYS created

#### Scenario: Fallback to next priority when top is unavailable

- **GIVEN** a user with SMS and Email enabled (no Phone)
- **WHEN** a notification is triggered
- **THEN** the system selects SMS (next highest priority)
- **AND** only one SMS notification is queued
- **AND** Email is NOT queued
- **AND** an in-app alert is ALWAYS created

#### Scenario: In-app only when no external channels enabled

- **GIVEN** a user with only in-app notifications enabled
- **WHEN** a notification is triggered
- **THEN** only an in-app alert is created
- **AND** no external delivery is queued

---

### Requirement: Notification Delivery Channels

The system SHALL support multiple notification delivery channels: in-app alerts, email, SMS, and phone. Each channel SHALL use a **provider-agnostic strategy pattern** for delivery, with runtime-configurable provider selection. Priority order is: Phone (1) > SMS (2) > Email (3).

#### Scenario: In-app notification delivery

- **GIVEN** a user with in-app notifications enabled
- **WHEN** a notification is triggered for the user
- **THEN** an entry is created in the alerts table
- **AND** the user's unread alert count increases
- **AND** the AlertBell component displays the new notification

#### Scenario: Email notification delivery via configured provider

- **GIVEN** a user with email as the selected delivery channel
- **AND** an email provider is configured via EMAIL_PROVIDER environment variable
- **WHEN** a notification is triggered for the user
- **THEN** the system queues an email delivery
- **AND** the configured email provider sends to the user's verified email address
- **AND** the email contains an unsubscribe link

#### Scenario: SMS notification delivery via configured provider

- **GIVEN** a user with SMS as the selected delivery channel
- **AND** an SMS provider is configured via SMS_PROVIDER environment variable
- **AND** a verified phone number on file
- **WHEN** a notification is triggered for the user
- **THEN** the system queues an SMS delivery
- **AND** the configured SMS provider sends to the verified phone number
- **AND** the message is concise (under 160 characters when possible)

#### Scenario: Phone notification delivery via configured provider

- **GIVEN** a user with Phone as the selected delivery channel
- **AND** a voice provider is configured via VOICE_PROVIDER environment variable
- **AND** a verified phone number on file
- **WHEN** a notification is triggered for the user
- **THEN** the system queues a phone delivery
- **AND** the configured voice provider initiates a call using runtime-loaded scripts

#### Scenario: SMS blocked for unverified phone

- **GIVEN** a user with SMS notifications enabled
- **AND** no verified phone number on file
- **WHEN** a notification is triggered for the user
- **THEN** the SMS delivery is skipped
- **AND** the system falls back to the next priority channel (Email)
- **AND** if no verified channels, only in-app alert is created

#### Scenario: Provider selection at runtime

- **GIVEN** EMAIL_PROVIDER is set to "sendgrid" in environment
- **WHEN** an email notification is processed
- **THEN** the SendGrid provider implementation is used
- **AND** no code changes are required to switch providers

#### Scenario: Provider failure triggers retry via Action Retrier

- **GIVEN** a notification queued for email delivery
- **WHEN** the provider returns a transient error
- **THEN** the `@convex-dev/action-retrier` component automatically retries
- **AND** exponential backoff is applied (initialBackoffMs: 1000, base: 2)
- **AND** the `retrierRunId` is stored in the queue entry for status tracking

---

### Requirement: Notification Queue Processing

The system SHALL maintain a durable notification queue that processes notifications asynchronously. Retry logic is handled by `@convex-dev/action-retrier`, cron scheduling by `@convex-dev/crons`, and rate limiting by `@convex-dev/rate-limiter`.

#### Scenario: Queue entry creation

- **GIVEN** a notification event occurs
- **WHEN** the emitNotification function is called
- **THEN** queue entries are created for each enabled channel
- **AND** each entry references the content without storing PII
- **AND** entries are scheduled for immediate or future delivery

#### Scenario: Queue processing batch via crons component

- **GIVEN** pending queue entries exist
- **AND** the `process-notification-queue` cron is registered via `@convex-dev/crons`
- **WHEN** the cron job runs (every 30 seconds)
- **THEN** up to batchSize entries are processed
- **AND** each entry is delivered via `retrier.run()` with `onComplete` callback
- **AND** successfully delivered entries are marked as "delivered"

#### Scenario: Delivery retry via action-retrier component

- **GIVEN** a queue entry fails delivery
- **WHEN** the error is transient (network timeout, rate limit)
- **THEN** the `@convex-dev/action-retrier` automatically retries up to maxFailures (4)
- **AND** backoff increases exponentially (1s → 2s → 4s → 8s)
- **AND** no manual retry logic is required in application code

#### Scenario: Permanent failure after max retries

- **GIVEN** a queue entry has failed maxFailures (4) times
- **WHEN** the Action Retrier gives up
- **THEN** the `onComplete` callback is invoked with `result.type === "failed"`
- **AND** the queue entry is marked as "failed" with error message
- **AND** no further delivery attempts are made

#### Scenario: Expired notification skipped

- **GIVEN** a queue entry with expiresAt in the past
- **WHEN** the processQueue cron attempts to process it
- **THEN** the entry is marked as "skipped" with reason "expired"
- **AND** no delivery is attempted

---

### Requirement: Saved Filter Management

Users SHALL be able to save listing search filters and opt into notifications when new listings match their saved criteria.

#### Scenario: Create saved filter

- **GIVEN** an authenticated user viewing listing search results
- **WHEN** the user clicks "Save this filter" and provides a name
- **THEN** the filter criteria are saved to the saved_filters table
- **AND** the filter is associated with the user
- **AND** the notifyOnMatch flag defaults to true

#### Scenario: List user's saved filters

- **GIVEN** an authenticated user with 3 saved filters
- **WHEN** the user accesses their saved filters
- **THEN** all 3 filters are returned with their criteria and notification settings
- **AND** no other users' filters are visible

#### Scenario: Enable notification on filter

- **GIVEN** an authenticated user with a saved filter where notifyOnMatch is false
- **WHEN** the user enables notifications for that filter
- **THEN** the notifyOnMatch flag is set to true
- **AND** future matching listings will trigger notifications

#### Scenario: Limit saved filters per user

- **GIVEN** a user with 10 saved filters
- **WHEN** the user attempts to create an 11th filter
- **THEN** the system rejects the request with error "Maximum of 10 saved filters allowed"

#### Scenario: Delete saved filter

- **GIVEN** an authenticated user with a saved filter
- **WHEN** the user deletes the filter
- **THEN** the filter is removed from the database
- **AND** no future notifications are sent for that filter

---

### Requirement: Listing Match Notifications

When a new listing is created, the system SHALL notify users whose saved filters match the listing criteria.

#### Scenario: New listing matches multiple filters

- **GIVEN** 3 users have saved filters that would match a listing with LTV=75, loanAmount=500000
- **AND** all 3 users have listing_match notifications enabled
- **WHEN** a new listing is created with those criteria
- **THEN** each of the 3 users receives a notification
- **AND** the notifications are delivered via each user's enabled channels

#### Scenario: Listing matches filter but user disabled type

- **GIVEN** a user has a matching saved filter
- **AND** the user has disabled listing_match notifications
- **WHEN** a new listing is created that matches
- **THEN** no notification is sent to that user

#### Scenario: Large fan-out is batched

- **GIVEN** 500 users have matching saved filters
- **WHEN** a new listing is created
- **THEN** queue entries are created in batches of 100
- **AND** all 500 users eventually receive notifications
- **AND** the system does not timeout or fail

---

### Requirement: Deal Update Notifications

Users involved in a deal SHALL receive mandatory notifications for deal state changes and required actions. These notifications cannot be disabled.

#### Scenario: Deal state transition notification

- **GIVEN** a deal transitions from pending_docs to pending_transfer
- **WHEN** the transition completes
- **THEN** the investor receives a deal_update notification
- **AND** the notification includes the new state and next steps
- **AND** the notification is delivered regardless of user preferences

#### Scenario: Document signing required notification

- **GIVEN** a deal requires the investor to sign a document
- **WHEN** the document is generated and ready
- **THEN** the investor receives an action_required notification
- **AND** the notification includes a link to the signing page
- **AND** the notification is marked as sensitivity="sensitive"
- **AND** an audit event is logged

#### Scenario: Deal completion notification

- **GIVEN** a deal transitions to completed state
- **WHEN** the transition completes
- **THEN** the investor receives a deal_completed notification
- **AND** the notification includes deal summary and next steps

---

### Requirement: Broker Client Notifications

Brokers SHALL receive notifications when their clients complete onboarding or send messages.

#### Scenario: Client completes onboarding

- **GIVEN** a broker has a client in onboarding status
- **AND** the broker has client_onboarding_complete enabled
- **WHEN** the client's onboarding status transitions to approved
- **THEN** the broker receives a notification
- **AND** the notification includes the client's name and link to their profile

#### Scenario: Client sends message to broker

- **GIVEN** a broker has client_message_received enabled
- **WHEN** a client sends a message via the communication system
- **THEN** the broker receives a notification
- **AND** the notification includes a preview of the message
- **AND** the notification links to the conversation thread

#### Scenario: Broker disabled client notifications

- **GIVEN** a broker has disabled client_onboarding_complete notifications
- **WHEN** a client completes onboarding
- **THEN** no notification is sent to the broker

---

### Requirement: Saved Listing Activity Notifications

Users SHALL receive optional notifications when listings they have saved are viewed or purchased by others.

#### Scenario: Saved listing viewed notification

- **GIVEN** a user has saved a listing
- **AND** the user has saved_listing_viewed enabled (default: off)
- **WHEN** another user views the listing detail page
- **THEN** the saving user receives a notification
- **AND** the notification indicates the listing was viewed (no PII about viewer)

#### Scenario: Saved listing purchased notification

- **GIVEN** a user has saved a listing
- **AND** the user has saved_listing_purchased enabled (default: on)
- **WHEN** the listing is fully or partially purchased
- **THEN** the saving user receives a notification
- **AND** the notification indicates the listing is no longer available

#### Scenario: Saved listing notifications respect preferences

- **GIVEN** a user has saved_listing_viewed disabled
- **WHEN** another user views the listing
- **THEN** no notification is sent

---

### Requirement: Weekly Suggestions Digest

Users MAY opt into receiving weekly email digests with suggested listings based on their investment preferences.

#### Scenario: Weekly digest sent to opted-in user

- **GIVEN** a user has weekly_suggestions enabled
- **AND** there are new listings matching general investment criteria
- **WHEN** the weekly digest cron job runs
- **THEN** the user receives an email with suggested listings
- **AND** the email contains up to 10 listings with key metrics
- **AND** each listing links to the detail page

#### Scenario: Weekly digest skipped for opted-out user

- **GIVEN** a user has weekly_suggestions disabled
- **WHEN** the weekly digest cron job runs
- **THEN** no digest email is sent to that user

#### Scenario: Weekly digest with no suggestions

- **GIVEN** a user has weekly_suggestions enabled
- **AND** no new listings match their criteria this week
- **WHEN** the weekly digest cron job runs
- **THEN** no email is sent (skip empty digests)

---

### Requirement: Notification Security and Audit

Sensitive notifications SHALL be handled with appropriate security measures including audit logging and content isolation.

#### Scenario: Sensitive notification creates audit event

- **GIVEN** a sensitive notification is emitted (sensitivity="sensitive")
- **WHEN** the notification is processed
- **THEN** an audit_events record is created
- **AND** the audit event includes notification type, recipient, timestamp
- **AND** the audit event does NOT include the notification content

#### Scenario: Queue entries do not contain PII

- **GIVEN** a notification is emitted for a user
- **WHEN** the queue entry is created
- **THEN** the contentRef contains only entity IDs and type
- **AND** no user names, emails, or other PII is stored in the queue

#### Scenario: Content generated at delivery time

- **GIVEN** a queue entry is being processed for email delivery
- **WHEN** the email action runs
- **THEN** the email content is generated by fetching the referenced entity
- **AND** the content is personalized for the recipient at that moment
- **AND** the content reflects the current state of the entity

#### Scenario: User cannot access other users' notifications

- **GIVEN** User A has pending notifications
- **WHEN** User B queries the notification queue
- **THEN** User B sees only their own notifications
- **AND** User A's notifications are not visible

---

### Requirement: Convex Components Integration

The notification system SHALL leverage Convex ecosystem components for SMS delivery, rate limiting, retry logic, and cron scheduling.

#### Scenario: SMS delivery via @convex-dev/twilio

- **GIVEN** a user has SMS as the selected delivery channel
- **AND** the `@convex-dev/twilio` component is configured
- **WHEN** an SMS notification is sent
- **THEN** the `twilioClient.sendMessage()` method is used
- **AND** delivery status is automatically tracked via webhooks
- **AND** message history is queryable via `twilioClient.list(ctx)`

#### Scenario: Rate limiting via @convex-dev/rate-limiter

- **GIVEN** a user has configured a rate limit of 5 emails per day
- **AND** the `@convex-dev/rate-limiter` component is configured
- **WHEN** the 6th email notification is triggered today
- **THEN** the rate limiter returns `{ ok: false, retryAfter: ... }`
- **AND** the notification is skipped or deferred
- **AND** the rate limit uses per-user key: `{ key: userId }`

#### Scenario: Retry logic via @convex-dev/action-retrier

- **GIVEN** a notification delivery action fails
- **AND** the `@convex-dev/action-retrier` component is configured
- **WHEN** the failure is transient
- **THEN** the retrier automatically retries with exponential backoff
- **AND** the `onComplete` callback is invoked when delivery succeeds or permanently fails
- **AND** the run can be monitored via `retrier.status(ctx, runId)`

#### Scenario: Dynamic cron scheduling via @convex-dev/crons

- **GIVEN** a user configures their weekly digest for Tuesday 10 AM EST
- **AND** the `@convex-dev/crons` component is configured
- **WHEN** the preference is saved
- **THEN** a cron job is registered: `cronManager.register(ctx, { kind: "cron", cronspec: "0 10 * * 2" }, ...)`
- **AND** the cron is named `weekly-digest-{userId}` for management
- **AND** existing crons for that user are deleted before creating new ones

#### Scenario: Cron cleanup on preference change

- **GIVEN** a user has a weekly digest cron registered
- **WHEN** the user changes their preferred time
- **THEN** the old cron is deleted via `cronManager.delete(ctx, { name: "weekly-digest-{userId}" })`
- **AND** a new cron is registered with the updated schedule
