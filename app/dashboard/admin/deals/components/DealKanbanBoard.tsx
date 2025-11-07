/**
 * Deal Kanban Board Component
 *
 * Interactive Kanban board for managing deals. Supports drag-and-drop to
 * transition deals between states. Each column represents a deal state,
 * and each card represents a deal.
 */

"use client";

import { useMutation, useQuery } from "convex/react";
import {
	ArrowLeft,
	ArrowRight,
	Banknote,
	CheckCircle,
	FileSignature,
	GripVertical,
	Lock,
	Scale,
	SearchCheck,
	XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
	canGoBackward,
	canProgressForward,
	DEAL_STATE_COLORS,
	DEAL_STATE_LABELS,
	type Deal,
	type DealStateValue,
	formatDealValue,
	getNextState,
	getPreviousState,
} from "@/lib/types/dealTypes";

// Map state values to icon components
const STATE_ICONS: Record<DealStateValue, typeof Lock> = {
	locked: Lock,
	pending_lawyer: Scale,
	pending_docs: FileSignature,
	pending_transfer: Banknote,
	pending_verification: SearchCheck,
	completed: CheckCircle,
	cancelled: XCircle,
	archived: CheckCircle, // Not shown in Kanban
};

// Extended deal data with related info (for display)
type DealCardData = {
	_id: Id<"deals">;
	currentState: DealStateValue;
	dealValue: number;
	createdAt: number;
	updatedAt: number;
	mortgageAddress?: string;
	investorName?: string;
	daysInState: number;
};

// Kanban column definition
type KanbanColumn = {
	id: DealStateValue;
	title: string;
	color: string;
	deals: DealCardData[];
};

