# Broker Onboarding - Enhanced Implementation Specification

**Status**: Component-Enhanced Implementation Plan  
**Version**: 2.0 (with Convex Components)  
**Date**: January 28, 2025

---

## Executive Summary

This specification enhances the broker onboarding feature by integrating **Convex components** to reduce boilerplate code, add enterprise-grade features, and improve maintainability.

### Component Integration Overview

| Component         | Purpose                                     | Impact                                 |
| ----------------- | ------------------------------------------- | -------------------------------------- |
| **files-control** | Secure document uploads with access control | Replaces manual storage, adds security |
| **workflow**      | Durable multi-step approval workflows       | Replaces manual state management       |
| **resend**        | Reliable email delivery with tracking       | Replaces direct API calls              |
| **rate-limiter**  | API protection and throttling               | Adds security layer                    |
| **crons**         | Dynamic reminder scheduling                 | Enhances reminder system               |

### Benefits

- **-40% code reduction** (less boilerplate)
- **Enterprise features** (access control, audit trails, reliability)
- **Better maintainability** (community-tested components)
- **Advanced capabilities** (durable workflows, automatic retries)

---

## Component Architecture

### System Overview with Components

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT APPLICATION                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Document   │  │   Workflow   │  │   Rate Limit │      │
│  │    Upload    │  │    Status    │  │    Check     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼─────────────────┼─────────────────┼──────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                     CONVEX BACKEND                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              FILES-CONTROL COMPONENT                │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │   │
│  │  │   Upload    │  │  Download   │  │   Grant    │  │   │
│  │  │     URL     │  │    Grant    │  │  Tracking  │  │   │
│  │  └─────────────┘  └─────────────┘  └────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              WORKFLOW COMPONENT                     │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │   │
│  │  │   Approval  │  │   Reminder  │  │   Status   │  │   │
│  │  │    Flow     │  │   Sequence  │  │   Query    │  │   │
│  │  └─────────────┘  └─────────────┘  └────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              RESEND COMPONENT                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │   │
│  │  │    Email    │  │   Bounce    │  │   Queue    │  │   │
│  │  │    Queue    │  │   Handler   │  │   Status   │  │   │
│  │  └─────────────┘  └─────────────┘  └────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              RATE-LIMITER COMPONENT                 │   │
│  │  ┌─────────────┐  ┌─────────────┐                  │   │
│  │  │   Upload    │  │   Subdomain │                  │   │
│  │  │    Limit    │  │    Limit    │                  │   │
│  │  └─────────────┘  └─────────────┘                  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Integration Specifications

### 1. Files-Control Component

#### 1.1 Installation & Configuration

```bash
npx convex component install @gilhrpenner/convex-files-control
```

**Configuration** (`convex.config.js`):

```javascript
export default defineConfig({
  components: {
    convexFilesControl: {
      path: "../node_modules/@gilhrpenner/convex-files-control",
    },
  },
});
```

#### 1.2 Document Upload Flow

**Current Implementation (Manual)**:

```typescript
// Documents stored as raw storage IDs
await ctx.db.patch(journeyId, {
  documents: [...currentDocs, { storageId, label, type }],
});
// ❌ No access control
// ❌ Anyone with URL can access
// ❌ No expiration management
```

**Enhanced Implementation (with files-control)**:

