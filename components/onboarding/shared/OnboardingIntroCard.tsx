import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { OnboardingCard } from "./OnboardingCard";

export type OnboardingIntroCardProps = {
	title: string;
	description: string;
	bullets: string[];
	ctaLabel?: string;
	busy?: boolean;
	onContinue: () => void | Promise<void>;
	className?: string;
};

export function OnboardingIntroCard({
	title,
	description,
	bullets,
	ctaLabel = "Begin",
	busy = false,
	onContinue,
	className,
}: OnboardingIntroCardProps) {
	return (
		<OnboardingCard className={cn("border-primary/20", className)}>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<p className="text-muted-foreground">{description}</p>
				<ul className="space-y-2 text-muted-foreground text-sm">
					{bullets.map((bullet) => (
						<li className="flex items-start gap-2" key={bullet}>
							<CheckCircle2 className="mt-0.5 size-4 text-primary" />
							<span>{bullet}</span>
						</li>
					))}
				</ul>
				<div className="flex items-center justify-end">
					<Button disabled={busy} onClick={onContinue}>
						{busy ? "Saving..." : ctaLabel}
						<ArrowRight className="ml-2 size-4" />
					</Button>
				</div>
			</CardContent>
		</OnboardingCard>
	);
}