export function DealKanbanBoard() {
	const router = useRouter();
	const [draggedDeal, setDraggedDeal] = useState<{
		deal: DealCardData;
		sourceColumn: DealStateValue;
	} | null>(null);
	const [showTransitionDialog, setShowTransitionDialog] = useState(false);
	const [transitionTarget, setTransitionTarget] = useState<{
		dealId: Id<"deals">;
		fromState: DealStateValue;
		toState: DealStateValue;
		deal: DealCardData;
	} | null>(null);

	// Fetch all active deals
	const dealsData = useQuery(api.deals.getAllActiveDeals);
	const transitionDealState = useMutation(api.deals.transitionDealState);

	// Build columns from deal data
	const columns: KanbanColumn[] = [
		{
			id: "locked",
			title: DEAL_STATE_LABELS.locked,
			color: DEAL_STATE_COLORS.locked,
			deals: [],
		},
		{
			id: "pending_lawyer",
			title: DEAL_STATE_LABELS.pending_lawyer,
			color: DEAL_STATE_COLORS.pending_lawyer,
			deals: [],
		},
		{
			id: "pending_docs",
			title: DEAL_STATE_LABELS.pending_docs,
			color: DEAL_STATE_COLORS.pending_docs,
			deals: [],
		},
		{
			id: "pending_transfer",
			title: DEAL_STATE_LABELS.pending_transfer,
			color: DEAL_STATE_COLORS.pending_transfer,
			deals: [],
		},
		{
			id: "pending_verification",
			title: DEAL_STATE_LABELS.pending_verification,
			color: DEAL_STATE_COLORS.pending_verification,
			deals: [],
		},
		{
			id: "completed",
			title: DEAL_STATE_LABELS.completed,
			color: DEAL_STATE_COLORS.completed,
			deals: [],
		},
		{
			id: "cancelled",
			title: DEAL_STATE_LABELS.cancelled,
			color: DEAL_STATE_COLORS.cancelled,
			deals: [],
		},
	];

	// Populate columns with deals
	if (dealsData) {
		for (const deal of dealsData) {
			const column = columns.find((col) => col.id === deal.currentState);
			if (column) {
				column.deals.push({
					_id: deal._id,
					currentState: deal.currentState as DealStateValue,
					dealValue: deal.dealValue,
					createdAt: deal.createdAt,
					updatedAt: deal.updatedAt,
					daysInState: Math.floor(
						(Date.now() - deal.updatedAt) / (1000 * 60 * 60 * 24)
					),
					// TODO: Fetch related mortgage and investor data
					mortgageAddress: "Loading...", // Placeholder
					investorName: "Loading...", // Placeholder
				});
			}
		}
	}

	const handleDragStart = (deal: DealCardData, columnId: DealStateValue) => {
		setDraggedDeal({ deal, sourceColumn: columnId });
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
	};

	const handleDrop = async (
		e: React.DragEvent,
		targetColumnId: DealStateValue
	) => {
		e.preventDefault();

		if (!draggedDeal) return;

		const { deal, sourceColumn } = draggedDeal;

		// Same column - no transition needed
		if (sourceColumn === targetColumnId) {
			setDraggedDeal(null);
			return;
		}

		// Show confirmation dialog with transition details
		setTransitionTarget({
			dealId: deal._id,
			fromState: sourceColumn,
			toState: targetColumnId,
			deal,
		});
		setShowTransitionDialog(true);
		setDraggedDeal(null);
	};

	const handleTransitionConfirm = async () => {
		if (!transitionTarget) return;

		const { dealId, fromState, toState } = transitionTarget;

		try {
			// Determine the event type based on the transition
			let event: any;

			// Check if this is a forward or backward transition
			const nextState = getNextState(fromState);
			const prevState = getPreviousState(toState);

			if (nextState === toState) {
				// Forward transition
				if (toState === "pending_lawyer") {
					event = { type: "CONFIRM_LAWYER" };
				} else if (toState === "pending_docs") {
					event = { type: "COMPLETE_DOCS" };
				} else if (toState === "pending_transfer") {
					event = { type: "RECEIVE_FUNDS" };
				} else if (toState === "pending_verification") {
					event = { type: "VERIFY_FUNDS" };
				} else if (toState === "completed") {
					event = { type: "COMPLETE_DEAL" };
				} else {
					throw new Error(`Invalid forward transition to ${toState}`);
				}
			} else if (prevState === fromState) {
				// Backward transition
				event = {
					type: "GO_BACK",
					toState,
					notes: "Moved backwards via Kanban board",
				};
			} else {
				throw new Error(`Invalid transition from ${fromState} to ${toState}`);
			}

			await transitionDealState({ dealId, event });

			toast.success("Deal Updated", {
				description: `Deal moved from ${DEAL_STATE_LABELS[fromState]} to ${DEAL_STATE_LABELS[toState]}`,
			});
		} catch (error) {
			console.error("Failed to transition deal:", error);
			toast.error("Failed to Update Deal", {
				description:
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
			});
		} finally {
			setShowTransitionDialog(false);
			setTransitionTarget(null);
		}
	};

	if (!dealsData) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-32 w-full" />
				<Skeleton className="h-32 w-full" />
				<Skeleton className="h-32 w-full" />
			</div>
		);
	}

	return (
		<>
			<div className="flex gap-4 overflow-x-auto pb-4">
				{columns.map((column) => (
					// biome-ignore lint/a11y/noNoninteractiveElementInteractions: Drag-and-drop requires handlers on container div
					<div
						aria-label={`${column.title} column`}
						className="w-80 flex-shrink-0"
						key={column.id}
						onDragOver={handleDragOver}
						onDrop={(e) => handleDrop(e, column.id)}
						role="region"
					>
						<Card className="h-full">
							<CardHeader
								className="pb-3"
								style={{ borderTopColor: column.color, borderTopWidth: "3px" }}
							>
								<div className="flex items-center justify-between">
									<h3 className="font-semibold text-sm">{column.title}</h3>
									<Badge variant="secondary">{column.deals.length}</Badge>
								</div>
							</CardHeader>
							<CardContent className="max-h-[calc(100vh-300px)] space-y-3 overflow-y-auto">
								{column.deals.length === 0 ? (
									<p className="py-8 text-center text-muted-foreground text-sm">
										No deals in this state
									</p>
								) : (
									column.deals.map((deal) => (
										<DealCard
											columnId={column.id}
											deal={deal}
											key={deal._id}
											onClick={() =>
												router.push(`/dashboard/admin/deals/${deal._id}`)
											}
											onDragStart={handleDragStart}
										/>
									))
								)}
							</CardContent>
						</Card>
					</div>
				))}
			</div>

			{/* Transition Confirmation Dialog */}
			<AlertDialog
				onOpenChange={setShowTransitionDialog}
				open={showTransitionDialog}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Confirm State Transition</AlertDialogTitle>
						<AlertDialogDescription className="space-y-2">
							{transitionTarget && (
								<>
									<p>
										You are about to move this deal from{" "}
										<strong>
											{DEAL_STATE_LABELS[transitionTarget.fromState]}
										</strong>{" "}
										to{" "}
										<strong>
											{DEAL_STATE_LABELS[transitionTarget.toState]}
										</strong>
										.
									</p>
									<div className="space-y-1 rounded-md bg-muted p-3 text-sm">
										<p>
											<strong>Property:</strong>{" "}
											{transitionTarget.deal.mortgageAddress}
										</p>
										<p>
											<strong>Investor:</strong>{" "}
											{transitionTarget.deal.investorName}
										</p>
										<p>
											<strong>Deal Value:</strong>{" "}
											{formatDealValue(transitionTarget.deal.dealValue)}
										</p>
									</div>
									<p className="text-muted-foreground text-xs">
										This action will be logged in the deal's audit trail.
									</p>
								</>
							)}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleTransitionConfirm}>
							Confirm Transition
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