```typescript
// convex/brokers/documents.ts
import { FilesControl } from "@gilhrpenner/convex-files-control";
import { components } from "./_generated/api";

const files = new FilesControl(components.convexFilesControl);

/**
 * Step 1: Generate secure upload URL
 * Returns presigned URL and upload token
 */
export const generateBrokerDocumentUploadUrl = mutation({
  args: {
    documentType: v.string(),
    documentLabel: v.string(),
  },
  returns: v.object({
    uploadUrl: v.string(),
    uploadToken: v.string(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await getUser(ctx, identity);

    // Generate presigned URL
    const { uploadUrl, uploadToken } = await files.generateUploadUrl(ctx, {
      provider: "convex",
    });

    return { uploadUrl, uploadToken };
  },
});

/**
 * Step 2: Finalize upload with access control
 * Called after client uploads file
 */
export const finalizeBrokerDocument = mutation({
  args: {
    uploadToken: v.string(),
    storageId: v.id("_storage"),
    documentType: v.string(),
    documentLabel: v.string(),
    journeyId: v.id("onboarding_journeys"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const user = await getUser(ctx, identity);

    // Get journey to verify ownership
    const journey = await ctx.db.get(args.journeyId);
    if (!journey || journey.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    // Finalize with access keys:
    // - Broker can access their own documents
    // - Admin role can access all documents
    await files.finalizeUpload(ctx, {
      uploadToken: args.uploadToken,
      storageId: args.storageId,
      accessKeys: [user._id, "admin"],
      expiresAt: null, // Permanent until deleted
    });

    // Store metadata in journey context
    await ctx.db.patch(args.journeyId, {
      "context.broker.documents": [
        ...(journey.context?.broker?.documents || []),
        {
          storageId: args.storageId,
          label: args.documentLabel,
          type: args.documentType,
          uploadedAt: new Date().toISOString(),
        },
      ],
    });

    return { success: true };
  },
});

/**
 * Admin downloads document with secure grant
 * Creates one-time expiring download URL
 */
export const getAdminDocumentDownloadUrl = mutation({
  args: {
    storageId: v.id("_storage"),
    journeyId: v.id("onboarding_journeys"),
  },
  returns: v.object({
    downloadUrl: v.string(),
    expiresAt: v.number(),
  }),
  handler: async (ctx, args) => {
    // Verify admin role
    const identity = await ctx.auth.getUserIdentity();
    const user = await getUser(ctx, identity);
    if (!user.roles?.includes("admin")) {
      throw new Error("Admin access required");
    }

    // Create secure download grant
    const grant = await files.createDownloadGrant(ctx, {
      storageId: args.storageId,
      maxUses: 1, // Single use
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    const downloadUrl = buildDownloadUrl({
      baseUrl: process.env.CONVEX_SITE_URL,
      downloadToken: grant.downloadToken,
    });

    // Log audit event
    await ctx.runMutation(internal.auditEvents.emit, {
      type: "document_downloaded",
      payload: {
        storageId: args.storageId,
        journeyId: args.journeyId,
        downloadedBy: user._id,
        grantToken: grant.downloadToken,
      },
    });

    return {
      downloadUrl,
      expiresAt: grant.expiresAt,
    };
  },
});
```

#### 1.3 Client-Side Integration

**React Component** (`components/broker/SecureDocumentUpload.tsx`):

```typescript
"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function SecureDocumentUpload({
  journeyId,
  documentType,
  onUploadComplete,
}: {
  journeyId: string;
  documentType: string;
  onUploadComplete: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const generateUrl = useMutation(api.brokers.documents.generateBrokerDocumentUploadUrl);
  const finalize = useMutation(api.brokers.documents.finalizeBrokerDocument);

  const handleFileSelect = async (file: File) => {
    setUploading(true);
    try {
      // Step 1: Get presigned URL
      const { uploadUrl, uploadToken } = await generateUrl({
        documentType,
        documentLabel: file.name,
      });

      // Step 2: Upload file directly to storage
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload failed");
      }

      const { storageId } = await uploadResponse.json();

      // Step 3: Finalize with access control
      await finalize({
        uploadToken,
        storageId,
        documentType,
        documentLabel: file.name,
        journeyId,
      });

      onUploadComplete();
    } catch (error) {
      console.error("Upload error:", error);
      // Handle error
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        disabled={uploading}
      />
      {uploading && <span>Uploading...</span>}
    </div>
  );
}
```

#### 1.4 Benefits vs Current Implementation

| Feature           | Current            | With files-control           |
| ----------------- | ------------------ | ---------------------------- |
| Access Control    | ❌ None (URL only) | ✅ Access key-based          |
| Expiration        | ❌ Manual          | ✅ Built-in                  |
| Cleanup           | ❌ Manual          | ✅ Automatic cron            |
| Download Tracking | ❌ None            | ✅ Grant-based audit         |
| Secure Sharing    | ❌ None            | ✅ Password-protected grants |
| Multi-provider    | ❌ Convex only     | ✅ Convex + R2               |

