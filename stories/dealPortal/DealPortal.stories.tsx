import { DSMPortalContent } from "./DealPortal"
import { ActionTypeEnum, FairLendRole } from "./utils/dealLogic"
import type { Document, User } from "./utils/dealLogic"
import { StoreDecorator } from "./utils/StoreDecorator"
import type { Meta, StoryObj } from "@storybook/react"

const meta: Meta<typeof DSMPortalContent> = {
  title: "DealPortal/Core/DealPortal",
  component: DSMPortalContent,
  decorators: [StoreDecorator],
  parameters: {
    layout: "fullscreen",
  },
}

export default meta
type Story = StoryObj<typeof DSMPortalContent>

// Mock users for stories
const mockUsers: User[] = [
  { id: "1", email: "buyer@example.com", name: "John Buyer", role: FairLendRole.BUYER },
  { id: "2", email: "lawyer@example.com", name: "Jane Lawyer", role: FairLendRole.LAWYER },
  { id: "3", email: "broker@example.com", name: "Bob Broker", role: FairLendRole.BROKER },
]

// Mock documents for different states
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

// === User Role Stories ===

export const Buyer: Story = {
  args: { dealId: "deal-123" },
  parameters: {
    mockState: {
      userRole: FairLendRole.BUYER,
      users: mockUsers,
      currentUser: mockUsers[0],
      documents: [createMockDocument({})],
    },
  },
}

export const BuyerLawyer: Story = {
  args: { dealId: "deal-123" },
  parameters: {
    mockState: {
      userRole: FairLendRole.BUYER_LAWYER,
      users: mockUsers,
      documents: [createMockDocument({ assignedToRole: FairLendRole.BUYER_LAWYER })],
    },
  },
}

export const Broker: Story = {
  args: { dealId: "deal-123" },
  parameters: {
    mockState: {
      userRole: FairLendRole.BROKER,
      users: mockUsers,
      documents: [createMockDocument({})],
    },
  },
}

export const Admin: Story = {
  args: { dealId: "deal-123" },
  parameters: {
    mockState: {
      userRole: FairLendRole.ADMIN,
      users: mockUsers,
      documents: [createMockDocument({})],
    },
  },
}

// === Document State Stories ===

export const NoDocuments: Story = {
  name: "No Documents",
  args: { dealId: "deal-123" },
  parameters: {
    mockState: {
      userRole: FairLendRole.BUYER,
      users: mockUsers,
      documents: [],
    },
  },
}

export const DocumentPendingSignature: Story = {
  name: "Document Pending Signature",
  args: { dealId: "deal-123" },
  parameters: {
    mockState: {
      userRole: FairLendRole.BUYER,
      users: mockUsers,
      currentUser: mockUsers[0],
      documents: [
        createMockDocument({
          status: "PENDING",
          requiredAction: ActionTypeEnum.ESIGN,
          isComplete: false,
          recipientStatus: { "buyer@example.com": "NOT_SIGNED", "lawyer@example.com": "NOT_SIGNED" },
        }),
      ],
    },
  },
}

export const DocumentPartiallyComplete: Story = {
  name: "Document Partially Signed",
  args: { dealId: "deal-123" },
  parameters: {
    mockState: {
      userRole: FairLendRole.BUYER,
      users: mockUsers,
      documents: [
        createMockDocument({
          status: "PENDING",
          requiredAction: ActionTypeEnum.ESIGN,
          assignedTo: "lawyer@example.com",
          assignedToRole: FairLendRole.LAWYER,
          isComplete: false,
          recipientStatus: { "buyer@example.com": "SIGNED", "lawyer@example.com": "NOT_SIGNED" },
        }),
      ],
    },
  },
}

export const DocumentCompleted: Story = {
  name: "Document Completed",
  args: { dealId: "deal-123" },
  parameters: {
    mockState: {
      userRole: FairLendRole.BUYER,
      users: mockUsers,
      documents: [
        createMockDocument({
          status: "COMPLETED",
          requiredAction: ActionTypeEnum.COMPLETE,
          isComplete: true,
          recipientStatus: { "buyer@example.com": "SIGNED", "lawyer@example.com": "SIGNED" },
        }),
      ],
    },
  },
}

export const DocumentRejected: Story = {
  name: "Document Rejected",
  args: { dealId: "deal-123" },
  parameters: {
    mockState: {
      userRole: FairLendRole.BUYER,
      users: mockUsers,
      documents: [
        createMockDocument({
          status: "REJECTED",
          requiredAction: ActionTypeEnum.NONE,
          isComplete: false,
          blocked: true,
          recipientStatus: { "buyer@example.com": "REJECTED" },
        }),
      ],
    },
  },
}

// === Multiple Documents Stories ===

export const MultipleDocumentsMixed: Story = {
  name: "Multiple Documents - Mixed Status",
  args: { dealId: "deal-123" },
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
          requiredAction: ActionTypeEnum.COMPLETE,
          isComplete: true,
          recipientStatus: { "buyer@example.com": "SIGNED" },
        }),
        createMockDocument({
          id: "doc-2",
          name: "Disclosure Form",
          status: "PENDING",
          requiredAction: ActionTypeEnum.ESIGN,
          isComplete: false,
          recipientStatus: { "buyer@example.com": "NOT_SIGNED" },
        }),
        createMockDocument({
          id: "doc-3",
          name: "Property Appraisal",
          group: "appraisal",
          status: "PENDING",
          requiredAction: ActionTypeEnum.REVIEW,
          isComplete: false,
        }),
      ],
    },
  },
}

export const AllDocumentsCompleted: Story = {
  name: "All Documents Completed",
  args: { dealId: "deal-123" },
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
        }),
        createMockDocument({
          id: "doc-2",
          name: "Disclosure Form",
          status: "COMPLETED",
          requiredAction: ActionTypeEnum.COMPLETE,
          isComplete: true,
        }),
      ],
    },
  },
}

// === Action Type Stories ===

export const DocumentNeedsApproval: Story = {
  name: "Document Needs Approval",
  args: { dealId: "deal-123" },
  parameters: {
    mockState: {
      userRole: FairLendRole.LAWYER,
      users: mockUsers,
      currentUser: mockUsers[1],
      documents: [
        createMockDocument({
          status: "PENDING",
          requiredAction: ActionTypeEnum.APPROVE,
          assignedTo: "lawyer@example.com",
          assignedToRole: FairLendRole.LAWYER,
          isComplete: false,
        }),
      ],
    },
  },
}

export const DocumentNeedsUpload: Story = {
  name: "Document Needs Upload",
  args: { dealId: "deal-123" },
  parameters: {
    mockState: {
      userRole: FairLendRole.BUYER,
      users: mockUsers,
      documents: [
        createMockDocument({
          status: "DRAFT",
          requiredAction: ActionTypeEnum.UPLOAD,
          isComplete: false,
        }),
      ],
    },
  },
}

export const DocumentNeedsReview: Story = {
  name: "Document Needs Review",
  args: { dealId: "deal-123" },
  parameters: {
    mockState: {
      userRole: FairLendRole.BROKER,
      users: mockUsers,
      currentUser: mockUsers[2],
      documents: [
        createMockDocument({
          status: "PENDING",
          requiredAction: ActionTypeEnum.REVIEW,
          assignedTo: "broker@example.com",
          assignedToRole: FairLendRole.BROKER,
          isComplete: false,
        }),
      ],
    },
  },
}
