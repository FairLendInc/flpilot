"use client";

import type { Preloaded } from "convex/react";
import {
	useAction,
	useMutation,
	usePreloadedQuery,
	useQuery,
} from "convex/react";
import { formatDistanceToNow } from "date-fns";
import {
	AlertTriangle,
	ArrowLeft,
	ArrowRight,
	CheckCircle2,
	FileText,
	Lock,
	Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
		description: "Submit deals and manage your borrowers (coming soon).",
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

const ENTITY_TYPES = ["individual", "corporation", "trust", "fund"] as const;
const RISK_PROFILES = ["conservative", "balanced", "growth"] as const;

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

type Props = {
	preloadedJourney: Preloaded<typeof api.onboarding.getJourney>;
};

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

export function OnboardingExperience({ preloadedJourney }: Props) {
	const router = useRouter();
	const preloadedData = usePreloadedQuery(preloadedJourney);
	const liveJourney = useQuery(api.onboarding.getJourney, {});
	// Use liveJourney if it's loaded (even if null), otherwise fall back to preloadedData
	// This ensures we use realtime updates once the query has loaded
	const journey = liveJourney !== undefined ? liveJourney : preloadedData;
	const userProfile = useQuery(api.profile.getCurrentUserProfile);
	useProvisionCurrentUser(userProfile);
	const ensureJourney = useMutation(api.onboarding.ensureJourney);
	const startJourney = useMutation(api.onboarding.startJourney);
	const saveInvestorStep = useMutation(api.onboarding.saveInvestorStep);
	const submitInvestorJourney = useMutation(
		api.onboarding.submitInvestorJourney
	);
	const generateUploadUrl = useAction(api.onboarding.generateDocumentUploadUrl);
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

	const currentState = stateValueToString(snapshot.value);
	const persona = snapshot.context.persona ?? journey?.persona ?? "unselected";
	const status = journey?.status ?? snapshot.context.status;
	const investorContext = journey?.context?.investor ?? {};

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

	// Show loading while provisioning user or ensuring journey
	if (
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
						<InvestorProgress currentState={currentState} status={status} />
					</CardContent>
				</Card>
			)}

			{awaitingAdmin && <PendingAdminState />}
			{rejected && <RejectedState decision={journey?.adminDecision} />}

			{persona === "broker" && !awaitingAdmin && !rejected && (
				<PlaceholderState
					description="Thanks for your interest! Our broker workflow is shipping shortly. We'll notify you once it's ready."
					title="Broker onboarding coming soon"
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
	const [formValues, setFormValues] = useState<InvestorProfileValues>(
		defaultValues ?? {
			firstName: "",
			middleName: "",
			lastName: "",
			entityType: "individual",
			phone: "",
		}
	);

	useEffect(() => {
		if (defaultValues) {
			setFormValues(defaultValues);
		}
	}, [defaultValues]);

	const disabled = !(formValues.firstName && formValues.lastName);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Investor profile</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid gap-4">
					<div>
						<Label htmlFor="firstName">First name</Label>
						<Input
							id="firstName"
							onChange={(event) =>
								setFormValues((prev) => ({
									...prev,
									firstName: event.target.value,
								}))
							}
							value={formValues.firstName}
						/>
					</div>
					<div className="grid gap-4 md:grid-cols-2">
						<div>
							<Label htmlFor="middleName">Middle name (optional)</Label>
							<Input
								id="middleName"
								onChange={(event) =>
									setFormValues((prev) => ({
										...prev,
										middleName: event.target.value,
									}))
								}
								value={formValues.middleName ?? ""}
							/>
						</div>
						<div>
							<Label htmlFor="lastName">Last name</Label>
							<Input
								id="lastName"
								onChange={(event) =>
									setFormValues((prev) => ({
										...prev,
										lastName: event.target.value,
									}))
								}
								value={formValues.lastName}
							/>
						</div>
					</div>
				</div>
				<div className="grid gap-4 md:grid-cols-2">
					<div>
						<Label>Entity type</Label>
						<Select
							onValueChange={(value) =>
								setFormValues((prev) => ({
									...prev,
									entityType: value as InvestorProfileValues["entityType"],
								}))
							}
							value={formValues.entityType}
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
					</div>
					<div>
						<Label htmlFor="phone">Phone (optional)</Label>
						<Input
							id="phone"
							onChange={(event) =>
								setFormValues((prev) => ({
									...prev,
									phone: event.target.value,
								}))
							}
							value={formValues.phone ?? ""}
						/>
					</div>
				</div>
				<div className="flex justify-end gap-3">
					<Button disabled variant="ghost">
						<ArrowLeft className="mr-2 size-4" /> Back
					</Button>
					<Button
						disabled={disabled || busy}
						onClick={() => onSubmit(formValues)}
					>
						{busy ? "Saving..." : "Continue"}
						<ArrowRight className="ml-2 size-4" />
					</Button>
				</div>
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
	const [formValues, setFormValues] = useState({
		minTicket: defaultValues?.minTicket?.toString() ?? "",
		maxTicket: defaultValues?.maxTicket?.toString() ?? "",
		riskProfile: defaultValues?.riskProfile ?? "balanced",
		liquidityHorizonMonths:
			defaultValues?.liquidityHorizonMonths?.toString() ?? "12",
		focusRegions: (defaultValues?.focusRegions ?? []).join(", "),
	});

	useEffect(() => {
		if (defaultValues) {
			setFormValues({
				minTicket: defaultValues.minTicket.toString(),
				maxTicket: defaultValues.maxTicket.toString(),
				riskProfile: defaultValues.riskProfile,
				liquidityHorizonMonths: defaultValues.liquidityHorizonMonths.toString(),
				focusRegions: (defaultValues.focusRegions ?? []).join(", "),
			});
		}
	}, [defaultValues]);

	const canContinue =
		Number(formValues.minTicket) > 0 &&
		Number(formValues.maxTicket) >= Number(formValues.minTicket);

	const handleSubmit = () => {
		const values: InvestorPreferencesValues = {
			minTicket: Number(formValues.minTicket),
			maxTicket: Number(formValues.maxTicket),
			riskProfile:
				formValues.riskProfile as InvestorPreferencesValues["riskProfile"],
			liquidityHorizonMonths: Number(formValues.liquidityHorizonMonths),
			focusRegions: formValues.focusRegions
				.split(",")
				.map((value) => value.trim())
				.filter(Boolean),
		};
		onSubmit(values);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Investment preferences</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid gap-4 md:grid-cols-2">
					<div>
						<Label htmlFor="minTicket">Minimum ticket (CAD)</Label>
						<Input
							id="minTicket"
							onChange={(event) =>
								setFormValues((prev) => ({
									...prev,
									minTicket: event.target.value,
								}))
							}
							type="number"
							value={formValues.minTicket}
						/>
					</div>
					<div>
						<Label htmlFor="maxTicket">Maximum ticket (CAD)</Label>
						<Input
							id="maxTicket"
							onChange={(event) =>
								setFormValues((prev) => ({
									...prev,
									maxTicket: event.target.value,
								}))
							}
							type="number"
							value={formValues.maxTicket}
						/>
					</div>
				</div>
				<div>
					<Label>Risk profile</Label>
					<Select
						onValueChange={(value) =>
							setFormValues((prev) => ({
								...prev,
								riskProfile: value as (typeof RISK_PROFILES)[number],
							}))
						}
						value={formValues.riskProfile}
					>
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
				</div>
				<div className="grid gap-4 md:grid-cols-2">
					<div>
						<Label htmlFor="liquidity">Liquidity horizon (months)</Label>
						<Input
							id="liquidity"
							onChange={(event) =>
								setFormValues((prev) => ({
									...prev,
									liquidityHorizonMonths: event.target.value,
								}))
							}
							type="number"
							value={formValues.liquidityHorizonMonths}
						/>
					</div>
				</div>
				<div>
					<Label htmlFor="regions">Focus regions (comma separated)</Label>
					<Textarea
						id="regions"
						onChange={(event) =>
							setFormValues((prev) => ({
								...prev,
								focusRegions: event.target.value,
							}))
						}
						rows={2}
						value={formValues.focusRegions}
					/>
				</div>
				<div className="flex justify-end gap-3">
					<Button
						onClick={() => {
							if (typeof window !== "undefined") {
								window.history.back();
							}
						}}
						variant="ghost"
					>
						<ArrowLeft className="mr-2 size-4" />
						Back
					</Button>
					<Button disabled={!canContinue || busy} onClick={handleSubmit}>
						{busy ? "Saving..." : "Continue"}
						<ArrowRight className="ml-2 size-4" />
					</Button>
				</div>
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
									onClick={() => {
										onRemove(doc.storageId).catch(() => {
											// Error already handled in onRemove
										});
									}}
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
								<li key={doc.storageId}>{doc.label}</li>
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
