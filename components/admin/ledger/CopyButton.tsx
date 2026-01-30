"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CopyButtonProps = {
	text: string;
	className?: string;
};

export function CopyButton({ text, className }: CopyButtonProps) {
	const [copied, setCopied] = useState(false);

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			toast.success("Copied to clipboard");
			setTimeout(() => setCopied(false), 2000);
		} catch {
			toast.error("Failed to copy");
		}
	}

	return (
		<Button
			className={cn("h-6 w-6 p-0", className)}
			onClick={handleCopy}
			size="sm"
			variant="ghost"
		>
			{copied ? (
				<Check className="size-3 text-green-500" />
			) : (
				<Copy className="size-3 text-muted-foreground" />
			)}
			<span className="sr-only">Copy</span>
		</Button>
	);
}
