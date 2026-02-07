"use client";

import { useAction, useConvexAuth } from "convex/react";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	type CreateCustomerFormData,
	CreateRotessaCustomerDialog,
	CreateScheduleDialog,
	type RotessaCustomer,
	type RotessaCustomerDetail,
	RotessaCustomerDetailSheet,
	RotessaCustomersTable,
} from "@/components/admin/rotessa";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuthenticatedQuery } from "@/convex/lib/client";
import type {
	RotessaCustomerDetail as RotessaCustomerDetailAPI,
	RotessaCustomerListItem,
	RotessaFinancialTransaction,
	RotessaScheduleFrequency,
	RotessaTransactionSchedule,
} from "@/lib/rotessa/types";

// Platform data types (from Convex queries)
type PlatformMembership = {
	organizationId: string;
	organizationName: string;
	organizationExternalId?: string;
	roles?: Array<{ slug: string; name: string }>;
	primaryRoleSlug?: string;
};

type PlatformMortgage = {
	id: string;
	propertyAddress: string;
	status: string;
	rotessaScheduleId?: number | null;
};

type BrokerResult = {
	_id: string;
	branding?: { brandName?: string };
	userName: string | null;
	subdomain?: string;
	status?: string;
};

// Regex for splitting names - defined at top level for performance
const NAME_SPLIT_REGEX = /\s+/;

