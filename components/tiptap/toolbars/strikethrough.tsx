"use client";

import { Strikethrough } from "lucide-react";
import React from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useToolbar } from "./toolbar-provider";

const StrikeThroughToolbar = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, onClick, children, ...props }, ref) => {
		const { editor } = useToolbar();
		return (
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						className={cn(
							"h-8 w-8 p-0 sm:h-9 sm:w-9",
							editor?.isActive("strike") && "bg-accent",
							className
						)}
						disabled={!editor?.can().chain().focus().toggleStrike().run()}
						onClick={(e) => {
							editor?.chain().focus().toggleStrike().run();
							onClick?.(e);
						}}
						ref={ref}
						size="icon"
						variant="ghost"
						{...props}
					>
						{children ?? <Strikethrough className="h-4 w-4" />}
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					<span>Strikethrough</span>
					<span className="ml-1 text-gray-11 text-xs">(cmd + shift + x)</span>
				</TooltipContent>
			</Tooltip>
		);
	}
);

StrikeThroughToolbar.displayName = "StrikeThroughToolbar";

export { StrikeThroughToolbar };
