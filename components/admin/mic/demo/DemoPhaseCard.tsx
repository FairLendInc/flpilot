"use client";

import { Database, type LucideIcon, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type DemoPhaseCardProps = {
	/**
	 * Icon for the phase
	 */
	icon: LucideIcon;
	/**
	 * Title of the current demo phase
	 */
	title: string;
	/**
	 * Description of what is happening
	 */
	description: string;
	/**
	 * Technical detail or "Inside the Ledger" note
	 */
	technicalNote?: string;
	/**
	 * Whether the phase is currently "working" (animating)
	 */
	isWorking?: boolean;
	/**
	 * Optional className
	 */
	className?: string;
};

/**
 * A content card for describing a specific phase of the MIC Live Demo.
 * Highlights the link between administrative actions and ledger side-effects.
 */
export function DemoPhaseCard({
	icon: Icon,
	title,
	description,
	technicalNote,
	isWorking,
	className,
}: DemoPhaseCardProps) {
	return (
		<Card
			className={cn(
				"relative overflow-hidden border-none bg-primary/5 shadow-none",
				className
			)}
		>
			{isWorking && (
				<div className="absolute top-0 left-0 h-1 w-full overflow-hidden bg-primary/20">
					<div className="infinite h-full w-1/3 animate-shimmer bg-primary ease-in-out" />
				</div>
			)}
			<CardContent className="flex flex-col gap-4 p-6">
				<div className="flex items-start gap-4">
					<div
						className={cn(
							"flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm",
							isWorking && "animate-pulse"
						)}
					>
						<Icon className="size-6" />
					</div>
					<div className="flex flex-col gap-1.5">
						<h3 className="flex items-center gap-2 font-bold text-foreground text-xl tracking-tight">
							{title}
							{isWorking && (
								<Sparkles className="size-4 animate-bounce text-amber-500" />
							)}
						</h3>
						<p className="font-medium text-muted-foreground/90 text-sm leading-relaxed">
							{description}
						</p>
					</div>
				</div>

				{technicalNote && (
					<div className="flex items-start gap-3 rounded-xl border border-primary/5 bg-background/50 p-4">
						<Database className="mt-0.5 size-4 text-primary opacity-60" />
						<div className="flex flex-col gap-1">
							<span className="font-bold text-[10px] text-primary/70 uppercase tracking-widest">
								Ledger Insight
							</span>
							<p className="font-medium text-[11px] text-muted-foreground italic leading-relaxed">
								{technicalNote}
							</p>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
