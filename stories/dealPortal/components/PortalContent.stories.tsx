import { PortalContent } from "./PortalContent"
import { FairLendRole } from "../utils/dealLogic"
import { StoreDecorator } from "../utils/StoreDecorator"
import type { Meta, StoryObj } from "@storybook/react"

const meta: Meta<typeof PortalContent> = {
  title: "DealPortal/Core/PortalContent",
  component: PortalContent,
  decorators: [StoreDecorator],
  parameters: {
    layout: "fullscreen",
  },
}

export default meta
type Story = StoryObj<typeof PortalContent>

export const Default: Story = {
  parameters: {
    mockState: {
      userRole: FairLendRole.BUYER,
    },
  },
}

export const LawyerView: Story = {
  parameters: {
    mockState: {
      userRole: FairLendRole.BUYER_LAWYER,
    },
  },
}
