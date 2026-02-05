/**
 * MIC Numscript Templates
 *
 * Centralized numscript definitions for MIC ledger operations.
 * These scripts follow the patterns defined in docs/LEDGER-MIC/requirement.md
 * and docs/LEDGER-MIC/e2eSampleFlow.mermaid
 *
 * Money Flow Summary:
 * 1. STEP_A0: Investor subscribes → external:bank → mic:cash, treasury → investor capital
 * 2. STEP_B1: Origination → mic:cash → borrower (netted lending fee)
 * 3. STEP_H:  Month-end → borrower pays interest → collect → settles to mic:cash
 * 4. STEP_H5: Distribution → mic:cash → distribution:payable → investor:wallet
 */

export const MIC_LEDGER_NAME = "mic";
export const MIC_ID = "FLMIC";

// ============================================================================
// Account Address Helpers
// ============================================================================

export const MIC_ACCOUNTS = {
	// Core MIC accounts
	cash: `mic:${MIC_ID}:cash`,
	cashIncome: `mic:${MIC_ID}:cash:income`,
	capitalTreasury: `mic:${MIC_ID}:capital:treasury`,
	distributionPayable: `mic:${MIC_ID}:distribution:payable`,

	// Income/Expense accounts
	lendingFeeAccrued: `mic:${MIC_ID}:income:lending_fee_accrued`,
	listingFeeAccrued: `mic:${MIC_ID}:expense:listing_fee_accrued`,
	fundMgmtAccrued: `mic:${MIC_ID}:expense:fund_mgmt_accrued`,

	// External accounts
	platform: "external:platform",
	fundManager: "external:fund_manager",
	externalBank: "external:bank",

	// Mortgage-level accounts
	borrower: (mortgageId: string) => `external:borrower:${mortgageId}`,
	interestReceivable: (mortgageId: string) =>
		`mortgage:${mortgageId}:interest_receivable`,
	interestCollect: (mortgageId: string) =>
		`mortgage:${mortgageId}:interest_collect`,
	accruedMIC: (mortgageId: string) =>
		`accrued:mortgage:${mortgageId}:investor:MIC_${MIC_ID}`,

	// Investor accounts
	investorCapital: (investorId: string) =>
		`mic:${MIC_ID}:capital:investor:${investorId}`,
	investorWallet: (investorId: string) => `investors:${investorId}:wallet`,
} as const;

// Assets - Formance pattern: [A-Z][A-Z0-9]{0,16}(/\d{1,6})?
// No hyphens allowed, only uppercase letters and numbers
export const ASSETS = {
	CAD: "CAD/2",
	MICCAP: "MICCAPFLMIC/0",
	MICGOV: "MICGOVFLMICPREF/0",
} as const;

// ============================================================================
// Numscript Templates - Aligned with e2eSampleFlow.mermaid
// ============================================================================

/**
 * STEP 0: Seed Treasury with MICCAP units
 *
 * This must run once to initialize the treasury with units it can issue.
 * In production, this would be a one-time admin operation.
 *
 * Variables:
 * - units: monetary - the total MICCAP units to mint into treasury
 */
export const SEED_TREASURY = `
vars {
  monetary $units
}

send $units (
  source = @world
  destination = @mic:FLMIC:capital:treasury
)
`;

/**
 * STEP A0: Investor Subscription
 * From requirement.md Section 7.1 "Add MIC Investor"
 * From e2eSampleFlow.mermaid STEP_A0_INVESTOR_SUBSCRIBE
 *
 * Money flows:
 * 1. investor:wallet → mic:cash (CAD subscription from investor)
 * 2. treasury → investor:capital (MICCAP issuance)
 *
 * Variables:
 * - investor_wallet: account - the investor's wallet (source of CAD)
 * - investor_capital: account - the investor's capital position account
 * - amount: monetary - the subscription amount in CAD
 * - units: monetary - the MICCAP units to issue
 */
export const INVESTOR_SUBSCRIBE = `
vars {
  account $investor_wallet
  account $investor_capital
  monetary $amount
  monetary $units
}

send $amount (
  source = $investor_wallet
  destination = @mic:FLMIC:cash
)

send $units (
  source = @mic:FLMIC:capital:treasury
  destination = $investor_capital
)
`;

/**
 * STEP B1: Mortgage Origination with Netted Lending Fee
 * From requirement.md Section 4.1 "Origination"
 * From e2eSampleFlow.mermaid STEP_B1_ORIGINATION_NETTED_FEE
 *
 * Reality: Borrower receives P - lending_fee, principal booked at full P.
 *
 * Money flows:
 * 1. mic:cash → external:borrower (fund principal P)
 * 2. external:borrower → mic:income:lending_fee_accrued (1% of P)
 *
 * Net MIC cash outflow = P - fee
 *
 * Variables:
 * - borrower: account - the borrower's external account
 * - principal: monetary - the full principal amount
 * - lending_fee: monetary - 1% of principal
 */
export const MORTGAGE_ORIGINATION = `
vars {
  account $borrower
  monetary $principal
  monetary $lending_fee
}

send $principal (
  source = @mic:FLMIC:cash
  destination = $borrower
)

send $lending_fee (
  source = $borrower
  destination = @mic:FLMIC:income:lending_fee_accrued
)
`;

