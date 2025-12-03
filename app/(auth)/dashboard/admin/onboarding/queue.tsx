"use client";

import { useMutation } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { useAuthenticatedQuery } from "@/convex/lib/client";

export function PreloadedOnboardingQueue() {
	return <OnboardingQueueClient />;
}

function OnboardingQueueClient() {
	const pending = useAuthenticatedQuery(api.onboarding.listPending, {});
	const organizations = useAuthenticatedQuery(
		api.organizations.listOrganizations,
		{}
	);
	const approveJourney = useMutation(api.onboarding.approveJourney);
	const rejectJourney = useMutation(api.onboarding.rejectJourney);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [notes, setNotes] = useState("");
	const [rejectNotes, setRejectNotes] = useState("");
	const [selectedOrganizationId, setSelectedOrganizationId] = useState<
		string | null
	>(null);
	const [processing, setProcessing] = useState<"approve" | "reject" | null>(
		null
	);

	const selected = useMemo(
		() => pending?.find((entry) => entry.journey._id === selectedId),
		[pending, selectedId]
	);

	// Check if user needs organization selection
	const needsOrganizationSelection = useMemo(() => {
		if (!selected?.applicant) return false;
		return !selected.applicant.active_organization_id;
	}, [selected]);

	// Reset organization selection when selected changes
	useEffect(() => {
		if (selected?.applicant?.active_organization_id) {
			setSelectedOrganizationId(selected.applicant.active_organization_id);
		} else {
			setSelectedOrganizationId(null);
		}
	}, [selected]);

	const handleApprove = async () => {
		if (!selected) return;

		// Validate organization selection if needed
		if (needsOrganizationSelection && !selectedOrganizationId) {
			toast.error("Please select an organization to assign the role");
			return;
		}

		setProcessing("approve");
		try {
			await approveJourney({
				journeyId: selected.journey._id,
				notes,
				organizationId: needsOrganizationSelection
					? selectedOrganizationId || undefined
					: undefined,
			});
			setNotes("");
			setSelectedOrganizationId(null);
			setSelectedId(null);
			toast.success("Journey approved");
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : "Unable to approve journey";
			toast.error(message);
		} finally {
			setProcessing(null);
		}
	};

	const handleReject = async () => {
		if (!selected) return;
		setProcessing("reject");
		try {
			await rejectJourney({
				journeyId: selected.journey._id,
				reason: rejectNotes || "No details provided",
			});
			setRejectNotes("");
			setSelectedId(null);
			toast.message("Journey rejected");
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : "Unable to reject journey";
			toast.error(message);
		} finally {
			setProcessing(null);
		}
	};

	if (pending === undefined) {
		return (
			<div className="p-6">
				<Spinner className="size-5" />
			</div>
		);
	}

	if (!pending || pending.length === 0) {
		return (
			<Card className="m-6 border-dashed">
				<CardHeader>
					<CardTitle>No onboarding submissions</CardTitle>
				</CardHeader>
				<CardContent className="text-muted-foreground text-sm">
					Members will appear here after submitting their investor profile.
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="grid gap-6 p-6 lg:grid-cols-[2fr_1fr]">
			<div className="space-y-4">
				{pending.map((entry) => (
					<Card className="border" key={entry.journey._id}>
						<CardContent className="flex items-center justify-between gap-4 py-4">
							<div>
								<p className="font-medium">
									{entry.applicant?.first_name} {entry.applicant?.last_name}
								</p>
								<p className="text-muted-foreground text-sm">
									{entry.applicant?.email}
								</p>
							</div>
							<div className="text-muted-foreground text-sm">
								{formatDistanceToNow(new Date(entry.journey.lastTouchedAt), {
									addSuffix: true,
								})}
							</div>
							<div className="flex items-center gap-2">
								<Badge variant="outline">{entry.journey.persona}</Badge>
								<Button
									onClick={() => {
										setSelectedId(entry.journey._id);
									}}
									size="sm"
									variant="ghost"
								>
									Review
								</Button>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
			<Sheet onOpenChange={() => setSelectedId(null)} open={Boolean(selected)}>
				<SheetContent className="w-full max-w-lg" side="right">
					<SheetHeader>
						<SheetTitle>Submission details</SheetTitle>
					</SheetHeader>
					{selected ? (
						<ScrollArea className="mt-4 h-[calc(100vh-7rem)] space-y-5 pr-4">
							<section className="space-y-2 rounded border p-4">
								<p className="font-medium text-sm">Profile</p>
								<p className="text-muted-foreground text-sm">
									{[
										selected.journey.context?.investor?.profile?.firstName,
										selected.journey.context?.investor?.profile?.middleName,
										selected.journey.context?.investor?.profile?.lastName,
									]
										.filter(Boolean)
										.join(" ")}
								</p>
							</section>
							<section className="space-y-2 rounded border p-4">
								<p className="font-medium text-sm">Preferences</p>
								<p className="text-muted-foreground text-sm">
									$
									{selected.journey.context?.investor?.preferences?.minTicket?.toLocaleString()}{" "}
									– $
									{selected.journey.context?.investor?.preferences?.maxTicket?.toLocaleString()}
								</p>
								<p className="text-muted-foreground text-sm">
									Risk{" "}
									{selected.journey.context?.investor?.preferences?.riskProfile}
								</p>
							</section>
							{needsOrganizationSelection && (
								<section className="space-y-2 rounded border p-4">
									<Label
										className="font-medium text-sm"
										htmlFor="organization-select"
									>
										Organization
									</Label>
									<p className="mb-2 text-muted-foreground text-xs">
										User has no active organization. Select an organization to
										assign the role.
									</p>
									{organizations === undefined ? (
										<Spinner className="size-4" />
									) : (
										<Select
											onValueChange={(value) =>
												setSelectedOrganizationId(value)
											}
											value={selectedOrganizationId || undefined}
										>
											<SelectTrigger id="organization-select">
												<SelectValue placeholder="Select organization..." />
											</SelectTrigger>
											<SelectContent>
												{organizations?.map((org) => (
													<SelectItem key={org.id} value={org.id}>
														{org.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									)}
								</section>
							)}
							<section className="space-y-2 rounded border p-4">
								<p className="font-medium text-sm">Notes to investor</p>
								<Textarea
									onChange={(event) => setNotes(event.target.value)}
									placeholder="Shared only on approval"
									rows={4}
									value={notes}
								/>
							</section>
							<section className="space-y-2 rounded border p-4">
								<p className="font-medium text-sm">Rejection reason</p>
								<Textarea
									onChange={(event) => setRejectNotes(event.target.value)}
									placeholder="Visible to the applicant"
									rows={3}
									value={rejectNotes}
								/>
							</section>
							<div className="flex flex-col gap-2">
								<Button
									disabled={
										processing === "approve" ||
										(needsOrganizationSelection && !selectedOrganizationId)
									}
									onClick={handleApprove}
								>
									{processing === "approve" ? "Approving..." : "Approve"}
								</Button>
								<Button
									disabled={processing === "reject"}
									onClick={handleReject}
									variant="outline"
								>
									{processing === "reject" ? "Rejecting..." : "Reject"}
								</Button>
							</div>
						</ScrollArea>
					) : null}
				</SheetContent>
			</Sheet>
		</div>
	);
}
