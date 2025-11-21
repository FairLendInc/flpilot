import SharedDocumentsPanel from "./SharedDocumentsPanel"
import { FairLendRole } from "../utils/dealLogic"
import { StoreDecorator } from "../utils/StoreDecorator"
import type { Meta, StoryObj } from "@storybook/react"

const meta: Meta<typeof SharedDocumentsPanel> = {
  title: "DealPortal/Documents/SharedDocumentsPanel",
  component: SharedDocumentsPanel,
  decorators: [StoreDecorator],
}

export default meta
type Story = StoryObj<typeof SharedDocumentsPanel>

export const Default: Story = {
  parameters: {
    mockState: {
      userRole: FairLendRole.BUYER,
    },
  },
}

export const AdminView: Story = {
  parameters: {
    mockState: {
      userRole: FairLendRole.ADMIN,
    },
  },
}
