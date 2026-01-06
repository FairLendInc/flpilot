"use client";
import { createContext, type ReactNode, useContext, useState } from "react";
import { Sheet } from "@/components/ui/sheet";

// ============================================================================
// CONTEXT - Manages shared state across compound components
// ============================================================================

type RecordSheetContextValue = {
	activeTab: string;
	setActiveTab: (tab: string) => void;
};

const RecordSheetContext = createContext<RecordSheetContextValue | null>(null);

export function useRecordSheet() {
	const context = useContext(RecordSheetContext);
	if (!context) {
		throw new Error(
			"RecordSheet components must be used within a RecordSheetRoot"
		);
	}
	return context;
}

// ============================================================================
// ROOT - Main wrapper with state management
// ============================================================================

type RecordSheetRootProps = {
	children: ReactNode;
	defaultTab?: string;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
};

/**
 * RecordSheetRoot - The root component that provides context and state management
 * @extensibility - Pass `defaultTab` to set initial active tab
 * @extensibility - Controlled mode via `open` and `onOpenChange`
 */
export function RecordSheetRoot({
	children,
	defaultTab = "home",
	open,
	onOpenChange,
}: RecordSheetRootProps) {
	const [activeTab, setActiveTab] = useState(defaultTab);

	return (
		<RecordSheetContext.Provider value={{ activeTab, setActiveTab }}>
			<Sheet onOpenChange={onOpenChange} open={open}>
				{children}
			</Sheet>
		</RecordSheetContext.Provider>
	);
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