---

### 2. Workflow Component

#### 2.1 Installation & Configuration

```bash
npx convex component install @convex-dev/workflow
```

#### 2.2 Broker Approval Workflow

**Current Implementation (Manual)**:

```typescript
// Synchronous, stateless, no retry on failure
export const submitBrokerJourney = mutation({
  handler: async (ctx, args) => {
    await ctx.db.patch(args.journeyId, { status: "awaiting_admin" });
    // Send notification... but what if it fails?
    // No automatic retry, no reminder logic
  },
});
```

**Enhanced Implementation (with workflow)**:

```typescript
// convex/brokers/workflows.ts
import { WorkflowManager } from "@convex-dev/workflow";
import { components } from "./_generated/api";

const workflow = new WorkflowManager(components.workflow);

/**
 * Broker Approval Workflow
 * Durable multi-step approval process with automatic retries
 */
export const brokerApprovalWorkflow = workflow.define({
  args: {
    journeyId: v.id("onboarding_journeys"),
    brokerEmail: v.string(),
    brokerName: v.string(),
  },
  returns: v.object({ approved: v.boolean() }),
  handler: async (ctx, args): Promise<{ approved: boolean }> => {
    // Step 1: Send notification to admin
    await ctx.runMutation(internal.brokers.workflows.notifyAdminOfSubmission, {
      journeyId: args.journeyId,
      brokerName: args.brokerName,
    });

    // Step 2: Wait for admin decision (or timeout after 7 days)
    const decision = await ctx.awaitEvent({
      name: "broker_approval_decision",
      validator: v.object({
        approved: v.boolean(),
        notes: v.optional(v.string()),
        subdomain: v.optional(v.string()),
        commissionRate: v.optional(v.number()),
        adjustmentRate: v.optional(v.number()),
      }),
      timeout: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    if (decision.approved) {
      // Step 3a: Provision broker resources
      await ctx.runMutation(internal.brokers.workflows.provisionBroker, {
        journeyId: args.journeyId,
        subdomain: decision.subdomain!,
        commissionRate: decision.commissionRate!,
        adjustmentRate: decision.adjustmentRate!,
      });

      // Step 4a: Send welcome email
      await ctx.runAction(internal.brokers.workflows.sendWelcomeEmail, {
        email: args.brokerEmail,
        brokerName: args.brokerName,
        subdomain: decision.subdomain!,
      });

      // Step 5a: Schedule reminder sequence
      await ctx.runWorkflow(brokerReminderWorkflow, {
        brokerId: args.journeyId,
        email: args.brokerEmail,
      });

      return { approved: true };
    } else {
      // Step 3b: Handle rejection
      await ctx.runMutation(internal.brokers.workflows.rejectBroker, {
        journeyId: args.journeyId,
        notes: decision.notes,
      });

      // Step 4b: Send rejection email
      await ctx.runAction(internal.brokers.workflows.sendRejectionEmail, {
        email: args.brokerEmail,
        brokerName: args.brokerName,
        notes: decision.notes,
      });

      return { approved: false };
    }
  },
});

/**
 * Broker Reminder Workflow
 * Automated reminder sequence for incomplete onboarding
 */
export const brokerReminderWorkflow = workflow.define({
  args: {
    brokerId: v.id("brokers"),
    email: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    // Day 3: First reminder
    await ctx.runAction(
      internal.brokers.workflows.sendReminderEmail,
      {
        email: args.email,
        type: "onboarding_progress",
        message: "Complete your broker profile to start inviting clients.",
      },
      { runAfter: 3 * 24 * 60 * 60 * 1000 },
    );

    // Day 7: Second reminder
    await ctx.runAction(
      internal.brokers.workflows.sendReminderEmail,
      {
        email: args.email,
        type: "onboarding_urgent",
        message: "Your broker profile is still incomplete. Finish setup today!",
      },
      { runAfter: 7 * 24 * 60 * 60 * 1000 },
    );

    // Day 14: Final reminder
    await ctx.runAction(
      internal.brokers.workflows.sendReminderEmail,
      {
        email: args.email,
        type: "onboarding_final",
        message: "Last chance to complete your broker profile.",
      },
      { runAfter: 14 * 24 * 60 * 60 * 1000 },
    );
  },
});

/**
 * Client Approval Workflow
 * Handles client onboarding approval with broker review
 */
export const clientApprovalWorkflow = workflow.define({
  args: {
    clientBrokerId: v.id("broker_clients"),
    clientEmail: v.string(),
    brokerEmail: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    // Step 1: Notify broker of client submission
    await ctx.runAction(
      internal.brokers.workflows.sendClientSubmittedNotification,
      {
        brokerEmail: args.brokerEmail,
        clientEmail: args.clientEmail,
      },
    );

    // Step 2: Wait for broker approval
    const decision = await ctx.awaitEvent({
      name: "client_approval_decision",
      validator: v.object({
        approved: v.boolean(),
        notes: v.optional(v.string()),
      }),
      timeout: 5 * 24 * 60 * 60 * 1000, // 5 days
    });

    if (decision.approved) {
      // Step 3a: Approve client
      await ctx.runMutation(internal.brokers.workflows.approveClient, {
        clientBrokerId: args.clientBrokerId,
      });

      // Step 4a: Notify client
      await ctx.runAction(
        internal.brokers.workflows.sendClientApprovedNotification,
        {
          clientEmail: args.clientEmail,
        },
      );
    } else {
      // Step 3b: Reject client
      await ctx.runMutation(internal.brokers.workflows.rejectClient, {
        clientBrokerId: args.clientBrokerId,
        notes: decision.notes,
      });

      // Step 4b: Notify client of rejection
      await ctx.runAction(
        internal.brokers.workflows.sendClientRejectedNotification,
        {
          clientEmail: args.clientEmail,
          notes: decision.notes,
        },
      );
    }
  },
});

/**
 * Document Request Workflow
 * Admin requests additional documents from broker
 */
export const documentRequestWorkflow = workflow.define({
  args: {
    journeyId: v.id("onboarding_journeys"),
    brokerEmail: v.string(),
    requestType: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    // Step 1: Create request in timeline
    const requestId = await ctx.runMutation(
      internal.brokers.workflows.createDocumentRequest,
      {
        journeyId: args.journeyId,
        type: args.requestType,
        message: args.message,
      },
    );

    // Step 2: Send notification
    await ctx.runAction(
      internal.brokers.workflows.sendDocumentRequestNotification,
      {
        email: args.brokerEmail,
        type: args.requestType,
        message: args.message,
      },
    );

    // Step 3: Wait for broker response (or timeout)
    const response = await ctx.awaitEvent({
      name: "document_request_response",
      validator: v.object({
        requestId: v.string(),
        documents: v.array(v.id("_storage")),
        message: v.optional(v.string()),
      }),
      timeout: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Step 4: Process response
    if (response.requestId === requestId) {
      await ctx.runMutation(internal.brokers.workflows.resolveDocumentRequest, {
        requestId,
        documents: response.documents,
        message: response.message,
      });

      // Step 5: Notify admin
      await ctx.runAction(
        internal.brokers.workflows.sendDocumentReceivedNotification,
        {
          journeyId: args.journeyId,
          requestId,
        },
      );
    }
  },
});
```

