import { FairLendRole } from "../../../utils/dealLogic"

export type RoleType = FairLendRole

export interface RoleAssignment {
  userId: string
  userEmail: string
  userName: string
  role: RoleType
  signingLink: string
  signingOrder: number // Order in which this user should sign/act (1, 2, 3, etc.)
}

export interface Document {
  id: string
  name: string
  group: string
  roleAssignments: RoleAssignment[]
  // Document workflow requirements
  requiresBuyerLawyerApproval?: boolean
  requiresBuyerSignature?: boolean
  requiresBrokerApproval?: boolean
  requiredBrokerSignature?: boolean
  requiredPrepare?: boolean
  eSign?: boolean
  requiredUpload?: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface User {
  id: string
  email: string
  name: string
}

// Helper type for role labels
export const RoleLabels: Record<RoleType, string> = {
  [FairLendRole.BUYER_LAWYER]: "Buyer's Lawyer",
  [FairLendRole.BUYER]: "Buyer",
  [FairLendRole.ADMIN]: "Admin",
  [FairLendRole.BROKER]: "Broker",
  [FairLendRole.SYSTEM]: "System",
  [FairLendRole.NONE]: "None",
}
