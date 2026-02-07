"use client";

import { useAction, useConvexAuth } from "convex/react";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	type BorrowerData,
	BorrowerDetailSheet,
	BorrowerManagementTable,
} from "@/components/admin/borrowers";
import type { RotessaStatus } from "@/components/admin/borrowers/RotessaStatusIcon";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuthenticatedQuery } from "@/convex/lib/client";

/**
 * Derive Rotessa status from borrower data
 */
function getRotessaStatus(borrower: {
	rotessaCustomerId?: string;
	rotessaSyncError?: string;
	rotessaLastSyncAt?: number;
}): RotessaStatus {
	if (borrower.rotessaSyncError) {
		return "error";
	}
	if (borrower.rotessaCustomerId) {
		return "connected";
	}
	if (borrower.rotessaLastSyncAt) {
		return "pending";
	}
	return "not_connected";
}

/**
 * Format timestamp to date string
 */
function formatDate(timestamp?: number): string {
	if (!timestamp) return "";
	return new Date(timestamp).toISOString().split("T")[0] ?? "";
}

export default function AdminBorrowersPage() {
	const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
	const [selectedBorrowerId, setSelectedBorrowerId] =
		useState<Id<"borrowers"> | null>(null);
	const [statusFilter, _setStatusFilter] = useState<
		"all" | "pending_approval" | "active" | "inactive" | "suspended"
	>("all");
	const [searchQuery, _setSearchQuery] = useState("");

	// Fetch borrowers from Convex
	const borrowersResult = useAuthenticatedQuery(
		api.borrowers.listBorrowersAdmin,
		{
			statusFilter,
			searchQuery: searchQuery || undefined,
		}
	);

	// Rotessa sync action
	const syncRotessaAction = useAction(
		api.rotessaAdmin.syncRotessaCustomerToConvex
	);

	// Get borrower details for the sheet
	const borrowerDetails = useAuthenticatedQuery(
		api.borrowers.getBorrowerAdmin,
		selectedBorrowerId ? { borrowerId: selectedBorrowerId } : "skip"
	);

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

	// Transform borrowers to BorrowerData format
	const borrowers: BorrowerData[] = (borrowersResult?.borrowers ?? []).map(
		(b: NonNullable<typeof borrowersResult>["borrowers"][number]) => ({
			_id: b._id,
			name: b.name,
			email: b.email,
			phone: b.phone,
			status: b.status ?? "pending_approval",
			rotessaCustomerId: b.rotessaCustomerId,
			rotessaStatus: getRotessaStatus(b),
			userId: b.userId,
			createdAt: formatDate(b._creationTime),
		})
	);

	const handleViewDetail = (borrowerId: Id<"borrowers">) => {
		setSelectedBorrowerId(borrowerId);
	};

	const handleEdit = (borrowerId: Id<"borrowers">) => {
		toast.info("Edit functionality coming soon", {
			description: `Editing borrower ${borrowerId}`,
		});
	};

	const handleLinkUser = (borrowerId: Id<"borrowers">) => {
		// Find the borrower to get their Rotessa ID
		const borrower = borrowers.find((b) => b._id === borrowerId);
		if (!borrower?.rotessaCustomerId) {
			toast.error("Borrower does not have a Rotessa customer ID");
			return;
		}
		toast.info("Link user functionality - use Rotessa Customers page", {
			description: "Navigate to Rotessa Customers to provision a user account",
		});
	};

	const handleSyncRotessa = async (borrowerId: Id<"borrowers">) => {
		const borrower = borrowers.find((b) => b._id === borrowerId);
		if (!borrower?.rotessaCustomerId) {
			toast.error("Borrower does not have a Rotessa customer ID");
			return;
		}

		toast.info("Syncing with Rotessa...");

		try {
			const result = await syncRotessaAction({
				rotessaCustomerId: Number.parseInt(borrower.rotessaCustomerId, 10),
				createBorrower: false,
			});

			if (result.success) {
				toast.success("Borrower synced with Rotessa");
			} else {
				toast.error("Sync failed", { description: result.error });
			}
		} catch (error) {
			toast.error("Sync failed", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		}
	};

	const handleSuspend = (_borrowerId: Id<"borrowers">) => {
		toast.warning("Suspend functionality coming soon");
	};

	const handleInvite = () => {
		toast.info("Invite borrower functionality coming soon");
	};

	const selectedBorrower = borrowers.find((b) => b._id === selectedBorrowerId);

	// Sheet-level handlers
	const handleSheetEdit = () => {
		if (selectedBorrowerId) {
			handleEdit(selectedBorrowerId);
		}
	};

	const handleSheetSyncRotessa = async () => {
		if (selectedBorrowerId) {
			await handleSyncRotessa(selectedBorrowerId);
		}
	};

	const handleSheetSuspend = () => {
		if (selectedBorrowerId) {
			handleSuspend(selectedBorrowerId);
		}
	};

	return (
		<>
			<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator className="mr-2 h-4" orientation="vertical" />
				<h1 className="font-semibold text-lg">Borrower Management</h1>
				{borrowersResult && (
					<span className="ml-2 text-muted-foreground text-sm">
						({borrowersResult.totalCount} total)
					</span>
				)}
			</header>

			<div className="flex flex-1 flex-col gap-6 p-6">
				{borrowersResult ? (
					<BorrowerManagementTable
						borrowers={borrowers}
						onEdit={handleEdit}
						onInvite={handleInvite}
						onLinkUser={handleLinkUser}
						onSuspend={handleSuspend}
						onSyncRotessa={handleSyncRotessa}
						onViewDetail={handleViewDetail}
					/>
				) : (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
					</div>
				)}
			</div>

			{/* Detail Sheet */}
			<BorrowerDetailSheet
				borrower={
					selectedBorrower && borrowerDetails
						? {
								id: selectedBorrower._id,
								name: selectedBorrower.name,
								email: selectedBorrower.email,
								phone: selectedBorrower.phone,
								address: borrowerDetails.borrower.address ?? {
									street: "Address not available",
									city: "",
									province: "",
									postalCode: "",
									country: "",
								},
								status: selectedBorrower.status,
								rotessaStatus: selectedBorrower.rotessaStatus,
								rotessaCustomerId: selectedBorrower.rotessaCustomerId,
								userId: selectedBorrower.userId,
								createdAt: selectedBorrower.createdAt,
							}
						: null
				}
				mortgages={
					borrowerDetails?.mortgages?.map(
						(m: NonNullable<typeof borrowerDetails>["mortgages"][number]) => ({
							id: m._id,
							propertyAddress: m.propertyAddress,
							principal: m.loanAmount,
							interestRate: m.interestRate,
							monthlyPayment: m.monthlyInterestPayment,
							status:
								m.status === "active"
									? ("active" as const)
									: m.status === "closed"
										? ("completed" as const)
										: m.status === "defaulted"
											? ("default" as const)
											: ("active" as const),
							termMonths: 12,
							remainingMonths: 12,
							rotessaScheduleId: m.rotessaScheduleId?.toString(),
						})
					) ?? []
				}
				onClose={() => setSelectedBorrowerId(null)}
				onEdit={handleSheetEdit}
				onSuspend={handleSheetSuspend}
				onSyncRotessa={handleSheetSyncRotessa}
				open={!!selectedBorrowerId}
				recentPayments={
					borrowerDetails?.recentPayments?.map(
						(
							payment: NonNullable<
								typeof borrowerDetails
							>["recentPayments"][number]
						) => ({
							id: String(payment._id),
							date: payment.processDate,
							amount: payment.amount,
							status:
								payment.status === "processing"
									? "pending"
									: payment.status === "nsf"
										? "failed"
										: payment.status === "cleared" ||
												payment.status === "failed" ||
												payment.status === "pending"
											? payment.status
											: "pending",
							propertyAddress: payment.propertyAddress,
						})
					) ?? []
				}
			/>
		</>
	);
}
