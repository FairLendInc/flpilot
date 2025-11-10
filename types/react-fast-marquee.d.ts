declare module "react-fast-marquee" {
	import type { ComponentProps, ReactNode } from "react";

	interface MarqueeProps extends ComponentProps<"div"> {
		children?: ReactNode;
		className?: string;
		direction?: "left" | "right" | "up" | "down";
		speed?: number;
		pauseOnHover?: boolean;
		pauseOnClick?: boolean;
		loop?: number;
		gradient?: boolean;
		gradientColor?: string;
		gradientWidth?: number | string;
	}

	const Marquee: React.FC<MarqueeProps>;
	export default Marquee;
}
