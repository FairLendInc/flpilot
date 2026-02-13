"use client";

import { useAction } from "convex/react";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DocumensoTemplateAutocomplete } from "@/components/admin/DocumensoTemplateAutocomplete";
import AutoForm from "@/components/ui/auto-form";
import { Button } from "@/components/ui/button";
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
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type {
	DealDataForPrefill,
	ExtractedPlaceholder,
} from "@/lib/documenso-prefill";
import {
	buildPrefillFieldsPayload,
	buildPrefillSchema,
	extractPlaceholders,
	getAutoFillValues,
} from "@/lib/documenso-prefill";
import type { DocumensoRecipientRole } from "@/lib/types/documenso";

type AddDocumentDialogProps = {
	dealId: Id<"deals">;
	dealData?: DealDataForPrefill;
};

type SignatoryConfig = {
	id: number;
	role: DocumensoRecipientRole;
	name: string;
	email: string;
	signingOrder: number | null;
};

export function AddDocumentDialog({
	dealId,
	dealData,
}: AddDocumentDialogProps) {
	const [open, setOpen] = useState(false);
	const [step, setStep] = useState<"template" | "prefill" | "signatories">(
		"template",
	);
	const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
		null,
	);
	const [signatories, setSignatories] = useState<SignatoryConfig[]>([]);
	const [placeholders, setPlaceholders] = useState<ExtractedPlaceholder[]>([]);
	const [prefillValues, setPrefillValues] = useState<Record<string, string>>(
		{},
	);
	const [loading, setLoading] = useState(false);

	const getTemplateDetails = useAction(api.documenso.getTemplateDetailsAction);
	const createDocument = useAction(
		api.documenso.createDocumentFromTemplateAction,
	);

	const DOCUMENSO_ROLES: DocumensoRecipientRole[] = [
		"SIGNER",
		"APPROVER",
		"CC",
		"ASSISTANT",
		"VIEWER",
	];

	const requireDocumensoRole = (role: string | undefined | null) => {
		const candidate = role as DocumensoRecipientRole | undefined;
		if (candidate && DOCUMENSO_ROLES.includes(candidate)) {
			return candidate;
		}
		throw new Error(`Unexpected Documenso role: ${String(role)}`);
	};

	const handleTemplateSelect = async (template: {
		id: string;
		name: string;
	}) => {
		setLoading(true);
		try {
			setSelectedTemplateId(template.id);
			const details = await getTemplateDetails({ templateId: template.id });

			// Map template recipients to form state
			const templateRecipients: Array<{
				id: number;
				role: DocumensoRecipientRole;
				signingOrder?: number | null;
			}> = details.recipients || [];

			setSignatories(
				templateRecipients.map((r) => ({
					id: r.id,
					role: requireDocumensoRole(r.role),
					name: "",
					email: "",
					signingOrder: r.signingOrder ?? null,
				})),
			);

			// Extract placeholder fields from template
			const fields = details.fields || [];
			const extracted = extractPlaceholders(fields);
			setPlaceholders(extracted);

			if (extracted.length > 0) {
				// Auto-fill from deal data where available
				const autoFilled = dealData ? getAutoFillValues(dealData) : {};
				setPrefillValues(autoFilled);
				setStep("prefill");
			} else {
				// No prefillable fields — skip to signatories
				setStep("signatories");
			}
		} catch (error) {
			console.error("Failed to load template details:", error);
			toast.error("Failed to load template details", {
				description:
					error instanceof Error
						? error.message
						: "Please try again or select a different template",
			});
			setSelectedTemplateId(null);
			setSignatories([]);
			setPlaceholders([]);
			setPrefillValues({});
		} finally {
			setLoading(false);
		}
	};

	const handleSignatoryChange = (
		id: number,
		field: "name" | "email",
		value: string,
	) => {
		setSignatories((prev) =>
			prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
		);
	};

	const handleSubmit = async () => {
		if (!selectedTemplateId) return;

		if (signatories.some((s) => !(s.name && s.email))) {
			toast.error("Please fill in all signatory details");
			return;
		}

		setLoading(true);
		try {
			const prefillFieldsPayload = buildPrefillFieldsPayload(
				placeholders,
				prefillValues,
			);

			await createDocument({
				dealId,
				templateId: selectedTemplateId,
				recipients: signatories.map((s) => ({
					id: s.id,
					email: s.email,
					name: s.name,
					role: s.role,
				})),
				prefillFields:
					prefillFieldsPayload.length > 0 ? prefillFieldsPayload : undefined,
			});
			toast.success("Document created successfully");
			setOpen(false);
			resetState();
		} catch (error) {
			console.error("Failed to create document:", error);
			toast.error("Failed to create document", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		} finally {
			setLoading(false);
		}
	};

	const resetState = () => {
		setStep("template");
		setSelectedTemplateId(null);
		setSignatories([]);
		setPlaceholders([]);
		setPrefillValues({});
	};

	return (
		<Dialog
			onOpenChange={(isOpen) => {
				setOpen(isOpen);
				if (!isOpen) resetState();
			}}
			open={open}
		>
			<DialogTrigger asChild>
				<Button size="sm" variant="outline">
					<Plus className="mr-2 h-4 w-4" />
					Add Document
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>Add Document</DialogTitle>
					<DialogDescription>
						Create a new document draft from a template.
					</DialogDescription>
				</DialogHeader>

				<div className="py-4">
					{step === "template" && (
						<div className="space-y-4">
							<Label>Select Template</Label>
							<DocumensoTemplateAutocomplete
								className="w-full"
								onSelect={handleTemplateSelect}
							/>
							{loading && (
								<div className="flex items-center justify-center py-4">
									<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
								</div>
							)}
						</div>
					)}

					{step === "prefill" && (
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<h4 className="font-medium text-sm">
									Pre-fill Document Fields
								</h4>
								<Button
									onClick={() => {
										resetState();
									}}
									size="sm"
									variant="ghost"
								>
									Change Template
								</Button>
							</div>
							<p className="text-muted-foreground text-sm">
								These values will be pre-filled in the document. You can edit
								them before proceeding.
							</p>
							<AutoForm
								formSchema={buildPrefillSchema(placeholders)}
								onValuesChange={(values) =>
									setPrefillValues(values as Record<string, string>)
								}
								values={prefillValues}
							/>
						</div>
					)}

					{step === "signatories" && (
						<div className="space-y-6">
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<h4 className="font-medium text-sm">
										Configure Signatories
									</h4>
									<Button
										onClick={() => resetState()}
										size="sm"
										variant="ghost"
									>
										Change Template
									</Button>
								</div>

								{signatories
									.sort(
										(a, b) =>
											(a.signingOrder || 0) - (b.signingOrder || 0),
									)
									.map((signer) => (
										<div
											className="space-y-3 rounded-lg border p-4"
											key={signer.id}
										>
											<div className="mb-2 flex items-center justify-between">
												<div className="flex items-center gap-2">
													<span className="font-medium text-sm">
														{signer.role}
													</span>
													{signer.signingOrder && (
														<span className="rounded bg-muted px-2 py-0.5 text-muted-foreground text-xs">
															Order: {signer.signingOrder}
														</span>
													)}
												</div>
											</div>
											<div className="grid grid-cols-2 gap-4">
												<div className="space-y-2">
													<Label htmlFor={`name-${signer.id}`}>Name</Label>
													<Input
														id={`name-${signer.id}`}
														onChange={(e) =>
															handleSignatoryChange(
																signer.id,
																"name",
																e.target.value,
															)
														}
														placeholder="Signer Name"
														value={signer.name}
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor={`email-${signer.id}`}>Email</Label>
													<Input
														id={`email-${signer.id}`}
														onChange={(e) =>
															handleSignatoryChange(
																signer.id,
																"email",
																e.target.value,
															)
														}
														placeholder="signer@example.com"
														type="email"
														value={signer.email}
													/>
												</div>
											</div>
										</div>
									))}
							</div>
						</div>
					)}
				</div>

				<DialogFooter>
					{step === "prefill" && (
						<>
							<Button
								onClick={() => setStep("signatories")}
								size="sm"
								variant="ghost"
							>
								Skip
							</Button>
							<Button onClick={() => setStep("signatories")}>
								Continue to Signatories
							</Button>
						</>
					)}
					{step === "signatories" && (
						<>
							<Button
								disabled={loading}
								onClick={() =>
									placeholders.length > 0
										? setStep("prefill")
										: setOpen(false)
								}
								variant="outline"
							>
								{placeholders.length > 0 ? "Back" : "Cancel"}
							</Button>
							<Button disabled={loading} onClick={handleSubmit}>
								{loading && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								Create Document
							</Button>
						</>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
