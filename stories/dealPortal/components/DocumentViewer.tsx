"use client"

import React, { useEffect, useState } from "react"

import { useDealStore } from "../store/dealStore"
import { ActionTypeEnum } from "../utils/dealLogic"
import { Badge } from "components/ui/badge"
import { Button } from "components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/ui/select"
import { Textarea } from "components/ui/textarea"
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  Clock,
  Download,
  Edit3,
  FileText,
  History,
  RotateCw,
  Save,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import dynamic from "next/dynamic"
import Image from "next/image"

// Document Version interface
interface DocumentVersion {
  id: string
  label: string
  timestamp: string
  signedBy: string
  fileData: string
  fileName: string
  fileType: string
  fileSize: number
}

// PDF Viewer component with error handling
const PDFViewer = ({ url }: { url: string }) => {
  // const [numPages, setNumPages] = useState<number | null>(null);
  // const [pageNumber, setPageNumber] = useState(1);
  // const [scale, setScale] = useState(1);
  // const [rotation, setRotation] = useState(0);
  // const [width, setWidth] = useState<number | undefined>(undefined);
  const [loadError, setLoadError] = useState<boolean>(false)

  // Set up the worker with proper error handling

  // If there's an error, show download option
  if (loadError) {
    return (
      <div className="bg-muted/20 flex h-[300px] flex-col items-center justify-center">
        <FileText className="mb-4 h-12 w-12 text-red-500" />
        <p className="mb-2 text-center">Unable to display PDF document in browser</p>
        <Button onClick={() => window.open(url, "_blank")}>
          <Download className="mr-2" size={16} /> Open PDF in new tab
        </Button>
      </div>
    )
  }

  return (
    <object data={url} type="application/pdf" className="h-full min-h-[75vh] w-full">
      <p>
        Alternative text - include a link <a href={url}>to the PDF!</a>
      </p>
    </object>
  )
}

