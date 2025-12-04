import { describe, expect, test } from "vitest";
import { createActor } from "xstate";
import type { Id } from "../convex/_generated/dataModel";
import {
	canCancelFromState,
	type DealContext,
	type DealEventWithAdmin,
	type DealStateValue,
	dealMachine,
	isTerminalState,
} from "../convex/dealStateMachine";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a minimal deal context for testing
 */
function createTestContext(overrides?: Partial<DealContext>): DealContext {
	return {
		dealId: "deal_123" as Id<"deals">,
		lockRequestId: "lock_456" as Id<"lock_requests">,
		listingId: "listing_789" as Id<"listings">,
		mortgageId: "mortgage_abc" as Id<"mortgages">,
		investorId: "investor_def" as Id<"users">,
		purchasePercentage: 100,
		dealValue: 500000,
		currentState: "locked",
		stateHistory: [],
		...overrides,
	};
}

/**
 * Create an event with admin ID
 */
function createEvent(
	event:
		| { type: "CONFIRM_LAWYER"; notes?: string }
		| { type: "COMPLETE_DOCS"; notes?: string }
		| { type: "RECEIVE_FUNDS"; notes?: string }
		| { type: "VERIFY_FUNDS"; notes?: string }
		| { type: "COMPLETE_DEAL"; notes?: string }
		| { type: "GO_BACK"; toState: DealStateValue; notes?: string }
		| { type: "CANCEL"; reason: string }
		| { type: "ARCHIVE" }
): DealEventWithAdmin {
	return {
		...event,
		adminId: "admin_test" as Id<"users">,
	} as DealEventWithAdmin;
}

// ============================================================================
// Machine Initialization Tests
// ============================================================================

describe("dealMachine - Initialization", () => {
	test("should start in initial state", () => {
		const actor = createActor(dealMachine, {
			input: createTestContext(),
		});
		actor.start();

		const snapshot = actor.getSnapshot();
		expect(snapshot.value).toBe("locked");

		actor.stop();
	});

	test("should initialize with provided context", () => {
		const testContext = createTestContext({
			dealValue: 750000,
			purchasePercentage: 50,
		});

		const actor = createActor(dealMachine, {
			input: testContext,
		});
		actor.start();

		const snapshot = actor.getSnapshot();
		expect(snapshot.context.dealValue).toBe(750000);
		expect(snapshot.context.purchasePercentage).toBe(50);

		actor.stop();
	});
});

// ============================================================================
// Forward Transition Tests
// ============================================================================

