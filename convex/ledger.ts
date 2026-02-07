"use node";

import { SDK } from "@formance/formance-sdk";
import { v } from "convex/values";
import { logger } from "../lib/logger";
import { env } from "./lib/env";
import { action, internalAction } from "./_generated/server";

/**
 * Formance Ledger Actions
 *
 * These actions interface with the Formance Ledger API to manage
 * ledgers, accounts, transactions, and execute numscripts.
 *
 * All actions run in Node.js environment and require Formance credentials
 * to be set in environment variables.
 */

// ============================================================================
// SDK Client
// ============================================================================

let formanceClient: SDK | null = null;

function getFormanceClient(): SDK {
	if (!formanceClient) {
		const clientID = env.FORMANCE_CLIENT_ID;
		const clientSecret = env.FORMANCE_CLIENT_SECRET;
		const serverURL = env.FORMANCE_SERVER_URL;

		if (!(clientID && clientSecret)) {
			throw new Error(
				"Missing Formance credentials. Ensure FORMANCE_CLIENT_ID and FORMANCE_CLIENT_SECRET are set in Convex environment."
			);
		}

		if (!serverURL) {
			throw new Error(
				"Missing Formance server URL. Set FORMANCE_SERVER_URL in Convex environment (e.g., https://orgID-stackID.sandbox.formance.cloud)"
			);
		}

		// Construct token URL from server URL
		const tokenURL = `${serverURL}/api/auth/oauth/token`;
		console.log("Formance client initialized TokenURL: ", tokenURL);

		formanceClient = new SDK({
			serverURL,
			security: {
				clientID,
				clientSecret,
				tokenURL,
			},
		});
	}
	console.log("Formance client initialized", formanceClient);
	return formanceClient;
}

function handleActionError(actionName: string, error: unknown) {
	logger.error(`${actionName} failed`, { error, actionName });
	return {
		success: false,
		error: error instanceof Error ? error.message : "Unknown error",
	};
}

/**
 * Sanitize SDK response to remove non-serializable objects (like rawResponse)
 * Convex cannot serialize Response objects
 */
function sanitizeResponse(result: unknown): unknown {
	if (result === null || result === undefined) return result;
	if (result instanceof Date) return result.toISOString();
	if (typeof result !== "object") return result;

	const obj = result as Record<string, unknown>;
	const sanitized: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(obj)) {
		// Skip rawResponse as it's a non-serializable Response object
		if (key === "rawResponse") continue;

		// Recursively sanitize nested objects
		if (value && typeof value === "object" && !Array.isArray(value)) {
			sanitized[key] = sanitizeResponse(value);
		} else if (Array.isArray(value)) {
			sanitized[key] = value.map((item) => sanitizeResponse(item));
		} else {
			sanitized[key] = value;
		}
	}

	return sanitized;
}

// ============================================================================
// Ledger Management
// ============================================================================

/**
 * List all ledgers in the Formance instance
 */
export const listLedgers = action({
	args: {
		pageSize: v.optional(v.number()),
	},
	returns: v.object({
		success: v.boolean(),
		data: v.optional(v.any()),
		error: v.optional(v.string()),
	}),
	handler: async (_, args) => {
		try {
			const sdk = getFormanceClient();
			const result = await sdk.ledger.v2.listLedgers({
				pageSize: args.pageSize ?? 15,
			});

			return {
				success: true,
				data: sanitizeResponse(result),
			};
		} catch (error) {
			return handleActionError("listLedgers", error);
		}
	},
});

/**
 * Create a new ledger
 */
export const createLedger = action({
	args: {
		ledgerName: v.string(),
		metadata: v.optional(v.record(v.string(), v.string())),
	},
	returns: v.object({
		success: v.boolean(),
		data: v.optional(v.any()),
		error: v.optional(v.string()),
	}),
	handler: async (_, args) => {
		try {
			const sdk = getFormanceClient();
			const result = await sdk.ledger.v2.createLedger({
				ledger: args.ledgerName,
				v2CreateLedgerRequest: {
					metadata: args.metadata ?? {},
				},
			});

			return {
				success: true,
				data: sanitizeResponse(result),
			};
		} catch (error) {
			return handleActionError("createLedger", error);
		}
	},
});

/**
 * Get ledger info
 */
export const getLedgerInfo = action({
	args: {
		ledgerName: v.string(),
	},
	returns: v.object({
		success: v.boolean(),
		data: v.optional(v.any()),
		error: v.optional(v.string()),
	}),
	handler: async (_, args) => {
		try {
			const sdk = getFormanceClient();
			const result = await sdk.ledger.v2.getLedgerInfo({
				ledger: args.ledgerName,
			});

			return {
				success: true,
				data: sanitizeResponse(result),
			};
		} catch (error) {
			return handleActionError("getLedgerInfo", error);
		}
	},
});

// ============================================================================
// Account Management
// ============================================================================

/**
 * List accounts in a ledger
 */
export const listAccounts = action({
	args: {
		ledgerName: v.string(),
		pageSize: v.optional(v.number()),
		cursor: v.optional(v.string()),
		expand: v.optional(v.string()),
	},
	returns: v.object({
		success: v.boolean(),
		data: v.optional(v.any()),
		error: v.optional(v.string()),
	}),
	handler: async (_, args) => {
		try {
			const sdk = getFormanceClient();
			const result = await sdk.ledger.v2.listAccounts({
				ledger: args.ledgerName,
				pageSize: args.pageSize ?? 100,
				cursor: args.cursor,
				expand: args.expand,
			});

			return {
				success: true,
				data: sanitizeResponse(result),
			};
		} catch (error) {
			console.log("error in listAccounts", error);
			return handleActionError("listAccounts", error);
		}
	},
});

