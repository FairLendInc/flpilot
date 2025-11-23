/**
 * XState State Machine for Deal Workflow
 * 
 * This machine manages the lifecycle of mortgage purchase deals from initial lock
 * through final ownership transfer. It runs on the Convex backend and stores
 * serialized state in the database for resumability and auditability.
 * 
 * States:
 * - locked: Initial state after deal creation from approved lock request
 * - pending_lawyer: Awaiting lawyer confirmation of representation
 * - pending_docs: Awaiting document signing completion
 * - pending_transfer: Awaiting fund transfer from investor
 * - pending_verification: Awaiting verification of transferred funds
 * - completed: Deal successfully closed, ownership transferred
 * - cancelled: Deal cancelled, listing unlocked
 * - archived: Deal moved to archive for audit purposes
 * 
 * Transition Rules:
 * - Forward: Strictly linear progression through states
 * - Backward: Allowed from any state (except terminal states)
 * - Cancellation: Allowed from any non-terminal state
 */

import { setup, assign } from 'xstate';
import type { Id } from './_generated/dataModel';

/**
 * Deal context - data that persists throughout the state machine lifecycle
 */
export type DealStateValue =
	| 'locked'
	| 'pending_lawyer'
	| 'pending_docs'
	| 'pending_transfer'
	| 'pending_verification'
	| 'completed'
	| 'cancelled'
	| 'archived';

export type DealContext = {
	dealId: Id<"deals">;
	lockRequestId: Id<"lock_requests">;
	listingId: Id<"listings">;
	mortgageId: Id<"mortgages">;
	investorId: Id<"users">;
	purchasePercentage: number;
	dealValue: number;
	currentState: DealStateValue;
	stateHistory: Array<{
		fromState: string;
		toState: string;
		timestamp: number;
		triggeredBy: Id<"users">;
		notes?: string;
	}>;
};

/**
 * Deal events - all possible transitions the state machine can handle
 */
// Client-facing event types - adminId is injected by the server from auth context
export type DealEvent =
	| { type: 'CONFIRM_LAWYER'; notes?: string }
	| { type: 'COMPLETE_DOCS'; notes?: string }
	| { type: 'RECEIVE_FUNDS'; notes?: string }
	| { type: 'VERIFY_FUNDS'; notes?: string }
	| { type: 'COMPLETE_DEAL'; notes?: string }
	| { type: 'GO_BACK'; toState: DealStateValue; notes?: string }
	| { type: 'CANCEL'; reason: string }
	| { type: 'ARCHIVE' };

// Internal event type with adminId injected by the server
export type DealEventWithAdmin = DealEvent & { adminId: Id<"users"> };

/**
 * Deal state machine definition
 * 
 * This machine is instantiated on the backend and its state is serialized
 * to JSON for storage in Convex. The frontend receives the current state
 * and can request transitions via mutations.
 */
