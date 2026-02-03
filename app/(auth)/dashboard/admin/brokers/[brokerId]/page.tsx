"use client";

import { useAction, useConvexAuth, useMutation, useQuery } from "convex/react";
import {
	AlertTriangle,
	ArrowLeft,
	Building2,
	Check,
	CheckCircle2,
	Copy,
	DollarSign,
	ExternalLink,
	FileText,
	Globe,
	Link2,
	Loader2,
	Mail,
	MapPin,
	Palette,
	Pause,
	Phone,
	Play,
	Plus,
	RefreshCw,
	Settings,
	Shield,
	Trash2,
	User,
	Users,
	XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { BASE_DOMAIN, getPortalUrl } from "@/lib/config";

export default function BrokerDetailPage() {
	const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
	const params = useParams();
	const router = useRouter();
	const brokerId = params.brokerId as Id<"brokers">;

	// Queries
	const broker = useQuery(api.brokers.management.getBrokerWithApplicationData, {
		brokerId,
	});

	const stats = useQuery(api.brokers.stats.getBrokerDashboardStats, {
		brokerId,
		timeRange: "all",
	});

	const clients = useQuery(api.brokers.stats.getBrokerClientList, {
		brokerId,
	});

	const allBrokers = useQuery(api.brokers.management.listBrokers, {
		status: "active",
	});

	const brokerClients = useQuery(api.brokers.clients.listBrokerClientsAdmin, {
		brokerId,
	});

	// Mutations
	const updateProfile = useMutation(api.brokers.management.updateBrokerProfile);
	const updateSubdomain = useMutation(
		api.brokers.management.updateBrokerSubdomain
	);
	const updateCustomDomain = useMutation(
		api.brokers.management.updateBrokerCustomDomain
	);
	const updateCommission = useMutation(
		api.brokers.management.updateBrokerCommissionRates
	);
	const suspendBroker = useMutation(api.brokers.management.suspendBroker);
	const reactivateBroker = useMutation(api.brokers.management.reactivateBroker);
	const revokeBroker = useMutation(api.brokers.management.revokeBroker);
	const deleteBroker = useMutation(
		api.brokers.management.deleteBrokerWithCleanup
	);
	const reassignClient = useMutation(api.brokers.clients.reassignBrokerClient);
	const reassignAllClients = useMutation(
		api.brokers.clients.reassignAllBrokerClients
	);

	// Actions (WorkOS)
	const provisionWorkOSOrg = useAction(
		api.brokers.workos.provisionWorkOSOrganizationAdmin
	);
	const updateWorkOSOrg = useAction(
		api.brokers.workos.updateBrokerWorkOSOrganization
	);
	const verifyWorkOSStatus = useAction(
		api.brokers.workos.verifyBrokerWorkOSStatus
	);

	// Dialog states
	const [profileDialogOpen, setProfileDialogOpen] = useState(false);
	const [subdomainDialogOpen, setSubdomainDialogOpen] = useState(false);
	const [customDomainDialogOpen, setCustomDomainDialogOpen] = useState(false);
	const [commissionDialogOpen, setCommissionDialogOpen] = useState(false);
	const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
	const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [reassignAllDialogOpen, setReassignAllDialogOpen] = useState(false);
	const [provisionOrgDialogOpen, setProvisionOrgDialogOpen] = useState(false);
	const [changeOrgDialogOpen, setChangeOrgDialogOpen] = useState(false);

	// Form states
	const [brandName, setBrandName] = useState("");
	const [primaryColor, setPrimaryColor] = useState("");
	const [secondaryColor, setSecondaryColor] = useState("");
	const [newSubdomain, setNewSubdomain] = useState("");
	const [newCustomDomain, setNewCustomDomain] = useState("");
	const [newCommissionRate, setNewCommissionRate] = useState("");
	const [suspendReason, setSuspendReason] = useState("");
	const [revokeReason, setRevokeReason] = useState("");
	const [deleteConfirmation, setDeleteConfirmation] = useState("");
	const [reassignTargetBrokerId, setReassignTargetBrokerId] = useState("");
	const [newOrgName, setNewOrgName] = useState("");
	const [newWorkosOrgId, setNewWorkosOrgId] = useState("");
	const [isProvisioningOrg, setIsProvisioningOrg] = useState(false);
	const [isUpdatingOrg, setIsUpdatingOrg] = useState(false);
	const [copiedOrgId, setCopiedOrgId] = useState(false);
	const [assignExistingDialogOpen, setAssignExistingDialogOpen] =
		useState(false);
	const [isVerifyingStatus, setIsVerifyingStatus] = useState(false);
	const [isSyncingFromWorkOS, setIsSyncingFromWorkOS] = useState(false);
	const [verificationResult, setVerificationResult] = useState<{
		success: boolean;
		localOrgId: string | null;
		workosData: {
			memberships: Array<{
				id: string;
				organizationId: string;
				organizationName?: string;
				status: string;
				role?: string;
				roles?: Array<{ slug: string }>;
			}>;
		};
		isSynced: boolean;
		suggestedOrgId: string | null;
		error?: string;
	} | null>(null);

	const _isLoading = authLoading || !broker || !stats;

	if (authLoading) {
		return <LoadingState />;
	}

	if (!isAuthenticated) {
		router.push("/sign-in");
		return null;
	}

	if (!broker) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center p-6">
				<Building2 className="mb-4 h-16 w-16 text-muted-foreground" />
				<h1 className="mb-2 font-bold text-2xl">Broker Not Found</h1>
				<p className="text-muted-foreground">
					The broker you're looking for doesn't exist or has been removed.
				</p>
				<Button asChild className="mt-4">
					<Link href="/dashboard/admin/brokers/managed">Back to Brokers</Link>
				</Button>
			</div>
		);
	}

	const displayBrandName = broker.branding?.brandName || broker.subdomain;
	const portalUrl = broker.customDomain
		? `https://${broker.customDomain}`
		: getPortalUrl(broker.subdomain);
	const applicationData = broker.applicationData;

	return (
		<>
			<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator className="mr-2 h-4" orientation="vertical" />
				<Button asChild size="sm" variant="ghost">
					<Link href="/dashboard/admin/brokers/managed">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back
					</Link>
				</Button>
				<Separator className="mx-2 h-4" orientation="vertical" />
				<h1 className="font-semibold text-lg">{displayBrandName}</h1>
				<Badge
					className="ml-2"
					variant={broker.status === "active" ? "default" : "secondary"}
				>
					{broker.status}
				</Badge>
			</header>

			<div className="flex flex-1 flex-col gap-6 p-6">
				<div className="grid gap-4 md:grid-cols-4">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Total Clients
							</CardTitle>
							<Users className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">
								{stats?.clients?.total || 0}
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">AUM</CardTitle>
							<DollarSign className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">
								${((stats?.assets?.totalAUM || 0) / 1000000).toFixed(1)}M
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">Total Deals</CardTitle>
							<Building2 className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">
								{stats?.deals?.dealCount || 0}
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">Commissions</CardTitle>
							<DollarSign className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">
								${((stats?.commissions?.totalEarned || 0) / 1000).toFixed(0)}K
							</div>
						</CardContent>
					</Card>
				</div>

				<Tabs defaultValue="overview">
					<TabsList className="flex-wrap">
						<TabsTrigger value="overview">Overview</TabsTrigger>
						<TabsTrigger value="company">Company Info</TabsTrigger>
						<TabsTrigger value="licensing">Licensing</TabsTrigger>
						<TabsTrigger value="representatives">Representatives</TabsTrigger>
						<TabsTrigger value="documents">Documents</TabsTrigger>
						<TabsTrigger value="clients">
							Clients ({clients?.clients?.length || 0})
						</TabsTrigger>
						<TabsTrigger value="settings">Settings</TabsTrigger>
					</TabsList>

					<TabsContent className="space-y-4" value="overview">
						<Card>
							<CardHeader>
								<CardTitle>Broker Information</CardTitle>
							</CardHeader>
							<CardContent className="space-y-6">
								{/* Broker Personal Info */}
								<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
									<div className="space-y-1">
										<Label className="flex items-center gap-1 text-muted-foreground">
											<User className="h-3 w-3" />
											Broker Name
										</Label>
										<p className="font-medium">
											{broker.user?.firstName && broker.user?.lastName
												? `${broker.user.firstName} ${broker.user.lastName}`
												: broker.user?.firstName ||
													broker.user?.lastName ||
													"Not provided"}
										</p>
									</div>
									<div className="space-y-1">
										<Label className="flex items-center gap-1 text-muted-foreground">
											<Mail className="h-3 w-3" />
											Email
										</Label>
										<p className="font-medium">
											{broker.user?.email || "Not provided"}
										</p>
									</div>
									<div className="space-y-1">
										<Label className="flex items-center gap-1 text-muted-foreground">
											<Phone className="h-3 w-3" />
											Phone
										</Label>
										<p className="font-medium">
											{broker.user?.phone || "Not provided"}
										</p>
									</div>
									<div className="space-y-1">
										<Label className="text-muted-foreground">
											Company Name
										</Label>
										<p className="font-medium">
											{applicationData?.companyInfo?.companyName ||
												broker.branding?.brandName ||
												"Not provided"}
										</p>
									</div>
								</div>
								<Separator />
								{/* Business Contact */}
								<div className="grid gap-4 md:grid-cols-2">
									<div className="space-y-1">
										<Label className="flex items-center gap-1 text-muted-foreground">
											<Mail className="h-3 w-3" />
											Business Email
										</Label>
										<p className="font-medium">
											{applicationData?.companyInfo?.businessEmail ||
												"Not provided"}
										</p>
									</div>
									<div className="space-y-1">
										<Label className="flex items-center gap-1 text-muted-foreground">
											<Phone className="h-3 w-3" />
											Business Phone
										</Label>
										<p className="font-medium">
											{applicationData?.companyInfo?.businessPhone ||
												"Not provided"}
										</p>
									</div>
								</div>
								<Separator />
								{/* Portal & Account Info */}
								<div className="grid gap-4 md:grid-cols-2">
									<div className="space-y-1">
										<Label className="text-muted-foreground">Subdomain</Label>
										<p className="font-medium">
											{broker.subdomain}.{BASE_DOMAIN}
										</p>
									</div>
									<div className="space-y-1">
										<Label className="text-muted-foreground">Portal URL</Label>
										<Button asChild className="h-auto p-0" variant="link">
											<Link
												href={portalUrl}
												rel="noopener noreferrer"
												target="_blank"
											>
												{portalUrl}{" "}
												<ExternalLink className="ml-1 inline h-3 w-3" />
											</Link>
										</Button>
									</div>
									<div className="space-y-1">
										<Label className="text-muted-foreground">
											Commission Rate
										</Label>
										<p className="font-medium">
											{broker.commission?.ratePercentage || 0}%
										</p>
									</div>
									<div className="space-y-1">
										<Label className="text-muted-foreground">Approved At</Label>
										<p className="font-medium">
											{new Date(broker.approvedAt).toLocaleDateString()}
										</p>
									</div>
									<div className="space-y-1">
										<Label className="text-muted-foreground">Status</Label>
										<p className="font-medium capitalize">{broker.status}</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent className="space-y-4" value="company">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Building2 className="h-5 w-5" />
									Company Information
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-6">
								{applicationData?.companyInfo ? (
									<>
										<div className="grid gap-6 md:grid-cols-2">
											<div className="space-y-1">
												<Label className="text-muted-foreground">
													Company Name
												</Label>
												<p className="font-medium">
													{applicationData.companyInfo.companyName}
												</p>
											</div>
											<div className="space-y-1">
												<Label className="text-muted-foreground">
													Entity Type
												</Label>
												<p className="font-medium capitalize">
													{applicationData.companyInfo.entityType.replace(
														/_/g,
														" "
													)}
												</p>
											</div>
											<div className="space-y-1">
												<Label className="text-muted-foreground">
													Registration Number
												</Label>
												<p className="font-medium">
													{applicationData.companyInfo.registrationNumber}
												</p>
											</div>
											<div className="space-y-1">
												<Label className="flex items-center gap-1 text-muted-foreground">
													<Mail className="h-3 w-3" />
													Business Email
												</Label>
												<p className="font-medium">
													{applicationData.companyInfo.businessEmail}
												</p>
											</div>
											<div className="space-y-1">
												<Label className="flex items-center gap-1 text-muted-foreground">
													<Phone className="h-3 w-3" />
													Business Phone
												</Label>
												<p className="font-medium">
													{applicationData.companyInfo.businessPhone}
												</p>
											</div>
										</div>
										<Separator />
										<div className="space-y-1">
											<Label className="flex items-center gap-1 text-muted-foreground">
												<MapPin className="h-3 w-3" />
												Registered Address
											</Label>
											<p className="font-medium">
												{applicationData.companyInfo.registeredAddress.street}
												<br />
												{applicationData.companyInfo.registeredAddress.city},{" "}
												{applicationData.companyInfo.registeredAddress.state}{" "}
												{applicationData.companyInfo.registeredAddress.zip}
												<br />
												{applicationData.companyInfo.registeredAddress.country}
											</p>
										</div>
									</>
								) : (
									<p className="text-muted-foreground">
										No company information available from application.
									</p>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent className="space-y-4" value="licensing">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Shield className="h-5 w-5" />
									Licensing Information
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-6">
								{applicationData?.licensing ? (
									<div className="grid gap-6 md:grid-cols-2">
										<div className="space-y-1">
											<Label className="text-muted-foreground">
												License Type
											</Label>
											<p className="font-medium capitalize">
												{applicationData.licensing.licenseType.replace(
													/_/g,
													" "
												)}
											</p>
										</div>
										<div className="space-y-1">
											<Label className="text-muted-foreground">
												License Number
											</Label>
											<p className="font-medium">
												{applicationData.licensing.licenseNumber}
											</p>
										</div>
										<div className="space-y-1">
											<Label className="text-muted-foreground">Issuer</Label>
											<p className="font-medium">
												{applicationData.licensing.issuer}
											</p>
										</div>
										<div className="space-y-1">
											<Label className="text-muted-foreground">
												Issue Date
											</Label>
											<p className="font-medium">
												{new Date(
													applicationData.licensing.issuedDate
												).toLocaleDateString()}
											</p>
										</div>
										<div className="space-y-1">
											<Label className="text-muted-foreground">
												Expiry Date
											</Label>
											<p className="font-medium">
												{new Date(
													applicationData.licensing.expiryDate
												).toLocaleDateString()}
											</p>
										</div>
										<div className="space-y-1">
											<Label className="text-muted-foreground">
												Jurisdictions
											</Label>
											<div className="flex flex-wrap gap-2">
												{applicationData.licensing.jurisdictions.map(
													(jurisdiction: string) => (
														<Badge key={jurisdiction} variant="secondary">
															{jurisdiction}
														</Badge>
													)
												)}
											</div>
										</div>
									</div>
								) : (
									<p className="text-muted-foreground">
										No licensing information available from application.
									</p>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent className="space-y-4" value="representatives">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Users className="h-5 w-5" />
									Representatives
								</CardTitle>
							</CardHeader>
							<CardContent>
								{applicationData?.representatives &&
								applicationData.representatives.length > 0 ? (
									<div className="space-y-4">
										{applicationData.representatives.map(
											(
												rep: {
													email: string;
													firstName: string;
													lastName: string;
													role: string;
													phone?: string;
													hasAuthority?: boolean;
												},
												index: number
											) => (
												<div
													className="flex items-start gap-4 rounded-lg border p-4"
													key={`${rep.email}-${index}`}
												>
													<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
														<User className="h-5 w-5 text-primary" />
													</div>
													<div className="flex-1 space-y-1">
														<p className="font-medium">
															{rep.firstName} {rep.lastName}
														</p>
														<p className="text-muted-foreground text-sm">
															{rep.role}
														</p>
														<div className="flex flex-wrap gap-4 text-sm">
															<span className="flex items-center gap-1 text-muted-foreground">
																<Mail className="h-3 w-3" />
																{rep.email}
															</span>
															<span className="flex items-center gap-1 text-muted-foreground">
																<Phone className="h-3 w-3" />
																{rep.phone}
															</span>
														</div>
														{rep.hasAuthority && (
															<Badge className="mt-2" variant="outline">
																Has Signing Authority
															</Badge>
														)}
													</div>
												</div>
											)
										)}
									</div>
								) : (
									<p className="text-muted-foreground">
										No representatives listed in application.
									</p>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent className="space-y-4" value="documents">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<FileText className="h-5 w-5" />
									Documents
								</CardTitle>
							</CardHeader>
							<CardContent>
								{applicationData?.documents &&
								applicationData.documents.length > 0 ? (
									<div className="space-y-4">
										{applicationData.documents.map(
											(
												doc: {
													storageId: string;
													label: string;
													type: string;
													uploadedAt: string;
												},
												index: number
											) => (
												<div
													className="flex items-center gap-4 rounded-lg border p-4"
													key={`${doc.storageId}-${index}`}
												>
													<FileText className="h-8 w-8 shrink-0 text-primary" />
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
											)
										)}
									</div>
								) : (
									<p className="text-muted-foreground">
										No documents uploaded in application.
									</p>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="clients">
						<Card>
							<CardHeader>
								<CardTitle>Client List</CardTitle>
							</CardHeader>
							<CardContent>
								{clients?.clients?.length === 0 ? (
									<p className="text-muted-foreground">No clients yet.</p>
								) : (
									<div className="space-y-2">
										{clients?.clients?.map(
											(client: {
												_id: string;
												userName?: string;
												userEmail?: string;
												onboardingStatus: string;
											}) => (
												<div
													className="flex items-center justify-between rounded-lg border p-3"
													key={client._id}
												>
													<div>
														<p className="font-medium">
															{client.userName ||
																client.userEmail ||
																"Not specified"}
														</p>
														<p className="text-muted-foreground text-sm">
															Status: {client.onboardingStatus}
														</p>
													</div>
													<Badge
														variant={
															client.onboardingStatus === "approved"
																? "default"
																: "secondary"
														}
													>
														{client.onboardingStatus}
													</Badge>
												</div>
											)
										)}
									</div>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent className="space-y-6" value="settings">
						{/* Profile & Branding */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Palette className="h-5 w-5" />
									Profile & Branding
								</CardTitle>
								<CardDescription>
									Manage the broker's brand name and colors
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid gap-4 md:grid-cols-3">
									<div className="space-y-1">
										<Label className="text-muted-foreground">Brand Name</Label>
										<p className="font-medium">
											{broker.branding?.brandName || "Not set"}
										</p>
									</div>
									<div className="space-y-1">
										<Label className="text-muted-foreground">
											Primary Color
										</Label>
										<div className="flex items-center gap-2">
											<div
												className="h-6 w-6 rounded border"
												style={{
													backgroundColor:
														broker.branding?.primaryColor || "#3b82f6",
												}}
											/>
											<p className="font-medium font-mono text-sm">
												{broker.branding?.primaryColor || "#3b82f6"}
											</p>
										</div>
									</div>
									<div className="space-y-1">
										<Label className="text-muted-foreground">
											Secondary Color
										</Label>
										<div className="flex items-center gap-2">
											<div
												className="h-6 w-6 rounded border"
												style={{
													backgroundColor:
														broker.branding?.secondaryColor || "#64748b",
												}}
											/>
											<p className="font-medium font-mono text-sm">
												{broker.branding?.secondaryColor || "#64748b"}
											</p>
										</div>
									</div>
								</div>
								<Dialog
									onOpenChange={setProfileDialogOpen}
									open={profileDialogOpen}
								>
									<DialogTrigger asChild>
										<Button
											onClick={() => {
												setBrandName(broker.branding?.brandName || "");
												setPrimaryColor(
													broker.branding?.primaryColor || "#3b82f6"
												);
												setSecondaryColor(
													broker.branding?.secondaryColor || "#64748b"
												);
											}}
											variant="outline"
										>
											Edit Profile
										</Button>
									</DialogTrigger>
									<DialogContent>
										<DialogHeader>
											<DialogTitle>Edit Broker Profile</DialogTitle>
											<DialogDescription>
												Update the broker's branding information
											</DialogDescription>
										</DialogHeader>
										<div className="space-y-4 py-4">
											<div className="space-y-2">
												<Label htmlFor="brandName">Brand Name</Label>
												<Input
													id="brandName"
													onChange={(e) => setBrandName(e.target.value)}
													placeholder="Enter brand name"
													value={brandName}
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="primaryColor">Primary Color</Label>
												<div className="flex gap-2">
													<Input
														className="h-10 w-20 p-1"
														id="primaryColor"
														onChange={(e) => setPrimaryColor(e.target.value)}
														type="color"
														value={primaryColor}
													/>
													<Input
														className="flex-1 font-mono"
														onChange={(e) => setPrimaryColor(e.target.value)}
														placeholder="#3b82f6"
														value={primaryColor}
													/>
												</div>
											</div>
											<div className="space-y-2">
												<Label htmlFor="secondaryColor">Secondary Color</Label>
												<div className="flex gap-2">
													<Input
														className="h-10 w-20 p-1"
														id="secondaryColor"
														onChange={(e) => setSecondaryColor(e.target.value)}
														type="color"
														value={secondaryColor}
													/>
													<Input
														className="flex-1 font-mono"
														onChange={(e) => setSecondaryColor(e.target.value)}
														placeholder="#64748b"
														value={secondaryColor}
													/>
												</div>
											</div>
										</div>
										<DialogFooter>
											<Button
												onClick={() => setProfileDialogOpen(false)}
												variant="outline"
											>
												Cancel
											</Button>
											<Button
												onClick={async () => {
													try {
														await updateProfile({
															brokerId,
															branding: {
																brandName: brandName || undefined,
																primaryColor: primaryColor || undefined,
																secondaryColor: secondaryColor || undefined,
															},
														});
														toast.success("Profile updated successfully");
														setProfileDialogOpen(false);
													} catch (_err) {
														toast.error("Failed to update profile");
													}
												}}
											>
												Save Changes
											</Button>
										</DialogFooter>
									</DialogContent>
								</Dialog>
							</CardContent>
						</Card>

						{/* Commission Settings */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<DollarSign className="h-5 w-5" />
									Commission Settings
								</CardTitle>
								<CardDescription>
									Manage the broker's commission rate
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-1">
									<Label className="text-muted-foreground">
										Current Commission Rate
									</Label>
									<p className="font-bold text-2xl">
										{broker.commission?.ratePercentage || 0}%
									</p>
								</div>
								<Dialog
									onOpenChange={setCommissionDialogOpen}
									open={commissionDialogOpen}
								>
									<DialogTrigger asChild>
										<Button
											onClick={() => {
												setNewCommissionRate(
													String(broker.commission?.ratePercentage || 0)
												);
											}}
											variant="outline"
										>
											Edit Commission Rate
										</Button>
									</DialogTrigger>
									<DialogContent>
										<DialogHeader>
											<DialogTitle>Edit Commission Rate</DialogTitle>
											<DialogDescription>
												Changes will be recorded in the rate history
											</DialogDescription>
										</DialogHeader>
										<div className="space-y-4 py-4">
											<div className="space-y-2">
												<Label htmlFor="commissionRate">
													Commission Rate (%)
												</Label>
												<Input
													id="commissionRate"
													max="100"
													min="0"
													onChange={(e) => setNewCommissionRate(e.target.value)}
													step="0.1"
													type="number"
													value={newCommissionRate}
												/>
											</div>
										</div>
										<DialogFooter>
											<Button
												onClick={() => setCommissionDialogOpen(false)}
												variant="outline"
											>
												Cancel
											</Button>
											<Button
												onClick={async () => {
													try {
														await updateCommission({
															brokerId,
															commissionRate:
																Number.parseFloat(newCommissionRate),
														});
														toast.success("Commission rate updated");
														setCommissionDialogOpen(false);
													} catch (_err) {
														toast.error("Failed to update commission rate");
													}
												}}
											>
												Save Changes
											</Button>
										</DialogFooter>
									</DialogContent>
								</Dialog>
							</CardContent>
						</Card>

						{/* Subdomain & Custom Domain Settings */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Globe className="h-5 w-5" />
									Domains
								</CardTitle>
								<CardDescription>
									Manage the broker's portal address
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								{/* Subdomain Section */}
								<div className="space-y-4">
									<div className="space-y-1">
										<Label className="text-muted-foreground">
											Subdomain URL
										</Label>
										<div className="flex items-center justify-between">
											<p className="font-medium">
												{broker.subdomain}.{BASE_DOMAIN}
											</p>
											<Dialog
												onOpenChange={setSubdomainDialogOpen}
												open={subdomainDialogOpen}
											>
												<DialogTrigger asChild>
													<Button
														onClick={() => setNewSubdomain(broker.subdomain)}
														size="sm"
														variant="outline"
													>
														Change Subdomain
													</Button>
												</DialogTrigger>
												<DialogContent>
													<DialogHeader>
														<DialogTitle>Change Subdomain</DialogTitle>
														<DialogDescription>
															Warning: This will change the broker's default
															portal URL. Make sure to notify the broker.
														</DialogDescription>
													</DialogHeader>
													<div className="space-y-4 py-4">
														<div className="space-y-2">
															<Label htmlFor="subdomain">New Subdomain</Label>
															<div className="flex items-center gap-2">
																<Input
																	id="subdomain"
																	onChange={(e) =>
																		setNewSubdomain(
																			e.target.value.toLowerCase()
																		)
																	}
																	placeholder="broker-subdomain"
																	value={newSubdomain}
																/>
																<span className="text-muted-foreground">
																	.{BASE_DOMAIN}
																</span>
															</div>
														</div>
														<div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
															<AlertTriangle className="mb-1 inline h-4 w-4" />{" "}
															Changing the subdomain will affect the broker's
															portal URL. All existing links will stop working.
														</div>
													</div>
													<DialogFooter>
														<Button
															onClick={() => setSubdomainDialogOpen(false)}
															variant="outline"
														>
															Cancel
														</Button>
														<Button
															onClick={async () => {
																try {
																	await updateSubdomain({
																		brokerId,
																		subdomain: newSubdomain,
																	});
																	toast.success(
																		"Subdomain updated successfully"
																	);
																	setSubdomainDialogOpen(false);
																} catch (err) {
																	toast.error(
																		err instanceof Error
																			? err.message
																			: "Failed to update subdomain"
																	);
																}
															}}
														>
															Change Subdomain
														</Button>
													</DialogFooter>
												</DialogContent>
											</Dialog>
										</div>
									</div>
								</div>

								<Separator />

								{/* Custom Domain Section */}
								<div className="space-y-4">
									<div className="space-y-1">
										<Label className="text-muted-foreground">
											Custom Domain
										</Label>
										<div className="flex items-center justify-between">
											<p className="font-medium">
												{broker.customDomain || "Not configured"}
											</p>
											<Dialog
												onOpenChange={setCustomDomainDialogOpen}
												open={customDomainDialogOpen}
											>
												<DialogTrigger asChild>
													<Button
														onClick={() =>
															setNewCustomDomain(broker.customDomain || "")
														}
														size="sm"
														variant="outline"
													>
														{broker.customDomain ? "Edit Domain" : "Add Domain"}
													</Button>
												</DialogTrigger>
												<DialogContent>
													<DialogHeader>
														<DialogTitle>Custom Domain</DialogTitle>
														<DialogDescription>
															Configure a custom domain for this broker (e.g.
															mortgages.broker.com). Requires DNS configuration.
														</DialogDescription>
													</DialogHeader>
													<div className="space-y-4 py-4">
														<div className="space-y-2">
															<Label htmlFor="customDomain">Domain Name</Label>
															<Input
																id="customDomain"
																onChange={(e) =>
																	setNewCustomDomain(
																		e.target.value.toLowerCase()
																	)
																}
																placeholder="e.g. mortgages.broker.com"
																value={newCustomDomain}
															/>
															<p className="text-muted-foreground text-xs">
																Leave empty to remove the custom domain.
															</p>
														</div>
														<div className="rounded-lg border bg-muted p-3 text-sm">
															<p className="mb-1 font-medium">
																DNS Configuration Required
															</p>
															<p>
																To use a custom domain, you must configure a
																CNAME record pointing to{" "}
																<strong>{BASE_DOMAIN}</strong> (or A record to
																76.76.21.21).
															</p>
														</div>
													</div>
													<DialogFooter>
														<Button
															onClick={() => setCustomDomainDialogOpen(false)}
															variant="outline"
														>
															Cancel
														</Button>
														<Button
															onClick={async () => {
																try {
																	await updateCustomDomain({
																		brokerId,
																		customDomain: newCustomDomain || undefined,
																	});
																	toast.success(
																		"Custom domain updated successfully"
																	);
																	setCustomDomainDialogOpen(false);
																} catch (err) {
																	toast.error(
																		err instanceof Error
																			? err.message
																			: "Failed to update custom domain"
																	);
																}
															}}
														>
															Save Domain
														</Button>
													</DialogFooter>
												</DialogContent>
											</Dialog>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Client Management */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Users className="h-5 w-5" />
									Client Management
								</CardTitle>
								<CardDescription>
									Manage and reassign broker clients
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-center justify-between">
									<div>
										<p className="font-medium">Total Clients</p>
										<p className="font-bold text-2xl text-muted-foreground">
											{brokerClients?.length || 0}
										</p>
									</div>
									{(brokerClients?.length || 0) > 0 && (
										<Dialog
											onOpenChange={setReassignAllDialogOpen}
											open={reassignAllDialogOpen}
										>
											<DialogTrigger asChild>
												<Button variant="outline">Reassign All Clients</Button>
											</DialogTrigger>
											<DialogContent>
												<DialogHeader>
													<DialogTitle>Reassign All Clients</DialogTitle>
													<DialogDescription>
														Move all {brokerClients?.length} clients to another
														broker
													</DialogDescription>
												</DialogHeader>
												<div className="space-y-4 py-4">
													<div className="space-y-2">
														<Label>Target Broker</Label>
														<Select
															onValueChange={setReassignTargetBrokerId}
															value={reassignTargetBrokerId}
														>
															<SelectTrigger>
																<SelectValue placeholder="Select a broker" />
															</SelectTrigger>
															<SelectContent>
																{allBrokers
																	?.filter(
																		(b: {
																			_id: string;
																			branding?: { brandName?: string };
																			subdomain?: string;
																		}) => b._id !== brokerId
																	)
																	.map(
																		(b: {
																			_id: string;
																			branding?: { brandName?: string };
																			subdomain?: string;
																		}) => (
																			<SelectItem key={b._id} value={b._id}>
																				{b.branding?.brandName || b.subdomain}
																			</SelectItem>
																		)
																	)}
															</SelectContent>
														</Select>
													</div>
												</div>
												<DialogFooter>
													<Button
														onClick={() => setReassignAllDialogOpen(false)}
														variant="outline"
													>
														Cancel
													</Button>
													<Button
														disabled={!reassignTargetBrokerId}
														onClick={async () => {
															try {
																await reassignAllClients({
																	sourceBrokerId: brokerId,
																	targetBrokerId:
																		reassignTargetBrokerId as Id<"brokers">,
																});
																toast.success(
																	"All clients reassigned successfully"
																);
																setReassignAllDialogOpen(false);
																setReassignTargetBrokerId("");
															} catch (_err) {
																toast.error("Failed to reassign clients");
															}
														}}
													>
														Reassign All
													</Button>
												</DialogFooter>
											</DialogContent>
										</Dialog>
									)}
								</div>
								{brokerClients && brokerClients.length > 0 ? (
									<div className="space-y-2">
										{brokerClients.map(
											(client: {
												_id: Id<"broker_clients">;
												user: {
													firstName?: string;
													lastName?: string;
													email?: string;
												} | null;
												onboardingStatus: string;
											}) => (
												<div
													className="flex items-center justify-between rounded-lg border p-3"
													key={client._id}
												>
													<div>
														<p className="font-medium">
															{client.user?.firstName && client.user?.lastName
																? `${client.user.firstName} ${client.user.lastName}`
																: client.user?.email || "Not specified"}
														</p>
														<p className="text-muted-foreground text-sm">
															Status: {client.onboardingStatus}
														</p>
													</div>
													<Select
														onValueChange={async (targetId) => {
															try {
																await reassignClient({
																	clientBrokerId: client._id,
																	targetBrokerId: targetId as Id<"brokers">,
																});
																toast.success("Client reassigned");
															} catch (_err) {
																toast.error("Failed to reassign client");
															}
														}}
													>
														<SelectTrigger className="w-[180px]">
															<SelectValue placeholder="Reassign to..." />
														</SelectTrigger>
														<SelectContent>
															{allBrokers
																?.filter(
																	(b: {
																		_id: string;
																		branding?: { brandName?: string };
																		subdomain?: string;
																	}) => b._id !== brokerId
																)
																.map(
																	(b: {
																		_id: string;
																		branding?: { brandName?: string };
																		subdomain?: string;
																	}) => (
																		<SelectItem key={b._id} value={b._id}>
																			{b.branding?.brandName || b.subdomain}
																		</SelectItem>
																	)
																)}
														</SelectContent>
													</Select>
												</div>
											)
										)}
									</div>
								) : (
									<p className="text-muted-foreground">
										No clients assigned to this broker.
									</p>
								)}
							</CardContent>
						</Card>

						{/* WorkOS Organization */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Settings className="h-5 w-5" />
									WorkOS Organization
								</CardTitle>
								<CardDescription>
									WorkOS integration details for authentication and
									authorization
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-center justify-between">
									<div className="space-y-1">
										<Label className="text-muted-foreground">Status</Label>
										<div className="flex items-center gap-2">
											<Badge
												variant={broker.workosOrgId ? "default" : "secondary"}
											>
												{broker.workosOrgId ? "Provisioned" : "Not Provisioned"}
											</Badge>
											{verificationResult && !verificationResult.isSynced && (
												<Badge variant="destructive">Out of Sync</Badge>
											)}
											{verificationResult?.isSynced && (
												<Badge
													className="border-green-500 text-green-600"
													variant="outline"
												>
													<CheckCircle2 className="mr-1 h-3 w-3" />
													Synced
												</Badge>
											)}
										</div>
									</div>
								</div>
								<div className="space-y-1">
									<Label className="text-muted-foreground">
										Local Organization ID
									</Label>
									{broker.workosOrgId ? (
										<div className="space-y-2">
											<div className="flex items-center gap-2">
												<code className="rounded bg-muted px-2 py-1 font-mono text-sm">
													{broker.workosOrgId}
												</code>
												<Button
													className="h-8 w-8"
													onClick={() => {
														navigator.clipboard.writeText(broker.workosOrgId);
														setCopiedOrgId(true);
														setTimeout(() => setCopiedOrgId(false), 2000);
														toast.success("Copied to clipboard");
													}}
													size="icon"
													variant="ghost"
												>
													{copiedOrgId ? (
														<Check className="h-4 w-4 text-green-500" />
													) : (
														<Copy className="h-4 w-4" />
													)}
												</Button>
											</div>
											{(broker as { workosOrgName?: string }).workosOrgName && (
												<div className="flex items-center gap-2 text-muted-foreground text-sm">
													<Building2 className="h-3 w-3" />
													<span>
														{
															(broker as { workosOrgName?: string })
																.workosOrgName
														}
													</span>
												</div>
											)}
										</div>
									) : (
										<p className="text-muted-foreground text-sm italic">
											No WorkOS organization has been provisioned for this
											broker.
										</p>
									)}
								</div>

								{/* Broker Role */}
								<div className="space-y-1">
									<Label className="text-muted-foreground">Broker Role</Label>
									{(broker as { workosRole?: string }).workosRole ? (
										<div className="flex items-center gap-2">
											<Badge className="font-mono" variant="outline">
												{(broker as { workosRole?: string }).workosRole}
											</Badge>
										</div>
									) : (
										<p className="text-muted-foreground text-sm italic">
											No role found locally. Verify status to sync.
										</p>
									)}
								</div>

								{/* Verify Status Section */}
								<Separator />
								<div className="space-y-3">
									<div className="flex items-center gap-2">
										<Button
											disabled={isVerifyingStatus}
											onClick={async () => {
												setIsVerifyingStatus(true);
												try {
													const result = await verifyWorkOSStatus({ brokerId });
													setVerificationResult(result);
													if (result.success) {
														if (result.isSynced) {
															toast.success("WorkOS status verified - in sync");
														} else {
															toast.info(
																"WorkOS status verified - out of sync"
															);
														}
													} else {
														toast.error(
															result.error || "Failed to verify status"
														);
													}
												} catch (err) {
													toast.error(
														err instanceof Error
															? err.message
															: "Failed to verify status"
													);
												} finally {
													setIsVerifyingStatus(false);
												}
											}}
											size="sm"
											variant="outline"
										>
											{isVerifyingStatus ? (
												<>
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
													Verifying...
												</>
											) : (
												<>
													<RefreshCw className="mr-2 h-4 w-4" />
													Verify Status
												</>
											)}
										</Button>
									</div>

									{/* Verification Results */}
									{verificationResult && (
										<div className="space-y-3 rounded-lg border bg-muted/50 p-3">
											<div className="flex items-center justify-between">
												<Label className="font-medium text-sm">
													WorkOS Verification Results
												</Label>
												<Button
													className="h-6 px-2 text-xs"
													onClick={() => setVerificationResult(null)}
													size="sm"
													variant="ghost"
												>
													Clear
												</Button>
											</div>

											{verificationResult.error ? (
												<div className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-700 text-sm">
													{verificationResult.error}
												</div>
											) : (
												<>
													<div className="space-y-2">
														<Label className="text-muted-foreground text-xs">
															Memberships Found in WorkOS (
															{verificationResult.workosData.memberships.length}
															)
														</Label>
														{verificationResult.workosData.memberships
															.length === 0 ? (
															<p className="text-muted-foreground text-sm italic">
																No organization memberships found in WorkOS for
																this user.
															</p>
														) : (
															<div className="space-y-2">
																{verificationResult.workosData.memberships.map(
																	(membership) => (
																		<div
																			className="rounded border bg-background p-2 text-sm"
																			key={membership.id}
																		>
																			<div className="flex items-center justify-between">
																				<code className="font-mono text-xs">
																					{membership.organizationId}
																				</code>
																				<Badge
																					className="text-xs"
																					variant="outline"
																				>
																					{membership.status}
																				</Badge>
																			</div>
																			{membership.organizationName && (
																				<p className="mt-1 text-muted-foreground text-xs">
																					{membership.organizationName}
																				</p>
																			)}
																			{membership.role && (
																				<p className="mt-1 text-xs">
																					Role:{" "}
																					<span className="font-medium">
																						{membership.role}
																					</span>
																				</p>
																			)}
																		</div>
																	)
																)}
															</div>
														)}
													</div>

													{/* Sync suggestion */}
													{verificationResult.suggestedOrgId &&
														!broker.workosOrgId && (
															<div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
																<p className="text-blue-800 text-sm">
																	<CheckCircle2 className="mr-1 inline h-4 w-4" />
																	Found a WorkOS organization for this user that
																	can be linked.
																</p>
																<Button
																	disabled={isSyncingFromWorkOS}
																	onClick={async () => {
																		setIsSyncingFromWorkOS(true);
																		try {
																			if (!verificationResult.suggestedOrgId) {
																				throw new Error(
																					"No organization ID to sync"
																				);
																			}
																			const result = await updateWorkOSOrg({
																				brokerId,
																				workosOrgId:
																					verificationResult.suggestedOrgId,
																			});
																			if (result.success) {
																				toast.success(
																					"WorkOS organization provisioned successfully"
																				);
																				setProvisionOrgDialogOpen(false);
																				setNewOrgName("");
																			} else {
																				toast.error(
																					result.error ||
																						"Failed to provision organization"
																				);
																			}
																		} catch (err) {
																			toast.error(
																				err instanceof Error
																					? err.message
																					: "Failed to provision organization"
																			);
																		} finally {
																			setIsSyncingFromWorkOS(false);
																		}
																	}}
																	size="sm"
																>
																	{isSyncingFromWorkOS ? (
																		<>
																			<Loader2 className="mr-2 h-4 w-4 animate-spin" />
																			Syncing...
																		</>
																	) : (
																		<>
																			<Plus className="mr-2 h-4 w-4" />
																			Link Organization
																		</>
																	)}
																</Button>
															</div>
														)}

													{/* Out of sync warning */}
													{!verificationResult.isSynced &&
														broker.workosOrgId && (
															<div className="rounded-lg border border-yellow-200 bg-yellow-50 p-2 text-sm text-yellow-800">
																<AlertTriangle className="mr-1 inline h-4 w-4" />
																Local organization ID does not match any WorkOS
																membership.
															</div>
														)}
												</>
											)}
										</div>
									)}
								</div>

								{/* Action Buttons */}
								<Separator />
								<div className="flex flex-wrap gap-2">
									{/* Provision New - only when not provisioned */}
									{!broker.workosOrgId && (
										<Dialog
											onOpenChange={setProvisionOrgDialogOpen}
											open={provisionOrgDialogOpen}
										>
											<DialogTrigger asChild>
												<Button
													onClick={() => {
														setNewOrgName(
															broker.branding?.brandName || broker.subdomain
														);
													}}
												>
													<Plus className="mr-2 h-4 w-4" />
													Provision New
												</Button>
											</DialogTrigger>
											<DialogContent>
												<DialogHeader>
													<DialogTitle>
														Provision WorkOS Organization
													</DialogTitle>
													<DialogDescription>
														Create a new WorkOS organization for this broker.
														This will enable authentication and authorization
														features.
													</DialogDescription>
												</DialogHeader>
												<div className="space-y-4 py-4">
													<div className="space-y-2">
														<Label htmlFor="orgName">Organization Name</Label>
														<Input
															id="orgName"
															onChange={(e) => setNewOrgName(e.target.value)}
															placeholder="Enter organization name"
															value={newOrgName}
														/>
														<p className="text-muted-foreground text-xs">
															Defaults to the broker's brand name or subdomain
															if left empty.
														</p>
													</div>
												</div>
												<DialogFooter>
													<Button
														onClick={() => setProvisionOrgDialogOpen(false)}
														variant="outline"
													>
														Cancel
													</Button>
													<Button
														disabled={isProvisioningOrg}
														onClick={async () => {
															setIsProvisioningOrg(true);
															try {
																const result = await provisionWorkOSOrg({
																	brokerId,
																	organizationName: newOrgName || undefined,
																});
																if (result.success) {
																	toast.success(
																		"WorkOS organization provisioned successfully"
																	);
																	setProvisionOrgDialogOpen(false);
																	setNewOrgName("");
																} else {
																	toast.error(
																		result.error ||
																			"Failed to provision organization"
																	);
																}
															} catch (err) {
																toast.error(
																	err instanceof Error
																		? err.message
																		: "Failed to provision organization"
																);
															} finally {
																setIsProvisioningOrg(false);
															}
														}}
													>
														{isProvisioningOrg ? (
															<>
																<Loader2 className="mr-2 h-4 w-4 animate-spin" />
																Provisioning...
															</>
														) : (
															"Provision Organization"
														)}
													</Button>
												</DialogFooter>
											</DialogContent>
										</Dialog>
									)}

									{/* Assign Existing - only when not provisioned */}
									{!broker.workosOrgId && (
										<Dialog
											onOpenChange={setAssignExistingDialogOpen}
											open={assignExistingDialogOpen}
										>
											<DialogTrigger asChild>
												<Button variant="outline">
													<Link2 className="mr-2 h-4 w-4" />
													Assign Existing
												</Button>
											</DialogTrigger>
											<DialogContent>
												<DialogHeader>
													<DialogTitle>
														Assign Existing WorkOS Organization
													</DialogTitle>
													<DialogDescription>
														Link this broker to an existing WorkOS organization.
														Use this if the organization already exists in
														WorkOS but is not linked here.
													</DialogDescription>
												</DialogHeader>
												<div className="space-y-4 py-4">
													<div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-800 text-sm">
														<CheckCircle2 className="mb-1 inline h-4 w-4" /> Use
														"Verify Status" first to check if this user already
														has WorkOS memberships that can be auto-linked.
													</div>
													<div className="space-y-2">
														<Label htmlFor="assignOrgId">
															WorkOS Organization ID
														</Label>
														<Input
															className="font-mono"
															id="assignOrgId"
															onChange={(e) =>
																setNewWorkosOrgId(e.target.value)
															}
															placeholder="org_xxxxxxxx"
															value={newWorkosOrgId}
														/>
														<p className="text-muted-foreground text-xs">
															Enter the WorkOS organization ID (starts with
															"org_").
														</p>
													</div>
												</div>
												<DialogFooter>
													<Button
														onClick={() => setAssignExistingDialogOpen(false)}
														variant="outline"
													>
														Cancel
													</Button>
													<Button
														disabled={
															isUpdatingOrg ||
															!newWorkosOrgId.startsWith("org_")
														}
														onClick={async () => {
															setIsUpdatingOrg(true);
															try {
																const result = await updateWorkOSOrg({
																	brokerId,
																	workosOrgId: newWorkosOrgId,
																});
																if (result.success) {
																	toast.success(
																		"WorkOS organization assigned successfully"
																	);
																	setAssignExistingDialogOpen(false);
																	setNewWorkosOrgId("");
																	setVerificationResult(null);
																} else {
																	toast.error(
																		result.error ||
																			"Failed to assign organization"
																	);
																}
															} catch (err) {
																toast.error(
																	err instanceof Error
																		? err.message
																		: "Failed to assign organization"
																);
															} finally {
																setIsUpdatingOrg(false);
															}
														}}
													>
														{isUpdatingOrg ? (
															<>
																<Loader2 className="mr-2 h-4 w-4 animate-spin" />
																Assigning...
															</>
														) : (
															"Assign Organization"
														)}
													</Button>
												</DialogFooter>
											</DialogContent>
										</Dialog>
									)}

									{/* Change Organization - only when already provisioned */}
									{broker.workosOrgId && (
										<Dialog
											onOpenChange={setChangeOrgDialogOpen}
											open={changeOrgDialogOpen}
										>
											<DialogTrigger asChild>
												<Button variant="outline">
													<Settings className="mr-2 h-4 w-4" />
													Change Organization
												</Button>
											</DialogTrigger>
											<DialogContent>
												<DialogHeader>
													<DialogTitle>Change WorkOS Organization</DialogTitle>
													<DialogDescription>
														Update the WorkOS organization ID for this broker.
														Use this to assign an existing WorkOS organization
														or correct an incorrect ID.
													</DialogDescription>
												</DialogHeader>
												<div className="space-y-4 py-4">
													<div className="space-y-2">
														<Label htmlFor="newOrgId">
															New Organization ID
														</Label>
														<Input
															className="font-mono"
															id="newOrgId"
															onChange={(e) =>
																setNewWorkosOrgId(e.target.value)
															}
															placeholder="org_xxxxxxxx"
															value={newWorkosOrgId}
														/>
														<p className="text-muted-foreground text-xs">
															Enter the WorkOS organization ID (starts with
															"org_").
														</p>
													</div>
													<div className="space-y-1">
														<Label className="text-muted-foreground text-xs">
															Current Organization ID
														</Label>
														<code className="block rounded bg-muted px-2 py-1 font-mono text-xs">
															{broker.workosOrgId}
														</code>
													</div>
												</div>
												<DialogFooter>
													<Button
														onClick={() => setChangeOrgDialogOpen(false)}
														variant="outline"
													>
														Cancel
													</Button>
													<Button
														disabled={
															isUpdatingOrg ||
															!newWorkosOrgId.startsWith("org_")
														}
														onClick={async () => {
															setIsUpdatingOrg(true);
															try {
																const result = await updateWorkOSOrg({
																	brokerId,
																	workosOrgId: newWorkosOrgId,
																});
																if (result.success) {
																	toast.success(
																		"WorkOS organization updated successfully"
																	);
																	setChangeOrgDialogOpen(false);
																	setNewWorkosOrgId("");
																	setVerificationResult(null);
																} else {
																	toast.error(
																		result.error ||
																			"Failed to update organization"
																	);
																}
															} catch (err) {
																toast.error(
																	err instanceof Error
																		? err.message
																		: "Failed to update organization"
																);
															} finally {
																setIsUpdatingOrg(false);
															}
														}}
													>
														{isUpdatingOrg ? (
															<>
																<Loader2 className="mr-2 h-4 w-4 animate-spin" />
																Updating...
															</>
														) : (
															"Update Organization"
														)}
													</Button>
												</DialogFooter>
											</DialogContent>
										</Dialog>
									)}
								</div>
							</CardContent>
						</Card>

						{/* Danger Zone */}
						<Card className="border-red-200">
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-red-600">
									<AlertTriangle className="h-5 w-5" />
									Danger Zone
								</CardTitle>
								<CardDescription>
									Irreversible and destructive actions
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								{/* Suspend / Reactivate */}
								<div className="flex items-center justify-between rounded-lg border p-4">
									<div>
										<p className="font-medium">
											{broker.status === "suspended"
												? "Reactivate Broker"
												: "Suspend Broker"}
										</p>
										<p className="text-muted-foreground text-sm">
											{broker.status === "suspended"
												? "Restore broker access to the portal"
												: "Temporarily disable broker access (reversible)"}
										</p>
									</div>
									{broker.status === "suspended" ? (
										<Button
											onClick={async () => {
												try {
													await reactivateBroker({ brokerId });
													toast.success("Broker reactivated");
												} catch (_err) {
													toast.error("Failed to reactivate broker");
												}
											}}
											variant="outline"
										>
											<Play className="mr-2 h-4 w-4" />
											Reactivate
										</Button>
									) : (
										<Dialog
											onOpenChange={setSuspendDialogOpen}
											open={suspendDialogOpen}
										>
											<DialogTrigger asChild>
												<Button
													disabled={broker.status === "revoked"}
													variant="outline"
												>
													<Pause className="mr-2 h-4 w-4" />
													Suspend
												</Button>
											</DialogTrigger>
											<DialogContent>
												<DialogHeader>
													<DialogTitle>Suspend Broker</DialogTitle>
													<DialogDescription>
														This will temporarily disable the broker's access to
														their portal. You can reactivate them later.
													</DialogDescription>
												</DialogHeader>
												<div className="space-y-4 py-4">
													<div className="space-y-2">
														<Label htmlFor="suspendReason">
															Reason for suspension
														</Label>
														<Textarea
															id="suspendReason"
															onChange={(e) => setSuspendReason(e.target.value)}
															placeholder="Enter reason for suspension..."
															value={suspendReason}
														/>
													</div>
												</div>
												<DialogFooter>
													<Button
														onClick={() => setSuspendDialogOpen(false)}
														variant="outline"
													>
														Cancel
													</Button>
													<Button
														disabled={!suspendReason.trim()}
														onClick={async () => {
															try {
																await suspendBroker({
																	brokerId,
																	reason: suspendReason,
																});
																toast.success("Broker suspended");
																setSuspendDialogOpen(false);
																setSuspendReason("");
															} catch (_err) {
																toast.error("Failed to suspend broker");
															}
														}}
														variant="destructive"
													>
														Suspend Broker
													</Button>
												</DialogFooter>
											</DialogContent>
										</Dialog>
									)}
								</div>

								{/* Revoke */}
								<div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4">
									<div>
										<p className="font-medium text-red-800">Revoke Access</p>
										<p className="text-red-600 text-sm">
											Permanently disable broker access. This cannot be undone.
										</p>
									</div>
									<Dialog
										onOpenChange={setRevokeDialogOpen}
										open={revokeDialogOpen}
									>
										<DialogTrigger asChild>
											<Button
												disabled={broker.status === "revoked"}
												variant="destructive"
											>
												<XCircle className="mr-2 h-4 w-4" />
												{broker.status === "revoked" ? "Revoked" : "Revoke"}
											</Button>
										</DialogTrigger>
										<DialogContent>
											<DialogHeader>
												<DialogTitle>Revoke Broker Access</DialogTitle>
												<DialogDescription>
													This action is permanent and cannot be undone. The
													broker will lose all access.
												</DialogDescription>
											</DialogHeader>
											<div className="space-y-4 py-4">
												<div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-800 text-sm">
													<AlertTriangle className="mb-1 inline h-4 w-4" /> This
													action is irreversible. The broker will be permanently
													locked out.
												</div>
												<div className="space-y-2">
													<Label htmlFor="revokeReason">
														Reason for revocation
													</Label>
													<Textarea
														id="revokeReason"
														onChange={(e) => setRevokeReason(e.target.value)}
														placeholder="Enter reason for revocation..."
														value={revokeReason}
													/>
												</div>
											</div>
											<DialogFooter>
												<Button
													onClick={() => setRevokeDialogOpen(false)}
													variant="outline"
												>
													Cancel
												</Button>
												<Button
													disabled={!revokeReason.trim()}
													onClick={async () => {
														try {
															await revokeBroker({
																brokerId,
																reason: revokeReason,
															});
															toast.success("Broker access revoked");
															setRevokeDialogOpen(false);
															setRevokeReason("");
														} catch (_err) {
															toast.error("Failed to revoke broker");
														}
													}}
													variant="destructive"
												>
													Revoke Access
												</Button>
											</DialogFooter>
										</DialogContent>
									</Dialog>
								</div>

								{/* Delete */}
								<div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4">
									<div>
										<p className="font-medium text-red-800">Delete Broker</p>
										<p className="text-red-600 text-sm">
											Permanently delete this broker. Clients will be reassigned
											to FAIRLEND.
										</p>
									</div>
									<Dialog
										onOpenChange={setDeleteDialogOpen}
										open={deleteDialogOpen}
									>
										<DialogTrigger asChild>
											<Button variant="destructive">
												<Trash2 className="mr-2 h-4 w-4" />
												Delete
											</Button>
										</DialogTrigger>
										<DialogContent>
											<DialogHeader>
												<DialogTitle>Delete Broker</DialogTitle>
												<DialogDescription>
													This will permanently delete the broker and reassign
													all clients to FAIRLEND.
												</DialogDescription>
											</DialogHeader>
											<div className="space-y-4 py-4">
												<div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-800 text-sm">
													<AlertTriangle className="mb-1 inline h-4 w-4" /> This
													action is permanent and cannot be undone.
												</div>
												<div className="space-y-2">
													<p className="text-sm">
														<strong>Clients to reassign:</strong>{" "}
														{brokerClients?.length || 0}
													</p>
													<p className="text-sm">
														<strong>WorkOS org will be deleted:</strong>{" "}
														{broker.workosOrgId ? "Yes" : "N/A"}
													</p>
												</div>
												<div className="space-y-2">
													<Label htmlFor="deleteConfirm">
														Type <strong>{broker.subdomain}</strong> to confirm
														deletion
													</Label>
													<Input
														id="deleteConfirm"
														onChange={(e) =>
															setDeleteConfirmation(e.target.value)
														}
														placeholder={broker.subdomain}
														value={deleteConfirmation}
													/>
												</div>
											</div>
											<DialogFooter>
												<Button
													onClick={() => setDeleteDialogOpen(false)}
													variant="outline"
												>
													Cancel
												</Button>
												<Button
													disabled={deleteConfirmation !== broker.subdomain}
													onClick={async () => {
														try {
															await deleteBroker({
																brokerId,
																confirmSubdomain: deleteConfirmation,
															});
															toast.success("Broker deleted successfully");
															router.push("/dashboard/admin/brokers/managed");
														} catch (err) {
															toast.error(
																err instanceof Error
																	? err.message
																	: "Failed to delete broker"
															);
														}
													}}
													variant="destructive"
												>
													Delete Broker
												</Button>
											</DialogFooter>
										</DialogContent>
									</Dialog>
								</div>
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
			<div className="grid gap-4 md:grid-cols-4">
				{[1, 2, 3, 4].map((i) => (
					<Card key={i}>
						<CardHeader>
							<Skeleton className="h-4 w-32" />
						</CardHeader>
						<CardContent>
							<Skeleton className="mb-2 h-8 w-16" />
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
