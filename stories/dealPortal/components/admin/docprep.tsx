"use client"

import { useEffect, useState } from "react"

import { AddDocumentDialog } from "./docprep/add-document-dialog"
import { DocumentList } from "./docprep/document-list"
import { type Document } from "./docprep/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileTextIcon, PlusIcon } from "lucide-react"

/**
 * # DocumentPreparationPage Component
 * 
 * ## Overview
 * A comprehensive document management interface for configuring signing workflows in the FairLend deal portal.
 * This component allows administrators to create, edit, and manage documents with role-based signing assignments,
 * workflow requirements, and integration with Documenso for electronic signatures.
 * 
 * ## Architecture
 * 
 * ### Component Hierarchy
 * ```
 * DocumentPreparationPage (Main Container)
 * ├── AddDocumentDialog (Modal for creating/editing documents)
 * │   ├── RoleAssignmentSection (User assignment with signing links)
 * │   └── Workflow Requirements (Checkboxes for document flow)
 * └── DocumentList (Table view of all documents)
 *     ├── Document rows with workflow badges
 *     ├── User assignment popovers
 *     └── Edit/Delete actions
 * ```
 * 
 * ### Data Flow
 * 1. **Persistence**: Uses browser localStorage via `DocumentStorageService` for data persistence
 * 2. **State Management**: React useState for local component state
 * 3. **Document Operations**: CRUD operations (Create, Read, Update, Delete)
 * 4. **Signing Order**: Sequential signing workflow with configurable order
 * 
 * ## Key Features
 * 
 * ### 1. Document Management
 * - Create new documents with name and group classification
 * - Edit existing documents while preserving their ID
 * - Delete documents with confirmation dialog
 * - Group documents by category (Legal, Finance, HR, etc.)
 * 
 * ### 2. Workflow Configuration
 * Documents support multiple workflow requirements:
 * - `requiresBuyerLawyerApproval`: Buyer's lawyer must approve
 * - `requiresBuyerSignature`: Buyer must sign
 * - `requiresBrokerApproval`: Broker must approve
 * - `requiredBrokerSignature`: Broker must sign
 * - `eSign`: Electronic signature via Documenso (mutually exclusive with upload)
 * - `requiredUpload`: Physical document upload required
 * 
 * ### 3. Role-Based Assignments
 * Each document can have multiple users assigned with:
 * - User email and name
 * - Role type (Buyer, Buyer's Lawyer, Broker, Admin, Lawyer, System)
 * - Unique Documenso signing link per user
 * - Signing order (sequential workflow: 1, 2, 3, etc.)
 * 
 * ### 4. Document Grouping & Filtering
 * - Automatic grouping by document group field
 * - Tab-based filtering to view all documents or filter by group
 * - Badge display showing document count per group
 * 
 * ### 5. Google Docs Integration (Placeholder)
 * - Tab for future Google Docs template integration
 * - Currently shows placeholder UI when no integration is configured
 * 
 * ## Data Model
 * 
 * ### Document Interface
 * ```typescript
 * interface Document {
 *   id: string                           // Unique identifier (timestamp-based)
 *   name: string                         // Document name (e.g., "Q4 2024 Contract")
 *   group: string                        // Category (e.g., "Legal", "Finance")
 *   roleAssignments: RoleAssignment[]    // Array of user assignments
 *   requiresBuyerLawyerApproval?: boolean
 *   requiresBuyerSignature?: boolean
 *   requiresBrokerApproval?: boolean
 *   requiredBrokerSignature?: boolean
 *   eSign?: boolean                      // Electronic signature enabled
 *   requiredUpload?: boolean             // Physical upload required
 *   createdAt?: Date
 *   updatedAt?: Date
 * }
 * ```
 * 
 * ### RoleAssignment Interface
 * ```typescript
 * interface RoleAssignment {
 *   userId: string          // Unique user identifier
 *   userEmail: string       // User's email address
 *   userName: string        // User's full name
 *   role: RoleType          // FairLendRole enum value
 *   signingLink: string     // Documenso signing URL
 *   signingOrder: number    // Sequential order (1, 2, 3, etc.)
 * }
 * ```
 * 
 * ## Storage Service
 * 
 * ### DocumentStorageService
 * Local mock service using browser localStorage:
 * - `loadDocuments()`: Retrieves all documents from localStorage
 * - `addDocument(doc)`: Adds a new document
 * - `updateDocument(id, doc)`: Updates existing document by ID
 * - `deleteDocument(id)`: Removes document by ID
 * 
 * **Note**: This is a temporary implementation. In production, this should be replaced
 * with Convex backend mutations and queries.
 * 
 * ## Component State
 * 
 * ```typescript
 * const [documents, setDocuments] = useState<Document[]>([])        // All documents
 * const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)     // Dialog visibility
 * const [editingDocument, setEditingDocument] = useState<Document | null>(null)  // Edit mode
 * ```
 * 
 * ## Event Handlers
 * 
 * ### handleAddDocument(document: Document)
 * Handles both creating new documents and updating existing ones:
 * - If `editingDocument` exists: Updates the document in place
 * - Otherwise: Creates new document with timestamp-based ID
 * - Persists changes to localStorage
 * - Updates local state
 * 
 * ### handleEditDocument(document: Document)
 * Initiates edit mode:
 * - Sets the document to be edited
 * - Opens the AddDocumentDialog
 * - Dialog pre-populates with document data
 * 
 * ### handleDeleteDocument(documentId: string)
 * Removes a document:
 * - Filters out the document from state
 * - Removes from localStorage
 * - No confirmation dialog (handled by DocumentList component)
 * 
 * ## UI Components Used
 * 
 * ### From shadcn/ui:
 * - `Button`: Action buttons (Add Document, etc.)
 * - `Card`: Container cards for sections
 * - `Badge`: Document group and workflow indicators
 * - `Tabs`: Main navigation and document filtering
 * - `Dialog`: Modal for add/edit operations
 * - `Table`: Document list display
 * - `Popover`: User assignment details
 * - `AlertDialog`: Delete confirmation
 * 
 * ### Icons (lucide-react):
 * - `FileTextIcon`: Document icon
 * - `PlusIcon`: Add action icon
 * 
 * ## Call Sites & Usage
 * 
 * ### 1. Storybook Story
 * **File**: `stories/dealPortal/components/admin/docprep.stories.tsx`
 * ```typescript
 * import DocumentPreparationPage from "./docprep"
 * 
 * const meta: Meta<typeof DocumentPreparationPage> = {
 *   title: "DealPortal/Admin/DocumentPreparationPage",
 *   component: DocumentPreparationPage,
 *   decorators: [StoreDecorator],
 *   parameters: { layout: "fullscreen" }
 * }
 * 
 * export const Default: Story = {}
 * ```
 * **Purpose**: Development and testing in Storybook isolation
 * **Access**: View in Storybook under "DealPortal/Admin/DocumentPreparationPage"
 * 
 * ### 2. Dashboard Header Link
 * **File**: `stories/dealPortal/components/DashboardHeader.tsx` (line 40-45)
 * ```typescript
 * <Link href="/admin/dashboard/docprep">
 *   <Button variant="outline" size="sm">
 *     <FileTextIcon className="mr-2 h-4 w-4" />
 *     Document Prep
 *   </Button>
 * </Link>
 * ```
 * **Purpose**: Navigation link from deal portal dashboard
 * **Access**: Available in the dashboard header for admin users
 * **Route**: `/admin/dashboard/docprep` (route needs to be created)
 * 
 * ## Integration Points
 * 
 * ### Current Integrations
 * 1. **localStorage**: Temporary data persistence
 * 2. **FairLendRole**: Role types from `stories/dealPortal/utils/dealLogic`
 * 3. **Documenso**: Signing links (manual entry, not automated yet)
 * 
 * ### Future Integrations (Planned)
 * 1. **Convex Backend**: Replace localStorage with Convex mutations/queries
 * 2. **Documenso API**: Automated template creation and signing link generation
 * 3. **Google Docs**: Template filling and document generation
 * 4. **Deal State Machine**: Integration with deal workflow states
 * 
 * ## Workflow Validation Rules
 * 
 * The component enforces these validation rules (from DSM - Deal State Machine):
 * 1. **eSign and Upload Mutual Exclusivity**: 
 *    - If `eSign` is true, `requiredUpload` should be false
 *    - If `requiredUpload` is true, `eSign` should be false
 * 2. **Broker Signature Requirements**:
 *    - If `eSign` is false and `requiredBrokerSignature` is true, then `requiredUpload` must be true
 * 3. **Minimum User Assignment**:
 *    - At least one user with a signing link is required
 * 
 * ## Empty States
 * 
 * ### No Documents
 * Displays a centered card with:
 * - File icon
 * - "No documents yet" heading
 * - "Get started by adding your first document" message
 * - "Add Document" button
 * 
 * ### No Google Integration
 * Displays placeholder message in Google Docs tab
 * 
 * ## Accessibility
 * 
 * - Semantic HTML structure with proper heading hierarchy
 * - Keyboard navigation support via shadcn/ui components
 * - ARIA labels on interactive elements
 * - Focus management in dialogs
 * - Screen reader friendly table structure
 * 
 * ## Performance Considerations
 * 
 * - **Client-side only**: Marked with "use client" directive
 * - **localStorage**: Synchronous operations (acceptable for small datasets)
 * - **Re-renders**: Optimized with proper key props in lists
 * - **Memoization**: Not currently implemented (consider for large document lists)
 * 
 * ## Known Limitations
 * 
 * 1. **localStorage Persistence**: Data is browser-specific and not synced across devices
 * 2. **No Authentication**: No user/role checks (admin-only in production)
 * 3. **Manual Signing Links**: Documenso links must be manually entered
 * 4. **No Search/Filter**: Large document lists may be hard to navigate
 * 5. **No Pagination**: All documents loaded at once
 * 6. **No Audit Trail**: No tracking of who created/modified documents
 * 
 * ## Migration Path to Production
 * 
 * To make this production-ready:
 * 
 * 1. **Replace localStorage with Convex**:
 *    ```typescript
 *    // Replace DocumentStorageService with:
 *    const documents = useQuery(api.documents.list)
 *    const addDocument = useMutation(api.documents.add)
 *    const updateDocument = useMutation(api.documents.update)
 *    const deleteDocument = useMutation(api.documents.delete)
 *    ```
 * 
 * 2. **Add Authentication**:
 *    ```typescript
 *    const { isAuthenticated, role } = useConvexAuth()
 *    if (role !== 'ADMIN') return <Unauthorized />
 *    ```
 * 
 * 3. **Integrate Documenso API**:
 *    - Auto-generate signing links from templates
 *    - Sync document status from Documenso
 *    - Handle webhook callbacks
 * 
 * 4. **Add Schema Validation**:
 *    - Define Convex schema for documents table
 *    - Add validators for workflow rules
 *    - Enforce referential integrity
 * 
 * 5. **Implement Search & Pagination**:
 *    - Add search input for document names
 *    - Implement cursor-based pagination
 *    - Add filters for workflow states
 * 
 * ## Related Components
 * 
 * - [`AddDocumentDialog`](./docprep/add-document-dialog.tsx): Modal for document creation/editing
 * - [`DocumentList`](./docprep/document-list.tsx): Table view with actions
 * - [`RoleAssignmentSection`](./docprep/role-assignment-section.tsx): User assignment interface
 * - [`types.ts`](./docprep/types.ts): TypeScript interfaces and types
 * 
 * ## Example Usage
 * 
 * ```typescript
 * // In a Next.js page or layout
 * import DocumentPreparationPage from '@/stories/dealPortal/components/admin/docprep'
 * 
 * export default function DocPrepPage() {
 *   return <DocumentPreparationPage />
 * }
 * ```
 * 
 * @component
 * @example
 * // Basic usage in a route
 * <DocumentPreparationPage />
 * 
 * @see {@link AddDocumentDialog} for document creation/editing
 * @see {@link DocumentList} for document display and management
 * @see {@link RoleAssignmentSection} for user assignment interface
 */

