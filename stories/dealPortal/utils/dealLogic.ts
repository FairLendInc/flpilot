

export enum FairLendRole {
  BROKER = "BROKER",
  BUYER = "BUYER",
  LAWYER = "LAWYER",
  ADMIN = "ADMIN",
  SYSTEM = "SYSTEM",
  BUYER_LAWYER = "BUYER_LAWYER",
  NONE = "NONE",
}

export enum ActionTypeEnum {
  ESIGN = "ESIGN",
  UPLOAD = "UPLOAD",
  REVIEW = "REVIEW",
  APPROVE = "APPROVE",
  NONE = "NONE",
  COMPLETE = "COMPLETE",
  VIEW = "VIEW",
  PREPARE = "PREPARE",
  DISPUTE = "DISPUTE",
  UPLOAD_SIGNED = "UPLOAD_SIGNED",

}

export interface User {
  id: string
  email: string
  name: string
  role: FairLendRole
}

export interface Document {
  id: string
  name: string
  group: string
  status: string
  requiredAction: ActionTypeEnum
  assignedTo?: string // email
  assignedToRole?: FairLendRole
  isComplete: boolean
  blocked?: boolean
  fileData?: string
  recipientTokens?: Record<string, string>
  recipientStatus?: Record<string, string>
  signingSteps?: Array<{
    email: string
    name: string
    role: FairLendRole
    status: string
    order: number
  }>
  requirements?: {
    requiredBrokerSignature?: boolean
    requiresBuyerSignature?: boolean
    requiredPrepare?: boolean
    requiresBuyerLawyerApproval?: boolean
    requiresBrokerApproval?: boolean
    eSign?: boolean
    requiredUpload?: boolean
  }
  bucketPath?: string
  actionHistory?: any
  nextAction?: any
}

export interface ActionAssignment {
  action: ActionTypeEnum
  type: ActionTypeEnum
  assignedTo: string
  completedAt?: Date
  assignedToEmail: string
  assignedToName: string
  assignedToRole: FairLendRole
  docName: string
  docId: string
  docGroup: string
  doc: Document
}

export const calculateGroupStatus = (documents: Document[], groupId: string) => {
  const groupDocs = documents.filter(d => d.group === groupId)
  if (groupDocs.length === 0) return { percent: 0, status: "Not Started" }

  const completed = groupDocs.filter(d => d.isComplete).length
  const percent = Math.round((completed / groupDocs.length) * 100)

  let status = "In Progress"
  if (percent === 100) status = "Completed"
  if (percent === 0) status = "Not Started"

  return { percent, status }
}

export const getQuickActionsForUser = (documents: Document[], userEmail: string): ActionAssignment[] => {
  return documents
    .filter(doc => !doc.isComplete && doc.assignedTo === userEmail)
    .map(doc => ({
      action: doc.requiredAction,
      type: doc.requiredAction,
      assignedTo: userEmail,
      assignedToEmail: userEmail,
      assignedToName: "Current User", // Placeholder
      assignedToRole: doc.assignedToRole || FairLendRole.BUYER,
      docName: doc.name,
      docId: doc.id,
      docGroup: doc.group,
      doc: doc
    }))
}

export const getDocState = (doc: Document) => {
  return {
    action: doc.requiredAction,
    curIndex: 0,
    actionSteps: [],
    isComplete: doc.isComplete,
  }
}

export const getGroupActionSteps = (documents: Document[], groupId: string) => {
  const groupDocs = documents.filter(d => d.group === groupId)
  const steps = groupDocs.map(d => `${d.name}: ${d.isComplete ? 'Complete' : 'Pending'}`)
  return {
    steps,
    completedIndex: groupDocs.filter(d => d.isComplete).length,
    groupSteps: []
  }
}

export const getActionStatusText = (doc: Document, userEmail: string) => {
  if (doc.isComplete) return "Document Complete"
  if (doc.assignedTo === userEmail) return `Required Action: ${doc.requiredAction}`
  return `Awaiting ${doc.assignedTo}`
}

export const getActionStatusColor = (status: string) => {
  if (status.startsWith("Required Action")) return "text-destructive"
  if (status.startsWith("Awaiting")) return "text-chart-3"
  if (status === "Document Complete") return "text-foreground"
  return "text-muted-foreground"
}

export const requiresSignature = (doc: Document, userEmail: string) => {
  return doc.requiredAction === ActionTypeEnum.ESIGN && doc.assignedTo === userEmail
}

// Removed mockDeal import
// Removed initialDocuments export
