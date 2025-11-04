"use client";

import { Briefcase } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type {
	DocumensoDocumentSummary,
	SignatoryOption,
} from "@/lib/documenso";
import SignPortal from "./components/doc-sign";

type DocumentsApiResponse = {
	documents: DocumensoDocumentSummary[];
	count: number;
	error?: string;
};

const STATUS_LABELS: Record<DocumensoDocumentSummary["status"], string> = {
	DRAFT: "Draft",
	PENDING: "Pending",
	COMPLETED: "Completed",
	REJECTED: "Rejected",
};

const SIGNING_STATUS_LABELS: Record<SignatoryOption["signingStatus"], string> =
	{
		NOT_SIGNED: "Needs signature",
		SIGNED: "Signed",
		REJECTED: "Rejected",
	};

function formatDocumentDescription(document: DocumensoDocumentSummary) {
	const status = STATUS_LABELS[document.status] ?? document.status;
	const pendingCount = document.recipients.length;
	const signerLabel =
		pendingCount === 1
			? "1 pending signatory"
			: `${pendingCount} pending signatories`;

	return `${status} • ${signerLabel}`;
}

function formatRecipientDescription(recipient: SignatoryOption) {
	const status =
		SIGNING_STATUS_LABELS[recipient.signingStatus] ?? recipient.signingStatus;
	const orderLabel =
		typeof recipient.signingOrder === "number"
			? `Step ${recipient.signingOrder}`
			: "Unordered";

	return `${orderLabel} • ${status}`;
}

function isDocumentsResponse(value: unknown): value is DocumentsApiResponse {
	return (
		Boolean(value) &&
		typeof value === "object" &&
		Array.isArray((value as { documents?: unknown }).documents)
	);
}

function extractErrorMessage(value: unknown) {
	if (
		value &&
		typeof value === "object" &&
		"error" in value &&
		typeof (value as { error?: unknown }).error === "string"
	) {
		return (value as { error: string }).error;
	}

	return null;
}

