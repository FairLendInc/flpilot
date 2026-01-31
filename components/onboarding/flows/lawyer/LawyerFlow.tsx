import { zodResolver } from "@hookform/resolvers/zod";
import {
	AlertTriangle,
	ArrowRight,
	CheckCircle2,
	ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { JourneyDoc, OnboardingStateValue } from "../../machine";
import { OnboardingCard } from "../../shared/OnboardingCard";
import { OnboardingIntroCard } from "../../shared/OnboardingIntroCard";

export const LAWYER_STEPS: {
	id: OnboardingStateValue;
	label: string;
	description: string;
}[] = [
	{
		id: "lawyer.intro",
		label: "Welcome",
		description: "Learn how legal onboarding works",
	},
	{
		id: "lawyer.profile",
		label: "Profile",
		description: "Confirm your legal details",
	},
	{
		id: "lawyer.identity_verification",
		label: "ID Verification",
		description: "Verify your government ID",
	},
	{
		id: "lawyer.lso_verification",
		label: "LSO Check",
		description: "Match your LSO number",
	},
	{
		id: "lawyer.review",
		label: "Review",
		description: "Confirm and submit",
	},
];

const lawyerProfileSchema = z.object({
	firstName: z.string().min(1, "First name is required"),
	middleName: z.string().optional().or(z.literal("")),
	lastName: z.string().min(1, "Last name is required"),
	lsoNumber: z.string().min(1, "LSO number is required"),
	firmName: z.string().min(1, "Firm name is required"),
	email: z.string().min(1, "Email is required").email("Email must be valid"),
	phone: z.string().min(1, "Phone is required"),
	jurisdiction: z.string().min(1, "Jurisdiction is required"),
});

export type LawyerProfileValues = {
	firstName: string;
	middleName?: string;
	lastName: string;
	lsoNumber: string;
	firmName: string;
	email: string;
	phone: string;
	jurisdiction: string;
};

type LawyerIdentityStatus =
	| "not_started"
	| "pending"
	| "verified"
	| "mismatch"
	| "failed";

type LawyerLsoStatus = "not_started" | "verified" | "failed";

export type LawyerFlowRouterProps = {
	currentState: OnboardingStateValue;
	lawyer: NonNullable<JourneyDoc["context"]>["lawyer"];
	savingState: OnboardingStateValue | null;
	onIntroContinue: () => Promise<void>;
	onProfileSubmit: (values: LawyerProfileValues) => Promise<void>;
	onIdentityVerify: (simulateMismatch: boolean) => Promise<void>;
	onVerifyContinue: () => Promise<void>;
	onLsoVerify: () => Promise<void>;
	onLsoContinue: () => Promise<void>;
	onSubmitReview: () => Promise<void>;
};

export function getNextLawyerStep(currentState: OnboardingStateValue) {
	const currentIndex = LAWYER_STEPS.findIndex(
		(step) => step.id === currentState
	);
	if (currentIndex < 0) return currentState;
	return LAWYER_STEPS[currentIndex + 1]?.id ?? currentState;
}

export function LawyerFlowRouter({
	currentState,
	lawyer,
	savingState,
	onIntroContinue,
	onProfileSubmit,
	onIdentityVerify,
	onVerifyContinue,
	onLsoVerify,
	onLsoContinue,
	onSubmitReview,
}: LawyerFlowRouterProps) {
	switch (currentState) {
		case "lawyer.intro":
			return (
				<LawyerIntroStep
					busy={savingState === "lawyer.profile"}
					onContinue={onIntroContinue}
				/>
			);
		case "lawyer.profile":
			return (
				<LawyerProfileForm
					busy={savingState === "lawyer.identity_verification"}
					defaultValues={lawyer?.profile}
					onSubmit={onProfileSubmit}
				/>
			);
		case "lawyer.identity_verification":
			return (
				<LawyerIdentityVerificationStep
					busy={savingState === "lawyer.identity_verification"}
					extractedName={lawyer?.identityVerification?.extractedName}
					onContinue={onVerifyContinue}
					onVerify={onIdentityVerify}
					profile={lawyer?.profile}
					status={
						(lawyer?.identityVerification?.status ??
							"not_started") as LawyerIdentityStatus
					}
				/>
			);
		case "lawyer.lso_verification":
			return (
				<LawyerLsoVerificationStep
					busy={savingState === "lawyer.lso_verification"}
					matchedRecord={lawyer?.lsoVerification?.matchedRecord}
					onContinue={onLsoContinue}
					onVerify={onLsoVerify}
					status={
						(lawyer?.lsoVerification?.status ??
							"not_started") as LawyerLsoStatus
					}
				/>
			);
		case "lawyer.review":
			return (
				<LawyerReviewStep
					busy={savingState === "lawyer.pending_admin"}
					lawyer={lawyer}
					onSubmit={onSubmitReview}
				/>
			);
		default:
			return null;
	}
}

function LawyerIntroStep({
	busy,
	onContinue,
}: {
	busy: boolean;
	onContinue: () => void;
}) {
	return (
		<OnboardingIntroCard
			bullets={[
				"Confirm your lawyer profile and LSO credentials",
				"Complete a mock identity verification step",
				"Submit for admin review",
			]}
			busy={busy}
			description="We verify legal professionals before granting access to review ownership transfers and closing documentation. This onboarding takes a few minutes and saves your progress automatically."
			onContinue={onContinue}
			title="Welcome, legal partners"
		/>
	);
}

function LawyerProfileForm({
	defaultValues,
	onSubmit,
	busy,
}: {
	defaultValues?: LawyerProfileValues;
	onSubmit: (values: LawyerProfileValues) => Promise<void>;
	busy: boolean;
}) {
	const form = useForm<LawyerProfileValues>({
		resolver: zodResolver(lawyerProfileSchema),
		defaultValues: defaultValues ?? {
			firstName: "",
			middleName: "",
			lastName: "",
			lsoNumber: "",
			firmName: "",
			email: "",
			phone: "",
			jurisdiction: "ON",
		},
		mode: "onChange",
	});

	useEffect(() => {
		if (defaultValues) {
			form.reset({
				...defaultValues,
				middleName: defaultValues.middleName ?? "",
			});
		}
	}, [defaultValues, form]);

	const handleSubmit = (values: LawyerProfileValues) => {
		onSubmit({
			...values,
			middleName: values.middleName?.trim() || undefined,
		});
	};

	return (
		<OnboardingCard>
			<CardHeader>
				<CardTitle>Lawyer profile</CardTitle>
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
							<div className="grid gap-4 md:grid-cols-2">
								<FormField
									control={form.control}
									name="lsoNumber"
									render={({ field }) => (
										<FormItem className="space-y-2">
											<FormLabel>
												LSO number{" "}
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
									name="firmName"
									render={({ field }) => (
										<FormItem className="space-y-2">
											<FormLabel>
												Firm name{" "}
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
							<div className="grid gap-4 md:grid-cols-2">
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
							</div>
							<FormField
								control={form.control}
								name="jurisdiction"
								render={({ field }) => (
									<FormItem className="space-y-2">
										<FormLabel>
											Jurisdiction{" "}
											<span className="text-muted-foreground text-xs">
												Required
											</span>
										</FormLabel>
										<FormControl>
											<Input {...field} placeholder="Ontario" />
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

function LawyerIdentityVerificationStep({
	status,
	profile,
	extractedName,
	busy,
	onVerify,
	onContinue,
}: {
	status: LawyerIdentityStatus;
	profile?: LawyerProfileValues;
	extractedName?: {
		firstName: string;
		lastName: string;
		middleName?: string;
	};
	busy: boolean;
	onVerify: (simulateMismatch: boolean) => Promise<void>;
	onContinue: () => Promise<void>;
}) {
	const [simulateMismatch, setSimulateMismatch] = useState(false);
	const isVerified = status === "verified";
	const isMismatch = status === "mismatch";

	return (
		<OnboardingCard>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<ShieldCheck className="size-5 text-primary" />
					Mock identity verification
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<p className="text-muted-foreground text-sm">
					This step simulates Persona ID verification. We'll compare the
					extracted name to your profile using strict matching.
				</p>
				<div className="grid gap-3 md:grid-cols-2">
					{profile ? (
						<div className="rounded border border-border/60 bg-muted/40 p-3 text-sm">
							<p className="font-medium">Profile name</p>
							<p>
								{profile.firstName} {profile.middleName ?? ""}{" "}
								{profile.lastName}
							</p>
							<p className="text-muted-foreground text-xs">
								LSO {profile.lsoNumber} · {profile.firmName}
							</p>
						</div>
					) : null}
					{extractedName ? (
						<div className="rounded border border-border/60 bg-muted/40 p-3 text-sm">
							<p className="font-medium">Extracted name</p>
							<p>
								{extractedName.firstName} {extractedName.middleName ?? ""}{" "}
								{extractedName.lastName}
							</p>
							<p className="text-muted-foreground text-xs">Mock scan result</p>
						</div>
					) : null}
				</div>
				<div className="flex items-start gap-2">
					<Checkbox
						checked={simulateMismatch}
						id="simulate-mismatch"
						onCheckedChange={(checked) => setSimulateMismatch(checked === true)}
					/>
					<Label
						className="cursor-pointer font-normal text-sm leading-tight"
						htmlFor="simulate-mismatch"
					>
						Simulate a name mismatch (testing only)
					</Label>
				</div>
				<div className="flex flex-wrap items-center gap-3">
					<Button
						disabled={busy}
						onClick={() => onVerify(simulateMismatch)}
						variant="secondary"
					>
						{busy ? "Checking..." : "Run mock verification"}
					</Button>
					{isVerified ? (
						<Badge className="gap-1" variant="secondary">
							<CheckCircle2 className="size-3" /> Verified
						</Badge>
					) : null}
					{isMismatch ? (
						<Badge className="gap-1" variant="destructive">
							<AlertTriangle className="size-3" /> Name mismatch
						</Badge>
					) : null}
				</div>
				<div className="flex justify-end">
					<Button disabled={!isVerified} onClick={onContinue}>
						Continue to LSO check
						<ArrowRight className="ml-2 size-4" />
					</Button>
				</div>
			</CardContent>
		</OnboardingCard>
	);
}

function LawyerLsoVerificationStep({
	status,
	matchedRecord,
	busy,
	onVerify,
	onContinue,
}: {
	status: LawyerLsoStatus;
	matchedRecord?: {
		lsoNumber: string;
		firstName: string;
		lastName: string;
		firmName?: string;
		jurisdiction?: string;
		status?: string;
	};
	busy: boolean;
	onVerify: () => Promise<void>;
	onContinue: () => Promise<void>;
}) {
	const isVerified = status === "verified";
	const isFailed = status === "failed";

	return (
		<OnboardingCard>
			<CardHeader>
				<CardTitle>LSO registry check</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<p className="text-muted-foreground text-sm">
					We match your LSO number and legal name against the local registry
					dataset.
				</p>
				{matchedRecord ? (
					<div className="rounded border border-border/60 bg-muted/40 p-3 text-sm">
						<p className="font-medium">Registry record</p>
						<p>
							{matchedRecord.firstName} {matchedRecord.lastName} (
							{matchedRecord.lsoNumber})
						</p>
						<p className="text-muted-foreground text-xs">
							{matchedRecord.firmName ?? "Firm not listed"} ·{" "}
							{matchedRecord.status ?? "status unknown"}
						</p>
					</div>
				) : null}
				<div className="flex flex-wrap items-center gap-3">
					<Button disabled={busy} onClick={onVerify} variant="secondary">
						{busy ? "Checking..." : "Run LSO verification"}
					</Button>
					{isVerified ? (
						<Badge className="gap-1" variant="secondary">
							<CheckCircle2 className="size-3" /> Verified
						</Badge>
					) : null}
					{isFailed ? (
						<Badge className="gap-1" variant="destructive">
							<AlertTriangle className="size-3" /> No match
						</Badge>
					) : null}
				</div>
				<div className="flex justify-end">
					<Button disabled={!isVerified} onClick={onContinue}>
						Continue to review
						<ArrowRight className="ml-2 size-4" />
					</Button>
				</div>
			</CardContent>
		</OnboardingCard>
	);
}

function LawyerReviewStep({
	lawyer,
	busy,
	onSubmit,
}: {
	lawyer: NonNullable<JourneyDoc["context"]>["lawyer"];
	busy: boolean;
	onSubmit: () => Promise<void>;
}) {
	const profile = lawyer?.profile;
	const identityStatus = (lawyer?.identityVerification?.status ??
		"not_started") as LawyerIdentityStatus;
	const lsoStatus = (lawyer?.lsoVerification?.status ??
		"not_started") as LawyerLsoStatus;
	const canSubmit = identityStatus === "verified" && lsoStatus === "verified";

	return (
		<OnboardingCard>
			<CardHeader>
				<CardTitle>Review and submit</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{profile ? (
					<div className="rounded border border-border/60 bg-muted/40 p-4">
						<p className="font-medium text-sm">Profile</p>
						<p className="text-muted-foreground text-sm">
							{profile.firstName} {profile.middleName ?? ""} {profile.lastName}
						</p>
						<p className="text-muted-foreground text-sm">
							LSO: {profile.lsoNumber} · {profile.firmName}
						</p>
						<p className="text-muted-foreground text-sm">
							{profile.email} · {profile.phone}
						</p>
					</div>
				) : null}
				<div className="grid gap-3 md:grid-cols-2">
					<div className="rounded border border-border/60 bg-muted/40 p-3 text-sm">
						<p className="font-medium">Identity verification</p>
						<p className="text-muted-foreground text-xs">{identityStatus}</p>
					</div>
					<div className="rounded border border-border/60 bg-muted/40 p-3 text-sm">
						<p className="font-medium">LSO verification</p>
						<p className="text-muted-foreground text-xs">{lsoStatus}</p>
					</div>
				</div>
				<Button disabled={!canSubmit || busy} onClick={onSubmit}>
					{busy ? "Submitting..." : "Submit for review"}
				</Button>
				{canSubmit ? null : (
					<p className="text-muted-foreground text-xs">
						Complete identity and LSO verification before submitting.
					</p>
				)}
			</CardContent>
		</OnboardingCard>
	);
}
