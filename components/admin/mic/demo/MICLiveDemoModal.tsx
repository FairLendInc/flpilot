"use client";

import { Activity, Database, type LucideIcon, ShieldCheck } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { DemoControlBar } from "./DemoControlBar";
import { DemoLedgerStatePanel } from "./DemoLedgerStatePanel";
import { DemoPhaseCard } from "./DemoPhaseCard";
import { DemoProgressStepper } from "./DemoProgressStepper";
import { DemoTransactionPreview } from "./DemoTransactionPreview";

type DemoPhase = "setup" | "accrual" | "dividend" | "verification";

type MICLiveDemoModalProps = {
	/**
	 * Whether the modal is open
	 */
	open: boolean;
	/**
	 * Callback when open state changes
	 */
	onOpenChange: (open: boolean) => void;
	/**
	 * Current phase of the demo
	 */
	currentPhase: DemoPhase;
	/**
	 * Whether an action is executing
	 */
	isExecuting?: boolean;
	/**
	 * Whether the current phase is finished
	 */
	isFinished?: boolean;
	/**
	 * Active accounts state for the ledger panel
	 */
	ledgerAccounts: Array<{
		id: string;
		label: string;
		balance: string;
		asset: string;
		type: "internal" | "investor" | "external";
	}>;
	/**
	 * Active transaction for the preview panel
	 */
	activeTransaction: {
		description: string;
		legs: Array<{
			source: string;
			destination: string;
			amount: string;
			asset: string;
		}>;
	} | null;
	/**
	 * Phase configuration mapping
	 */
	phaseConfig: Record<
		DemoPhase,
		{
			title: string;
			description: string;
			technicalNote: string;
			icon: LucideIcon;
		}
	>;
	/**
	 * Callback to move to next/execute
	 */
	onNext: () => void;
	/**
	 * Callback to move to previous
	 */
	onPrevious: () => void;
};

/**
 * The master orchestration modal for the MIC Live Demo.
 * Composes all demo sub-components into a unified, high-fidelity experience.
 * Designed to showcase the power of the Formance Ledger integration.
 */
export function MICLiveDemoModal({
	open,
	onOpenChange,
	currentPhase,
	isExecuting,
	isFinished,
	ledgerAccounts,
	activeTransaction,
	phaseConfig,
	onNext,
	onPrevious,
}: MICLiveDemoModalProps) {
	const steps = [
		{ id: "setup" as const, label: "Setup" },
		{ id: "accrual" as const, label: "Accrual" },
		{ id: "dividend" as const, label: "Dividend" },
		{ id: "verification" as const, label: "Verify" },
	];

	const currentStepIndex = steps.findIndex((s) => s.id === currentPhase);
	const completedSteps = steps.slice(0, currentStepIndex).map((s) => s.id);
	if (isFinished) completedSteps.push(currentPhase);

	const config = phaseConfig[currentPhase];

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="max-h-[90vh] w-[90vw] max-w-[1200px] overflow-y-auto border-none bg-slate-900 p-0 shadow-2xl ring-1 ring-slate-800">
				<div className="flex h-full min-h-[750px] w-full">
					{/* Left: Main Orchestration (65%) */}
					<div className="flex flex-[0.65] flex-col border-slate-800 border-r bg-slate-900">
						<div className="flex flex-col gap-8 p-8 pb-4">
							<DialogHeader>
								<div className="flex items-center gap-3">
									<div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
										<Activity className="size-6" />
									</div>
									<div className="flex flex-col">
										<DialogTitle className="font-bold text-2xl text-slate-50 uppercase tracking-tight">
											Formance Ledger Live Demo
										</DialogTitle>
										<DialogDescription className="font-bold text-slate-500 text-xs uppercase tracking-[0.2em]">
											MIC Administrative Orchestration
										</DialogDescription>
									</div>
								</div>
							</DialogHeader>

							<DemoProgressStepper
								completedSteps={completedSteps}
								currentStep={currentPhase}
								steps={steps}
							/>
						</div>

						<div className="flex flex-1 flex-col gap-6 overflow-y-auto p-8 pt-4">
							<DemoPhaseCard
								className="border border-slate-700/50 bg-slate-800/50"
								description={config.description}
								icon={config.icon}
								isWorking={isExecuting}
								technicalNote={config.technicalNote}
								title={config.title}
							/>

							{activeTransaction && (
								<DemoTransactionPreview
									className="border-slate-800 bg-slate-950 shadow-inner"
									description={activeTransaction.description}
									isExecuting={isExecuting}
									legs={activeTransaction.legs}
								/>
							)}

							<div className="mt-auto flex gap-4 rounded-2xl border border-indigo-500/10 bg-indigo-500/5 p-4">
								<div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
									<ShieldCheck className="size-5" />
								</div>
								<div className="flex flex-col gap-1">
									<h4 className="font-bold text-slate-200 text-xs">
										Consistency Guarantee
									</h4>
									<p className="font-medium text-[11px] text-slate-400 leading-relaxed">
										Every action in this demo results in an immutable
										transaction on the ledger, ensuring 100% parity between
										assets and obligations.
									</p>
								</div>
							</div>
						</div>

						<DemoControlBar
							className="border-slate-800 bg-slate-900/80"
							hasNext={currentStepIndex < steps.length - 1}
							hasPrevious={currentStepIndex > 0}
							isExecuting={isExecuting}
							isFinished={isFinished}
							onNext={onNext}
							onPrevious={onPrevious}
						/>
					</div>

					{/* Right: Live Ledger View (35%) */}
					<div className="relative flex flex-[0.35] flex-col bg-slate-950">
						<div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] to-transparent" />
						<div className="flex h-full flex-col p-8">
							<div className="mb-6 flex items-center gap-2">
								<Database className="size-4 text-indigo-400" />
								<h3 className="font-bold text-[11px] text-slate-500 uppercase tracking-[0.2em]">
									Live Infrastructure View
								</h3>
							</div>

							<DemoLedgerStatePanel
								accounts={ledgerAccounts}
								className="flex-1 border-none bg-transparent p-0 shadow-none"
							/>

							<div className="mt-8 border-slate-900 border-t pt-6">
								<div className="flex origin-left scale-90 items-center gap-3 opacity-60 grayscale">
									<div className="flex items-center gap-1.5 font-black text-lg text-slate-100 uppercase tracking-tighter">
										<div className="size-4 rounded-full bg-indigo-500" />
										FORMANCE
									</div>
									<div className="h-4 w-px bg-slate-800" />
									<span className="whitespace-nowrap font-bold text-[9px] text-slate-500 uppercase tracking-widest">
										Core Ledger
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
