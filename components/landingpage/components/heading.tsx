import type { MotionProps } from "framer-motion";
import type React from "react";
import Balancer from "react-wrap-balancer";
import { cn } from "@/lib/utils";

export const Heading = ({
	className,
	as: Tag = "h2",
	children,
	size = "md",
	...props
}: {
	className?: string;
	as?: React.ElementType;
	children: React.ReactNode;
	size?: "sm" | "md" | "xl" | "2xl";
} & MotionProps &
	React.HTMLAttributes<HTMLHeadingElement>) => {
	const sizeVariants = {
		sm: "text-xl md:text-2xl md:leading-snug",
		md: "text-3xl md:text-5xl md:leading-tight",
		xl: "text-4xl md:text-6xl md:leading-none",
		"2xl": "text-5xl md:text-7xl md:leading-none",
	};
	return (
		<Tag
			className={cn(
				"mx-auto max-w-5xl text-center text-3xl tracking-tight md:text-5xl md:leading-tight",
				"font-medium",
				"bg-gradient-to-b from-neutral-800 via-white to-white bg-clip-text text-transparent",
				sizeVariants[size],
				className
			)}
			{...props}
		>
			<Balancer>{children}</Balancer>
		</Tag>
	);
};
