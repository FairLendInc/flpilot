/**
 * MIC Management Store
 *
 * Stand-in for Convex functions during UI development.
 * Manages the state of MIC entities and mock actions.
 */

import { create } from "zustand";
import {
	type AUMState,
	generateMockAUMs,
	generateMockDistributions,
	generateMockInvestors,
	generateMockMetrics,
	type MICAUM,
	type MICDistribution,
	type MICInvestor,
	type MICMetrics,
} from "./mic-mock-data";

type MICStore = {
	// Data
	investors: MICInvestor[];
	aums: MICAUM[];
	distributions: MICDistribution[];
	metrics: MICMetrics;
	isLoading: boolean;

	// Actions
	setLoading: (isLoading: boolean) => void;

	// Investor Actions
	addInvestor: (
		data: Omit<
			MICInvestor,
			| "id"
			| "miccapBalance"
			| "micgovBalance"
			| "ownershipPercentage"
			| "status"
		>
	) => void;
	redeemInvestor: (id: string, units: number) => void;

	// AUM Actions
	addAUM: (
		data: Omit<MICAUM, "id" | "accruedInterest" | "nextPaymentDate" | "state">
	) => void;
	sellAUM: (
		id: string,
		percentage: number,
		_buyerId: string,
		proceeds: number
	) => void;
	updateAUMState: (id: string, state: AUMState) => void;

	// Distribution Actions
	runDistribution: (period: string) => void;

	// Demo Control
	resetDemo: () => void;
};

export const useMICStore = create<MICStore>((set) => ({
	investors: generateMockInvestors(),
	aums: generateMockAUMs(),
	distributions: generateMockDistributions(),
	metrics: generateMockMetrics(),
	isLoading: false,

	setLoading: (isLoading) => set({ isLoading }),

	addInvestor: (data) =>
		set((state) => {
			const newInvestor: MICInvestor = {
				...data,
				id: crypto.randomUUID(),
				miccapBalance: 0,
				micgovBalance: 0,
				ownershipPercentage: 0,
				status: "active",
			};
			return { investors: [...state.investors, newInvestor] };
		}),

	redeemInvestor: (id, units) =>
		set((state) => ({
			investors: state.investors.map((inv) =>
				inv.id === id
					? { ...inv, miccapBalance: Math.max(0, inv.miccapBalance - units) }
					: inv
			),
		})),

	addAUM: (data) =>
		set((state) => ({
			aums: [
				...state.aums,
				{
					...data,
					id: `M-${crypto.randomUUID()}`,
					state: "active",
					accruedInterest: 0,
					nextPaymentDate: new Date(
						Date.now() + 30 * 24 * 60 * 60 * 1000
					).toISOString(),
				},
			],
		})),

	sellAUM: (id, percentage, _buyerId, proceeds) =>
		set((state) => {
			const target = state.aums.find((aum) => aum.id === id);
			if (!target || percentage > target.micOwnership) {
				return state;
			}
			return {
				aums: state.aums.map((aum) =>
					aum.id === id
						? { ...aum, micOwnership: aum.micOwnership - percentage }
						: aum
				),
				metrics: {
					...state.metrics,
					cashBalance: state.metrics.cashBalance + proceeds,
				},
			};
		}),

	updateAUMState: (id, state) =>
		set((prev) => ({
			aums: prev.aums.map((aum) => (aum.id === id ? { ...aum, state } : aum)),
		})),

	runDistribution: (period) =>
		set((state) => {
			const newDist: MICDistribution = {
				id: crypto.randomUUID(),
				period,
				status: "completed",
				distributableCash: state.metrics.cashBalance,
				investorCount: state.investors.filter((i) => i.miccapBalance > 0)
					.length,
				executionDate: new Date().toISOString(),
			};
			return {
				distributions: [newDist, ...state.distributions],
				metrics: { ...state.metrics, cashBalance: 0 }, // Net-zero invariant
			};
		}),

	resetDemo: () =>
		set({
			investors: generateMockInvestors(),
			aums: generateMockAUMs(),
			distributions: generateMockDistributions(),
			metrics: generateMockMetrics(),
		}),
}));
