import AdminDocumentCreator from "./AdminDocumentCreator"
import { FairLendRole } from "../utils/dealLogic"
import { StoreDecorator } from "../utils/StoreDecorator"
import type { Meta, StoryObj } from "@storybook/react"

const meta: Meta<typeof AdminDocumentCreator> = {
  title: "DealPortal/Admin/AdminDocumentCreator",
  component: AdminDocumentCreator,
  decorators: [StoreDecorator],
}

export default meta
type Story = StoryObj<typeof AdminDocumentCreator>

export const Admin: Story = {
  parameters: {
    mockState: {
      userRole: FairLendRole.ADMIN,
    },
  },
}

export const NonAdmin: Story = {
  parameters: {
    mockState: {
      userRole: FairLendRole.BUYER,
    },
  },
}
