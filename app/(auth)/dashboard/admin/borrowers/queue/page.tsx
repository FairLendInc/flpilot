"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BorrowerApprovalQueue } from "@/components/admin/borrowers";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

// TODO: Replace with real Convex query - useAuthenticatedQuery(api.borrowerOnboarding.listPendingApprovals, {})
const MOCK_PENDING_JOURNEYS = [
	{
		id: "journey_001",
		submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
		context: {
			profile: {
				firstName: "Emily",
				lastName: "Watson",
				email: "emily.watson@email.com",
				phone: "(416) 555-0198",
				address: {
					street: "789 Maple Drive",
					city: "Mississauga",
					province: "ON",
					postalCode: "L5B 3C7",
					country: "Canada",
				},
			},
			idVerification: { status: "complete" as const },
			kycAml: { status: "complete" as const },
			rotessa: {
				status: "connected" as const,
				customerId: "rot_new123",
				linkedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
			},
			invitation: {
				invitedBy: "John Smith",
				invitedByRole: "broker",
				invitedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
			},
		},
	},
	{
		id: "journey_002",
		submittedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
		context: {
			profile: {
				firstName: "Robert",
				lastName: "Kim",
				email: "robert.kim@email.com",
				phone: "(647) 555-0234",
				address: {
					street: "456 Cedar Lane",
					city: "Brampton",
					province: "ON",
					postalCode: "L6Y 4P2",
					country: "Canada",
				},
			},
			idVerification: { status: "complete" as const },
			kycAml: { status: "pending" as const },
			rotessa: {
				status: "pending" as const,
			},
		},
	},
];

export default function AdminBorrowerQueuePage() {
	const router = useRouter();

	const handleApprove = async (_journeyId: string) => {
		// TODO: Replace with real Convex mutation - api.borrowerOnboarding.approve
		await new Promise((resolve) => setTimeout(resolve, 1000));
		toast.success("Borrower approved", {
			description:
				"The borrower has been notified and their account is now active.",
		});
	};

	const handleReject = async (_journeyId: string, _reason: string) => {
		// TODO: Replace with real Convex mutation - api.borrowerOnboarding.reject
		await new Promise((resolve) => setTimeout(resolve, 1000));
		toast.success("Application rejected", {
			description: "The applicant has been notified with your feedback.",
		});
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
				<BorrowerApprovalQueue
					onApprove={handleApprove}
					onReject={handleReject}
					onViewAllBorrowers={handleViewAllBorrowers}
					pendingJourneys={MOCK_PENDING_JOURNEYS}
				/>
			</div>
		</>
	);
}