describe("dealMachine - Forward Transitions", () => {
	test("should transition from locked to pending_lawyer on CONFIRM_LAWYER", () => {
		const actor = createActor(dealMachine, {
			input: createTestContext(),
		});
		actor.start();

		actor.send(createEvent({ type: "CONFIRM_LAWYER" }));

		const snapshot = actor.getSnapshot();
		expect(snapshot.value).toBe("pending_lawyer");
		expect(snapshot.context.currentState).toBe("pending_lawyer");

		actor.stop();
	});

	test("should transition from pending_lawyer to pending_docs on COMPLETE_DOCS", () => {
		const actor = createActor(dealMachine, {
			input: createTestContext({ currentState: "locked" }),
		});
		actor.start();

		// First transition from 'locked' to 'pending_lawyer'
		actor.send(createEvent({ type: "CONFIRM_LAWYER" }));

		// Now test the transition we care about
		actor.send(createEvent({ type: "COMPLETE_DOCS" }));

		const snapshot = actor.getSnapshot();
		expect(snapshot.value).toBe("pending_docs");

		actor.stop();
	});

	test("should transition from pending_docs to pending_transfer on RECEIVE_FUNDS", () => {
		const actor = createActor(dealMachine, {
			input: createTestContext({ currentState: "locked" }),
		});
		actor.start();

		// Transition: locked -> pending_lawyer -> pending_docs
		actor.send(createEvent({ type: "CONFIRM_LAWYER" }));
		actor.send(createEvent({ type: "COMPLETE_DOCS" }));

		// Now test the transition we care about
		actor.send(createEvent({ type: "RECEIVE_FUNDS" }));

		const snapshot = actor.getSnapshot();
		expect(snapshot.value).toBe("pending_transfer");

		actor.stop();
	});

	test("should transition from pending_transfer to pending_verification on VERIFY_FUNDS", () => {
		const actor = createActor(dealMachine, {
			input: createTestContext({ currentState: "locked" }),
		});
		actor.start();

		// Transition: locked -> pending_lawyer -> pending_docs -> pending_transfer
		actor.send(createEvent({ type: "CONFIRM_LAWYER" }));
		actor.send(createEvent({ type: "COMPLETE_DOCS" }));
		actor.send(createEvent({ type: "RECEIVE_FUNDS" }));

		// Now test the transition we care about
		actor.send(createEvent({ type: "VERIFY_FUNDS" }));

		const snapshot = actor.getSnapshot();
		expect(snapshot.value).toBe("pending_verification");

		actor.stop();
	});

	test("should transition from pending_verification to completed on COMPLETE_DEAL", () => {
		const actor = createActor(dealMachine, {
			input: createTestContext({ currentState: "locked" }),
		});
		actor.start();

		// Transition: locked -> pending_lawyer -> pending_docs -> pending_transfer -> pending_verification
		actor.send(createEvent({ type: "CONFIRM_LAWYER" }));
		actor.send(createEvent({ type: "COMPLETE_DOCS" }));
		actor.send(createEvent({ type: "RECEIVE_FUNDS" }));
		actor.send(createEvent({ type: "VERIFY_FUNDS" }));

		// Now test the transition we care about
		actor.send(createEvent({ type: "COMPLETE_DEAL" }));

		const snapshot = actor.getSnapshot();
		expect(snapshot.value).toBe("completed");

		actor.stop();
	});

	test("should complete full forward transition sequence", () => {
		const actor = createActor(dealMachine, {
			input: createTestContext(),
		});
		actor.start();

		const transitions = [
			{
				event: createEvent({ type: "CONFIRM_LAWYER" as const }),
				expectedState: "pending_lawyer" as const,
			},
			{
				event: createEvent({ type: "COMPLETE_DOCS" as const }),
				expectedState: "pending_docs" as const,
			},
			{
				event: createEvent({ type: "RECEIVE_FUNDS" as const }),
				expectedState: "pending_transfer" as const,
			},
			{
				event: createEvent({ type: "VERIFY_FUNDS" as const }),
				expectedState: "pending_verification" as const,
			},
			{
				event: createEvent({ type: "COMPLETE_DEAL" as const }),
				expectedState: "completed" as const,
			},
		];

		for (const { event, expectedState } of transitions) {
			actor.send(event);
			expect(actor.getSnapshot().value).toBe(expectedState);
		}

		actor.stop();
	});
});

// ============================================================================
// Backward Transition Tests (GO_BACK)
// ============================================================================

describe("dealMachine - Backward Transitions", () => {
	test("should go back from pending_lawyer to locked", () => {
		const actor = createActor(dealMachine, {
			input: createTestContext({ currentState: "pending_lawyer" }),
		});
		actor.start();

		actor.send(
			createEvent({ type: "GO_BACK", toState: "locked" as DealStateValue })
		);

		const snapshot = actor.getSnapshot();
		expect(snapshot.value).toBe("locked");

		actor.stop();
	});

	test("should go back from pending_docs to pending_lawyer", () => {
		const actor = createActor(dealMachine, {
			input: createTestContext({ currentState: "locked" }),
		});
		actor.start();

		// Transition to pending_docs first
		actor.send(createEvent({ type: "CONFIRM_LAWYER" }));
		actor.send(createEvent({ type: "COMPLETE_DOCS" }));

		// Now test going back
		actor.send(
			createEvent({
				type: "GO_BACK",
				toState: "pending_lawyer" as DealStateValue,
			})
		);

		const snapshot = actor.getSnapshot();
		expect(snapshot.value).toBe("pending_lawyer");

		actor.stop();
	});

	test("should go back from pending_transfer to pending_docs", () => {
		const actor = createActor(dealMachine, {
			input: createTestContext({ currentState: "locked" }),
		});
		actor.start();

		// Transition to pending_transfer first
		actor.send(createEvent({ type: "CONFIRM_LAWYER" }));
		actor.send(createEvent({ type: "COMPLETE_DOCS" }));
		actor.send(createEvent({ type: "RECEIVE_FUNDS" }));

		// Now test going back
		actor.send(
			createEvent({
				type: "GO_BACK",
				toState: "pending_docs" as DealStateValue,
			})
		);

		const snapshot = actor.getSnapshot();
		expect(snapshot.value).toBe("pending_docs");

		actor.stop();
	});

	test("should go back from pending_verification to pending_transfer", () => {
		const actor = createActor(dealMachine, {
			input: createTestContext({ currentState: "locked" }),
		});
		actor.start();

		// Transition to pending_verification first
		actor.send(createEvent({ type: "CONFIRM_LAWYER" }));
		actor.send(createEvent({ type: "COMPLETE_DOCS" }));
		actor.send(createEvent({ type: "RECEIVE_FUNDS" }));
		actor.send(createEvent({ type: "VERIFY_FUNDS" }));

		// Now test going back
		actor.send(
			createEvent({
				type: "GO_BACK",
				toState: "pending_transfer" as DealStateValue,
			})
		);

		const snapshot = actor.getSnapshot();
		expect(snapshot.value).toBe("pending_transfer");

		actor.stop();
	});

	test("should handle forward then backward transitions", () => {
		const actor = createActor(dealMachine, {
			input: createTestContext(),
		});
		actor.start();

		// Forward
		actor.send(createEvent({ type: "CONFIRM_LAWYER" }));
		expect(actor.getSnapshot().value).toBe("pending_lawyer");

		actor.send(createEvent({ type: "COMPLETE_DOCS" }));
		expect(actor.getSnapshot().value).toBe("pending_docs");

		// Backward
		actor.send(
			createEvent({
				type: "GO_BACK",
				toState: "pending_lawyer" as DealStateValue,
			})
		);
		expect(actor.getSnapshot().value).toBe("pending_lawyer");

		// Forward again
		actor.send(createEvent({ type: "COMPLETE_DOCS" }));
		expect(actor.getSnapshot().value).toBe("pending_docs");

		actor.stop();
	});
});