export default function AdminRotessaCustomersPage() {
	const { isLoading: authLoading, isAuthenticated } = useConvexAuth();

	// State
	const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
	const [customers, setCustomers] = useState<RotessaCustomer[]>([]);
	const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
		null
	);
	const [selectedCustomerDetail, setSelectedCustomerDetail] =
		useState<RotessaCustomerDetail | null>(null);
	const [isDetailLoading, setIsDetailLoading] = useState(false);
	const [isSyncing, setIsSyncing] = useState(false);
	const [isProvisioning, setIsProvisioning] = useState(false);
	const [isAssigningBroker, setIsAssigningBroker] = useState(false);

	// Dialog state
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
	const [scheduleCustomerId, setScheduleCustomerId] = useState<number | null>(
		null
	);

	// Actions
	const listCustomers = useAction(api.rotessaAdmin.listRotessaCustomers);
	const getCustomer = useAction(api.rotessaAdmin.getRotessaCustomer);
	const createCustomer = useAction(api.rotessaAdmin.createRotessaCustomer);
	const createSchedule = useAction(api.rotessaAdmin.createRotessaSchedule);
	const syncToConvex = useAction(api.rotessaAdmin.syncRotessaCustomerToConvex);
	const provisionUser = useAction(api.rotessaAdmin.provisionBorrowerUser);
	const getBorrowerInfo = useAction(
		api.rotessaAdmin.getBorrowerByRotessaCustomerId
	);
	const assignBorrowerBroker = useAction(api.rotessaAdmin.assignBorrowerBroker);

	// Available mortgages for schedule linking
	const availableMortgages = useAuthenticatedQuery(
		api.mortgages.getMortgagesWithoutSchedule,
		{}
	);
	const brokersResult = useAuthenticatedQuery(
		api.brokers.management.listBrokers,
		{}
	);

	// Fetch customers on mount
	const fetchCustomers = async () => {
		setIsLoadingCustomers(true);
		try {
			const result = await listCustomers({});
			if (result.success && result.data) {
				setCustomers(
					result.data.map((c: RotessaCustomerListItem) => ({
						id: c.id,
						name: c.name,
						email: c.email,
						customerType: c.customer_type ?? undefined,
						customIdentifier: c.custom_identifier ?? undefined,
						active: c.active,
					}))
				);
			} else if ("error" in result) {
				toast.error("Failed to fetch customers", {
					description: result.error,
				});
			}
		} catch (error) {
			toast.error("Failed to fetch customers", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		} finally {
			setIsLoadingCustomers(false);
		}
	};

	// Load customers on first render
	useState(() => {
		fetchCustomers();
	});

	// View customer detail
	const handleViewDetail = async (customerId: number) => {
		setSelectedCustomerId(customerId);
		setIsDetailLoading(true);
		try {
			// Fetch both Rotessa customer data and Convex borrower data in parallel
			const [rotessaResult, borrowerResult] = await Promise.all([
				getCustomer({ customerId }),
				getBorrowerInfo({ rotessaCustomerId: customerId }),
			]);

			if (rotessaResult.success && rotessaResult.data) {
				const c = rotessaResult.data as RotessaCustomerDetailAPI;

				// Get linked borrower/user info from Convex
				const linkedBorrower = borrowerResult.success
					? borrowerResult.borrower
					: undefined;
				const linkedUser = borrowerResult.success
					? borrowerResult.user
					: undefined;
				const workosMemberships = borrowerResult.success
					? borrowerResult.workosMemberships
					: undefined;
				const brokerClient = borrowerResult.success
					? borrowerResult.brokerClient
					: undefined;
				const platformMortgages = borrowerResult.success
					? borrowerResult.mortgages
					: undefined;

				console.log("[ViewDetail] Rotessa customer", c);
				console.log("[ViewDetail] Linked borrower", linkedBorrower);

				setSelectedCustomerDetail({
					id: c.id,
					name: c.name,
					email: c.email,
					phone: c.phone ?? undefined,
					homePhone: c.home_phone ?? undefined,
					customerType: c.customer_type ?? undefined,
					customIdentifier: c.custom_identifier ?? undefined,
					active: c.active,
					createdAt: c.created_at ?? undefined,
					institutionNumber: c.institution_number ?? undefined,
					transitNumber: c.transit_number ?? undefined,
					accountNumber: c.account_number ?? undefined,
					bankAccountType: c.bank_account_type ?? undefined,
					transactionSchedules: c.transaction_schedules?.map(
						(s: RotessaTransactionSchedule) => ({
							id: s.id,
							amount: s.amount,
							frequency: s.frequency,
							processDate: s.process_date,
							nextProcessDate: s.next_process_date ?? undefined,
							installments: s.installments,
							comment: s.comment,
						})
					),
					financialTransactions: c.financial_transactions?.map(
						(t: RotessaFinancialTransaction) => ({
							id: t.id,
							amount: t.amount,
							processDate: t.process_date,
							status: t.status,
							statusReason: t.status_reason ?? undefined,
						})
					),
					platform: linkedBorrower
						? {
								borrower: {
									id: linkedBorrower._id,
									name: linkedBorrower.name,
									email: linkedBorrower.email,
									phone: linkedBorrower.phone ?? null,
									status: linkedBorrower.status ?? null,
									userId: linkedBorrower.userId ?? null,
								},
								user: linkedUser
									? {
											id: linkedUser._id,
											idpId: linkedUser.idp_id,
											email: linkedUser.email,
											firstName: linkedUser.first_name ?? null,
											lastName: linkedUser.last_name ?? null,
										}
									: undefined,
								workosMemberships: workosMemberships?.map(
									(membership: PlatformMembership) => ({
										organizationId: membership.organizationId,
										organizationName: membership.organizationName,
										organizationExternalId:
											membership.organizationExternalId ?? null,
										roles: membership.roles ?? [],
										primaryRoleSlug: membership.primaryRoleSlug ?? null,
									})
								),
								brokerClient: brokerClient
									? {
											clientBrokerId: brokerClient.clientBrokerId,
											brokerId: brokerClient.brokerId,
											brokerName: brokerClient.brokerName,
											brokerStatus: brokerClient.brokerStatus ?? null,
											workosOrgId: brokerClient.workosOrgId ?? null,
											onboardingStatus: brokerClient.onboardingStatus ?? null,
										}
									: undefined,
								mortgages: platformMortgages?.map(
									(mortgage: PlatformMortgage) => ({
										id: mortgage.id,
										propertyAddress: mortgage.propertyAddress,
										status: mortgage.status,
										rotessaScheduleId: mortgage.rotessaScheduleId ?? null,
									})
								),
							}
						: undefined,
					// Add linked borrower/user info
					linkedBorrowerId: linkedBorrower?._id,
					linkedBorrowerName: linkedBorrower?.name,
					linkedUserId: linkedBorrower?.userId,
				});
			} else if ("error" in rotessaResult) {
				toast.error("Failed to fetch customer details", {
					description: rotessaResult.error,
				});
			}
		} catch (error) {
			toast.error("Failed to fetch customer details", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		} finally {
			setIsDetailLoading(false);
		}
	};

	// Create customer
	const handleCreateCustomer = async (data: CreateCustomerFormData) => {
		console.log("[CreateCustomer] Starting with data", {
			name: data.name,
			email: data.email,
			createBorrower: data.createBorrower,
			provisionUser: data.provisionUser,
		});

		try {
			const result = await createCustomer({
				name: data.name,
				email: data.email,
				customIdentifier: data.customIdentifier || undefined,
				customerType: data.customerType,
				phone: data.phone || undefined,
				authorizationType: data.authorizationType,
				institutionNumber: data.institutionNumber,
				transitNumber: data.transitNumber,
				accountNumber: data.accountNumber,
				bankAccountType: data.bankAccountType,
			});

			console.log("[CreateCustomer] Create result", result);

			if (result.success && result.data) {
				toast.success("Customer created", {
					description: `Created ${data.name} in Rotessa`,
				});

				const customerId = (result.data as RotessaCustomerDetailAPI).id;
				console.log("[CreateCustomer] Customer ID", customerId);

				// Sync to Convex if requested (creates borrower record)
				if (data.createBorrower || data.provisionUser) {
					console.log("[CreateCustomer] Syncing to Convex...");
					const syncResult = await syncToConvex({
						rotessaCustomerId: customerId,
						createBorrower: true,
					});

					console.log("[CreateCustomer] Sync result", syncResult);

					if (syncResult.success && syncResult.borrowerId) {
						toast.success("Borrower record created");

						// Provision WorkOS user account if requested
						if (data.provisionUser) {
							console.log("[CreateCustomer] Provisioning user...");
							// Parse name into first/last
							const nameParts = data.name.trim().split(NAME_SPLIT_REGEX);
							const firstName = nameParts[0] || data.name;
							const lastName = nameParts.slice(1).join(" ") || "";

							console.log("[CreateCustomer] Calling provisionUser", {
								borrowerId: syncResult.borrowerId,
								email: data.email,
								firstName,
								lastName,
							});

							const provisionResult = await provisionUser({
								borrowerId: syncResult.borrowerId as Id<"borrowers">,
								email: data.email,
								firstName,
								lastName,
							});

							console.log("[CreateCustomer] Provision result", provisionResult);

							if (provisionResult.success) {
								if (provisionResult.linkedExisting) {
									toast.success("Linked to existing user", {
										description: `${data.email} was already a platform user and is now linked`,
									});
								} else {
									toast.success("User account provisioned", {
										description: `${data.email} can now log in to the borrower portal`,
									});
								}
							} else if ("error" in provisionResult) {
								toast.error("Failed to provision user account", {
									description: provisionResult.error,
								});
							}
						} else {
							console.log(
								"[CreateCustomer] provisionUser checkbox is FALSE, skipping provisioning"
							);
						}
					} else if ("error" in syncResult) {
						toast.error("Failed to sync borrower", {
							description: syncResult.error,
						});
					}
				} else {
					console.log(
						"[CreateCustomer] Neither createBorrower nor provisionUser is true, skipping sync"
					);
				}

				// Refresh list
				await fetchCustomers();
			} else if ("error" in result) {
				toast.error("Failed to create customer", {
					description: result.error,
				});
				throw new Error(result.error);
			}
		} catch (error) {
			console.error("[CreateCustomer] Error", error);
			toast.error("Failed to create customer", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
			throw error;
		}
	};

	// Create schedule
	const handleCreateSchedule = async (data: {
		amount: number;
		frequency: string;
		processDate: string;
		installments?: number;
		comment?: string;
		mortgageId?: string;
	}) => {
		if (!scheduleCustomerId) return;

		try {
			const result = await createSchedule({
				customerId: scheduleCustomerId,
				amount: data.amount,
				frequency: data.frequency as RotessaScheduleFrequency,
				processDate: data.processDate,
				installments: data.installments,
				comment: data.comment,
			});

			if (result.success) {
				toast.success("Schedule created", {
					description: `Created ${data.frequency} schedule for ${formatCurrency(data.amount)}`,
				});

				// Refresh customer detail if viewing
				if (selectedCustomerId === scheduleCustomerId) {
					await handleViewDetail(scheduleCustomerId);
				}
			} else if ("error" in result) {
				toast.error("Failed to create schedule", {
					description: result.error,
				});
				throw new Error(result.error);
			}
		} catch (error) {
			toast.error("Failed to create schedule", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
			throw error;
		}
	};

	// Sync to Convex
	const handleSyncToConvex = async (customerId: number) => {
		try {
			const result = await syncToConvex({
				rotessaCustomerId: customerId,
				createBorrower: true,
			});

			if (result.success) {
				toast.success("Synced to Convex", {
					description: result.borrowerId
						? `Linked to borrower ${result.borrowerId}`
						: "Customer synced",
				});
			} else {
				toast.error("Sync failed", { description: result.error });
			}
		} catch (error) {
			toast.error("Sync failed", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		}
	};

	// Sync from detail sheet
	const handleDetailSync = async () => {
		if (!selectedCustomerId) return;
		setIsSyncing(true);
		try {
			await handleSyncToConvex(selectedCustomerId);
			// Refresh detail view to show updated linked status
			await handleViewDetail(selectedCustomerId);
		} finally {
			setIsSyncing(false);
		}
	};

	// Provision user from detail sheet
	const handleProvisionFromDetail = async () => {
		if (!(selectedCustomerId && selectedCustomerDetail)) return;

		console.log("[Provision] Starting user provisioning from detail sheet", {
			customerId: selectedCustomerId,
			customerName: selectedCustomerDetail.name,
			customerEmail: selectedCustomerDetail.email,
		});

		setIsProvisioning(true);
		try {
			// First, ensure customer is synced to Convex (creates borrower if needed)
			const syncResult = await syncToConvex({
				rotessaCustomerId: selectedCustomerId,
				createBorrower: true,
			});

			console.log("[Provision] Sync result", syncResult);

			if (!(syncResult.success && syncResult.borrowerId)) {
				toast.error("Failed to sync customer", {
					description: syncResult.error ?? "No borrower ID returned",
				});
				return;
			}

			// Parse name into first/last
			const nameParts = selectedCustomerDetail.name
				.trim()
				.split(NAME_SPLIT_REGEX);
			const firstName = nameParts[0] || selectedCustomerDetail.name;
			const lastName = nameParts.slice(1).join(" ") || "";

			console.log("[Provision] Calling provisionUser action", {
				borrowerId: syncResult.borrowerId,
				email: selectedCustomerDetail.email,
				firstName,
				lastName,
			});

			// Provision the WorkOS user
			const provisionResult = await provisionUser({
				borrowerId: syncResult.borrowerId as Id<"borrowers">,
				email: selectedCustomerDetail.email,
				firstName,
				lastName,
			});

			console.log("[Provision] Provision result", provisionResult);

			if (provisionResult.success) {
				if (provisionResult.linkedExisting) {
					toast.success("Linked to existing user", {
						description: `${selectedCustomerDetail.email} was already a platform user and is now linked to this borrower`,
					});
				} else {
					toast.success("User account provisioned", {
						description: `${selectedCustomerDetail.email} can now log in to the borrower portal`,
					});
				}
				// Refresh the detail view to show updated status
				await handleViewDetail(selectedCustomerId);
			} else {
				// Handle failure case - show error if provided, or generic message
				console.error("[Provision] provisionUser failed", provisionResult);
				toast.error("Failed to provision user account", {
					description:
						provisionResult.error ??
						"User provisioning failed - check console for details",
				});
			}
		} catch (error) {
			console.error("[Provision] Error", error);
			toast.error("Failed to provision user", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		} finally {
			setIsProvisioning(false);
		}
	};

	const handleAssignBroker = async (args: {
		borrowerUserId: string;
		brokerId: string;
		workosOrgId: string;
	}) => {
		console.log("[AssignBroker] start", args);
		setIsAssigningBroker(true);
		try {
			const result = await assignBorrowerBroker({
				borrowerUserId: args.borrowerUserId as Id<"users">,
				brokerId: args.brokerId as Id<"brokers">,
				workosOrgId: args.workosOrgId,
			});

			console.log("[AssignBroker] result", result);
			if (result.success) {
				toast.success("Broker assignment updated");
				if (selectedCustomerId) {
					await handleViewDetail(selectedCustomerId);
				}
			} else {
				toast.error("Failed to assign broker", {
					description:
						"error" in result
							? (result.error ?? "Unknown error")
							: "Unknown error",
				});
			}
		} catch (error) {
			toast.error("Failed to assign broker", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		} finally {
			setIsAssigningBroker(false);
		}
	};

	// Format currency
	const formatCurrency = (amount: number) =>
		new Intl.NumberFormat("en-CA", {
			style: "currency",
			currency: "CAD",
		}).format(amount);

	// Loading states
	if (authLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!isAuthenticated) {
		return (
			<div className="flex h-full items-center justify-center">
				<p className="text-muted-foreground">Authentication required</p>
			</div>
		);
	}

	return (
		<>
			<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator className="mr-2 h-4" orientation="vertical" />
				<h1 className="font-semibold text-lg">Rotessa Customers</h1>
				<span className="ml-2 text-muted-foreground text-sm">
					({customers.length} customers)
				</span>
			</header>

			<div className="flex flex-1 flex-col gap-6 p-6">
				<RotessaCustomersTable
					customers={customers}
					isLoading={isLoadingCustomers}
					onCreateCustomer={() => setIsCreateDialogOpen(true)}
					onCreateSchedule={(customerId) => {
						setScheduleCustomerId(customerId);
						setIsScheduleDialogOpen(true);
					}}
					onRefresh={fetchCustomers}
					onSyncToConvex={handleSyncToConvex}
					onViewDetail={handleViewDetail}
				/>
			</div>

			{/* Create Customer Dialog */}
			<CreateRotessaCustomerDialog
				onOpenChange={setIsCreateDialogOpen}
				onSubmit={handleCreateCustomer}
				open={isCreateDialogOpen}
			/>

			{/* Create Schedule Dialog */}
			{scheduleCustomerId && (
				<CreateScheduleDialog
					availableMortgages={availableMortgages ?? []}
					customerId={scheduleCustomerId}
					customerName={
						customers.find((c) => c.id === scheduleCustomerId)?.name ??
						"Customer"
					}
					onOpenChange={setIsScheduleDialogOpen}
					onSubmit={handleCreateSchedule}
					open={isScheduleDialogOpen}
				/>
			)}

			{/* Customer Detail Sheet */}
			<RotessaCustomerDetailSheet
				brokers={(brokersResult ?? []).map((broker: BrokerResult) => ({
					id: broker._id,
					name:
						broker.branding?.brandName ||
						broker.userName ||
						broker.subdomain ||
						broker._id,
					status: broker.status ?? null,
				}))}
				customer={selectedCustomerDetail}
				isAssigningBroker={isAssigningBroker}
				isSyncing={isSyncing || isProvisioning}
				onAssignBroker={handleAssignBroker}
				onClose={() => {
					setSelectedCustomerId(null);
					setSelectedCustomerDetail(null);
				}}
				onCreateSchedule={() => {
					if (selectedCustomerId) {
						setScheduleCustomerId(selectedCustomerId);
						setIsScheduleDialogOpen(true);
					}
				}}
				onProvisionUser={handleProvisionFromDetail}
				onSyncToConvex={handleDetailSync}
				open={!!selectedCustomerId && !isDetailLoading}
			/>
		</>
	);
}
