"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAction, useConvexAuth, useMutation } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import {
	AlertTriangle,
	ArrowLeft,
	ArrowRight,
	CheckCircle2,
	Clock,
	FileText,
	Lock,
	Upload,
	XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuthenticatedQuery } from "@/convex/lib/client";
import { useProvisionCurrentUser } from "@/hooks/useProvisionCurrentUser";
import { cn } from "@/lib/utils";
import type { JourneyDoc, OnboardingStateValue } from "./machine";
import { useOnboardingMachine } from "./useOnboardingMachine";

const PERSONA_OPTIONS = [
	{
		id: "investor" as const,
		title: "Investor",
		description:
			"Access curated mortgage opportunities once your profile is approved.",
	},
	{
		id: "broker" as const,
		title: "Broker",
		description: "Submit deals and manage your clients' portfolios.",
	},
	{
		id: "lawyer" as const,
		title: "Lawyer",
		description: "Support closings and holdback reviews (coming soon).",
	},
];

const INVESTOR_STEPS: {
	id: OnboardingStateValue;
	label: string;
	description: string;
}[] = [
	{
		id: "investor.intro",
		label: "Welcome",
		description: "Learn how onboarding works",
	},
	{
		id: "investor.profile",
		label: "Profile",
		description: "Tell us about you or your entity",
	},
	{
		id: "investor.preferences",
		label: "Preferences",
		description: "Share how you like to invest",
	},
	{
		id: "investor.kycStub",
		label: "KYC",
		description: "Acknowledge upcoming compliance",
	},
	{
		id: "investor.documentsStub",
		label: "Documents",
		description: "Optional accreditation evidence",
	},
	{
		id: "investor.review",
		label: "Review",
		description: "Confirm and submit",
	},
];

const BROKER_STEPS: {
	id: OnboardingStateValue;
	label: string;
	description: string;
}[] = [
	{
		id: "broker.intro",
		label: "Welcome",
		description: "Learn about broker onboarding",
	},
	{
		id: "broker.company_info",
		label: "Company Info",
		description: "Tell us about your business",
	},
	{
		id: "broker.licensing",
		label: "Licensing",
		description: "Provide your license details",
	},
	{
		id: "broker.representatives",
		label: "Representatives",
		description: "List your team members",
	},
	{
		id: "broker.documents",
		label: "Documents",
		description: "Upload required documents",
	},
	{
		id: "broker.review",
		label: "Review",
		description: "Confirm and submit",
	},
];

const ENTITY_TYPES = ["individual", "corporation", "trust", "fund"] as const;
const RISK_PROFILES = ["conservative", "balanced", "growth"] as const;

const investorProfileSchema = z.object({
	firstName: z.string().min(1, "First name is required"),
	middleName: z.string().optional().or(z.literal("")),
	lastName: z.string().min(1, "Last name is required"),
	entityType: z.enum(ENTITY_TYPES, { message: "Entity type is required" }),
	phone: z.string().optional().or(z.literal("")),
});

const investorPreferencesSchema = z
	.object({
		minTicket: z
			.string()
			.min(1, "Minimum ticket is required")
			.refine((value) => Number(value) > 0, {
				message: "Minimum ticket must be greater than 0",
			}),
		maxTicket: z
			.string()
			.min(1, "Maximum ticket is required")
			.refine((value) => Number(value) > 0, {
				message: "Maximum ticket must be greater than 0",
			}),
		riskProfile: z.enum(RISK_PROFILES, { message: "Risk profile is required" }),
		liquidityHorizonMonths: z
			.string()
			.min(1, "Liquidity horizon is required")
			.refine((value) => Number(value) > 0, {
				message: "Liquidity horizon must be greater than 0",
			}),
		focusRegions: z.string().optional().or(z.literal("")),
	})
	.refine((values) => Number(values.maxTicket) >= Number(values.minTicket), {
		message: "Maximum ticket must be at least the minimum ticket",
		path: ["maxTicket"],
	});

const BROKER_ENTITY_TYPES = [
	"sole_proprietorship",
	"partnership",
	"corporation",
] as const;
const BROKER_LICENSE_TYPES = [
	"mortgage_broker",
	"investment_broker",
	"mortgage_dealer",
] as const;

const brokerCompanyInfoSchema = z.object({
	companyName: z.string().min(1, "Company name is required"),
	entityType: z.enum(BROKER_ENTITY_TYPES, {
		message: "Entity type is required",
	}),
	registrationNumber: z.string().min(1, "Registration number is required"),
	registeredAddress: z.object({
		street: z.string().min(1, "Street address is required"),
		city: z.string().min(1, "City is required"),
		state: z.string().min(1, "State/Province is required"),
		zip: z.string().min(1, "Postal/ZIP code is required"),
		country: z.string().min(1, "Country is required"),
	}),
	businessPhone: z.string().min(1, "Business phone is required"),
	businessEmail: z
		.string()
		.min(1, "Business email is required")
		.email("Business email must be valid"),
});

const brokerLicensingSchema = z.object({
	licenseType: z.enum(BROKER_LICENSE_TYPES, {
		message: "License type is required",
	}),
	licenseNumber: z.string().min(1, "License number is required"),
	issuer: z.string().min(1, "Issuing organization is required"),
	issuedDate: z.string().min(1, "Issuance date is required"),
	expiryDate: z.string().min(1, "Expiry date is required"),
	jurisdictions: z
		.array(z.string().min(1))
		.min(1, "At least one jurisdiction is required"),
});

const brokerRepresentativeSchema = z.object({
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required"),
	role: z.string().min(1, "Role/title is required"),
	email: z.string().min(1, "Email is required").email("Email must be valid"),
	phone: z.string().min(1, "Phone is required"),
	hasAuthority: z.boolean(),
});

function stateValueToString(
	value: string | Record<string, unknown>
): OnboardingStateValue {
	if (typeof value === "string") {
		return value as OnboardingStateValue;
	}
	// Handle nested states like { investor: "intro" } -> "investor.intro"
	const [parentKey, childValue] = Object.entries(value)[0];
	if (typeof childValue === "string") {
		return `${parentKey}.${childValue}` as OnboardingStateValue;
	}
	return "personaSelection";
}

type InvestorProfileValues = {
	firstName: string;
	middleName?: string;
	lastName: string;
	entityType: (typeof ENTITY_TYPES)[number];
	phone?: string;
};

type InvestorPreferencesValues = {
	minTicket: number;
	maxTicket: number;
	riskProfile: (typeof RISK_PROFILES)[number];
	liquidityHorizonMonths: number;
	focusRegions: string[];
};

type InvestorDocument = { storageId: Id<"_storage">; label: string };

type InvestorContextPatch = {
	profile?: InvestorProfileValues;
	preferences?: InvestorPreferencesValues;
	kycPlaceholder?: {
		status: "not_started" | "blocked" | "submitted";
		notes?: string;
	};
	documents?: InvestorDocument[];
};

// Broker types
type BrokerCompanyInfoValues = {
	companyName: string;
	entityType: (typeof BROKER_ENTITY_TYPES)[number];
	registrationNumber: string;
	registeredAddress: {
		street: string;
		city: string;
		state: string;
		zip: string;
		country: string;
	};
	businessPhone: string;
	businessEmail: string;
};

type BrokerLicensingValues = {
	licenseType: (typeof BROKER_LICENSE_TYPES)[number];
	licenseNumber: string;
	issuer: string;
	issuedDate: string;
	expiryDate: string;
	jurisdictions: string[];
};

type BrokerRepresentativeValues = {
	firstName: string;
	lastName: string;
	role: string;
	email: string;
	phone: string;
	hasAuthority: boolean;
};

type BrokerDocument = {
	storageId: Id<"_storage">;
	label: string;
	type: string;
	uploadedAt?: string;
};