/**
 * Get a specific account
 */
export const getAccount = action({
	args: {
		ledgerName: v.string(),
		address: v.string(),
	},
	returns: v.object({
		success: v.boolean(),
		data: v.optional(v.any()),
		error: v.optional(v.string()),
	}),
	handler: async (_, args) => {
		try {
			const sdk = getFormanceClient();
			const result = await sdk.ledger.v2.getAccount({
				ledger: args.ledgerName,
				address: args.address,
			});

			return {
				success: true,
				data: sanitizeResponse(result),
			};
		} catch (error) {
			return handleActionError("getAccount", error);
		}
	},
});

/**
 * Get aggregated balances for accounts
 */
export const getBalances = action({
	args: {
		ledgerName: v.string(),
		address: v.optional(v.string()),
	},
	returns: v.object({
		success: v.boolean(),
		data: v.optional(v.any()),
		error: v.optional(v.string()),
	}),
	handler: async (_, args) => {
		try {
			const sdk = getFormanceClient();
			const result = await sdk.ledger.v2.getBalancesAggregated({
				ledger: args.ledgerName,
				...(args.address ? { address: args.address } : {}),
			} as Parameters<typeof sdk.ledger.v2.getBalancesAggregated>[0]);

			return {
				success: true,
				data: sanitizeResponse(result),
			};
		} catch (error) {
			return handleActionError("getBalances", error);
		}
	},
});

// ============================================================================
// Transaction Management
// ============================================================================

/**
 * List transactions in a ledger
 */
export const listTransactions = action({
	args: {
		ledgerName: v.string(),
		pageSize: v.optional(v.number()),
		cursor: v.optional(v.string()),
	},
	returns: v.object({
		success: v.boolean(),
		data: v.optional(v.any()),
		error: v.optional(v.string()),
	}),
	handler: async (_, args) => {
		try {
			console.log("Listing transactiosn");
			const sdk = getFormanceClient();
			console.log("Formance client initialized!!!", sdk);
			// const versions = await sdk.getVersions();
			// console.log("versions", versions);

			// console.log("Formance client initialized!!!", sdk);
			console.log("args", args);
			const result = await sdk.ledger.v2.listTransactions({
				ledger: args.ledgerName,
				pageSize: args.pageSize ?? 100,
				cursor: args.cursor,
			});
			console.log("result", result);

			return {
				success: true,
				data: sanitizeResponse(result),
			};
		} catch (error) {
			console.log("error in listTransactions", error);
			return handleActionError("listTransactions", error);
		}
	},
});

/**
 * Get a specific transaction
 */
export const getTransaction = action({
	args: {
		ledgerName: v.string(),
		transactionId: v.string(),
	},
	returns: v.object({
		success: v.boolean(),
		data: v.optional(v.any()),
		error: v.optional(v.string()),
	}),
	handler: async (_, args) => {
		try {
			const sdk = getFormanceClient();
			const result = await sdk.ledger.v2.getTransaction({
				ledger: args.ledgerName,
				id: BigInt(args.transactionId),
			});

			return {
				success: true,
				data: sanitizeResponse(result),
			};
		} catch (error) {
			return handleActionError("getTransaction", error);
		}
	},
});

// ============================================================================
// Numscript Execution
// ============================================================================

/**
 * Execute a numscript transaction
 *
 * @param ledgerName - Name of the ledger
 * @param script - The numscript to execute
 * @param variables - Variables to pass to the numscript (key-value pairs)
 * @param dryRun - If true, validate but don't commit the transaction
 * @param reference - Optional unique reference for idempotency
 * @param metadata - Optional metadata to attach to the transaction
 */