#### 2.3 Workflow Event Handlers

```typescript
// convex/brokers/workflow-handlers.ts

/**
 * Triggered when admin approves broker
 * Emits workflow event to resume workflow
 */
export const approveBrokerOnboarding = mutation({
  args: {
    journeyId: v.id("onboarding_journeys"),
    subdomain: v.string(),
    commissionRate: v.number(),
    adjustmentRate: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // ... validation logic ...

    // Emit event to resume workflow
    await ctx.runMutation(internal.workflow.emit, {
      name: "broker_approval_decision",
      payload: {
        approved: true,
        notes: args.notes,
        subdomain: args.subdomain,
        commissionRate: args.commissionRate,
        adjustmentRate: args.adjustmentRate,
      },
    });

    return { success: true };
  },
});

/**
 * Triggered when broker responds to document request
 */
export const respondToDocumentRequest = mutation({
  args: {
    requestId: v.string(),
    documents: v.array(v.id("_storage")),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // ... validation logic ...

    // Emit event to resume workflow
    await ctx.runMutation(internal.workflow.emit, {
      name: "document_request_response",
      payload: {
        requestId: args.requestId,
        documents: args.documents,
        message: args.message,
      },
    });

    return { success: true };
  },
});
```

#### 2.4 Workflow Status Queries