export function OnboardingExperience() {
	const router = useRouter();
	const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
	const journey = useAuthenticatedQuery(api.onboarding.getJourney, {});
	const userProfile = useAuthenticatedQuery(
		api.profile.getCurrentUserProfile,
		{}
	);
	useProvisionCurrentUser(userProfile);
	const ensureJourney = useMutation(api.onboarding.ensureJourney);
	const startJourney = useMutation(api.onboarding.startJourney);
	const saveInvestorStep = useMutation(api.onboarding.saveInvestorStep);
	const submitInvestorJourney = useMutation(
		api.onboarding.submitInvestorJourney
	);
	const generateUploadUrl = useAction(api.onboarding.generateDocumentUploadUrl);

	// Broker mutations
	const advanceBrokerIntro = useMutation(
		api.brokers.onboarding.advanceBrokerIntro
	);
	const saveBrokerCompanyInfo = useMutation(
		api.brokers.onboarding.saveBrokerCompanyInfo
	);
	const saveBrokerLicensing = useMutation(
		api.brokers.onboarding.saveBrokerLicensing
	);
	const saveBrokerRepresentatives = useMutation(
		api.brokers.onboarding.saveBrokerRepresentatives
	);
	const saveBrokerDocuments = useMutation(
		api.brokers.onboarding.saveBrokerDocuments
	);
	const submitBrokerJourney = useMutation(
		api.brokers.onboarding.submitBrokerJourney
	);

	const { snapshot } = useOnboardingMachine(journey ?? null);

	const [isEnsuring, setEnsuring] = useState(false);
	const [pendingPersona, setPendingPersona] = useState<
		"investor" | "broker" | "lawyer" | null
	>(null);
	const [savingState, setSavingState] = useState<OnboardingStateValue | null>(
		null
	);
	const [uploading, setUploading] = useState(false);
	const [documentError, setDocumentError] = useState<string | null>(null);

	const currentState = (journey?.stateValue ??
		stateValueToString(snapshot.value)) as OnboardingStateValue;
	const persona = (journey?.persona ??
		snapshot.context.persona ??
		"unselected") as "investor" | "broker" | "lawyer" | "unselected";
	const status = journey?.status ?? snapshot.context.status;
	const investorContext = journey?.context?.investor ?? {};
	const brokerContext = journey?.context?.broker ?? {};

	// Wait for user to be provisioned before ensuring journey
	const isUserProvisioned = userProfile?.user !== null;
	const isProvisioning = userProfile !== undefined && !isUserProvisioned;

	useEffect(() => {
		// Only ensure journey if:
		// 1. Journey is null (doesn't exist yet)
		// 2. User is provisioned
		// 3. Not already ensuring
		if (journey === null && isUserProvisioned && !isEnsuring) {
			setEnsuring(true);
			ensureJourney({})
				.catch((error: unknown) => {
					const message =
						error instanceof Error
							? error.message
							: "Unable to start onboarding";
					toast.error(message);
				})
				.finally(() => setEnsuring(false));
		}
	}, [journey, ensureJourney, isEnsuring, isUserProvisioned]);

	useEffect(() => {
		if (journey?.status === "approved") {
			router.replace("/dashboard");
		}
	}, [journey?.status, router]);

	const handlePersonaSelect = useCallback(
		async (nextPersona: "investor" | "broker" | "lawyer") => {
			setPendingPersona(nextPersona);
			try {
				await startJourney({ persona: nextPersona });
				// Convex realtime will update journey and trigger HYDRATE event
			} catch (error: unknown) {
				const message =
					error instanceof Error ? error.message : "Unable to start onboarding";
				toast.error(message);
			} finally {
				setPendingPersona(null);
			}
		},
		[startJourney]
	);

	const persistState = useCallback(
		async (
			nextState: OnboardingStateValue,
			investorPatch?: InvestorContextPatch
		) => {
			setSavingState(nextState);
			try {
				await saveInvestorStep({
					stateValue: nextState,
					investor: investorPatch,
				});
				// Convex realtime will update journey and trigger HYDRATE event
			} catch (error: unknown) {
				const message =
					error instanceof Error ? error.message : "Unable to save progress";
				toast.error(message);
			} finally {
				setSavingState(null);
			}
		},
		[saveInvestorStep]
	);

	const handleSubmitProfile = async (values: InvestorProfileValues) => {
		await persistState("investor.preferences", { profile: values });
	};

	const handleSubmitPreferences = async (values: InvestorPreferencesValues) => {
		await persistState("investor.kycStub", { preferences: values });
	};

	const handleIntroContinue = async () => {
		await persistState("investor.profile");
	};

	const handleKycAcknowledgement = async () => {
		await persistState("investor.documentsStub", {
			kycPlaceholder: {
				status: "submitted",
			},
		});
	};

	const handleDocumentsContinue = async () => {
		await persistState("investor.review");
	};

	const handleSubmitForReview = async () => {
		setSavingState("pendingAdmin");
		try {
			await submitInvestorJourney({});
			// Convex realtime will update journey and trigger HYDRATE event
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : "Unable to submit onboarding";
			toast.error(message);
		} finally {
			setSavingState(null);
		}
	};

	const documents = investorContext.documents ?? [];

	const handleDocumentUpload = async (file: File) => {
		setDocumentError(null);
		setUploading(true);
		try {
			const uploadUrl = await generateUploadUrl({});
			const response = await fetch(uploadUrl, {
				method: "POST",
				headers: {
					"Content-Type": file.type,
				},
				body: file,
			});
			const json = (await response.json()) as { storageId?: string };
			if (!json.storageId) {
				throw new Error("Upload failed");
			}
			await saveInvestorStep({
				stateValue: "investor.documentsStub",
				investor: {
					documents: [
						...(documents ?? []),
						{
							storageId: json.storageId as Id<"_storage">,
							label: file.name,
						},
					],
				},
			});
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : "Unable to upload document";
			setDocumentError(message);
			toast.error(message);
		} finally {
			setUploading(false);
		}
	};

	const handleRemoveDocument = async (storageId: Id<"_storage">) => {
		const filtered = documents.filter(
			(doc: InvestorDocument) => doc.storageId !== storageId
		);
		await saveInvestorStep({
			stateValue: "investor.documentsStub",
			investor: {
				documents: filtered,
			},
		});
	};

	// Broker handlers
	const handleBrokerIntroContinue = async () => {
		setSavingState("broker.company_info");
		try {
			await advanceBrokerIntro({});
		} catch (error: unknown) {
			const message =
				error instanceof Error
					? error.message
					: "Unable to continue onboarding";
			toast.error(message);
		} finally {
			setSavingState(null);
		}
	};

	const handleBrokerCompanyInfoSubmit = async (
		values: BrokerCompanyInfoValues
	) => {
		try {
			await saveBrokerCompanyInfo(values);
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : "Unable to save company info";
			toast.error(message);
		}
	};

	const handleBrokerLicensingSubmit = async (values: BrokerLicensingValues) => {
		try {
			await saveBrokerLicensing(values);
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : "Unable to save licensing";
			toast.error(message);
		}
	};

	const handleBrokerRepresentativesSubmit = async (
		representatives: BrokerRepresentativeValues[]
	) => {
		try {
			await saveBrokerRepresentatives({ representatives });
		} catch (error: unknown) {
			const message =
				error instanceof Error
					? error.message
					: "Unable to save representatives";
			toast.error(message);
		}
	};

	const handleBrokerDocumentUpload = async (file: File, docType: string) => {
		setDocumentError(null);
		setUploading(true);
		try {
			const uploadUrl = await generateUploadUrl({});
			const response = await fetch(uploadUrl, {
				method: "POST",
				headers: {
					"Content-Type": file.type,
				},
				body: file,
			});
			const json = (await response.json()) as { storageId?: string };
			if (!json.storageId) {
				throw new Error("Upload failed");
			}
			// Only include fields the backend validator expects - uploadedAt is added server-side
			const newDoc = {
				storageId: json.storageId as Id<"_storage">,
				label: file.name,
				type: docType,
			};
			const existingDocs = (brokerContext?.documents ?? []) as BrokerDocument[];
			// Strip uploadedAt from existing docs before sending to mutation
			const docsForMutation = existingDocs.map(
				({ storageId, label, type }) => ({
					storageId,
					label,
					type,
				})
			);
			await saveBrokerDocuments({
				documents: [...docsForMutation, newDoc],
			});
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : "Unable to upload document";
			setDocumentError(message);
			toast.error(message);
		} finally {
			setUploading(false);
		}
	};

	const handleBrokerRemoveDocument = async (storageId: Id<"_storage">) => {
		try {
			const existingDocs = (brokerContext?.documents ?? []) as BrokerDocument[];
			const filtered = existingDocs.filter(
				(doc) => doc.storageId !== storageId
			);
			// Strip uploadedAt from docs before sending to mutation - backend adds it
			const docsForMutation = filtered.map(
				({ storageId: sid, label, type }) => ({
					storageId: sid,
					label,
					type,
				})
			);
			await saveBrokerDocuments({ documents: docsForMutation });
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : "Unable to remove document";
			toast.error(message);
		}
	};

	const handleBrokerDocumentsContinue = async () => {
		setSavingState("broker.review");
	};

	const handleBrokerSubmitForReview = async (subdomain: string) => {
		setSavingState("broker.pending_admin");
		try {
			await submitBrokerJourney({ proposedSubdomain: subdomain });
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : "Unable to submit application";
			toast.error(message);
		} finally {
			setSavingState(null);
		}
	};

	// Show loading while provisioning user or ensuring journey
	if (
		authLoading ||
		!isAuthenticated ||
		journey === undefined ||
		isEnsuring ||
		isProvisioning ||
		userProfile === undefined
	) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center">
				<Spinner className="size-6" />
			</div>
		);
	}

	const showInvestorFlow = currentState.startsWith("investor.");
	const _showBrokerFlow = currentState.startsWith("broker.");
	const awaitingAdmin = status === "awaiting_admin";
	const rejected = status === "rejected";

	return (
		<div className="mx-auto flex w-full max-w-4xl flex-col gap-8 py-10">
			<header className="space-y-2">
				<p className="text-muted-foreground text-sm">Closed Pilot Onboarding</p>
				<h1 className="font-semibold text-3xl">
					Choose how you want to work with FairLend
				</h1>
				<div className="flex flex-wrap items-center gap-3">
					<Badge variant="secondary">Status: {status ?? "draft"}</Badge>
					{journey?.lastTouchedAt ? (
						<span className="text-muted-foreground text-sm">
							Updated{" "}
							{formatDistanceToNow(new Date(journey.lastTouchedAt), {
								addSuffix: true,
							})}
						</span>
					) : null}
				</div>
			</header>

			{persona === "unselected" && (
				<PersonaSelector
					onSelect={handlePersonaSelect}
					options={PERSONA_OPTIONS}
					pending={pendingPersona}
				/>
			)}

			{persona !== "unselected" && (
				<Card>
					<CardHeader>
						<CardTitle>Progress</CardTitle>
					</CardHeader>
					<CardContent>
						{persona === "investor" && (
							<InvestorProgress currentState={currentState} status={status} />
						)}
						{persona === "broker" && (
							<BrokerProgress currentState={currentState} status={status} />
						)}
					</CardContent>
				</Card>
			)}

			{persona === "investor" && awaitingAdmin && <PendingAdminState />}
			{persona === "investor" && rejected && (
				<RejectedState decision={journey?.adminDecision} />
			)}

			{persona === "broker" && (
				<BrokerFlowRouter
					broker={brokerContext}
					currentState={currentState}
					documentError={documentError}
					onBrokerCompanyInfoSubmit={handleBrokerCompanyInfoSubmit}
					onBrokerDocumentsContinue={handleBrokerDocumentsContinue}
					onBrokerDocumentUpload={handleBrokerDocumentUpload}
					onBrokerIntroContinue={handleBrokerIntroContinue}
					onBrokerLicensingSubmit={handleBrokerLicensingSubmit}
					onBrokerRemoveDocument={handleBrokerRemoveDocument}
					onBrokerRepresentativesSubmit={handleBrokerRepresentativesSubmit}
					onBrokerSubmitReview={handleBrokerSubmitForReview}
					savingState={savingState}
					uploading={uploading}
				/>
			)}
			{persona === "lawyer" && !awaitingAdmin && !rejected && (
				<PlaceholderState
					description="Legal onboarding is almost here. We'll email you as soon as reviewers are ready."
					title="Lawyer onboarding coming soon"
				/>
			)}

			{showInvestorFlow && !awaitingAdmin && !rejected && (
				<InvestorFlowRouter
					currentState={currentState}
					documentError={documentError}
					investor={investorContext}
					onDocumentsContinue={handleDocumentsContinue}
					onIntroContinue={handleIntroContinue}
					onKycAcknowledge={handleKycAcknowledgement}
					onPreferencesSubmit={handleSubmitPreferences}
					onProfileSubmit={handleSubmitProfile}
					onRemoveDocument={handleRemoveDocument}
					onSubmitReview={handleSubmitForReview}
					onUploadDocument={handleDocumentUpload}
					savingState={savingState}
					uploading={uploading}
				/>
			)}
		</div>
	);
}

