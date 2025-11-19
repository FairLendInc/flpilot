import FundsTransferVerification from "./FundsTransferVerification"
import { StoreDecorator } from "../utils/StoreDecorator"
import type { Meta, StoryObj } from "@storybook/react"

const meta: Meta<typeof FundsTransferVerification> = {
  title: "DealPortal/Features/FundsTransferVerification",
  component: FundsTransferVerification,
  decorators: [StoreDecorator],
}

export default meta
type Story = StoryObj<typeof FundsTransferVerification>

export const Default: Story = {}
