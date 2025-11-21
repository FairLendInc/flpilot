import DocumentViewer from "./DocumentViewer"
import { StoreDecorator } from "../utils/StoreDecorator"
import type { Meta, StoryObj } from "@storybook/react"

const meta: Meta<typeof DocumentViewer> = {
  title: "DealPortal/Documents/DocumentViewer",
  component: DocumentViewer,
  decorators: [StoreDecorator],
  parameters: {
    layout: "fullscreen",
  },
}

export default meta
type Story = StoryObj<typeof DocumentViewer>

export const Default: Story = {}
