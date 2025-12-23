"use client"
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import {
	Sheet,
	SheetTrigger,
	SheetClose,
	SheetContent,
	SheetHeader,
	SheetFooter,
	SheetTitle,
	SheetDescription,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronDown, X } from "lucide-react"


// ============================================================================
// CONTEXT - Manages shared state across compound components
// ============================================================================

interface RecordSheetContextValue {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const RecordSheetContext = React.createContext<RecordSheetContextValue | null>(null)

function useRecordSheet() {
  const context = React.useContext(RecordSheetContext)
  if (!context) {
    throw new Error("RecordSheet components must be used within a RecordSheetRoot")
  }
  return context
}


// ============================================================================
// ROOT - Main wrapper with state management
// ============================================================================

interface RecordSheetRootProps {
  children: React.ReactNode
  defaultTab?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

/**
 * RecordSheetRoot - The root component that provides context and state management
 * @extensibility - Pass `defaultTab` to set initial active tab
 * @extensibility - Controlled mode via `open` and `onOpenChange`
 */
function RecordSheetRoot({ children, defaultTab = "home", open, onOpenChange }: RecordSheetRootProps) {
  const [activeTab, setActiveTab] = React.useState(defaultTab)

  return (
    <RecordSheetContext.Provider value={{ activeTab, setActiveTab }}>
      <Sheet open={open} onOpenChange={onOpenChange}>
        {children}
      </Sheet>
    </RecordSheetContext.Provider>
  )
}



// Personal Notes: 
// sections: 
// Header - close button - title - subtitle | all on same line
// Tabs
    // Tab List - Home | Tasks | Notes | Files 
    // tab content

    // Home: 
        // Fields 
        // Connections (dropdown content sections)