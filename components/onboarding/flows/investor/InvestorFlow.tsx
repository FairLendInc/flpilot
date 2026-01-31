import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Id } from "@/convex/_generated/dataModel";
import type { JourneyDoc, OnboardingStateValue } from "../../machine";
import { OnboardingCard } from "../../shared/OnboardingCard";
import { OnboardingIntroCard } from "../../shared/OnboardingIntroCard";

const ENTITY_TYPES = ["individual", "corporation", "trust", "fund"] as const;
const RISK_PROFILES = ["conservative", "balanced", "growth"] as const;

export const INVESTOR_STEPS: {
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
		id: "investor.kyc_stub",
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

export type InvestorProfileValues = {
	firstName: string;
	middleName?: string;
	lastName: string;
	entityType: (typeof ENTITY_TYPES)[number];
	phone?: string;
};

export type InvestorPreferencesValues = {
	minTicket: number;
	maxTicket: number;
	riskProfile: (typeof RISK_PROFILES)[number];
	liquidityHorizonMonths: number;
	focusRegions: string[];
};

export type InvestorDocument = { storageId: Id<"_storage">; label: string };

export type InvestorFlowRouterProps = {
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

export function InvestorFlowRouter({
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
			function isValidProfile(p: typeof profile): p is {
				firstName: string;
				lastName: string;
				entityType: InvestorProfileValues["entityType"];
				middleName?: string;
				phone?: string;
			} {
				return Boolean(p?.firstName && p?.lastName && p?.entityType);
			}
			return (
				<InvestorProfileForm
					busy={savingState === "investor.preferences"}
					defaultValues={isValidProfile(profile) ? profile : undefined}
					onSubmit={onProfileSubmit}
				/>
			);
		}
		case "investor.preferences": {
			const preferences = investor?.preferences;
			function isValidPreferences(
				p: typeof preferences
			): p is InvestorPreferencesValues {
				return Boolean(
					p?.minTicket &&
						p?.maxTicket &&
						p?.riskProfile &&
						p?.liquidityHorizonMonths
				);
			}
			return (
				<InvestorPreferencesForm
					busy={savingState === "investor.kyc_stub"}
					defaultValues={
						isValidPreferences(preferences) ? preferences : undefined
					}
					onSubmit={onPreferencesSubmit}
				/>
			);
		}
		case "investor.kyc_stub":
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
					documents={(investor?.documents ?? []) as InvestorDocument[]}
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
		<OnboardingIntroCard
			bullets={[
				"Tell us about your investing entity",
				"Describe the deal sizes and regions you care about",
				"Acknowledge compliance while we integrate KYC/AML vendors",
			]}
			busy={busy}
			description="We review every applicant to keep marketplace access aligned with pilot requirements. This only takes a few minutes and your answers save automatically."
			onContinue={onContinue}
			title="Welcome to FairLend"
		/>
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
		<OnboardingCard>
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
										<Select onValueChange={field.onChange} value={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{ENTITY_TYPES.map((entity) => (
													<SelectItem key={entity} value={entity}>
														{entity}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="phone"
								render={({ field }) => (
									<FormItem className="space-y-2">
										<FormLabel>Phone</FormLabel>
										<FormControl>
											<Input {...field} value={field.value ?? ""} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<div className="flex justify-end">
							<Button disabled={busy} type="submit">
								{busy ? "Saving..." : "Continue"}
								<ArrowRight className="ml-2 size-4" />
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</OnboardingCard>
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
		defaultValues: defaultValues
			? {
					minTicket: String(defaultValues.minTicket),
					maxTicket: String(defaultValues.maxTicket),
					riskProfile: defaultValues.riskProfile,
					liquidityHorizonMonths: String(defaultValues.liquidityHorizonMonths),
					focusRegions: defaultValues.focusRegions?.join(", ") ?? "",
				}
			: {
					minTicket: "",
					maxTicket: "",
					riskProfile: "balanced",
					liquidityHorizonMonths: "",
					focusRegions: "",
				},
		mode: "onChange",
	});

	useEffect(() => {
		if (defaultValues) {
			form.reset({
				minTicket: String(defaultValues.minTicket),
				maxTicket: String(defaultValues.maxTicket),
				riskProfile: defaultValues.riskProfile,
				liquidityHorizonMonths: String(defaultValues.liquidityHorizonMonths),
				focusRegions: defaultValues.focusRegions?.join(", ") ?? "",
			});
		}
	}, [defaultValues, form]);

	const handleSubmit = (values: InvestorPreferencesFormValues) => {
		onSubmit({
			minTicket: Number(values.minTicket),
			maxTicket: Number(values.maxTicket),
			riskProfile: values.riskProfile,
			liquidityHorizonMonths: Number(values.liquidityHorizonMonths),
			focusRegions: values.focusRegions
				? values.focusRegions
						.split(",")
						.map((value) => value.trim())
						.filter(Boolean)
				: [],
		});
	};

	return (
		<OnboardingCard>
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
										<FormLabel>Minimum ticket</FormLabel>
										<FormControl>
											<Input {...field} placeholder="100000" type="number" />
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
										<FormLabel>Maximum ticket</FormLabel>
										<FormControl>
											<Input {...field} placeholder="500000" type="number" />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="riskProfile"
								render={({ field }) => (
									<FormItem className="space-y-2">
										<FormLabel>Risk profile</FormLabel>
										<Select onValueChange={field.onChange} value={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{RISK_PROFILES.map((profile) => (
													<SelectItem key={profile} value={profile}>
														{profile}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="liquidityHorizonMonths"
								render={({ field }) => (
									<FormItem className="space-y-2">
										<FormLabel>Liquidity horizon (months)</FormLabel>
										<FormControl>
											<Input {...field} placeholder="12" type="number" />
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
									<FormLabel>Preferred regions</FormLabel>
									<FormControl>
										<Textarea
											{...field}
											placeholder="e.g., ON, BC, AB"
											rows={3}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
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
		</OnboardingCard>
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
		<OnboardingCard>
			<CardHeader>
				<CardTitle>KYC acknowledgement</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<p className="text-muted-foreground text-sm">
					We're integrating a full KYC/AML provider. For now, please confirm you
					understand a compliance check will be required before investing.
				</p>
				<div className="flex justify-end">
					<Button disabled={busy} onClick={onContinue}>
						{busy ? "Saving..." : "I understand"}
						<ArrowRight className="ml-2 size-4" />
					</Button>
				</div>
			</CardContent>
		</OnboardingCard>
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
	onRemove: (storageId: InvestorDocument["storageId"]) => Promise<void>;
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
		<OnboardingCard>
			<CardHeader>
				<CardTitle>Optional documents</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<p className="text-muted-foreground text-sm">
					Upload any documents that support your accreditation. This is optional
					for now.
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
								// Error handled upstream
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
									<Badge variant="outline">{doc.label}</Badge>
								</span>
								<Button
									onClick={() =>
										onRemove(doc.storageId).catch(() => {
											// Error handled upstream
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
		</OnboardingCard>
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
	const profile = investor?.profile;
	const preferences = investor?.preferences;
	const documents = (investor?.documents ?? []) as InvestorDocument[];
	const disabled = !(profile && preferences);

	return (
		<OnboardingCard>
			<CardHeader>
				<CardTitle>Review and submit</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid gap-4 md:grid-cols-2">
					<div className="rounded border p-4">
						<p className="font-medium text-sm">Profile</p>
						<p className="text-muted-foreground text-sm">
							{profile?.firstName} {profile?.lastName}
						</p>
						<p className="text-muted-foreground text-sm">
							{profile?.entityType}
						</p>
					</div>
					<div className="rounded border p-4">
						<p className="font-medium text-sm">Preferences</p>
						<p className="text-muted-foreground text-sm">
							{preferences?.riskProfile} · {preferences?.minTicket} -
							{preferences?.maxTicket}
						</p>
						<p className="text-muted-foreground text-sm">
							Horizon: {preferences?.liquidityHorizonMonths} months
						</p>
					</div>
				</div>
				{documents.length > 0 ? (
					<div className="rounded border p-4">
						<p className="font-medium text-sm">
							Documents ({documents.length})
						</p>
						<ul className="list-disc pl-5 text-muted-foreground text-sm">
							{documents.map((doc) => (
								<li key={doc.storageId}>{doc.label}</li>
							))}
						</ul>
					</div>
				) : null}
				<Button disabled={disabled || busy} onClick={onSubmit}>
					{busy ? "Submitting..." : "Submit for review"}
				</Button>
			</CardContent>
		</OnboardingCard>
	);
}
