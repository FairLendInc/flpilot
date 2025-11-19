"use client"

import React, { useEffect, useRef, useState } from "react"
import { useDealStore } from "../store/dealStore"
import { FairLendRole } from "../utils/dealLogic"
import { Alert, AlertDescription, AlertTitle } from "components/ui/alert"
import { Badge } from "components/ui/badge"
import { Button } from "components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "components/ui/dialog"
import { Input } from "components/ui/input"
import { Label } from "components/ui/label"
import { Progress } from "components/ui/progress"
import { Separator } from "components/ui/separator"
import { Textarea } from "components/ui/textarea"
// import { api } from "trpc/react"
import { format } from "date-fns"
import {
  AlertTriangle,
  Ban,
  Check,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  Upload,
  X,
} from "lucide-react"
// import { useAuth } from "lib/supabase/auth"
import Image from "next/image"

// Define a type for the funds transfer state
export interface FundsTransferState {
  isUploaded: boolean
  isApproved: boolean
  isDisputed: boolean
  receiptData?: string
  receiptFileName?: string
  receiptFileType?: string
  receiptFileSize?: number
  uploadedBy?: string
  uploadedAt?: string
  approvedBy?: string
  approvedAt?: string
  disputedBy?: string
  disputedAt?: string
  disputeReason?: string
  amount?: string
}

// Type for saved data in localStorage
interface SavedFundsTransferData {
  isApproved: boolean
  isDisputed: boolean
  fileName?: string
  uploadDate?: string
  disputeReason?: string
  filePreviewUrl?: string
}

// Type guard to validate saved data
function isValidSavedData(data: unknown): data is SavedFundsTransferData {
  return (
    typeof data === "object" &&
    data !== null &&
    "isApproved" in data &&
    "isDisputed" in data &&
    typeof (data as any).isApproved === "boolean" &&
    typeof (data as any).isDisputed === "boolean"
  )
}

// Define an interface for document group
interface DocumentGroup {
  id: string
  name: string
  isComplete: boolean
  documents: any[] // Replace with proper document type if available
}

