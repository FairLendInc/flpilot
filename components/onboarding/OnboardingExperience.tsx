"use client";

import { useAction, useConvexAuth, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuthenticatedQuery } from "@/convex/lib/client";
import { useProvisionCurrentUser } from "@/hooks/useProvisionCurrentUser";
import {
	BROKER_STEPS,
	type BrokerCompanyInfoValues,
	type BrokerDocument,
	BrokerFlowRouter,
	type BrokerLicensingValues,
	type BrokerRepresentativeValues,
} from "./flows/broker/BrokerFlow";
import {
	INVESTOR_STEPS,
	type InvestorDocument,
	InvestorFlowRouter,
	type InvestorPreferencesValues,
	type InvestorProfileValues,
} from "./flows/investor/InvestorFlow";
import {
	getNextLawyerStep,
	LAWYER_STEPS,
	LawyerFlowRouter,
	type LawyerProfileValues,
} from "./flows/lawyer/LawyerFlow";
import type { OnboardingStateValue } from "./machine";
import { OnboardingCard } from "./shared/OnboardingCard";
import { OnboardingHeader } from "./shared/OnboardingHeader";
import { OnboardingProgress } from "./shared/OnboardingProgress";
import {
	PendingAdminState,
	RejectedState,
} from "./shared/OnboardingStatusStates";
import { type PersonaOption, PersonaSelector } from "./shared/PersonaSelector";
import { useOnboardingMachine } from "./useOnboardingMachine";

const PERSONA_OPTIONS: PersonaOption[] = [
	{
		id: "investor",
		title: "Investor",
		description:
			"Access curated mortgage opportunities once your profile is approved.",
	},
	{
		id: "broker",
		title: "Broker",
		description: "Submit deals and manage your clients' portfolios.",
	},
	{
		id: "lawyer",
		title: "Lawyer",
		description: "Complete legal onboarding to review closings and holdbacks.",
	},
];

function stateValueToString(
	value: string | Record<string, unknown>
): OnboardingStateValue {
	if (typeof value === "string") {
		return value as OnboardingStateValue;
	}
	const [parentKey, childValue] = Object.entries(value)[0];
	if (typeof childValue === "string") {
		return `${parentKey}.${childValue}` as OnboardingStateValue;
	}
	return "personaSelection";
}

