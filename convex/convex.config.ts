/**
 * Convex configuration with component integrations
 *
 * Components enabled:
 * - files-control: Secure document uploads with access control
 * - workflow: Durable multi-step approval workflows
 * - resend: Reliable email delivery with tracking
 * - rate-limiter: API protection and throttling
 * - crons: Dynamic reminder scheduling
 */

import crons from "@convex-dev/crons/convex.config";
import rateLimiter from "@convex-dev/rate-limiter/convex.config";
import resend from "@convex-dev/resend/convex.config";
import workflow from "@convex-dev/workflow/convex.config";
import workOSAuthKit from "@convex-dev/workos-authkit/convex.config";
import filesControl from "@gilhrpenner/convex-files-control/convex.config";
import { defineApp } from "convex/server";

const app = defineApp();

// Secure document management
app.use(filesControl, { name: "filesControl" });
app.use(workOSAuthKit, { name: "authKit" });

// Durable workflows for approvals
app.use(workflow, { name: "workflow" });

// Reliable email delivery
app.use(resend, { name: "resend" });

// API rate limiting
app.use(rateLimiter, { name: "rateLimiter" });

// Dynamic cron scheduling
app.use(crons, { name: "crons" });

export default app;
