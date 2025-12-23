"use node";

import { SDK } from "@formance/formance-sdk";
import { v } from "convex/values";
import { action } from "./_generated/server";

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
			console.error("listLedgers error:", error);
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
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
			console.error("createLedger error:", error);
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
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
			console.error("getLedgerInfo error:", error);
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
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
			console.error("listAccounts error:", error);
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
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
			console.error("getAccount error:", error);
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
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
			});

			return {
				success: true,
				data: sanitizeResponse(result),
			};
		} catch (error) {
			console.error("getBalances error:", error);
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
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
			console.error("listTransactions error:", error);
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
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
			console.error("getTransaction error:", error);
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
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
				body: `grant_type=client_credentials&client_id=${clientID}&client_secret=${clientSecret}`,
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
			console.error("Formance API Error:", {
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
			console.error("executeNumscript error details:", {
				message: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
			});
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
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
			console.error("createSimpleTransaction error:", error);
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
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
			console.error("getLedgerStats error:", error);
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	},
});
