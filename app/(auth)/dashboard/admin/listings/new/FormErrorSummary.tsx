"use client";

import { Card, CardContent } from "@heroui/react";
import { AlertTriangle } from "lucide-react";

type FormErrorSummaryProps = {
	errors: Record<string, string>;
};

const mapFieldLabel = (field: string) => {
	if (field.startsWith("borrower."))
		return field.replace("borrower.", "Borrower ");
	if (field.startsWith("mortgage."))
		return field.replace("mortgage.", "Mortgage ");
	if (field.startsWith("listing."))
		return field.replace("listing.", "Listing ");
	return field;
};

export function FormErrorSummary({ errors }: FormErrorSummaryProps) {
	const entries = Object.entries(errors);
	if (entries.length === 0) return null;

	return (
		<Card.Root
			className="border-danger/50 bg-danger/10 shadow-none"
			role="alert"
		>
			<CardContent className="space-y-2">
				<div className="flex items-center gap-2 text-danger">
					<AlertTriangle aria-hidden="true" className="h-4 w-4" />
					<p className="font-medium text-sm">
						{entries.length > 1
							? `${entries.length} fields require attention`
							: "Please resolve the highlighted field"}
					</p>
				</div>
				<ul className="list-disc space-y-1 pl-6 text-danger/90 text-sm">
					{entries.slice(0, 5).map(([field, message]) => (
						<li key={field}>
							<span className="font-medium">{mapFieldLabel(field)}:</span>{" "}
							{message}
						</li>
					))}
					{entries.length > 5 && (
						<li>
							Resolve the remaining {entries.length - 5} field(s) to continue
						</li>
					)}
				</ul>
			</CardContent>
		</Card.Root>
	);
}
