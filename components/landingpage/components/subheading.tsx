import type { AnimationProps, MotionProps } from "framer-motion";
import type React from "react";
import Balancer from "react-wrap-balancer";
import { cn } from "@/lib/utils";

export const Subheading = ({
	className,
	as: Tag = "h2",
	children,
	...props
}: {
	className?: string;
	as?: any;
	children: any;
	props?: React.HTMLAttributes<HTMLHeadingElement | AnimationProps>;
} & MotionProps &
	React.HTMLAttributes<HTMLHeadingElement | AnimationProps>) => (
	<Tag
		className={cn(
			"mx-auto my-4 max-w-4xl text-left text-sm md:text-base",
			"text-center font-normal text-muted",
			className
		)}
	>
		<Balancer>{children}</Balancer>
	</Tag>
);