// Mock DocumentStorageService locally
const DocumentStorageService = {
  loadDocuments: (): Document[] => {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem("docprep_documents")
    return stored ? JSON.parse(stored) : []
  },
  addDocument: (doc: Document) => {
    if (typeof window === "undefined") return
    const docs = DocumentStorageService.loadDocuments()
    docs.push(doc)
    localStorage.setItem("docprep_documents", JSON.stringify(docs))
  },
  updateDocument: (id: string, doc: Document) => {
    if (typeof window === "undefined") return
    const docs = DocumentStorageService.loadDocuments()
    const index = docs.findIndex((d) => d.id === id)
    if (index !== -1) {
      docs[index] = doc
      localStorage.setItem("docprep_documents", JSON.stringify(docs))
    }
  },
  deleteDocument: (id: string) => {
    if (typeof window === "undefined") return
    const docs = DocumentStorageService.loadDocuments()
    const filtered = docs.filter((d) => d.id !== id)
    localStorage.setItem("docprep_documents", JSON.stringify(filtered))
  },
}

export default function DocumentPreparationPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingDocument, setEditingDocument] = useState<Document | null>(null)

  // Load documents from localStorage on mount
  useEffect(() => {
    const storedDocs = DocumentStorageService.loadDocuments()
    setDocuments(storedDocs)
  }, [])

  const handleAddDocument = (document: Document) => {
    if (editingDocument) {
      // Update existing document
      const updatedDocs = documents.map((doc) => (doc.id === editingDocument.id ? document : doc))
      setDocuments(updatedDocs)
      DocumentStorageService.updateDocument(editingDocument.id, document)
      setEditingDocument(null)
    } else {
      // Add new document
      const newDocument = { ...document, id: Date.now().toString() }
      const updatedDocs = [...documents, newDocument]
      setDocuments(updatedDocs)
      DocumentStorageService.addDocument(newDocument)
    }
  }

  const handleEditDocument = (document: Document) => {
    setEditingDocument(document)
    setIsAddDialogOpen(true)
  }

  const handleDeleteDocument = (documentId: string) => {
    const updatedDocs = documents.filter((doc) => doc.id !== documentId)
    setDocuments(updatedDocs)
    DocumentStorageService.deleteDocument(documentId)
  }

  const documentGroups = Array.from(new Set(documents.map((doc) => doc.group))).filter(Boolean)

  // Mock Google Integration data
  const googleIntegration = null
  const initialAccessToken = null

  return (
    <div className="container mx-auto space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Document Preparation</h1>
          <p className="text-muted-foreground mt-2">Manage documents and assign roles for signing workflows</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Document
        </Button>
      </div>

      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="documents">Document Management</TabsTrigger>
          <TabsTrigger value="google-docs">Google Docs Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileTextIcon className="h-5 w-5" />
                Document Overview
              </CardTitle>
              <CardDescription>
                Total documents: {documents.length} | Groups: {documentGroups.length}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {documentGroups.map((group) => (
                  <Badge key={group} variant="secondary">
                    {group} ({documents.filter((doc) => doc.group === group).length})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {documents.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileTextIcon className="text-muted-foreground mb-4 h-12 w-12" />
                <h3 className="mb-2 text-lg font-semibold">No documents yet</h3>
                <p className="text-muted-foreground mb-4 text-sm">Get started by adding your first document</p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add Document
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList>
                <TabsTrigger value="all">All Documents</TabsTrigger>
                {documentGroups.map((group) => (
                  <TabsTrigger key={group} value={group}>
                    {group}
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value="all">
                <DocumentList
                  documents={documents}
                  onEditAction={handleEditDocument}
                  onDeleteAction={handleDeleteDocument}
                />
              </TabsContent>
              {documentGroups.map((group) => (
                <TabsContent key={group} value={group}>
                  <DocumentList
                    documents={documents.filter((doc) => doc.group === group)}
                    onEditAction={handleEditDocument}
                    onDeleteAction={handleDeleteDocument}
                  />
                </TabsContent>
              ))}
            </Tabs>
          )}
        </TabsContent>

        <TabsContent value="google-docs">
          {googleIntegration && initialAccessToken && (
            <div className="flex flex-col items-center justify-center py-12">
               <FileTextIcon className="text-muted-foreground mb-4 h-12 w-12" />
               <h3 className="mb-2 text-lg font-semibold">Google Docs Integration</h3>
               <p className="text-muted-foreground mb-4 text-sm">Template filling form is currently unavailable.</p>
            </div>
          )}
          {!googleIntegration && !initialAccessToken && (
            <div className="flex flex-col items-center justify-center">
              <p className="text-muted-foreground">No Google integration found</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AddDocumentDialog
        open={isAddDialogOpen}
        onOpenChangeAction={(open: boolean) => {
          setIsAddDialogOpen(open)
          if (!open) setEditingDocument(null)
        }}
        onAddAction={handleAddDocument}
        editingDocument={editingDocument}
      />
    </div>
  )
}
