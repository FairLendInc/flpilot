import { ChatContent } from "./ChatContent"
import { StoreDecorator } from "../utils/StoreDecorator"
import type { Meta, StoryObj } from "@storybook/react"

const meta: Meta<typeof ChatContent> = {
  title: "DealPortal/Components/ChatContent",
  component: ChatContent,
  decorators: [StoreDecorator],
}

export default meta
type Story = StoryObj<typeof ChatContent>

export const Default: Story = {}
