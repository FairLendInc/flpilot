import { Document, ActionTypeEnum, FairLendRole } from "./dealLogic";
import { DocumensoDocument, DocumensoRecipient } from "../models/documenso";

export const mapDocumensoToDealDocuments = (
  documensoData: DocumensoDocument,
  currentUserEmail: string
): Document[] => {
  // In a real scenario, we might have multiple documents or map one Documenso document to one internal Document.
  // Here we map the single root document.

  const doc: Document = {
    id: String(documensoData.id),
    name: documensoData.title,
    group: "mortgage", // Defaulting to mortgage for now as per requirements/mock context
    status: documensoData.status,
    requiredAction: ActionTypeEnum.NONE,
    assignedTo: "",
    assignedToRole: FairLendRole.NONE,
    isComplete: documensoData.status === "COMPLETED",
    fileData: documensoData.documentData?.data,
    recipientTokens: documensoData.recipients.reduce((acc, recipient) => {
      if (recipient.token) {
        acc[recipient.email] = recipient.token;
      }
      return acc;
    }, {} as Record<string, string>),
    recipientStatus: documensoData.recipients.reduce((acc, recipient) => {
      acc[recipient.email] = recipient.signingStatus;
      return acc;
    }, {} as Record<string, string>),
  };

  // Determine required action and assignee
  // We look for the first recipient who hasn't signed/completed their action
  const pendingRecipient = documensoData.recipients
    .sort((a, b) => a.signingOrder - b.signingOrder)
    .find((r) => r.signingStatus !== "SIGNED");

  if (pendingRecipient) {
    doc.assignedTo = pendingRecipient.email;
    doc.assignedToRole = mapDocumensoRoleToFairLendRole(pendingRecipient.role);
    
    // Determine action type based on role and fields
    // For simplicity, if they are a signer, it's ESIGN. If approver, APPROVE.
    if (pendingRecipient.role === "SIGNER") {
      doc.requiredAction = ActionTypeEnum.ESIGN;
    } else if (pendingRecipient.role === "APPROVER") {
      doc.requiredAction = ActionTypeEnum.APPROVE;
    } else {
      doc.requiredAction = ActionTypeEnum.REVIEW;
    }
  } else {
    // No pending recipient, check if document is actually complete
    if (documensoData.status === "COMPLETED") {
        doc.requiredAction = ActionTypeEnum.COMPLETE;
    }
  }

  return [doc];
};

const mapDocumensoRoleToFairLendRole = (role: string): FairLendRole => {
  switch (role) {
    case "SIGNER":
      return FairLendRole.BUYER; // Defaulting to Buyer for signers in this context
    case "APPROVER":
      return FairLendRole.LAWYER; // Defaulting to Lawyer for approvers
    case "VIEWER":
      return FairLendRole.BROKER;
    default:
      return FairLendRole.NONE;
  }
};

export const extractUsersFromDocumensoData = (documensoData: DocumensoDocument): any[] => {
  const users = new Map<string, any>();

  documensoData.recipients.forEach((recipient) => {
    if (!users.has(recipient.email)) {
      users.set(recipient.email, {
        id: String(recipient.id),
        email: recipient.email,
        name: recipient.name,
        role: mapDocumensoRoleToFairLendRole(recipient.role),
      });
    }
  });

  return Array.from(users.values());
};
