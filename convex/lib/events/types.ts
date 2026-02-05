/**
 * Audit Event Type Definitions
 *
 * Defines types for the audit event system used in the ownership transfer workflow.
 * Events are stored durably in Convex before emission to external systems.
 *
 * CRITICAL: Never log PII (email, SSN, phone) or credentials in audit events.
 * See footguns.md #4 for details.
 */

import type { Id } from "../../_generated/dataModel";

/**
 * Event types for ownership transfer workflow
 */
export const OWNERSHIP_EVENT_TYPES = {
	TRANSFER_CREATED: "ownership.transfer.created",
	TRANSFER_APPROVED: "ownership.transfer.approved",
	TRANSFER_REJECTED: "ownership.transfer.rejected",
	TRANSFER_COMPLETED: "ownership.transfer.completed",
	REVIEW_STARTED: "deal.ownership_review.started",
	MANUAL_RESOLUTION_REQUIRED: "deal.manual_resolution.required",
} as const;

export type OwnershipEventType =
	(typeof OWNERSHIP_EVENT_TYPES)[keyof typeof OWNERSHIP_EVENT_TYPES];

/**
 * Entity types for audit events
 */
export const ENTITY_TYPES = {
	PENDING_TRANSFER: "pending_ownership_transfer",
	MORTGAGE_OWNERSHIP: "mortgage_ownership",
	DEAL: "deal",
} as const;

export type EntityType = (typeof ENTITY_TYPES)[keyof typeof ENTITY_TYPES];

/**
 * Audit event input - what is provided when creating an event
 */
export type AuditEventInput = {
	eventType: OwnershipEventType | string;
	entityType: EntityType | string;
	entityId: string;
	userId: Id<"users">;
	beforeState?: Record<string, unknown>;
	afterState?: Record<string, unknown>;
	metadata?: Record<string, unknown>;
};

/**
 * Audit event record - what is stored in the database
 */
export interface AuditEventRecord extends AuditEventInput {
	_id: Id<"audit_events">;
	_creationTime: number;
	timestamp: number;
	emittedAt?: number;
	emitFailures?: number;
}

/**
 * Fields that are considered sensitive and must be stripped from audit events
 * OWASP Logging Cheat Sheet: Never log passwords, tokens, or PII
 */
export const SENSITIVE_FIELDS = [
	// PII
	"email",
	"phone",
	"ssn",
	"socialSecurityNumber",
	"dateOfBirth",
	"dob",
	// Financial
	"accountNumber",
	"routingNumber",
	"creditCardNumber",
	"bankAccount",
	// Credentials
	"password",
	"accessToken",
	"refreshToken",
	"apiKey",
	"secret",
	"token",
	// Address components (privacy)
	"streetAddress",
	"fullAddress",
] as const;

export type SensitiveField = (typeof SENSITIVE_FIELDS)[number];

/**
 * Sanitize an object by removing sensitive fields
 * Used to strip PII before storing in audit events
 *
 * @param state - The state object to sanitize
 * @returns Sanitized state with sensitive fields removed
 */
export function sanitizeState(
	state: unknown
): Record<string, unknown> | unknown {
	if (!state || typeof state !== "object") return state;

	// Handle arrays
	if (Array.isArray(state)) {
		return state.map((item) => sanitizeState(item));
	}

	const obj = state as Record<string, unknown>;
	const sanitized: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(obj)) {
		// Skip sensitive fields (case-insensitive check)
		const lowerKey = key.toLowerCase();
		const isSensitive = SENSITIVE_FIELDS.some(
			(field) =>
				lowerKey === field.toLowerCase() ||
				lowerKey.includes(field.toLowerCase())
		);

		if (isSensitive) {
			continue; // Skip this field entirely
		}

		// Recursively sanitize nested objects
		if (value && typeof value === "object") {
			sanitized[key] = sanitizeState(value);
		} else {
			sanitized[key] = value;
		}
	}

	return sanitized;
}
