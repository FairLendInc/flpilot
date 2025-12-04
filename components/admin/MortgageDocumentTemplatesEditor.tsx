"use client";

import { useMutation } from "convex/react";
import { FileText, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { DocumensoTemplateAutocomplete } from "./DocumensoTemplateAutocomplete";

type TemplateConfig = {
	documensoTemplateId: string;
	name: string;
	signatoryRoles: string[];
};

type MortgageDocumentTemplatesEditorProps = {
	mortgageId: Id<"mortgages">;
	templates: TemplateConfig[];
};

export function MortgageDocumentTemplatesEditor({
	mortgageId,
	templates = [],
}: MortgageDocumentTemplatesEditorProps) {
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [newTemplate, setNewTemplate] = useState<Partial<TemplateConfig>>({
		signatoryRoles: ["Broker", "Investor"], // Default roles
	});

	const updateTemplates = useMutation(api.mortgages.updateMortgageTemplates);

	const handleAddTemplate = async () => {
		if (!(newTemplate.documensoTemplateId && newTemplate.name)) {
			toast.warning("Please select a template and provide a name.");
			return;
		}

		try {
			const updatedTemplates = [
				...templates,
				{
					documensoTemplateId: newTemplate.documensoTemplateId,
					name: newTemplate.name,
					signatoryRoles: newTemplate.signatoryRoles || ["Broker", "Investor"],
				},
			];

			await updateTemplates({
				mortgageId,
				templates: updatedTemplates,
			});

			setIsAddDialogOpen(false);
			setNewTemplate({ signatoryRoles: ["Broker", "Investor"] });
		} catch (error) {
			console.error("Failed to add template:", error);
			toast.error("Failed to add template. Please try again.");
		}
	};

	const handleRemoveTemplate = async (index: number) => {
		try {
			const updatedTemplates = [...templates];
			updatedTemplates.splice(index, 1);

			await updateTemplates({
				mortgageId,
				templates: updatedTemplates,
			});
		} catch (error) {
			console.error("Failed to remove template:", error);
			toast.error("Failed to remove template. Please try again.");
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="font-medium text-lg">Document Templates</h3>
				<Dialog onOpenChange={setIsAddDialogOpen} open={isAddDialogOpen}>
					<DialogTrigger asChild>
						<Button size="sm">
							<Plus className="mr-2 h-4 w-4" />
							Add Template
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Add Document Template</DialogTitle>
							<DialogDescription>
								Associate a Documenso template with this mortgage. Documents
								will be generated automatically when a deal is created.
							</DialogDescription>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="grid gap-2">
								<Label htmlFor="template">Documenso Template</Label>
								<DocumensoTemplateAutocomplete
									onSelect={(template) =>
										setNewTemplate({
											...newTemplate,
											documensoTemplateId: template.id,
											name: newTemplate.name || template.name, // Auto-fill name if empty
											signatoryRoles: template.recipients.map((r) => r.role),
										})
									}
									value={newTemplate.documensoTemplateId}
								/>
								{newTemplate.signatoryRoles &&
									newTemplate.signatoryRoles.length > 0 && (
										<p className="text-muted-foreground text-xs">
											Roles from template:{" "}
											{newTemplate.signatoryRoles.join(", ")}
										</p>
									)}
							</div>
							<div className="grid gap-2">
								<Label htmlFor="name">Display Name</Label>
								<Input
									id="name"
									onChange={(e) =>
										setNewTemplate({ ...newTemplate, name: e.target.value })
									}
									placeholder="e.g. Purchase Agreement"
									value={newTemplate.name || ""}
								/>
							</div>
						</div>
						<DialogFooter>
							<Button
								onClick={() => setIsAddDialogOpen(false)}
								variant="outline"
							>
								Cancel
							</Button>
							<Button onClick={handleAddTemplate}>Add Template</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			{templates.length === 0 ? (
				<div className="fade-in-50 flex animate-in flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
					<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
						<FileText className="h-6 w-6 text-muted-foreground" />
					</div>
					<h3 className="mt-4 font-semibold text-lg">
						No templates configured
					</h3>
					<p className="mt-2 mb-4 text-muted-foreground text-sm">
						Add templates to automatically generate documents for deals.
					</p>
					<Button onClick={() => setIsAddDialogOpen(true)} variant="outline">
						<Plus className="mr-2 h-4 w-4" />
						Add Template
					</Button>
				</div>
			) : (
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Display Name</TableHead>
								<TableHead>Template ID</TableHead>
								<TableHead>Roles</TableHead>
								<TableHead className="w-[100px]">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{templates.map((template, index) => (
								<TableRow key={`${template.documensoTemplateId}-${index}`}>
									<TableCell className="font-medium">{template.name}</TableCell>
									<TableCell className="font-mono text-muted-foreground text-xs">
										{template.documensoTemplateId}
									</TableCell>
									<TableCell>
										<div className="flex flex-wrap gap-1">
											{template.signatoryRoles.map((role) => (
												<span
													className="inline-flex items-center rounded-full border border-transparent bg-secondary px-2.5 py-0.5 font-semibold text-secondary-foreground text-xs transition-colors hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
													key={role}
												>
													{role}
												</span>
											))}
										</div>
									</TableCell>
									<TableCell>
										<Button
											className="h-8 w-8 text-destructive hover:text-destructive"
											onClick={() => handleRemoveTemplate(index)}
											size="icon"
											variant="ghost"
										>
											<Trash2 className="h-4 w-4" />
											<span className="sr-only">Remove</span>
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	);
}
