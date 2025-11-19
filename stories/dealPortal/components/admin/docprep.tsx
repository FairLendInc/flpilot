"use client"

import { useEffect, useState } from "react"

import { AddDocumentDialog } from "./docprep/add-document-dialog"
import { DocumentList } from "./docprep/document-list"
import { type Document } from "./docprep/types"
import { Badge } from "components/ui/badge"
import { Button } from "components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "components/ui/tabs"
import { FileTextIcon, PlusIcon } from "lucide-react"

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