```typescript
// convex/brokers/workflow-queries.ts

/**
 * Get status of broker approval workflow
 */
export const getBrokerApprovalStatus = query({
  args: {
    journeyId: v.id("onboarding_journeys"),
  },
  returns: v.object({
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    currentStep: v.optional(v.string()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    const journey = await ctx.db.get(args.journeyId);
    if (!journey) throw new Error("Journey not found");

    // Query workflow status
    const workflowStatus = await ctx.runQuery(internal.workflow.getStatus, {
      workflowId: journey.workflowId, // Store workflow ID in journey
    });

    return {
      status: workflowStatus.status,
      currentStep: workflowStatus.currentStep,
      startedAt: workflowStatus.startedAt,
      completedAt: workflowStatus.completedAt,
    };
  },
});
```

#### 2.5 Benefits vs Current Implementation

| Feature            | Current                  | With workflow               |
| ------------------ | ------------------------ | --------------------------- |
| Retries            | ❌ Manual                | ✅ Automatic with backoff   |
| Delays             | ❌ External scheduler    | ✅ Built-in scheduling      |
| Human-in-loop      | ❌ Polling               | ✅ Event-based              |
| Failure Recovery   | ❌ Manual                | ✅ Automatic                |
| Observability      | ❌ Custom                | ✅ Built-in status queries  |
| Parallel Execution | ❌ Complex               | ✅ Promise.all              |
| Durability         | ❌ State lost on restart | ✅ Survives server restarts |

---

### 3. Resend Component

#### 3.1 Installation & Configuration

```bash
npx convex component install @convex-dev/resend
```

**Environment Variables**:

```bash
RESEND_API_KEY=re_xxxxxxxx
```

#### 3.2 Email Integration

**Current Implementation (Direct API)**:

```typescript
// ❌ No retry on failure
// ❌ No delivery tracking
await fetch("https://api.resend.com/emails", {
  method: "POST",
  body: JSON.stringify({ to, subject, html }),
});
```

**Enhanced Implementation (with resend component)**:

```typescript
// convex/brokers/emails.ts
import { Resend } from "@convex-dev/resend";
import { components } from "./_generated/api";

const resend = new Resend(components.resend, {
  testMode: process.env.NODE_ENV !== "production",
  onEmailEvent: internal.brokers.emails.handleEmailEvent,
});

/**
 * Send broker approval notification to admin
 * Queued with automatic retry
 */
export const sendAdminApprovalNotification = internalMutation({
  args: {
    adminEmail: v.string(),
    brokerName: v.string(),
    journeyId: v.id("onboarding_journeys"),
  },
  handler: async (ctx, args) => {
    await resend.sendEmail(ctx, {
      from: "Fairlend <notifications@fairlend.ca>",
      to: args.adminEmail,
      subject: `New broker application: ${args.brokerName}`,
      html: `
        <h1>New Broker Application</h1>
        <p>A new broker application requires your review.</p>
        <p><strong>Broker:</strong> ${args.brokerName}</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin/brokers/applications/${args.journeyId}">
          Review Application
        </a>
      `,
      metadata: {
        journeyId: args.journeyId,
        type: "broker_approval_notification",
      },
    });
  },
});

/**
 * Send welcome email to approved broker
 */
export const sendBrokerWelcomeEmail = internalAction({
  args: {
    email: v.string(),
    brokerName: v.string(),
    subdomain: v.string(),
  },
  handler: async (ctx, args) => {
    await resend.sendEmail(ctx, {
      from: "Fairlend <welcome@fairlend.ca>",
      to: args.email,
      subject: "Welcome to Fairlend!",
      html: `
        <h1>Welcome, ${args.brokerName}!</h1>
        <p>Your broker application has been approved.</p>
        <p>Your portal is ready at: <a href="https://${args.subdomain}.flpilot.com">
          ${args.subdomain}.flpilot.com
        </a></p>
      `,
    });
  },
});

/**
 * Handle email delivery events
 */
export const handleEmailEvent = internalMutation({
  args: vOnEmailEventArgs,
  handler: async (ctx, args) => {
    const event = args.event;

    switch (event.type) {
      case "email.delivered":
        // Log successful delivery
        await ctx.runMutation(internal.auditEvents.emit, {
          type: "email_delivered",
          payload: {
            emailId: event.emailId,
            to: event.to,
            metadata: event.metadata,
          },
        });
        break;

      case "email.bounced":
        // Alert admin about bounce
        await ctx.runMutation(internal.brokers.emails.handleBounce, {
          email: event.to,
          bounceType: event.bounceType,
        });
        break;

      case "email.complained":
        // Handle spam complaint
        await ctx.runMutation(internal.brokers.emails.handleComplaint, {
          email: event.to,
        });
        break;
    }
  },
});
```

