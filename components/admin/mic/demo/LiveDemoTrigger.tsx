"use client";

import { PlayCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LiveDemoTriggerProps = {
	/**
	 * Callback when clicked
	 */
	onClick: () => void;
	/**
	 * Optional className
	 */
	className?: string;
};

/**
 * A premium call-to-action button for initiating the MIC Live Demo.
 * Uses gradients and pulse animations to draw attention to the ledger simulation.
 */
export function LiveDemoTrigger({ onClick, className }: LiveDemoTriggerProps) {
	return (
		<Button
			className={cn(
				"group relative overflow-hidden rounded-2xl bg-slate-950 px-8 py-7 shadow-2xl transition-all duration-500 hover:scale-[1.02] active:scale-95",
				className
			)}
			onClick={onClick}
		>
			<div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-primary/20 to-emerald-500/20 opacity-50 transition-opacity duration-500 group-hover:opacity-80" />
			<div className="-inset-[100%] absolute animate-spin-slow bg-[conic-gradient(from_0deg,transparent,rgba(99,102,241,0.2),transparent)] opacity-0 group-hover:opacity-100" />

			<div className="relative flex items-center gap-4">
				<div className="flex size-12 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-primary shadow-inner transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
					<PlayCircle className="size-6 fill-current" />
				</div>
				<div className="flex flex-col items-start gap-1 text-left">
					<div className="flex items-center gap-2">
						<span className="font-bold text-slate-50 text-sm tracking-tight">
							Interactive Ledger Demo
						</span>
						<Sparkles className="size-3.5 animate-pulse text-amber-500" />
					</div>
					<p className="max-w-[180px] font-medium text-[10px] text-slate-400 leading-tight">
						Experience the Formance Ledger MIC orchestration in real-time.
					</p>
				</div>
			</div>
		</Button>
	);
}
