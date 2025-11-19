import React, { useEffect } from "react"

import { useDealStore } from "../store/dealStore"
import { FairLendRole } from "./dealLogic"
import type { StoryContext, StoryFn } from "@storybook/react"

// Define the type for the initial state we might want to inject
interface MockState {
  userRole?: FairLendRole
  dealStatus?: string
  // Add other state properties as needed for specific stories
}

export const StoreDecorator = (Story: StoryFn, context: StoryContext) => {
  const { setUserRole, setDeal } = useDealStore()
  
  // Extract mock state from story parameters if available
  const mockState = context.parameters?.mockState as MockState | undefined

  useEffect(() => {
    // Reset or initialize store state for the story
    if (mockState?.userRole) {
      setUserRole(mockState.userRole)
    }
    
    if (mockState?.dealStatus) {
      // We need to be careful not to overwrite the entire deal object if we just want to change status
      // This assumes the store has a way to update just the status or we update the whole mock deal
      const currentDeal = useDealStore.getState().deal
      if (currentDeal) {
        setDeal({ ...currentDeal, status: mockState.dealStatus })
      }
    }
  }, [mockState, setUserRole, setDeal])

  return <Story />
}
