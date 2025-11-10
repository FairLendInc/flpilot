import type React from "react";
import { cn } from "@/lib/utils";

export const Container = ({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) => <div className={cn("mx-auto max-w-7xl px-4", className)}>{children}</div>;
