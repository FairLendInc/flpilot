import type { ComponentProps } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type OnboardingCardProps = ComponentProps<typeof Card> & {
	glow?: boolean;
};

export function OnboardingCard({
	className,
	glow = true,
	...props
}: OnboardingCardProps) {
	return (
		<Card
			className={cn(
				"relative overflow-hidden border-border/60 bg-card/80 shadow-lg backdrop-blur-md",
				glow && "shadow-primary/10",
				"transition-shadow duration-200 hover:shadow-primary/20",
				className
			)}
			{...props}
		/>
	);
}
