/**
 * Numscript template metadata
 */
export type NumscriptTemplate = {
	/** Unique identifier for the template */
	id: string;
	/** Human-readable name */
	name: string;
	/** Description of what this numscript does */
	description: string;
	/** The raw numscript content */
	script: string;
	/** Variable definitions with their types and descriptions */
	variables: NumscriptVariable[];
};

export type NumscriptVariable = {
	/** Variable name (without $) */
	name: string;
	/** Variable type: account or monetary */
	type: "account" | "monetary";
	/** Description of the variable */
	description: string;
	/** Optional example value */
	example?: string;
};

// Numscript contents defined inline (TypeScript doesn't support raw file imports)
const mintSharesNumscript = `// Mint Shares Numscript
vars {
  account $mortgage_issuance
  account $platform_inventory
  monetary $amount
}

send $amount (
  source = $mortgage_issuance
  destination = $platform_inventory
)`;

const transferSharesNumscript = `// Transfer Shares Numscript
vars {
  account $source_account
  account $destination_account
  monetary $shares
}

send $shares (
  source = $source_account
  destination = $destination_account
)`;

const bookInterestNumscript = `// Book Interest Accrual Numscript
vars {
  account $mortgage_interest_payable
  account $investor_receivables
  monetary $accrued_amount
}

send $accrued_amount (
  source = $mortgage_interest_payable
  destination = $investor_receivables
)`;

const receivePaymentNumscript = `// Receive Payment Numscript
vars {
  account $mortgage_liquidity
  monetary $payment_amount
}

send $payment_amount (
  source = @world
  destination = $mortgage_liquidity
)`;

const testPayment1 = `vars {
  monetary $amount
  account $destination
  account $source
}

send $amount (
  source = $source
  destination = $destination
)`;

const testPayment2 = `vars {
  monetary $amount
  
}
send $amount (
  source = @world
  destination = @rider:xx:ride:yy:payment
)`;

const distributeFundsNumscript = `// Distribute Funds Numscript
vars {
  account $mortgage_liquidity
  account $investor_cash
  monetary $payout_amount
}

send $payout_amount (
  source = $mortgage_liquidity
  destination = $investor_cash
)`;

/**
 * All available numscript templates
 */
export const NUMSCRIPT_TEMPLATES: NumscriptTemplate[] = [
	{
		id: "mint-shares",
		name: "Mint Shares",
		description:
			"Issue mortgage shares from the issuance account to the platform inventory.",
		script: mintSharesNumscript,
		variables: [
			{
				name: "mortgage_issuance",
				type: "account",
				description: "Source account for share issuance",
				example: "mortgage:M123:issuance",
			},
			{
				name: "platform_inventory",
				type: "account",
				description: "Destination account for shares",
				example: "fairlend:inventory",
			},
			{
				name: "amount",
				type: "monetary",
				description: "Amount of shares to mint",
				example: "M123/SHARE 10000",
			},
		],
	},
	{
		id: "transfer-shares",
		name: "Transfer Shares",
		description: "Transfer mortgage shares from one account to another.",
		script: transferSharesNumscript,
		variables: [
			{
				name: "source_account",
				type: "account",
				description: "Account holding the shares",
				example: "fairlend:inventory",
			},
			{
				name: "destination_account",
				type: "account",
				description: "Account to receive shares",
				example: "investor:USER123:inventory",
			},
			{
				name: "shares",
				type: "monetary",
				description: "Amount of shares to transfer",
				example: "M123/SHARE 1000",
			},
		],
	},
	{
		id: "simple-transfer",
		name: "Simple Transfer",
		description:
			"Basic transfer of monetary value between two accounts. Useful for testing.",
		script: testPayment1,
		variables: [
			{
				name: "amount",
				type: "monetary",
				description: "Amount to transfer",
				example: "CAD 10000",
			},

			{
				name: "destination",
				type: "account",
				description: "Destination account",
				example: "rider:xx:ride:zz:payment",
			},
			{
				name: "source",
				type: "account",
				description: "Source account",
				example: "rider:xx:ride:yy:payment",
			},
		],
	},
	{
		id: "simple-transfer-2",
		name: "Simple Transfer 2",
		description:
			"Basic transfer of monetary value between two accounts. Useful for testing.",
		script: testPayment2,
		variables: [
			{
				name: "amount",
				type: "monetary",
				description: "Amount to transfer",
				example: "CAD 10000",
			},
		],
	},
	{
		id: "book-interest",
		name: "Book Interest Accrual",
		description: "Record interest accrued for an investor on a mortgage.",
		script: bookInterestNumscript,
		variables: [
			{
				name: "mortgage_interest_payable",
				type: "account",
				description: "Mortgage interest payable account",
				example: "mortgage:M123:interest_payable",
			},
			{
				name: "investor_receivables",
				type: "account",
				description: "Investor receivables account",
				example: "investor:USER123:receivables",
			},
			{
				name: "accrued_amount",
				type: "monetary",
				description: "Amount of interest accrued",
				example: "CAD 5000",
			},
		],
	},
	{
		id: "receive-payment",
		name: "Receive Payment",
		description:
			"Record an incoming borrower payment into the mortgage liquidity account.",
		script: receivePaymentNumscript,
		variables: [
			{
				name: "mortgage_liquidity",
				type: "account",
				description: "Mortgage liquidity account",
				example: "mortgage:M123:liquidity",
			},
			{
				name: "payment_amount",
				type: "monetary",
				description: "Amount received",
				example: "CAD 10000",
			},
		],
	},
	{
		id: "distribute-funds",
		name: "Distribute Funds",
		description:
			"Distribute funds from mortgage liquidity to an investor's cash account.",
		script: distributeFundsNumscript,
		variables: [
			{
				name: "mortgage_liquidity",
				type: "account",
				description: "Source liquidity account",
				example: "mortgage:M123:liquidity",
			},
			{
				name: "investor_cash",
				type: "account",
				description: "Investor cash account",
				example: "investor:USER123:cash",
			},
			{
				name: "payout_amount",
				type: "monetary",
				description: "Amount to pay out",
				example: "CAD 5000",
			},
		],
	},
];

/**
 * Get a numscript template by ID
 */
export function getNumscriptTemplate(
	id: string
): NumscriptTemplate | undefined {
	return NUMSCRIPT_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get all numscript template IDs
 */
export function getNumscriptTemplateIds(): string[] {
	return NUMSCRIPT_TEMPLATES.map((t) => t.id);
}
