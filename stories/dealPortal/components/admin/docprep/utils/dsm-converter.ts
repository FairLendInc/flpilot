import { type Document as DocPrepDocument } from "../types"
import { ActionTypeEnum as ActionType, FairLendRole as RoleType } from "@/stories/dealPortal/utils/dealLogic"
import type { Document as DSMDocument } from "@/stories/dealPortal/utils/dealLogic"

/**
 * Converts a DocPrep Document to a DSM Document
 */
export function createDSMDocument(docPrepDoc: DocPrepDocument): DSMDocument {
  const actionHistory: Array<{ type: ActionType; performedBy: RoleType; timestamp: string }> = []

  // If eSign is enabled, consider the document as already uploaded by SYSTEM
  if (docPrepDoc.eSign) {
    actionHistory.push({
      type: ActionType.UPLOAD,
      performedBy: RoleType.SYSTEM,
      timestamp: new Date().toISOString(),
    })
  }

  // Determine the correct next action
  const nextActionType = getNextActionType(docPrepDoc)
  const nextAssignee = getNextAssignee(docPrepDoc)

  const dsmDoc: DSMDocument = {
    id: docPrepDoc.id,
    name: docPrepDoc.name,
    bucketPath: `documents/${docPrepDoc.group}/${docPrepDoc.id}`,
    group: docPrepDoc.group,
    status: "pending",
    requiredAction: ActionType.PREPARE,
    isComplete: false,
    requirements: {
      requiredPrepare: docPrepDoc.requiredPrepare ?? false,
      requiresBuyerLawyerApproval: docPrepDoc.requiresBuyerLawyerApproval ?? false,
      requiresBuyerSignature: docPrepDoc.requiresBuyerSignature ?? false,
      requiresBrokerApproval: docPrepDoc.requiresBrokerApproval ?? false,
      requiredBrokerSignature: docPrepDoc.requiredBrokerSignature ?? false,
      eSign: docPrepDoc.eSign ?? true,
      requiredUpload: docPrepDoc.requiredUpload ?? false,
    },
    actionHistory,
    nextAction: {
      type: nextActionType,
      assignedTo: nextAssignee,
    },
  }

  return dsmDoc
}

/**
 * Determines the next action type based on document requirements and current state
 */
function getNextActionType(docPrepDoc: DocPrepDocument): ActionType {
  // If eSign is enabled, document is already uploaded, so determine next step
  if (docPrepDoc.eSign) {
    // Check role assignments for the next step in signing order
    const sortedAssignments = docPrepDoc.roleAssignments.sort((a, b) => a.signingOrder - b.signingOrder)

    if (sortedAssignments.length > 0) {
      const firstAssignment = sortedAssignments[0]
      if (firstAssignment) {
        // Determine action based on role and requirements
        if (firstAssignment.role === RoleType.BUYER_LAWYER && docPrepDoc.requiresBuyerLawyerApproval) {
          return ActionType.APPROVE
        }
        if (firstAssignment.role === RoleType.BROKER && docPrepDoc.requiresBrokerApproval) {
          return ActionType.APPROVE
        }
        if (firstAssignment.role === RoleType.BUYER && docPrepDoc.requiresBuyerSignature) {
          return ActionType.ESIGN
        }
        if (firstAssignment.role === RoleType.BROKER && docPrepDoc.requiredBrokerSignature) {
          return ActionType.ESIGN
        }
      }
    }

    // Fallback to requirements-based logic
    if (docPrepDoc.requiresBuyerLawyerApproval) {
      return ActionType.APPROVE
    }
    if (docPrepDoc.requiresBrokerApproval) {
      return ActionType.APPROVE
    }
    if (docPrepDoc.requiresBuyerSignature) {
      return ActionType.ESIGN
    }
    if (docPrepDoc.requiredBrokerSignature) {
      return ActionType.ESIGN
    }

    return ActionType.COMPLETE
  }

  // For non-eSign documents, first action is upload
  return ActionType.UPLOAD
}

/**
 * Determines the next assignee based on document requirements and current state
 */
