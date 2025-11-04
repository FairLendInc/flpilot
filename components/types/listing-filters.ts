export type MortgageType = "First" | "Second" | "Other";

export type PropertyType =
	| "Detached Home"
	| "Duplex"
	| "Triplex"
	| "Apartment"
	| "Condo"
	| "Cottage"
	| "Townhouse"
	| "Commercial"
	| "Mixed-Use"
	| "Other";

export type FilterState = {
	ltvRange: [number, number];
	interestRateRange: [number, number];
	loanAmountRange: [number, number];
	loanAmountMin: number;
	loanAmountMax: number;
	mortgageTypes: MortgageType[];
	propertyTypes: PropertyType[];
	searchQuery: string;
	maturityDate?: Date;
};

export const FILTER_BOUNDS = {
	ltvRange: [30, 80] as [number, number],
	interestRateRange: [3, 15] as [number, number],
	loanAmountRange: [0, 5000000] as [number, number],
	loanAmountMin: 0,
	loanAmountMax: 5000000,
} as const;

export const DEFAULT_FILTERS: FilterState = {
	ltvRange: FILTER_BOUNDS.ltvRange,
	interestRateRange: FILTER_BOUNDS.interestRateRange,
	loanAmountRange: FILTER_BOUNDS.loanAmountRange,
	loanAmountMin: FILTER_BOUNDS.loanAmountMin,
	loanAmountMax: FILTER_BOUNDS.loanAmountMax,
	mortgageTypes: [],
	propertyTypes: [],
	searchQuery: "",
	maturityDate: undefined,
};
