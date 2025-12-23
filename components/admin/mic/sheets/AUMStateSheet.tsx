"use client";

import {
	AlertTriangle,
	CheckCircle2,
	type LucideIcon,
	PlayCircle,
	ToggleLeft,
} from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type AUMState = "active" | "repaid" | "defaulted" | "pending";

type AUMStateSheetProps = {
	/**
	 * Whether the sheet is open
	 */
	open: boolean;
	/**
	 * Callback when the open state changes
	 */
	onOpenChange: (open: boolean) => void;
	/**
	 * Current asset name
	 */
	assetName: string;
	/**
	 * Current state of the asset
	 */
	currentState: AUMState;
	/**
	 * Callback when state is changed
	 */
	onStateChange: (newState: AUMState) => void;
};

const stateConfig: Record<
	AUMState,
	{ label: string; icon: LucideIcon; color: string; description: string }
> = {
	active: {
		label: "Interest Only / Active",
		icon: PlayCircle,
		color: "text-emerald-500 bg-emerald-500/10",
		description: "Asset is currently accruing interest normally.",
	},
	repaid: {
		label: "Fully Repaid",
		icon: CheckCircle2,
		color: "text-indigo-500 bg-indigo-500/10",
		description: "Principal has been returned and asset is closed.",
	},
	defaulted: {
		label: "Defaulted",
		icon: AlertTriangle,
		color: "text-rose-500 bg-rose-500/10",
		description: "Loan is in default. Accrual suspended.",
	},
	pending: {
		label: "Pending Onboarding",
		icon: ToggleLeft,
		color: "text-amber-500 bg-amber-500/10",
		description: "Asset is registered but not yet active in the pool.",
	},
};

/**
 * A critical administrative sheet for managing the lifecycle of MIC mortgage assets.
 * Orchestrates state transitions (e.g., Active -> Repaid) which trigger ledger adjustments.
 */
export function AUMStateSheet({
	open,
	onOpenChange,
	assetName,
	currentState,
	onStateChange,
}: AUMStateSheetProps) {
	const [selectedState, setSelectedState] =
		React.useState<AUMState>(currentState);

	React.useEffect(() => {
		setSelectedState(currentState);
	}, [currentState]);

	const handleSave = () => {
		onStateChange(selectedState);
		onOpenChange(false);
	};

	return (
		<Sheet onOpenChange={onOpenChange} open={open}>
			<SheetContent className="border-none backdrop-blur-xl sm:max-w-md dark:bg-slate-900/95">
				<SheetHeader className="pb-8">
					<div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
						<ToggleLeft className="size-6" />
					</div>
					<SheetTitle className="font-bold text-2xl tracking-tight">
						Manage Asset State
					</SheetTitle>
					<SheetDescription className="font-medium text-muted-foreground/80 text-sm">
						Update the lifecycle status for <strong>{assetName}</strong>.
					</SheetDescription>
				</SheetHeader>

				<div className="flex flex-col gap-6">
					<div className="flex flex-col gap-3">
						<Label className="mb-1 font-bold text-muted-foreground/60 text-xs uppercase tracking-widest">
							Select Target Lifecycle State
						</Label>
						{(Object.keys(stateConfig) as AUMState[]).map((state) => {
							const config = stateConfig[state];
							const Icon = config.icon;
							const isSelected = selectedState === state;

							return (
								<button
									className={cn(
										"flex items-start gap-4 rounded-2xl border p-4 text-left transition-all duration-300",
										isSelected
											? "border-primary bg-primary/5 ring-1 ring-primary/20"
											: "border-border/50 bg-muted/20 opacity-60 grayscale-[0.5] hover:border-border hover:bg-muted/40"
									)}
									key={state}
									onClick={() => setSelectedState(state)}
									type="button"
								>
									<div
										className={cn(
											"mt-0.5 shrink-0 rounded-lg p-2",
											config.color
										)}
									>
										<Icon className="size-5" />
									</div>
									<div className="flex flex-col gap-1">
										<span
											className={cn(
												"font-bold text-sm",
												isSelected ? "text-primary" : "text-foreground"
											)}
										>
											{config.label}
										</span>
										<p className="font-medium text-[11px] text-muted-foreground leading-relaxed">
											{config.description}
										</p>
									</div>
								</button>
							);
						})}
					</div>

					<div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4">
						<p className="font-bold text-[10px] text-amber-700 uppercase leading-relaxed tracking-widest dark:text-amber-400">
							Caution: State transitions may trigger automated ledger entries
							for final interest accrual or principal return.
						</p>
					</div>

					<SheetFooter className="mt-4">
						<SheetClose asChild>
							<Button
								className="border-muted-foreground/20"
								type="button"
								variant="outline"
							>
								Cancel
							</Button>
						</SheetClose>
						<Button
							className="bg-primary shadow-sm hover:bg-primary/90"
							disabled={selectedState === currentState}
							onClick={handleSave}
						>
							Confirm Transition
						</Button>
					</SheetFooter>
				</div>
			</SheetContent>
		</Sheet>
	);
}
