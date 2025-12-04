import { DocumentOverview } from "./DocumentOverview"
import { StoreDecorator } from "../utils/StoreDecorator"
import { ActionTypeEnum, FairLendRole } from "../utils/dealLogic"
import type { Document, User } from "../utils/dealLogic"
import type { Meta, StoryObj } from "@storybook/react"

const meta: Meta<typeof DocumentOverview> = {
  title: "DealPortal/Documents/DocumentOverview",
  component: DocumentOverview,
  decorators: [StoreDecorator],
}

export default meta
type Story = StoryObj<typeof DocumentOverview>

const mockUsers: User[] = [
  { id: "1", email: "buyer@example.com", name: "John Buyer", role: FairLendRole.BUYER },
  { id: "2", email: "lawyer@example.com", name: "Jane Lawyer", role: FairLendRole.LAWYER },
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
  recipientStatus: { "buyer@example.com": "NOT_SIGNED", "lawyer@example.com": "NOT_SIGNED" },
  signingSteps: [
    { email: "lawyer@example.com", name: "Jane Lawyer", role: FairLendRole.LAWYER, status: "NOT_SIGNED", order: 1 },
    { email: "buyer@example.com", name: "John Buyer", role: FairLendRole.BUYER, status: "NOT_SIGNED", order: 2 },
  ],
  ...overrides,
})

export const Default: Story = {
  parameters: {
    mockState: {
      userRole: FairLendRole.BUYER,
      users: mockUsers,
      documents: [
        createMockDocument({}),
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

export const AllPending: Story = {
  name: "All Documents Pending",
  parameters: {
    mockState: {
      userRole: FairLendRole.BUYER,
      users: mockUsers,
      documents: [
        createMockDocument({ id: "doc-1", name: "Mortgage Agreement" }),
        createMockDocument({ id: "doc-2", name: "Disclosure Form" }),
        createMockDocument({ id: "doc-3", name: "Property Deed", group: "legal" }),
      ],
    },
  },
}

export const AllCompleted: Story = {
  name: "All Documents Completed",
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

export const MixedGroups: Story = {
  name: "Multiple Document Groups",
  parameters: {
    mockState: {
      userRole: FairLendRole.BUYER,
      users: mockUsers,
      documents: [
        createMockDocument({ id: "doc-1", name: "Mortgage Agreement", group: "mortgage" }),
        createMockDocument({ id: "doc-2", name: "Property Appraisal", group: "appraisal" }),
        createMockDocument({ id: "doc-3", name: "Title Search", group: "legal" }),
        createMockDocument({
          id: "doc-4",
          name: "Insurance Certificate",
          group: "insurance",
          status: "COMPLETED",
          isComplete: true,
        }),
      ],
    },
  },
}

export const ThreeSigningSteps: Story = {
  name: "Three Signing Steps",
  parameters: {
    mockState: {
      userRole: FairLendRole.BUYER,
      users: [
        { id: "1", email: "buyer@example.com", name: "John Buyer", role: FairLendRole.BUYER },
        { id: "2", email: "lawyer@example.com", name: "Jane Lawyer", role: FairLendRole.LAWYER },
        { id: "3", email: "broker@example.com", name: "Bob Broker", role: FairLendRole.BROKER },
      ],
      currentUser: { id: "1", email: "buyer@example.com", name: "John Buyer", role: FairLendRole.BUYER },
      documents: [
        createMockDocument({
          id: "doc-1",
          name: "Mortgage Agreement",
          signingSteps: [
            { email: "lawyer@example.com", name: "Jane Lawyer", role: FairLendRole.LAWYER, status: "NOT_SIGNED", order: 1 },
            { email: "buyer@example.com", name: "John Buyer", role: FairLendRole.BUYER, status: "NOT_SIGNED", order: 2 },
            { email: "broker@example.com", name: "Bob Broker", role: FairLendRole.BROKER, status: "NOT_SIGNED", order: 3 },
          ],
        }),
      ],
    },
  },
}