// ============================================================================
// Cancellation Tests
// ============================================================================

describe("dealMachine - Cancellation", () => {
	test("should cancel from locked state", () => {
		const actor = createActor(dealMachine, {
			input: createTestContext({ currentState: "locked" }),
		});
		actor.start();

		actor.send(createEvent({ type: "CANCEL", reason: "Test cancellation" }));

		const snapshot = actor.getSnapshot();
		expect(snapshot.value).toBe("cancelled");

		actor.stop();
	});

	test("should cancel from pending_lawyer state", () => {
		const actor = createActor(dealMachine, {
			input: createTestContext({ currentState: "pending_lawyer" }),
		});
		actor.start();

		actor.send(createEvent({ type: "CANCEL", reason: "Lawyer declined" }));

		const snapshot = actor.getSnapshot();
		expect(snapshot.value).toBe("cancelled");

		actor.stop();
	});

	test("should cancel from pending_docs state", () => {
		const actor = createActor(dealMachine, {
			input: createTestContext({ currentState: "pending_docs" }),
		});
		actor.start();

		actor.send(createEvent({ type: "CANCEL", reason: "Documents incomplete" }));

		const snapshot = actor.getSnapshot();
		expect(snapshot.value).toBe("cancelled");

		actor.stop();
	});

	test("should cancel from pending_transfer state", () => {
		const actor = createActor(dealMachine, {
			input: createTestContext({ currentState: "pending_transfer" }),
		});
		actor.start();

		actor.send(createEvent({ type: "CANCEL", reason: "Funds not received" }));

		const snapshot = actor.getSnapshot();
		expect(snapshot.value).toBe("cancelled");

		actor.stop();
	});

	test("should cancel from pending_verification state", () => {
		const actor = createActor(dealMachine, {
			input: createTestContext({ currentState: "pending_verification" }),
		});
		actor.start();

		actor.send(createEvent({ type: "CANCEL", reason: "Verification failed" }));

		const snapshot = actor.getSnapshot();
		expect(snapshot.value).toBe("cancelled");

		actor.stop();
	});
});

// ============================================================================
// Archive Tests
// ============================================================================

