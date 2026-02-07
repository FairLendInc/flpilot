/**
 * Borrower Onboarding Flow
 *
 * Multi-step onboarding for borrowers with profile, verification stubs,
 * Rotessa payment setup, and review steps.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Building2, CheckCircle, Clock } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Form,
	FormControl,
	FormDescription,
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
import type { OnboardingStateValue } from "../../machine";
import { OnboardingCard } from "../../shared/OnboardingCard";
import { OnboardingIntroCard } from "../../shared/OnboardingIntroCard";

// ============================================================================
// Constants
// ============================================================================

// Bank field validation regexes (top-level for performance)
const INSTITUTION_NUMBER_REGEX = /^\d{3}$/;
const TRANSIT_NUMBER_REGEX = /^\d{5}$/;
const ACCOUNT_NUMBER_REGEX = /^\d{5,12}$/;

// ============================================================================
// Types
// ============================================================================

export const BORROWER_STEPS: {
	id: OnboardingStateValue;
	label: string;
	description: string;
}[] = [
	{
		id: "borrower.intro",
		label: "Welcome",
		description: "Learn how borrower onboarding works",
	},
	{
		id: "borrower.profile",
		label: "Your Information",
		description: "Tell us about yourself",
	},
	{
		id: "borrower.identity_verification",
		label: "Identity Verification",
		description: "Verify your identity",
	},
	{
		id: "borrower.kyc_aml",
		label: "Verification",
		description: "KYC/AML compliance check",
	},
	{
		id: "borrower.rotessa_setup",
		label: "Payment Setup",
		description: "Set up automatic payment collection",
	},
	{
		id: "borrower.review",
		label: "Review",
		description: "Confirm and submit",
	},
];

const PROVINCES = [
	"AB",
	"BC",
	"MB",
	"NB",
	"NL",
	"NS",
	"NT",
	"NU",
	"ON",
	"PE",
	"QC",
	"SK",
	"YT",
] as const;

const ACCOUNT_TYPES = ["checking", "savings"] as const;

// Canadian postal code regex
const postalCodeRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;

// ============================================================================
// Form Schemas
// ============================================================================

const borrowerProfileSchema = z.object({
	firstName: z.string().min(1, "First name is required"),
	middleName: z.string().optional().or(z.literal("")),
	lastName: z.string().min(1, "Last name is required"),
	email: z.string().min(1, "Email is required").email("Invalid email format"),
	phone: z.string().optional().or(z.literal("")),
	street: z.string().optional().or(z.literal("")),
	city: z.string().optional().or(z.literal("")),
	province: z.string().optional().or(z.literal("")),
	postalCode: z
		.string()
		.optional()
		.or(z.literal(""))
		.refine(
			(val) => !val || postalCodeRegex.test(val),
			"Invalid Canadian postal code format"
		),
});

const borrowerRotessaSchema = z.object({
	createNew: z.boolean(),
	existingCustomerId: z.string().optional().or(z.literal("")),
	institutionNumber: z
		.string()
		.optional()
		.or(z.literal(""))
		.refine(
			(val) => !val || INSTITUTION_NUMBER_REGEX.test(val),
			"Must be 3 digits"
		),
	transitNumber: z
		.string()
		.optional()
		.or(z.literal(""))
		.refine(
			(val) => !val || TRANSIT_NUMBER_REGEX.test(val),
			"Must be 5 digits"
		),
	accountNumber: z
		.string()
		.optional()
		.or(z.literal(""))
		.refine(
			(val) => !val || ACCOUNT_NUMBER_REGEX.test(val),
			"Must be 5-12 digits"
		),
	accountType: z.enum(ACCOUNT_TYPES).optional(),
});

const borrowerReviewSchema = z.object({
	confirmed: z.boolean().refine((val) => val === true, {
		message: "Please confirm your information is correct",
	}),
	finalNotes: z.string().optional().or(z.literal("")),
});

// ============================================================================
// Value Types
// ============================================================================

export type BorrowerProfileValues = z.infer<typeof borrowerProfileSchema>;
export type BorrowerRotessaValues = z.infer<typeof borrowerRotessaSchema>;
export type BorrowerReviewValues = z.infer<typeof borrowerReviewSchema>;

export type BorrowerContextData = {
	profile?: {
		firstName: string;
		lastName: string;
		middleName?: string;
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
	idVerification?: {
		status: "not_started" | "pending" | "verified" | "failed" | "skipped";
		provider?: string;
	};
	kycAml?: {
		status:
			| "not_started"
			| "pending"
			| "passed"
			| "failed"
			| "requires_review"
			| "skipped";
		provider?: string;
	};
	rotessa?: {
		status:
			| "not_started"
			| "pending"
			| "linked"
			| "created"
			| "active"
			| "failed";
		customerId?: number;
		customIdentifier?: string;
		bankInfo?: {
			institutionNumber: string;
			transitNumber: string;
			accountNumber: string;
			accountType: "checking" | "savings";
		};
	};
};

// ============================================================================
// Router Props
// ============================================================================

export type BorrowerFlowRouterProps = {
	currentState: OnboardingStateValue;
	borrower: BorrowerContextData | undefined;
	savingState: OnboardingStateValue | null;
	onIntroContinue: () => Promise<void>;
	onProfileSubmit: (values: BorrowerProfileValues) => Promise<void>;
	onIdentitySkip: () => Promise<void>;
	onKycSkip: () => Promise<void>;
	onRotessaSubmit: (values: BorrowerRotessaValues) => Promise<void>;
	onReviewSubmit: (values: BorrowerReviewValues) => Promise<void>;
};

// ============================================================================
// Main Router Component
// ============================================================================

export function BorrowerFlowRouter({
	currentState,
	borrower,
	savingState,
	onIntroContinue,
	onProfileSubmit,
	onIdentitySkip,
	onKycSkip,
	onRotessaSubmit,
	onReviewSubmit,
}: BorrowerFlowRouterProps) {
	switch (currentState) {
		case "borrower.intro":
			return (
				<BorrowerIntroStep
					busy={savingState === "borrower.profile"}
					onContinue={onIntroContinue}
				/>
			);
		case "borrower.profile":
			return (
				<BorrowerProfileForm
					busy={savingState === "borrower.identity_verification"}
					defaultValues={borrower?.profile}
					onSubmit={onProfileSubmit}
				/>
			);
		case "borrower.identity_verification":
			return (
				<BorrowerIdentityStep
					busy={savingState === "borrower.kyc_aml"}
					onSkip={onIdentitySkip}
					status={borrower?.idVerification?.status ?? "not_started"}
				/>
			);
		case "borrower.kyc_aml":
			return (
				<BorrowerKycStep
					busy={savingState === "borrower.rotessa_setup"}
					onSkip={onKycSkip}
					status={borrower?.kycAml?.status ?? "not_started"}
				/>
			);
		case "borrower.rotessa_setup":
			return (
				<BorrowerRotessaForm
					busy={savingState === "borrower.review"}
					defaultValues={borrower?.rotessa}
					onSubmit={onRotessaSubmit}
				/>
			);
		case "borrower.review":
			return (
				<BorrowerReviewStep
					borrower={borrower}
					busy={savingState === "pendingAdmin"}
					onSubmit={onReviewSubmit}
				/>
			);
		default:
			return null;
	}
}

// ============================================================================
// Step Components
// ============================================================================

function BorrowerIntroStep({
	busy,
	onContinue,
}: {
	busy: boolean;
	onContinue: () => Promise<void>;
}) {
	return (
		<OnboardingIntroCard
			bullets={[
				"Tell us about yourself so we can set up your account",
				"Set up automatic payment collection via Rotessa",
				"Review and submit for admin approval",
			]}
			busy={busy}
			description="Complete your borrower profile to access your loan details, view payment schedules, and manage your account. This only takes a few minutes."
			onContinue={onContinue}
			title="Welcome to FairLend"
		/>
	);
}

function BorrowerProfileForm({
	defaultValues,
	onSubmit,
	busy,
}: {
	defaultValues?: BorrowerContextData["profile"];
	onSubmit: (values: BorrowerProfileValues) => Promise<void>;
	busy: boolean;
}) {
	const form = useForm<BorrowerProfileValues>({
		resolver: zodResolver(borrowerProfileSchema),
		defaultValues: {
			firstName: defaultValues?.firstName ?? "",
			middleName: defaultValues?.middleName ?? "",
			lastName: defaultValues?.lastName ?? "",
			email: defaultValues?.email ?? "",
			phone: defaultValues?.phone ?? "",
			street: defaultValues?.address?.street ?? "",
			city: defaultValues?.address?.city ?? "",
			province: defaultValues?.address?.province ?? "",
			postalCode: defaultValues?.address?.postalCode ?? "",
		},
		mode: "onChange",
	});

	useEffect(() => {
		if (defaultValues) {
			form.reset({
				firstName: defaultValues.firstName ?? "",
				middleName: defaultValues.middleName ?? "",
				lastName: defaultValues.lastName ?? "",
				email: defaultValues.email ?? "",
				phone: defaultValues.phone ?? "",
				street: defaultValues.address?.street ?? "",
				city: defaultValues.address?.city ?? "",
				province: defaultValues.address?.province ?? "",
				postalCode: defaultValues.address?.postalCode ?? "",
			});
		}
	}, [defaultValues, form]);

	return (
		<OnboardingCard>
			<CardHeader>
				<CardTitle>Your Information</CardTitle>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
						<div className="grid gap-4">
							<div className="grid gap-4 md:grid-cols-3">
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
									name="middleName"
									render={({ field }) => (
										<FormItem className="space-y-2">
											<FormLabel>Middle name</FormLabel>
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
											<FormLabel>Phone</FormLabel>
											<FormControl>
												<Input
													{...field}
													type="tel"
													value={field.value ?? ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className="pt-4">
								<h4 className="mb-4 font-medium text-sm">Address (Optional)</h4>
								<div className="grid gap-4">
									<FormField
										control={form.control}
										name="street"
										render={({ field }) => (
											<FormItem className="space-y-2">
												<FormLabel>Street address</FormLabel>
												<FormControl>
													<Input {...field} value={field.value ?? ""} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<div className="grid gap-4 md:grid-cols-3">
										<FormField
											control={form.control}
											name="city"
											render={({ field }) => (
												<FormItem className="space-y-2">
													<FormLabel>City</FormLabel>
													<FormControl>
														<Input {...field} value={field.value ?? ""} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="province"
											render={({ field }) => (
												<FormItem className="space-y-2">
													<FormLabel>Province</FormLabel>
													<Select
														onValueChange={field.onChange}
														value={field.value ?? ""}
													>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Select" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{PROVINCES.map((province) => (
																<SelectItem key={province} value={province}>
																	{province}
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
											name="postalCode"
											render={({ field }) => (
												<FormItem className="space-y-2">
													<FormLabel>Postal code</FormLabel>
													<FormControl>
														<Input
															{...field}
															placeholder="A1A 1A1"
															value={field.value ?? ""}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
								</div>
							</div>
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

function BorrowerIdentityStep({
	busy,
	status: _status,
	onSkip,
}: {
	busy: boolean;
	status: string;
	onSkip: () => Promise<void>;
}) {
	return (
		<OnboardingCard>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					Identity Verification
					<Badge className="ml-2" variant="outline">
						Coming Soon
					</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="rounded-lg bg-muted/50 p-4">
					<div className="flex items-center gap-3">
						<Clock className="size-5 text-muted-foreground" />
						<div>
							<p className="font-medium text-sm">
								Identity verification integration in progress
							</p>
							<p className="text-muted-foreground text-sm">
								We're integrating secure identity verification. For now, you can
								continue to the next step.
							</p>
						</div>
					</div>
				</div>
				<div className="flex justify-end">
					<Button disabled={busy} onClick={onSkip}>
						{busy ? "Saving..." : "Continue"}
						<ArrowRight className="ml-2 size-4" />
					</Button>
				</div>
			</CardContent>
		</OnboardingCard>
	);
}

function BorrowerKycStep({
	busy,
	status: _status,
	onSkip,
}: {
	busy: boolean;
	status: string;
	onSkip: () => Promise<void>;
}) {
	return (
		<OnboardingCard>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					KYC/AML Verification
					<Badge className="ml-2" variant="outline">
						Coming Soon
					</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="rounded-lg bg-muted/50 p-4">
					<div className="flex items-center gap-3">
						<Clock className="size-5 text-muted-foreground" />
						<div>
							<p className="font-medium text-sm">
								KYC/AML compliance check integration in progress
							</p>
							<p className="text-muted-foreground text-sm">
								We're integrating compliance verification. For now, you can
								continue to the next step.
							</p>
						</div>
					</div>
				</div>
				<div className="flex justify-end">
					<Button disabled={busy} onClick={onSkip}>
						{busy ? "Saving..." : "Continue"}
						<ArrowRight className="ml-2 size-4" />
					</Button>
				</div>
			</CardContent>
		</OnboardingCard>
	);
}

function BorrowerRotessaForm({
	defaultValues,
	onSubmit,
	busy,
}: {
	defaultValues?: BorrowerContextData["rotessa"];
	onSubmit: (values: BorrowerRotessaValues) => Promise<void>;
	busy: boolean;
}) {
	const form = useForm<BorrowerRotessaValues>({
		resolver: zodResolver(borrowerRotessaSchema),
		defaultValues: {
			createNew: true,
			existingCustomerId: "",
			institutionNumber: defaultValues?.bankInfo?.institutionNumber ?? "",
			transitNumber: defaultValues?.bankInfo?.transitNumber ?? "",
			accountNumber: defaultValues?.bankInfo?.accountNumber ?? "",
			accountType: defaultValues?.bankInfo?.accountType ?? "checking",
		},
		mode: "onChange",
	});

	const createNew = form.watch("createNew");

	return (
		<OnboardingCard>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Building2 className="size-5" />
					Payment Setup
				</CardTitle>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
						<div className="rounded-lg bg-muted/50 p-4">
							<p className="text-muted-foreground text-sm">
								Set up automatic payment collection through Rotessa. Your
								payments will be automatically debited from your bank account on
								the scheduled dates.
							</p>
						</div>

						<FormField
							control={form.control}
							name="createNew"
							render={({ field }) => (
								<FormItem className="flex flex-row items-start space-x-3 space-y-0">
									<FormControl>
										<Checkbox
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
									<div className="space-y-1 leading-none">
										<FormLabel>Create new Rotessa customer</FormLabel>
										<FormDescription>
											Uncheck if you have an existing Rotessa customer ID to
											link
										</FormDescription>
									</div>
								</FormItem>
							)}
						/>

						{!createNew && (
							<FormField
								control={form.control}
								name="existingCustomerId"
								render={({ field }) => (
									<FormItem className="space-y-2">
										<FormLabel>
											Existing Customer ID{" "}
											<span className="text-muted-foreground text-xs">
												Required
											</span>
										</FormLabel>
										<FormControl>
											<Input
												{...field}
												placeholder="12345"
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						{createNew && (
							<div className="space-y-4">
								<h4 className="font-medium text-sm">
									Bank Account Information
								</h4>
								<div className="grid gap-4 md:grid-cols-3">
									<FormField
										control={form.control}
										name="institutionNumber"
										render={({ field }) => (
											<FormItem className="space-y-2">
												<FormLabel>
													Institution #{" "}
													<span className="text-muted-foreground text-xs">
														3 digits
													</span>
												</FormLabel>
												<FormControl>
													<Input
														{...field}
														maxLength={3}
														placeholder="001"
														value={field.value ?? ""}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="transitNumber"
										render={({ field }) => (
											<FormItem className="space-y-2">
												<FormLabel>
													Transit #{" "}
													<span className="text-muted-foreground text-xs">
														5 digits
													</span>
												</FormLabel>
												<FormControl>
													<Input
														{...field}
														maxLength={5}
														placeholder="12345"
														value={field.value ?? ""}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="accountNumber"
										render={({ field }) => (
											<FormItem className="space-y-2">
												<FormLabel>
													Account #{" "}
													<span className="text-muted-foreground text-xs">
														5-12 digits
													</span>
												</FormLabel>
												<FormControl>
													<Input
														{...field}
														maxLength={12}
														placeholder="1234567890"
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
									name="accountType"
									render={({ field }) => (
										<FormItem className="space-y-2">
											<FormLabel>Account Type</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value ?? "checking"}
											>
												<FormControl>
													<SelectTrigger className="w-48">
														<SelectValue />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="checking">Checking</SelectItem>
													<SelectItem value="savings">Savings</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						)}

						<div className="flex justify-end">
							<Button disabled={busy} type="submit">
								{busy ? "Setting up..." : "Continue"}
								<ArrowRight className="ml-2 size-4" />
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</OnboardingCard>
	);
}

function BorrowerReviewStep({
	borrower,
	busy,
	onSubmit,
}: {
	borrower: BorrowerContextData | undefined;
	busy: boolean;
	onSubmit: (values: BorrowerReviewValues) => Promise<void>;
}) {
	const form = useForm<BorrowerReviewValues>({
		resolver: zodResolver(borrowerReviewSchema),
		defaultValues: {
			confirmed: false,
			finalNotes: "",
		},
		mode: "onChange",
	});

	const profile = borrower?.profile;
	const rotessa = borrower?.rotessa;

	return (
		<OnboardingCard>
			<CardHeader>
				<CardTitle>Review and Submit</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="grid gap-4 md:grid-cols-2">
					<div className="rounded border p-4">
						<div className="mb-2 flex items-center gap-2">
							<CheckCircle className="size-4 text-green-500" />
							<p className="font-medium text-sm">Profile</p>
						</div>
						<p className="text-muted-foreground text-sm">
							{profile?.firstName}{" "}
							{profile?.middleName ? `${profile.middleName} ` : ""}
							{profile?.lastName}
						</p>
						<p className="text-muted-foreground text-sm">{profile?.email}</p>
						{profile?.phone && (
							<p className="text-muted-foreground text-sm">{profile.phone}</p>
						)}
						{profile?.address && (
							<p className="mt-1 text-muted-foreground text-sm">
								{profile.address.street}, {profile.address.city},{" "}
								{profile.address.province} {profile.address.postalCode}
							</p>
						)}
					</div>

					<div className="rounded border p-4">
						<div className="mb-2 flex items-center gap-2">
							{rotessa?.status === "active" ||
							rotessa?.status === "created" ||
							rotessa?.status === "linked" ? (
								<CheckCircle className="size-4 text-green-500" />
							) : (
								<Clock className="size-4 text-amber-500" />
							)}
							<p className="font-medium text-sm">Payment Setup</p>
						</div>
						{rotessa?.customerId ? (
							<p className="text-muted-foreground text-sm">
								Rotessa Customer ID: {rotessa.customerId}
							</p>
						) : rotessa?.bankInfo ? (
							<p className="text-muted-foreground text-sm">
								Bank: {rotessa.bankInfo.institutionNumber}-
								{rotessa.bankInfo.transitNumber}
								<br />
								Account: ****{rotessa.bankInfo.accountNumber.slice(-4)}
							</p>
						) : (
							<p className="text-muted-foreground text-sm">Pending setup</p>
						)}
					</div>
				</div>

				<div className="grid gap-4 md:grid-cols-2">
					<div className="rounded border p-4">
						<div className="mb-2 flex items-center gap-2">
							<Badge variant="outline">Skipped</Badge>
							<p className="font-medium text-sm">Identity Verification</p>
						</div>
						<p className="text-muted-foreground text-sm">
							Will be required when available
						</p>
					</div>

					<div className="rounded border p-4">
						<div className="mb-2 flex items-center gap-2">
							<Badge variant="outline">Skipped</Badge>
							<p className="font-medium text-sm">KYC/AML</p>
						</div>
						<p className="text-muted-foreground text-sm">
							Will be required when available
						</p>
					</div>
				</div>

				<Form {...form}>
					<form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
						<FormField
							control={form.control}
							name="confirmed"
							render={({ field }) => (
								<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
									<FormControl>
										<Checkbox
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
									<div className="space-y-1 leading-none">
										<FormLabel>
											I confirm that all information provided is accurate and
											complete
										</FormLabel>
										<FormDescription>
											Your profile will be submitted for admin review
										</FormDescription>
									</div>
								</FormItem>
							)}
						/>
						<FormMessage />

						<div className="flex justify-end">
							<Button disabled={!form.formState.isValid || busy} type="submit">
								{busy ? "Submitting..." : "Submit for Review"}
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</OnboardingCard>
	);
}
