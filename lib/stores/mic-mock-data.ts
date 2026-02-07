/**
 * MIC Mock Data Generators
 *
 * Provides typed mock data for the MIC Admin module based on the
 * requirements in docs/LEDGER-MIC/requirement.md and UI-design.md
 */

export type AUMState = "active" | "repaid" | "defaulted" | "pending";

export type MICInvestor = {
	id: string;
	name: string;
	email: string;
	avatar?: string;
	miccapBalance: number; // In cents
	micgovBalance: number;
	ownershipPercentage: number;
	lastDistributionDate?: string;
	status: "active" | "pending_redemption" | "frozen";
};

export type MICAUM = {
	id: string;
	address: string;
	principal: number; // In cents
	micOwnership: number; // 0-100
	interestRate: number; // Annual 0-100
	state: AUMState;
	accruedInterest: number; // In cents
	nextPaymentDate: string;
	originationDate: string;
};

export type MICDistribution = {
	id: string;
	period: string; // e.g., "2024-12"
	status: "completed" | "pending" | "failed";
	distributableCash: number;
	investorCount: number;
	executionDate?: string;
};

export type MICMetrics = {
	totalAUM: number;
	totalCapital: number;
	totalCapitalDeployed: number;
	micValue: number;
	investorCount: number;
	cashBalance: number;
	targetCash: number; // Usually 0 for net-zero
	interestEarned: number;
	lendingFees: number;
};

export function generateMockInvestors(): MICInvestor[] {
	return [
		{
			id: "inv1",
			name: "John Doe",
			email: "john@example.com",
			miccapBalance: 25000000, // $250,000.00
			micgovBalance: 100,
			ownershipPercentage: 100,
			lastDistributionDate: "2024-11-30",
			status: "active",
		},
		{
			id: "inv2",
			name: "Jane Smith",
			email: "jane@example.com",
			miccapBalance: 0,
			micgovBalance: 0,
			ownershipPercentage: 0,
			status: "active",
		},
	];
}

export function generateMockAUMs(): MICAUM[] {
	return [
		{
			id: "M123",
			address: "123 Maple St, Toronto, ON",
			principal: 10000000, // $100,000.00
			micOwnership: 100,
			interestRate: 10.5,
			state: "active",
			accruedInterest: 41667, // $416.67
			nextPaymentDate: "2025-01-01",
			originationDate: "2024-11-15",
		},
		{
			id: "M124",
			address: "456 Oak Ave, Vancouver, BC",
			principal: 25000000, // $250,000.00
			micOwnership: 20,
			interestRate: 9.25,
			state: "active",
			accruedInterest: 19271, // Partial month
			nextPaymentDate: "2025-01-01",
			originationDate: "2024-12-01",
		},
	];
}

export function generateMockDistributions(): MICDistribution[] {
	return [
		{
			id: "dist-2024-11",
			period: "2024-11",
			status: "completed",
			distributableCash: 2150000,
			investorCount: 1,
			executionDate: "2024-12-01",
		},
		{
			id: "dist-2024-12",
			period: "2024-12",
			status: "pending",
			distributableCash: 2580000,
			investorCount: 1,
		},
	];
}

export function generateMockMetrics(): MICMetrics {
	return {
		totalAUM: 35000000, // $350k
		totalCapital: 25000000, // $250k
		totalCapitalDeployed: 32500000, // $325k
		micValue: 47550000, // $475.5k (325k + 150.5k)
		investorCount: 1,
		cashBalance: 15050000, // $150.5k
		targetCash: 10000000, // $100k reserve
		interestEarned: 2450000, // $24.5k
		lendingFees: 850000, // $8.5k
	};
}

export const RECENT_ACTIVITY = [
	{
		id: "act1",
		type: "subscription",
		investor: "John Doe",
		amount: 25000000,
		timestamp: "2024-11-14T10:00:00Z",
	},
	{
		id: "act2",
		type: "origination",
		aum: "M123",
		amount: 10000000,
		timestamp: "2024-11-15T14:30:00Z",
	},
	{
		id: "act3",
		type: "fee",
		description: "Listing Fee M123",
		amount: 50000,
		timestamp: "2024-11-15T14:35:00Z",
	},
];
