import { DocumentDetailDSM } from "./DocumentDetailDSM"
import { StoreDecorator } from "../utils/StoreDecorator"
import type { Meta, StoryObj } from "@storybook/react"

const meta: Meta<typeof DocumentDetailDSM> = {
  title: "DealPortal/Documents/DocumentDetailDSM",
  component: DocumentDetailDSM,
  decorators: [StoreDecorator],
}

export default meta
type Story = StoryObj<typeof DocumentDetailDSM>

export const Default: Story = {}
