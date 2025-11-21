import { DashboardHeader } from "./DashboardHeader"
import { FairLendRole } from "../utils/dealLogic"
import { StoreDecorator } from "../utils/StoreDecorator"
import type { Meta, StoryObj } from "@storybook/react"

const meta: Meta<typeof DashboardHeader> = {
  title: "DealPortal/Core/DashboardHeader",
  component: DashboardHeader,
  decorators: [StoreDecorator],
  parameters: {
    layout: "padded",
  },
}

export default meta
type Story = StoryObj<typeof DashboardHeader>

export const Default: Story = {
  args: {
    userRole: FairLendRole.BUYER,
  },
  parameters: {
    mockState: {
      userRole: FairLendRole.BUYER,
    },
  },
}

export const Admin: Story = {
  args: {
    userRole: FairLendRole.ADMIN,
  },
  parameters: {
    mockState: {
      userRole: FairLendRole.ADMIN,
    },
  },
}
