import { v } from "convex/values";
import { components } from "../_generated/api";
import {
	type AuthorizedActionCtx,
	type AuthorizedMutationCtx,
	type AuthorizedQueryCtx,
	createAuthorizedAction,
	createAuthorizedMutation,
	createAuthorizedQuery,
} from "../lib/server";

// ============================================================================
// BROKER APPROVAL WORKFLOWS WITH WORKFLOW COMPONENT
// ============================================================================

// ============================================================================
// WORKFLOW DEFINITIONS
// ============================================================================

/**
 * Start broker approval workflow
 * Initiates a durable workflow that waits for admin decision
 */
export const startBrokerApprovalWorkflow = createAuthorizedMutation(["any"])({
	args: {
		journeyId: v.id("onboarding_journeys"),
	},
	returns: v.object({
		workflowId: v.string(),
	}),
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const journey = await ctx.db.get(args.journeyId);
		if (!journey || journey.persona !== "broker") {
			throw new Error("Invalid broker journey");
		}

		// Create workflow via workflow component
		const workflowId = await ctx.runMutation(
			components.workflow.workflow.create,
			{
				workflowName: "brokerApproval",
				workflowHandle: "brokerApproval",
				workflowArgs: {
					journeyId: args.journeyId,
					userId: journey.userId,
					startedAt: Date.now(),
				},
				startAsync: true,
			}
		);

		return { workflowId };
	},
});

/**
 * Emit broker approval decision event
 * Used by admin to approve or reject a broker
 */
export const emitBrokerApprovalDecision = createAuthorizedMutation(["admin"])({
	args: {
		workflowId: v.string(),
		approved: v.boolean(),
		reason: v.optional(v.string()),
		subdomain: v.optional(v.string()),
		commissionRate: v.optional(v.number()),
		returnAdjustmentPercentage: v.optional(v.number()),
	},
	returns: v.object({
		success: v.boolean(),
	}),
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const subjectId = ctx.subject;
		if (!subjectId) {
			throw new Error("Authentication required");
		}

		// Send event to workflow
		await ctx.runMutation(components.workflow.event.send, {
			workflowId: args.workflowId,
			name: "broker_approval_decision",
			result: {
				kind: "success",
				returnValue: {
					approved: args.approved,
					reason: args.reason,
					subdomain: args.subdomain,
					commissionRate: args.commissionRate,
					returnAdjustmentPercentage: args.returnAdjustmentPercentage,
					decidedAt: Date.now(),
					decidedBy: subjectId,
				},
			},
		});

		return { success: true };
	},
});

/**
 * Get workflow status
 * Query the current state of a broker approval workflow
 */
export const getWorkflowStatus = createAuthorizedAction(["any"])({
	args: {
		workflowId: v.string(),
	},
	returns: v.object({
		workflowId: v.string(),
		status: v.string(),
		inProgress: v.array(v.any()),
		startTime: v.optional(v.number()),
	}),
	handler: async (ctx: AuthorizedActionCtx, args) => {
		const status = await ctx.runQuery(components.workflow.workflow.getStatus, {
			workflowId: args.workflowId,
		});

		return {
			workflowId: args.workflowId,
			status: status.workflow.runResult?.kind ?? "running",
			inProgress: status.inProgress,
			startTime: status.workflow.startedAt,
		};
	},
});

// ============================================================================
// CLIENT APPROVAL WORKFLOW
// ============================================================================

/**
 * Start client approval workflow
 * Initiates workflow for client onboarding approval by broker
 */
export const startClientApprovalWorkflow = createAuthorizedMutation(["any"])({
	args: {
		clientId: v.id("broker_clients"),
		brokerId: v.id("brokers"),
	},
	returns: v.object({
		workflowId: v.string(),
	}),
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const client = await ctx.db.get(args.clientId);
		if (!client) {
			throw new Error("Client not found");
		}

		// Create workflow for client approval
		const workflowId = await ctx.runMutation(
			components.workflow.workflow.create,
			{
				workflowName: "clientApproval",
				workflowHandle: "clientApproval",
				workflowArgs: {
					clientId: args.clientId,
					brokerId: args.brokerId,
					userId: client.clientId,
					startedAt: Date.now(),
				},
				startAsync: true,
			}
		);

		return { workflowId };
	},
});

/**
 * Emit client approval decision
 * Broker approves or rejects a client
 */
