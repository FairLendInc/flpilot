import { type ReactNode } from "react";
import { Sheet, SheetTitle, SheetDescription, SheetHeader, SheetContent } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent  } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { motion } from "motion/react";
import { ClipboardList, FileText, Files, Plus, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

// ============================================================================
// COMPONENTS - Local UI components
// ============================================================================

function EmptyState({ 
    icon: Icon, 
    title, 
    description, 
    actionLabel, 
    onAction 
}: { 
    icon: LucideIcon; 
    title: string; 
    description: string; 
    actionLabel?: string; 
    onAction?: () => void; 
}) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12 px-4 text-center"
        >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
                <Icon className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground max-w-[250px] mb-6">
                {description}
            </p>
            {actionLabel && (
                <Button onClick={onAction} variant="outline" size="sm" className="gap-2">
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
    }
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
	children,
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
                        <SheetTitle>
                            {title}
                        </SheetTitle>
                        <SheetDescription>
                            {description}
                        </SheetDescription>
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
                                        <AccordionContent>
                                            {connection.content}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </TabsContent>
                        <TabsContent value="tasks" className="mt-4">
                            <EmptyState 
                                icon={ClipboardList}
                                title="No tasks yet"
                                description="Stay on top of things by creating your first task for this record."
                                actionLabel="Add Task"
                                onAction={onAddTask}
                            />
                        </TabsContent>
                        <TabsContent value="notes" className="mt-4">
                            <EmptyState 
                                icon={FileText}
                                title="No notes found"
                                description="Keep track of important details by adding a note here."
                                actionLabel="Add Note"
                                onAction={onAddNote}
                            />
                        </TabsContent>
                        <TabsContent value="files" className="mt-4">
                            <EmptyState 
                                icon={Files}
                                title="No files uploaded"
                                description="Securely store and access all related documents in one place."
                                actionLabel="Upload File"
                                onAction={onUploadFile}
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

