import type React from "react";
import { cn } from "@/lib/utils";

export const FeatureIconContainer = ({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) => (
	<div className="[perspective:400px] [transform-style:preserve-3d]">
		<div
			className={cn(
				"relative mx-auto h-14 w-14 rounded-md bg-gradient-to-b from-neutral-800 to-neutral-950 p-[4px]"
			)}
			style={{
				transform: "rotateX(25deg)",
				transformOrigin: "center",
			}}
		>
			<div
				className={cn(
					"relative z-20 h-full w-full rounded-[5px] bg-charcoal",
					className
				)}
			>
				{children}
			</div>
			<div className="absolute inset-x-0 bottom-0 z-30 mx-auto h-4 w-full rounded-full bg-neutral-600 opacity-50 blur-lg" />
			<div className="absolute inset-x-0 bottom-0 mx-auto h-px w-[60%] bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
			<div className="absolute inset-x-0 bottom-0 mx-auto h-[8px] w-[60%] bg-gradient-to-r from-transparent via-cyan-600 to-transparent blur-sm" />
		</div>
	</div>
);
