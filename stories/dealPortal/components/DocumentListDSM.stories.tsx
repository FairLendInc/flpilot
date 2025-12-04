import { DocumentListDSM } from "./DocumentListDSM"
import { StoreDecorator } from "../utils/StoreDecorator"
import { ActionTypeEnum, FairLendRole } from "../utils/dealLogic"
import type { Document, User } from "../utils/dealLogic"
import type { Meta, StoryObj } from "@storybook/react"

const meta: Meta<typeof DocumentListDSM> = {
  title: "DealPortal/Documents/DocumentListDSM",
  component: DocumentListDSM,
  decorators: [StoreDecorator],
}

export default meta
type Story = StoryObj<typeof DocumentListDSM>

const mockUsers: User[] = [
  { id: "1", email: "buyer@example.com", name: "John Buyer", role: FairLendRole.BUYER },
  { id: "2", email: "lawyer@example.com", name: "Jane Lawyer", role: FairLendRole.LAWYER },
  { id: "3", email: "broker@example.com", name: "Bob Broker", role: FairLendRole.BROKER },
]

const createMockDocument = (overrides: Partial<Document>): Document => ({
  id: "doc-1",
  name: "Mortgage Agreement",
  group: "mortgage",
  status: "PENDING",
  requiredAction: ActionTypeEnum.ESIGN,
  assignedTo: "buyer@example.com",
  assignedToRole: FairLendRole.BUYER,
  isComplete: false,
  blocked: false,
  recipientTokens: { "buyer@example.com": "token-123" },
  recipientStatus: { "buyer@example.com": "NOT_SIGNED", "lawyer@example.com": "NOT_SIGNED", "broker@example.com": "NOT_SIGNED" },
  signingSteps: [
    { email: "lawyer@example.com", name: "Jane Lawyer", role: FairLendRole.LAWYER, status: "NOT_SIGNED", order: 1 },
    { email: "buyer@example.com", name: "John Buyer", role: FairLendRole.BUYER, status: "NOT_SIGNED", order: 2 },
    { email: "broker@example.com", name: "Bob Broker", role: FairLendRole.BROKER, status: "NOT_SIGNED", order: 3 },
  ],
  ...overrides,
})

export const Default: Story = {
  parameters: {
    mockState: {
      userRole: FairLendRole.BUYER,
      users: mockUsers,
      currentUser: mockUsers[0],
      documents: [
        createMockDocument({}),
        createMockDocument({
          id: "doc-2",
          name: "Disclosure Form",
          status: "COMPLETED",
          requiredAction: ActionTypeEnum.COMPLETE,
          isComplete: true,
        }),
        createMockDocument({
          id: "doc-3",
          name: "Property Appraisal",
          group: "appraisal",
        }),
      ],
    },
  },
}

export const NoDocuments: Story = {
  name: "No Documents",
  parameters: {
    mockState: {
      userRole: FairLendRole.BUYER,
      users: mockUsers,
      documents: [],
    },
  },
}

export const SingleDocument: Story = {
  name: "Single Document",
  parameters: {
    mockState: {
      userRole: FairLendRole.BUYER,
      users: mockUsers,
      currentUser: mockUsers[0],
      documents: [createMockDocument({})],
    },
  },
}

export const AllPending: Story = {
  name: "All Pending Signature",
  parameters: {
    mockState: {
      userRole: FairLendRole.BUYER,
      users: mockUsers,
      currentUser: mockUsers[0],
      documents: [
        createMockDocument({ id: "doc-1", name: "Mortgage Agreement" }),
        createMockDocument({ id: "doc-2", name: "Disclosure Form" }),
        createMockDocument({ id: "doc-3", name: "Property Deed" }),
      ],
    },
  },
}

export const AllCompleted: Story = {
  name: "All Completed",
  parameters: {
    mockState: {
      userRole: FairLendRole.BUYER,
      users: mockUsers,
      documents: [
        createMockDocument({
          id: "doc-1",
          name: "Mortgage Agreement",
          status: "COMPLETED",
          requiredAction: ActionTypeEnum.COMPLETE,
          isComplete: true,
          recipientStatus: { "buyer@example.com": "SIGNED" },
        }),
        createMockDocument({
          id: "doc-2",
          name: "Disclosure Form",
          status: "COMPLETED",
          requiredAction: ActionTypeEnum.COMPLETE,
          isComplete: true,
          recipientStatus: { "buyer@example.com": "SIGNED" },
        }),
      ],
    },
  },
}

export const MixedStatus: Story = {
  name: "Mixed Status",
  parameters: {
    mockState: {
      userRole: FairLendRole.BUYER,
      users: mockUsers,
      currentUser: mockUsers[0],
      documents: [
        createMockDocument({
          id: "doc-1",
          name: "Mortgage Agreement",
          status: "COMPLETED",
          isComplete: true,
          recipientStatus: { "buyer@example.com": "SIGNED" },
        }),
        createMockDocument({
          id: "doc-2",
          name: "Disclosure Form",
          status: "PENDING",
          isComplete: false,
          recipientStatus: { "buyer@example.com": "NOT_SIGNED" },
        }),
        createMockDocument({
          id: "doc-3",
          name: "Title Insurance",
          status: "REJECTED",
          isComplete: false,
          blocked: true,
          recipientStatus: { "buyer@example.com": "REJECTED" },
        }),
      ],
    },
  },
}

export const MultipleGroups: Story = {
  name: "Multiple Document Groups",
  parameters: {
    mockState: {
      userRole: FairLendRole.BUYER,
      users: mockUsers,
      documents: [
        createMockDocument({ id: "doc-1", name: "Mortgage Agreement", group: "mortgage" }),
        createMockDocument({ id: "doc-2", name: "Mortgage Disclosure", group: "mortgage" }),
        createMockDocument({ id: "doc-3", name: "Property Appraisal", group: "appraisal" }),
        createMockDocument({ id: "doc-4", name: "Title Search", group: "legal" }),
        createMockDocument({ id: "doc-5", name: "Insurance Cert", group: "insurance", status: "COMPLETED", isComplete: true }),
      ],
    },
  },
}

export const LawyerView: Story = {
  name: "Lawyer View - Needs Approval",
  parameters: {
    mockState: {
      userRole: FairLendRole.LAWYER,
      users: mockUsers,
      currentUser: mockUsers[1],
      documents: [
        createMockDocument({
          id: "doc-1",
          name: "Legal Review Document",
          requiredAction: ActionTypeEnum.APPROVE,
          assignedTo: "lawyer@example.com",
          assignedToRole: FairLendRole.LAWYER,
        }),
        createMockDocument({
          id: "doc-2",
          name: "Contract Amendment",
          requiredAction: ActionTypeEnum.APPROVE,
          assignedTo: "lawyer@example.com",
          assignedToRole: FairLendRole.LAWYER,
        }),
      ],
    },
  },
}

export const BrokerView: Story = {
  name: "Broker View - Needs Review",
  parameters: {
    mockState: {
      userRole: FairLendRole.BROKER,
      users: mockUsers,
      currentUser: mockUsers[2],
      documents: [
        createMockDocument({
          id: "doc-1",
          name: "Commission Agreement",
          requiredAction: ActionTypeEnum.REVIEW,
          assignedTo: "broker@example.com",
          assignedToRole: FairLendRole.BROKER,
        }),
      ],
    },
  },
}
