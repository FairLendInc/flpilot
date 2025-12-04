// Documenso types - shared between server and client

export type DocumensoDocumentStatus =
	| "DRAFT"
	| "PENDING"
	| "COMPLETED"
	| "REJECTED";

export type DocumensoRecipientRole =
	| "SIGNER"
	| "APPROVER"
	| "CC"
	| "ASSISTANT"
	| "VIEWER";

export type DocumensoRecipientSigningStatus =
	| "NOT_SIGNED"
	| "SIGNED"
	| "REJECTED";
export type DocumensoRecipientReadStatus = "NOT_OPENED" | "OPENED";
export type DocumensoRecipientSendStatus = "NOT_SENT" | "SENT";

export type SignatoryOption = {
	id: number;
	email: string;
	name: string;
	token: string;
	role: DocumensoRecipientRole;
	signingStatus: DocumensoRecipientSigningStatus;
	readStatus: DocumensoRecipientReadStatus;
	sendStatus: DocumensoRecipientSendStatus;
	signingOrder: number | null;
	rejectionReason?: string | null;
};

export type DocumensoDocumentSummary = {
	id: number;
	externalId?: string | null;
	title: string;
	status: DocumensoDocumentStatus;
	createdAt: string;
	updatedAt: string;
	completedAt: string | null;
	recipients: SignatoryOption[];
};

export type DocumensoTemplate = {
	id: number;
	title: string;
	externalId?: string | null;
	createdAt: string;
	updatedAt: string;
	recipients?: {
		id: number;
		email: string;
		name: string;
		role: DocumensoRecipientRole;
		signingOrder: number | null;
	}[];
};