export const executeNumscript = action({
	args: {
		ledgerName: v.string(),
		script: v.string(),
		variables: v.record(v.string(), v.string()), // Raw values
		reference: v.optional(v.string()),
		metadata: v.optional(v.any()), // Can be any JSON
		dryRun: v.optional(v.boolean()),
	},
	returns: v.object({
		success: v.boolean(),
		data: v.optional(v.any()),
		error: v.optional(v.string()),
	}),
	handler: async (_, args) => {
		try {
			// Validate env vars exist
			getFormanceClient();

			const serverURL = env.FORMANCE_SERVER_URL ?? "";
			const clientID = env.FORMANCE_CLIENT_ID ?? "";
			const clientSecret = env.FORMANCE_CLIENT_SECRET ?? "";

			// DEBUG: Log request details before API call
			logger.info("executeNumscript: Starting request", {
				ledgerName: args.ledgerName,
				script: args.script.substring(0, 200), // Truncate for readability
				variables: args.variables,
				reference: args.reference,
				dryRun: args.dryRun ?? false,
				hasMetadata: !!args.metadata,
			});

			// 1. Get Token
			const tokenResponse = await fetch(`${serverURL}/api/auth/oauth/token`, {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: new URLSearchParams({
					grant_type: "client_credentials",
					client_id: clientID,
					client_secret: clientSecret,
				}).toString(),
			});
			if (!tokenResponse.ok)
				throw new Error(`Failed to authenticate: ${tokenResponse.statusText}`);
			const { access_token } = await tokenResponse.json();

			// 2. Make Request
			// Map arguments to Formance Ledger v2 API body structure
			const body = {
				script: {
					plain: args.script,
					vars: args.variables,
				},
				reference: args.reference,
				metadata: args.metadata ?? {},
			};

			const dryRunValue = args.dryRun ?? false;
			const apiUrl = `${serverURL}/api/ledger/v2/${args.ledgerName}/transactions?dryRun=${dryRunValue}`;

			// DEBUG: Log full API URL and body
			logger.info("executeNumscript: Making API request", {
				apiUrl,
				dryRun: dryRunValue,
				body: JSON.stringify(body),
			});

			const apiResponse = await fetch(apiUrl, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${access_token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(body),
			});

			const text = await apiResponse.text();

			// DEBUG: Log full response
			logger.info("executeNumscript: API response received", {
				status: apiResponse.status,
				statusText: apiResponse.statusText,
				ok: apiResponse.ok,
				responseBody: text.substring(0, 1000), // Truncate for safety
			});

			if (apiResponse.ok) {
				let data: unknown;
				try {
					data = JSON.parse(text);
				} catch {
					throw new Error(
						`Invalid JSON response from Ledger API: ${text.substring(0, 100)}`
					);
				}

				// DEBUG: Log parsed response details
				const parsedData = data as Record<string, unknown>;
				const txData = parsedData?.data as Record<string, unknown> | undefined;
				logger.info("executeNumscript: Transaction successful", {
					transactionId: txData?.id,
					postings: txData?.postings,
					reference: txData?.reference,
					timestamp: txData?.timestamp,
				});

				return {
					success: true,
					data: sanitizeResponse(data),
				};
			}
			logger.error("Formance API Error", {
				status: apiResponse.status,
				statusText: apiResponse.statusText,
				body: text,
			});

			// Try to parse error details if available
			let errorDetails = text;
			try {
				if (text) {
					const jsonError = JSON.parse(text);
					errorDetails =
						jsonError.errorMessage ||
						jsonError.details ||
						jsonError.error ||
						JSON.stringify(jsonError);
				} else {
					errorDetails = `Empty response body (Status: ${apiResponse.status})`;
				}
			} catch {
				// text is not JSON, use it as is
			}

			throw new Error(
				`API Error (${apiResponse.status}): ${errorDetails || apiResponse.statusText}`
			);
		} catch (error) {
			return handleActionError("executeNumscript", error);
		}
	},
});

/**
 * Create a simple transaction using postings (no numscript)
 */
export const createSimpleTransaction = action({
	args: {
		ledgerName: v.string(),
		source: v.string(),
		destination: v.string(),
		asset: v.string(),
		amount: v.string(), // BigInt as string
		reference: v.optional(v.string()),
		metadata: v.optional(v.record(v.string(), v.string())),
		dryRun: v.optional(v.boolean()),
	},
	returns: v.object({
		success: v.boolean(),
		data: v.optional(v.any()),
		error: v.optional(v.string()),
	}),
	handler: async (_, args) => {
		try {
			const sdk = getFormanceClient();
			const result = await sdk.ledger.v2.createTransaction({
				ledger: args.ledgerName,
				dryRun: args.dryRun ?? false,
				v2PostTransaction: {
					postings: [
						{
							source: args.source,
							destination: args.destination,
							asset: args.asset,
							amount: BigInt(args.amount),
						},
					],
					reference: args.reference,
					metadata: args.metadata ?? {},
				},
			});

			return {
				success: true,
				data: sanitizeResponse(result),
			};
		} catch (error) {
			return handleActionError("createSimpleTransaction", error);
		}
	},
});

// ============================================================================
// Ledger Stats
// ============================================================================

/**
 * Get ledger statistics
 */
export const getLedgerStats = action({
	args: {
		ledgerName: v.string(),
	},
	returns: v.object({
		success: v.boolean(),
		data: v.optional(v.any()),
		error: v.optional(v.string()),
	}),
	handler: async (_, args) => {
		try {
			const sdk = getFormanceClient();
			const result = await sdk.ledger.v2.readStats({
				ledger: args.ledgerName,
			});

			return {
				success: true,
				data: sanitizeResponse(result),
			};
		} catch (error) {
			return handleActionError("getLedgerStats", error);
		}
	},
});

// ============================================================================
// Ownership-Specific Ledger Operations
// ============================================================================

const DEFAULT_LEDGER = "flmarketplace";

// Top-level regex for asset format validation
const NEW_ASSET_FORMAT_REGEX = /^M[A-Z0-9]+(\/\d+)?$/;

/**
 * Generate the share asset name for a mortgage
 *
 * Formance requires asset names to match pattern: [A-Z][A-Z0-9]{0,16}(\/\d{1,6})?
 * We use a deterministic hash of the mortgage ID to create a short, uppercase identifier.
 *
 * @example mortgageId "pn7f5gkwsk831e7f32arv9zwj97tw4j7" -> "M5B8F2A1C"
 */
function getMortgageShareAsset(mortgageId: string): string {
	// Create a simple hash from the mortgage ID (deterministic)
	let hash = 0;
	for (let i = 0; i < mortgageId.length; i += 1) {
		const char = mortgageId.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash &= hash; // Convert to 32-bit integer
	}

	// Convert hash to uppercase hex (8 chars max)
	const hexHash = Math.abs(hash).toString(16).toUpperCase().slice(0, 8);

	// Format: M + 8-char hash
	return `M${hexHash}`;
}

