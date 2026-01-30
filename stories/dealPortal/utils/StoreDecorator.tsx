

import React, { useEffect } from "react"

import { useDealStore } from "../store/dealStore"
import type { Document, User } from "./dealLogic"
import { FairLendRole } from "./dealLogic"
import type { StoryContext, StoryFn } from "@storybook/react"
import { createMockDealStoreState } from "../mocks/dealStore.mock"

// Define the type for the initial state we might want to inject
interface MockState {
  userRole?: FairLendRole
  dealStatus?: string
  documents?: Document[]
  users?: User[]
  currentUser?: User
}

export const StoreDecorator = (Story: StoryFn, context: StoryContext) => {
  const { setState } = useDealStore
  const store = useDealStore()

  // Extract mock state from story parameters if available
  const mockState = context.parameters?.mockState as MockState | undefined

  useEffect(() => {
    // Start with the default mock state
    const defaultMocks = createMockDealStoreState()
    
    // Override with story-specific mocks
    const mergedState: any = { ...defaultMocks }

    if (mockState?.userRole) {
      mergedState.userRole = mockState.userRole
    }

    if (mockState?.documents) {
      mergedState.documents = mockState.documents
    }

    if (mockState?.users) {
      mergedState.availableUsers = mockState.users
    }

    if (mockState?.currentUser) {
      mergedState.currentUser = mockState.currentUser
    }

    if (mockState?.dealStatus) {
      if (store.deal) {
         mergedState.deal = { ...store.deal, status: mockState.dealStatus }
      }
    }
    
    // Apply state directly to store
    // usage of setState to merge state
    useDealStore.setState(mergedState)

  }, [mockState, setState])

  return Story(context.args, context)
}

