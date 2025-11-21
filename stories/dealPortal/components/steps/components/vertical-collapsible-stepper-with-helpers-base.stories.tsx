import VerticalCollapsibleStepper from "./vertical-collapsible-stepper-with-helpers-base"
import { StoreDecorator } from "../../../utils/StoreDecorator"
import type { Meta, StoryObj } from "@storybook/react"

const meta: Meta<typeof VerticalCollapsibleStepper> = {
  title: "DealPortal/Features/VerticalCollapsibleStepper",
  component: VerticalCollapsibleStepper,
  decorators: [StoreDecorator],
}

export default meta
type Story = StoryObj<typeof VerticalCollapsibleStepper>

export const Default: Story = {}

export const PendingLawyerConfirmation: Story = {
  parameters: {
    mockState: {
      dealStatus: "pending_lawyer_confirmation",
    },
  },
}

export const PendingDocSigning: Story = {
  parameters: {
    mockState: {
      dealStatus: "pending_doc_signing",
    },
  },
}

export const PendingFundsTransfer: Story = {
  parameters: {
    mockState: {
      dealStatus: "pending_funds_transfer",
    },
  },
}

export const Completed: Story = {
  parameters: {
    mockState: {
      dealStatus: "completed",
    },
  },
}