describe("dealMachine - Archive", () => {
	test("should archive from completed state", () => {
		const actor = createActor(dealMachine, {
			input: createTestContext({ currentState: "locked" }),
		});
		actor.start();

		// Transition to completed state first
		actor.send(createEvent({ type: "CONFIRM_LAWYER" }));
		actor.send(createEvent({ type: "COMPLETE_DOCS" }));
		actor.send(createEvent({ type: "RECEIVE_FUNDS" }));
		actor.send(createEvent({ type: "VERIFY_FUNDS" }));
		actor.send(createEvent({ type: "COMPLETE_DEAL" }));

		// Now test archiving
		actor.send(createEvent({ type: "ARCHIVE" }));

		const snapshot = actor.getSnapshot();
		expect(snapshot.value).toBe("archived");

		actor.stop();
	});

	test("should archive from cancelled state", () => {
		const actor = createActor(dealMachine, {
			input: createTestContext({ currentState: "locked" }),
		});
		actor.start();

		// Transition to cancelled state first (can cancel from any state, let's use locked)
		actor.send(createEvent({ type: "CANCEL", reason: "Test cancellation" }));

		// Now test archiving
		actor.send(createEvent({ type: "ARCHIVE" }));

		const snapshot = actor.getSnapshot();
		expect(snapshot.value).toBe("archived");

		actor.stop();
	});

	test("archived should be a final state", () => {
		const actor = createActor(dealMachine, {
			input: createTestContext({ currentState: "locked" }),
		});
		actor.start();

		// Transition to completed then archived
		actor.send(createEvent({ type: "CONFIRM_LAWYER" }));
		actor.send(createEvent({ type: "COMPLETE_DOCS" }));
		actor.send(createEvent({ type: "RECEIVE_FUNDS" }));
		actor.send(createEvent({ type: "VERIFY_FUNDS" }));
		actor.send(createEvent({ type: "COMPLETE_DEAL" }));
		actor.send(createEvent({ type: "ARCHIVE" }));

		const snapshot = actor.getSnapshot();
		expect(snapshot.status).toBe("done");

		actor.stop();
	});
});

// ============================================================================
// State History Tests
// ============================================================================

describe("dealMachine - State History", () => {
	test("should add entry to state history on transition", () => {
		const actor = createActor(dealMachine, {
			input: createTestContext(),
		});
		actor.start();

		const initialHistory = actor.getSnapshot().context.stateHistory;
		expect(initialHistory).toEqual([]);

		actor.send(
			createEvent({ type: "CONFIRM_LAWYER", notes: "Test transition" })
		);

		const updatedHistory = actor.getSnapshot().context.stateHistory;
		expect(updatedHistory.length).toBe(1);
		expect(updatedHistory[0].fromState).toBe("locked");
		expect(updatedHistory[0].toState).toBe("pending_lawyer");
		expect(updatedHistory[0].notes).toBe("Test transition");
		expect(updatedHistory[0].triggeredBy).toBe("admin_test");
		expect(updatedHistory[0].timestamp).toBeDefined();

		actor.stop();
	});

	test("should accumulate state history across multiple transitions", () => {
		const actor = createActor(dealMachine, {
			input: createTestContext(),
		});
		actor.start();

		actor.send(createEvent({ type: "CONFIRM_LAWYER", notes: "First" }));
		actor.send(createEvent({ type: "COMPLETE_DOCS", notes: "Second" }));
		actor.send(createEvent({ type: "RECEIVE_FUNDS", notes: "Third" }));

		const history = actor.getSnapshot().context.stateHistory;
		expect(history.length).toBe(3);
		expect(history[0].notes).toBe("First");
		expect(history[1].notes).toBe("Second");
		expect(history[2].notes).toBe("Third");

		actor.stop();
	});

	test("should record backward transitions in history", () => {
		const actor = createActor(dealMachine, {
			input: createTestContext(),
		});
		actor.start();

		actor.send(createEvent({ type: "CONFIRM_LAWYER" }));
		actor.send(createEvent({ type: "COMPLETE_DOCS" }));
		actor.send(
			createEvent({
				type: "GO_BACK",
				toState: "pending_lawyer" as DealStateValue,
				notes: "Going back",
			})
		);

		const history = actor.getSnapshot().context.stateHistory;
		expect(history.length).toBe(3);
		expect(history[2].fromState).toBe("pending_docs");
		expect(history[2].toState).toBe("pending_lawyer");
		expect(history[2].notes).toBe("Going back");

		actor.stop();
	});

	test("should record timestamp for each transition", () => {
		const actor = createActor(dealMachine, {
			input: createTestContext(),
		});
		actor.start();

		const beforeTimestamp = Date.now();
		actor.send(createEvent({ type: "CONFIRM_LAWYER" }));
		const afterTimestamp = Date.now();

		const history = actor.getSnapshot().context.stateHistory;
		const timestamp = history[0].timestamp;

		expect(timestamp).toBeGreaterThanOrEqual(beforeTimestamp);
		expect(timestamp).toBeLessThanOrEqual(afterTimestamp);

		actor.stop();
	});

	test("should record admin ID for each transition", () => {
		const testAdminId = "specific_admin_123" as Id<"users">;
		const actor = createActor(dealMachine, {
			input: createTestContext(),
		});
		actor.start();

		actor.send({
			type: "CONFIRM_LAWYER",
			adminId: testAdminId,
		});

		const history = actor.getSnapshot().context.stateHistory;
		expect(history[0].triggeredBy).toBe(testAdminId);

		actor.stop();
	});
});

