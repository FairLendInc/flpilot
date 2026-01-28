import {
	ClipboardList,
	Files,
	FileText,
	type LucideIcon,
	Plus,
} from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ============================================================================
// COMPONENTS - Local UI components
// ============================================================================

function EmptyState({
	icon: Icon,
	title,
	description,
	actionLabel,
	onAction,
}: {
	icon: LucideIcon;
	title: string;
	description: string;
	actionLabel?: string;
	onAction?: () => void;
}) {
	return (
		<motion.div
			animate={{ opacity: 1, y: 0 }}
			className="flex flex-col items-center justify-center px-4 py-12 text-center"
			initial={{ opacity: 0, y: 10 }}
		>
			<div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
				<Icon className="h-10 w-10 text-muted-foreground" />
			</div>
			<h3 className="mb-2 font-semibold text-lg">{title}</h3>
			<p className="mb-6 max-w-[250px] text-muted-foreground text-sm">
				{description}
			</p>
			{actionLabel && (
				<Button
					className="gap-2"
					onClick={onAction}
					size="sm"
					variant="outline"
				>
					<Plus className="h-4 w-4" />
					{actionLabel}
				</Button>
			)}
		</motion.div>
	);
}

// ============================================================================
// ROOT - Main wrapper with state management
// ============================================================================

type RecordSheetRootProps = {
	children: ReactNode;
	defaultTab?: string;
	description?: string;
	homeContent: {
		fields: ReactNode;
		connections?: {
			title: string;
			content: ReactNode;
		}[];
	};
	title: string;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	onAddTask?: () => void;
	onAddNote?: () => void;
	onUploadFile?: () => void;
};

/**
 * RecordSheetRoot - The root component that provides context and state management
 * @extensibility - Pass `defaultTab` to set initial active tab
 * @extensibility - Controlled mode via `open` and `onOpenChange`
 */
export function RecordSheetRoot({
	_children,
	defaultTab = "home",
	description,
	homeContent,
	open,
	onOpenChange,
	title,
	onAddTask,
	onAddNote,
	onUploadFile,
}: RecordSheetRootProps) {
	return (
		<Sheet onOpenChange={onOpenChange} open={open}>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>{title}</SheetTitle>
					<SheetDescription>{description}</SheetDescription>
				</SheetHeader>
				<Separator />
				<Tabs defaultValue={defaultTab ?? "home"}>
					<TabsList className="w-full">
						<TabsTrigger value="home">Home</TabsTrigger>
						<TabsTrigger value="tasks">Tasks</TabsTrigger>
						<TabsTrigger value="notes">Notes</TabsTrigger>
						<TabsTrigger value="files">Files</TabsTrigger>
					</TabsList>
					<TabsContent value="home">
						{/* {activeTab === "home" ? homeContent.fields : homeContent.connections} */}
						{homeContent.fields}
						<Separator className="mt-6" />
						<Accordion type="multiple">
							{homeContent.connections?.map((connection) => (
								<AccordionItem key={connection.title} value={connection.title}>
									<AccordionTrigger>{connection.title}</AccordionTrigger>
									<AccordionContent>{connection.content}</AccordionContent>
								</AccordionItem>
							))}
						</Accordion>
					</TabsContent>
					<TabsContent className="mt-4" value="tasks">
						<EmptyState
							actionLabel="Add Task"
							description="Stay on top of things by creating your first task for this record."
							icon={ClipboardList}
							onAction={onAddTask}
							title="No tasks yet"
						/>
					</TabsContent>
					<TabsContent className="mt-4" value="notes">
						<EmptyState
							actionLabel="Add Note"
							description="Keep track of important details by adding a note here."
							icon={FileText}
							onAction={onAddNote}
							title="No notes found"
						/>
					</TabsContent>
					<TabsContent className="mt-4" value="files">
						<EmptyState
							actionLabel="Upload File"
							description="Securely store and access all related documents in one place."
							icon={Files}
							onAction={onUploadFile}
							title="No files uploaded"
						/>
					</TabsContent>
				</Tabs>
			</SheetContent>
		</Sheet>
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
// Connections (dropdown content sections, clicking the dropdown will open the auto-form fields for the connection)
