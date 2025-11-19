import { DSMPortalContent } from "./DealPortal"
import { FairLendRole } from "./utils/dealLogic"
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

export const Buyer: Story = {
  args: {
    dealId: "deal-123",
  },
  parameters: {
    mockState: {
      userRole: FairLendRole.BUYER,
    },
  },
}

export const BuyerLawyer: Story = {
  args: {
    dealId: "deal-123",
  },
  parameters: {
    mockState: {
      userRole: FairLendRole.BUYER_LAWYER,
    },
  },
}

export const Broker: Story = {
  args: {
    dealId: "deal-123",
  },
  parameters: {
    mockState: {
      userRole: FairLendRole.BROKER,
    },
  },
}

export const Admin: Story = {
  args: {
    dealId: "deal-123",
  },
  parameters: {
    mockState: {
      userRole: FairLendRole.ADMIN,
    },
  },
}
