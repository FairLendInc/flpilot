import { assign, setup } from "xstate";
import type { Doc } from "@/convex/_generated/dataModel";

type JourneyDoc = Doc<"onboarding_journeys">;

export type OnboardingStateValue =
	| "loading"
	| "personaSelection"
	| "investor.intro"
	| "investor.broker_selection"
	| "investor.profile"
	| "investor.preferences"
	| "investor.kyc_documents"
	| "investor.kyc_stub"
	| "investor.documentsStub"
	| "investor.review"
	| "investor.pending_admin"
	| "investor.rejected"
	| "investor.approved"
	| "broker.intro"
	| "broker.company_info"
	| "broker.licensing"
	| "broker.representatives"
	| "broker.documents"
	| "broker.review"
	| "broker.pending_admin"
	| "broker.rejected"
	| "lawyer.intro"
	| "lawyer.profile"
	| "lawyer.identity_verification"
	| "lawyer.lso_verification"
	| "lawyer.review"
	| "lawyer.pending_admin"
	| "lawyer.rejected"
	| "lawyer.placeholder"
	| "borrower.intro"
	| "borrower.profile"
	| "borrower.identity_verification"
	| "borrower.kyc_aml"
	| "borrower.rotessa_setup"
	| "borrower.review"
	| "borrower.pending_admin"
	| "borrower.rejected"
	| "borrower.approved"
	| "pendingAdmin"
	| "rejected"
	| "completed";

type MachineContext = {
	persona: JourneyDoc["persona"] | "unselected";
	status: JourneyDoc["status"];
	investor: NonNullable<JourneyDoc["context"]>["investor"];
	broker: NonNullable<JourneyDoc["context"]>["broker"];
	lawyer: NonNullable<JourneyDoc["context"]>["lawyer"];
	borrower: NonNullable<JourneyDoc["context"]>["borrower"];
	stateValue: OnboardingStateValue;
};

type HydrateEvent = { type: "HYDRATE"; journey: JourneyDoc | null };
type AdvanceEvent = { type: "ADVANCE"; stateValue: OnboardingStateValue };
type SetPersonaEvent = { type: "SET_PERSONA"; persona: JourneyDoc["persona"] };
type SetStatusEvent = { type: "SET_STATUS"; status: JourneyDoc["status"] };

type MachineEvent =
	| HydrateEvent
	| AdvanceEvent
	| SetPersonaEvent
	| SetStatusEvent;

const DEFAULT_CONTEXT: MachineContext = {
	persona: "unselected",
	status: "draft",
	investor: {},
	broker: {},
	lawyer: {},
	borrower: {},
	stateValue: "personaSelection",
};