export const dealMachine = setup({
	types: {
		context: {} as DealContext,
		events: {} as DealEventWithAdmin,
		input: {} as DealContext,
	},
	guards: {
		/**
		 * Validate forward state transitions
		 * Currently a pass-through, but will integrate validation logic
		 * @future Check lawyer credentials, document uploads, fund verification, etc.
		 */
		canTransitionForward: () => {
			// TODO: Implement validation checks based on target state
			// For now, always allow forward transitions
			return true;
		},

		/**
		 * Validate backward state transitions
		 * Always allowed unless in terminal state (checked by machine structure)
		 */
		canTransitionBackward: () => true,

		/**
		 * Validate deal cancellation
		 * Currently always allowed from non-terminal states
		 * @future May add approval requirements for cancellations
		 */
		canCancel: () => true,
	},
	actions: {
		/**
		 * Log state transition to audit trail
		 * Captures: from/to states, timestamp, admin who triggered, optional notes
		 */
		logTransition: assign(({ context, event }) => {
			const { adminId } = event;
			const notes = 'notes' in event ? event.notes : undefined;
			
			// Determine target state based on event type
			let toState: DealStateValue = context.currentState;
			
			if (event.type === 'CONFIRM_LAWYER') toState = 'pending_lawyer';
			else if (event.type === 'COMPLETE_DOCS') toState = 'pending_docs';
			else if (event.type === 'RECEIVE_FUNDS') toState = 'pending_transfer';
			else if (event.type === 'VERIFY_FUNDS') toState = 'pending_verification';
			else if (event.type === 'COMPLETE_DEAL') toState = 'completed';
			else if (event.type === 'CANCEL') toState = 'cancelled';
			else if (event.type === 'ARCHIVE') toState = 'archived';
			else if (event.type === 'GO_BACK') toState = event.toState;

			return {
				currentState: toState,
				stateHistory: [
					...context.stateHistory,
					{
						fromState: context.currentState,
						toState,
						timestamp: Date.now(),
						triggeredBy: adminId,
						notes,
					},
				],
			};
		}),
	},
}).createMachine({
	/** @xstate-layout N4IgpgJg5mDOIC5QAoC2BDAxgCwJYDswBKAOgAcBiAZ1wElZYAbMA9vQgBtyB7MAGQD6AJQDyAUQBKAEQDaABgC6iUAAdUsXH0aUAFrJAAPRAFoAHAGYAbMiMAOAJwAWYwCYArAA4XJu8YA0IACeiO4ATAGh3gGhwZGhdt5xAL4ZwWiY2LgExGTklNR0NKq03NJM3DQATN7IAKKspJWyFQAyspU1VdKtctIo9k4uCC7x-gGhUV7+fqF9UT6hCT4J+Ulp6FhQOHikFJS0dPLMAIJtnMKi5ZZW-cYhOX7Gsb5+G7HhY7dJ85n+a6phJG8b3cHl2fnmG1WEXWa02vG2qCIDDIhSqYlI5DuJCKGj4xVKABUxKVyHdpPc7iAnq5XgEghE2dERsFRmNJlN3M9kBzNn0tr1dnRiAJCgA3X4AW2I0R0OOwfEO1DIqAAYhxNRrCRSngN4sZAn1+r5giZBs8TACjF7DVETPNkHL5coKFRxHx1UcqicBEDtaBwZDoVx6Iw2BwhAAFX0UolkimU15hVF9D0ZY4g6ZTOa5BJQkHaGj8GWyVQMAhS7hyqV1v0GpPGvpmPyx-o2j38uzekYmAL+5LBjYi7FpTG2TIEFL0GtNhgUpu52gWa20Ft1t4tDZ94ks3n80ZDNHTGKBjncmKmUxJM+RZB5K-eokhXKV+o1es8HgAVgATABmR-PwHM9gmKwEjDdEFKXWeFzDBX1olPQY9nDYIjwPVZj3fZ90XvJZojGbxz0sYgkHgvg6AVWUINeKg4BIW0WkEDNJVqepoLuNE0UQ0L2k8J4hgGAJh3-ADgm9c8r3+VZkPQiBEXGOIjFFYjCKoYsNgibZ-SGbxQgCYJ9kTL8p2KUYQmMAxjKKVTqTTCy+Cje4Uz-EMrz8zyglYyJPF8m8FKMYNElGMc9m-IIkG4ygqWCW96y7Q9gPHAYohqQoijKDjdL0gyqKswK7NgocLwQnwhl8XwIvTc9jE8eLElSxyXOXBBkAKb9CLPD1kMcqYkqIr8MtEj8ijGG84jSgIKus0yrIOejLIA5ApwDED0z-UcRsWQd7kSkFqrPWqkvmIYglsbxTBykrGvM5AOtILrjT6iLLMc-bXJikdvHSuaxwGcZRgnUIImQsMvEmLxNk8m6SHIShbXYuhWMNdi0WxfFlK8fyg1Y3xp0+yN4gXE8-jnUqxoQfopQVPM7kBqbr0c54MYQPiD2QU9bP2lyT28u9TwGfx0YPcdEm_RZjDKImOy+n7fpJn6JXNKV1RTfaMeS9YTDqzyjDyqq0u2YIgA */
	id: 'dealWorkflow',
	initial: 'locked',
	context: ({ input }) => input,
	states: {
		/**
		 * LOCKED
		 * Initial state immediately after deal creation.
		 * Listing is locked, awaiting lawyer confirmation to progress.
		 */
		locked: {
			on: {
				CONFIRM_LAWYER: {
					target: 'pending_lawyer',
					guard: 'canTransitionForward',
					actions: 'logTransition',
				},
				CANCEL: {
					target: 'cancelled',
					guard: 'canCancel',
					actions: 'logTransition',
				},
			},
		},

		/**
		 * PENDING_LAWYER
		 * Awaiting confirmation from investor's lawyer regarding representation.
		 * Can move forward to document signing or backward to locked state.
		 */
		pending_lawyer: {
			on: {
				COMPLETE_DOCS: {
					target: 'pending_docs',
					guard: 'canTransitionForward',
					actions: 'logTransition',
				},
				GO_BACK: {
					target: 'locked',
					guard: 'canTransitionBackward',
					actions: 'logTransition',
				},
				CANCEL: {
					target: 'cancelled',
					guard: 'canCancel',
					actions: 'logTransition',
				},
			},
		},

		/**
		 * PENDING_DOCS
		 * Awaiting completion of document signing.
		 * Documents are being signed off-platform (pilot program).
		 */
		pending_docs: {
			on: {
				RECEIVE_FUNDS: {
					target: 'pending_transfer',
					guard: 'canTransitionForward',
					actions: 'logTransition',
				},
				GO_BACK: {
					target: 'pending_lawyer',
					guard: 'canTransitionBackward',
					actions: 'logTransition',
				},
				CANCEL: {
					target: 'cancelled',
					guard: 'canCancel',
					actions: 'logTransition',
				},
			},
		},

		/**
		 * PENDING_TRANSFER
		 * Awaiting fund transfer from investor.
		 * Once funds are received, moves to verification.
		 */
		pending_transfer: {
			on: {
				VERIFY_FUNDS: {
					target: 'pending_verification',
					guard: 'canTransitionForward',
					actions: 'logTransition',
				},
				GO_BACK: {
					target: 'pending_docs',
					guard: 'canTransitionBackward',
					actions: 'logTransition',
				},
				CANCEL: {
					target: 'cancelled',
					guard: 'canCancel',
					actions: 'logTransition',
				},
			},
		},

		/**
		 * PENDING_VERIFICATION
		 * Verifying that transferred funds match deal value and have cleared.
		 * Final step before deal completion.
		 */
		pending_verification: {
			on: {
				COMPLETE_DEAL: {
					target: 'completed',
					guard: 'canTransitionForward',
					actions: 'logTransition',
				},
				GO_BACK: {
					target: 'pending_transfer',
					guard: 'canTransitionBackward',
					actions: 'logTransition',
				},
				CANCEL: {
					target: 'cancelled',
					guard: 'canCancel',
					actions: 'logTransition',
				},
			},
		},

		/**
		 * COMPLETED
		 * Deal successfully closed. Ownership will be transferred via explicit admin action.
		 * Terminal state - can only move to archived.
		 */
		completed: {
			on: {
				ARCHIVE: {
					target: 'archived',
					actions: 'logTransition',
				},
			},
		},

		/**
		 * CANCELLED
		 * Deal cancelled. Listing has been unlocked, all changes reverted.
		 * Terminal state - can only move to archived.
		 */
		cancelled: {
			on: {
				ARCHIVE: {
					target: 'archived',
					actions: 'logTransition',
				},
			},
		},

		/**
		 * ARCHIVED
		 * Deal archived for audit purposes.
		 * Final terminal state - no transitions allowed.
		 */
		archived: {
			type: 'final',
		},
	},
});

