"use client"

import React from "react"

import { useDealStore } from "../store/dealStore"
import { ActionTypeEnum, FairLendRole } from "../utils/dealLogic"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle, CheckCircle2, History, UploadCloud } from "lucide-react"

export function DocumentModalsDSM() {
  const {
    userRole,
    showUploadModal,
    setShowUploadModal,
    showApproveModal,
    setShowApproveModal,
    showDisputeModal,
    setShowDisputeModal,
    showConfirmModal,
    setShowConfirmModal,
    note,
    setNote,
    confirmAmount,
    setConfirmAmount,
    mfaCode,
    setMfaCode,
    selectedDocument,
    uploadState,
    handleFileSelect,
    completeDocumentAction,
    uploadDocument,
    getDocumentVersions,
  } = useDealStore()

  // Get document versions for the selected document
  const documentVersions = selectedDocument ? getDocumentVersions(selectedDocument.id) : []

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDocument || !uploadState.file) return

    // Determine if this is a signed document upload
    const isSigned =
      (userRole === FairLendRole.BROKER && selectedDocument.requirements?.requiredBrokerSignature) ||
      (userRole === FairLendRole.BUYER && selectedDocument.requirements?.requiresBuyerSignature)

    // Upload the document with the appropriate signature flag
    //console.log("isSigned", isSigned)
    //console.log("userRole", userRole)
    //console.log("selectedDocument", selectedDocument)
    uploadDocument(uploadState.file)

    // Close the upload modal
    setShowUploadModal(false)
  }

  const handleApproveSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDocument) return

    completeDocumentAction(selectedDocument.id, ActionTypeEnum.APPROVE, userRole)
    setShowApproveModal(false)
    setNote("")
  }

  const handleDisputeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDocument || !note) return

    completeDocumentAction(selectedDocument.id, ActionTypeEnum.DISPUTE, userRole)
    setShowDisputeModal(false)
    setNote("")
  }

  const handleConfirmSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!confirmAmount || !mfaCode) return

    // In a real app, this would submit the confirmation
    setShowConfirmModal(false)
    setConfirmAmount("")
    setMfaCode("")
  }

  return (
    <>
      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedDocument ? `Upload ${selectedDocument.name}` : "Upload a document"}</DialogTitle>
            <DialogDescription>
              {selectedDocument?.requirements?.requiresBuyerSignature ||
              selectedDocument?.requirements?.requiredBrokerSignature
                ? "Upload a signed version of this document"
                : "Upload the requested document"}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleUploadSubmit}>
            {/* Display existing versions if there are any */}
            {documentVersions.length > 0 && (
              <div className="bg-muted/20 rounded-md p-3">
                <div className="mb-2 flex items-center gap-2">
                  <History className="text-muted-foreground h-4 w-4" />
                  <h4 className="text-sm font-medium">Existing Versions</h4>
                </div>
                <div className="max-h-32 space-y-2 overflow-y-auto">
                  {documentVersions.map((version) => (
                    <div key={version.id} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="text-xs">
                        {version.label}
                      </Badge>
                      <span className="text-muted-foreground text-xs">
                        Signed by {version.signedBy} on {new Date(version.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="file">Document File</Label>
              <div
                aria-label="Click to upload a file"
                className="hover:bg-muted/50 cursor-pointer rounded-md border-2 border-dashed p-6 text-center transition-colors"
                role="button"
                tabIndex={0}
                onClick={() => document.getElementById("file-upload")?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    document.getElementById("file-upload")?.click()
                  }
                }}
              >
                <input
                  className="hidden"
                  id="file-upload"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                />
                <UploadCloud className="text-muted-foreground mx-auto mb-2 h-10 w-10" />
                {uploadState.file ? (
                  <div>
                    <p className="text-sm font-medium">{uploadState.fileName}</p>
                    <p className="text-muted-foreground text-xs">{Math.round(uploadState.file.size / 1024)} KB</p>
                    <Progress className="mt-2 h-1" value={uploadState.progress} />
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium">Drag and drop a file, or click to browse</p>
                    <p className="text-muted-foreground text-xs">PDF, DOC, DOCX, JPG or PNG (max 10MB)</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this document..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowUploadModal(false)}>
                Cancel
              </Button>
              <Button disabled={!uploadState.file} type="submit">
                Upload Document
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Approve Modal */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="text-success h-5 w-5" />
              Approve Document
            </DialogTitle>
            <DialogDescription>
              {selectedDocument ? `Approve ${selectedDocument.name}` : "Approve document"}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleApproveSubmit}>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="approve-notes">Notes (Optional)</Label>
              <Textarea
                id="approve-notes"
                placeholder="Add any notes about this approval..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowApproveModal(false)}>
                Cancel
              </Button>
              <Button type="submit">Approve Document</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dispute Modal */}
      <Dialog open={showDisputeModal} onOpenChange={setShowDisputeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-destructive h-5 w-5" />
              Dispute Document
            </DialogTitle>
            <DialogDescription>
              {selectedDocument ? `Dispute ${selectedDocument.name}` : "Dispute document"}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleDisputeSubmit}>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="dispute-reason">
                Reason for Dispute <span className="text-destructive">*</span>
              </Label>
              <Textarea
                required
                id="dispute-reason"
                placeholder="Explain why you are disputing this document..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDisputeModal(false)}>
                Cancel
              </Button>
              <Button disabled={!note} type="submit" variant="destructive">
                Submit Dispute
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Funds Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Funds Transfer</DialogTitle>
            <DialogDescription>
              Please enter the amount and your MFA code to confirm the funds transfer.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleConfirmSubmit}>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="amount">
                Amount <span className="text-destructive">*</span>
              </Label>
              <Input
                required
                id="amount"
                placeholder="$0.00"
                value={confirmAmount}
                onChange={(e) => setConfirmAmount(e.target.value)}
              />
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="mfa-code">
                MFA Code <span className="text-destructive">*</span>
              </Label>
              <Input
                required
                id="mfa-code"
                placeholder="Enter 6-digit code"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowConfirmModal(false)}>
                Cancel
              </Button>
              <Button disabled={!confirmAmount || !mfaCode} type="submit">
                Confirm Transfer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
