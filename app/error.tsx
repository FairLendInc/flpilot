"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * Root error boundary
 * Catches errors in the home page and provides recovery options
 */
export default function ErrorPage({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		// Log error to error reporting service
		console.error("Root error:", error);
	}, [error]);

	return (
		<div className="flex min-h-screen items-center justify-center p-8">
			<div className="w-full max-w-md space-y-6 text-center">
				<div className="space-y-2">
					<h1 className="font-bold text-4xl text-red-600">
						Something went wrong!
					</h1>
					<p className="text-muted-foreground">
						An unexpected error occurred while loading this page.
					</p>
				</div>

				{error.message && (
					<div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
						<p className="font-mono text-red-800 text-sm dark:text-red-200">
							{error.message}
						</p>
					</div>
				)}

				<div className="flex flex-col gap-3">
					<Button onClick={reset} size="lg" variant="default">
						Try again
					</Button>
					<Button
						onClick={() => {
							window.location.href = "/";
						}}
						size="lg"
						variant="outline"
					>
						Go to home
					</Button>
				</div>

				{error.digest && (
					<p className="text-muted-foreground text-xs">
						Error ID: {error.digest}
					</p>
				)}
			</div>
		</div>
	);
}
