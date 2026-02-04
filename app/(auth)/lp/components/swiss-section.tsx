import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const sectionVariants = cva("section-grid", {
	variants: {
		tone: {
			light: "bg-white text-neutral-900",
			lightSoft: "bg-white/90 text-neutral-900",
			dark: "border-neutral-800 bg-neutral-900 text-white",
			darkSoft: "border-neutral-800 bg-neutral-900/90 text-white",
			green: "border-security-green bg-security-green text-white",
			greenSoft: "border-security-green bg-security-green/90 text-white",
			sand: "bg-[#F5F5F0] text-neutral-900",
			sandSoft: "bg-[#F5F5F0]/90 text-neutral-900",
		},
	},
	defaultVariants: {
		tone: "light",
	},
});

const edgeVariants = cva("margin-col", {
	variants: {
		side: {
			left: "border-r",
			right: "border-l",
		},
		tone: {
			light: "swiss-border",
			lightSoft: "swiss-border bg-white/90",
			dark: "border-neutral-800 bg-black",
			darkSoft: "border-neutral-800 bg-black/90",
			green: "border-white/10 bg-[#071F1A]",
			greenSoft: "border-white/10 bg-[#071F1A]/90",
			sand: "swiss-border bg-[#F0F0EB]",
			sandSoft: "swiss-border bg-[#F0F0EB]/90",
		},
	},
	defaultVariants: {
		side: "left",
		tone: "light",
	},
});

const edgeTextVariants = cva("margin-text", {
	variants: {
		tone: {
			light: "text-neutral-400",
			dark: "text-neutral-600",
			inverse: "text-white/30",
		},
	},
	defaultVariants: {
		tone: "light",
	},
});

type SwissSectionProps = React.ComponentProps<"section"> &
	VariantProps<typeof sectionVariants> & {
		title?: string;
		subtitle?: string;
		leftTone?: VariantProps<typeof edgeVariants>["tone"];
		rightTone?: VariantProps<typeof edgeVariants>["tone"];
		titleTone?: VariantProps<typeof edgeTextVariants>["tone"];
		subtitleTone?: VariantProps<typeof edgeTextVariants>["tone"];
		leftClassName?: string;
		rightClassName?: string;
		titleClassName?: string;
		subtitleClassName?: string;
	};

export function SwissSection({
	title,
	subtitle,
	children,
	className,
	tone,
	leftTone,
	rightTone,
	titleTone,
	subtitleTone,
	leftClassName,
	rightClassName,
	titleClassName,
	subtitleClassName,
	...props
}: SwissSectionProps) {
	return (
		<section className={cn(sectionVariants({ tone }), className)} {...props}>
			<div
				className={cn(
					edgeVariants({ side: "left", tone: leftTone }),
					leftClassName
				)}
			>
				{title ? (
					<span
						className={cn(
							edgeTextVariants({ tone: titleTone }),
							titleClassName
						)}
					>
						{title}
					</span>
				) : null}
			</div>
			{children}
			<div
				className={cn(
					edgeVariants({ side: "right", tone: rightTone }),
					rightClassName
				)}
			>
				{subtitle ? (
					<span
						className={cn(
							edgeTextVariants({ tone: subtitleTone ?? titleTone }),
							subtitleClassName
						)}
					>
						{subtitle}
					</span>
				) : null}
			</div>
		</section>
	);
}
