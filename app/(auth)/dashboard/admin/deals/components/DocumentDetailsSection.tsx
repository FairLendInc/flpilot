"use client";

import { FileText, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useAuthenticatedQuery } from "@/convex/lib/client";

type DealDocument =
	(typeof api.deal_documents.getDealDocuments._returnType)[number];
type DealDocumentSigner = DealDocument["signatories"][number];

import type { DealDataForPrefill } from "@/lib/documenso-prefill";
import { AddDocumentDialog } from "./AddDocumentDialog";

type DocumentDetailsSectionProps = {
	dealId: Id<"deals">;
	dealData?: DealDataForPrefill;
};

export function DocumentDetailsSection({
	dealId,
	dealData,
}: DocumentDetailsSectionProps) {
	const documents = useAuthenticatedQuery(api.deal_documents.getDealDocuments, {
		dealId,
	});

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<div className="space-y-1">
					<CardTitle>Document Details</CardTitle>
					<CardDescription>
						Status of signable documents for this deal
					</CardDescription>
				</div>
				<AddDocumentDialog dealData={dealData} dealId={dealId} />
			</CardHeader>
			<CardContent>
				{documents === undefined ? (
					<Skeleton className="h-24 w-full" />
				) : documents.length === 0 ? (
					<div className="py-6 text-center text-muted-foreground text-sm">
						No documents associated with this deal yet.
					</div>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Document</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Signatories</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{documents.map((doc: DealDocument) => (
								<TableRow key={doc._id}>
									<TableCell className="font-medium">
										<div className="flex items-center gap-2">
											<FileText className="h-4 w-4 text-muted-foreground" />
											{doc.templateName}
										</div>
									</TableCell>
									<TableCell>
										<Badge
											variant={
												doc.status === "signed"
													? "success"
													: doc.status === "rejected"
														? "destructive"
														: "secondary"
											}
										>
											{doc.status}
										</Badge>
									</TableCell>
									<TableCell>
										<div className="flex flex-col gap-1">
											{doc.signatories.map((signer: DealDocumentSigner) => (
												<div
													className="flex items-center gap-2 text-muted-foreground text-xs"
													key={signer.email}
												>
													<Users className="h-3 w-3" />
													<span>
														{signer.name} ({signer.role})
													</span>
												</div>
											))}
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</CardContent>
		</Card>
	);
}
