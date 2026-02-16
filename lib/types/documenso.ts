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

export type DocumensoTemplateField = {
	id: number;
	recipientId: number;
	type: string; // "SIGNATURE" | "INITIALS" | "TEXT" | "NAME" | "DATE" | etc.
	fieldMeta?: {
		label?: string;
		placeholder?: string;
		readOnly?: boolean;
		required?: boolean;
		fontSize?: number;
		type?: string;
		text?: string;
		textAlign?: string;
	} | null;
};

export type PrefillField = {
	id: number;
	type: "text" | "number";
	label?: string;
	placeholder?: string;
	value: string;
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
	fields?: DocumensoTemplateField[];
};