type InvestorContextPatch = {
	profile?: InvestorProfileValues;
	preferences?: InvestorPreferencesValues;
	kycPlaceholder?: {
		status: "not_started" | "blocked" | "submitted";
		notes?: string;
	};
	documents?: InvestorDocument[];
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
	const saveLawyerProfile = useMutation(api.onboarding.saveLawyerProfile);
	const advanceLawyerStep = useMutation(api.onboarding.advanceLawyerStep);
	const runLawyerIdentityVerification = useMutation(
		api.onboarding.runLawyerIdentityVerification
	);
	const runLawyerLsoVerification = useMutation(
		api.onboarding.runLawyerLsoVerification
	);
	const submitLawyerJourney = useMutation(api.onboarding.submitLawyerJourney);

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
	const lawyerContext = journey?.context?.lawyer ?? {};

	const isUserProvisioned = userProfile?.user !== null;
	const isProvisioning = userProfile !== undefined && !isUserProvisioned;

	useEffect(() => {
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
		await persistState("investor.kyc_stub", { preferences: values });
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
			const newDoc = {
				storageId: json.storageId as Id<"_storage">,
				label: file.name,
				type: docType,
			};
			const existingDocs = (brokerContext?.documents ?? []) as BrokerDocument[];
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

	const handleLawyerIntroContinue = async () => {
		const nextState = getNextLawyerStep("lawyer.intro");
		setSavingState(nextState);
		try {
			await advanceLawyerStep({ stateValue: nextState });
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : "Unable to continue";
			toast.error(message);
		} finally {
			setSavingState(null);
		}
	};

	const handleLawyerProfileSubmit = async (values: LawyerProfileValues) => {
		const nextState = getNextLawyerStep("lawyer.profile");
		setSavingState(nextState);
		try {
			await saveLawyerProfile({
				stateValue: nextState,
				profile: values,
			});
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : "Unable to save profile";
			toast.error(message);
		} finally {
			setSavingState(null);
		}
	};

	const handleLawyerIdentityVerification = async (
		simulateMismatch: boolean
	) => {
		setSavingState("lawyer.identity_verification");
		try {
			await runLawyerIdentityVerification({ simulateMismatch });
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : "Unable to verify identity";
			toast.error(message);
		} finally {
			setSavingState(null);
		}
	};

	const handleLawyerContinueToLso = async () => {
		const nextState = getNextLawyerStep("lawyer.identity_verification");
		setSavingState(nextState);
		try {
			await advanceLawyerStep({ stateValue: nextState });
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : "Unable to continue";
			toast.error(message);
		} finally {
			setSavingState(null);
		}
	};

	const handleLawyerLsoVerification = async () => {
		setSavingState("lawyer.lso_verification");
		try {
			await runLawyerLsoVerification({});
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : "Unable to verify LSO number";
			toast.error(message);
		} finally {
			setSavingState(null);
		}
	};

	const handleLawyerContinueToReview = async () => {
		const nextState = getNextLawyerStep("lawyer.lso_verification");
		setSavingState(nextState);
		try {
			await advanceLawyerStep({ stateValue: nextState });
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : "Unable to continue";
			toast.error(message);
		} finally {
			setSavingState(null);
		}
	};

	const handleLawyerSubmitReview = async () => {
		setSavingState("lawyer.pending_admin");
		try {
			await submitLawyerJourney({});
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : "Unable to submit onboarding";
			toast.error(message);
		} finally {
			setSavingState(null);
		}
	};

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
	const showLawyerFlow = currentState.startsWith("lawyer.");
	const awaitingAdmin = status === "awaiting_admin";
	const rejected = status === "rejected";

	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col gap-8 py-10">
			<OnboardingHeader
				lastTouchedAt={journey?.lastTouchedAt}
				status={status}
				subtitle="Choose how you want to work with FairLend. Your progress saves automatically and you can resume anytime."
				title="Choose your FairLend onboarding path"
			/>

			{persona === "unselected" ? (
				<PersonaSelector
					onSelect={handlePersonaSelect}
					options={PERSONA_OPTIONS}
					pending={pendingPersona}
				/>
			) : null}

			{persona !== "unselected" ? (
				<OnboardingCard>
					<CardHeader>
						<CardTitle>Progress</CardTitle>
					</CardHeader>
					<CardContent>
						{persona === "investor" ? (
							<OnboardingProgress
								currentState={currentState}
								status={status}
								steps={INVESTOR_STEPS}
							/>
						) : null}
						{persona === "broker" ? (
							<OnboardingProgress
								currentState={currentState}
								status={status}
								steps={BROKER_STEPS}
							/>
						) : null}
						{persona === "lawyer" ? (
							<OnboardingProgress
								columns={2}
								currentState={currentState}
								status={status}
								steps={LAWYER_STEPS}
							/>
						) : null}
					</CardContent>
				</OnboardingCard>
			) : null}

			{persona === "investor" && awaitingAdmin ? <PendingAdminState /> : null}
			{persona === "investor" && rejected ? (
				<RejectedState decision={journey?.adminDecision} />
			) : null}
			{persona === "lawyer" && awaitingAdmin ? <PendingAdminState /> : null}
			{persona === "lawyer" && rejected ? (
				<RejectedState decision={journey?.adminDecision} />
			) : null}

			{persona === "broker" ? (
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
			) : null}

			{showLawyerFlow && !awaitingAdmin && !rejected ? (
				<LawyerFlowRouter
					currentState={currentState}
					lawyer={lawyerContext}
					onIdentityVerify={handleLawyerIdentityVerification}
					onIntroContinue={handleLawyerIntroContinue}
					onLsoContinue={handleLawyerContinueToReview}
					onLsoVerify={handleLawyerLsoVerification}
					onProfileSubmit={handleLawyerProfileSubmit}
					onSubmitReview={handleLawyerSubmitReview}
					onVerifyContinue={handleLawyerContinueToLso}
					savingState={savingState}
				/>
			) : null}

			{showInvestorFlow && !awaitingAdmin && !rejected ? (
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
			) : null}
		</div>
	);
}
