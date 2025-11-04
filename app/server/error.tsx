"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * Server page error boundary
 * Catches errors in the server example page
 */
export default function ServerError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		// Log error to error reporting service
		console.error("Server page error:", error);
	}, [error]);

	return (
		<main className="flex min-h-screen flex-col items-center justify-center p-8">
			<div className="w-full max-w-md space-y-6 text-center">
				<div className="space-y-2">
					<h1 className="font-bold text-3xl text-red-600">Server Page Error</h1>
					<p className="text-muted-foreground">
						Failed to load server-side data.
					</p>
				</div>

				{error.message && (
					<div className="rounded-lg border border-red-200 bg-red-50 p-4 text-left dark:border-red-800 dark:bg-red-950/20">
						<p className="break-words font-mono text-red-800 text-sm dark:text-red-200">
							{error.message}
						</p>
					</div>
				)}

				<div className="flex flex-col gap-3">
					<Button onClick={reset} size="lg" variant="default">
						Try again
					</Button>
					<Button asChild className="w-full" size="lg" variant="outline">
						<Link href="/">Go to home</Link>
					</Button>
				</div>

				{error.digest && (
					<p className="text-muted-foreground text-xs">
						Error ID: {error.digest}
					</p>
				)}
			</div>
		</main>
	);
}
