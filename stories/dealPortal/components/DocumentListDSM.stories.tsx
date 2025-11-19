import { DocumentListDSM } from "./DocumentListDSM"
import { StoreDecorator } from "../utils/StoreDecorator"
import type { Meta, StoryObj } from "@storybook/react"

const meta: Meta<typeof DocumentListDSM> = {
  title: "DealPortal/Documents/DocumentListDSM",
  component: DocumentListDSM,
  decorators: [StoreDecorator],
}

export default meta
type Story = StoryObj<typeof DocumentListDSM>

export const Default: Story = {}
