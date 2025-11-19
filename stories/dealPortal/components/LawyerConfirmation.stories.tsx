import { LawyerConfirmation } from "./LawyerConfirmation"
import { FairLendRole } from "../utils/dealLogic"
import { StoreDecorator } from "../utils/StoreDecorator"
import type { Meta, StoryObj } from "@storybook/react"

const meta: Meta<typeof LawyerConfirmation> = {
  title: "DealPortal/Features/LawyerConfirmation",
  component: LawyerConfirmation,
  decorators: [StoreDecorator],
}

export default meta
type Story = StoryObj<typeof LawyerConfirmation>

export const Default: Story = {
  parameters: {
    mockState: {
      userRole: FairLendRole.BUYER_LAWYER,
    },
  },
}

export const Confirmed: Story = {
  parameters: {
    mockState: {
      userRole: FairLendRole.BUYER_LAWYER,
      // We would need to update the deal state to reflect confirmation here
      // For now, the component will read the initial mock state
    },
  },
}
