export interface DocumensoRecipient {
  id: number;
  email: string;
  name: string;
  role: "SIGNER" | "APPROVER" | "VIEWER";
  signingStatus: "NOT_SIGNED" | "SIGNED" | "REJECTED";
  signingOrder: number;
  token: string;
}

export interface DocumensoField {
  id: number;
  type: "SIGNATURE" | "INITIALS" | "DATE" | "TEXT" | "NAME" | "EMAIL" | "CHECKBOX" | "RADIO" | "DROPDOWN";
  recipientId: number;
  page: number;
  inserted: boolean;
}

export interface DocumensoDocument {
  id: number;
  title: string;
  status: "DRAFT" | "PENDING" | "COMPLETED" | "ARCHIVED";
  externalId: string | null;
  recipients: DocumensoRecipient[];
  fields: DocumensoField[];
  createdAt: string;
  updatedAt: string;
  documentData?: {
    data: string; // S3 path or similar
  };
}
