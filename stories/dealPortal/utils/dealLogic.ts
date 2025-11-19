import { mockDeal } from '../models/mockData'

export enum FairLendRole {
  BROKER = "BROKER",
  BUYER = "BUYER",
  LAWYER = "LAWYER",
  ADMIN = "ADMIN",
  SYSTEM = "SYSTEM",
  BUYER_LAWYER = "BUYER_LAWYER",
}

export enum ActionTypeEnum {
  ESIGN = "ESIGN",
  UPLOAD = "UPLOAD",
  REVIEW = "REVIEW",
  APPROVE = "APPROVE",
  NONE = "NONE",
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
}

export interface ActionAssignment {
  action: ActionTypeEnum
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

// Mock initial documents
export const initialDocuments: Document[] = [
  {
    id: "1",
    name: "Mortgage Commitment",
    group: "mortgage",
    status: "pending",
    requiredAction: ActionTypeEnum.ESIGN,
    assignedTo: "user@example.com",
    assignedToRole: FairLendRole.BUYER,
    isComplete: false
  },
  {
    id: "2",
    name: "ID Verification",
    group: "mortgage",
    status: "pending",
    requiredAction: ActionTypeEnum.UPLOAD,
    assignedTo: "user@example.com",
    assignedToRole: FairLendRole.BUYER,
    isComplete: false
  },
  {
    id: "3",
    name: "Closing Instructions",
    group: "closing",
    status: "pending",
    requiredAction: ActionTypeEnum.REVIEW,
    assignedTo: "lawyer@example.com",
    assignedToRole: FairLendRole.LAWYER,
    isComplete: false
  }
]
