import { assign, setup } from "xstate";
import type { Doc } from "@/convex/_generated/dataModel";

type JourneyDoc = Doc<"onboarding_journeys">;

export type OnboardingStateValue =
	| "loading"
	| "personaSelection"
	| "investor.intro"
	| "investor.profile"
	| "investor.preferences"
	| "investor.kycStub"
	| "investor.documentsStub"
	| "investor.review"
	| "broker.intro"
	| "broker.company_info"
	| "broker.licensing"
	| "broker.representatives"
	| "broker.documents"
	| "broker.review"
	| "broker.pending_admin"
	| "broker.rejected"
	| "lawyer.placeholder"
	| "pendingAdmin"
	| "rejected"
	| "completed";

type MachineContext = {
	persona: JourneyDoc["persona"] | "unselected";
	status: JourneyDoc["status"];
	investor: NonNullable<JourneyDoc["context"]>["investor"];
	broker: NonNullable<JourneyDoc["context"]>["broker"];
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
					event.stateValue === "investor.kycStub",
				target: ".investor.kycStub",
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
					event.journey?.stateValue === "investor.kycStub",
				target: ".investor.kycStub",
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
				profile: {},
				preferences: {},
				kycStub: {},
				documentsStub: {},
				review: {},
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
			initial: "placeholder",
			states: {
				placeholder: {},
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
