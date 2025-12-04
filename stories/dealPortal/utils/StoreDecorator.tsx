import React, { useEffect } from "react"

import { useDealStore } from "../store/dealStore"
import type { Document, User } from "./dealLogic"
import { FairLendRole } from "./dealLogic"
import type { StoryContext, StoryFn } from "@storybook/react"

// Define the type for the initial state we might want to inject
interface MockState {
  userRole?: FairLendRole
  dealStatus?: string
  documents?: Document[]
  users?: User[]
  currentUser?: User
}

export const StoreDecorator = (Story: StoryFn, context: StoryContext) => {
  const { setUserRole, setDeal, setDocuments, setAvailableUsers, setCurrentUser } = useDealStore()

  // Extract mock state from story parameters if available
  const mockState = context.parameters?.mockState as MockState | undefined

  useEffect(() => {
    // Reset or initialize store state for the story
    if (mockState?.userRole) {
      setUserRole(mockState.userRole)
    }

    if (mockState?.documents) {
      setDocuments(mockState.documents)
    }

    if (mockState?.users) {
      setAvailableUsers(mockState.users)
    }

    if (mockState?.currentUser) {
      setCurrentUser(mockState.currentUser)
    }

    if (mockState?.dealStatus) {
      const currentDeal = useDealStore.getState().deal
      if (currentDeal) {
        setDeal({ ...currentDeal, status: mockState.dealStatus })
      }
    }
  }, [mockState, setUserRole, setDeal, setDocuments, setAvailableUsers, setCurrentUser])

  return Story(context.args, context)
}
