"use client";

import { useAction } from "convex/react";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DocumensoTemplateAutocomplete } from "@/components/admin/DocumensoTemplateAutocomplete";
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

type AddDocumentDialogProps = {
	dealId: Id<"deals">;
};

type SignatoryConfig = {
	id: number; // Template recipient ID
	role: string;
	name: string;
	email: string;
	signingOrder: number | null;
};

export function AddDocumentDialog({ dealId }: AddDocumentDialogProps) {
	const [open, setOpen] = useState(false);
	const [step, setStep] = useState<"template" | "signatories">("template");
	const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
		null
	);
	const [signatories, setSignatories] = useState<SignatoryConfig[]>([]);
	const [loading, setLoading] = useState(false);

	const getTemplateDetails = useAction(api.documenso.getTemplateDetailsAction);
	const createDocument = useAction(
		api.documenso.createDocumentFromTemplateAction
	);

	const handleTemplateSelect = async (template: {
		id: string;
		name: string;
	}) => {
		setLoading(true);
		try {
			setSelectedTemplateId(template.id);
			const details = await getTemplateDetails({ templateId: template.id });

			// Map template recipients to form state
			const templateRecipients = details.recipients || [];

			setSignatories(
				templateRecipients.map((r) => ({
					id: r.id,
					role: r.role,
					name: "", // User must fill this
					email: "", // User must fill this
					signingOrder: r.signingOrder,
				}))
			);
			setStep("signatories");
		} catch (error) {
			console.error("Failed to load template details:", error);
			toast.error("Failed to load template details", {
				description:
					error instanceof Error
						? error.message
						: "Please try again or select a different template",
			});
			// Reset to clean state on error
			setSelectedTemplateId(null);
			setSignatories([]);
			// Keep step at "template" - don't progress on error
		} finally {
			setLoading(false);
		}
	};

	const handleSignatoryChange = (
		id: number,
		field: "name" | "email",
		value: string
	) => {
		setSignatories((prev) =>
			prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
		);
	};

	const handleSubmit = async () => {
		if (!selectedTemplateId) return;

		// Validate all fields filled
		if (signatories.some((s) => !(s.name && s.email))) {
			toast.error("Please fill in all signatory details");
			return;
		}

		setLoading(true);
		try {
			await createDocument({
				dealId,
				templateId: selectedTemplateId,
				recipients: signatories.map((s) => ({
					id: s.id,
					email: s.email,
					name: s.name,
					role: s.role,
				})),
			});
			toast.success("Document created successfully");
			setOpen(false);
			// Reset state
			setStep("template");
			setSelectedTemplateId(null);
			setSignatories([]);
		} catch (error) {
			console.error("Failed to create document:", error);
			toast.error("Failed to create document", {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog onOpenChange={setOpen} open={open}>
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
					{step === "template" ? (
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
					) : (
						<div className="space-y-6">
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<h4 className="font-medium text-sm">Configure Signatories</h4>
									<Button
										onClick={() => setStep("template")}
										size="sm"
										variant="ghost"
									>
										Change Template
									</Button>
								</div>

								{signatories
									.sort((a, b) => (a.signingOrder || 0) - (b.signingOrder || 0))
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
																e.target.value
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
																e.target.value
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
					{step === "signatories" && (
						<>
							<Button
								disabled={loading}
								onClick={() => setOpen(false)}
								variant="outline"
							>
								Cancel
							</Button>
							<Button disabled={loading} onClick={handleSubmit}>
								{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								Create Document
							</Button>
						</>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