const DocumentViewer = () => {
  const {
    dsm,
    userRole,
    selectedDocument: originalDocument,
    setSelectedDocument,
    activeDocumentGroup,
    documentViewMode,
    setDocumentViewMode,
    showNotePanel,
    setShowNotePanel,
    showApproveModal,
    setShowApproveModal,
    showDisputeModal,
    setShowDisputeModal,
    showConfirmModal,
    setShowConfirmModal,
    note,
    setNote,
    uploadState,
    getActionStatusText,
    getActionStatusColor,
    completeDocumentAction,
    setShowUploadModal,
    handleFileSelect,
    uploadDocument,
    getSelectedDocumentWithFileData,
    getDocState: getDocumentState,
    getDocumentVersions,
    logEvent,
    logDocumentView,
  } = useDealStore()

  // Get the enhanced document with file data
  const selectedDocument = getSelectedDocumentWithFileData()

  // Get document versions
  const [documentVersions, setDocumentVersions] = useState<DocumentVersion[]>([])
  const [selectedVersionId, setSelectedVersionId] = useState<string>("")

  // Add a ref to track document ID to prevent unnecessary updates
  const previousDocumentIdRef = React.useRef<string | null>(null)

  // Get document state for status checking
  const documentState = selectedDocument ? getDocumentState(selectedDocument.id) : null

  // Log document view when document is opened
  useEffect(() => {
    if (selectedDocument && selectedDocument.id !== previousDocumentIdRef.current) {
      // Log document view
      logDocumentView(selectedDocument.id)

      // Update previous document ID ref
      previousDocumentIdRef.current = selectedDocument.id
    }
  }, [selectedDocument, logDocumentView])

  // Load document versions when the document changes
  useEffect(() => {
    if (selectedDocument) {
      // Only update if the document ID has changed to prevent infinite loops
      if (previousDocumentIdRef.current !== selectedDocument.id) {
        // Update ref with current document ID
        previousDocumentIdRef.current = selectedDocument.id

        // Get document versions from context
        const versions = getDocumentVersions(selectedDocument.id)

        if (versions.length > 0) {
          setDocumentVersions(versions)
          setSelectedVersionId(versions[versions.length - 1]?.id || "")
        } else if (selectedDocument.fileData) {
          // If no versions but document has data, create a "current" version
          const currentVersion: DocumentVersion = {
            id: "current",
            label: "Current Version",
            timestamp: selectedDocument.uploadedAt || new Date().toISOString(),
            signedBy: selectedDocument.uploadedBy || "Unknown",
            fileData: selectedDocument.fileData,
            fileName: selectedDocument.fileName || selectedDocument.name,
            fileType: selectedDocument.fileType || "application/pdf",
            fileSize: selectedDocument.fileSize || 0,
          }
          setDocumentVersions([currentVersion])
          setSelectedVersionId(currentVersion.id)
        } else {
          // Reset versions if there's no data
          setDocumentVersions([])
          setSelectedVersionId("")
        }
      }
    } else {
      // Reset when no document is selected
      previousDocumentIdRef.current = null
      setDocumentVersions([])
      setSelectedVersionId("")
    }
  }, [selectedDocument])

  // Get the currently selected version
  const selectedVersion = documentVersions.find((v) => v.id === selectedVersionId) || null

  // Add file input ref
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  // Modified function to handle E-Signing
  const handleESign = () => {
    if (!selectedDocument || !activeDocumentGroup) return

    // Complete the e-sign action
    completeDocumentAction(selectedDocument.id, ActionTypeEnum.ESIGN, userRole)

    // Show confirmation to the user
    alert("Document has been successfully e-signed")
  }

  // Function to download the selected version
  const handleDownload = () => {
    if (selectedVersion) {
      const link = document.createElement("a")
      link.href = selectedVersion.fileData
      link.download = selectedVersion.fileName
      link.click()
    } else if (selectedDocument?.fileData) {
      const link = document.createElement("a")
      link.href = selectedDocument.fileData
      link.download = selectedDocument.fileName || selectedDocument.name
      link.click()
    }
  }

  // Handle document approval
  const handleDocumentApproval = () => {
    if (!selectedDocument) return
    completeDocumentAction(selectedDocument.id, ActionTypeEnum.APPROVE, userRole)
  }

  // Handle document dispute
  const handleDocumentDispute = () => {
    if (!selectedDocument) return
    completeDocumentAction(selectedDocument.id, ActionTypeEnum.DISPUTE, userRole)
  }

  // Handle document upload submission
  const handleUploadSubmit = () => {
    if (!selectedDocument || !uploadState.file) return

    uploadDocument(
      selectedDocument.id,
      uploadState.file,
      userRole,
      selectedDocument.nextAction?.type === ActionTypeEnum.UPLOAD_SIGNED
    )

    setShowConfirmModal(false)
  }

  // Check if document has completed status
  const isDocumentCompleted = documentState?.status === "completed"

  // Check if document is approved
  const isDocumentApproved = documentState?.status === "lawyer_approved"

  // Check if document is disputed
  const isDocumentDisputed = documentState?.status === "buyer_lawyer_disputed"

  if (!selectedDocument) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Select a document to view</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Original Document Section */}
      <div className="flex flex-1 flex-col">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{selectedDocument.name}</h3>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
              disabled={!selectedDocument.fileData && !selectedVersion}
            >
              <Download className="mr-1" size={16} /> Download
            </Button>
          </div>
        </div>

        {/* Document version selector */}
        {documentVersions.length > 1 && (
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <History size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium">Document Versions:</span>
              <Select value={selectedVersionId} onValueChange={setSelectedVersionId}>
                <SelectTrigger className="w-[260px]">
                  <SelectValue placeholder="Select version" />
                </SelectTrigger>
                <SelectContent>
                  {documentVersions.map((version) => (
                    <SelectItem key={version.id} value={version.id}>
                      <div className="flex w-full items-center justify-between">
                        <span>{version.label}</span>
                        <Badge variant="outline" className="ml-2">
                          {version.signedBy}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedVersion && (
                <span className="text-muted-foreground text-xs">
                  {new Date(selectedVersion.timestamp).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Document preview area */}
        {/* <div className="mt-4">
          <div className="overflow-hidden rounded-lg border">
            <div className="bg-muted border-b p-4">
              <h3 className="font-medium">{selectedDocument?.name || "Document"}</h3>
              {(selectedVersion?.fileName || selectedDocument?.fileName) && (
                <p className="text-muted-foreground text-sm">
                  {selectedVersion?.fileName || selectedDocument.fileName}
                </p>
              )}
            </div>
            <div className="min-h-[600px] p-6">
              {selectedVersion?.fileData || selectedDocument?.fileData ? (
                // If we have file data, show a preview based on file type
                <>
                  {(selectedVersion?.fileType || selectedDocument.fileType)?.startsWith("image/") ? (
                    <div className="flex justify-center">
                      <Image
                        alt={selectedVersion?.fileName || selectedDocument.name}
                        className="max-h-[400px] max-w-full object-contain"
                        src={selectedVersion?.fileData || selectedDocument.fileData}
                      />
                    </div>
                  ) : (selectedVersion?.fileType || selectedDocument.fileType) === "application/pdf" ? (
                    <PDFViewer url={selectedVersion?.fileData || selectedDocument.fileData || ""} />
                  ) : (
                    <div className="bg-muted/50 flex h-[400px] items-center justify-center">
                      <div className="text-center">
                        <FileText className="text-muted-foreground mx-auto mb-2" size={48} />
                        <p className="font-medium">{selectedVersion?.fileName || selectedDocument.fileName}</p>
                        <p className="text-muted-foreground mb-4 text-sm">
                          {selectedVersion?.fileType || selectedDocument.fileType || "Document"}
                        </p>
                        <Button onClick={handleDownload}>
                          <Download className="mr-2" size={16} /> Download
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                // Default placeholder with upload button if no document
                <div className="bg-muted/20 flex h-[300px] flex-col items-center justify-center">
                  <FileText className="text-muted-foreground mb-4 h-12 w-12" />
                  <p className="text-muted-foreground mb-4 text-center">
                    No document content available. This document may not have been uploaded yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div> 
        */}
      </div>

      {/* Required Document Actions Section */}
      {/* <div className="border-t pt-4"> */}
      {/* <h4 className="font-medium text-gray-700 mb-4">
          Required Document Actions
        </h4> */}

      {/* For Lawyer: Show approval actions for all document types */}
      {/* {userRole === "buyer_lawyer" &&
          selectedDocument.nextAction.type === ActionTypeEnum.APPROVE && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Button
                  className="text-green-600"
                  size="sm"
                  type="button"
                  variant="outline"
                  onClick={() => setShowApproveModal(true)}
                >
                  <CheckCircle className="mr-1" size={16} /> Approve
                </Button>
                <Button
                  className="text-red-600"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowDisputeModal(true)}
                >
                  <AlertCircle className="mr-1" size={16} /> Dispute
                </Button>
              </div>
            </div>
          )} */}

      {/* For Buyer: Show Upload/Sign interface for documents that require signatures */}
      {/* {userRole === "buyer" &&
          (selectedDocument.nextAction.type === ActionTypeEnum.ESIGN ||
            selectedDocument.nextAction.type === ActionTypeEnum.UPLOAD_SIGNED) && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-3">
                {selectedDocument.nextAction.type === ActionTypeEnum.ESIGN && (
                  <Button size="sm" variant="default" onClick={handleESign}>
                    <Edit3 className="mr-1" size={16} /> E-Sign Document
                  </Button>
                )}
                {selectedDocument.nextAction.type ===
                  ActionTypeEnum.UPLOAD_SIGNED && (
                  <>
                    <p className="text-gray-500 text-sm">or</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-1" size={16} /> Upload Signed
                      Document
                    </Button>
                    <input
                      ref={fileInputRef}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      type="file"
                      onChange={handleFileChange}
                    />
                  </>
                )}
              </div> */}

      {/* Document upload/preview area */}
      {/* <div
                className={`border-2 border-dashed rounded-md p-6 text-center ${
                  uploadState.file
                    ? "border-primary bg-primary/5"
                    : "border-muted"
                }`}
              >
                {!uploadState.file ? (
                  <>
                    <Upload
                      className="mx-auto text-muted-foreground mb-2"
                      size={32}
                    />
                    <p className="text-sm text-muted-foreground mb-2">
                      Upload your signed document or click Sign Above to use
                      e-signature
                    </p>
                  </>
                ) : (
                  <>
                    <FileText className="mx-auto text-primary mb-2" size={32} />
                    <p className="font-medium mb-1">{uploadState.fileName}</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      File ready to submit
                    </p>
                    <div className="flex justify-center space-x-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFileSelect(null)}
                      >
                        <X className="mr-1" size={14} /> Remove
                      </Button>
                      <Button size="sm" onClick={() => handleUploadSubmit()}>
                        Submit Signed Document
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div> */}
      {/* )} */}

      {/* For Buyer: Show confirmation when document is already signed */}
      {/* {userRole === "buyer" && isDocumentCompleted && (
          <div className="bg-success/10 rounded-md p-4">
            <div className="text-foregreound flex items-center">
              <CheckCircle className="mr-2" size={18} />
              <p>You have successfully signed this document.</p>
            </div>
            <div className="mt-2">
              <Button className="text-destructive" size="sm" variant="outline">
                Request Rollback
              </Button>
            </div>
          </div>
        )} */}

      {/* For Admin: Show approval status */}
      {/* {userRole === "admin" && (
          <div
            className={`rounded-md p-4 ${
              isDocumentApproved ? "bg-success/10" : isDocumentDisputed ? "bg-destructive/10" : "bg-chart-3/10"
            }`}
          >
            <div className="flex items-center">
              {isDocumentApproved ? (
                <CheckCircle className="text-foregreound mr-2" size={18} />
              ) : isDocumentDisputed ? (
                <AlertCircle className="text-destructive mr-2" size={18} />
              ) : (
                <Clock className="text-chart-3 mr-2" size={18} />
              )}
              <p
                className={` ${
                  isDocumentApproved ? "text-foregreound" : isDocumentDisputed ? "text-destructive" : "text-chart-3"
                } `}
              >
                {isDocumentApproved
                  ? "Document has been approved by the lawyer."
                  : isDocumentDisputed
                  ? "Document has been disputed by the lawyer."
                  : "Document is awaiting lawyer review."}
              </p>
            </div>
          </div>
        )} */}
      {/* </div> */}

      {/* Notes panel */}
      {/* {showNotePanel && (
        <div className="bg-chart-3/10 mt-4 rounded-md border p-4">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="font-medium">Add Note to Document</h4>
            <Button size="sm" variant="ghost" onClick={() => setShowNotePanel(false)}>
              <X size={16} />
            </Button>
          </div>
          <Textarea
            className="mb-2"
            placeholder="Add your notes about this document here..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="flex justify-end">
            <Button size="sm">
              <Save className="mr-1" size={16} /> Save Note
            </Button>
          </div>
        </div>
      )} */}

      {/* Approve Document Modal */}
      {/* {showApproveModal && selectedDocument && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Approve Document</h3>
            <p className="mb-4">
              Are you sure you want to approve &quot;{selectedDocument?.name}
              &quot;?
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowApproveModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  handleDocumentApproval();
                  setShowApproveModal(false);
                }}
              >
                Approve Document
              </Button>
            </div>
          </div>
        </div>
      )} */}

      {/* Dispute Document Modal */}
      {/* {showDisputeModal && selectedDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card w-full max-w-md rounded-lg p-6">
            <h3 className="mb-4 text-lg font-semibold">Dispute Document</h3>
            <p className="mb-4">
              Please provide a reason for disputing &quot;
              {selectedDocument?.name}&quot;:
            </p>
            <Textarea
              className="mb-4"
              placeholder="Enter dispute reason..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDisputeModal(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  handleDocumentDispute()
                  setShowDisputeModal(false)
                }}
              >
                Submit Dispute
              </Button>
            </div>
          </div>
        </div>
      )} */}

      {/* Confirm Upload Modal */}
      {/* {showConfirmModal && selectedDocument && uploadState.file && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card w-full max-w-md rounded-lg p-6">
            <h3 className="mb-4 text-lg font-semibold">Confirm Document Upload</h3>
            <p className="mb-4">
              Are you sure you want to upload &quot;{uploadState.fileName}&quot; for document &quot;
              {selectedDocument.name}&quot;?
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
                Cancel
              </Button>
              <Button variant="default" onClick={handleUploadSubmit}>
                Upload Document
              </Button>
            </div>
          </div>
        </div>
      )} */}
    </div>
  )
}

export default DocumentViewer