export default function AdminDealsPage() {
	const [documents, setDocuments] = useState<DocumensoDocumentSummary[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedDocumentId, setSelectedDocumentId] = useState("");
	const [selectedSignerId, setSelectedSignerId] = useState("");
	const [portalStatus, setPortalStatus] = useState<
		"idle" | "ready" | "completed" | "error"
	>("idle");
	const [portalError, setPortalError] = useState<string | null>(null);

	useEffect(() => {
		let isMounted = true;

		async function fetchDocuments() {
			setLoading(true);
			setError(null);

			try {
				const response = await fetch("/api/documenso/documents", {
					cache: "no-store",
				});

				const payload = (await response.json().catch(() => null)) as unknown;

				if (!response.ok) {
					const message =
						extractErrorMessage(payload) ??
						`Documenso request failed with status ${response.status}.`;
					throw new Error(message);
				}

				if (!isMounted) return;

				const documentList = isDocumentsResponse(payload)
					? payload.documents
					: [];

				setDocuments(documentList);
				setSelectedDocumentId("");
				setSelectedSignerId("");
				setPortalStatus("idle");
				setPortalError(null);
			} catch (fetchError) {
				if (!isMounted) return;

				setDocuments([]);
				setSelectedDocumentId("");
				setSelectedSignerId("");
				setPortalStatus("idle");
				setPortalError(null);
				setError(
					fetchError instanceof Error
						? fetchError.message
						: "Unable to load Documenso documents."
				);
			} finally {
				if (isMounted) {
					setLoading(false);
				}
			}
		}

		fetchDocuments();

		return () => {
			isMounted = false;
		};
	}, []);

	const selectedDocument = useMemo(
		() =>
			documents.find((document) => String(document.id) === selectedDocumentId),
		[documents, selectedDocumentId]
	);

	const recipientOptions = useMemo(() => {
		if (!selectedDocument) {
			return [] as SignatoryOption[];
		}

		const sorted = [...selectedDocument.recipients];
		sorted.sort((first, second) => {
			const firstOrder =
				typeof first.signingOrder === "number"
					? first.signingOrder
					: Number.POSITIVE_INFINITY;
			const secondOrder =
				typeof second.signingOrder === "number"
					? second.signingOrder
					: Number.POSITIVE_INFINITY;

			if (firstOrder === secondOrder) {
				return first.name.localeCompare(second.name);
			}

			return firstOrder - secondOrder;
		});

		return sorted;
	}, [selectedDocument]);

	const selectedSigner = useMemo(
		() =>
			recipientOptions.find(
				(recipient) => String(recipient.id) === selectedSignerId
			),
		[recipientOptions, selectedSignerId]
	);

	const showEmptyState = !loading && documents.length === 0;

	const portalMessage = useMemo(() => {
		if (portalStatus === "error") {
			return portalError ?? "Unable to load the signing interface.";
		}

		if (portalStatus === "completed") {
			return "Signing flow completed.";
		}

		if (portalStatus === "ready") {
			return "Document is ready for signing.";
		}

		if (selectedSigner) {
			return "Preparing the signing experience…";
		}

		if (selectedDocument) {
			return "Select a pending signatory to continue.";
		}

		if (showEmptyState) {
			return "No documents are ready for signing.";
		}

		if (loading) {
			return "Loading documents from Documenso…";
		}

		return "Select a document to begin.";
	}, [
		loading,
		portalError,
		portalStatus,
		selectedDocument,
		selectedSigner,
		showEmptyState,
	]);

	const signingToken = selectedSigner?.token ?? null;
	const signerName = selectedSigner?.name ?? undefined;

	const handleDocumentChange = (value: string) => {
		setSelectedDocumentId(value);
		setSelectedSignerId("");
		setPortalStatus("idle");
		setPortalError(null);
	};

	const handleSignerChange = (value: string) => {
		setSelectedSignerId(value);
		setPortalStatus("idle");
		setPortalError(null);
	};

	const handlePortalReady = () => {
		setPortalStatus("ready");
		setPortalError(null);
	};

	const handlePortalCompleted = () => {
		setPortalStatus("completed");
		setPortalError(null);
	};

	const handlePortalError = (portalException: unknown) => {
		setPortalStatus("error");
		setPortalError(
			portalException instanceof Error
				? portalException.message
				: "The signing experience encountered an unexpected error."
		);
	};

	return (
		<>
			<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator className="mr-2 h-4" orientation="vertical" />
				<h1 className="font-semibold text-lg">Deal Management</h1>
			</header>

			<div className="flex flex-1 flex-col gap-6 p-6">
				<Card>
					<CardHeader>
						<CardTitle>Documenso Signing</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-8 py-10">
						<div className="flex flex-col items-center gap-4 text-center">
							<div className="rounded-full bg-primary/10 p-6">
								<Briefcase className="h-12 w-12 text-primary" />
							</div>
							<div className="space-y-1">
								<p className="font-semibold text-lg">
									Manage pending document signatures
								</p>
								<p className="text-muted-foreground text-sm">
									Choose a document and signatory to open the embedded Documenso
									signing portal.
								</p>
							</div>
						</div>

						<div className="flex flex-col gap-6">
							<div className="flex flex-col gap-2">
								<span className="font-medium text-sm">Document</span>
								<Select
									disabled={loading || documents.length === 0}
									onValueChange={handleDocumentChange}
									value={selectedDocumentId}
								>
									<SelectTrigger aria-label="Select a document to sign">
										<SelectValue placeholder="Select a pending document" />
									</SelectTrigger>
									<SelectContent>
										{documents.map((document) => (
											<SelectItem key={document.id} value={String(document.id)}>
												<span className="flex flex-col">
													<span className="font-medium">{document.title}</span>
													<span className="text-muted-foreground text-xs">
														{formatDocumentDescription(document)}
													</span>
												</span>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="flex flex-col gap-2">
								<span className="font-medium text-sm">Signatory</span>
								<Select
									disabled={!selectedDocument || recipientOptions.length === 0}
									onValueChange={handleSignerChange}
									value={selectedSignerId}
								>
									<SelectTrigger aria-label="Select a signatory">
										<SelectValue placeholder="Select a pending signatory" />
									</SelectTrigger>
									<SelectContent>
										{recipientOptions.map((recipient) => (
											<SelectItem
												key={recipient.id}
												value={String(recipient.id)}
											>
												<span className="flex flex-col">
													<span className="font-medium">
														{recipient.name}{" "}
														<span className="text-muted-foreground">
															({recipient.email})
														</span>
													</span>
													<span className="text-muted-foreground text-xs">
														{formatRecipientDescription(recipient)}
													</span>
												</span>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							{error ? (
								<div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-destructive text-sm">
									<p>{error}</p>
								</div>
							) : null}

							{showEmptyState && !error ? (
								<div className="rounded-md border border-muted-foreground/40 border-dashed bg-muted/20 p-4 text-muted-foreground text-sm">
									<p>
										There are no documents waiting for signatures right now.
									</p>
								</div>
							) : null}

							<p className="text-muted-foreground text-sm">{portalMessage}</p>
						</div>

						<SignPortal
							onDocumentCompleted={handlePortalCompleted}
							onDocumentError={handlePortalError}
							onDocumentReady={handlePortalReady}
							signerName={signerName}
							signingToken={signingToken}
						/>
					</CardContent>
				</Card>
			</div>
		</>
	);
}
