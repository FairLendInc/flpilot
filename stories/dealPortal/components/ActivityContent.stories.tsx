import { ActivityContent } from "./ActivityContent"
import { StoreDecorator } from "../utils/StoreDecorator"
import type { Meta, StoryObj } from "@storybook/react"

const meta: Meta<typeof ActivityContent> = {
  title: "DealPortal/Components/ActivityContent",
  component: ActivityContent,
  decorators: [StoreDecorator],
}

export default meta
type Story = StoryObj<typeof ActivityContent>

export const Default: Story = {}
