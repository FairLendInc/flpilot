"use client";

import { Redo2 } from "lucide-react";
import React from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useToolbar } from "./toolbar-provider";

const RedoToolbar = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, onClick, children, ...props }, ref) => {
		const { editor } = useToolbar();

		return (
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						className={cn("h-8 w-8 p-0 sm:h-9 sm:w-9", className)}
						disabled={!editor?.can().chain().focus().redo().run()}
						onClick={(e) => {
							editor?.chain().focus().redo().run();
							onClick?.(e);
						}}
						ref={ref}
						size="icon"
						variant="ghost"
						{...props}
					>
						{children ?? <Redo2 className="h-4 w-4" />}
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					<span>Redo</span>
				</TooltipContent>
			</Tooltip>
		);
	}
);

RedoToolbar.displayName = "RedoToolbar";

export { RedoToolbar };
