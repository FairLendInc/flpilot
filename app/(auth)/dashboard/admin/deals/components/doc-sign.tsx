"use client";

import { EmbedSignDocument } from "@documenso/embed-react";

type SignPortalProps = {
	signingToken: string | null;
	signerName?: string;
	onDocumentCompleted?: () => void;
	onDocumentReady?: () => void;
	onDocumentError?: (error: unknown) => void;
};

const PLACEHOLDER_HEIGHT = 480;
const MIN_PORTAL_HEIGHT = 600;
const SIGN_TOKEN_REGEX = /\/sign\/([^/?]+)/;

export default function SignPortal({
	signingToken,
	signerName = "User",
	onDocumentReady,
	onDocumentError,
	onDocumentCompleted,
}: SignPortalProps) {
	const resolvedToken =
		signingToken?.match(SIGN_TOKEN_REGEX)?.[1] ?? signingToken ?? "";

	if (!resolvedToken.trim()) {
		return (
			<div
				className="flex w-full items-center justify-center rounded-lg border border-muted-foreground/40 border-dashed bg-muted/20 p-6 text-muted-foreground text-sm"
				style={{ minHeight: `${PLACEHOLDER_HEIGHT}px` }}
			>
				<p>Select a signatory to load the signing experience.</p>
			</div>
		);
	}

	try {
		return (
			<div
				className="h-full w-full"
				style={{ minHeight: `${MIN_PORTAL_HEIGHT}px` }}
			>
				<EmbedSignDocument
					className="h-full w-full"
					name={signerName}
					onDocumentCompleted={onDocumentCompleted}
					onDocumentError={onDocumentError}
					onDocumentReady={onDocumentReady}
					token={resolvedToken}
				/>
			</div>
		);
	} catch (error) {
		return (
			<div className="space-y-2 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-destructive text-sm">
				<p>Unable to load the document signing interface.</p>
				<p className="text-xs">
					{error instanceof Error ? error.message : "Unknown error"}
				</p>
			</div>
		);
	}
}
