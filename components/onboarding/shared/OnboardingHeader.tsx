import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { OnboardingCard } from "./OnboardingCard";

export type OnboardingHeaderProps = {
	title: string;
	subtitle: string;
	status?: string | null;
	lastTouchedAt?: string | null;
	className?: string;
};

export function OnboardingHeader({
	title,
	subtitle,
	status,
	lastTouchedAt,
	className,
}: OnboardingHeaderProps) {
	return (
		<OnboardingCard className={cn("relative overflow-hidden", className)}>
			<div className="pointer-events-none absolute inset-0">
				<div className="-right-10 -top-10 absolute size-40 rounded-full bg-primary/20 blur-3xl" />
				<div className="-bottom-16 -left-12 absolute size-40 rounded-full bg-secondary/20 blur-3xl" />
			</div>
			<CardHeader className="relative">
				<p className="text-muted-foreground text-sm">Closed Pilot Onboarding</p>
				<CardTitle className="font-semibold text-3xl">{title}</CardTitle>
			</CardHeader>
			<CardContent className="relative space-y-3">
				<p className="text-muted-foreground text-sm md:text-base">{subtitle}</p>
				<div className="flex flex-wrap items-center gap-3">
					<Badge variant="secondary">Status: {status ?? "draft"}</Badge>
					{lastTouchedAt ? (
						<span className="text-muted-foreground text-sm">
							Updated{" "}
							{formatDistanceToNow(new Date(lastTouchedAt), {
								addSuffix: true,
							})}
						</span>
					) : null}
				</div>
			</CardContent>
		</OnboardingCard>
	);
}