type PersonaSelectorProps = {
	options: typeof PERSONA_OPTIONS;
	onSelect: (persona: "investor" | "broker" | "lawyer") => Promise<void>;
	pending: string | null;
};

function PersonaSelector({ options, onSelect, pending }: PersonaSelectorProps) {
	return (
		<div className="grid gap-4 md:grid-cols-3">
			{options.map((persona) => (
				<Card className="border-dashed" key={persona.id}>
					<CardHeader>
						<CardTitle>{persona.title}</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<p className="text-muted-foreground text-sm">
							{persona.description}
						</p>
						<Button
							disabled={Boolean(pending) && pending !== persona.id}
							onClick={() => onSelect(persona.id)}
						>
							{pending === persona.id ? "Selecting..." : "Select"}
						</Button>
					</CardContent>
				</Card>
			))}
		</div>
	);
}

type InvestorFlowRouterProps = {
	currentState: OnboardingStateValue;
	investor: NonNullable<JourneyDoc["context"]>["investor"];
	savingState: OnboardingStateValue | null;
	uploading: boolean;
	documentError: string | null;
	onIntroContinue: () => Promise<void>;
	onProfileSubmit: (values: InvestorProfileValues) => Promise<void>;
	onPreferencesSubmit: (values: InvestorPreferencesValues) => Promise<void>;
	onKycAcknowledge: () => Promise<void>;
	onDocumentsContinue: () => Promise<void>;
	onSubmitReview: () => Promise<void>;
	onUploadDocument: (file: File) => Promise<void>;
	onRemoveDocument: (storageId: InvestorDocument["storageId"]) => Promise<void>;
};

function InvestorFlowRouter({
	currentState,
	investor,
	savingState,
	uploading,
	documentError,
	onIntroContinue,
	onProfileSubmit,
	onPreferencesSubmit,
	onKycAcknowledge,
	onDocumentsContinue,
	onSubmitReview,
	onUploadDocument,
	onRemoveDocument,
}: InvestorFlowRouterProps) {
	switch (currentState) {
		case "investor.intro":
			return (
				<InvestorIntroStep
					busy={savingState === "investor.profile"}
					onContinue={onIntroContinue}
				/>
			);
		case "investor.profile": {
			const profile = investor?.profile;
			// Type guard: ensure required fields are present and are strings
			function isValidProfile(p: typeof profile): p is {
				firstName: string;
				lastName: string;
				entityType: InvestorProfileValues["entityType"];
				middleName?: string;
				phone?: string;
			} {
				return (
					!!p &&
					typeof p.firstName === "string" &&
					p.firstName.length > 0 &&
					typeof p.lastName === "string" &&
					p.lastName.length > 0 &&
					!!p.entityType
				);
			}

			const defaultValues: InvestorProfileValues | undefined = isValidProfile(
				profile
			)
				? {
						firstName: profile.firstName,
						middleName: profile.middleName,
						lastName: profile.lastName,
						entityType: profile.entityType,
						phone: profile.phone,
					}
				: undefined;

			return (
				<InvestorProfileForm
					busy={savingState === "investor.preferences"}
					defaultValues={defaultValues}
					onSubmit={onProfileSubmit}
				/>
			);
		}
		case "investor.preferences":
			return (
				<InvestorPreferencesForm
					busy={savingState === "investor.kycStub"}
					defaultValues={
						investor?.preferences
							? {
									...investor.preferences,
									focusRegions: investor.preferences.focusRegions ?? [],
								}
							: undefined
					}
					onSubmit={onPreferencesSubmit}
				/>
			);
		case "investor.kycStub":
			return (
				<InvestorKycStub
					busy={savingState === "investor.documentsStub"}
					onContinue={onKycAcknowledge}
				/>
			);
		case "investor.documentsStub":
			return (
				<InvestorDocumentsStep
					busy={savingState === "investor.review"}
					documents={investor?.documents ?? []}
					error={documentError}
					onContinue={onDocumentsContinue}
					onRemove={onRemoveDocument}
					onUpload={onUploadDocument}
					uploading={uploading}
				/>
			);
		case "investor.review":
			return (
				<InvestorReviewStep
					busy={savingState === "pendingAdmin"}
					investor={investor}
					onSubmit={onSubmitReview}
				/>
			);
		default:
			return null;
	}
}

