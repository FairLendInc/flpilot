"use client";

import { AlertCircle } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function DashboardError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		// Log the error to an error reporting service
		console.error(error);
	}, [error]);

	return (
		<>
			<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator className="mr-2 h-4" orientation="vertical" />
				<h1 className="font-semibold text-lg">Error</h1>
			</header>

			<div className="flex flex-1 flex-col gap-6 p-6">
				<Card>
					<CardHeader>
						<CardTitle>Something went wrong</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<div className="mb-4 rounded-full bg-destructive/10 p-6">
							<AlertCircle className="h-12 w-12 text-destructive" />
						</div>
						<h3 className="mb-2 font-semibold text-lg">An error occurred</h3>
						<p className="mb-6 text-center text-muted-foreground text-sm">
							{error.message || "Something went wrong. Please try again."}
						</p>
						<Button onClick={reset}>Try again</Button>
					</CardContent>
				</Card>
			</div>
		</>
	);
}