/**
 * Account path patterns for ownership tracking
 */
const OWNERSHIP_ACCOUNTS = {
	/** Mortgage issuance (source of share tokens - infinite mint) */
	mortgageIssuance: (mortgageId: string) => `mortgage:${mortgageId}:issuance`,
	/** FairLend inventory (holds unsold shares) */
	fairlendInventory: "fairlend:inventory",
	/** Investor inventory (shares owned by investor) */
	investorInventory: (userId: string) => `investor:${userId}:inventory`,
} as const;

/**
 * Initialize mortgage ownership in the ledger
 *
 * Creates 100 share tokens for a new mortgage and assigns them to FairLend.
 * This should be scheduled as an action after mortgage creation.
 *
 * @param mortgageId - The mortgage ID (Convex ID string)
 * @param reference - Idempotency key to prevent duplicate mints
 * @returns Result with transaction ID or error
 */
export const initializeMortgageOwnership = internalAction({
	args: {
		mortgageId: v.string(),
		reference: v.string(),
	},
	returns: v.object({
		success: v.boolean(),
		transactionId: v.optional(v.string()),
		error: v.optional(v.string()),
	}),
	handler: async (_ctx, args) => {
		const { mortgageId, reference } = args;
		const shareAsset = getMortgageShareAsset(mortgageId);

		// Numscript to mint 100 shares to FairLend
		// Using @world as infinite source (standard Formance pattern)
		const script = `
vars {
  asset $asset
}

send [$asset 100] (
  source = @world
  destination = @fairlend:inventory
)
`.trim();

		try {
			const _sdk = getFormanceClient();

			// Get token
			const serverURL = env.FORMANCE_SERVER_URL ?? "";
			const clientID = env.FORMANCE_CLIENT_ID ?? "";
			const clientSecret = env.FORMANCE_CLIENT_SECRET ?? "";

			const tokenResponse = await fetch(`${serverURL}/api/auth/oauth/token`, {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: new URLSearchParams({
					grant_type: "client_credentials",
					client_id: clientID,
					client_secret: clientSecret,
				}).toString(),
			});

			if (!tokenResponse.ok) {
				throw new Error(`Failed to authenticate: ${tokenResponse.statusText}`);
			}

			const { access_token } = await tokenResponse.json();

			// Execute numscript
			const body = {
				script: {
					plain: script,
					vars: {
						asset: shareAsset,
					},
				},
				reference,
				metadata: {
					type: "mortgage_ownership_init",
					mortgageId,
				},
			};

			const apiUrl = `${serverURL}/api/ledger/v2/${DEFAULT_LEDGER}/transactions`;
			const apiResponse = await fetch(apiUrl, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${access_token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(body),
			});

			const text = await apiResponse.text();

			if (apiResponse.ok) {
				const data = JSON.parse(text);
				const transactionId = data?.data?.id?.toString();

				logger.info("Initialized mortgage ownership in ledger", {
					mortgageId,
					transactionId,
					reference,
				});

				return { success: true, transactionId };
			}

			// Check for idempotency conflict
			if (apiResponse.status === 409) {
				logger.warn("Duplicate mortgage ownership init (idempotent)", {
					reference,
					mortgageId,
				});
				return { success: true };
			}

			logger.error("Failed to initialize mortgage ownership in ledger", {
				mortgageId,
				status: apiResponse.status,
				error: text,
			});

			return {
				success: false,
				error: `Ledger error (${apiResponse.status}): ${text}`,
			};
		} catch (error) {
			logger.error("Exception initializing mortgage ownership", {
				mortgageId,
				error,
			});
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	},
});

/**
 * Record ownership transfer in the ledger
 *
 * Transfers share tokens from one owner to another.
 * Used when ownership changes (e.g., investor purchase, deal completion).
 *
 * CRITICAL: Must be called as a scheduled action, never from a mutation.
 * See footguns.md #3.
 *
 * @param mortgageId - The mortgage ID
 * @param fromOwnerId - Source owner ("fairlend" or user ID)
 * @param toOwnerId - Destination owner ("fairlend" or user ID)
 * @param percentage - Percentage to transfer (0-100)
 * @param reference - Idempotency key (REQUIRED - see footguns.md #5)
 * @param dealId - Optional deal reference for audit
 */
export const recordOwnershipTransfer = internalAction({
	args: {
		mortgageId: v.string(),
		fromOwnerId: v.string(),
		toOwnerId: v.string(),
		percentage: v.number(),
		reference: v.string(),
		dealId: v.optional(v.string()),
	},
	returns: v.object({
		success: v.boolean(),
		transactionId: v.optional(v.string()),
		error: v.optional(v.string()),
	}),
	handler: async (_ctx, args) => {
		const {
			mortgageId,
			fromOwnerId,
			toOwnerId,
			percentage,
			reference,
			dealId,
		} = args;

		// Validate percentage
		if (percentage <= 0 || percentage > 100) {
			return { success: false, error: "Percentage must be between 0 and 100" };
		}

		// Convert percentage to share units (100% = 100 shares)
		const shareAmount = Math.round(percentage);
		const shareAsset = getMortgageShareAsset(mortgageId);

		// Determine source and destination accounts
		const sourceAccount =
			fromOwnerId === "fairlend"
				? OWNERSHIP_ACCOUNTS.fairlendInventory
				: OWNERSHIP_ACCOUNTS.investorInventory(fromOwnerId);

		const destAccount =
			toOwnerId === "fairlend"
				? OWNERSHIP_ACCOUNTS.fairlendInventory
				: OWNERSHIP_ACCOUNTS.investorInventory(toOwnerId);

		// Numscript for transfer
		const script = `
vars {
  asset $asset
}

send [$asset ${shareAmount}] (
  source = @${sourceAccount}
  destination = @${destAccount}
)
`.trim();

		try {
			const serverURL = env.FORMANCE_SERVER_URL ?? "";
			const clientID = env.FORMANCE_CLIENT_ID ?? "";
			const clientSecret = env.FORMANCE_CLIENT_SECRET ?? "";

			const tokenResponse = await fetch(`${serverURL}/api/auth/oauth/token`, {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: new URLSearchParams({
					grant_type: "client_credentials",
					client_id: clientID,
					client_secret: clientSecret,
				}).toString(),
			});

			if (!tokenResponse.ok) {
				throw new Error(`Failed to authenticate: ${tokenResponse.statusText}`);
			}

			const { access_token } = await tokenResponse.json();

			const body = {
				script: {
					plain: script,
					vars: {
						asset: shareAsset,
					},
				},
				reference,
				metadata: {
					type: "ownership_transfer",
					mortgageId,
					fromOwnerId,
					toOwnerId,
					percentage: percentage.toString(),
					...(dealId ? { dealId } : {}),
				},
			};

			const apiUrl = `${serverURL}/api/ledger/v2/${DEFAULT_LEDGER}/transactions`;
			const apiResponse = await fetch(apiUrl, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${access_token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(body),
			});

			const text = await apiResponse.text();

			if (apiResponse.ok) {
				const data = JSON.parse(text);
				const transactionId = data?.data?.id?.toString();

				logger.info("Recorded ownership transfer in ledger", {
					mortgageId,
					fromOwnerId,
					toOwnerId,
					percentage,
					transactionId,
					reference,
				});

				return { success: true, transactionId };
			}

			// Check for idempotency conflict (duplicate reference)
			if (apiResponse.status === 409) {
				logger.warn("Duplicate ownership transfer reference (idempotent)", {
					reference,
					mortgageId,
				});
				return { success: true };
			}

			logger.error("Failed to record ownership transfer in ledger", {
				mortgageId,
				fromOwnerId,
				toOwnerId,
				percentage,
				status: apiResponse.status,
				error: text,
			});

			return {
				success: false,
				error: `Ledger error (${apiResponse.status}): ${text}`,
			};
		} catch (error) {
			logger.error("Exception recording ownership transfer", {
				mortgageId,
				fromOwnerId,
				toOwnerId,
				percentage,
				error,
			});
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	},
});

/**
 * Burn/destroy mortgage shares by sending them back to world
 *
 * This is an admin-only action to remove minted shares from the ledger.
 * It sends all shares from fairlend:inventory back to @world, effectively
 * "unminting" them and removing the mortgage from ledger tracking.
 *
 * @param mortgageId - The mortgage ID to burn shares for
 */
export const burnMortgageShares = action({
	args: {
		mortgageId: v.string(),
	},
	returns: v.object({
		success: v.boolean(),
		transactionId: v.optional(v.string()),
		burnedShares: v.optional(v.number()),
		error: v.optional(v.string()),
	}),
	handler: async (_ctx, args) => {
		const { mortgageId } = args;
		const shareAsset = getMortgageShareAsset(mortgageId);
		const reference = `burn:admin:${mortgageId}:${Date.now()}`;

		try {
			const serverURL = env.FORMANCE_SERVER_URL ?? "";
			const clientID = env.FORMANCE_CLIENT_ID ?? "";
			const clientSecret = env.FORMANCE_CLIENT_SECRET ?? "";

			// Get auth token
			const tokenResponse = await fetch(`${serverURL}/api/auth/oauth/token`, {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: new URLSearchParams({
					grant_type: "client_credentials",
					client_id: clientID,
					client_secret: clientSecret,
				}).toString(),
			});

			if (!tokenResponse.ok) {
				throw new Error(`Failed to authenticate: ${tokenResponse.statusText}`);
			}

			const { access_token } = await tokenResponse.json();

			// Get all volumes for fairlend:inventory to find matching assets
			const accountUrl = `${serverURL}/api/ledger/v2/${DEFAULT_LEDGER}/accounts/${encodeURIComponent(OWNERSHIP_ACCOUNTS.fairlendInventory)}?expand=volumes`;
			const accountResponse = await fetch(accountUrl, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${access_token}`,
					"Content-Type": "application/json",
				},
			});

			if (!accountResponse.ok) {
				return {
					success: false,
					error: "Could not fetch current balance to burn",
				};
			}

			const accountData = await accountResponse.json();
			const volumes =
				accountData?.data?.effectiveVolumes || accountData?.data?.volumes || {};

			// Find ALL assets that match this mortgage (with or without suffixes like /100)
			// The hash is the part after "M" in the shareAsset (e.g., "M2F840959" -> "2F840959")
			const mortgageHash = shareAsset.slice(1); // Remove "M" prefix
			const matchingAssets: Array<{ asset: string; balance: number }> = [];

			for (const [asset, vol] of Object.entries(volumes)) {
				// Match assets like "M{hash}", "M{hash}/100", "M{hash}/SHARE", etc.
				if (asset.startsWith(`M${mortgageHash}`)) {
					const volData = vol as { input?: number; output?: number };
					const balance = (volData.input || 0) - (volData.output || 0);
					if (balance > 0) {
						matchingAssets.push({ asset, balance });
					}
				}
			}

			if (matchingAssets.length === 0) {
				return {
					success: false,
					error: `No shares found for mortgage hash ${mortgageHash}. Available assets: ${Object.keys(volumes).join(", ")}`,
				};
			}

			logger.info("Burning mortgage shares - found matching assets", {
				mortgageId,
				shareAsset,
				mortgageHash,
				matchingAssets,
			});

			let totalBurned = 0;
			let lastTransactionId: string | undefined;

			// Burn each matching asset variant
			for (const { asset, balance } of matchingAssets) {
				logger.info("Burning asset variant", {
					mortgageId,
					asset,
					balance,
				});

				// Numscript to send all shares of this asset back to world (burn them)
				const script = `
vars {
  asset $asset
  monetary $amount = balance(@fairlend:inventory, $asset)
}

send $amount (
  source = @fairlend:inventory
  destination = @world
)
`.trim();

				const body = {
					script: {
						plain: script,
						vars: {
							asset,
						},
					},
					reference: `${reference}:${asset}`,
					metadata: {
						type: "mortgage_shares_burn",
						mortgageId,
						asset,
						burnedShares: balance.toString(),
						source: "admin-ledger-ui",
					},
				};

				const apiUrl = `${serverURL}/api/ledger/v2/${DEFAULT_LEDGER}/transactions`;
				const apiResponse = await fetch(apiUrl, {
					method: "POST",
					headers: {
						Authorization: `Bearer ${access_token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify(body),
				});

				const text = await apiResponse.text();

				if (apiResponse.ok) {
					const data = JSON.parse(text);
					lastTransactionId = data?.data?.id?.toString();
					totalBurned += balance;

					logger.info("Successfully burned asset variant", {
						mortgageId,
						asset,
						transactionId: lastTransactionId,
						burnedShares: balance,
					});
				} else {
					logger.error("Failed to burn asset variant", {
						mortgageId,
						asset,
						status: apiResponse.status,
						error: text,
					});
					// Continue trying other assets even if one fails
				}
			}

			if (totalBurned > 0) {
				return {
					success: true,
					transactionId: lastTransactionId,
					burnedShares: totalBurned,
				};
			}

			return {
				success: false,
				error: "Failed to burn any shares",
			};
		} catch (error) {
			logger.error("Exception burning mortgage shares", {
				mortgageId,
				error,
			});
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	},
});

/**
 * Get ownership balances from the ledger for a specific mortgage
 *
 * Queries account balances to determine current ownership distribution.
 */
export const getOwnershipFromLedger = action({
	args: {
		mortgageId: v.string(),
	},
	returns: v.object({
		success: v.boolean(),
		ownership: v.optional(
			v.array(
				v.object({
					ownerId: v.string(),
					percentage: v.number(),
				})
			)
		),
		totalShares: v.optional(v.number()),
		error: v.optional(v.string()),
	}),
	handler: async (_ctx, args) => {
		const { mortgageId } = args;
		const shareAsset = getMortgageShareAsset(mortgageId);

		try {
			const serverURL = env.FORMANCE_SERVER_URL ?? "";
			const clientID = env.FORMANCE_CLIENT_ID ?? "";
			const clientSecret = env.FORMANCE_CLIENT_SECRET ?? "";

			const tokenResponse = await fetch(`${serverURL}/api/auth/oauth/token`, {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: new URLSearchParams({
					grant_type: "client_credentials",
					client_id: clientID,
					client_secret: clientSecret,
				}).toString(),
			});

			if (!tokenResponse.ok) {
				throw new Error(`Failed to authenticate: ${tokenResponse.statusText}`);
			}

			const { access_token } = await tokenResponse.json();

			// DEBUG: Log request details
			logger.info("getOwnershipFromLedger: Starting request", {
				mortgageId,
				shareAsset,
				ledger: DEFAULT_LEDGER,
			});

			// Helper function to get single account balances from volumes
			async function getAccountBalances(
				accountAddress: string
			): Promise<Record<string, number>> {
				// Use expand=volumes to include volume data in the response
				const accountUrl = `${serverURL}/api/ledger/v2/${DEFAULT_LEDGER}/accounts/${encodeURIComponent(accountAddress)}?expand=volumes`;
				const accountResponse = await fetch(accountUrl, {
					method: "GET",
					headers: {
						Authorization: `Bearer ${access_token}`,
						"Content-Type": "application/json",
					},
				});

				if (!accountResponse.ok) {
					// Account might not exist yet
					logger.warn("getAccountBalances: API returned non-OK", {
						accountAddress,
						status: accountResponse.status,
					});
					return {};
				}

				const rawText = await accountResponse.text();
				logger.info("getAccountBalances: Raw API response", {
					accountAddress,
					rawResponse: rawText.substring(0, 2000),
				});

				const accountData = JSON.parse(rawText);
				// Formance v2 returns { data: { address, metadata, volumes?, effectiveVolumes? } }
				// The "volumes" or "effectiveVolumes" has the balance info per asset
				const volumes =
					accountData?.data?.effectiveVolumes ||
					accountData?.data?.volumes ||
					{};

				logger.info("getAccountBalances: Parsed volumes", {
					accountAddress,
					dataKeys: Object.keys(accountData?.data || {}),
					hasEffectiveVolumes: !!accountData?.data?.effectiveVolumes,
					hasVolumes: !!accountData?.data?.volumes,
					volumeKeys: Object.keys(volumes),
					rawVolumes: volumes,
				});

				// volumes format: { [asset]: { input: X, output: Y } } - balance = input - output
				const accountBalances: Record<string, number> = {};
				for (const [asset, vol] of Object.entries(volumes)) {
					const volData = vol as { input?: number; output?: number };
					accountBalances[asset] = (volData.input || 0) - (volData.output || 0);
				}
				return accountBalances;
			}

			// First, get fairlend:inventory balances directly
			const fairlendBalances = await getAccountBalances(
				OWNERSHIP_ACCOUNTS.fairlendInventory
			);

			logger.info("getOwnershipFromLedger: fairlend inventory check", {
				address: OWNERSHIP_ACCOUNTS.fairlendInventory,
				availableAssets: Object.keys(fairlendBalances),
				lookingForAsset: shareAsset,
				fullBalances: fairlendBalances,
			});

			// Extract ownership from account balances
			const ownership: Array<{ ownerId: string; percentage: number }> = [];
			let totalShares = 0;

			// Check fairlend balance for this asset
			const fairlendBalance = fairlendBalances[shareAsset];
			if (fairlendBalance && Number(fairlendBalance) > 0) {
				const shares = Number(fairlendBalance);
				ownership.push({
					ownerId: "fairlend",
					percentage: shares,
				});
				totalShares += shares;

				logger.info("getOwnershipFromLedger: found ownership", {
					address: OWNERSHIP_ACCOUNTS.fairlendInventory,
					ownerId: "fairlend",
					shares,
					shareAsset,
				});
			}

			// Also list all accounts to find investor accounts
			const accountsUrl = `${serverURL}/api/ledger/v2/${DEFAULT_LEDGER}/accounts`;
			const accountsResponse = await fetch(accountsUrl, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${access_token}`,
					"Content-Type": "application/json",
				},
			});

			if (accountsResponse.ok) {
				const accountsData = await accountsResponse.json();
				const accountsList = accountsData?.cursor?.data || [];

				// Check investor accounts for this asset
				for (const account of accountsList) {
					const address = account.address as string;
					if (
						address.startsWith("investor:") &&
						address.endsWith(":inventory")
					) {
						const investorBalances = await getAccountBalances(address);
						const balance = investorBalances[shareAsset];

						if (balance && Number(balance) > 0) {
							const ownerId = address
								.replace("investor:", "")
								.replace(":inventory", "");
							const shares = Number(balance);
							ownership.push({
								ownerId,
								percentage: shares,
							});
							totalShares += shares;

							logger.info("getOwnershipFromLedger: found ownership", {
								address,
								ownerId,
								shares,
								shareAsset,
							});
						}
					}
				}
			}

			return { success: true, ownership, totalShares };
		} catch (error) {
			logger.error("Exception getting ownership from ledger", {
				mortgageId,
				error,
			});
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	},
});

/**
 * Provision investor accounts in the ledger
 *
 * Creates the required Formance accounts for an investor if they don't exist.
 * Currently creates: investor:{userId}:inventory (share holdings)
 *
 * Accounts in Formance are created implicitly on first transaction.
 * This action creates a zero-value metadata update to ensure the account exists.
 */
export const provisionInvestorAccounts = action({
	args: {
		userId: v.string(),
	},
	returns: v.object({
		success: v.boolean(),
		accountsCreated: v.optional(v.array(v.string())),
		error: v.optional(v.string()),
	}),
	handler: async (_ctx, args) => {
		const { userId } = args;
		const inventoryAccount = OWNERSHIP_ACCOUNTS.investorInventory(userId);

		try {
			const serverURL = env.FORMANCE_SERVER_URL ?? "";
			const clientID = env.FORMANCE_CLIENT_ID ?? "";
			const clientSecret = env.FORMANCE_CLIENT_SECRET ?? "";

			// Get auth token
			const tokenResponse = await fetch(`${serverURL}/api/auth/oauth/token`, {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: new URLSearchParams({
					grant_type: "client_credentials",
					client_id: clientID,
					client_secret: clientSecret,
				}).toString(),
			});

			if (!tokenResponse.ok) {
				throw new Error(`Failed to authenticate: ${tokenResponse.statusText}`);
			}

			const { access_token } = await tokenResponse.json();

			// Add metadata to account to "provision" it
			// This creates the account if it doesn't exist
			const metadataUrl = `${serverURL}/api/ledger/v2/${DEFAULT_LEDGER}/accounts/${encodeURIComponent(inventoryAccount)}/metadata`;
			const metadataResponse = await fetch(metadataUrl, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${access_token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					provisioned: "true",
					provisionedAt: new Date().toISOString(),
					userId,
				}),
			});

			if (!metadataResponse.ok) {
				const text = await metadataResponse.text();
				return {
					success: false,
					error: `Failed to provision account (${metadataResponse.status}): ${text}`,
				};
			}

			logger.info("Provisioned investor accounts", {
				userId,
				accounts: [inventoryAccount],
			});

			return {
				success: true,
				accountsCreated: [inventoryAccount],
			};
		} catch (error) {
			logger.error("Exception provisioning investor accounts", {
				userId,
				error,
			});
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	},
});

/**
 * Get ownership balances for all mortgages from the ledger.
 *
 * Returns a map of mortgageId -> ownership entries.
 */
export const getOwnershipSnapshot = action({
	args: {},
	returns: v.object({
		success: v.boolean(),
		ownershipByMortgage: v.optional(
			v.record(
				v.string(),
				v.array(
					v.object({
						ownerId: v.string(),
						percentage: v.number(),
					})
				)
			)
		),
		error: v.optional(v.string()),
	}),
	handler: async () => {
		try {
			const serverURL = env.FORMANCE_SERVER_URL ?? "";
			const clientID = env.FORMANCE_CLIENT_ID ?? "";
			const clientSecret = env.FORMANCE_CLIENT_SECRET ?? "";

			const tokenResponse = await fetch(`${serverURL}/api/auth/oauth/token`, {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: new URLSearchParams({
					grant_type: "client_credentials",
					client_id: clientID,
					client_secret: clientSecret,
				}).toString(),
			});

			if (!tokenResponse.ok) {
				throw new Error(`Failed to authenticate: ${tokenResponse.statusText}`);
			}

			const { access_token } = await tokenResponse.json();

			// Helper to get volumes for a single account
			async function getAccountVolumes(
				accountAddress: string
			): Promise<Record<string, number>> {
				const accountUrl = `${serverURL}/api/ledger/v2/${DEFAULT_LEDGER}/accounts/${encodeURIComponent(accountAddress)}?expand=volumes`;
				const accountResponse = await fetch(accountUrl, {
					method: "GET",
					headers: {
						Authorization: `Bearer ${access_token}`,
						"Content-Type": "application/json",
					},
				});

				if (!accountResponse.ok) {
					return {};
				}

				const accountData = await accountResponse.json();
				const volumes =
					accountData?.data?.effectiveVolumes ||
					accountData?.data?.volumes ||
					{};

				const balances: Record<string, number> = {};
				for (const [asset, vol] of Object.entries(volumes)) {
					const volData = vol as { input?: number; output?: number };
					const balance = (volData.input || 0) - (volData.output || 0);
					if (balance > 0) {
						balances[asset] = balance;
					}
				}
				return balances;
			}

			// List all accounts first
			const accountsUrl = `${serverURL}/api/ledger/v2/${DEFAULT_LEDGER}/accounts?pageSize=1000`;
			const accountsResponse = await fetch(accountsUrl, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${access_token}`,
					"Content-Type": "application/json",
				},
			});

			if (!accountsResponse.ok) {
				const text = await accountsResponse.text();
				return {
					success: false,
					error: `Ledger error (${accountsResponse.status}): ${text}`,
				};
			}

			const accountsData = await accountsResponse.json();
			const accountsList = accountsData?.cursor?.data || [];

			const ownershipByMortgage: Record<
				string,
				Array<{ ownerId: string; percentage: number }>
			> = {};

			// Process fairlend:inventory and investor accounts
			for (const account of accountsList) {
				const address = account.address as string;
				let ownerId: string | null = null;

				if (address === OWNERSHIP_ACCOUNTS.fairlendInventory) {
					ownerId = "fairlend";
				} else if (
					address.startsWith("investor:") &&
					address.endsWith(":inventory")
				) {
					ownerId = address.replace("investor:", "").replace(":inventory", "");
				}

				if (!ownerId) {
					continue;
				}

				// Get volumes for this account
				const balances = await getAccountVolumes(address);

				for (const [asset, balance] of Object.entries(balances)) {
					// Support both legacy M{id}/SHARE and new M{hash} format
					const isLegacyFormat =
						asset.startsWith("M") && asset.endsWith("/SHARE");
					const isNewFormat = NEW_ASSET_FORMAT_REGEX.test(asset);

					if (!(isLegacyFormat || isNewFormat)) {
						continue;
					}

					// Extract mortgage hash/id from asset name
					// Note: With hash format, we can't get the original mortgageId
					// We use the hash as the key instead
					let mortgageKey: string;
					if (isLegacyFormat) {
						mortgageKey = asset.slice(1, -"/SHARE".length);
					} else {
						// New format: M{hash} - extract hash
						const slashIndex = asset.lastIndexOf("/");
						mortgageKey =
							slashIndex !== -1 ? asset.slice(1, slashIndex) : asset.slice(1);
					}

					const shares = Number(balance);
					if (!Number.isFinite(shares) || shares <= 0) {
						continue;
					}

					if (!ownershipByMortgage[mortgageKey]) {
						ownershipByMortgage[mortgageKey] = [];
					}

					ownershipByMortgage[mortgageKey]?.push({
						ownerId,
						percentage: shares,
					});
				}
			}

			logger.info("getOwnershipSnapshot: completed", {
				accountsProcessed: accountsList.length,
				mortgagesWithOwnership: Object.keys(ownershipByMortgage).length,
				ownershipByMortgage,
			});

			return { success: true, ownershipByMortgage };
		} catch (error) {
			logger.error("Exception getting ownership snapshot from ledger", {
				error,
			});
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	},
});
