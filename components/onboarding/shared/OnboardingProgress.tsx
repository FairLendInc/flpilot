import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JourneyDoc, OnboardingStateValue } from "../machine";

export type OnboardingStep = {
	id: OnboardingStateValue;
	label: string;
	description: string;
};

export type OnboardingProgressProps = {
	steps: OnboardingStep[];
	currentState: OnboardingStateValue;
	status: JourneyDoc["status"];
	columns?: 2 | 3;
};

export function OnboardingProgress({
	steps,
	currentState,
	status,
	columns = 3,
}: OnboardingProgressProps) {
	const activeIndex = steps.findIndex((step) => step.id === currentState);
	const allCompleted =
		status === "awaiting_admin" ||
		status === "approved" ||
		status === "rejected";

	return (
		<div
			className={cn(
				"grid gap-3",
				columns === 2 ? "md:grid-cols-2" : "md:grid-cols-3"
			)}
		>
			{steps.map((step, index) => {
				const completed = allCompleted || index < activeIndex;
				const isActive = !allCompleted && index === activeIndex;
				return (
					<div
						className={cn(
							"rounded-xl border border-border/60 bg-card/70 p-3 text-sm shadow-sm transition",
							"hover:shadow-md",
							completed && "border-primary/40 bg-primary/10",
							isActive && "border-primary shadow-primary/10"
						)}
						key={step.id}
					>
						<p className="font-medium">
							{step.label}
							{completed ? (
								<CheckCircle2 className="ml-2 inline size-4 text-primary" />
							) : null}
						</p>
						<p className="text-muted-foreground text-xs">{step.description}</p>
					</div>
				);
			})}
		</div>
	);
}