/**
 * Types are already exported individually above for frontend consumption
 * Frontend imports these types but NOT the machine logic itself
 */

/**
 * Helper type for frontend components to know which state values are valid
 */
export const DEAL_STATES: ReadonlyArray<DealStateValue> = [
	'locked',
	'pending_lawyer',
	'pending_docs',
	'pending_transfer',
	'pending_verification',
	'completed',
	'cancelled',
	'archived',
] as const;

/**
 * Check if a state is a terminal state (no outgoing transitions except archive)
 */
export function isTerminalState(state: DealStateValue): boolean {
	return state === 'completed' || state === 'cancelled' || state === 'archived';
}

/**
 * Check if a state allows cancellation
 */
export function canCancelFromState(state: DealStateValue): boolean {
	return !isTerminalState(state);
}

/**
 * Get the next valid forward state for a given state
 */
export function getNextState(currentState: DealStateValue): DealStateValue | null {
	const stateMap: Record<DealStateValue, DealStateValue | null> = {
		locked: 'pending_lawyer',
		pending_lawyer: 'pending_docs',
		pending_docs: 'pending_transfer',
		pending_transfer: 'pending_verification',
		pending_verification: 'completed',
		completed: 'archived',
		cancelled: 'archived',
		archived: null,
	};
	return stateMap[currentState];
}

/**
 * Get the previous valid backward state for a given state
 */
export function getPreviousState(currentState: DealStateValue): DealStateValue | null {
	const stateMap: Record<DealStateValue, DealStateValue | null> = {
		locked: null,
		pending_lawyer: 'locked',
		pending_docs: 'pending_lawyer',
		pending_transfer: 'pending_docs',
		pending_verification: 'pending_transfer',
		completed: null,
		cancelled: null,
		archived: null,
	};
	return stateMap[currentState];
}

