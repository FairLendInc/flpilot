import { DocumentOverview } from "./DocumentOverview"
import { StoreDecorator } from "../utils/StoreDecorator"
import type { Meta, StoryObj } from "@storybook/react"

const meta: Meta<typeof DocumentOverview> = {
  title: "DealPortal/Documents/DocumentOverview",
  component: DocumentOverview,
  decorators: [StoreDecorator],
}

export default meta
type Story = StoryObj<typeof DocumentOverview>

export const Default: Story = {}
