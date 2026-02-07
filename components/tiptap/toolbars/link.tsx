"use client";
import { PopoverClose } from "@radix-ui/react-popover";
import { Trash2, X } from "lucide-react";

import React, { type FormEvent } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { getUrlFromString } from "@/lib/tiptap-utils";
import { cn } from "@/lib/utils";
import { useToolbar } from "./toolbar-provider";

const LinkToolbar = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, ...props }, ref) => {
		const { editor } = useToolbar();
		const [link, setLink] = React.useState("");

		const handleSubmit = (e: FormEvent) => {
			e.preventDefault();
			const url = getUrlFromString(link);
			url && editor?.chain().focus().setLink({ href: url }).run();
		};

		React.useEffect(() => {
			setLink(editor?.getAttributes("link").href ?? "");
		}, [editor]);

		return (
			<Popover>
				<Tooltip>
					<TooltipTrigger asChild>
						<PopoverTrigger
							asChild
							disabled={!editor?.can().chain().setLink({ href: "" }).run()}
						>
							<Button
								className={cn(
									"h-8 w-max px-3 font-normal",
									editor?.isActive("link") && "bg-accent",
									className
								)}
								ref={ref}
								size="sm"
								variant="ghost"
								{...props}
							>
								<p className="mr-2 text-base">↗</p>
								<p className={"underline decoration-gray-7 underline-offset-4"}>
									Link
								</p>
							</Button>
						</PopoverTrigger>
					</TooltipTrigger>
					<TooltipContent>
						<span>Link</span>
					</TooltipContent>
				</Tooltip>

				<PopoverContent
					asChild
					className="relative px-3 py-2.5"
					onCloseAutoFocus={(e) => {
						e.preventDefault();
					}}
				>
					<div className="relative">
						<PopoverClose className="absolute top-3 right-3">
							<X className="h-4 w-4" />
						</PopoverClose>
						<form onSubmit={handleSubmit}>
							<Label>Link</Label>
							<p className="text-gray-11 text-sm">
								Attach a link to the selected text
							</p>
							<div className="mt-3 flex flex-col items-end justify-end gap-3">
								<Input
									className="w-full"
									onChange={(e) => {
										setLink(e.target.value);
									}}
									placeholder="https://example.com"
									value={link}
								/>
								<div className="flex items-center gap-3">
									{editor?.getAttributes("link").href && (
										<Button
											className="h-8 text-gray-11"
											onClick={() => {
												editor?.chain().focus().unsetLink().run();
												setLink("");
											}}
											size="sm"
											type="reset"
											variant="ghost"
										>
											<Trash2 className="mr-2 h-4 w-4" />
											Remove
										</Button>
									)}
									<Button className="h-8" size="sm">
										{editor?.getAttributes("link").href ? "Update" : "Confirm"}
									</Button>
								</div>
							</div>
						</form>
					</div>
				</PopoverContent>
			</Popover>
		);
	}
);

LinkToolbar.displayName = "LinkToolbar";

export { LinkToolbar };
