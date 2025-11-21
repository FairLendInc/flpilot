"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type DocumensoDocumentEmbedProps = {
	token: string;
	email: string;
	onComplete?: () => void;
};

export function DocumensoDocumentEmbed({
	token,
	email,
	onComplete,
}: DocumensoDocumentEmbedProps) {
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const [loading, setLoading] = useState(true);

	// Construct the signing URL
	// Documenso signing URL format: https://app.documenso.com/sign/{token}
	// Or if using embed: https://app.documenso.com/embed/sign/{token}
	// We'll use the embed URL if available, or fallback to standard signing URL
	// For now, assuming standard signing URL but we might need to adjust based on Documenso docs
	// Actually, Documenso supports embedding via iframe with specific URL
	const signingUrl = `https://app.documenso.com/sign/${token}?embed=true&email=${encodeURIComponent(
		email
	)}`;

	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			// Verify origin if possible, but Documenso might send from different subdomains
			// if (event.origin !== "https://app.documenso.com") return;

			// Check for completion message
			// Documenso sends specific messages for events
			if (event.data?.type === "DOCUMENSO_SIGNING_COMPLETED") {
				onComplete?.();
			}
		};

		window.addEventListener("message", handleMessage);
		return () => window.removeEventListener("message", handleMessage);
	}, [onComplete]);

	// Simple timeout to hide loader since we can't reliably detect iframe load cross-origin
	useEffect(() => {
		const timer = setTimeout(() => setLoading(false), 2000);
		return () => clearTimeout(timer);
	}, []);

	return (
		<div className="relative h-[800px] w-full overflow-hidden rounded-lg border bg-background">
			{loading && (
				<div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
					<div className="flex flex-col items-center gap-2">
						<Loader2 className="h-8 w-8 animate-spin text-primary" />
						<p className="text-muted-foreground text-sm">Loading document...</p>
					</div>
				</div>
			)}
			<iframe
				allow="clipboard-read; clipboard-write"
				className="h-full w-full border-0"
				ref={iframeRef}
				src={signingUrl}
				title="Sign Document"
			/>
		</div>
	);
}
