"use client";

import { ChevronDown } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { MobileToolbarGroup, MobileToolbarItem } from "./mobile-toolbar-group";
import { useToolbar } from "./toolbar-provider";

const levels = [1, 2, 3, 4] as const;

export const HeadingsToolbar = React.forwardRef<
	HTMLButtonElement,
	React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
	const { editor } = useToolbar();
	const isMobile = useMediaQuery("(max-width: 640px)");
	const activeLevel = levels.find((level) =>
		editor?.isActive("heading", { level })
	);

	if (isMobile) {
		return (
			<MobileToolbarGroup label={activeLevel ? `H${activeLevel}` : "Normal"}>
				<MobileToolbarItem
					active={!editor?.isActive("heading")}
					onClick={() => editor?.chain().focus().setParagraph().run()}
				>
					Normal
				</MobileToolbarItem>
				{levels.map((level) => (
					<MobileToolbarItem
						active={editor?.isActive("heading", { level })}
						key={level}
						onClick={() =>
							editor?.chain().focus().toggleHeading({ level }).run()
						}
					>
						H{level}
					</MobileToolbarItem>
				))}
			</MobileToolbarGroup>
		);
	}

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							className={cn(
								"h-8 w-max gap-1 px-3 font-normal",
								editor?.isActive("heading") && "bg-accent",
								className
							)}
							ref={ref}
							size="sm"
							variant="ghost"
							{...props}
						>
							{activeLevel ? `H${activeLevel}` : "Normal"}
							<ChevronDown className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start">
						<DropdownMenuItem
							className={cn(
								"flex h-fit items-center gap-2",
								!editor?.isActive("heading") && "bg-accent"
							)}
							onClick={() => editor?.chain().focus().setParagraph().run()}
						>
							Normal
						</DropdownMenuItem>
						{levels.map((level) => (
							<DropdownMenuItem
								className={cn(
									"flex items-center gap-2",
									editor?.isActive("heading", { level }) && "bg-accent"
								)}
								key={level}
								onClick={() =>
									editor?.chain().focus().toggleHeading({ level }).run()
								}
							>
								H{level}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</TooltipTrigger>
			<TooltipContent>
				<span>Headings</span>
			</TooltipContent>
		</Tooltip>
	);
});

HeadingsToolbar.displayName = "HeadingsToolbar";