export function FundsTransferVerification() {
  const { dsm, logEvent, uploadState, handleFileSelect, dealId, dealData, currentUser } = useDealStore()
  // const { user, userRole } = useAuth()
  const user = currentUser
  
  // State for the component
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [disputeReason, setDisputeReason] = useState("")

  // Mock data for receipt
  const [existingReceipt, setExistingReceipt] = useState<any>(null)
  const [signedUrl, setSignedUrl] = useState<{ url: string } | null>(null)

  // Mock mutations
  const uploadReceiptMutation = { mutateAsync: async (data: any) => { console.log("Mock upload", data); setExistingReceipt({ ...data, id: 123, createdAt: new Date().toISOString() }) } }
  const updateReceiptMutation = { mutateAsync: async (data: any) => { console.log("Mock update", data); setExistingReceipt({ ...existingReceipt, ...data }) } }
  const deleteReceiptMutation = { mutateAsync: async (data: any) => { console.log("Mock delete", data); setExistingReceipt(null) } }
  const approveReceiptMutation = { mutateAsync: async (data: any) => { console.log("Mock approve", data); setExistingReceipt({ ...existingReceipt, brokerApproved: true }) } }
  const rollbackApprovalMutation = { mutateAsync: async (data: any) => { console.log("Mock rollback", data); setExistingReceipt({ ...existingReceipt, brokerApproved: false }) } }
  
  const refetchReceipt = async () => { console.log("Mock refetch") }

  /*
  // tRPC queries and mutations
  const { data: existingReceipt, refetch: refetchReceipt } = api.fundTransferReceipt.getByDeal.useQuery(
    { dealId: dealId! },
    { enabled: !!dealId }
  )

  const uploadReceiptMutation = api.fundTransferReceipt.upload.useMutation()
  const updateReceiptMutation = api.fundTransferReceipt.update.useMutation()
  const deleteReceiptMutation = api.fundTransferReceipt.delete.useMutation()
  const approveReceiptMutation = api.fundTransferReceipt.approve.useMutation()
  const rollbackApprovalMutation = api.fundTransferReceipt.rollbackApproval.useMutation()
  const shouldFetchSignedUrl = !!existingReceipt?.id
  const { data: signedUrl } = api.fundTransferReceipt.getSignedUrl.useQuery(
    shouldFetchSignedUrl ? { receiptId: Number(existingReceipt.id) } : (undefined as never),
    { enabled: shouldFetchSignedUrl }
  )
  */

  // Check if all document groups are complete
  const [allDocumentGroupsComplete, setAllDocumentGroupsComplete] = useState(false)

  // Modal states
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [approveModalOpen, setApproveModalOpen] = useState(false)
  const [disputeModalOpen, setDisputeModalOpen] = useState(false)

  // Form inputs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [enteredAmount, setEnteredAmount] = useState("")

  // Drag and drop states
  const [isDragging, setIsDragging] = useState(false)
  const [dragCounter, setDragCounter] = useState(0)

  // Expected amount (would come from the actual transaction details in a real app)
  const expectedAmount = "250,000.00"

  // Local state for funds transfer data
  const [fundsTransfer, setFundsTransfer] = useState<FundsTransferState>({
    isUploaded: false,
    isApproved: false,
    isDisputed: false,
  })

  // Check document completion status
  useEffect(() => {
    if (!dsm) {
      console.log("FundsTransferVerification: DSM not available yet")
      setAllDocumentGroupsComplete(false)
      return
    }

    try {
      // Check if all document groups are complete
      const allComplete = Array.from(dsm.listGroups()).every((groupId) => {
        const { percent } = calculateGroupCompletion(groupId)
        return percent === 100
      })

      setAllDocumentGroupsComplete(allComplete)
      console.log("FundsTransferVerification: Document completion check completed", { allComplete })
    } catch (error) {
      console.error("FundsTransferVerification: Error checking document completion:", error)
      setAllDocumentGroupsComplete(false)
    }
  }, [dsm])

  // Calculate group completion percentage
  const calculateGroupCompletion = (groupId: string) => {
    if (!dsm) {
      console.log("FundsTransferVerification: DSM not available for group completion calculation")
      return { percent: 0, status: "Loading..." }
    }

    const group = dsm.getGroup(groupId)

    if (!group || group.length === 0) {
      return { percent: 0, status: "Not Started" }
    }

    const docs = group
    const completed = docs.filter((docManager) => {
      return docManager.isComplete
    }).length

    const total = docs.length
    const percent = Math.round((completed / total) * 100)

    if (percent === 100) return { percent, status: "Completed" }
    if (percent === 0) return { percent, status: "Not Started" }

    return { percent, status: "In Progress" }
  }

  // Set file preview URL when signed URL is available
  useEffect(() => {
    if (signedUrl?.url && existingReceipt?.mimeType?.startsWith("image/")) {
      setFilePreviewUrl(signedUrl.url)
    }
  }, [signedUrl, existingReceipt])

  // Handler functions
  const processFile = async (file: File) => {
    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      alert("Please upload a valid file type (JPEG, PNG, GIF, or PDF)")
      return
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB")
      return
    }

    if (!dealId) {
      alert("Deal ID is required for upload")
      return
    }

    setUploadedFile(file)
    setIsUploading(true)

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result
          if (typeof result === "string") {
            const base64 = result.split(",")[1]
            if (base64 !== undefined) {
              resolve(base64) // Remove data:image/jpeg;base64, prefix
            } else {
              reject(new Error("Failed to extract base64 string from file"))
            }
          } else {
            reject(new Error("FileReader result is not a string"))
          }
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      // Upload or update receipt
      if (existingReceipt && !existingReceipt.brokerApproved) {
        await updateReceiptMutation.mutateAsync({
          receiptId: existingReceipt.id,
          originalFileName: file.name,
          fileSize: file.size.toString(),
          mimeType: file.type,
          fileBase64: base64,
        })
      } else if (!existingReceipt) {
        await uploadReceiptMutation.mutateAsync({
          dealId,
          originalFileName: file.name,
          fileSize: file.size.toString(),
          mimeType: file.type,
          fileBase64: base64,
        })
      }

      // Refetch receipt data
      await refetchReceipt()

      // Log the upload event
      logEvent({
        type: "upload",
        description: `Funds transfer receipt uploaded: ${file.name}`,
        documentName: file.name,
        documentGroup: "funds_transfer",
      })

      setIsUploading(false)
    } catch (error) {
      console.error("Upload failed:", error)
      alert("Upload failed. Please try again.")
      setIsUploading(false)
      setUploadedFile(null)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0])
    }
  }

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCounter((prev) => prev + 1)
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCounter((prev) => prev - 1)
    if (dragCounter === 1) {
      setIsDragging(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    setDragCounter(0)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (file) {
        processFile(file)
      }
      e.dataTransfer.clearData()
    }
  }

  const handleClickToUpload = () => {
    fileInputRef.current?.click()
  }

  const handleUpload = () => {
    if (!uploadedFile) return

    setIsUploading(true)

    // Simulate upload progress
    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      setUploadProgress(progress)

      if (progress >= 100) {
        clearInterval(interval)
        setIsUploading(false)
        setUploadModalOpen(false)

        // Log the upload event
        logEvent({
          type: "upload",
          description: `Funds transfer receipt uploaded: ${uploadedFile.name}`,
          documentName: uploadedFile.name,
          documentGroup: "funds_transfer",
        })
      }
    }, 300)
  }

  const handleApproveConfirmation = async () => {
    // Check if the entered amount matches the expected amount
    if (enteredAmount.replace(/,/g, "") === expectedAmount.replace(/,/g, "")) {
      if (!existingReceipt) {
        alert("No receipt found to approve")
        return
      }

      try {
        await approveReceiptMutation.mutateAsync({
          receiptId: existingReceipt.id,
        })

        await refetchReceipt()
        setApproveModalOpen(false)

        // Log the approval event
        logEvent({
          type: "approve",
          description: `Funds transfer receipt approved for $${expectedAmount}`,
          documentGroup: "funds_transfer",
        })
      } catch (error) {
        console.error("Approval failed:", error)
        alert("Approval failed. Please try again.")
      }
    } else {
      // Handle amount mismatch - could show an error
      alert("Amount does not match the expected value. Please verify and try again.")
    }
  }

  const handleDisputeSubmission = () => {
    if (disputeReason.trim() === "") {
      alert("Please provide a reason for the dispute.")
      return
    }

    // setIsDisputed(true)
    // setIsApproved(false)
    setDisputeModalOpen(false)

    // Log the dispute event
    logEvent({
      type: "dispute",
      description: `Funds transfer disputed: ${disputeReason}`,
      documentGroup: "funds_transfer",
    })
  }

  // Determine if the component should be disabled
  const isDisabled = !allDocumentGroupsComplete

  // Determine role-specific UI elements

  console.log("FundsTransferVerification: user", user)
  console.log("FundsTransferVerification: userRole", user?.role)
  //TODO: This is a temporary fix to determine the role of the user. We need to improve this.
  const isBuyer = user?.role === FairLendRole.BUYER || user?.role?.toLowerCase().search("investor") !== -1
  const isBroker = user?.role === FairLendRole.BROKER || user?.role?.toLowerCase().search("broker") !== -1
  const isAdmin = user?.role === FairLendRole.ADMIN || user?.role?.toLowerCase().search("admin") !== -1

  // Generate status badge
  const getStatusBadge = () => {
    if (existingReceipt?.brokerApproved)
      return (
        <Badge className="border-0 bg-gradient-to-r from-emerald-500 to-green-500 px-3 py-1 text-white shadow-md shadow-emerald-200/50">
          <CheckCircle className="mr-1 h-3 w-3" />
          Approved
        </Badge>
      )
    if (existingReceipt && !existingReceipt.brokerApproved)
      return (
        <Badge className="bg-primary text-primary-foreground border-0 px-3 py-1 shadow-md">
          <Clock className="mr-1 h-3 w-3" />
          Pending Verification
        </Badge>
      )
    return (
      <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5">
        <Upload className="h-3 w-3" />
        <span>Not Submitted</span>
      </Badge>
    )
  }

  if (isDisabled) {
    return null
  }
  return (
    <Card className="border-border bg-card mt-4 border shadow-lg backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-foreground text-xl font-semibold">Funds Transfer Verification</CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              {isDisabled ? "Complete all document groups to enable" : "Upload receipt of funds transfer"}
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent>
        {isDisabled ? (
          <Alert className="border-border bg-muted/30 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-full">
                  <Clock className="text-primary-foreground h-4 w-4" />
                </div>
              </div>
              <div>
                <AlertTitle className="text-foreground font-semibold">Documents Pending</AlertTitle>
                <AlertDescription className="text-muted-foreground mt-1">
                  Complete all document signing processes before uploading your transfer receipt.
                </AlertDescription>
              </div>
            </div>
          </Alert>
        ) : existingReceipt ? (
          <div className="space-y-4">
            <div className="bg-accent/30 border-border rounded-xl border p-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="bg-primary flex h-12 w-12 items-center justify-center rounded-xl shadow-md">
                    <FileText className="text-primary-foreground h-6 w-6" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate font-semibold">{existingReceipt.originalFileName}</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Uploaded{" "}
                    {existingReceipt.createdAt
                      ? format(new Date(existingReceipt.createdAt), "MMM d, yyyy 'at' h:mm a")
                      : ""}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {(Number(existingReceipt.fileSize) / 1024 / 1024).toFixed(2)} MB •{" "}
                    {existingReceipt.mimeType?.split("/")[1]?.toUpperCase() || "Unknown"}
                  </p>
                </div>
              </div>
            </div>

            {filePreviewUrl && (
              <div className="border-border bg-card relative h-[300px] overflow-hidden rounded-xl border shadow-sm">
                <div className="absolute top-3 right-3 z-10">
                  <Badge variant="outline" className="bg-card/90 backdrop-blur-sm">
                    Preview
                  </Badge>
                </div>
                <Image
                  src={filePreviewUrl}
                  alt="Receipt preview"
                  fill
                  sizes="(max-width: 768px) 100vw, 768px"
                  className="bg-card object-contain"
                />
              </div>
            )}

            {/* Download link for non-image files */}
            {!existingReceipt.mimeType?.startsWith("image/") && (
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" className="border-primary/20 text-primary hover:bg-primary/10">
                  <a href={signedUrl?.url || "#"} target="_blank" rel="noopener noreferrer">
                    <FileText className="mr-2 h-4 w-4" /> Download Receipt
                  </a>
                </Button>
              </div>
            )}

            {/* Add Update/Delete buttons for non-approved receipts */}
            {!existingReceipt.brokerApproved && isBuyer && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const fileInput = document.createElement("input")
                    fileInput.type = "file"
                    fileInput.accept = "image/*,.pdf"
                    fileInput.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0]
                      if (file) processFile(file)
                    }
                    fileInput.click()
                  }}
                  className="text-primary border-primary/20 hover:bg-primary/10"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Update Receipt
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (confirm("Are you sure you want to delete this receipt?")) {
                      try {
                        await deleteReceiptMutation.mutateAsync({
                          receiptId: existingReceipt.id,
                        })
                        await refetchReceipt()
                        setUploadedFile(null)
                        setFilePreviewUrl(null)
                      } catch (error) {
                        console.error("Delete failed:", error)
                        alert("Delete failed. Please try again.")
                      }
                    }
                  }}
                  className="text-destructive border-destructive/20 hover:bg-destructive/10"
                >
                  <X className="mr-2 h-4 w-4" />
                  Delete Receipt
                </Button>
              </div>
            )}

            {/* Admin-only rollback button when approved */}
            {existingReceipt.brokerApproved && (isAdmin || isBroker) && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!existingReceipt) return
                    if (
                      !confirm(
                        "Rollback approval for this receipt? This will move the deal back to Pending Funds Transfer."
                      )
                    ) {
                      return
                    }
                    try {
                      await rollbackApprovalMutation.mutateAsync({ receiptId: existingReceipt.id })
                      await refetchReceipt()
                    } catch (error) {
                      console.error("Rollback failed:", error)
                      alert("Rollback failed. Please try again.")
                    }
                  }}
                  className="border-destructive/20 text-destructive hover:bg-destructive/10"
                >
                  <X className="mr-2 h-4 w-4" /> Rollback Approval
                </Button>
              </div>
            )}
          </div>
        ) : isUploading ? (
          <div className="bg-accent/30 border-border rounded-xl border p-6">
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-center">
                <div className="relative">
                  <div className="bg-primary flex h-16 w-16 items-center justify-center rounded-full shadow-lg">
                    <Upload className="text-primary-foreground h-8 w-8 animate-pulse" />
                  </div>
                  <div className="bg-card absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full shadow-md">
                    <div className="bg-primary h-3 w-3 animate-spin rounded-full" />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-foreground mb-1 text-lg font-semibold">Uploading Receipt</h3>
                <p className="text-muted-foreground text-sm">Processing your transfer verification...</p>
              </div>
              <div className="space-y-2">
                <Progress value={uploadProgress} className="h-2 w-full" />
                <p className="text-foreground text-center text-sm font-medium">{uploadProgress}% complete</p>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl px-8 py-12 transition-all duration-300 ${
              isDragging
                ? "border-primary bg-accent/50 scale-[1.02] border-2 shadow-lg"
                : "border-border bg-card hover:border-primary/50 border-2 border-dashed hover:shadow-md"
            } ${isDisabled ? "cursor-not-allowed opacity-50" : ""} `}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={!isDisabled ? handleClickToUpload : undefined}
          >
            {/* Upload icon */}
            <div
              className={`relative z-10 mb-6 rounded-2xl p-4 transition-all duration-300 ${
                isDragging ? "bg-primary scale-110 shadow-lg" : "bg-muted group-hover:bg-accent group-hover:scale-105"
              } `}
            >
              <Upload
                className={`h-8 w-8 transition-colors duration-300 ${
                  isDragging ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
                }`}
              />
            </div>

            <div className="relative z-10 space-y-3 text-center">
              <div>
                <h3
                  className={`mb-2 text-xl font-semibold transition-colors duration-300 ${
                    isDragging ? "text-primary" : "text-foreground"
                  }`}
                >
                  {isDragging ? "Drop your file here" : "Upload Transfer Receipt"}
                </h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  Drag and drop your receipt file or{" "}
                  <span className="text-primary decoration-primary/30 hover:decoration-primary/60 font-medium underline transition-colors">
                    click to browse
                  </span>
                </p>
              </div>

              <div className="text-muted-foreground flex items-center justify-center space-x-4 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="bg-primary h-2 w-2 rounded-full" />
                  <span>JPEG, PNG, GIF</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="bg-destructive h-2 w-2 rounded-full" />
                  <span>PDF</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="bg-primary h-2 w-2 rounded-full" />
                  <span>Max 10MB</span>
                </div>
              </div>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="hidden"
              disabled={isDisabled}
            />
          </div>
        )}
      </CardContent>

      {existingReceipt && !existingReceipt.brokerApproved && isBroker && (
        <CardFooter className="border-border flex justify-end gap-3 border-t pt-4">
          <Button
            variant="outline"
            onClick={() => setDisputeModalOpen(true)}
            className="group border-destructive/20 text-destructive hover:bg-destructive/10 hover:border-destructive/30 shadow-sm transition-all duration-200"
          >
            <X className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
            Dispute Transfer
          </Button>
          <Button
            variant="default"
            onClick={() => setApproveModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground group shadow-md transition-all duration-200"
          >
            <Check className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
            Approve Transfer
          </Button>
        </CardFooter>
      )}

      {/* Upload Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Funds Transfer Receipt</DialogTitle>
            <DialogDescription>Please upload a receipt or invoice showing the funds transfer.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="receipt">Receipt File</Label>
              <Input id="receipt" type="file" accept="image/*,.pdf" ref={fileInputRef} onChange={handleFileChange} />
              <p className="text-sm text-gray-500">Accepted formats: PDF, JPEG, PNG</p>
            </div>

            {isUploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-center text-sm text-gray-500">Uploading: {uploadProgress}%</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!uploadedFile || isUploading}>
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Modal */}
      <Dialog open={approveModalOpen} onOpenChange={setApproveModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Funds Transfer</DialogTitle>
            <DialogDescription>Please verify the amount before approving.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="amount">Confirm Amount ($)</Label>
              <Input
                id="amount"
                type="text"
                value={enteredAmount}
                onChange={(e) => setEnteredAmount(e.target.value)}
                placeholder="Enter amount from receipt"
              />
              <p className="text-sm text-gray-500">Expected amount: ${expectedAmount}</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApproveConfirmation} disabled={!enteredAmount}>
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dispute Modal */}
      <Dialog open={disputeModalOpen} onOpenChange={setDisputeModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dispute Funds Transfer</DialogTitle>
            <DialogDescription>Please provide a reason for disputing this transfer.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="reason">Reason for Dispute</Label>
              <Textarea
                id="reason"
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Please explain why you're disputing this transfer"
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDisputeModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDisputeSubmission} disabled={!disputeReason.trim()}>
              Submit Dispute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