export const emitClientApprovalDecision = createAuthorizedMutation(["any"])({
	args: {
		workflowId: v.string(),
		approved: v.boolean(),
		reason: v.optional(v.string()),
	},
	returns: v.object({
		success: v.boolean(),
	}),
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const subjectId = ctx.subject;
		if (!subjectId) {
			throw new Error("Authentication required");
		}

		await ctx.runMutation(components.workflow.event.send, {
			workflowId: args.workflowId,
			name: "client_approval_decision",
			result: {
				kind: "success",
				returnValue: {
					approved: args.approved,
					reason: args.reason,
					decidedAt: Date.now(),
					decidedBy: subjectId,
				},
			},
		});

		return { success: true };
	},
});

// ============================================================================
// DOCUMENT REQUEST WORKFLOW
// ============================================================================

/**
 * Start document request workflow
 * Admin requests additional documents from broker
 */
export const startDocumentRequestWorkflow = createAuthorizedMutation(["admin"])(
	{
		args: {
			journeyId: v.id("onboarding_journeys"),
			message: v.string(),
			documentTypes: v.array(v.string()),
		},
		returns: v.object({
			workflowId: v.string(),
			requestId: v.string(),
		}),
		handler: async (ctx: AuthorizedMutationCtx, args) => {
			const subjectId = ctx.subject;
			if (!subjectId) {
				throw new Error("Authentication required");
			}

			const journey = await ctx.db.get(args.journeyId);
			if (!journey || journey.persona !== "broker") {
				throw new Error("Invalid broker journey");
			}

			const requestId = crypto.randomUUID();

			// Create workflow for document request
			const workflowId = await ctx.runMutation(
				components.workflow.workflow.create,
				{
					workflowName: "documentRequest",
					workflowHandle: "documentRequest",
					workflowArgs: {
						journeyId: args.journeyId,
						requestId,
						message: args.message,
						documentTypes: args.documentTypes,
						requestedAt: Date.now(),
						requestedBy: subjectId,
					},
					startAsync: true,
				}
			);

			return { workflowId, requestId };
		},
	}
);

/**
 * Emit document request response
 * Broker responds to document request
 */
export const emitDocumentRequestResponse = createAuthorizedMutation(["any"])({
	args: {
		workflowId: v.string(),
		documentIds: v.array(v.id("_storage")),
		notes: v.optional(v.string()),
	},
	returns: v.object({
		success: v.boolean(),
	}),
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		const subjectId = ctx.subject;
		if (!subjectId) {
			throw new Error("Authentication required");
		}

		await ctx.runMutation(components.workflow.event.send, {
			workflowId: args.workflowId,
			name: "document_request_response",
			result: {
				kind: "success",
				returnValue: {
					documentIds: args.documentIds,
					notes: args.notes,
					respondedAt: Date.now(),
					respondedBy: subjectId,
				},
			},
		});

		return { success: true };
	},
});

// ============================================================================
// WORKFLOW MANAGEMENT
// ============================================================================

/**
 * Cancel workflow
 * Admin can cancel a running workflow
 */
export const cancelWorkflow = createAuthorizedMutation(["admin"])({
	args: {
		workflowId: v.string(),
	},
	returns: v.object({
		success: v.boolean(),
	}),
	handler: async (ctx: AuthorizedMutationCtx, args) => {
		await ctx.runMutation(components.workflow.workflow.cancel, {
			workflowId: args.workflowId,
		});

		return { success: true };
	},
});

/**
 * List workflows for a journey
 */
export const listJourneyWorkflows = createAuthorizedQuery(["any"])({
	args: {
		journeyId: v.id("onboarding_journeys"),
	},
	returns: v.array(
		v.object({
			workflowId: v.string(),
			name: v.string(),
			status: v.string(),
			startedAt: v.number(),
		})
	),
	handler: async (ctx: AuthorizedQueryCtx, args) => {
		const journey = await ctx.db.get(args.journeyId);
		if (!journey) {
			return [];
		}

		// Query workflows by name pattern
		const workflows = await ctx.runQuery(
			components.workflow.workflow.listByName,
			{
				name: "brokerApproval",
				order: "desc",
				paginationOpts: {
					numItems: 10,
					cursor: null,
				},
			}
		);

		return workflows.page.map(
			(w: {
				workflowId: string;
				name?: string;
				runResult?: { kind: string } | null;
			}) => ({
				workflowId: w.workflowId,
				name: w.name ?? "unknown",
				status: w.runResult?.kind ?? "running",
				startedAt: Date.now(),
			})
		);
	},
});
