/**
 * Shared Deal Management Types
 *
 * These types are exported from the backend state machine and shared with
 * the frontend for type-safe deal management. The frontend NEVER imports
 * the state machine logic itself - only the types.
 */

import type { Doc, Id } from "@/convex/_generated/dataModel";
import type { DealStateValue } from "@/convex/dealStateMachine";

// Re-export state machine types from backend
export type {
	DealContext,
	DealEvent,
	DealStateValue,
} from "@/convex/dealStateMachine";

import {
	canCancelFromState,
	getNextState,
	getPreviousState,
	isTerminalState,
} from "@/convex/dealStateMachine";

export {
	canCancelFromState,
	DEAL_STATES,
	getNextState,
	getPreviousState,
	isOwnershipReviewState,
	isTerminalState,
} from "@/convex/dealStateMachine";

/**
 * Full deal document from Convex including all fields
 */
export type Deal = Doc<"deals">;

/**
 * Alert document from Convex
 */
export type Alert = Doc<"alerts">;

/**
 * Alert severity levels
 */
export type AlertSeverity = "info" | "warning" | "error";

/**
 * Alert types
 */
export type AlertType =
	| "deal_created"
	| "deal_state_changed"
	| "deal_completed"
	| "deal_cancelled"
	| "deal_stuck"
	| "ownership_review_required"
	| "ownership_transfer_rejected"
	| "manual_resolution_required";

/**
 * Get user-friendly label for an alert type
 */
export function getAlertTypeLabel(type: AlertType): string {
	const labels: Record<AlertType, string> = {
		deal_created: "Deal Created",
		deal_state_changed: "State Changed",
		deal_completed: "Deal Completed",
		deal_cancelled: "Deal Cancelled",
		deal_stuck: "Deal Stuck",
		ownership_review_required: "Ownership Review Required",
		ownership_transfer_rejected: "Transfer Rejected",
		manual_resolution_required: "Manual Resolution Required",
	};
	return labels[type] || type;
}

/**
 * Get icon name for an alert type (for use with lucide-react)
 */
export function getAlertTypeIcon(type: AlertType): string {
	const icons: Record<AlertType, string> = {
		deal_created: "PlusCircle",
		deal_state_changed: "ArrowRightCircle",
		deal_completed: "CheckCircle",
		deal_cancelled: "XCircle",
		deal_stuck: "AlertCircle",
		ownership_review_required: "ClipboardCheck",
		ownership_transfer_rejected: "XOctagon",
		manual_resolution_required: "AlertTriangle",
	};
	return icons[type] || "Bell";
}

/**
 * Get color class for alert severity
 */
export function getAlertSeverityColor(severity: AlertSeverity): string {
	const colors: Record<AlertSeverity, string> = {
		info: "text-blue-600 bg-blue-50",
		warning: "text-yellow-600 bg-yellow-50",
		error: "text-red-600 bg-red-50",
	};
	return colors[severity] || "text-gray-600 bg-gray-50";
}

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export function getTimeAgo(timestamp: number): string {
	const now = Date.now();
	const diff = now - timestamp;
	const minutes = Math.floor(diff / (1000 * 60));
	const hours = Math.floor(diff / (1000 * 60 * 60));
	const days = Math.floor(diff / (1000 * 60 * 60 * 24));

	if (minutes < 1) return "Just now";
	if (minutes < 60) return `${minutes}m ago`;
	if (hours < 24) return `${hours}h ago`;
	if (days < 7) return `${days}d ago`;
	return new Date(timestamp).toLocaleDateString();
}

/**
 * Deal with related entity data (joined query result)
 */
export type DealWithDetails = {
	deal: Deal;
	lockRequest: Doc<"lock_requests"> | null;
	listing: Doc<"listings"> | null;
	mortgage: {
		_id: Id<"mortgages">;
		loanAmount: number;
		interestRate: number;
		address: {
			street: string;
			city: string;
			state: string;
			zip: string;
			country: string;
		};
		propertyType: string;
	} | null;
	investor: {
		_id: Id<"users">;
		email: string;
		first_name?: string;
		last_name?: string;
	} | null;
};