function InvestorIntroStep({
	busy,
	onContinue,
}: {
	busy: boolean;
	onContinue: () => Promise<void>;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Welcome to FairLend</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<p className="text-muted-foreground">
					We review every applicant to keep marketplace access aligned with
					pilot requirements. This only takes a few minutes and your answers
					save automatically.
				</p>
				<ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
					<li>Tell us about your investing entity</li>
					<li>Describe the deal sizes and regions you care about</li>
					<li>Acknowledge compliance while we integrate KYC/AML vendors</li>
				</ul>
				<div className="flex items-center justify-end">
					<Button disabled={busy} onClick={onContinue}>
						{busy ? "Saving..." : "Begin"}
						<ArrowRight className="ml-2 size-4" />
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

function InvestorProfileForm({
	defaultValues,
	onSubmit,
	busy,
}: {
	defaultValues?: InvestorProfileValues;
	onSubmit: (values: InvestorProfileValues) => Promise<void>;
	busy: boolean;
}) {
	const form = useForm<InvestorProfileValues>({
		resolver: zodResolver(investorProfileSchema),
		defaultValues: defaultValues ?? {
			firstName: "",
			middleName: "",
			lastName: "",
			entityType: "individual",
			phone: "",
		},
		mode: "onChange",
	});

	useEffect(() => {
		if (defaultValues) {
			form.reset({
				...defaultValues,
				middleName: defaultValues.middleName ?? "",
				phone: defaultValues.phone ?? "",
			});
		}
	}, [defaultValues, form]);

	const handleSubmit = (values: InvestorProfileValues) => {
		onSubmit({
			...values,
			middleName: values.middleName?.trim() || undefined,
			phone: values.phone?.trim() || undefined,
		});
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Investor profile</CardTitle>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form
						className="space-y-6"
						onSubmit={form.handleSubmit(handleSubmit)}
					>
						<div className="grid gap-4">
							<FormField
								control={form.control}
								name="firstName"
								render={({ field }) => (
									<FormItem className="space-y-2">
										<FormLabel>
											First name{" "}
											<span className="text-muted-foreground text-xs">
												Required
											</span>
										</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<div className="grid gap-4 md:grid-cols-2">
								<FormField
									control={form.control}
									name="middleName"
									render={({ field }) => (
										<FormItem className="space-y-2">
											<FormLabel>
												Middle name{" "}
												<span className="text-muted-foreground text-xs">
													Optional
												</span>
											</FormLabel>
											<FormControl>
												<Input {...field} value={field.value ?? ""} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="lastName"
									render={({ field }) => (
										<FormItem className="space-y-2">
											<FormLabel>
												Last name{" "}
												<span className="text-muted-foreground text-xs">
													Required
												</span>
											</FormLabel>
											<FormControl>
												<Input {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>
						<div className="grid gap-4 md:grid-cols-2">
							<FormField
								control={form.control}
								name="entityType"
								render={({ field }) => (
									<FormItem className="space-y-2">
										<FormLabel>
											Entity type{" "}
											<span className="text-muted-foreground text-xs">
												Required
											</span>
										</FormLabel>
										<FormControl>
											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select entity" />
												</SelectTrigger>
												<SelectContent>
													{ENTITY_TYPES.map((type) => (
														<SelectItem key={type} value={type}>
															{type.charAt(0).toUpperCase() + type.slice(1)}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="phone"
								render={({ field }) => (
									<FormItem className="space-y-2">
										<FormLabel>
											Phone{" "}
											<span className="text-muted-foreground text-xs">
												Optional
											</span>
										</FormLabel>
										<FormControl>
											<Input {...field} value={field.value ?? ""} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<div className="flex justify-end gap-3">
							<Button disabled type="button" variant="ghost">
								<ArrowLeft className="mr-2 size-4" /> Back
							</Button>
							<Button disabled={!form.formState.isValid || busy} type="submit">
								{busy ? "Saving..." : "Continue"}
								<ArrowRight className="ml-2 size-4" />
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}

function InvestorPreferencesForm({
	defaultValues,
	onSubmit,
	busy,
}: {
	defaultValues?: InvestorPreferencesValues;
	onSubmit: (values: InvestorPreferencesValues) => Promise<void>;
	busy: boolean;
}) {
	type InvestorPreferencesFormValues = z.infer<
		typeof investorPreferencesSchema
	>;

	const form = useForm<InvestorPreferencesFormValues>({
		resolver: zodResolver(investorPreferencesSchema),
		defaultValues: {
			minTicket: defaultValues?.minTicket?.toString() ?? "",
			maxTicket: defaultValues?.maxTicket?.toString() ?? "",
			riskProfile: defaultValues?.riskProfile ?? "balanced",
			liquidityHorizonMonths:
				defaultValues?.liquidityHorizonMonths?.toString() ?? "12",
			focusRegions: (defaultValues?.focusRegions ?? []).join(", "),
		},
		mode: "onChange",
	});

	useEffect(() => {
		if (defaultValues) {
			form.reset({
				minTicket: defaultValues.minTicket.toString(),
				maxTicket: defaultValues.maxTicket.toString(),
				riskProfile: defaultValues.riskProfile,
				liquidityHorizonMonths: defaultValues.liquidityHorizonMonths.toString(),
				focusRegions: (defaultValues.focusRegions ?? []).join(", "),
			});
		}
	}, [defaultValues, form]);

	const handleSubmit = (values: InvestorPreferencesFormValues) => {
		onSubmit({
			minTicket: Number(values.minTicket),
			maxTicket: Number(values.maxTicket),
			riskProfile: values.riskProfile,
			liquidityHorizonMonths: Number(values.liquidityHorizonMonths),
			focusRegions:
				values.focusRegions
					?.split(",")
					.map((value) => value.trim())
					.filter(Boolean) ?? [],
		});
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Investment preferences</CardTitle>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form
						className="space-y-6"
						onSubmit={form.handleSubmit(handleSubmit)}
					>
						<div className="grid gap-4 md:grid-cols-2">
							<FormField
								control={form.control}
								name="minTicket"
								render={({ field }) => (
									<FormItem className="space-y-2">
										<FormLabel>
											Minimum ticket (CAD){" "}
											<span className="text-muted-foreground text-xs">
												Required
											</span>
										</FormLabel>
										<FormControl>
											<Input
												{...field}
												onChange={(event) => field.onChange(event.target.value)}
												type="number"
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="maxTicket"
								render={({ field }) => (
									<FormItem className="space-y-2">
										<FormLabel>
											Maximum ticket (CAD){" "}
											<span className="text-muted-foreground text-xs">
												Required
											</span>
										</FormLabel>
										<FormControl>
											<Input
												{...field}
												onChange={(event) => field.onChange(event.target.value)}
												type="number"
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<FormField
							control={form.control}
							name="riskProfile"
							render={({ field }) => (
								<FormItem className="space-y-2">
									<FormLabel>
										Risk profile{" "}
										<span className="text-muted-foreground text-xs">
											Required
										</span>
									</FormLabel>
									<FormControl>
										<Select onValueChange={field.onChange} value={field.value}>
											<SelectTrigger>
												<SelectValue placeholder="Select profile" />
											</SelectTrigger>
											<SelectContent>
												{RISK_PROFILES.map((profile) => (
													<SelectItem key={profile} value={profile}>
														{profile.charAt(0).toUpperCase() + profile.slice(1)}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="grid gap-4 md:grid-cols-2">
							<FormField
								control={form.control}
								name="liquidityHorizonMonths"
								render={({ field }) => (
									<FormItem className="space-y-2">
										<FormLabel>
											Liquidity horizon (months){" "}
											<span className="text-muted-foreground text-xs">
												Required
											</span>
										</FormLabel>
										<FormControl>
											<Input
												{...field}
												onChange={(event) => field.onChange(event.target.value)}
												type="number"
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<FormField
							control={form.control}
							name="focusRegions"
							render={({ field }) => (
								<FormItem className="space-y-2">
									<FormLabel>
										Focus regions (comma separated){" "}
										<span className="text-muted-foreground text-xs">
											Optional
										</span>
									</FormLabel>
									<FormControl>
										<Textarea {...field} rows={2} value={field.value ?? ""} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="flex justify-end gap-3">
							<Button
								onClick={() => {
									if (typeof window !== "undefined") {
										window.history.back();
									}
								}}
								type="button"
								variant="ghost"
							>
								<ArrowLeft className="mr-2 size-4" />
								Back
							</Button>
							<Button disabled={!form.formState.isValid || busy} type="submit">
								{busy ? "Saving..." : "Continue"}
								<ArrowRight className="ml-2 size-4" />
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}

function InvestorKycStub({
	busy,
	onContinue,
}: {
	busy: boolean;
	onContinue: () => Promise<void>;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Compliance preview</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex items-start gap-3 rounded-lg border p-4">
					<Lock className="mt-1 size-5 text-primary" />
					<div>
						<p className="font-medium">KYC/AML coming soon</p>
						<p className="text-muted-foreground text-sm">
							We'll collect identity documents and accreditation evidence inside
							the app shortly. For now, acknowledging this step lets us queue
							your review.
						</p>
					</div>
				</div>
				<Button className="w-fit" disabled={busy} onClick={onContinue}>
					{busy ? "Saving..." : "I understand"}
				</Button>
			</CardContent>
		</Card>
	);
}

function InvestorDocumentsStep({
	documents,
	uploading,
	error,
	onUpload,
	onRemove,
	onContinue,
	busy,
}: {
	documents: InvestorDocument[];
	uploading: boolean;
	error: string | null;
	onUpload: (file: File) => Promise<void>;
	onRemove: (storageId: Id<"_storage">) => Promise<void>;
	onContinue: () => Promise<void>;
	busy: boolean;
}) {
	const [file, setFile] = useState<File | null>(null);

	const handleSubmit = async () => {
		if (file) {
			await onUpload(file);
			setFile(null);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Supporting documents (optional)</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<p className="text-muted-foreground text-sm">
					Upload accreditation letters, offering memos, or any context that
					helps us approve faster.
				</p>
				<div className="space-y-3">
					<Input
						accept="application/pdf,image/*"
						onChange={(event) => {
							const newFile = event.target.files?.[0] ?? null;
							setFile(newFile);
						}}
						type="file"
					/>
					<Button
						disabled={!file || uploading}
						onClick={() => {
							handleSubmit().catch(() => {
								// Error already handled in handleSubmit
							});
						}}
						variant="secondary"
					>
						{uploading ? "Uploading..." : "Upload"}
						<Upload className="ml-2 size-4" />
					</Button>
					{error ? <p className="text-destructive text-sm">{error}</p> : null}
				</div>
				{documents.length > 0 ? (
					<div className="space-y-2">
						<p className="font-medium text-sm">Uploaded</p>
						{documents.map((doc) => (
							<div
								className="flex items-center justify-between rounded border px-3 py-2"
								key={doc.storageId}
							>
								<span className="flex items-center gap-2 text-sm">
									<FileText className="size-4 text-muted-foreground" />
									{doc.label}
								</span>
								<Button
									onClick={() =>
										onRemove(doc.storageId).catch(() => {
											// Error already handled in onRemove
										})
									}
									size="sm"
									variant="ghost"
								>
									Remove
								</Button>
							</div>
						))}
					</div>
				) : null}
				<div className="flex justify-end">
					<Button disabled={busy} onClick={onContinue}>
						{busy ? "Saving..." : "Continue"}
						<ArrowRight className="ml-2 size-4" />
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

function InvestorReviewStep({
	investor,
	busy,
	onSubmit,
}: {
	investor: NonNullable<JourneyDoc["context"]>["investor"];
	busy: boolean;
	onSubmit: () => Promise<void>;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Review and submit</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid gap-4 md:grid-cols-2">
					<div className="rounded border p-4">
						<p className="font-medium text-sm">Profile</p>
						<p className="text-muted-foreground text-sm">
							{[
								investor?.profile?.firstName,
								investor?.profile?.middleName,
								investor?.profile?.lastName,
							]
								.filter(Boolean)
								.join(" ")}
						</p>
						<p className="text-muted-foreground text-sm">
							{investor?.profile?.entityType}
						</p>
					</div>
					<div className="rounded border p-4">
						<p className="font-medium text-sm">Preferences</p>
						<p className="text-muted-foreground text-sm">
							${investor?.preferences?.minTicket?.toLocaleString()} - $
							{investor?.preferences?.maxTicket?.toLocaleString()}
						</p>
						<p className="text-muted-foreground text-sm">
							Risk {investor?.preferences?.riskProfile}
						</p>
					</div>
				</div>
				<div className="rounded border p-4">
					<p className="font-medium text-sm">Documents</p>
					{(investor?.documents ?? []).length === 0 ? (
						<p className="text-muted-foreground text-sm">No uploads provided</p>
					) : (
						<ul className="list-disc pl-5 text-muted-foreground text-sm">
							{investor?.documents?.map((doc) => (
								<li key={doc.storageId ?? doc.label}>{doc.label}</li>
							))}
						</ul>
					)}
				</div>
				<Button disabled={busy} onClick={onSubmit}>
					{busy ? "Submitting..." : "Submit for review"}
				</Button>
			</CardContent>
		</Card>
	);
}

function PendingAdminState() {
	return (
		<Card className="border-dashed">
			<CardHeader>
				<CardTitle>Hang tight!</CardTitle>
			</CardHeader>
			<CardContent className="flex items-center gap-3 text-muted-foreground text-sm">
				<Spinner className="size-4" />
				Your onboarding is waiting for an admin. We'll email you as soon as it's
				approved.
			</CardContent>
		</Card>
	);
}

function RejectedState({
	decision,
}: {
	decision?: JourneyDoc["adminDecision"];
}) {
	return (
		<Card className="border-destructive/50">
			<CardHeader>
				<CardTitle>Onboarding requires changes</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				<div className="flex items-start gap-3 text-muted-foreground text-sm">
					<AlertTriangle className="mt-1 size-5 text-destructive" />
					<div>
						<p className="font-medium">We couldn't approve this submission.</p>
						<p>Please email support@fairlend.com with the reference below.</p>
					</div>
				</div>
				{decision?.notes ? (
					<p className="rounded border bg-muted/40 p-3 text-sm">
						{decision.notes}
					</p>
				) : null}
			</CardContent>
		</Card>
	);
}

function PlaceholderState({
	title,
	description,
}: {
	title: string;
	description: string;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
			</CardHeader>
			<CardContent className="text-muted-foreground text-sm">
				{description}
			</CardContent>
		</Card>
	);
}

function InvestorProgress({
	currentState,
	status,
}: {
	currentState: OnboardingStateValue;
	status: JourneyDoc["status"];
}) {
	const activeIndex = INVESTOR_STEPS.findIndex(
		(step) => step.id === currentState
	);

	// If submitted/approved/rejected, all steps are completed
	const allCompleted =
		status === "awaiting_admin" ||
		status === "approved" ||
		status === "rejected";
	return (
		<div className="grid gap-3 md:grid-cols-3">
			{INVESTOR_STEPS.map((step, index) => {
				const completed = allCompleted || index < activeIndex;
				const isActive = !allCompleted && index === activeIndex;
				return (
					<div
						className={cn(
							"rounded border p-3 text-sm",
							completed && "border-primary bg-primary/5",
							isActive && "border-primary"
						)}
						key={step.id}
					>
						<p className="font-medium">
							{step.label}
							{completed ? (
								<CheckCircle2 className="ml-2 inline size-4 text-primary" />
							) : null}
						</p>
						<p className="text-muted-foreground text-xs">{step.description}</p>
					</div>
				);
			})}
		</div>
	);
}

// ============================================================================
// BROKER ONBOARDING COMPONENTS
// ============================================================================

type BrokerFlowRouterProps = {
	currentState: OnboardingStateValue;
	broker: NonNullable<JourneyDoc["context"]>["broker"];
	savingState: OnboardingStateValue | null;
	uploading: boolean;
	documentError: string | null;
	onBrokerIntroContinue: () => void;
	onBrokerCompanyInfoSubmit: (values: BrokerCompanyInfoValues) => Promise<void>;
	onBrokerLicensingSubmit: (values: BrokerLicensingValues) => Promise<void>;
	onBrokerRepresentativesSubmit: (
		representatives: BrokerRepresentativeValues[]
	) => Promise<void>;
	onBrokerDocumentsContinue: () => void;
	onBrokerSubmitReview: (subdomain: string) => Promise<void>;
	onBrokerDocumentUpload: (file: File, docType: string) => Promise<void>;
	onBrokerRemoveDocument: (storageId: Id<"_storage">) => void;
};

function BrokerFlowRouter({
	currentState,
	broker,
	savingState,
	uploading,
	documentError,
	onBrokerIntroContinue,
	onBrokerCompanyInfoSubmit,
	onBrokerLicensingSubmit,
	onBrokerRepresentativesSubmit,
	onBrokerDocumentsContinue,
	onBrokerSubmitReview,
	onBrokerDocumentUpload,
	onBrokerRemoveDocument,
}: BrokerFlowRouterProps) {
	switch (currentState) {
		case "broker.intro":
			return (
				<BrokerIntroStep
					busy={savingState === "broker.company_info"}
					onContinue={onBrokerIntroContinue}
				/>
			);
		case "broker.company_info":
			return (
				<BrokerCompanyInfoForm
					busy={savingState === "broker.licensing"}
					defaultValues={broker?.companyInfo}
					onSubmit={onBrokerCompanyInfoSubmit}
				/>
			);
		case "broker.licensing":
			return (
				<BrokerLicensingForm
					busy={savingState === "broker.representatives"}
					defaultValues={broker?.licensing}
					onSubmit={onBrokerLicensingSubmit}
				/>
			);
		case "broker.representatives":
			return (
				<BrokerRepresentativesForm
					busy={savingState === "broker.documents"}
					defaultValues={broker?.representatives ?? []}
					onSubmit={onBrokerRepresentativesSubmit}
				/>
			);
		case "broker.documents":
			return (
				<BrokerDocumentsStep
					busy={savingState === "broker.review"}
					documents={(broker?.documents ?? []) as BrokerDocument[]}
					error={documentError}
					onContinue={onBrokerDocumentsContinue}
					onRemove={onBrokerRemoveDocument}
					onUpload={onBrokerDocumentUpload}
					uploading={uploading}
				/>
			);
		case "broker.review":
			return (
				<BrokerReviewStep
					broker={broker}
					busy={savingState === "broker.pending_admin"}
					onSubmit={onBrokerSubmitReview}
					proposedSubdomain={broker?.proposedSubdomain ?? ""}
				/>
			);
		case "broker.pending_admin":
			return <BrokerPendingAdminStep broker={broker} />;
		case "broker.rejected":
			return <BrokerRejectedStep broker={broker} />;
		default:
			return null;
	}
}

function BrokerIntroStep({
	busy,
	onContinue,
}: {
	busy: boolean;
	onContinue: () => void;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Welcome to FairLend Broker Portal</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<p className="text-muted-foreground">
					We review every broker application to ensure compliance and quality.
					This only takes a few minutes and your answers save automatically.
				</p>
				<ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
					<li>Tell us about your brokerage business</li>
					<li>Provide your licensing details</li>
					<li>List your team representatives</li>
					<li>Upload required documents (license, insurance, etc.)</li>
					<li>Choose your branded subdomain (e.g., acmebroker.flpilot.com)</li>
				</ul>
				<div className="flex items-center justify-end">
					<Button disabled={busy} onClick={onContinue}>
						{busy ? "Loading..." : "Begin"}
						<ArrowRight className="ml-2 size-4" />
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

export function BrokerCompanyInfoForm({
	defaultValues,
	onSubmit,
	busy,
}: {
	defaultValues?: BrokerCompanyInfoValues;
	onSubmit: (values: BrokerCompanyInfoValues) => Promise<void>;
	busy: boolean;
}) {
	const form = useForm<BrokerCompanyInfoValues>({
		resolver: zodResolver(brokerCompanyInfoSchema),
		mode: "onChange",
		defaultValues: defaultValues ?? {
			companyName: "",
			entityType: "corporation",
			registrationNumber: "",
			registeredAddress: {
				street: "",
				city: "",
				state: "",
				zip: "",
				country: "Canada",
			},
			businessPhone: "",
			businessEmail: "",
		},
	});

	useEffect(() => {
		if (defaultValues) {
			form.reset(defaultValues);
		}
	}, [defaultValues, form]);

	const handleSubmit = (values: BrokerCompanyInfoValues) => {
		onSubmit(values);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Company Information</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				<Form {...form}>
					<form
						className="space-y-6"
						onSubmit={form.handleSubmit(handleSubmit)}
					>
						<div className="grid gap-4">
							<FormField
								control={form.control}
								name="companyName"
								render={({ field }) => (
									<FormItem className="space-y-2">
										<FormLabel>Company name *</FormLabel>
										<FormControl>
											<Input placeholder="Company name" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="entityType"
								render={({ field }) => (
									<FormItem className="space-y-2">
										<FormLabel>Entity type *</FormLabel>
										<FormControl>
											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select entity type" />
												</SelectTrigger>
												<SelectContent>
													{BROKER_ENTITY_TYPES.map((type) => (
														<SelectItem key={type} value={type}>
															{String(type)
																.split("_")
																.map(
																	(word) =>
																		word.charAt(0).toUpperCase() + word.slice(1)
																)
																.join(" ")}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="registrationNumber"
								render={({ field }) => (
									<FormItem className="space-y-2">
										<FormLabel>Registration number *</FormLabel>
										<FormControl>
											<Input placeholder="Registration number" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="space-y-3">
							<p className="font-medium text-sm">Registered address</p>
							<div className="grid gap-3">
								<FormField
									control={form.control}
									name="registeredAddress.street"
									render={({ field }) => (
										<FormItem className="space-y-2">
											<FormLabel>Street address *</FormLabel>
											<FormControl>
												<Input placeholder="Street address" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<div className="grid gap-3 md:grid-cols-2">
									<FormField
										control={form.control}
										name="registeredAddress.city"
										render={({ field }) => (
											<FormItem className="space-y-2">
												<FormLabel>City *</FormLabel>
												<FormControl>
													<Input placeholder="City" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="registeredAddress.state"
										render={({ field }) => (
											<FormItem className="space-y-2">
												<FormLabel>State/Province *</FormLabel>
												<FormControl>
													<Input placeholder="State/Province" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								<div className="grid gap-3 md:grid-cols-2">
									<FormField
										control={form.control}
										name="registeredAddress.zip"
										render={({ field }) => (
											<FormItem className="space-y-2">
												<FormLabel>Postal/ZIP code *</FormLabel>
												<FormControl>
													<Input placeholder="Postal/ZIP code" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="registeredAddress.country"
										render={({ field }) => (
											<FormItem className="space-y-2">
												<FormLabel>Country *</FormLabel>
												<FormControl>
													<Input placeholder="Country" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</div>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<FormField
								control={form.control}
								name="businessPhone"
								render={({ field }) => (
									<FormItem className="space-y-2">
										<FormLabel>Business phone *</FormLabel>
										<FormControl>
											<Input placeholder="Business phone" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="businessEmail"
								render={({ field }) => (
									<FormItem className="space-y-2">
										<FormLabel>Business email *</FormLabel>
										<FormControl>
											<Input type="email" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<div className="flex justify-end gap-3">
							<Button disabled={busy} type="submit">
								{busy ? "Saving..." : "Continue"}
								<ArrowRight className="ml-2 size-4" />
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}

function BrokerLicensingForm({
	defaultValues,
	onSubmit,
	busy,
}: {
	defaultValues?: BrokerLicensingValues;
	onSubmit: (values: BrokerLicensingValues) => Promise<void>;
	busy: boolean;
}) {
	const form = useForm<BrokerLicensingValues>({
		resolver: zodResolver(brokerLicensingSchema),
		mode: "onChange",
		defaultValues: defaultValues ?? {
			licenseType: "mortgage_broker",
			licenseNumber: "",
			issuer: "",
			issuedDate: "",
			expiryDate: "",
			jurisdictions: [],
		},
	});
	const [jurisdictionInput, setJurisdictionInput] = useState("");

	useEffect(() => {
		if (defaultValues) {
			form.reset(defaultValues);
		}
	}, [defaultValues, form]);

	const handleSubmit = (values: BrokerLicensingValues) => {
		onSubmit(values);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Licensing Information</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				<Form {...form}>
					<form
						className="space-y-6"
						onSubmit={form.handleSubmit(handleSubmit)}
					>
						<div className="grid gap-4">
							<FormField
								control={form.control}
								name="licenseType"
								render={({ field }) => (
									<FormItem className="space-y-2">
										<FormLabel>License type *</FormLabel>
										<FormControl>
											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select license type" />
												</SelectTrigger>
												<SelectContent>
													{BROKER_LICENSE_TYPES.map((type) => (
														<SelectItem key={type} value={type}>
															{String(type)
																.split("_")
																.map(
																	(word) =>
																		word.charAt(0).toUpperCase() + word.slice(1)
																)
																.join(" ")}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="licenseNumber"
								render={({ field }) => (
									<FormItem className="space-y-2">
										<FormLabel>License number *</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="issuer"
								render={({ field }) => (
									<FormItem className="space-y-2">
										<FormLabel>Issuing organization *</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="grid gap-4 md:grid-cols-2">
								<FormField
									control={form.control}
									name="issuedDate"
									render={({ field }) => (
										<FormItem className="space-y-2">
											<FormLabel>Issuance date *</FormLabel>
											<FormControl>
												<Input type="date" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="expiryDate"
									render={({ field }) => (
										<FormItem className="space-y-2">
											<FormLabel>Expiry date *</FormLabel>
											<FormControl>
												<Input type="date" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>

						<FormField
							control={form.control}
							name="jurisdictions"
							render={({ field }) => {
								const jurisdictions = field.value ?? [];
								const handleAddJurisdiction = () => {
									const next = jurisdictionInput.trim();
									if (!next) {
										return;
									}
									field.onChange([...jurisdictions, next]);
									setJurisdictionInput("");
								};
								const handleRemoveJurisdiction = (index: number) => {
									field.onChange(jurisdictions.filter((_, i) => i !== index));
								};

								return (
									<FormItem className="space-y-2">
										<FormLabel>Jurisdictions *</FormLabel>
										<FormControl>
											<div className="flex flex-col gap-3">
												<div className="flex gap-2">
													<Input
														onChange={(event) =>
															setJurisdictionInput(event.target.value)
														}
														onKeyDown={(event) => {
															if (event.key === "Enter") {
																event.preventDefault();
																handleAddJurisdiction();
															}
														}}
														placeholder="Add a province or territory"
														value={jurisdictionInput}
													/>
													<Button
														onClick={handleAddJurisdiction}
														type="button"
														variant="secondary"
													>
														Add
													</Button>
												</div>
												{jurisdictions.length > 0 ? (
													<div className="flex flex-wrap gap-2">
														{jurisdictions.map((jurisdiction, index) => (
															<Badge
																className="cursor-pointer"
																key={jurisdiction}
																onClick={() => handleRemoveJurisdiction(index)}
																variant="secondary"
															>
																{jurisdiction}
																<span className="ml-1">×</span>
															</Badge>
														))}
													</div>
												) : null}
											</div>
										</FormControl>
										<FormMessage />
									</FormItem>
								);
							}}
						/>
						<div className="flex justify-end gap-3">
							<Button disabled={!form.formState.isValid || busy} type="submit">
								{busy ? "Saving..." : "Continue"}
								<ArrowRight className="ml-2 size-4" />
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}

function BrokerRepresentativesForm({
	defaultValues,
	onSubmit,
	busy,
}: {
	defaultValues?: BrokerRepresentativeValues[];
	onSubmit: (representatives: BrokerRepresentativeValues[]) => Promise<void>;
	busy: boolean;
}) {
	const [representatives, setRepresentatives] = useState<
		BrokerRepresentativeValues[]
	>(defaultValues ?? []);

	useEffect(() => {
		if (defaultValues) {
			setRepresentatives(defaultValues);
		}
	}, [defaultValues]);

	const form = useForm<BrokerRepresentativeValues>({
		resolver: zodResolver(brokerRepresentativeSchema),
		defaultValues: {
			firstName: "",
			lastName: "",
			role: "",
			email: "",
			phone: "",
			hasAuthority: false,
		},
		mode: "onChange",
	});

	const disabled = representatives.length === 0;

	const handleAddRepresentative = (values: BrokerRepresentativeValues) => {
		setRepresentatives((prev) => [...prev, values]);
		form.reset({
			firstName: "",
			lastName: "",
			role: "",
			email: "",
			phone: "",
			hasAuthority: false,
		});
	};

	const handleRemoveRepresentative = (index: number) => {
		setRepresentatives((prev) => prev.filter((_, i) => i !== index));
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Team Representatives</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				<p className="text-muted-foreground text-sm">
					Add the team members who will be working with your clients. You can
					skip this for now and add representatives later.
				</p>

				{representatives.length > 0 && (
					<div className="space-y-3">
						<p className="font-medium text-sm">Added representatives</p>
						{representatives.map((rep, index) => (
							<div
								className="flex items-start justify-between rounded border p-3"
								key={rep.email || `rep-${index}`}
							>
								<div>
									<p className="font-medium">
										{rep.firstName} {rep.lastName}
									</p>
									<p className="text-muted-foreground text-sm">{rep.role}</p>
									<p className="text-muted-foreground text-xs">
										{rep.email} • {rep.phone}
									</p>
									{rep.hasAuthority && (
										<Badge className="mt-1" variant="outline">
											Authorized
										</Badge>
									)}
								</div>
								<Button
									onClick={() => handleRemoveRepresentative(index)}
									size="sm"
									variant="ghost"
								>
									Remove
								</Button>
							</div>
						))}
					</div>
				)}

				<Form {...form}>
					<form
						className="rounded border p-4"
						onSubmit={form.handleSubmit(handleAddRepresentative)}
					>
						<p className="mb-3 font-medium text-sm">Add new representative</p>
						<div className="grid gap-4">
							<div className="grid gap-4 md:grid-cols-2">
								<FormField
									control={form.control}
									name="firstName"
									render={({ field }) => (
										<FormItem className="space-y-2">
											<FormLabel>
												First name{" "}
												<span className="text-muted-foreground text-xs">
													Required
												</span>
											</FormLabel>
											<FormControl>
												<Input {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="lastName"
									render={({ field }) => (
										<FormItem className="space-y-2">
											<FormLabel>
												Last name{" "}
												<span className="text-muted-foreground text-xs">
													Required
												</span>
											</FormLabel>
											<FormControl>
												<Input {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<FormField
								control={form.control}
								name="role"
								render={({ field }) => (
									<FormItem className="space-y-2">
										<FormLabel>
											Role/title{" "}
											<span className="text-muted-foreground text-xs">
												Required
											</span>
										</FormLabel>
										<FormControl>
											<Input
												{...field}
												placeholder="e.g., Senior Mortgage Broker"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<div className="grid gap-4 md:grid-cols-3">
								<FormField
									control={form.control}
									name="email"
									render={({ field }) => (
										<FormItem className="space-y-2">
											<FormLabel>
												Email{" "}
												<span className="text-muted-foreground text-xs">
													Required
												</span>
											</FormLabel>
											<FormControl>
												<Input {...field} type="email" />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="phone"
									render={({ field }) => (
										<FormItem className="space-y-2">
											<FormLabel>
												Phone{" "}
												<span className="text-muted-foreground text-xs">
													Required
												</span>
											</FormLabel>
											<FormControl>
												<Input {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="hasAuthority"
									render={({ field }) => (
										<FormItem className="space-y-2">
											<FormLabel>
												Authorized signer{" "}
												<span className="text-muted-foreground text-xs">
													Optional
												</span>
											</FormLabel>
											<FormControl>
												<div className="flex h-9 items-center gap-2">
													<input
														checked={Boolean(field.value)}
														id="repAuthority"
														onChange={(event) =>
															field.onChange(event.target.checked)
														}
														type="checkbox"
													/>
													<Label
														className="cursor-pointer"
														htmlFor="repAuthority"
													>
														Yes
													</Label>
												</div>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<Button
								disabled={!form.formState.isValid}
								type="submit"
								variant="secondary"
							>
								Add representative
							</Button>
						</div>
					</form>
				</Form>

				<div className="flex justify-end gap-3">
					<Button
						disabled={busy}
						onClick={() => onSubmit(representatives)}
						type="button"
						variant="ghost"
					>
						Skip for now
					</Button>
					<Button
						disabled={disabled || busy}
						onClick={() => onSubmit(representatives)}
					>
						{busy ? "Saving..." : "Continue"}
						<ArrowRight className="ml-2 size-4" />
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

function BrokerDocumentsStep({
	documents,
	uploading,
	error,
	onUpload,
	onRemove,
	onContinue,
	busy,
}: {
	documents: BrokerDocument[];
	uploading: boolean;
	error: string | null;
	onUpload: (file: File, docType: string) => Promise<void>;
	onRemove: (storageId: Id<"_storage">) => void;
	onContinue: () => void;
	busy: boolean;
}) {
	const [file, setFile] = useState<File | null>(null);
	const [docType, setDocType] = useState("");

	const handleSubmit = async () => {
		if (file && docType) {
			await onUpload(file, docType);
			setFile(null);
			setDocType("");
		}
	};

	const disabled = documents.length === 0;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Required Documents</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<p className="text-muted-foreground text-sm">
					Upload all required documents. Minimum: 1 document (license or
					insurance).
				</p>

				<div className="space-y-3">
					<Input
						accept="application/pdf,image/*"
						onChange={(event) => {
							const newFile = event.target.files?.[0] ?? null;
							setFile(newFile);
						}}
						type="file"
					/>
					<Select onValueChange={setDocType} value={docType}>
						<SelectTrigger>
							<SelectValue placeholder="Select document type" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="license">License Certificate</SelectItem>
							<SelectItem value="insurance">Insurance Certificate</SelectItem>
							<SelectItem value="registration">
								Business Registration
							</SelectItem>
							<SelectItem value="other">Other</SelectItem>
						</SelectContent>
					</Select>
					<Button
						disabled={!(file && docType) || uploading}
						onClick={() => {
							handleSubmit().catch(() => {
								// Error already handled in handleSubmit
							});
						}}
						variant="secondary"
					>
						{uploading ? "Uploading..." : "Upload"}
						<Upload className="ml-2 size-4" />
					</Button>
					{error ? <p className="text-destructive text-sm">{error}</p> : null}
				</div>

				{documents.length > 0 ? (
					<div className="space-y-2">
						<p className="font-medium text-sm">Uploaded documents</p>
						{documents.map((doc) => (
							<div
								className="flex items-center justify-between rounded border px-3 py-2"
								key={doc.storageId}
							>
								<span className="flex items-center gap-2 text-sm">
									<FileText className="size-4 text-muted-foreground" />
									{doc.label}
									<Badge className="ml-1" variant="outline">
										{doc.type}
									</Badge>
								</span>
								<Button
									onClick={() => onRemove(doc.storageId)}
									size="sm"
									variant="ghost"
								>
									Remove
								</Button>
							</div>
						))}
					</div>
				) : null}

				<div className="flex justify-end">
					<Button disabled={disabled || busy} onClick={onContinue}>
						{busy ? "Saving..." : "Continue"}
						<ArrowRight className="ml-2 size-4" />
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

function BrokerReviewStep({
	broker,
	busy,
	proposedSubdomain,
	onSubmit,
}: {
	broker: NonNullable<JourneyDoc["context"]>["broker"];
	busy: boolean;
	proposedSubdomain: string;
	onSubmit: (subdomain: string) => Promise<void>;
}) {
	const [subdomain, setSubdomain] = useState(proposedSubdomain);

	const companyInfo = broker?.companyInfo;
	const licensing = broker?.licensing;
	const representatives = broker?.representatives ?? [];
	const documents = (broker?.documents ?? []) as BrokerDocument[];

	const disabled = !subdomain?.trim();

	return (
		<Card>
			<CardHeader>
				<CardTitle>Review and Submit</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid gap-4 md:grid-cols-2">
					<div className="rounded border p-4">
						<p className="font-medium text-sm">Company Information</p>
						<p className="text-muted-foreground text-sm">
							{companyInfo?.companyName}
						</p>
						<p className="text-muted-foreground text-sm">
							{companyInfo?.entityType}
						</p>
						<p className="text-muted-foreground text-sm">
							{companyInfo?.businessEmail}
						</p>
					</div>
					<div className="rounded border p-4">
						<p className="font-medium text-sm">Licensing</p>
						<p className="text-muted-foreground text-sm">
							{licensing?.licenseType} - {licensing?.licenseNumber}
						</p>
						<p className="text-muted-foreground text-sm">
							issued by {licensing?.issuer}
						</p>
						<p className="text-muted-foreground text-sm">
							Expires{" "}
							{licensing?.expiryDate
								? new Date(licensing?.expiryDate).toLocaleDateString()
								: "N/A"}
						</p>
					</div>
				</div>

				<div className="rounded border p-4">
					<p className="font-medium text-sm">
						Representatives ({representatives.length})
					</p>
					<ul className="list-disc pl-5 text-muted-foreground text-sm">
						{representatives.slice(0, 3).map((rep) => (
							<li key={rep.email || `${rep.firstName}-${rep.lastName}`}>
								{rep.firstName} {rep.lastName} - {rep.role}
							</li>
						))}
						{representatives.length > 3 && (
							<li>+{representatives.length - 3} more</li>
						)}
					</ul>
				</div>

				<div className="rounded border p-4">
					<p className="font-medium text-sm">Documents ({documents.length})</p>
					<ul className="list-disc pl-5 text-muted-foreground text-sm">
						{documents.map((doc) => (
							<li key={doc.storageId || `${doc.label}-${doc.type}`}>
								{doc.label} ({doc.type})
							</li>
						))}
					</ul>
				</div>

				<div>
					<Label htmlFor="subdomain">Choose your subdomain</Label>
					<div className="mt-1 flex gap-2">
						<Input
							className="flex-1"
							id="subdomain"
							onChange={(event) => setSubdomain(event.target.value)}
							placeholder="acmebroker"
							value={subdomain}
						/>
						<span className="flex items-center text-muted-foreground text-sm">
							.flpilot.com
						</span>
					</div>
					<p className="mt-1 text-muted-foreground text-xs">
						Your branded portal will be accessible at {subdomain}.flpilot.com
					</p>
				</div>

				<Button disabled={disabled || busy} onClick={() => onSubmit(subdomain)}>
					{busy ? "Submitting..." : "Submit for review"}
				</Button>
			</CardContent>
		</Card>
	);
}

function BrokerProgress({
	currentState,
	status,
}: {
	currentState: OnboardingStateValue;
	status: JourneyDoc["status"];
}) {
	const activeIndex = BROKER_STEPS.findIndex(
		(step) => step.id === currentState
	);

	// If submitted/approved/rejected, all steps are completed
	const allCompleted =
		status === "awaiting_admin" ||
		status === "approved" ||
		status === "rejected";
	return (
		<div className="grid gap-3 md:grid-cols-3">
			{BROKER_STEPS.map((step, index) => {
				const completed = allCompleted || index < activeIndex;
				const isActive = !allCompleted && index === activeIndex;
				return (
					<div
						className={cn(
							"rounded border p-3 text-sm",
							completed && "border-primary bg-primary/5",
							isActive && "border-primary"
						)}
						key={step.id}
					>
						<p className="font-medium">
							{step.label}
							{completed ? (
								<CheckCircle2 className="ml-2 inline size-4 text-primary" />
							) : null}
						</p>
						<p className="text-muted-foreground text-xs">{step.description}</p>
					</div>
				);
			})}
		</div>
	);
}

function BrokerPendingAdminStep({
	broker,
}: {
	broker: NonNullable<JourneyDoc["context"]>["broker"] | undefined;
}) {
	const companyName = broker?.companyInfo?.companyName || "your company";
	const _companyType = broker?.companyInfo?.entityType || "entity";

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Clock className="size-5 text-primary" />
					Your application is under review
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<p className="text-muted-foreground">
					Thank you for submitting your broker application for{" "}
					<strong>{companyName}</strong>. Our team is reviewing your
					application, and we will notify you once a decision has been made.
				</p>
				<div className="rounded bg-muted p-4">
					<h4 className="font-medium text-sm">What happens next?</h4>
					<ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground text-sm">
						<li>We review your company information and licensing</li>
						<li>We verify your credentials and references</li>
						<li>We check your proposed subdomain availability</li>
						<li>We may reach out with questions or documentation requests</li>
						<li>You will receive an email notification with our decision</li>
					</ul>
				</div>
				{broker?.proposedSubdomain && (
					<div className="rounded border p-3">
						<p className="text-muted-foreground text-sm">
							<strong>Your proposed subdomain:</strong>{" "}
							{broker.proposedSubdomain}.flpilot.com
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function BrokerRejectedStep({
	broker: _broker,
}: {
	broker: NonNullable<JourneyDoc["context"]>["broker"] | undefined;
}) {
	return (
		<Card className="border-destructive">
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-destructive">
					<XCircle className="size-5" />
					Application not approved
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<p className="text-muted-foreground">
					Unfortunately, your broker application was not approved at this time.
					If you believe this decision was made in error or if you would like to
					address any concerns, please contact our support team.
				</p>
			</CardContent>
		</Card>
	);
}
