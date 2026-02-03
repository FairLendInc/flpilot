"use node";

import { WorkOS } from "@workos-inc/node";
import { v } from "convex/values";
import { logger } from "../lib/logger";
import { getRotessaClient, RotessaApiError } from "../lib/rotessa";
import type {
	RotessaCustomerCreate,
	RotessaCustomerDetail,
	RotessaCustomerListItem,
	RotessaCustomerUpdate,
	RotessaReportStatusFilter,
	RotessaScheduleFrequency,
	RotessaTransactionReportItem,
	RotessaTransactionSchedule,
} from "../lib/rotessa/types";
import { api, internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { action } from "./_generated/server";
import { env } from "./lib/env";

/**
 * Rotessa Admin Actions
 *
 * Full CRUD operations for Rotessa customers, transaction schedules,
 * and financial transactions. Also includes WorkOS user provisioning.
 *
 * All actions run in Node.js environment and require Rotessa API key
 * to be set in environment variables.
 */

// ============================================================================
// Error Handling & Sanitization
// ============================================================================

function handleActionError(actionName: string, error: unknown) {
	logger.error(`${actionName} failed`, { error, actionName });

	// Extract more specific error message from Rotessa API errors
	if (error instanceof RotessaApiError) {
		const message =
			error.errors?.[0]?.error_message ??
			error.message ??
			`Rotessa API error: ${error.status}`;
		return {
			success: false as const,
			error: message,
		};
	}

	return {
		success: false as const,
		error: error instanceof Error ? error.message : "Unknown error",
	};
}

/**
 * Sanitize SDK response to remove non-serializable objects
 * Convex cannot serialize Response objects or class instances
 */
function sanitizeResponse(result: unknown): unknown {
	if (result === null || result === undefined) return result;
	if (result instanceof Date) return result.toISOString();
	if (typeof result !== "object") return result;

	// Handle arrays at the top level
	if (Array.isArray(result)) {
		return result.map((item) => sanitizeResponse(item));
	}

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
// Customer Management
// ============================================================================

/**
 * List all Rotessa customers
 */
export const listRotessaCustomers = action({
	args: {},
	returns: v.object({
		success: v.boolean(),
		data: v.optional(v.array(v.any())),
		error: v.optional(v.string()),
	}),
	handler: async () => {
		try {
			const client = getRotessaClient();
			const customers = await client.customers.list();

			return {
				success: true,
				data: sanitizeResponse(customers) as RotessaCustomerListItem[],
			};
		} catch (error) {
			return handleActionError("listRotessaCustomers", error);
		}
	},
});

/**
 * Get a single Rotessa customer with their schedules and transactions
 */
export const getRotessaCustomer = action({
	args: {
		customerId: v.number(),
	},
	returns: v.object({
		success: v.boolean(),
		data: v.optional(v.any()),
		error: v.optional(v.string()),
	}),
	handler: async (_, args) => {
		try {
			const client = getRotessaClient();
			const customer = await client.customers.get(args.customerId);

			return {
				success: true,
				data: sanitizeResponse(customer) as RotessaCustomerDetail,
			};
		} catch (error) {
			return handleActionError("getRotessaCustomer", error);
		}
	},
});

/**
 * Get a Rotessa customer by custom identifier
 */
export const getRotessaCustomerByIdentifier = action({
	args: {
		customIdentifier: v.string(),
	},
	returns: v.object({
		success: v.boolean(),
		data: v.optional(v.any()),
		error: v.optional(v.string()),
	}),
	handler: async (_, args) => {
		try {
			const client = getRotessaClient();
			const customer = await client.customers.getByCustomIdentifier(
				args.customIdentifier
			);

			return {
				success: true,
				data: sanitizeResponse(customer) as RotessaCustomerDetail,
			};
		} catch (error) {
			return handleActionError("getRotessaCustomerByIdentifier", error);
		}
	},
});

/**
 * Create a new Rotessa customer
 */
export const createRotessaCustomer = action({
	args: {
		name: v.string(),
		email: v.string(),
		customIdentifier: v.optional(v.string()),
		customerType: v.optional(
			v.union(v.literal("Personal"), v.literal("Business"))
		),
		homePhone: v.optional(v.string()),
		phone: v.optional(v.string()),
		authorizationType: v.union(v.literal("In Person"), v.literal("Online")),
		// Canadian bank info
		institutionNumber: v.string(),
		transitNumber: v.string(),
		accountNumber: v.string(),
		bankAccountType: v.optional(
			v.union(v.literal("Savings"), v.literal("Checking"))
		),
		// Address (optional)
		address: v.optional(
			v.object({
				address_1: v.optional(v.string()),
				address_2: v.optional(v.string()),
				city: v.optional(v.string()),
				province_code: v.optional(v.string()),
				postal_code: v.optional(v.string()),
			})
		),
	},
	returns: v.object({
		success: v.boolean(),
		data: v.optional(v.any()),
		error: v.optional(v.string()),
	}),
	handler: async (_, args) => {
		try {
			const client = getRotessaClient();

			const payload: RotessaCustomerCreate = {
				name: args.name,
				email: args.email,
				custom_identifier: args.customIdentifier ?? null,
				customer_type: args.customerType,
				home_phone: args.homePhone ?? null,
				phone: args.phone ?? null,
				authorization_type: args.authorizationType,
				institution_number: args.institutionNumber,
				transit_number: args.transitNumber,
				account_number: args.accountNumber,
				bank_account_type: args.bankAccountType,
				address: args.address,
			};

			const customer = await client.customers.create(payload);

			logger.info("Created Rotessa customer", {
				customerId: customer.id,
				name: customer.name,
				email: customer.email,
			});

			return {
				success: true,
				data: sanitizeResponse(customer) as RotessaCustomerDetail,
			};
		} catch (error) {
			return handleActionError("createRotessaCustomer", error);
		}
	},
});

/**
 * Update an existing Rotessa customer
 */
export const updateRotessaCustomer = action({
	args: {
		customerId: v.number(),
		updates: v.object({
			name: v.optional(v.string()),
			email: v.optional(v.string()),
			customIdentifier: v.optional(v.string()),
			customerType: v.optional(
				v.union(v.literal("Personal"), v.literal("Business"))
			),
			homePhone: v.optional(v.string()),
			phone: v.optional(v.string()),
			// Bank info updates (optional)
			institutionNumber: v.optional(v.string()),
			transitNumber: v.optional(v.string()),
			accountNumber: v.optional(v.string()),
			bankAccountType: v.optional(
				v.union(v.literal("Savings"), v.literal("Checking"))
			),
		}),
	},
	returns: v.object({
		success: v.boolean(),
		data: v.optional(v.any()),
		error: v.optional(v.string()),
	}),
	handler: async (_, args) => {
		try {
			const client = getRotessaClient();

			const payload: RotessaCustomerUpdate = {};
			if (args.updates.name) payload.name = args.updates.name;
			if (args.updates.email) payload.email = args.updates.email;
			if (args.updates.customIdentifier)
				payload.custom_identifier = args.updates.customIdentifier;
			if (args.updates.customerType)
				payload.customer_type = args.updates.customerType;
			if (args.updates.homePhone) payload.home_phone = args.updates.homePhone;
			if (args.updates.phone) payload.phone = args.updates.phone;
			if (args.updates.institutionNumber)
				payload.institution_number = args.updates.institutionNumber;
			if (args.updates.transitNumber)
				payload.transit_number = args.updates.transitNumber;
			if (args.updates.accountNumber)
				payload.account_number = args.updates.accountNumber;
			if (args.updates.bankAccountType)
				payload.bank_account_type = args.updates.bankAccountType;

			const customer = await client.customers.update(args.customerId, payload);

			logger.info("Updated Rotessa customer", {
				customerId: customer.id,
				updates: Object.keys(args.updates),
			});

			return {
				success: true,
				data: sanitizeResponse(customer) as RotessaCustomerDetail,
			};
		} catch (error) {
			return handleActionError("updateRotessaCustomer", error);
		}
	},
});

// ============================================================================
// Transaction Schedule Management
// ============================================================================

/**
 * Get a transaction schedule by ID
 */
export const getRotessaSchedule = action({
	args: {
		scheduleId: v.number(),
	},
	returns: v.object({
		success: v.boolean(),
		data: v.optional(v.any()),
		error: v.optional(v.string()),
	}),
	handler: async (_, args) => {
		try {
			const client = getRotessaClient();
			const schedule = await client.transactionSchedules.get(args.scheduleId);

			return {
				success: true,
				data: sanitizeResponse(schedule) as RotessaTransactionSchedule,
			};
		} catch (error) {
			return handleActionError("getRotessaSchedule", error);
		}
	},
});

/**
 * Create a new transaction schedule for a customer
 */
export const createRotessaSchedule = action({
	args: {
		customerId: v.number(),
		amount: v.number(),
		frequency: v.union(
			v.literal("Once"),
			v.literal("Weekly"),
			v.literal("Every Other Week"),
			v.literal("Monthly"),
			v.literal("Every Other Month"),
			v.literal("Quarterly"),
			v.literal("Semi-Annually"),
			v.literal("Yearly")
		),
		processDate: v.string(), // YYYY-MM-DD format
		installments: v.optional(v.number()),
		comment: v.optional(v.string()),
	},
	returns: v.object({
		success: v.boolean(),
		data: v.optional(v.any()),
		error: v.optional(v.string()),
	}),
	handler: async (_, args) => {
		try {
			const client = getRotessaClient();

			const schedule = await client.transactionSchedules.create({
				customer_id: args.customerId,
				amount: args.amount,
				frequency: args.frequency as RotessaScheduleFrequency,
				process_date: args.processDate,
				installments: args.installments ?? null,
				comment: args.comment ?? null,
			});

			logger.info("Created Rotessa schedule", {
				scheduleId: schedule.id,
				customerId: args.customerId,
				amount: args.amount,
				frequency: args.frequency,
			});

			return {
				success: true,
				data: sanitizeResponse(schedule) as RotessaTransactionSchedule,
			};
		} catch (error) {
			return handleActionError("createRotessaSchedule", error);
		}
	},
});

/**
 * Update an existing transaction schedule
 */
export const updateRotessaSchedule = action({
	args: {
		scheduleId: v.number(),
		amount: v.optional(v.number()),
		comment: v.optional(v.string()),
	},
	returns: v.object({
		success: v.boolean(),
		data: v.optional(v.any()),
		error: v.optional(v.string()),
	}),
	handler: async (_, args) => {
		try {
			const client = getRotessaClient();

			const payload: { amount?: number | string; comment?: string | null } = {};
			if (args.amount !== undefined) payload.amount = args.amount;
			if (args.comment !== undefined) payload.comment = args.comment;

			const schedule = await client.transactionSchedules.update(
				args.scheduleId,
				payload
			);

			logger.info("Updated Rotessa schedule", {
				scheduleId: schedule.id,
				updates: Object.keys(payload),
			});

			return {
				success: true,
				data: sanitizeResponse(schedule) as RotessaTransactionSchedule,
			};
		} catch (error) {
			return handleActionError("updateRotessaSchedule", error);
		}
	},
});

/**
 * Delete a transaction schedule
 */
export const deleteRotessaSchedule = action({
	args: {
		scheduleId: v.number(),
	},
	returns: v.object({
		success: v.boolean(),
		error: v.optional(v.string()),
	}),
	handler: async (_, args) => {
		try {
			const client = getRotessaClient();
			await client.transactionSchedules.delete(args.scheduleId);

			logger.info("Deleted Rotessa schedule", {
				scheduleId: args.scheduleId,
			});

			return { success: true };
		} catch (error) {
			return handleActionError("deleteRotessaSchedule", error);
		}
	},
});

// ============================================================================
// Transaction Report
// ============================================================================

/**
 * List transactions from Rotessa with filters
 */
export const listRotessaTransactions = action({
	args: {
		startDate: v.string(), // YYYY-MM-DD format
		endDate: v.optional(v.string()),
		status: v.optional(
			v.union(
				v.literal("All"),
				v.literal("Pending"),
				v.literal("Approved"),
				v.literal("Declined"),
				v.literal("Chargeback")
			)
		),
		page: v.optional(v.number()),
	},
	returns: v.object({
		success: v.boolean(),
		data: v.optional(v.array(v.any())),
		error: v.optional(v.string()),
	}),
	handler: async (_, args) => {
		try {
			const client = getRotessaClient();

			const transactions = await client.transactionReport.list({
				start_date: args.startDate,
				end_date: args.endDate,
				status: args.status as RotessaReportStatusFilter | undefined,
				page: args.page,
			});

			return {
				success: true,
				data: sanitizeResponse(transactions) as RotessaTransactionReportItem[],
			};
		} catch (error) {
			return handleActionError("listRotessaTransactions", error);
		}
	},
});

// ============================================================================
// Sync & Integration
// ============================================================================

/**
 * Sync a Rotessa customer to a Convex borrower record
 *
 * Creates or updates a borrower record linked to the Rotessa customer.
 */
export const syncRotessaCustomerToConvex = action({
	args: {
		rotessaCustomerId: v.number(),
		createBorrower: v.optional(v.boolean()),
	},
	returns: v.object({
		success: v.boolean(),
		borrowerId: v.optional(v.string()),
		paymentsCreated: v.optional(v.number()),
		paymentsUpdated: v.optional(v.number()),
		paymentSyncErrors: v.optional(v.number()),
		error: v.optional(v.string()),
	}),
	handler: async (
		ctx,
		args
	): Promise<{
		success: boolean;
		borrowerId?: string;
		paymentsCreated?: number;
		paymentsUpdated?: number;
		paymentSyncErrors?: number;
		error?: string;
	}> => {
		try {
			// Fetch customer from Rotessa
			const client = getRotessaClient({ timeoutMs: 45_000 });
			const customer = await client.customers.get(args.rotessaCustomerId);

			if (!customer) {
				return {
					success: false,
					error: `Rotessa customer ${args.rotessaCustomerId} not found`,
				};
			}

			// Check if borrower already exists with this Rotessa ID
			const existingBorrower: Doc<"borrowers"> | null = await ctx.runQuery(
				internal.borrowers.getBorrowerByRotessaIdInternal,
				{ rotessaCustomerId: String(customer.id) }
			);

			let borrowerId: Id<"borrowers"> | undefined;

			if (existingBorrower) {
				// Update existing borrower
				await ctx.runMutation(internal.borrowers.updateBorrowerFromRotessa, {
					borrowerId: existingBorrower._id,
					name: customer.name,
					email: customer.email,
					phone: customer.phone ?? undefined,
				});

				logger.info("Updated borrower from Rotessa", {
					borrowerId: existingBorrower._id,
					rotessaCustomerId: customer.id,
				});

				borrowerId = existingBorrower._id;
			}

			// Create new borrower if requested
			if (!borrowerId && args.createBorrower) {
				borrowerId = await ctx.runMutation(
					internal.borrowers.createBorrowerFromRotessaInternal,
					{
						rotessaCustomerId: String(customer.id),
						name: customer.name,
						email: customer.email,
						phone: customer.phone ?? undefined,
					}
				);

				logger.info("Created borrower from Rotessa", {
					borrowerId: borrowerId,
					rotessaCustomerId: customer.id,
				});
			}

			if (!borrowerId) {
				return {
					success: false,
					error: "Borrower not found and createBorrower=false",
				};
			}

			const transactions = customer.financial_transactions ?? [];
			const scheduleMap = new Map(
				(customer.transaction_schedules ?? []).map((schedule) => [
					schedule.id,
					schedule,
				])
			);
			let paymentsCreated = 0;
			let paymentsUpdated = 0;
			let paymentSyncErrors = 0;

			for (const transaction of transactions) {
				try {
					const result = await ctx.runMutation(
						internal.rotessaSync.processTransaction,
						{
							transactionId: transaction.id,
							customerId: customer.id,
							customIdentifier: customer.custom_identifier ?? undefined,
							scheduleId: transaction.transaction_schedule_id,
							amount: transaction.amount,
							status: transaction.status,
							statusReason: transaction.status_reason ?? undefined,
							processDate: transaction.process_date,
							settlementDate: undefined,
							paymentMetadata: transaction,
							transactionSchedule:
								scheduleMap.get(transaction.transaction_schedule_id),
						}
					);

					if (result.created) {
						paymentsCreated += 1;
					} else if (result.updated) {
						paymentsUpdated += 1;
					}

					if (transaction.status === "Approved" && result.paymentId) {
					// ToDo: Check to see if this function is correctly using bi-temporality and backdating for old transactions. g/
						await ctx.runMutation(internal.rotessaSync.recordPaymentToLedger, {
							paymentId: result.paymentId,
							amount: transaction.amount,
						});
					}
				} catch (transactionError) {
					paymentSyncErrors += 1;
					logger.error("[syncRotessaCustomerToConvex] Payment sync failed", {
						error: transactionError,
						transactionId: transaction.id,
						customerId: customer.id,
					});
				}
			}

			return {
				success: true,
				borrowerId,
				paymentsCreated,
				paymentsUpdated,
				paymentSyncErrors,
			};
		} catch (error) {
			return handleActionError("syncRotessaCustomerToConvex", error);
		}
	},
});

/**
 * Get borrower info by Rotessa customer ID
 *
 * Returns the linked borrower and user info for a Rotessa customer.
 * Used to display platform integration status in the UI.
 */
export const getBorrowerByRotessaCustomerId = action({
	args: {
		rotessaCustomerId: v.number(),
	},
	returns: v.object({
		success: v.boolean(),
		borrower: v.optional(
			v.object({
				_id: v.string(),
				name: v.string(),
				email: v.string(),
				phone: v.optional(v.string()),
				userId: v.optional(v.string()),
				status: v.optional(v.string()),
			})
		),
		user: v.optional(
			v.object({
				_id: v.string(),
				idp_id: v.string(),
				email: v.string(),
				first_name: v.optional(v.string()),
				last_name: v.optional(v.string()),
			})
		),
		workosMemberships: v.optional(
			v.array(
				v.object({
					organizationId: v.string(),
					organizationName: v.string(),
					organizationExternalId: v.optional(v.string()),
					roles: v.array(
						v.object({
							slug: v.string(),
							name: v.string(),
						})
					),
					primaryRoleSlug: v.optional(v.string()),
				})
			)
		),
		brokerClient: v.optional(
			v.object({
				clientBrokerId: v.string(),
				brokerId: v.string(),
				brokerName: v.string(),
				brokerStatus: v.optional(v.string()),
				workosOrgId: v.optional(v.string()),
				onboardingStatus: v.optional(v.string()),
			})
		),
		mortgages: v.optional(
			v.array(
				v.object({
					id: v.string(),
					propertyAddress: v.string(),
					status: v.string(),
					rotessaScheduleId: v.optional(v.number()),
				})
			)
		),
		error: v.optional(v.string()),
	}),
	handler: async (ctx, args) => {
		try {
			const borrower = (await ctx.runQuery(
				internal.borrowers.getBorrowerByRotessaIdInternal,
				{ rotessaCustomerId: String(args.rotessaCustomerId) }
			)) as any;

			if (!borrower) {
				return {
					success: true,
					borrower: undefined,
				};
			}

			const details = (await ctx.runQuery(
				internal.rotessaAdminQueries.getBorrowerPlatformDetailsInternal,
				{ borrowerId: borrower._id }
			)) as any;

			if (!details) {
				return {
					success: true,
					borrower: undefined,
				};
			}

			return {
				success: true,
				...details,
			};
		} catch (error) {
			return handleActionError("getBorrowerByRotessaCustomerId", error);
		}
	},
});

/**
 * Assign or reassign a borrower to a broker (admin)
 */
export const assignBorrowerBroker = action({
	args: {
		borrowerUserId: v.id("users"),
		brokerId: v.id("brokers"),
		workosOrgId: v.string(),
	},
	returns: v.object({
		success: v.boolean(),
		clientBrokerId: v.optional(v.string()),
		reassigned: v.optional(v.boolean()),
		error: v.optional(v.string()),
	}),
	handler: async (ctx, args) => {
		try {
			logger.info("[assignBorrowerBroker] start", {
				borrowerUserId: args.borrowerUserId,
				brokerId: args.brokerId,
				workosOrgId: args.workosOrgId,
			});

			const existing = (await ctx.runQuery(
				internal.rotessaAdminQueries.getBrokerClientsByClientIdInternal,
				{ clientId: args.borrowerUserId }
			)) as any;

			const current = existing[0] as any;

			if (current) {
				logger.info("[assignBorrowerBroker] reassign", {
					clientBrokerId: current._id,
					targetBrokerId: args.brokerId,
				});
				await ctx.runMutation(api.brokers.clients.reassignBrokerClient, {
					clientBrokerId: current._id,
					targetBrokerId: args.brokerId,
				});
				return {
					success: true,
					clientBrokerId: current._id,
					reassigned: true,
				};
			}

			const createResult = (await ctx.runMutation(
				api.brokers.clients.createClientBrokerRecord,
				{
					brokerId: args.brokerId,
					clientId: args.borrowerUserId,
					workosOrgId: args.workosOrgId,
					filters: {
						constraints: {},
						values: {
							propertyTypes: [],
							locations: [],
							riskProfile: "balanced",
						},
					},
				}
			)) as any;

			return {
				success: true,
				clientBrokerId: createResult.clientBrokerId,
				reassigned: false,
			};
		} catch (error) {
			logger.error("[assignBorrowerBroker] failed", {
				error,
				borrowerUserId: args.borrowerUserId,
				brokerId: args.brokerId,
				workosOrgId: args.workosOrgId,
			});
			return handleActionError("assignBorrowerBroker", error);
		}
	},
});

// ============================================================================
// WorkOS User Provisioning
// ============================================================================

/**
 * Provision a WorkOS user for a borrower
 *
 * First checks if a WorkOS user with the same email already exists.
 * If yes, links the existing user to the borrower.
 * If no, creates a new WorkOS user and links them.
 */
export const provisionBorrowerUser = action({
	args: {
		borrowerId: v.id("borrowers"),
		email: v.string(),
		firstName: v.string(),
		lastName: v.string(),
	},
	returns: v.object({
		success: v.boolean(),
		workosUserId: v.optional(v.string()),
		error: v.optional(v.string()),
		linkedExisting: v.optional(v.boolean()),
	}),
	handler: async (ctx, args) => {
		// Normalize email for case-insensitive matching
		const normalizedEmail = args.email.toLowerCase().trim();

		logger.info("[provisionBorrowerUser] Starting", {
			borrowerId: args.borrowerId,
			email: args.email,
			normalizedEmail,
			firstName: args.firstName,
			lastName: args.lastName,
		});

		try {
			const workosApiKey = env.WORKOS_API_KEY;
			if (!workosApiKey) {
				logger.error("[provisionBorrowerUser] WORKOS_API_KEY not configured");
				return {
					success: false,
					error: "WORKOS_API_KEY not configured",
				};
			}

			logger.info("[provisionBorrowerUser] Initializing WorkOS client");
			const workos = new WorkOS(workosApiKey);

			let userId: string;
			let linkedExisting = false;

			// First, check if a WorkOS user with this email already exists
			// Note: WorkOS email search is case-insensitive
			logger.info("[provisionBorrowerUser] Checking for existing WorkOS user", {
				email: normalizedEmail,
			});

			try {
				const existingUsers = await workos.userManagement.listUsers({
					email: normalizedEmail,
				});

				if (existingUsers.data && existingUsers.data.length > 0) {
					// User already exists - use their ID
					userId = existingUsers.data[0]?.id;
					linkedExisting = true;
					logger.info(
						"[provisionBorrowerUser] Found existing WorkOS user, will link",
						{
							workosUserId: userId,
							email: args.email,
						}
					);
				} else {
					// No existing user - create a new one
					logger.info(
						"[provisionBorrowerUser] No existing user, creating new",
						{
							email: args.email,
						}
					);

					const newUser = await workos.userManagement.createUser({
						email: args.email,
						firstName: args.firstName,
						lastName: args.lastName,
						emailVerified: false,
					});

					userId = newUser.id;
					logger.info(
						"[provisionBorrowerUser] WorkOS user created successfully",
						{
							borrowerId: args.borrowerId,
							workosUserId: userId,
							email: args.email,
						}
					);
				}
			} catch (listError) {
				// If listing fails, try to create (might fail if user exists)
				logger.warn(
					"[provisionBorrowerUser] Failed to list users, attempting create",
					{ error: listError }
				);

				try {
					const newUser = await workos.userManagement.createUser({
						email: args.email,
						firstName: args.firstName,
						lastName: args.lastName,
						emailVerified: false,
					});
					userId = newUser.id;
				} catch (createError: any) {
					// Check if error is because user already exists
					if (
						createError?.message?.includes("already exists") ||
						createError?.code === "user_exists"
					) {
						// Try to find the existing user again
						const retryUsers = await workos.userManagement.listUsers({
							email: args.email,
						});
						if (retryUsers.data && retryUsers.data.length > 0) {
							userId = retryUsers.data[0]?.id;
							linkedExisting = true;
							logger.info(
								"[provisionBorrowerUser] Found existing user on retry",
								{
									workosUserId: userId,
								}
							);
						} else {
							throw createError;
						}
					} else {
						throw createError;
					}
				}
			}

			// Link user to borrower
			logger.info("[provisionBorrowerUser] Linking user to borrower", {
				borrowerId: args.borrowerId,
				workosUserId: userId,
				linkedExisting,
			});

			const linkResult = await ctx.runMutation(
				internal.borrowers.linkUserToBorrowerInternal,
				{
					borrowerId: args.borrowerId,
					userId,
				}
			);

			logger.info("[provisionBorrowerUser] Link result", {
				linkResult,
				borrowerId: args.borrowerId,
				workosUserId: userId,
			});

			// Verify the link succeeded by checking the borrower
			const updatedBorrower: any = await ctx.runQuery(
				internal.borrowers.getBorrowerByIdInternal,
				{ borrowerId: args.borrowerId }
			);

			if (!updatedBorrower?.userId) {
				logger.error(
					"[provisionBorrowerUser] Link verification failed - borrower userId not set",
					{
						borrowerId: args.borrowerId,
						updatedBorrower,
					}
				);
				return {
					success: false,
					error: "Link verification failed - borrower userId was not updated",
				};
			}

			logger.info("[provisionBorrowerUser] Link verified successfully", {
				borrowerId: args.borrowerId,
				convexUserId: updatedBorrower.userId,
				workosUserId: userId,
			});

			return {
				success: true,
				workosUserId: userId,
				linkedExisting,
			};
		} catch (error) {
			logger.error("[provisionBorrowerUser] Error", {
				error,
				borrowerId: args.borrowerId,
				email: args.email,
			});
			return handleActionError("provisionBorrowerUser", error);
		}
	},
});

// ============================================================================
// Dashboard Stats
// ============================================================================

/**
 * Get Rotessa dashboard statistics
 *
 * Returns aggregate stats for the admin dashboard.
 */
export const getRotessaDashboardStats = action({
	args: {},
	returns: v.object({
		success: v.boolean(),
		data: v.optional(
			v.object({
				totalCustomers: v.number(),
				activeCustomers: v.number(),
				totalSchedules: v.number(),
				recentTransactions: v.array(v.any()),
			})
		),
		error: v.optional(v.string()),
	}),
	handler: async () => {
		try {
			const client = getRotessaClient();

			// Get all customers
			const customers = await client.customers.list();
			const activeCustomers = customers.filter((c) => c.active).length;

			// Count schedules across all customers
			let totalSchedules = 0;
			const customersWithDetails: RotessaCustomerDetail[] = [];

			// Get first 10 customers for detailed info
			for (const customer of customers.slice(0, 10)) {
				try {
					const detail = await client.customers.get(customer.id);
					customersWithDetails.push(detail);
					totalSchedules += detail.transaction_schedules?.length ?? 0;
				} catch {
					// Customer might not be accessible
				}
			}

			// Get recent transactions (last 30 days)
			const thirtyDaysAgo = new Date();
			thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
			const startDate = thirtyDaysAgo.toISOString().split("T")[0]!;

			const recentTransactions = await client.transactionReport.list({
				start_date: startDate,
				status: "All",
			});

			return {
				success: true,
				data: {
					totalCustomers: customers.length,
					activeCustomers,
					totalSchedules,
					recentTransactions: (sanitizeResponse(
						recentTransactions.slice(0, 20)
					) ?? []) as RotessaTransactionReportItem[],
				},
			};
		} catch (error) {
			return handleActionError("getRotessaDashboardStats", error);
		}
	},
});
