import DocumentPreparationPage from "./docprep"
import { StoreDecorator } from "../../utils/StoreDecorator"
import type { Meta, StoryObj } from "@storybook/react"

const meta: Meta<typeof DocumentPreparationPage> = {
  title: "DealPortal/Admin/DocumentPreparationPage",
  component: DocumentPreparationPage,
  decorators: [StoreDecorator],
  parameters: {
    layout: "fullscreen",
  },
}

export default meta
type Story = StoryObj<typeof DocumentPreparationPage>

export const Default: Story = {}
