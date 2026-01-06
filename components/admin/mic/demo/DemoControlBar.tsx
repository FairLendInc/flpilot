"use client";

import { ArrowLeft, CheckCircle, Play, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DemoControlBarProps = {
	/**
	 * Whether there is a previous step
	 */
	hasPrevious: boolean;
	/**
	 * Whether there is a next step
	 */
	hasNext: boolean;
	/**
	 * Whether the current action is finished
	 */
	isFinished?: boolean;
	/**
	 * Whether the current action is executing
	 */
	isExecuting?: boolean;
	/**
	 * Callback for previous
	 */
	onPrevious: () => void;
	/**
	 * Callback for next or execute
	 */
	onNext: () => void;
	/**
	 * Optional className
	 */
	className?: string;
};

/**
 * A specialized control bar for the MIC Live Demo wizard.
 * Toggles between navigation and execution actions based on the phase state.
 */
export function DemoControlBar({
	hasPrevious,
	hasNext,
	isFinished,
	isExecuting,
	onPrevious,
	onNext,
	className,
}: DemoControlBarProps) {
	return (
		<div
			className={cn(
				"flex h-20 w-full items-center justify-between border-border/30 border-t bg-background/50 px-6 backdrop-blur-md",
				className
			)}
		>
			<Button
				className="gap-2 font-bold text-[11px] text-muted-foreground uppercase tracking-widest hover:text-foreground"
				disabled={!hasPrevious || isExecuting}
				onClick={onPrevious}
				size="sm"
				variant="ghost"
			>
				<ArrowLeft className="size-3.5" />
				Back
			</Button>
			<div className="flex items-center gap-3">
				{isFinished ? (
					<Button
						className="gap-2 rounded-2xl bg-emerald-600 px-8 py-6 font-bold shadow-emerald-500/20 shadow-lg hover:bg-emerald-700"
						onClick={onNext}
					>
						<CheckCircle className="size-4" />
						Phase Completed {hasNext && "— Next"}
					</Button>
				) : (
					<Button
						className={cn(
							"gap-2 rounded-2xl px-8 py-6 font-bold shadow-lg shadow-primary/20 transition-all active:scale-95",
							isExecuting ? "opacity-70" : "hover:shadow-primary/30"
						)}
						disabled={isExecuting}
						onClick={onNext}
					>
						{isExecuting ? (
							<>
								<RefreshCw className="size-4 animate-spin" />
								Processing Ledger...
							</>
						) : (
							<>
								<Play className="size-4 fill-current" />
								Execute Phase Action
							</>
						)}
					</Button>
				)}
			</div>
			<div className="w-[80px]" /> {/* Spacer to balance the layout */}
		</div>
	);
}