#### 3.3 Benefits vs Direct API Calls

| Feature          | Direct API | With resend component     |
| ---------------- | ---------- | ------------------------- |
| Retry            | ❌ Manual  | ✅ Automatic with backoff |
| Batching         | ❌ None    | ✅ Automatic              |
| Tracking         | ❌ Custom  | ✅ Webhook handling       |
| Rate Limiting    | ❌ Manual  | ✅ Automatic              |
| Bounce Handling  | ❌ Manual  | ✅ Built-in               |
| Queue Visibility | ❌ None    | ✅ Queue status queries   |

---

### 4. Rate-Limiter Component

#### 4.1 Installation & Configuration

```bash
npx convex component install @convex-dev/rate-limiter
```

#### 4.2 Rate Limiting Implementation

```typescript
// convex/brokers/rate-limits.ts
import { RateLimiter, MINUTE, HOUR } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";

const rateLimiter = new RateLimiter(components.rateLimiter, {
  // Subdomain availability checks
  subdomainCheck: {
    kind: "fixed window",
    rate: 5,
    period: MINUTE,
  },
  // Document uploads per broker
  documentUpload: {
    kind: "token bucket",
    rate: 10,
    period: MINUTE,
    capacity: 20,
  },
  // Filter validation requests
  filterValidation: {
    kind: "fixed window",
    rate: 20,
    period: MINUTE,
  },
  // Client invites per broker
  clientInvite: {
    kind: "fixed window",
    rate: 10,
    period: HOUR,
  },
});

/**
 * Check subdomain availability with rate limiting
 * Prevents enumeration attacks
 */
export const checkSubdomainAvailability = mutation({
  args: {
    subdomain: v.string(),
  },
  returns: v.object({
    available: v.boolean(),
    rateLimited: v.boolean(),
  }),
  handler: async (ctx, args) => {
    // Check rate limit by IP
    const identity = await ctx.auth.getUserIdentity();
    const clientIdentifier = identity?.tokenIdentifier || ctx.ip;

    try {
      await rateLimiter.limit(ctx, "subdomainCheck", {
        key: clientIdentifier,
        throws: true,
      });

      // Proceed with availability check
      const existing = await ctx.db
        .query("brokers")
        .withIndex("by_subdomain", (q) =>
          q.eq("subdomain", args.subdomain.toLowerCase()),
        )
        .first();

      return { available: !existing, rateLimited: false };
    } catch (e) {
      if (e.message.includes("Rate limit exceeded")) {
        return { available: false, rateLimited: true };
      }
      throw e;
    }
  },
});

/**
 * Document upload with rate limiting
 */
export const generateDocumentUploadUrl = mutation({
  args: {
    documentType: v.string(),
  },
  returns: v.object({
    uploadUrl: v.string(),
    uploadToken: v.string(),
    rateLimited: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const user = await getUser(ctx, identity);

    // Check rate limit per user
    const limitResult = await rateLimiter.limit(ctx, "documentUpload", {
      key: user._id,
      throws: false,
    });

    if (!limitResult.ok) {
      return {
        uploadUrl: "",
        uploadToken: "",
        rateLimited: true,
      };
    }

    // Proceed with upload URL generation
    const { uploadUrl, uploadToken } = await files.generateUploadUrl(ctx, {
      provider: "convex",
    });

    return { uploadUrl, uploadToken, rateLimited: false };
  },
});
```

