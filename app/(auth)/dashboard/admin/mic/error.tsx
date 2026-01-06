"use client";

import { AlertCircle, RotateCcw } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function MICAdminError({
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
		<div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
			<div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
				<AlertCircle className="h-10 w-10" />
			</div>
			<div className="text-center">
				<h2 className="font-bold text-2xl tracking-tight">
					Something went wrong!
				</h2>
				<p className="mt-2 text-muted-foreground">
					There was an issue loading the MIC management module.
				</p>
			</div>
			<Button className="gap-2" onClick={() => reset()}>
				<RotateCcw className="h-4 w-4" />
				Try again
			</Button>
		</div>
	);
}
