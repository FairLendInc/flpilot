"use client";

import { useAction } from "convex/react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";

type TemplateWithRecipients = {
	id: number;
	title: string;
	externalId?: string | null;
	recipients: {
		id: number;
		email: string;
		name: string;
		role: string;
	}[];
};

type DocumensoTemplateAutocompleteProps = {
	value?: string;
	onSelect: (template: {
		id: string;
		name: string;
		recipients: { id: number; role: string; name: string }[];
	}) => void;
	className?: string;
};

export function DocumensoTemplateAutocomplete({
	value,
	onSelect,
	className,
}: DocumensoTemplateAutocompleteProps) {
	const [open, setOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [templates, setTemplates] = useState<TemplateWithRecipients[]>([]);
	const [loading, setLoading] = useState(false);

	const searchTemplates = useAction(api.documenso.searchTemplatesAction);

	// Debounced search effect
	useEffect(() => {
		const timer = setTimeout(async () => {
			setLoading(true);
			try {
				const results = await searchTemplates({ query: searchQuery });
				console.log("Results:", {
					results,
					searchQuery,
				});
				setTemplates(results);
			} catch (error) {
				console.error("Failed to search templates:", error);
				setTemplates([]);
			} finally {
				setLoading(false);
			}
		}, 300);

		return () => clearTimeout(timer);
	}, [searchQuery, searchTemplates]);

	const selectedTemplate = templates.find((t) => String(t.id) === value);

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger asChild>
				<Button
					aria-expanded={open}
					className={cn("w-full justify-between", className)}
					role="combobox"
					variant="outline"
				>
					{selectedTemplate ? selectedTemplate.title : "Select template..."}
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[500px] p-0">
				<Command shouldFilter={false}>
					<CommandInput
						onInput={(e: React.FormEvent<HTMLInputElement>) => {
							setSearchQuery(e.currentTarget.value);
						}}
						placeholder="Search templates..."
					/>
					<CommandList>
						{loading && (
							<div className="flex items-center justify-center p-4">
								<Loader2 className="h-4 w-4 animate-spin" />
							</div>
						)}
						{!loading && templates.length === 0 && (
							<CommandEmpty>No templates found.</CommandEmpty>
						)}
						<CommandGroup>
							{templates.map((template) => {
								const templateId = String(template.id);
								const isSelected = templateId === value;

								return (
									<CommandItem
										key={template.id}
										onSelect={() => {
											onSelect({
												id: templateId,
												name: template.title,
												recipients: template.recipients.map((r) => ({
													id: r.id,
													role: r.role,
													name: r.name,
												})),
											});
											setOpen(false);
										}}
										value={templateId}
									>
										<Check
											className={cn(
												"mr-2 h-4 w-4 shrink-0",
												isSelected ? "opacity-100" : "opacity-0"
											)}
										/>
										<div className="flex flex-1 flex-col gap-1">
											<div className="font-medium">{template.title}</div>
											{template.recipients.length > 0 && (
												<div className="flex flex-wrap gap-1">
													{template.recipients.map((recipient) => (
														<Badge
															className="text-xs"
															key={recipient.id}
															variant="secondary"
														>
															{recipient.role}
														</Badge>
													))}
												</div>
											)}
										</div>
									</CommandItem>
								);
							})}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