#### 4.3 Benefits

| Threat                | Without Rate Limiter | With Rate Limiter      |
| --------------------- | -------------------- | ---------------------- |
| Subdomain Enumeration | ❌ Unlimited checks  | ✅ 5/min per IP        |
| Upload Flooding       | ❌ Unlimited uploads | ✅ 10/min per user     |
| API Abuse             | ❌ No protection     | ✅ Configurable limits |
| Brute Force           | ❌ Vulnerable        | ✅ Protected           |

---

## Modified Implementation Phases

### Phase 1: Foundation (Components Setup) - 2 hours

**Priority: CRITICAL**

1. **Install all components** (COMPLETE)

   ```bash
   npx convex component install @gilhrpenner/convex-files-control
   npx convex component install @convex-dev/workflow
   npx convex component install @convex-dev/resend
   npx convex component install @convex-dev/rate-limiter
   npx convex component install @convex-dev/crons
   ```

2. **Configure components** (RESEND_API_KEY is set in the environment variables)
   - Set up environment variables (RESEND_API_KEY)
   - Configure component paths in `convex.config.js`
   - Set up webhook endpoints for resend

3. **Create component initialization file**
   - `convex/components.ts` - Central component configuration

### Phase 2: Document Security (files-control) - 4 hours

**Priority: HIGH**

4. **Create document management module**
   - `convex/brokers/documents.ts`
   - `components/broker/SecureDocumentUpload.tsx`
   - `components/admin/SecureDocumentDownload.tsx`

5. **Migrate existing document storage**
   - Update `saveBrokerDocuments` mutation
   - Update admin review download logic
   - Add access control to existing documents

6. **Update frontend components**
   - Replace file inputs with SecureDocumentUpload
   - Add download grant UI for admins

### Phase 3: Workflow Automation (workflow) - 5 hours

**Priority: HIGH**

7. **Create workflow definitions**
   - `convex/brokers/workflows.ts`
   - Broker approval workflow
   - Client approval workflow
   - Reminder workflows
   - Document request workflow

8. **Create workflow event handlers**
   - `convex/brokers/workflow-handlers.ts`
   - Approval mutations that emit events
   - Response mutations that emit events

9. **Integrate with existing mutations**
   - Update `submitBrokerJourney` to start workflow
   - Update `approveBrokerOnboarding` to emit event
   - Update `rejectBrokerOnboarding` to emit event

10. **Add workflow status queries**
    - `getBrokerApprovalStatus`
    - `getClientApprovalStatus`

11. **Create workflow status UI**
    - `components/workflow/WorkflowStatus.tsx`
    - Display current workflow step
    - Show pending actions

### Phase 4: Reliable Notifications (resend) - 3 hours

**Priority: HIGH**

12. **Set up resend integration**
    - Configure webhook endpoint
    - Create email templates

13. **Create email module**
    - `convex/brokers/emails.ts`
    - All email sending functions
    - Email event handlers

14. **Migrate existing email calls**
    - Replace direct fetch() calls
    - Add email metadata for tracking
    - Set up bounce/complaint handling

### Phase 5: API Protection (rate-limiter) - 2 hours

**Priority: MEDIUM**

15. **Create rate limiting module**
    - `convex/brokers/rate-limits.ts`
    - Configure limits for each endpoint

16. **Add rate limiting to endpoints**
    - Subdomain check
    - Document upload
    - Filter validation
    - Client invite

17. **Create rate limit UI feedback**
    - Show "Too many requests" messages
    - Display retry-after timestamps

### Phase 6: Remaining Backend Tasks - 5 hours

**Priority: MEDIUM-HIGH**

18. **Schema fixes**
    - Add jurisdiction to companyInfo
    - Verify broker_rate_history table

