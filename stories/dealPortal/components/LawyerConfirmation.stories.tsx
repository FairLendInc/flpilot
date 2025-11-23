import { LawyerRepresentationConfirmation } from "./LawyerRepresentationConfirmation"
import { FairLendRole } from "../utils/dealLogic"
import { StoreDecorator } from "../utils/StoreDecorator"
import { Id } from "@/convex/_generated/dataModel"
import type { Meta, StoryObj } from "@storybook/react"

const meta: Meta<typeof LawyerRepresentationConfirmation> = {
  title: "DealPortal/Features/LawyerConfirmation",
  component: LawyerRepresentationConfirmation,
  decorators: [StoreDecorator],
}

export default meta
type Story = StoryObj<typeof LawyerRepresentationConfirmation>

export const Default: Story = {
  args: {
    dealId: "test-deal-id" as Id<"deals">,
  },
  parameters: {
    mockState: {
      userRole: FairLendRole.BUYER_LAWYER,
    },
  },
}
