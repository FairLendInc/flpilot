"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * Listing detail page error boundary
 * Catches errors while loading individual listing data
 */
export default function ErrorBoundary({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		// Log error to error reporting service
		console.error("Listing detail error:", error);
	}, [error]);

	return (
		<div className="container mx-auto max-w-7xl px-4 py-8">
			{/* Breadcrumb Navigation */}
			<div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6">
				<div className="w-full max-w-md space-y-4 text-center">
					<div className="space-y-2">
						<h1 className="font-bold text-3xl text-red-600">
							Failed to Load Listing
						</h1>
						<p className="text-muted-foreground">
							We encountered an error while loading this property listing.
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
							<Link href="/listings">Back to listings</Link>
						</Button>
						<Button asChild className="w-full" size="lg" variant="ghost">
							<Link href="/">Go to home</Link>
						</Button>
					</div>

					{error.digest && (
						<p className="text-muted-foreground text-xs">
							Error ID: {error.digest}
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
