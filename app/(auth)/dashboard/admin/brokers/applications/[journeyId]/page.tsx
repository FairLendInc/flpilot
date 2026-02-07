"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import {
	Building2,
	Calendar,
	CheckCircle,
	FileText,
	MessageSquare,
	User,
	XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export default function BrokerApplicationDetailPage() {
	const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
	const params = useParams();
	const router = useRouter();
	const journeyId = params.journeyId as Id<"onboarding_journeys">;

	const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
	const [approveDialogOpen, setApproveDialogOpen] = useState(false);
	const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);
	const [rejectionReason, setRejectionReason] = useState("");
	const [followUpMessage, setFollowUpMessage] = useState("");
	const [subdomain, setSubdomain] = useState("");
	const [commissionRate, setCommissionRate] = useState("2.5");

	const journey = useQuery(api.brokers.approval.reviewBrokerJourney, {
		journeyId,
	});

	const approveMutation = useMutation(
		api.brokers.approval.approveBrokerOnboarding
	);
	const rejectMutation = useMutation(
		api.brokers.approval.rejectBrokerOnboarding
	);
	const followUpMutation = useMutation(api.brokers.approval.sendAdminFollowUp);

	if (authLoading) {
		return <LoadingState />;
	}

	if (!isAuthenticated) {
		router.push("/sign-in");
		return null;
	}

	if (!journey) {
		return <LoadingState />;
	}

	const brokerData = journey.context?.broker;

	const handleApprove = async () => {
		try {
			await approveMutation({
				journeyId,
				subdomain: subdomain || brokerData?.proposedSubdomain || "",
				commissionRate: Number.parseFloat(commissionRate),
			});
			toast.success("Broker approved successfully");
			setApproveDialogOpen(false);
			router.push("/dashboard/admin/brokers");
		} catch (_err) {
			toast.error("Failed to approve broker");
		}
	};

	const handleReject = async () => {
		try {
			await rejectMutation({
				journeyId,
				reason: rejectionReason,
			});
			toast.success("Broker application rejected");
			setRejectDialogOpen(false);
			router.push("/dashboard/admin/brokers");
		} catch (_err) {
			toast.error("Failed to reject application");
		}
	};

	const handleSendFollowUp = async () => {
		try {
			await followUpMutation({
				journeyId,
				message: followUpMessage,
				requestType: "info_request",
			});
			toast.success("Follow-up request sent");
			setFollowUpDialogOpen(false);
			setFollowUpMessage("");
		} catch (_err) {
			toast.error("Failed to send follow-up");
		}
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "awaiting_admin":
				return <Badge variant="default">Awaiting Review</Badge>;
			case "draft":
				return <Badge variant="secondary">Draft</Badge>;
			case "approved":
				return <Badge variant="default">Approved</Badge>;
			case "rejected":
				return <Badge variant="destructive">Rejected</Badge>;
			default:
				return <Badge variant="outline">{status}</Badge>;
		}
	};

	return (
		<>
			<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator className="mr-2 h-4" orientation="vertical" />
				<Link
					className="text-muted-foreground hover:text-foreground"
					href="/dashboard/admin/brokers"
				>
					Broker Management
				</Link>
				<Separator className="mx-2 h-4" orientation="vertical" />
				<h1 className="font-semibold text-lg">Application Review</h1>
			</header>

			<div className="flex flex-1 flex-col gap-6 p-6">
				{/* Application Header */}
				<Card>
					<CardHeader>
						<div className="flex items-start justify-between">
							<div className="flex items-center gap-4">
								<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
									<Building2 className="h-6 w-6 text-primary" />
								</div>
								<div>
									<CardTitle className="text-xl">
										{brokerData?.companyInfo?.companyName || "Unnamed Company"}
									</CardTitle>
									<p className="text-muted-foreground text-sm">
										Application ID: {journey._id}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-4">
								{getStatusBadge(journey.status)}
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div className="grid gap-4 md:grid-cols-3">
							<div>
								<p className="font-medium text-sm">Submitted</p>
								<p className="text-muted-foreground text-sm">
									{new Date(journey.lastTouchedAt).toLocaleDateString()}
								</p>
							</div>
							<div>
								<p className="font-medium text-sm">Current Step</p>
								<p className="text-muted-foreground text-sm">
									{journey.stateValue}
								</p>
							</div>
							<div>
								<p className="font-medium text-sm">Proposed Subdomain</p>
								<p className="text-muted-foreground text-sm">
									{brokerData?.proposedSubdomain || "Not specified"}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Action Buttons */}
				{journey.status === "awaiting_admin" && (
					<div className="flex gap-4">
						<Dialog
							onOpenChange={setApproveDialogOpen}
							open={approveDialogOpen}
						>
							<DialogTrigger asChild>
								<Button variant="default">
									<CheckCircle className="mr-2 h-4 w-4" />
									Approve Application
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Approve Broker Application</DialogTitle>
									<DialogDescription>
										This will create a broker account with the proposed
										subdomain and provision a WorkOS organization.
									</DialogDescription>
								</DialogHeader>
								<div className="space-y-4 py-4">
									<div>
										<label className="font-medium text-sm" htmlFor="subdomain">
											Subdomain *
										</label>
										<input
											className="mt-2 w-full rounded-md border px-3 py-2"
											id="subdomain"
											onChange={(e) => setSubdomain(e.target.value)}
											placeholder={
												brokerData?.proposedSubdomain || "broker-subdomain"
											}
											type="text"
											value={subdomain}
										/>
										<p className="mt-1 text-muted-foreground text-xs">
											{subdomain || brokerData?.proposedSubdomain}.flpilot.com
										</p>
									</div>
									<div>
										<label
											className="font-medium text-sm"
											htmlFor="commissionRate"
										>
											Commission Rate (%)
										</label>
										<input
											className="mt-2 w-full rounded-md border px-3 py-2"
											id="commissionRate"
											onChange={(e) => setCommissionRate(e.target.value)}
											step="0.1"
											type="number"
											value={commissionRate}
										/>
									</div>
								</div>
								<DialogFooter>
									<Button
										onClick={() => setApproveDialogOpen(false)}
										variant="outline"
									>
										Cancel
									</Button>
									<Button onClick={handleApprove}>Approve</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>

						<Dialog onOpenChange={setRejectDialogOpen} open={rejectDialogOpen}>
							<DialogTrigger asChild>
								<Button variant="destructive">
									<XCircle className="mr-2 h-4 w-4" />
									Reject
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Reject Application</DialogTitle>
									<DialogDescription>
										Please provide a reason for rejecting this application. This
										will be shared with the applicant.
									</DialogDescription>
								</DialogHeader>
								<div className="py-4">
									<label
										className="font-medium text-sm"
										htmlFor="rejectionReason"
									>
										Rejection Reason *
									</label>
									<Textarea
										className="mt-2"
										id="rejectionReason"
										onChange={(e) => setRejectionReason(e.target.value)}
										placeholder="Explain why this application is being rejected..."
										value={rejectionReason}
									/>
								</div>
								<DialogFooter>
									<Button
										onClick={() => setRejectDialogOpen(false)}
										variant="outline"
									>
										Cancel
									</Button>
									<Button
										disabled={!rejectionReason.trim()}
										onClick={handleReject}
										variant="destructive"
									>
										Reject Application
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>

						<Dialog
							onOpenChange={setFollowUpDialogOpen}
							open={followUpDialogOpen}
						>
							<DialogTrigger asChild>
								<Button variant="outline">
									<MessageSquare className="mr-2 h-4 w-4" />
									Request Info
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Request Additional Information</DialogTitle>
									<DialogDescription>
										Send a message to the broker requesting additional
										information or clarification.
									</DialogDescription>
								</DialogHeader>
								<div className="py-4">
									<label
										className="font-medium text-sm"
										htmlFor="followUpMessage"
									>
										Message *
									</label>
									<Textarea
										className="mt-2"
										id="followUpMessage"
										onChange={(e) => setFollowUpMessage(e.target.value)}
										placeholder="What information do you need from the broker?"
										value={followUpMessage}
									/>
								</div>
								<DialogFooter>
									<Button
										onClick={() => setFollowUpDialogOpen(false)}
										variant="outline"
									>
										Cancel
									</Button>
									<Button
										disabled={!followUpMessage.trim()}
										onClick={handleSendFollowUp}
									>
										Send Request
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					</div>
				)}

				{/* Application Details Tabs */}
				<Tabs className="w-full" defaultValue="company">
					<TabsList>
						<TabsTrigger value="company">Company Info</TabsTrigger>
						<TabsTrigger value="licensing">Licensing</TabsTrigger>
						<TabsTrigger value="representatives">Representatives</TabsTrigger>
						<TabsTrigger value="documents">Documents</TabsTrigger>
						<TabsTrigger value="timeline">Timeline</TabsTrigger>
					</TabsList>

					<TabsContent className="mt-6" value="company">
						<Card>
							<CardHeader>
								<CardTitle>Company Information</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								{brokerData?.companyInfo ? (
									<>
										<div className="grid gap-4 md:grid-cols-2">
											<div>
												<p className="font-medium text-sm">Company Name</p>
												<p className="text-muted-foreground">
													{brokerData.companyInfo.companyName}
												</p>
											</div>
											<div>
												<p className="font-medium text-sm">Entity Type</p>
												<p className="text-muted-foreground">
													{brokerData.companyInfo.entityType}
												</p>
											</div>
											<div>
												<p className="font-medium text-sm">
													Registration Number
												</p>
												<p className="text-muted-foreground">
													{brokerData.companyInfo.registrationNumber}
												</p>
											</div>
											<div>
												<p className="font-medium text-sm">Business Email</p>
												<p className="text-muted-foreground">
													{brokerData.companyInfo.businessEmail}
												</p>
											</div>
										</div>
										<div className="pt-4">
											<p className="font-medium text-sm">Registered Address</p>
											<p className="text-muted-foreground">
												{brokerData.companyInfo.registeredAddress.street},
												<br />
												{brokerData.companyInfo.registeredAddress.city},{" "}
												{brokerData.companyInfo.registeredAddress.state}{" "}
												{brokerData.companyInfo.registeredAddress.zip}
												<br />
												{brokerData.companyInfo.registeredAddress.country}
											</p>
										</div>
									</>
								) : (
									<p className="text-muted-foreground">
										No company information provided.
									</p>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent className="mt-6" value="licensing">
						<Card>
							<CardHeader>
								<CardTitle>Licensing Information</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								{brokerData?.licensing ? (
									<div className="grid gap-4 md:grid-cols-2">
										<div>
											<p className="font-medium text-sm">License Type</p>
											<p className="text-muted-foreground">
												{brokerData.licensing.licenseType}
											</p>
										</div>
										<div>
											<p className="font-medium text-sm">License Number</p>
											<p className="text-muted-foreground">
												{brokerData.licensing.licenseNumber}
											</p>
										</div>
										<div>
											<p className="font-medium text-sm">Issuer</p>
											<p className="text-muted-foreground">
												{brokerData.licensing.issuer}
											</p>
										</div>
										<div>
											<p className="font-medium text-sm">Issue Date</p>
											<p className="text-muted-foreground">
												{brokerData.licensing.issuedDate}
											</p>
										</div>
										<div>
											<p className="font-medium text-sm">Expiry Date</p>
											<p className="text-muted-foreground">
												{brokerData.licensing.expiryDate}
											</p>
										</div>
										<div>
											<p className="font-medium text-sm">Jurisdictions</p>
											<p className="text-muted-foreground">
												{brokerData.licensing.jurisdictions.join(", ")}
											</p>
										</div>
									</div>
								) : (
									<p className="text-muted-foreground">
										No licensing information provided.
									</p>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent className="mt-6" value="representatives">
						<Card>
							<CardHeader>
								<CardTitle>Representatives</CardTitle>
							</CardHeader>
							<CardContent>
								{brokerData?.representatives &&
								brokerData.representatives.length > 0 ? (
									<div className="space-y-4">
										{brokerData.representatives.map((rep, index) => (
											<div
												className="flex items-start gap-4 rounded-lg border p-4"
												key={`${rep.email}-${index}`}
											>
												<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
													<User className="h-5 w-5 text-primary" />
												</div>
												<div className="flex-1">
													<p className="font-medium">
														{rep.firstName} {rep.lastName}
													</p>
													<p className="text-muted-foreground text-sm">
														{rep.role}
													</p>
													<p className="text-muted-foreground text-sm">
														{rep.email}
													</p>
													{rep.hasAuthority && (
														<Badge className="mt-2" variant="outline">
															Has Authority
														</Badge>
													)}
												</div>
											</div>
										))}
									</div>
								) : (
									<p className="text-muted-foreground">
										No representatives provided.
									</p>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent className="mt-6" value="documents">
						<Card>
							<CardHeader>
								<CardTitle>Documents</CardTitle>
							</CardHeader>
							<CardContent>
								{brokerData?.documents && brokerData.documents.length > 0 ? (
									<div className="space-y-4">
										{brokerData.documents.map((doc, index) => (
											<div
												className="flex items-center gap-4 rounded-lg border p-4"
												key={`${doc.storageId}-${index}`}
											>
												<FileText className="h-8 w-8 text-primary" />
												<div className="flex-1">
													<p className="font-medium">{doc.label}</p>
													<p className="text-muted-foreground text-sm">
														Type: {doc.type}
													</p>
													<p className="text-muted-foreground text-sm">
														Uploaded:{" "}
														{new Date(doc.uploadedAt).toLocaleDateString()}
													</p>
												</div>
											</div>
										))}
									</div>
								) : (
									<p className="text-muted-foreground">
										No documents provided.
									</p>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent className="mt-6" value="timeline">
						<Card>
							<CardHeader>
								<CardTitle>Communication Timeline</CardTitle>
							</CardHeader>
							<CardContent>
								{brokerData?.adminRequestTimeline &&
								brokerData.adminRequestTimeline.length > 0 ? (
									<div className="space-y-4">
										{brokerData.adminRequestTimeline.map((entry) => (
											<div
												className="flex gap-4 rounded-lg border p-4"
												key={entry.id}
											>
												<Calendar className="h-5 w-5 text-muted-foreground" />
												<div className="flex-1">
													<div className="mb-2 flex items-center gap-2">
														<Badge
															variant={entry.resolved ? "default" : "secondary"}
														>
															{entry.resolved ? "Resolved" : "Pending"}
														</Badge>
														<span className="text-muted-foreground text-sm">
															{new Date(entry.requestedAt).toLocaleDateString()}
														</span>
													</div>
													<p className="text-sm">{entry.message}</p>
													{entry.response && (
														<div className="mt-2 rounded bg-muted p-2">
															<p className="font-medium text-sm">Response:</p>
															<p className="text-sm">{entry.response}</p>
														</div>
													)}
												</div>
											</div>
										))}
									</div>
								) : (
									<p className="text-muted-foreground">No timeline entries.</p>
								)}
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</>
	);
}

function LoadingState() {
	return (
		<div className="flex flex-1 flex-col gap-6 p-6">
			<Card>
				<CardHeader>
					<Skeleton className="h-8 w-64" />
				</CardHeader>
				<CardContent>
					<div className="grid gap-4 md:grid-cols-3">
						<Skeleton className="h-16" />
						<Skeleton className="h-16" />
						<Skeleton className="h-16" />
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
