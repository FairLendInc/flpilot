import { v } from "convex/values";
import { createAuthorizedMutation, createAuthorizedQuery } from "../lib/server";

/**
 * Broker-Client Communication Functions
 *
 * This file contains Convex queries and mutations for managing
 * broker-client communication, including requests, responses,
 * and timeline tracking.
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Communication timeline entry type
 */
export type CommunicationTimelineEntry = {
	id: string; // UUID
	type: "info_request" | "document_request" | "clarification" | "announcement";
	sentBy: string; // User ID
	sentAt: string; // ISO timestamp
	message: string;
	documents?: Array<{
		storageId: string;
		label: string;
	}>;
	resolved: boolean;
	resolvedAt?: string; // ISO timestamp
	response?: string;
	respondedBy?: string; // User ID
};

/**
 * Client request type (stored in broker_clients)
 */
export type ClientRequestEntry = {
	id: string; // UUID
	type: "info_request" | "document_request" | "clarification";
	requestedBy: string; // Broker user ID
	requestedAt: string; // ISO timestamp
	message: string;
	documents?: Array<{
		storageId: string;
		label: string;
	}>;
	resolved: boolean;
	resolvedAt?: string; // ISO timestamp
	response?: string;
	responseDocuments?: Array<{
		storageId: string;
		label: string;
	}>;
	respondedBy?: string; // Client user ID
};

// ============================================================================
// Helpers
// ============================================================================

/**
 * Generate UUID for timeline entries
 */
function generateUUID(): string {
	return crypto.randomUUID();
}

/**
 * Validate document labels match document IDs
 */
function validateDocumentLabels(
	documentIds: string[] | undefined,
	documentLabels: string[] | undefined
): boolean {
	if (!(documentIds || documentLabels)) {
		return true;
	}
	if (!(documentIds && documentLabels)) {
		return false;
	}
	return documentIds.length === documentLabels.length;
}

/**
 * Format document attachments from IDs and labels
 */
function formatDocumentAttachments(
	documentIds: string[] | undefined,
	documentLabels: string[] | undefined
): Array<{ storageId: string; label: string }> | undefined {
	if (!(documentIds && documentLabels) || documentIds.length === 0) {
		return;
	}
	return documentIds.map((id, index) => ({
		storageId: id,
		label: documentLabels[index] || `Document ${index + 1}`,
	}));
}

/**
 * Get broker ID for current user
 */