19. **FAIRLEND provisioning**
    - Create `convex/brokers/fairlend-provisioning.ts`
    - Add migration script

20. **Client assignment audit**
    - Create audit trail system
    - Add `client-assignment-audit.ts`

21. **Filter validation queries**
    - `adminOverrideFilterConstraints`
    - `getBrokerFilterConstraintsForClient`
    - `getClientFilterValues`

22. **Rate history queries**
    - `getBrokerAdjustmentRateHistory`
    - `getRateInEffectAtDate`

### Phase 7: Frontend Components - 5 hours

**Priority: MEDIUM**

23. **Filter management**
    - `EditFilterConstraints.tsx`
    - `EditFilterValues.tsx`

24. **Rate history**
    - `RateHistory.tsx`
    - `BrokerRateChangeDialog.tsx`

25. **Client assignment**
    - `SwitchBrokerDialog.tsx`
    - `RevokeClientDialog.tsx`
    - `ClientAssignmentWarning.tsx`

### Phase 8: Infrastructure - 2 hours

**Priority: MEDIUM**

26. **Proxy middleware**
    - Add broker assignment verification
    - Create error page

### Phase 9: Testing - 4 hours

**Priority: LOW (incremental)**

27. **Component integration tests**
    - files-control tests
    - workflow execution tests
    - resend delivery tests

28. **Feature tests**
    - Filter constraint validation
    - Rate history recording
    - Client assignment audit trail

---

## Task Integration Mapping

### Tasks Replaced by Components

| Original Task           | Component Replacement | Benefit                      |
| ----------------------- | --------------------- | ---------------------------- |
| Manual document storage | files-control         | Access control, audit trails |
| Manual approval logic   | workflow              | Durable, automatic retries   |
| Direct email API calls  | resend                | Reliable delivery, tracking  |
| Manual rate limiting    | rate-limiter          | Configurable, sharded        |
| Static cron jobs        | crons                 | Dynamic scheduling           |

### New Component-Specific Tasks

1. **Component Installation** - Install all 5 components
2. **Component Configuration** - Environment variables, webhooks
3. **files-control Integration** - Document upload/download flow
4. **workflow Integration** - Approval workflows, reminders
5. **resend Integration** - Email queue, event handling
6. **rate-limiter Integration** - API protection
7. **crons Integration** - Dynamic reminders

---

## Migration Path

### Backward Compatibility

1. **Documents**: Gradual migration
   - Phase 1: New uploads use files-control
   - Phase 2: Background job migrates existing documents
   - Phase 3: Remove old storage helpers

2. **Workflows**: Can run in parallel
   - Existing synchronous logic stays functional
   - Workflows add durability layer on top

3. **Emails**: Transparent upgrade
   - Replace fetch() calls with resend.sendEmail()
   - No breaking changes to email templates

### Rollback Strategy

Each component can be disabled independently:

- **files-control**: Fall back to direct storage IDs
- **workflow**: Use existing synchronous mutations
- **resend**: Use direct API calls
- **rate-limiter**: Remove limit checks
- **crons**: Use static cron definitions

---

## Summary

### Component Adoption Benefits

| Metric            | Manual Implementation | With Components  | Improvement |
| ----------------- | --------------------- | ---------------- | ----------- |
| Code Lines        | ~3,500                | ~2,100           | -40%        |
| Features          | Basic                 | Enterprise-grade | ++++        |
| Maintainability   | Medium                | High             | +++         |
| Reliability       | Manual                | Automatic        | ++++        |
| Security          | Basic                 | Advanced         | +++         |
| Time to Implement | ~14 hours             | ~20 hours        | +6 hours    |

### Recommendation

**Adopt all components** (Option A). The +6 hours upfront investment pays dividends in:

- Reduced maintenance burden
- Enterprise-grade features
- Community-tested reliability
- Future-proof architecture

---

## Next Steps

1. **Review this spec** with stakeholders
2. **Approve component adoption** strategy
3. **Begin Phase 1** (Component Installation)
4. **Execute phases** in order
5. **Test thoroughly** after each phase
6. **Deploy incrementally** with feature flags

**Ready to begin implementation!** 🚀
