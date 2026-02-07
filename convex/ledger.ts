"use node";

import { SDK } from "@formance/formance-sdk";
import { v } from "convex/values";
import { logger } from "../lib/logger";
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
		const clientID = process.env.FORMANCE_CLIENT_ID;
		const clientSecret = process.env.FORMANCE_CLIENT_SECRET;
		const serverURL = process.env.FORMANCE_SERVER_URL;

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
			const sdk = getFormanceClient();
			const result = await sdk.ledger.v2.listTransactions({
				ledger: args.ledgerName,
				pageSize: args.pageSize ?? 100,
				cursor: args.cursor,
			});

			return {
				success: true,
				data: sanitizeResponse(result),
			};
		} catch (error) {
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

			const serverURL = process.env.FORMANCE_SERVER_URL ?? "";
			const clientID = process.env.FORMANCE_CLIENT_ID ?? "";
			const clientSecret = process.env.FORMANCE_CLIENT_SECRET ?? "";

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

			const apiUrl = `${serverURL}/api/ledger/v2/${args.ledgerName}/transactions?dryRun=${args.dryRun ?? false}`;
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
				let data: unknown;
				try {
					data = JSON.parse(text);
				} catch {
					throw new Error(
						`Invalid JSON response from Ledger API: ${text.substring(0, 100)}`
					);
				}

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

const DEFAULT_LEDGER = "flpilot";

/**
 * Generate the share asset name for a mortgage
 */
function getMortgageShareAsset(mortgageId: string): string {
	return `M${mortgageId}/SHARE`;
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
	handler: async (ctx, args) => {
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
			const sdk = getFormanceClient();

			// Get token
			const serverURL = process.env.FORMANCE_SERVER_URL ?? "";
			const clientID = process.env.FORMANCE_CLIENT_ID ?? "";
			const clientSecret = process.env.FORMANCE_CLIENT_SECRET ?? "";

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
	handler: async (ctx, args) => {
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
			const serverURL = process.env.FORMANCE_SERVER_URL ?? "";
			const clientID = process.env.FORMANCE_CLIENT_ID ?? "";
			const clientSecret = process.env.FORMANCE_CLIENT_SECRET ?? "";

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
	handler: async (ctx, args) => {
		const { mortgageId } = args;
		const shareAsset = getMortgageShareAsset(mortgageId);

		try {
			const serverURL = process.env.FORMANCE_SERVER_URL ?? "";
			const clientID = process.env.FORMANCE_CLIENT_ID ?? "";
			const clientSecret = process.env.FORMANCE_CLIENT_SECRET ?? "";

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

			// Query all accounts with the share asset
			// Use aggregate balances endpoint
			const apiUrl = `${serverURL}/api/ledger/v2/${DEFAULT_LEDGER}/aggregate/balances`;
			const apiResponse = await fetch(apiUrl, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${access_token}`,
					"Content-Type": "application/json",
				},
			});

			if (!apiResponse.ok) {
				const text = await apiResponse.text();
				return {
					success: false,
					error: `Ledger error (${apiResponse.status}): ${text}`,
				};
			}

			const data = await apiResponse.json();
			const aggregatedBalances = data?.data || {};

			// Extract ownership from balances
			const ownership: Array<{ ownerId: string; percentage: number }> = [];
			let totalShares = 0;

			// Check FairLend inventory
			const fairlendBalance =
				aggregatedBalances[OWNERSHIP_ACCOUNTS.fairlendInventory]?.[shareAsset];
			if (fairlendBalance && Number(fairlendBalance) > 0) {
				const shares = Number(fairlendBalance);
				ownership.push({
					ownerId: "fairlend",
					percentage: shares,
				});
				totalShares += shares;
			}

			// Check investor accounts - iterate through all accounts
			for (const [account, balances] of Object.entries(aggregatedBalances)) {
				if (
					account.startsWith("investor:") &&
					account.endsWith(":inventory")
				) {
					const balance = (balances as Record<string, number>)?.[shareAsset];
					if (balance && Number(balance) > 0) {
						// Extract user ID from account path
						const userId = account.replace("investor:", "").replace(":inventory", "");
						const shares = Number(balance);
						ownership.push({
							ownerId: userId,
							percentage: shares,
						});
						totalShares += shares;
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
			const serverURL = process.env.FORMANCE_SERVER_URL ?? "";
			const clientID = process.env.FORMANCE_CLIENT_ID ?? "";
			const clientSecret = process.env.FORMANCE_CLIENT_SECRET ?? "";

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

			// Query all accounts with aggregated balances
			const apiUrl = `${serverURL}/api/ledger/v2/${DEFAULT_LEDGER}/aggregate/balances`;
			const apiResponse = await fetch(apiUrl, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${access_token}`,
					"Content-Type": "application/json",
				},
			});

			if (!apiResponse.ok) {
				const text = await apiResponse.text();
				return {
					success: false,
					error: `Ledger error (${apiResponse.status}): ${text}`,
				};
			}

			const data = await apiResponse.json();
			const aggregatedBalances: Record<string, Record<string, number>> =
				data?.data ?? {};

			const ownershipByMortgage: Record<
				string,
				Array<{ ownerId: string; percentage: number }>
			> = {};

			for (const [account, balances] of Object.entries(aggregatedBalances)) {
				let ownerId: string | null = null;
				if (account === OWNERSHIP_ACCOUNTS.fairlendInventory) {
					ownerId = "fairlend";
				} else if (
					account.startsWith("investor:") &&
					account.endsWith(":inventory")
				) {
					ownerId = account
						.replace("investor:", "")
						.replace(":inventory", "");
				}

				if (!ownerId) {
					continue;
				}

				for (const [asset, balance] of Object.entries(balances)) {
					if (!asset.startsWith("M") || !asset.endsWith("/SHARE")) {
						continue;
					}

					const mortgageId = asset.slice(1, -"/SHARE".length);
					const shares = Number(balance);
					if (!Number.isFinite(shares) || shares <= 0) {
						continue;
					}

					if (!ownershipByMortgage[mortgageId]) {
						ownershipByMortgage[mortgageId] = [];
					}

					ownershipByMortgage[mortgageId]?.push({
						ownerId,
						percentage: shares,
					});
				}
			}

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