async function getBrokerIdForUser(
	ctx: any,
	userId: string
): Promise<string | null> {
	const broker = await ctx.db
		.query("brokers")
		.withIndex("by_user", (q: any) => q.eq("userId", userId))
		.first();
	return broker?._id ?? null;
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Query to fetch communication timeline for a client
 */
export const getClientCommunicationTimeline = createAuthorizedQuery([
	"broker_member",
	"broker_admin",
	"any",
])({
	args: {
		clientBrokerId: v.id("broker_clients"),
	},
	handler: async (ctx, args) => {
		const client = await ctx.db.get(args.clientBrokerId);

		if (!client) {
			throw new Error("Client not found");
		}

		// Verify authorization
		const isClient = (ctx as any).subject === client.clientId;
		const isBroker = await getBrokerIdForUser(ctx, (ctx as any).subject);
		const isClientBroker = isBroker === client.brokerId;
		const isAdmin = (ctx as any).role === "admin";

		if (!(isAdmin || isClientBroker || isClient)) {
			throw new Error("Unauthorized to access this client's communications");
		}

		// Fetch all communication timeline entries for this client
		// Note: In a real implementation, you'd have a separate communication_timeline table
		// For now, return an empty array (table structure to be defined)
		return {
			timeline: [] as CommunicationTimelineEntry[],
			client,
		};
	},
});

/**
 * Query to fetch a specific communication entry
 */
export const getCommunicationEntry = createAuthorizedQuery([
	"broker_member",
	"broker_admin",
	"any",
])({
	args: {
		clientBrokerId: v.id("broker_clients"),
		communicationId: v.string(), // UUID of the timeline entry
	},
	handler: async (ctx, args) => {
		const client = await ctx.db.get(args.clientBrokerId);

		if (!client) {
			throw new Error("Client not found");
		}

		// Verify authorization
		const isClient = (ctx as any).subject === client.clientId;
		const isBroker = await getBrokerIdForUser(ctx, (ctx as any).subject);
		const isClientBroker = isBroker === client.brokerId;
		const isAdmin = (ctx as any).role === "admin";

		if (!(isAdmin || isClientBroker || isClient)) {
			throw new Error("Unauthorized to access this client's communications");
		}

		// Fetch specific communication entry
		// Note: In a real implementation, you'd query the communication_timeline table
		return null; // Placeholder
	},
});

/**
 * Query to get count of unresolved requests for a client
 */
export const getClientUnresolvedRequestsCount = createAuthorizedQuery([
	"broker_member",
	"broker_admin",
])({
	args: {
		clientBrokerId: v.id("broker_clients"),
	},
	handler: async (ctx, args) => {
		const client = await ctx.db.get(args.clientBrokerId);

		if (!client) {
			throw new Error("Client not found");
		}

		// Verify authorization
		const isBroker = await getBrokerIdForUser(ctx, (ctx as any).subject);
		const isClientBroker = isBroker === client.brokerId;
		const isAdmin = (ctx as any).role === "admin";

		if (!(isAdmin || isClientBroker)) {
			throw new Error("Unauthorized to access this client's requests");
		}

		// Count unresolved requests from client's request timeline
		// Note: In a real implementation, you'd query the communication_timeline table
		return 0; // Placeholder
	},
});

/**
 * Query to get all unresolved requests across all clients for a broker
 */
export const getBrokerUnresolvedRequestsCount = createAuthorizedQuery([
	"broker_member",
	"broker_admin",
])({
	args: {},
	handler: async (ctx) => {
		const brokerId = await getBrokerIdForUser(ctx, (ctx as any).subject);

		if (!brokerId) {
			throw new Error("Broker not found");
		}

		// Get all clients for this broker
		const clients = await ctx.db
			.query("broker_clients")
			.withIndex("by_broker", (q: any) => q.eq("brokerId", brokerId))
			.collect();

		// Count unresolved requests across all clients
		// Note: In a real implementation, you'd query the communication_timeline table
		return {
			total: 0,
			byClient: clients.map((c) => ({
				clientBrokerId: c._id,
				count: 0,
			})),
		};
	},
});

// ============================================================================
// Mutations
// ============================================================================

/**
 * Mutation for broker to send a request to client
 */
export const sendClientRequest = createAuthorizedMutation(["broker_admin"])({
	args: {
		clientBrokerId: v.id("broker_clients"),
		requestType: v.union(
			v.literal("info_request"),
			v.literal("document_request"),
			v.literal("clarification")
		),
		message: v.string(),
		documentIds: v.optional(v.array(v.id("_storage"))),
		documentLabels: v.optional(v.array(v.string())),
	},
	handler: async (ctx, args) => {
		const client = await ctx.db.get(args.clientBrokerId);

		if (!client) {
			throw new Error("Client not found");
		}

		// Verify broker owns this client
		if (client.brokerId !== (ctx as any).org_id) {
			throw new Error("You can only send requests to your own clients");
		}

		// Validate document labels
		if (!validateDocumentLabels(args.documentIds, args.documentLabels)) {
			throw new Error("Document labels must match document IDs");
		}

		const now = new Date().toISOString();
		const requestId = generateUUID();

		// Format document attachments
		const documents = formatDocumentAttachments(
			args.documentIds as any,
			args.documentLabels
		);

		// Add to client's communication timeline
		// Note: In a real implementation, you'd insert into communication_timeline table
		const _timelineEntry = {
			id: requestId,
			type: args.requestType,
			sentBy: (ctx as any).subject,
			sentAt: now,
			message: args.message,
			documents,
			resolved: false,
		};

		// TODO: Insert into communication_timeline table
		// TODO: Send notification to client
		// TODO: Update client's request timeline if stored in broker_clients

		await ctx.db.patch(args.clientBrokerId, {
			updatedAt: now,
		});

		return {
			success: true,
			requestId,
			sentAt: now,
		};
	},
});

/**
 * Mutation for client to respond to broker's request
 */
export const respondToClientRequest = createAuthorizedMutation([
	"broker_member",
	"broker_admin",
	"any",
])({
	args: {
		clientBrokerId: v.id("broker_clients"),
		requestId: v.string(), // UUID of the request
		response: v.string(),
		documentIds: v.optional(v.array(v.id("_storage"))),
		documentLabels: v.optional(v.array(v.string())),
	},
	handler: async (ctx, args) => {
		const client = await ctx.db.get(args.clientBrokerId);

		if (!client) {
			throw new Error("Client not found");
		}

		// Verify authorization - client can respond to their own requests
		if ((ctx as any).subject !== client.clientId) {
			throw new Error("Unauthorized to respond to this request");
		}

		// Validate document labels
		if (!validateDocumentLabels(args.documentIds, args.documentLabels)) {
			throw new Error("Document labels must match document IDs");
		}

		const now = new Date().toISOString();

		// Format document attachments
		const responseDocuments = formatDocumentAttachments(
			args.documentIds as any,
			args.documentLabels
		);

		// Update timeline entry to mark as resolved
		// Note: In a real implementation, you'd update the communication_timeline table
		const _updatedEntry = {
			resolved: true,
			resolvedAt: now,
			response: args.response,
			documents: responseDocuments,
			respondedBy: (ctx as any).subject,
		};

		// TODO: Update communication_timeline table with requestId
		// TODO: Send notification to broker

		await ctx.db.patch(args.clientBrokerId, {
			updatedAt: now,
		});

		return {
			success: true,
			resolvedAt: now,
		};
	},
});

/**
 * Mutation for client to send a message to broker
 */
export const sendMessageToBroker = createAuthorizedMutation([
	"broker_member",
	"broker_admin",
	"any",
])({
	args: {
		clientBrokerId: v.id("broker_clients"),
		message: v.string(),
		documentIds: v.optional(v.array(v.id("_storage"))),
		documentLabels: v.optional(v.array(v.string())),
	},
	handler: async (ctx, args) => {
		const client = await ctx.db.get(args.clientBrokerId);

		if (!client) {
			throw new Error("Client not found");
		}

		// Verify authorization - client can send messages about themselves
		if ((ctx as any).subject !== client.clientId) {
			throw new Error("Unauthorized to send message for this client");
		}

		// Validate document labels
		if (!validateDocumentLabels(args.documentIds, args.documentLabels)) {
			throw new Error("Document labels must match document IDs");
		}

		const now = new Date().toISOString();
		const messageId = generateUUID();

		// Format document attachments
		const documents = formatDocumentAttachments(
			args.documentIds as any,
			args.documentLabels
		);

		// Add to communication timeline
		const _timelineEntry = {
			id: messageId,
			type: "info_request" as const, // Messages are treated as info requests
			sentBy: (ctx as any).subject,
			sentAt: now,
			message: args.message,
			documents,
			resolved: false,
		};

		// TODO: Insert into communication_timeline table
		// TODO: Send notification to broker

		await ctx.db.patch(args.clientBrokerId, {
			updatedAt: now,
		});

		return {
			success: true,
			messageId,
			sentAt: now,
		};
	},
});

/**
 * Mutation for broker to respond to client message
 */
export const respondToClientMessage = createAuthorizedMutation([
	"broker_admin",
])({
	args: {
		clientBrokerId: v.id("broker_clients"),
		communicationId: v.string(), // UUID of the message
		response: v.string(),
		documentIds: v.optional(v.array(v.id("_storage"))),
		documentLabels: v.optional(v.array(v.string())),
	},
	handler: async (ctx, args) => {
		const client = await ctx.db.get(args.clientBrokerId);

		if (!client) {
			throw new Error("Client not found");
		}

		// Verify broker owns this client
		if (client.brokerId !== (ctx as any).org_id) {
			throw new Error("You can only respond to messages from your clients");
		}

		// Validate document labels
		if (!validateDocumentLabels(args.documentIds, args.documentLabels)) {
			throw new Error("Document labels must match document IDs");
		}

		const now = new Date().toISOString();

		// Format document attachments
		const documents = formatDocumentAttachments(
			args.documentIds as any,
			args.documentLabels
		);

		// Update timeline entry to mark as resolved
		const _updatedEntry = {
			resolved: true,
			resolvedAt: now,
			response: args.response,
			documents,
			respondedBy: (ctx as any).subject,
		};

		// TODO: Update communication_timeline table with communicationId
		// TODO: Send notification to client

		await ctx.db.patch(args.clientBrokerId, {
			updatedAt: now,
		});

		return {
			success: true,
			resolvedAt: now,
		};
	},
});

/**
 * Mutation to mark a request as resolved (without response)
 * Used when broker decides to close a request
 */
export const resolveClientRequest = createAuthorizedMutation(["broker_admin"])({
	args: {
		clientBrokerId: v.id("broker_clients"),
		requestId: v.string(),
		reason: v.string(),
	},
	handler: async (ctx, args) => {
		const client = await ctx.db.get(args.clientBrokerId);

		if (!client) {
			throw new Error("Client not found");
		}

		// Verify broker owns this client
		if (client.brokerId !== (ctx as any).org_id) {
			throw new Error("You can only resolve requests for your clients");
		}

		const now = new Date().toISOString();

		// Update timeline entry to mark as resolved with reason
		const _updatedEntry = {
			resolved: true,
			resolvedAt: now,
			response: `Closed by broker: ${args.reason}`,
			respondedBy: (ctx as any).subject,
		};

		// TODO: Update communication_timeline table with requestId
		// TODO: Send notification to client

		await ctx.db.patch(args.clientBrokerId, {
			updatedAt: now,
		});

		return {
			success: true,
			resolvedAt: now,
		};
	},
});

/**
 * Mutation to send an announcement to multiple clients
 */
export const sendBrokerAnnouncement = createAuthorizedMutation([
	"broker_admin",
])({
	args: {
		clientBrokerIds: v.array(v.id("broker_clients")),
		message: v.string(),
		documentIds: v.optional(v.array(v.id("_storage"))),
		documentLabels: v.optional(v.array(v.string())),
	},
	handler: async (ctx, args) => {
		// Validate client count
		if (args.clientBrokerIds.length === 0) {
			throw new Error("At least one client must be specified");
		}

		// Validate document labels
		if (!validateDocumentLabels(args.documentIds, args.documentLabels)) {
			throw new Error("Document labels must match document IDs");
		}

		const now = new Date().toISOString();
		const announcementId = generateUUID();

		// Format document attachments
		const documents = formatDocumentAttachments(
			args.documentIds as any,
			args.documentLabels
		);

		// Verify all clients belong to this broker
		const clients = await Promise.all(
			args.clientBrokerIds.map((id) => ctx.db.get(id))
		);

		for (const client of clients) {
			if (!client) {
				throw new Error("One or more clients not found");
			}
			if (client.brokerId !== (ctx as any).org_id) {
				throw new Error("All clients must belong to your brokerage");
			}
		}

		// Add announcement to each client's timeline
		const _timelineEntries = clients.map((_client) => ({
			id: generateUUID(), // Unique ID per client
			type: "announcement" as const,
			sentBy: (ctx as any).subject,
			sentAt: now,
			message: args.message,
			documents,
			resolved: false,
			announcementId, // Group ID for this announcement
		}));

		// TODO: Insert all entries into communication_timeline table
		// TODO: Send notification to all affected clients

		// Update all clients' updatedAt timestamps
		for (const clientBrokerId of args.clientBrokerIds) {
			await ctx.db.patch(clientBrokerId, {
				updatedAt: now,
			});
		}

		return {
			success: true,
			announcementId,
			sentAt: now,
			clientCount: args.clientBrokerIds.length,
		};
	},
});
