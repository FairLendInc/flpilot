import { SDK } from "@formance/formance-sdk";

let formanceClient: SDK | null = null;

/**
 * Get a singleton Formance SDK client instance.
 * The client is authenticated using FORMANCE_CLIENT_ID and FORMANCE_CLIENT_SECRET
 * environment variables.
 *
 * @returns Authenticated Formance SDK instance
 * @throws If required environment variables are not set
 */
async function resolveTokenUrl(serverURL: string): Promise<string> {
	const fallbackTokenUrl = `${serverURL}/api/auth/oauth/token`;
	try {
		const discoveryUrl = `${serverURL}/api/auth/.well-known/openid-configuration`;
		const response = await fetch(discoveryUrl);
		if (!response.ok) {
			return fallbackTokenUrl;
		}
		const data = (await response.json()) as { token_endpoint?: string };
		return data.token_endpoint ?? fallbackTokenUrl;
	} catch {
		return fallbackTokenUrl;
	}
}

export async function getFormanceClient(): Promise<SDK> {
	if (!formanceClient) {
		const clientID = process.env.FORMANCE_CLIENT_ID;
		const clientSecret = process.env.FORMANCE_CLIENT_SECRET;
		const serverURL = process.env.FORMANCE_SERVER_URL;

		if (!(clientID && clientSecret)) {
			throw new Error(
				"Missing Formance credentials. Ensure FORMANCE_CLIENT_ID and FORMANCE_CLIENT_SECRET are set."
			);
		}

		if (!serverURL) {
			throw new Error(
				"Missing Formance server URL. Set FORMANCE_SERVER_URL environment variable."
			);
		}

		// Resolve token URL via OIDC discovery with fallback
		const tokenURL = await resolveTokenUrl(serverURL);

		formanceClient = new SDK({
			serverURL,
			security: {
				clientID,
				clientSecret,
				tokenURL,
			},
		});
	}
	return formanceClient;
}

/**
 * Reset the Formance client (useful for testing or credential rotation)
 */
export function resetFormanceClient(): void {
	formanceClient = null;
}

/**
 * Default ledger name for the application
 */
export const DEFAULT_LEDGER = "flpilot";

/**
 * Asset definitions used in the ledger
 */
export const ASSETS = {
	/** Canadian Dollar with 2 decimal precision */
	CAD: "CAD",
	/** Mortgage share token pattern - use getMortgageShareAsset(mortgageId) */
	MORTGAGE_SHARE: (mortgageId: string) => `M${mortgageId}/SHARE`,
} as const;

/**
 * Account path patterns for the ledger
 */
export const ACCOUNTS = {
	/** Mortgage issuance (source of share tokens) */
	mortgageIssuance: (mortgageId: string) => `mortgage:${mortgageId}:issuance`,
	/** Mortgage liquidity (incoming payments) */
	mortgageLiquidity: (mortgageId: string) => `mortgage:${mortgageId}:liquidity`,
	/** Mortgage interest payable (liability) */
	mortgageInterestPayable: (mortgageId: string) =>
		`mortgage:${mortgageId}:interest_payable`,
	/** Platform inventory (holds unsold shares) */
	platformInventory: "fairlend:inventory",
	/** Platform receivables */
	platformReceivables: "fairlend:receivables",
	/** Investor inventory (shares owned) */
	investorInventory: (userId: string) => `investor:${userId}:inventory`,
	/** Investor receivables (accrued interest) */
	investorReceivables: (userId: string) => `investor:${userId}:receivables`,
	/** Investor cash (ready for withdrawal) */
	investorCash: (userId: string) => `investor:${userId}:cash`,
	/** World account (infinite source/sink) */
	world: "world",
} as const;
