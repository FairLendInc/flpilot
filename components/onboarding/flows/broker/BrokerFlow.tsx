import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Clock, FileText, Upload, XCircle } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { Id } from "@/convex/_generated/dataModel";
import type { JourneyDoc, OnboardingStateValue } from "../../machine";
import { OnboardingCard } from "../../shared/OnboardingCard";
import { OnboardingIntroCard } from "../../shared/OnboardingIntroCard";

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

export const BROKER_STEPS: {
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

export type BrokerCompanyInfoValues = {
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

export type BrokerLicensingValues = {
	licenseType: (typeof BROKER_LICENSE_TYPES)[number];
	licenseNumber: string;
	issuer: string;
	issuedDate: string;
	expiryDate: string;
	jurisdictions: string[];
};

export type BrokerRepresentativeValues = {
	firstName: string;
	lastName: string;
	role: string;
	email: string;
	phone: string;
	hasAuthority: boolean;
};

export type BrokerDocument = {
	storageId: Id<"_storage">;
	label: string;
	type: string;
	uploadedAt: string;
};

export type BrokerFlowRouterProps = {
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

export function BrokerFlowRouter({
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
		<OnboardingIntroCard
			bullets={[
				"Tell us about your brokerage business",
				"Provide licensing details and jurisdictions",
				"List representatives and upload required documents",
				"Choose a branded subdomain for your portal",
			]}
			busy={busy}
			description="We review every broker application to ensure compliance and quality. This only takes a few minutes and your answers save automatically."
			onContinue={onContinue}
			title="Welcome to the Broker Portal"
		/>
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

	return (
		<OnboardingCard>
			<CardHeader>
				<CardTitle>Company information</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				<Form {...form}>
					<form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
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
		</OnboardingCard>
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

	return (
		<OnboardingCard>
			<CardHeader>
				<CardTitle>Licensing information</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				<Form {...form}>
					<form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
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
														{jurisdictions.map((jurisdiction) => (
															<Badge
																className="cursor-pointer"
																key={jurisdiction}
																onClick={() =>
																	handleRemoveJurisdiction(
																		jurisdictions.indexOf(jurisdiction)
																	)
																}
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
		</OnboardingCard>
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
		<OnboardingCard>
			<CardHeader>
				<CardTitle>Team representatives</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				<p className="text-muted-foreground text-sm">
					Add the team members who will work with your clients. You can skip
					this for now and add representatives later.
				</p>

				{representatives.length > 0 ? (
					<div className="space-y-3">
						<p className="font-medium text-sm">Added representatives</p>
						{representatives.map((rep, index) => (
							<div
								className="flex items-start justify-between rounded border border-border/60 bg-muted/40 p-3"
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
									{rep.hasAuthority ? (
										<Badge className="mt-1" variant="outline">
											Authorized signer
										</Badge>
									) : null}
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
				) : null}

				<Form {...form}>
					<form
						className="rounded border border-border/60 bg-card/50 p-4"
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
		</OnboardingCard>
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
		<OnboardingCard>
			<CardHeader>
				<CardTitle>Required documents</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<p className="text-muted-foreground text-sm">
					Upload the minimum required documents (license or insurance).
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
								className="flex items-center justify-between rounded border border-border/60 bg-muted/40 px-3 py-2"
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
		</OnboardingCard>
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
		<OnboardingCard>
			<CardHeader>
				<CardTitle>Review and submit</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid gap-4 md:grid-cols-2">
					<div className="rounded border border-border/60 bg-muted/30 p-4">
						<p className="font-medium text-sm">Company</p>
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
					<div className="rounded border border-border/60 bg-muted/30 p-4">
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

				<div className="rounded border border-border/60 bg-muted/30 p-4">
					<p className="font-medium text-sm">
						Representatives ({representatives.length})
					</p>
					<ul className="list-disc pl-5 text-muted-foreground text-sm">
						{representatives.slice(0, 3).map((rep) => (
							<li key={rep.email || `${rep.firstName}-${rep.lastName}`}>
								{rep.firstName} {rep.lastName} - {rep.role}
							</li>
						))}
						{representatives.length > 3 ? (
							<li>+{representatives.length - 3} more</li>
						) : null}
					</ul>
				</div>

				<div className="rounded border border-border/60 bg-muted/30 p-4">
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
		</OnboardingCard>
	);
}

function BrokerPendingAdminStep({
	broker,
}: {
	broker: NonNullable<JourneyDoc["context"]>["broker"] | undefined;
}) {
	const companyName = broker?.companyInfo?.companyName || "your company";

	return (
		<OnboardingCard className="border-primary/20">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Clock className="size-5 text-primary" />
					Your application is under review
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<p className="text-muted-foreground">
					Thank you for submitting your broker application for{" "}
					<strong>{companyName}</strong>. Our team is reviewing it, and we will
					notify you once a decision has been made.
				</p>
				<div className="rounded bg-muted/50 p-4">
					<h4 className="font-medium text-sm">What happens next?</h4>
					<ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground text-sm">
						<li>We review your company information and licensing</li>
						<li>We verify your credentials and references</li>
						<li>We check your proposed subdomain availability</li>
						<li>We may reach out with questions or document requests</li>
						<li>You will receive an email notification with our decision</li>
					</ul>
				</div>
				{broker?.proposedSubdomain ? (
					<div className="rounded border border-border/60 bg-muted/40 p-3">
						<p className="text-muted-foreground text-sm">
							<strong>Your proposed subdomain:</strong>{" "}
							{broker.proposedSubdomain}.flpilot.com
						</p>
					</div>
				) : null}
			</CardContent>
		</OnboardingCard>
	);
}

function BrokerRejectedStep({
	broker: _broker,
}: {
	broker: NonNullable<JourneyDoc["context"]>["broker"] | undefined;
}) {
	return (
		<OnboardingCard className="border-destructive/60">
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-destructive">
					<XCircle className="size-5" />
					Application not approved
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<p className="text-muted-foreground">
					Unfortunately, your broker application was not approved at this time.
					If you believe this decision was made in error, please contact our
					support team.
				</p>
			</CardContent>
		</OnboardingCard>
	);
}
