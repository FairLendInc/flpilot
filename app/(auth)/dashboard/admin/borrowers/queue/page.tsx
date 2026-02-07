"use client";

import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BorrowerApprovalQueue } from "@/components/admin/borrowers";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuthenticatedQuery } from "@/convex/lib/client";

type VerificationStatus = "complete" | "skipped" | "pending" | "failed";
type QueueJourney = {
	id: string;
	submittedAt: string;
	context: {
		profile: {
			firstName: string;
			lastName: string;
			email: string;
			phone?: string;
			address?: {
				street: string;
				city: string;
				province: string;
				postalCode: string;
				country: string;
			};
		};
		idVerification: { status: VerificationStatus };
		kycAml: { status: VerificationStatus };
		rotessa: {
			status: "connected" | "pending" | "not_connected" | "error";
			customerId?: string;
			linkedAt?: string;
		};
	};
};

const mapIdVerificationStatus = (status?: string): VerificationStatus => {
	switch (status) {
		case "verified":
			return "complete";
		case "skipped":
			return "skipped";
		case "failed":
		case "mismatch":
			return "failed";
		default:
			return "pending";
	}
};

const mapKycStatus = (status?: string): VerificationStatus => {
	switch (status) {
		case "passed":
			return "complete";
		case "skipped":
			return "skipped";
		case "failed":
			return "failed";
		default:
			return "pending";
	}
};

const mapRotessaStatus = (
	status?: string
): "connected" | "pending" | "not_connected" | "error" => {
	switch (status) {
		case "linked":
		case "created":
		case "active":
			return "connected";
		case "pending":
			return "pending";
		case "failed":
			return "error";
		default:
			return "not_connected";
	}
};

export default function AdminBorrowerQueuePage() {
	const router = useRouter();

	const pendingJourneysData = useAuthenticatedQuery(
		api.borrowerOnboarding.getPendingBorrowerJourneys,
		{}
	);
	const approveBorrowerJourney = useMutation(
		api.borrowerOnboarding.approveBorrowerJourney
	);
	const rejectBorrowerJourney = useMutation(
		api.borrowerOnboarding.rejectBorrowerJourney
	);

	const pendingJourneys = (pendingJourneysData ?? []).reduce<QueueJourney[]>(
		(
			acc: QueueJourney[],
			journey: NonNullable<typeof pendingJourneysData>[number]
		) => {
			const borrowerContext = journey.context?.borrower;
			const profile = borrowerContext?.profile;

			if (!(borrowerContext && profile)) {
				return acc;
			}

			acc.push({
				id: journey._id,
				submittedAt: journey.lastTouchedAt,
				context: {
					profile: {
						firstName: profile.firstName ?? "",
						lastName: profile.lastName ?? "",
						email: profile.email ?? "",
						phone: profile.phone,
						address: profile.address,
					},
					idVerification: {
						status: mapIdVerificationStatus(
							borrowerContext.idVerification?.status
						),
					},
					kycAml: {
						status: mapKycStatus(borrowerContext.kycAml?.status),
					},
					rotessa: {
						status: mapRotessaStatus(borrowerContext.rotessa?.status),
						customerId: borrowerContext.rotessa?.customerId?.toString(),
						linkedAt: borrowerContext.rotessa?.linkedAt,
					},
				},
			});

			return acc;
		},
		[]
	);

	const handleApprove = async (_journeyId: string) => {
		try {
			await approveBorrowerJourney({
				journeyId: _journeyId as Id<"onboarding_journeys">,
			});
			toast.success("Borrower approved", {
				description:
					"The borrower has been notified and their account is now active.",
			});
		} catch (error) {
			toast.error("Failed to approve borrower", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		}
	};

	const handleReject = async (_journeyId: string, _reason: string) => {
		try {
			await rejectBorrowerJourney({
				journeyId: _journeyId as Id<"onboarding_journeys">,
				reason: _reason,
			});
			toast.success("Application rejected", {
				description: "The applicant has been notified with your feedback.",
			});
		} catch (error) {
			toast.error("Failed to reject application", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		}
	};

	const handleViewAllBorrowers = () => {
		router.push("/dashboard/admin/borrowers");
	};

	return (
		<>
			<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator className="mr-2 h-4" orientation="vertical" />
				<h1 className="font-semibold text-lg">Borrower Approval Queue</h1>
			</header>

			<div className="flex flex-1 flex-col gap-6 p-6">
				{pendingJourneysData ? (
					<BorrowerApprovalQueue
						onApprove={handleApprove}
						onReject={handleReject}
						onViewAllBorrowers={handleViewAllBorrowers}
						pendingJourneys={pendingJourneys}
					/>
				) : (
					<div className="flex h-48 items-center justify-center">
						<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
					</div>
				)}
			</div>
		</>
	);
}