function getNextAssignee(docPrepDoc: DocPrepDocument): RoleType {
  // If eSign is enabled, determine who should act next after automatic upload
  if (docPrepDoc.eSign) {
    // Check role assignments and their signing order for the next step
    const sortedAssignments = docPrepDoc.roleAssignments.sort((a, b) => a.signingOrder - b.signingOrder)

    if (sortedAssignments.length > 0) {
      const firstAssignment = sortedAssignments[0]
      if (firstAssignment) {
        return firstAssignment.role
      }
    }

    // Fallback to requirements-based logic for next step after upload
    if (docPrepDoc.requiresBuyerLawyerApproval) {
      return RoleType.BUYER_LAWYER
    }
    if (docPrepDoc.requiresBrokerApproval) {
      return RoleType.BROKER
    }
    if (docPrepDoc.requiresBuyerSignature) {
      return RoleType.BUYER
    }
    if (docPrepDoc.requiredBrokerSignature) {
      return RoleType.BROKER
    }

    return RoleType.SYSTEM // Document is complete
  }

  // For non-eSign documents, broker typically handles uploads
  return RoleType.BROKER
}

/**
 * Determines the initial assignee based on the document requirements (legacy function)
 * @deprecated Use getNextAssignee instead
 */
function getInitialAssignee(docPrepDoc: DocPrepDocument): RoleType {
  return getNextAssignee(docPrepDoc)
}

/**
 * Generates the workflow sequence based on document requirements
 */
function generateWorkflow(docPrepDoc: DocPrepDocument): Array<{ role: RoleType; action: ActionType }> {
  const workflow: Array<{ role: RoleType; action: ActionType }> = []

  // Use role assignments to determine workflow order
  const sortedAssignments = docPrepDoc.roleAssignments.sort((a, b) => a.signingOrder - b.signingOrder)

  for (const assignment of sortedAssignments) {
    // Determine action type based on requirements and role
    let actionType = ActionType.UPLOAD

    if (assignment.role === RoleType.BUYER_LAWYER && docPrepDoc.requiresBuyerLawyerApproval) {
      actionType = ActionType.APPROVE
    } else if (assignment.role === RoleType.BROKER && docPrepDoc.requiresBrokerApproval) {
      actionType = ActionType.APPROVE
    } else if (assignment.role === RoleType.BUYER && docPrepDoc.requiresBuyerSignature) {
      actionType = docPrepDoc.eSign ? ActionType.ESIGN : ActionType.UPLOAD_SIGNED
    } else if (assignment.role === RoleType.BROKER && docPrepDoc.requiredBrokerSignature) {
      actionType = docPrepDoc.eSign ? ActionType.ESIGN : ActionType.UPLOAD_SIGNED
    } else if (docPrepDoc.requiredUpload) {
      actionType = ActionType.UPLOAD
    }

    workflow.push({
      role: assignment.role,
      action: actionType,
    })
  }

  // Add completion step
  workflow.push({
    role: RoleType.SYSTEM,
    action: ActionType.COMPLETE,
  })

  return workflow
}

/**
 * Converts a DSM Document back to a DocPrep Document (for editing)
 */
export function convertDSMToDocPrep(dsmDoc: DSMDocument): DocPrepDocument {
  return {
    id: dsmDoc.id,
    name: dsmDoc.name,
    group: dsmDoc.group,
    roleAssignments: [], // This would need to be populated from user assignments
    requiresBuyerLawyerApproval: false,
    requiresBuyerSignature: false,
    requiresBrokerApproval: false,
    requiredBrokerSignature: false,
    eSign: false,
    requiredUpload: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * Maps role assignments to user IDs for document access control
 * Returns a mapping of user emails to their assigned roles and signing links
 */
export function extractUserRoleMapping(docPrepDoc: DocPrepDocument) {
  return docPrepDoc.roleAssignments.reduce(
    (acc, assignment) => {
      acc[assignment.userEmail] = {
        role: assignment.role,
        signingLink: assignment.signingLink,
        signingOrder: assignment.signingOrder,
        userName: assignment.userName,
      }
      return acc
    },
    {} as Record<
      string,
      {
        role: string
        signingLink: string
        signingOrder: number
        userName: string
      }
    >
  )
}

/**
 * Gets the signing order for all users in a document
 * Returns users sorted by their signing order
 */
export function getSigningOrderList(docPrepDoc: DocPrepDocument) {
  return docPrepDoc.roleAssignments
    .sort((a, b) => a.signingOrder - b.signingOrder)
    .map((assignment) => ({
      userEmail: assignment.userEmail,
      userName: assignment.userName,
      role: assignment.role,
      signingOrder: assignment.signingOrder,
      signingLink: assignment.signingLink,
    }))
}