/**
 * Human-readable labels for deal states (for UI display)
 */
export const DEAL_STATE_LABELS: Record<DealStateValue, string> = {
	locked: "Locked",
	pending_lawyer: "Pending Lawyer Confirmation",
	pending_docs: "Pending Document Signing",
	pending_transfer: "Pending Fund Transfer",
	pending_verification: "Pending Fund Verification",
	pending_ownership_review: "Ownership Review",
	completed: "Deal Completed",
	cancelled: "Cancelled",
	archived: "Archived",
};

/**
 * Colors for deal states (Kanban board styling)
 */
export const DEAL_STATE_COLORS: Record<DealStateValue, string> = {
	locked: "#8B7355", // Brown
	pending_lawyer: "#CD853F", // Peru
	pending_docs: "#DAA520", // Goldenrod
	pending_transfer: "#6B8E23", // Olive green
	pending_verification: "#556B2F", // Dark olive green
	pending_ownership_review: "#4169E1", // Royal blue - distinct for review step
	completed: "#228B22", // Forest green
	cancelled: "#8B4513", // Saddle brown
	archived: "#696969", // Dim gray
};

/**
 * Icons for deal states (Lucide icon names)
 */
export const DEAL_STATE_ICONS: Record<DealStateValue, string> = {
	locked: "lock",
	pending_lawyer: "scale",
	pending_docs: "file-signature",
	pending_transfer: "banknote",
	pending_verification: "search-check",
	pending_ownership_review: "clipboard-check",
	completed: "check-circle",
	cancelled: "x-circle",
	archived: "archive",
};

/**
 * Investor-facing labels for deal states (simpler, user-friendly)
 * Used in the deal portal for investor view
 */
export const DEAL_STATE_LABELS_INVESTOR: Record<DealStateValue, string> = {
	locked: "Reserved",
	pending_lawyer: "Awaiting Legal Review",
	pending_docs: "Documents Ready for Signing",
	pending_transfer: "Awaiting Payment",
	pending_verification: "Payment Being Verified",
	pending_ownership_review: "Finalizing Transfer",
	completed: "Complete",
	cancelled: "Cancelled",
	archived: "Archived",
};

/**
 * Helper function to format deal value as currency
 */
export function formatDealValue(value: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value);
}

/**
 * Helper function to calculate days in current state
 */
export function getDaysInState(deal: Deal): number {
	const lastTransition = deal.stateHistory?.at(-1);
	if (!lastTransition) {
		// Use creation time if no transitions yet
		return Math.floor((Date.now() - deal.createdAt) / (1000 * 60 * 60 * 24));
	}
	return Math.floor(
		(Date.now() - lastTransition.timestamp) / (1000 * 60 * 60 * 24)
	);
}

/**
 * Check if deal can progress forward
 */
export function canProgressForward(deal: Deal): boolean {
	if (!deal.currentState) return false;
	return (
		getNextState(deal.currentState) !== null &&
		!isTerminalState(deal.currentState)
	);
}

/**
 * Check if deal can move backward
 */
export function canGoBackward(deal: Deal): boolean {
	if (!deal.currentState) return false;
	return getPreviousState(deal.currentState) !== null;
}

/**
 * Check if deal can be cancelled
 */
export function canCancel(deal: Deal): boolean {
	if (!deal.currentState) return false;
	return canCancelFromState(deal.currentState);
}

/**
 * Check if deal can be archived
 */
export function canArchive(deal: Deal): boolean {
	return deal.currentState === "completed" || deal.currentState === "cancelled";
}

/**
 * Check if ownership can be transferred
 */
export function canTransferOwnership(deal: Deal): boolean {
	return deal.currentState === "completed" && !deal.completedAt;
}
