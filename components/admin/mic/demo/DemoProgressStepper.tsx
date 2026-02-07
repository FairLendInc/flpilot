"use client";

import { Check } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

type DemoPhase = "setup" | "accrual" | "dividend" | "verification";

type Step = {
	id: DemoPhase;
	label: string;
};

type DemoProgressStepperProps = {
	/**
	 * Array of steps in the demo
	 */
	steps: Step[];
	/**
	 * Current active step ID
	 */
	currentStep: DemoPhase;
	/**
	 * Completed step IDs
	 */
	completedSteps: DemoPhase[];
	/**
	 * Optional className for the container
	 */
	className?: string;
};

/**
 * A sleek progress indicator for the MIC Live Demo.
 * Visualizes the phase progression through the Formance Ledger lifecycle.
 */
export function DemoProgressStepper({
	steps,
	currentStep,
	completedSteps,
	className,
}: DemoProgressStepperProps) {
	return (
		<div
			className={cn(
				"flex w-full items-center justify-between gap-2 px-2",
				className
			)}
		>
			{steps.map((step, index) => {
				const isCompleted = completedSteps.includes(step.id);
				const isActive = currentStep === step.id;
				const isLast = index === steps.length - 1;

				return (
					<React.Fragment key={step.id}>
						<div className="group flex flex-1 flex-col items-center gap-2">
							<div
								className={cn(
									"relative flex size-10 items-center justify-center rounded-2xl border-2 shadow-sm transition-all duration-500",
									isCompleted
										? "scale-110 border-primary bg-primary text-primary-foreground shadow-primary/20"
										: isActive
											? "animate-pulse border-primary bg-background text-primary shadow-indigo-500/10"
											: "border-muted-foreground/20 bg-muted/30 text-muted-foreground opacity-50"
								)}
							>
								{isCompleted ? (
									<Check className="size-5 stroke-[3px]" />
								) : isActive ? (
									<div className="size-2 animate-bounce rounded-full bg-primary" />
								) : (
									<span className="font-bold text-xs leading-none">
										{index + 1}
									</span>
								)}
								{isActive && (
									<div className="-inset-2 absolute animate-ping rounded-3xl border border-primary/20 opacity-20" />
								)}
							</div>
							<span
								className={cn(
									"text-center font-bold text-[10px] uppercase tracking-widest transition-colors duration-300",
									isActive || isCompleted
										? "text-foreground"
										: "text-muted-foreground opacity-50"
								)}
							>
								{step.label}
							</span>
						</div>

						{!isLast && (
							<div className="mb-6 h-0.5 w-12 rounded-full bg-muted-foreground/10">
								<div
									className={cn(
										"h-full rounded-full bg-primary transition-all duration-700",
										isCompleted ? "w-full" : "w-0"
									)}
								/>
							</div>
						)}
					</React.Fragment>
				);
			})}
		</div>
	);
}