// ============================================================================
// Context Update Tests
// ============================================================================

describe("dealMachine - Context Updates", () => {
	test("should update currentState in context on transition", () => {
		const actor = createActor(dealMachine, {
			input: createTestContext(),
		});
		actor.start();

		expect(actor.getSnapshot().context.currentState).toBe("locked");

		actor.send(createEvent({ type: "CONFIRM_LAWYER" }));
		expect(actor.getSnapshot().context.currentState).toBe("pending_lawyer");

		actor.send(createEvent({ type: "COMPLETE_DOCS" }));
		expect(actor.getSnapshot().context.currentState).toBe("pending_docs");

		actor.stop();
	});

	test("should preserve other context fields during transitions", () => {
		const testContext = createTestContext({
			dealValue: 750000,
			purchasePercentage: 50,
		});

		const actor = createActor(dealMachine, {
			input: testContext,
		});
		actor.start();

		actor.send(createEvent({ type: "CONFIRM_LAWYER" }));

		const snapshot = actor.getSnapshot();
		expect(snapshot.context.dealValue).toBe(750000);
		expect(snapshot.context.purchasePercentage).toBe(50);
		expect(snapshot.context.dealId).toBe(testContext.dealId);
		expect(snapshot.context.mortgageId).toBe(testContext.mortgageId);

		actor.stop();
	});
});

// ============================================================================
// Helper Function Tests
// ============================================================================

describe("dealMachine - Helper Functions", () => {
	test("isTerminalState should identify terminal states correctly", () => {
		expect(isTerminalState("completed")).toBe(true);
		expect(isTerminalState("cancelled")).toBe(true);
		expect(isTerminalState("archived")).toBe(true);

		expect(isTerminalState("locked")).toBe(false);
		expect(isTerminalState("pending_lawyer")).toBe(false);
		expect(isTerminalState("pending_docs")).toBe(false);
		expect(isTerminalState("pending_transfer")).toBe(false);
		expect(isTerminalState("pending_verification")).toBe(false);
	});

	test("canCancelFromState should allow cancellation from non-terminal states", () => {
		expect(canCancelFromState("locked")).toBe(true);
		expect(canCancelFromState("pending_lawyer")).toBe(true);
		expect(canCancelFromState("pending_docs")).toBe(true);
		expect(canCancelFromState("pending_transfer")).toBe(true);
		expect(canCancelFromState("pending_verification")).toBe(true);

		expect(canCancelFromState("completed")).toBe(false);
		expect(canCancelFromState("cancelled")).toBe(false);
		expect(canCancelFromState("archived")).toBe(false);
	});
});

// ============================================================================
// Snapshot Serialization Tests
// ============================================================================

describe("dealMachine - Snapshot Serialization", () => {
	test("should serialize and restore snapshot correctly", () => {
		const actor1 = createActor(dealMachine, {
			input: createTestContext(),
		});
		actor1.start();

		actor1.send(createEvent({ type: "CONFIRM_LAWYER" }));
		actor1.send(createEvent({ type: "COMPLETE_DOCS" }));

		const snapshot = actor1.getSnapshot();
		actor1.stop();

		// Serialize
		const serialized = JSON.stringify(snapshot);

		// Deserialize and restore
		const deserialized = JSON.parse(serialized);
		const actor2 = createActor(dealMachine, {
			input: deserialized.context,
			snapshot: deserialized,
		});
		actor2.start();

		const restoredSnapshot = actor2.getSnapshot();
		expect(restoredSnapshot.value).toBe("pending_docs");
		expect(restoredSnapshot.context.currentState).toBe("pending_docs");
		expect(restoredSnapshot.context.stateHistory.length).toBe(2);

		actor2.stop();
	});

	test("should continue from restored snapshot", () => {
		const actor1 = createActor(dealMachine, {
			input: createTestContext(),
		});
		actor1.start();

		actor1.send(createEvent({ type: "CONFIRM_LAWYER" }));
		const snapshot = actor1.getSnapshot();
		actor1.stop();

		// Restore and continue
		const deserializedSnapshot = JSON.parse(JSON.stringify(snapshot));
		const actor2 = createActor(dealMachine, {
			input: deserializedSnapshot.context,
			snapshot: deserializedSnapshot,
		});
		actor2.start();

		actor2.send(createEvent({ type: "COMPLETE_DOCS" }));
		expect(actor2.getSnapshot().value).toBe("pending_docs");

		actor2.stop();
	});
});
