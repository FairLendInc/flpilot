"use client";

import { formatDistanceToNow } from "date-fns";
import {
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	MinusCircle,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { type RotessaStatus, RotessaStatusIcon } from "./RotessaStatusIcon";

type VerificationStatus = "complete" | "skipped" | "pending" | "failed";

type PendingBorrowerJourney = {
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
			status: RotessaStatus;
			customerId?: string;
			linkedAt?: string;
		};
		invitation?: {
			invitedBy: string;
			invitedByRole: string;
			invitedAt: string;
		};
	};
};

type PendingApplicationCardProps = {
	journey: PendingBorrowerJourney;
	onApprove: () => void;
	onReject: () => void;
	isApproving?: boolean;
	isRejecting?: boolean;
};

function getInitials(firstName: string, lastName: string): string {
	return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function VerificationBadge({
	label,
	status,
}: {
	label: string;
	status: VerificationStatus;
}) {
	const config = {
		complete: {
			icon: CheckCircle2,
			text: "Complete",
			className:
				"bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400",
		},
		skipped: {
			icon: MinusCircle,
			text: "Skipped",
			className:
				"bg-muted text-muted-foreground border-border dark:bg-slate-800",
		},
		pending: {
			icon: MinusCircle,
			text: "Pending",
			className:
				"bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400",
		},
		failed: {
			icon: XCircle,
			text: "Failed",
			className:
				"bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400",
		},
	};

	const { icon: Icon, text, className } = config[status];

	return (
		<div
			className={cn(
				"flex flex-col items-start gap-1 rounded-lg border px-3 py-2",
				className
			)}
		>
			<span className="font-medium text-xs opacity-70">{label}</span>
			<div className="flex items-center gap-1.5">
				<Icon className="h-3.5 w-3.5" />
				<span className="font-medium text-sm">{text}</span>
			</div>
		</div>
	);
}

export function PendingApplicationCard({
	journey,
	onApprove,
	onReject,
	isApproving,
	isRejecting,
}: PendingApplicationCardProps) {
	const [expanded, setExpanded] = useState(false);
	const { profile, idVerification, kycAml, rotessa, invitation } =
		journey.context;
	const fullName = `${profile.firstName} ${profile.lastName}`;
	const submittedAgo = formatDistanceToNow(new Date(journey.submittedAt), {
		addSuffix: true,
	});

	const _rotessaVerificationStatus: VerificationStatus =
		rotessa.status === "connected" ? "complete" : "pending";

	return (
		<Card className="overflow-hidden border-muted-foreground/10 transition-all duration-200 hover:shadow-md">
			<CardContent className="p-0">
				{/* Header Section */}
				<div className="flex items-start gap-4 p-5">
					<Avatar className="h-12 w-12 border-2 border-muted">
						<AvatarFallback className="bg-primary/10 font-semibold text-primary">
							{getInitials(profile.firstName, profile.lastName)}
						</AvatarFallback>
					</Avatar>

					<div className="min-w-0 flex-1">
						<div className="flex items-start justify-between gap-4">
							<div>
								<h3 className="truncate font-semibold text-lg">{fullName}</h3>
								<p className="truncate text-muted-foreground text-sm">
									{profile.email}
								</p>
								{profile.phone && (
									<p className="text-muted-foreground text-sm">
										{profile.phone}
									</p>
								)}
							</div>
							<Badge
								className="shrink-0 border-border bg-muted text-muted-foreground"
								variant="outline"
							>
								Submitted {submittedAgo}
							</Badge>
						</div>
					</div>
				</div>

				<Separator />

				{/* Verification Status Row */}
				<div className="flex gap-3 overflow-x-auto bg-muted/20 p-5">
					<VerificationBadge label="Profile" status="complete" />
					<VerificationBadge
						label="Identity"
						status={
							idVerification.status === "complete"
								? "complete"
								: idVerification.status === "skipped" ||
										idVerification.status === "pending"
									? "skipped"
									: "failed"
						}
					/>
					<VerificationBadge
						label="KYC/AML"
						status={
							kycAml.status === "complete"
								? "complete"
								: kycAml.status === "skipped" || kycAml.status === "pending"
									? "skipped"
									: "failed"
						}
					/>
					<div
						className={cn(
							"flex flex-col items-start gap-1 rounded-lg border px-3 py-2",
							rotessa.status === "connected"
								? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
								: "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
						)}
					>
						<span className="font-medium text-xs opacity-70">Rotessa</span>
						<div className="flex items-center gap-1.5">
							<RotessaStatusIcon status={rotessa.status} />
							<span className="font-medium text-sm">
								{rotessa.status === "connected" ? "Connected" : "Pending"}
							</span>
						</div>
					</div>
				</div>

				{/* Expandable Details */}
				{expanded && (
					<>
						<Separator />
						<div className="space-y-4 bg-muted/10 p-5">
							{/* Address */}
							{profile.address && (
								<div>
									<h4 className="mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
										Address
									</h4>
									<p className="text-sm">{profile.address.street}</p>
									<p className="text-muted-foreground text-sm">
										{profile.address.city}, {profile.address.province}{" "}
										{profile.address.postalCode}
									</p>
								</div>
							)}

							{/* Invitation Details */}
							{invitation && (
								<div>
									<h4 className="mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
										Invited By
									</h4>
									<p className="text-sm">
										{invitation.invitedBy} ({invitation.invitedByRole})
									</p>
									<p className="text-muted-foreground text-sm">
										on{" "}
										{new Date(invitation.invitedAt).toLocaleDateString(
											"en-US",
											{
												year: "numeric",
												month: "long",
												day: "numeric",
											}
										)}
									</p>
								</div>
							)}

							{/* Rotessa Details */}
							{rotessa.customerId && (
								<div>
									<h4 className="mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
										Rotessa Customer
									</h4>
									<p className="font-mono text-sm">{rotessa.customerId}</p>
								</div>
							)}

							{/* Journey ID */}
							<div>
								<h4 className="mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
									Journey ID
								</h4>
								<p className="font-mono text-muted-foreground text-sm">
									{journey.id}
								</p>
							</div>
						</div>
					</>
				)}

				<Separator />

				{/* Actions */}
				<div className="flex items-center justify-between gap-3 bg-muted/5 p-4">
					<Button
						className="gap-1.5"
						onClick={() => setExpanded(!expanded)}
						size="sm"
						variant="ghost"
					>
						{expanded ? (
							<>
								<ChevronUp className="h-4 w-4" />
								Hide Details
							</>
						) : (
							<>
								<ChevronDown className="h-4 w-4" />
								View Details
							</>
						)}
					</Button>

					<div className="flex gap-2">
						<Button
							disabled={isApproving || isRejecting}
							onClick={onReject}
							size="sm"
							variant="outline"
						>
							{isRejecting ? "Rejecting..." : "Reject"}
						</Button>
						<Button
							className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
							disabled={isApproving || isRejecting}
							onClick={onApprove}
							size="sm"
						>
							<CheckCircle2 className="h-4 w-4" />
							{isApproving ? "Approving..." : "Approve"}
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