/**
 * STEP H: Month-End Interest Collection
 * From requirement.md Section 6.2 "Settlement Order"
 * From e2eSampleFlow.mermaid STEP_H_MONTH_END_SETTLEMENT
 *
 * Simplified for demo: Borrower pays interest → directly to MIC cash.
 * (Full production would go through collect → settle accrued → MIC cash)
 *
 * Money flows:
 * 1. external:borrower → mic:cash (interest payment)
 *
 * Variables:
 * - borrower: account - the borrower's external account
 * - interest: monetary - the interest payment amount
 */
export const COLLECT_INTEREST = `
vars {
  account $borrower
  monetary $interest
}

send $interest (
  source = $borrower
  destination = @mic:FLMIC:cash:income
)
`;

/**
 * STEP H5: MIC Distribution (Net-Zero Policy)
 * From requirement.md Section 6.2 Step 4 "MIC investor distributions"
 * From e2eSampleFlow.mermaid STEP_H5_MIC_DISTRIBUTIONS_NET0
 *
 * Money flows:
 * 1. mic:cash → mic:distribution:payable (declare distributable)
 * 2. mic:distribution:payable → investors:INV_ID:wallet (pay dividend)
 *
 * Post-condition: mic:cash == 0
 *
 * Variables:
 * - investor_wallet: account - the investor's wallet
 * - amount: monetary - the payout amount
 */
export const DISTRIBUTE_DIVIDEND = `
vars {
  account $investor_wallet
  monetary $amount
}

send $amount (
  source = @mic:FLMIC:cash:income
  destination = @mic:FLMIC:distribution:payable
)

send $amount (
  source = @mic:FLMIC:distribution:payable
  destination = $investor_wallet
)
`;

/**
 * STEP C: Listing Fee Payment
 * From requirement.md Section 4.2 "Listing Fee"
 * From e2eSampleFlow.mermaid STEP_C_LISTING_FEE
 *
 * Money flows:
 * 1. mic:cash → mic:expense:listing_fee_accrued (accrue fee)
 * 2. mic:expense:listing_fee_accrued → external:platform (pay fee)
 *
 * Variables:
 * - fee: monetary - the listing fee amount (0.5% of principal)
 */
export const PAY_LISTING_FEE = `
vars {
  monetary $fee
}

send $fee (
  source = @mic:FLMIC:cash
  destination = @mic:FLMIC:expense:listing_fee_accrued
)

send $fee (
  source = @mic:FLMIC:expense:listing_fee_accrued
  destination = @external:platform
)
`;

/**
 * STEP H4: Fund Management Fee
 * From requirement.md Section 6.2 "MIC-level expenses"
 * From e2eSampleFlow.mermaid STEP_H4_FUND_MGMT_FEE
 *
 * Money flows:
 * 1. mic:cash → mic:expense:fund_mgmt_accrued (accrue fee)
 * 2. mic:expense:fund_mgmt_accrued → external:fund_manager (pay fee)
 *
 * Variables:
 * - fee: monetary - the management fee amount
 */
export const PAY_FUND_MGMT_FEE = `
vars {
  monetary $fee
}

send $fee (
  source = @mic:FLMIC:cash
  destination = @mic:FLMIC:expense:fund_mgmt_accrued
)

send $fee (
  source = @mic:FLMIC:expense:fund_mgmt_accrued
  destination = @external:fund_manager
)
`;

// ============================================================================
// Variable Builders
// ============================================================================

/**
 * Format a monetary variable for Formance
 * @param asset - The asset code (e.g., "CAD/2")
 * @param amount - The amount in base units (cents for CAD/2)
 */
export function formatMonetary(asset: string, amount: number): string {
	return `${asset} ${amount}`;
}

/**
 * Build variables for seeding treasury
 */
export function buildSeedTreasuryVars(unitsCents: number) {
	return {
		units: formatMonetary(ASSETS.MICCAP, unitsCents),
	};
}

/**
 * Build variables for investor subscription
 */
export function buildSubscribeVars(investorId: string, amountCents: number) {
	return {
		investor_wallet: MIC_ACCOUNTS.investorWallet(investorId),
		investor_capital: MIC_ACCOUNTS.investorCapital(investorId),
		amount: formatMonetary(ASSETS.CAD, amountCents),
		units: formatMonetary(ASSETS.MICCAP, amountCents),
	};
}

/**
 * Build variables for interest collection
 */
export function buildCollectInterestVars(
	mortgageId: string,
	interestCents: number
) {
	return {
		borrower: MIC_ACCOUNTS.borrower(mortgageId),
		interest: formatMonetary(ASSETS.CAD, interestCents),
	};
}

/**
 * Build variables for dividend distribution
 */
export function buildDistributeVars(investorId: string, amountCents: number) {
	return {
		investor_wallet: MIC_ACCOUNTS.investorWallet(investorId),
		amount: formatMonetary(ASSETS.CAD, amountCents),
	};
}

/**
 * Build variables for mortgage origination
 */
export function buildOriginationVars(
	mortgageId: string,
	principalCents: number,
	lendingFeeCents: number
) {
	return {
		borrower: MIC_ACCOUNTS.borrower(mortgageId),
		principal: formatMonetary(ASSETS.CAD, principalCents),
		lending_fee: formatMonetary(ASSETS.CAD, lendingFeeCents),
	};
}