export const onboardingMachine = setup({
	types: {
		context: {} as MachineContext,
		events: {} as MachineEvent,
	},
	guards: {
		noJourney: ({ event }: { event: MachineEvent }) =>
			event.type === "HYDRATE" && !event.journey,
		isPendingAdmin: ({ event }: { event: MachineEvent }) =>
			event.type === "HYDRATE" && event.journey?.status === "awaiting_admin",
		isBrokerPendingAdmin: ({ event }: { event: MachineEvent }) =>
			event.type === "HYDRATE" &&
			event.journey?.status === "awaiting_admin" &&
			event.journey?.persona === "broker",
		isBrokerRejected: ({ event }: { event: MachineEvent }) =>
			event.type === "HYDRATE" &&
			event.journey?.status === "rejected" &&
			event.journey?.persona === "broker",
		isLawyerPendingAdmin: ({ event }: { event: MachineEvent }) =>
			event.type === "HYDRATE" &&
			event.journey?.status === "awaiting_admin" &&
			event.journey?.persona === "lawyer",
		isLawyerRejected: ({ event }: { event: MachineEvent }) =>
			event.type === "HYDRATE" &&
			event.journey?.status === "rejected" &&
			event.journey?.persona === "lawyer",
		isBorrowerPendingAdmin: ({ event }: { event: MachineEvent }) =>
			event.type === "HYDRATE" &&
			event.journey?.status === "awaiting_admin" &&
			event.journey?.persona === "borrower",
		isBorrowerRejected: ({ event }: { event: MachineEvent }) =>
			event.type === "HYDRATE" &&
			event.journey?.status === "rejected" &&
			event.journey?.persona === "borrower",
		isRejected: ({ event }: { event: MachineEvent }) =>
			event.type === "HYDRATE" && event.journey?.status === "rejected",
		isApproved: ({ event }: { event: MachineEvent }) =>
			event.type === "HYDRATE" && event.journey?.status === "approved",
		needsPersona: ({ event }: { event: MachineEvent }) =>
			event.type === "HYDRATE" &&
			(!event.journey || event.journey.persona === "unselected"),
	},
	actions: {
		applyJourney: assign(({ event }) => {
			if (event.type !== "HYDRATE" || !event.journey) {
				return {};
			}
			return {
				persona: event.journey.persona,
				status: event.journey.status,
				investor: event.journey.context?.investor ?? {},
				broker: event.journey.context?.broker ?? {},
				lawyer: event.journey.context?.lawyer ?? {},
				borrower: event.journey.context?.borrower ?? {},
				stateValue: (event.journey.stateValue ??
					"personaSelection") as OnboardingStateValue,
			};
		}),
	},
}).createMachine({
	id: "onboarding",
	initial: "loading",
	context: DEFAULT_CONTEXT,
	on: {
		ADVANCE: [
			{
				guard: ({ event }: { event: AdvanceEvent }) =>
					event.stateValue === "investor.intro",
				target: ".investor.intro",
				actions: assign(({ event }: { event: AdvanceEvent }) => ({
					stateValue: event.stateValue,
				})),
			},
			{
				guard: ({ event }: { event: AdvanceEvent }) =>
					event.stateValue === "investor.profile",
				target: ".investor.profile",
				actions: assign(({ event }: { event: AdvanceEvent }) => ({
					stateValue: event.stateValue,
				})),
			},
			{
				guard: ({ event }: { event: AdvanceEvent }) =>
					event.stateValue === "investor.preferences",
				target: ".investor.preferences",
				actions: assign(({ event }: { event: AdvanceEvent }) => ({
					stateValue: event.stateValue,
				})),
			},
			{
				guard: ({ event }: { event: AdvanceEvent }) =>
					event.stateValue === "investor.broker_selection",
				target: ".investor.broker_selection",
				actions: assign(({ event }: { event: AdvanceEvent }) => ({
					stateValue: event.stateValue,
				})),
			},
			{
				guard: ({ event }: { event: AdvanceEvent }) =>
					event.stateValue === "investor.kyc_documents",
				target: ".investor.kyc_documents",
				actions: assign(({ event }: { event: AdvanceEvent }) => ({
					stateValue: event.stateValue,
				})),
			},
			{
				guard: ({ event }: { event: AdvanceEvent }) =>
					event.stateValue === "investor.kyc_stub",
				target: ".investor.kyc_stub",
				actions: assign(({ event }: { event: AdvanceEvent }) => ({
					stateValue: event.stateValue,
				})),
			},
			{
				guard: ({ event }: { event: AdvanceEvent }) =>
					event.stateValue === "investor.documentsStub",
				target: ".investor.documentsStub",
				actions: assign(({ event }: { event: AdvanceEvent }) => ({
					stateValue: event.stateValue,
				})),
			},
			{
				guard: ({ event }: { event: AdvanceEvent }) =>
					event.stateValue === "investor.review",
				target: ".investor.review",
				actions: assign(({ event }: { event: AdvanceEvent }) => ({
					stateValue: event.stateValue,
				})),
			},
			{
				guard: ({ event }: { event: AdvanceEvent }) =>
					event.stateValue === "broker.intro",
				target: ".broker.intro",
				actions: assign(({ event }: { event: AdvanceEvent }) => ({
					stateValue: event.stateValue,
				})),
			},
			{
				guard: ({ event }: { event: AdvanceEvent }) =>
					event.stateValue === "broker.company_info",
				target: ".broker.company_info",
				actions: assign(({ event }: { event: AdvanceEvent }) => ({
					stateValue: event.stateValue,
				})),
			},
			{
				guard: ({ event }: { event: AdvanceEvent }) =>
					event.stateValue === "broker.licensing",
				target: ".broker.licensing",
				actions: assign(({ event }: { event: AdvanceEvent }) => ({
					stateValue: event.stateValue,
				})),
			},
			{
				guard: ({ event }: { event: AdvanceEvent }) =>
					event.stateValue === "broker.representatives",
				target: ".broker.representatives",
				actions: assign(({ event }: { event: AdvanceEvent }) => ({
					stateValue: event.stateValue,
				})),
			},
			{
				guard: ({ event }: { event: AdvanceEvent }) =>
					event.stateValue === "broker.documents",
				target: ".broker.documents",
				actions: assign(({ event }: { event: AdvanceEvent }) => ({
					stateValue: event.stateValue,
				})),
			},
			{
				guard: ({ event }: { event: AdvanceEvent }) =>
					event.stateValue === "broker.review",
				target: ".broker.review",
				actions: assign(({ event }: { event: AdvanceEvent }) => ({
					stateValue: event.stateValue,
				})),
			},
			{
				guard: ({ event }: { event: AdvanceEvent }) =>
					event.stateValue === "broker.pending_admin",
				target: ".broker.pending_admin",
				actions: assign(({ event }: { event: AdvanceEvent }) => ({
					stateValue: event.stateValue,
				})),
			},
			{
				guard: ({ event }: { event: AdvanceEvent }) =>
					event.stateValue === "broker.rejected",
				target: ".broker.rejected",
				actions: assign(({ event }: { event: AdvanceEvent }) => ({
					stateValue: event.stateValue,
				})),
			},
			{
				guard: ({ event }: { event: AdvanceEvent }) =>
					event.stateValue === "lawyer.intro",
				target: ".lawyer.intro",
				actions: assign(({ event }: { event: AdvanceEvent }) => ({
					stateValue: event.stateValue,
				})),
			},
			{
				guard: ({ event }: { event: AdvanceEvent }) =>
					event.stateValue === "lawyer.profile",
				target: ".lawyer.profile",
				actions: assign(({ event }: { event: AdvanceEvent }) => ({
					stateValue: event.stateValue,
				})),
			},
			{
				guard: ({ event }: { event: AdvanceEvent }) =>
					event.stateValue === "lawyer.identity_verification",
				target: ".lawyer.identity_verification",
				actions: assign(({ event }: { event: AdvanceEvent }) => ({
					stateValue: event.stateValue,
				})),
			},
			{
				guard: ({ event }: { event: AdvanceEvent }) =>
					event.stateValue === "lawyer.lso_verification",
				target: ".lawyer.lso_verification",
				actions: assign(({ event }: { event: AdvanceEvent }) => ({
					stateValue: event.stateValue,
				})),
			},
			{
				guard: ({ event }: { event: AdvanceEvent }) =>
					event.stateValue === "lawyer.review",
				target: ".lawyer.review",
				actions: assign(({ event }: { event: AdvanceEvent }) => ({
					stateValue: event.stateValue,
				})),
			},
			{
				guard: ({ event }: { event: AdvanceEvent }) =>
					event.stateValue === "lawyer.pending_admin",
				target: ".lawyer.pending_admin",
				actions: assign(({ event }: { event: AdvanceEvent }) => ({
					stateValue: event.stateValue,
				})),
			},
			{
				guard: ({ event }: { event: AdvanceEvent }) =>
					event.stateValue === "lawyer.rejected",
				target: ".lawyer.rejected",
				actions: assign(({ event }: { event: AdvanceEvent }) => ({
					stateValue: event.stateValue,
				})),
			},
			// Borrower ADVANCE handlers
			{
				guard: ({ event }: { event: AdvanceEvent }) =>
					event.stateValue === "borrower.intro",
				target: ".borrower.intro",
				actions: assign(({ event }: { event: AdvanceEvent }) => ({
					stateValue: event.stateValue,
				})),
			},
			{
				guard: ({ event }: { event: AdvanceEvent }) =>
					event.stateValue === "borrower.profile",
				target: ".borrower.profile",
				actions: assign(({ event }: { event: AdvanceEvent }) => ({
					stateValue: event.stateValue,
				})),
			},
			{
				guard: ({ event }: { event: AdvanceEvent }) =>
					event.stateValue === "borrower.identity_verification",
				target: ".borrower.identity_verification",
				actions: assign(({ event }: { event: AdvanceEvent }) => ({
					stateValue: event.stateValue,
				})),
			},
			{
				guard: ({ event }: { event: AdvanceEvent }) =>
					event.stateValue === "borrower.kyc_aml",
				target: ".borrower.kyc_aml",
				actions: assign(({ event }: { event: AdvanceEvent }) => ({
					stateValue: event.stateValue,
				})),
			},
			{
				guard: ({ event }: { event: AdvanceEvent }) =>
					event.stateValue === "borrower.rotessa_setup",
				target: ".borrower.rotessa_setup",
				actions: assign(({ event }: { event: AdvanceEvent }) => ({
					stateValue: event.stateValue,
				})),
			},
			{
				guard: ({ event }: { event: AdvanceEvent }) =>
					event.stateValue === "borrower.review",
				target: ".borrower.review",
				actions: assign(({ event }: { event: AdvanceEvent }) => ({
					stateValue: event.stateValue,
				})),
			},
			{
				guard: ({ event }: { event: AdvanceEvent }) =>
					event.stateValue === "borrower.pending_admin",
				target: ".borrower.pending_admin",
				actions: assign(({ event }: { event: AdvanceEvent }) => ({
					stateValue: event.stateValue,
				})),
			},
			{
				guard: ({ event }: { event: AdvanceEvent }) =>
					event.stateValue === "borrower.rejected",
				target: ".borrower.rejected",
				actions: assign(({ event }: { event: AdvanceEvent }) => ({
					stateValue: event.stateValue,
				})),
			},
			{
				guard: ({ event }: { event: AdvanceEvent }) =>
					event.stateValue === "borrower.approved",
				target: ".borrower.approved",
				actions: assign(({ event }: { event: AdvanceEvent }) => ({
					stateValue: event.stateValue,
				})),
			},
			{
				target: ".personaSelection",
				actions: assign(({ event }: { event: AdvanceEvent }) => ({
					stateValue: event.stateValue,
				})),
			},
		],
		SET_PERSONA: {
			actions: assign(({ event }) =>
				event.type === "SET_PERSONA" ? { persona: event.persona } : {}
			),
		},
		SET_STATUS: {
			actions: assign(({ event }) =>
				event.type === "SET_STATUS" ? { status: event.status } : {}
			),
		},
		HYDRATE: [
			{ guard: "noJourney", target: ".personaSelection" },
			{
				guard: "isBrokerPendingAdmin",
				target: ".broker.pending_admin",
				actions: "applyJourney",
			},
			{
				guard: "isBrokerRejected",
				target: ".broker.rejected",
				actions: "applyJourney",
			},
			{
				guard: "isLawyerPendingAdmin",
				target: ".lawyer.pending_admin",
				actions: "applyJourney",
			},
			{
				guard: "isLawyerRejected",
				target: ".lawyer.rejected",
				actions: "applyJourney",
			},
			{
				guard: "isBorrowerPendingAdmin",
				target: ".borrower.pending_admin",
				actions: "applyJourney",
			},
			{
				guard: "isBorrowerRejected",
				target: ".borrower.rejected",
				actions: "applyJourney",
			},
			{
				guard: "isPendingAdmin",
				target: ".pendingAdmin",
				actions: "applyJourney",
			},
			{ guard: "isRejected", target: ".rejected", actions: "applyJourney" },
			{ guard: "isApproved", target: ".completed", actions: "applyJourney" },
			{
				guard: "needsPersona",
				target: ".personaSelection",
				actions: "applyJourney",
			},
			{
				guard: ({ event }: { event: HydrateEvent }) =>
					event.type === "HYDRATE" &&
					event.journey?.stateValue === "investor.intro",
				target: ".investor.intro",
				actions: "applyJourney",
			},
			{
				guard: ({ event }: { event: HydrateEvent }) =>
					event.type === "HYDRATE" &&
					event.journey?.stateValue === "investor.profile",
				target: ".investor.profile",
				actions: "applyJourney",
			},
			{
				guard: ({ event }: { event: HydrateEvent }) =>
					event.type === "HYDRATE" &&
					event.journey?.stateValue === "investor.preferences",
				target: ".investor.preferences",
				actions: "applyJourney",
			},
			{
				guard: ({ event }: { event: HydrateEvent }) =>
					event.type === "HYDRATE" &&
					event.journey?.stateValue === "investor.broker_selection",
				target: ".investor.broker_selection",
				actions: "applyJourney",
			},
			{
				guard: ({ event }: { event: HydrateEvent }) =>
					event.type === "HYDRATE" &&
					event.journey?.stateValue === "investor.kyc_documents",
				target: ".investor.kyc_documents",
				actions: "applyJourney",
			},
			{
				guard: ({ event }: { event: HydrateEvent }) =>
					event.type === "HYDRATE" &&
					event.journey?.stateValue === "investor.kyc_stub",
				target: ".investor.kyc_stub",
				actions: "applyJourney",
			},
			{
				guard: ({ event }: { event: HydrateEvent }) =>
					event.type === "HYDRATE" &&
					event.journey?.stateValue === "investor.documentsStub",
				target: ".investor.documentsStub",
				actions: "applyJourney",
			},
			{
				guard: ({ event }: { event: HydrateEvent }) =>
					event.type === "HYDRATE" &&
					event.journey?.stateValue === "investor.review",
				target: ".investor.review",
				actions: "applyJourney",
			},
			{
				guard: ({ event }: { event: HydrateEvent }) =>
					event.type === "HYDRATE" &&
					event.journey?.stateValue === "broker.intro",
				target: ".broker.intro",
				actions: "applyJourney",
			},
			{
				guard: ({ event }: { event: HydrateEvent }) =>
					event.type === "HYDRATE" &&
					event.journey?.stateValue === "broker.company_info",
				target: ".broker.company_info",
				actions: "applyJourney",
			},
			{
				guard: ({ event }: { event: HydrateEvent }) =>
					event.type === "HYDRATE" &&
					event.journey?.stateValue === "broker.licensing",
				target: ".broker.licensing",
				actions: "applyJourney",
			},
			{
				guard: ({ event }: { event: HydrateEvent }) =>
					event.type === "HYDRATE" &&
					event.journey?.stateValue === "broker.representatives",
				target: ".broker.representatives",
				actions: "applyJourney",
			},
			{
				guard: ({ event }: { event: HydrateEvent }) =>
					event.type === "HYDRATE" &&
					event.journey?.stateValue === "broker.documents",
				target: ".broker.documents",
				actions: "applyJourney",
			},
			{
				guard: ({ event }: { event: HydrateEvent }) =>
					event.type === "HYDRATE" &&
					event.journey?.stateValue === "broker.review",
				target: ".broker.review",
				actions: "applyJourney",
			},
			{
				guard: ({ event }: { event: HydrateEvent }) =>
					event.type === "HYDRATE" &&
					event.journey?.stateValue === "broker.pending_admin",
				target: ".broker.pending_admin",
				actions: "applyJourney",
			},
			{
				guard: ({ event }: { event: HydrateEvent }) =>
					event.type === "HYDRATE" &&
					event.journey?.stateValue === "broker.rejected",
				target: ".broker.rejected",
				actions: "applyJourney",
			},
			{
				guard: ({ event }: { event: HydrateEvent }) =>
					event.type === "HYDRATE" &&
					event.journey?.stateValue === "lawyer.intro",
				target: ".lawyer.intro",
				actions: "applyJourney",
			},
			{
				guard: ({ event }: { event: HydrateEvent }) =>
					event.type === "HYDRATE" &&
					event.journey?.stateValue === "lawyer.profile",
				target: ".lawyer.profile",
				actions: "applyJourney",
			},
			{
				guard: ({ event }: { event: HydrateEvent }) =>
					event.type === "HYDRATE" &&
					event.journey?.stateValue === "lawyer.identity_verification",
				target: ".lawyer.identity_verification",
				actions: "applyJourney",
			},
			{
				guard: ({ event }: { event: HydrateEvent }) =>
					event.type === "HYDRATE" &&
					event.journey?.stateValue === "lawyer.lso_verification",
				target: ".lawyer.lso_verification",
				actions: "applyJourney",
			},
			{
				guard: ({ event }: { event: HydrateEvent }) =>
					event.type === "HYDRATE" &&
					event.journey?.stateValue === "lawyer.review",
				target: ".lawyer.review",
				actions: "applyJourney",
			},
			{
				guard: ({ event }: { event: HydrateEvent }) =>
					event.type === "HYDRATE" &&
					event.journey?.stateValue === "lawyer.pending_admin",
				target: ".lawyer.pending_admin",
				actions: "applyJourney",
			},
			{
				guard: ({ event }: { event: HydrateEvent }) =>
					event.type === "HYDRATE" &&
					event.journey?.stateValue === "lawyer.rejected",
				target: ".lawyer.rejected",
				actions: "applyJourney",
			},
			{
				guard: ({ event }: { event: HydrateEvent }) =>
					event.type === "HYDRATE" &&
					event.journey?.stateValue === "lawyer.placeholder",
				target: ".lawyer.intro",
				actions: "applyJourney",
			},
			// Borrower HYDRATE handlers
			{
				guard: ({ event }: { event: HydrateEvent }) =>
					event.type === "HYDRATE" &&
					event.journey?.stateValue === "borrower.intro",
				target: ".borrower.intro",
				actions: "applyJourney",
			},
			{
				guard: ({ event }: { event: HydrateEvent }) =>
					event.type === "HYDRATE" &&
					event.journey?.stateValue === "borrower.profile",
				target: ".borrower.profile",
				actions: "applyJourney",
			},
			{
				guard: ({ event }: { event: HydrateEvent }) =>
					event.type === "HYDRATE" &&
					event.journey?.stateValue === "borrower.identity_verification",
				target: ".borrower.identity_verification",
				actions: "applyJourney",
			},
			{
				guard: ({ event }: { event: HydrateEvent }) =>
					event.type === "HYDRATE" &&
					event.journey?.stateValue === "borrower.kyc_aml",
				target: ".borrower.kyc_aml",
				actions: "applyJourney",
			},
			{
				guard: ({ event }: { event: HydrateEvent }) =>
					event.type === "HYDRATE" &&
					event.journey?.stateValue === "borrower.rotessa_setup",
				target: ".borrower.rotessa_setup",
				actions: "applyJourney",
			},
			{
				guard: ({ event }: { event: HydrateEvent }) =>
					event.type === "HYDRATE" &&
					event.journey?.stateValue === "borrower.review",
				target: ".borrower.review",
				actions: "applyJourney",
			},
			{
				guard: ({ event }: { event: HydrateEvent }) =>
					event.type === "HYDRATE" &&
					event.journey?.stateValue === "borrower.pending_admin",
				target: ".borrower.pending_admin",
				actions: "applyJourney",
			},
			{
				guard: ({ event }: { event: HydrateEvent }) =>
					event.type === "HYDRATE" &&
					event.journey?.stateValue === "borrower.rejected",
				target: ".borrower.rejected",
				actions: "applyJourney",
			},
			{
				guard: ({ event }: { event: HydrateEvent }) =>
					event.type === "HYDRATE" &&
					event.journey?.stateValue === "borrower.approved",
				target: ".borrower.approved",
				actions: "applyJourney",
			},
			{
				guard: ({ event }: { event: HydrateEvent }) =>
					event.type === "HYDRATE" && event.journey?.stateValue !== undefined,
				target: ".personaSelection",
				actions: "applyJourney",
			},
			{
				target: ".personaSelection",
				actions: "applyJourney",
			},
		],
	},
	states: {
		loading: {
			always: {
				target: "personaSelection",
			},
		},
		personaSelection: {},
		investor: {
			initial: "intro",
			states: {
				intro: {},
				broker_selection: {},
				profile: {},
				preferences: {},
				kyc_documents: {},
				kyc_stub: {},
				documentsStub: {},
				review: {},
				pending_admin: {},
				rejected: {},
				approved: {},
			},
		},
		broker: {
			initial: "intro",
			states: {
				intro: {},
				company_info: {},
				licensing: {},
				representatives: {},
				documents: {},
				review: {},
				pending_admin: {},
				rejected: {},
			},
		},
		lawyer: {
			initial: "intro",
			states: {
				intro: {},
				profile: {},
				identity_verification: {},
				lso_verification: {},
				review: {},
				pending_admin: {},
				rejected: {},
				placeholder: {},
			},
		},
		borrower: {
			initial: "intro",
			states: {
				intro: {},
				profile: {},
				identity_verification: {},
				kyc_aml: {},
				rotessa_setup: {},
				review: {},
				pending_admin: {},
				rejected: {},
				approved: {},
			},
		},
		pendingAdmin: {},
		rejected: {},
		completed: {},
	},
});

export type OnboardingSnapshot = ReturnType<
	(typeof onboardingMachine)["getInitialSnapshot"]
>;

export type { JourneyDoc };
