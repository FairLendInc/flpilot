/**
 * Event Emission Module
 *
 * Provides audit event types, emitter abstraction, and helper functions
 * for the ownership transfer workflow event emission.
 */

export type { EmitResult, IEventEmitter } from "./emitter";
export {
	ConsoleEventEmitter,
	getEventEmitter,
	resetEventEmitter,
} from "./emitter";
export type {
	AuditEventInput,
	AuditEventRecord,
	EntityType,
	OwnershipEventType,
	SensitiveField,
} from "./types";
export {
	ENTITY_TYPES,
	OWNERSHIP_EVENT_TYPES,
	SENSITIVE_FIELDS,
	sanitizeState,
} from "./types";
