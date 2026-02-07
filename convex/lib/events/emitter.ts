/**
 * Event Emitter Abstraction
 *
 * Stubbed adapter pattern for event emission. Currently logs to console in development.
 * Can be replaced with Apache Pulsar, Kafka, or other message brokers later.
 *
 * See research.md #3 for the adapter pattern rationale.
 */

import { logger } from "../../../lib/logger";
import type { AuditEventRecord } from "./types";

/**
 * Event emission result
 */
export type EmitResult = {
	success: boolean;
	error?: string;
	timestamp?: number;
};

/**
 * Event emitter interface - implement this for different backends
 */
export type IEventEmitter = {
	emit(event: AuditEventRecord): Promise<EmitResult>;
	emitBatch(events: AuditEventRecord[]): Promise<EmitResult[]>;
	healthCheck(): Promise<boolean>;
};

/**
 * Console Event Emitter - Development/Stubbed Implementation
 *
 * Logs events to console. In production, replace with PulsarEmitter or KafkaEmitter.
 */
export class ConsoleEventEmitter implements IEventEmitter {
	private readonly isDev: boolean;

	constructor() {
		this.isDev = process.env.NODE_ENV !== "production";
	}

	async emit(event: AuditEventRecord): Promise<EmitResult> {
		try {
			// In development, log the event
			if (this.isDev) {
				logger.info(`[AuditEvent] ${event.eventType}`, {
					entityType: event.entityType,
					entityId: event.entityId,
					userId: event.userId,
					metadata: event.metadata,
				});
			}

			// Stub: always succeed
			return {
				success: true,
				timestamp: Date.now(),
			};
		} catch (error) {
			logger.error("Event emission failed", { error, eventId: event._id });
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	async emitBatch(events: AuditEventRecord[]): Promise<EmitResult[]> {
		const results: EmitResult[] = [];

		for (const event of events) {
			// Emit each event individually, catching errors per-item
			// This ensures one failure doesn't block the batch
			// See footguns.md #7
			const result = await this.emit(event);
			results.push(result);
		}

		return results;
	}

	async healthCheck(): Promise<boolean> {
		// Stub: always healthy
		return true;
	}
}

/**
 * Future: Apache Pulsar Implementation
 *
 * Uncomment and implement when Pulsar integration is ready.
 */
// export class PulsarEventEmitter implements IEventEmitter {
//   private client: PulsarClient;
//   private producer: PulsarProducer;
//
//   async emit(event: AuditEventRecord): Promise<EmitResult> {
//     // Serialize event
//     // Send to Pulsar topic
//     // Return result
//   }
// }

/**
 * Get the configured event emitter
 *
 * Returns the appropriate emitter based on environment configuration.
 * Currently always returns ConsoleEventEmitter (stubbed).
 */
let _emitterInstance: IEventEmitter | null = null;

export function getEventEmitter(): IEventEmitter {
	if (!_emitterInstance) {
		// Future: check env vars for Pulsar/Kafka configuration
		// const pulsarUrl = process.env.PULSAR_URL;
		// if (pulsarUrl) {
		//   _emitterInstance = new PulsarEventEmitter(pulsarUrl);
		// } else {
		_emitterInstance = new ConsoleEventEmitter();
		// }
	}
	return _emitterInstance;
}

/**
 * Reset the emitter instance (for testing)
 */
export function resetEventEmitter(): void {
	_emitterInstance = null;
}