/**
 * Individual deal card component
 */
function DealCard({
	deal,
	columnId,
	onDragStart,
	onClick,
}: {
	deal: DealCardData;
	columnId: DealStateValue;
	onDragStart: (deal: DealCardData, columnId: DealStateValue) => void;
	onClick: () => void;
}) {
	const IconComponent = STATE_ICONS[deal.currentState];

	return (
		<Card
			className="cursor-pointer transition-shadow hover:shadow-md"
			draggable
			onClick={onClick}
			onDragStart={() => onDragStart(deal, columnId)}
		>
			<CardContent className="space-y-3 p-4">
				<div className="flex items-start justify-between">
					<div className="flex items-center gap-2">
						<IconComponent className="h-4 w-4 text-muted-foreground" />
						<span className="line-clamp-1 font-medium text-sm">
							{deal.mortgageAddress}
						</span>
					</div>
					<GripVertical className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
				</div>

				<div className="space-y-1 text-muted-foreground text-xs">
					<p>
						<strong>Investor:</strong> {deal.investorName}
					</p>
					<p>
						<strong>Value:</strong> {formatDealValue(deal.dealValue)}
					</p>
					<p>
						<strong>Days in state:</strong> {deal.daysInState}
					</p>
				</div>

				<div className="flex gap-2 pt-2">
					{canGoBackward({ currentState: deal.currentState } as Deal) && (
						<Button
							className="h-7 flex-1 px-2 text-xs"
							onClick={(e) => {
								e.stopPropagation();
								// TODO: Trigger backward transition
								toast.info("Backward transition", {
									description: "This feature is being implemented",
								});
							}}
							size="sm"
							variant="ghost"
						>
							<ArrowLeft className="mr-1 h-3 w-3" />
							Back
						</Button>
					)}
					{canProgressForward({ currentState: deal.currentState } as Deal) && (
						<Button
							className="h-7 flex-1 px-2 text-xs"
							onClick={(e) => {
								e.stopPropagation();
								// TODO: Trigger forward transition
								toast.info("Forward transition", {
									description: "This feature is being implemented",
								});
							}}
							size="sm"
							variant="ghost"
						>
							<ArrowRight className="mr-1 h-3 w-3" />
							Next
						</Button>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
