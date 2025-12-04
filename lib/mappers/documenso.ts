import type { DocumensoDocumentSummary } from "@/lib/types/documenso";
import {
	ActionTypeEnum,
	FairLendRole,
} from "@/stories/dealPortal/utils/dealLogic";

/**
 * Map Documenso recipient role to FairLendRole
 */
export function mapRole(role: string): FairLendRole {
	switch (role) {
		case "SIGNER":
			return FairLendRole.BUYER;
		case "APPROVER":
			return FairLendRole.LAWYER;
		case "VIEWER":
			return FairLendRole.BROKER;
		default:
			return FairLendRole.NONE;
	}
}

/**
 * Map Documenso document to DealPortal document format
 * Uses dynamic document categorization instead of hardcoded groups
 */
export function mapDocumensoToDocument(
	doc: DocumensoDocumentSummary,
	resolvedGroup?: {
		group: string;
		displayName: string;
		icon?: string;
		color?: string;
		resolutionMethod: string;
	}
) {
	const pendingRecipient = doc.recipients
		.sort((a, b) => (a.signingOrder ?? 0) - (b.signingOrder ?? 0))
		.find((r) => r.signingStatus !== "SIGNED");

	let requiredAction = ActionTypeEnum.NONE;
	if (pendingRecipient) {
		if (pendingRecipient.role === "SIGNER")
			requiredAction = ActionTypeEnum.ESIGN;
		else if (pendingRecipient.role === "APPROVER")
			requiredAction = ActionTypeEnum.APPROVE;
		else requiredAction = ActionTypeEnum.REVIEW;
	} else if (doc.status === "COMPLETED") {
		requiredAction = ActionTypeEnum.COMPLETE;
	}

	// Use dynamic group resolution if provided, otherwise use fallback
	const documentGroup = resolvedGroup?.group || "other";
	const groupDisplayName = resolvedGroup?.displayName || "Other";

	return {
		id: String(doc.id),
		name: doc.title,
		group: documentGroup,
		groupDisplayName,
		status: doc.status,
		requiredAction,
		assignedTo: pendingRecipient?.email || "",
		assignedToRole: pendingRecipient
			? mapRole(pendingRecipient.role)
			: FairLendRole.NONE,
		isComplete: doc.status === "COMPLETED",
		recipientTokens: Object.fromEntries(
			doc.recipients.filter((r) => r.token).map((r) => [r.email, r.token])
		),
		recipientStatus: Object.fromEntries(
			doc.recipients.map((r) => [r.email, r.signingStatus])
		),
		signingSteps: doc.recipients
			.sort((a, b) => (a.signingOrder ?? 0) - (b.signingOrder ?? 0))
			.map((r) => ({
				email: r.email,
				name: r.name,
				role: mapRole(r.role),
				status: r.signingStatus,
				order: r.signingOrder ?? 0,
			})),
	};
}

/**
 * Legacy version for backward compatibility - defaults to "other" group
 * @deprecated Use mapDocumensoToDocument with resolvedGroup parameter
 */
export function mapDocumensoToDocumentLegacy(doc: DocumensoDocumentSummary) {
	return mapDocumensoToDocument(doc, {
		group: "other",
		displayName: "Other",
		resolutionMethod: "legacy_fallback",
	});
}

/**
 * Extract users from Documenso recipients
 */
export function extractUsers(doc: DocumensoDocumentSummary) {
	return doc.recipients.map((r) => ({
		id: String(r.id),
		email: r.email,
		name: r.name,
		role: mapRole(r.role),
	}));
}
