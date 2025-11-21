"use client";

import { useAction, useQuery } from "convex/react";
import { AlertCircle, CheckCircle, Clock, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { DocumensoDocumentEmbed } from "./DocumensoDocumentEmbed";

type DealDocumentsSectionProps = {
	dealId: Id<"deals">;
	investorEmail: string;
};

export function DealDocumentsSection({
	dealId,
	investorEmail,
}: DealDocumentsSectionProps) {
	const documents = useQuery(api.deal_documents.getDealDocuments, { dealId });
	const getSigningToken = useAction(api.documenso.getSigningTokenAction);
	const [selectedDocument, setSelectedDocument] = useState<{
		id: string;
		token: string;
		name: string;
	} | null>(null);

	if (!documents) {
		return <div>Loading documents...</div>;
	}

	if (documents.length === 0) {
		return null;
	}

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "signed":
				return (
					<Badge className="bg-green-500" variant="default">
						<CheckCircle className="mr-1 h-3 w-3" /> Signed
					</Badge>
				);
			case "pending":
				return (
					<Badge variant="secondary">
						<Clock className="mr-1 h-3 w-3" /> Pending
					</Badge>
				);
			case "rejected":
				return (
					<Badge variant="destructive">
						<AlertCircle className="mr-1 h-3 w-3" /> Rejected
					</Badge>
				);
			default:
				return <Badge variant="outline">{status}</Badge>;
		}
	};

	const handleSignClick = async (doc: (typeof documents)[0]) => {
		// Find the recipient token for the investor
		// We need to match by email
		const recipient = doc.signatories.find(
			(s: { email: string }) =>
				s.email.toLowerCase() === investorEmail.toLowerCase()
		);

		if (recipient) {
			try {
				const token = await getSigningToken({
					documentId: doc.documensoDocumentId,
					email: investorEmail,
				});

				setSelectedDocument({
					id: doc.documensoDocumentId,
					token,
					name: doc.templateName,
				});
			} catch (error) {
				console.error("Failed to get signing token:", error);
				toast.error("Failed to load document for signing. Please try again.");
			}
		} else {
			toast.error("You are not listed as a signatory on this document.");
		}
	};

	return (
		<div className="space-y-4">
			<h2 className="font-semibold text-xl">Deal Documents</h2>
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{documents.map((doc) => (
					<Card key={doc._id}>
						<CardHeader className="pb-2">
							<div className="flex items-start justify-between">
								<FileText className="h-8 w-8 text-muted-foreground" />
								{getStatusBadge(doc.status)}
							</div>
							<CardTitle className="text-base">{doc.templateName}</CardTitle>
							<CardDescription className="text-xs">
								Created {new Date(doc.createdAt).toLocaleDateString()}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex flex-col gap-2">
								<div className="text-muted-foreground text-xs">
									Signatories:
									<ul className="mt-1 list-inside list-disc">
										{doc.signatories.map(
											(s: { role: string; name: string; email: string }) => (
												<li key={s.email}>
													{s.name} ({s.role})
												</li>
											)
										)}
									</ul>
								</div>
								{doc.status === "pending" && (
									<Button
										className="mt-2 w-full"
										onClick={() => handleSignClick(doc)}
									>
										Sign Document
									</Button>
								)}
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			<Dialog
				onOpenChange={(open) => !open && setSelectedDocument(null)}
				open={!!selectedDocument}
			>
				<DialogContent className="flex h-[90vh] max-w-4xl flex-col">
					<DialogHeader>
						<DialogTitle>Sign {selectedDocument?.name}</DialogTitle>
					</DialogHeader>
					<div className="flex-1 overflow-hidden">
						{selectedDocument && (
							<DocumensoDocumentEmbed
								email={investorEmail}
								onComplete={() => {
									setSelectedDocument(null);
									// Refresh documents or show success message
								}}
								token={selectedDocument.token}
							/>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
