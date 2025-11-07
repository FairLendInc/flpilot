"use client";

import {
	BookOpen,
	FileText,
	HelpCircle,
	Home,
	Mail,
	Search,
} from "lucide-react";
import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "../ui/button";

type CommandPaletteProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

const commands = [
	{ icon: Home, label: "Home", shortcut: "" },
	{ icon: FileText, label: "Listings", shortcut: "" },
	{ icon: BookOpen, label: "Blog", shortcut: "" },
	{ icon: HelpCircle, label: "FAQ", shortcut: "" },
	{ icon: Mail, label: "Contact Us", shortcut: "" },
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
	const [search, setSearch] = React.useState("");

	const filteredCommands = commands.filter((cmd) =>
		cmd.label.toLowerCase().includes(search.toLowerCase())
	);

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="max-w-2xl gap-0 p-0">
				<DialogTitle className="sr-only">Command Palette</DialogTitle>
				<div className="flex items-center border-border border-b px-4">
					<Search className="size-4 text-muted-foreground" />
					<Input
						className="h-12 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search..."
						value={search}
					/>
				</div>
				<div className="max-h-[400px] overflow-y-auto p-2">
					{filteredCommands.length === 0 ? (
						<div className="py-6 text-center text-muted-foreground text-sm">
							No results found.
						</div>
					) : (
						<div className="space-y-1">
							{filteredCommands.map((cmd) => (
								<Button
									className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
									key={cmd.label}
									onClick={() => onOpenChange(false)}
								>
									<cmd.icon className="size-4 text-muted-foreground" />
									<span>{cmd.label}</span>
								</Button>
							))}
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
