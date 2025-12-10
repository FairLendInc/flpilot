"use client"

import React, { useEffect, useRef, useState } from "react"
import { useDealStore } from "../store/dealStore"
import { FairLendRole } from "../utils/dealLogic"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
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
  Loader2
} from "lucide-react"
// import { useAuth } from "@/lib/supabase/auth"
import Image from "next/image"
import { useMutation, useAction } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

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
  const { documents, logEvent, dealId, deal, currentUser } = useDealStore()
  // const { user, userRole } = useAuth()
  const user = currentUser
  
  // Convex actions/mutations
  const generateUploadUrl = useAction(api.deals.generateFundTransferUploadUrl);
  const recordUpload = useMutation(api.deals.recordFundTransferUpload);

  // State for the component
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragCounter, setDragCounter] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Expected amount (would come from the actual transaction details in a real app)
  const expectedAmount = "250,000.00"

  // Check if all document groups are complete
  const [allDocumentGroupsComplete, setAllDocumentGroupsComplete] = useState(false)

  // Get current upload from deal data
  // deal.deal is where the actual deal object is, based on getDealWithDetails return
  const currentUpload = deal?.deal?.currentUpload;
  const isApproved = deal?.deal?.validationChecks?.fundsReceived; // Or verified? Using fundsReceived as proxy for now or add a field

  // Check document completion status
  useEffect(() => {
    if (!documents) {
      setAllDocumentGroupsComplete(false)
      return
    }
    const allComplete = documents.every((doc) => doc.isComplete)
    setAllDocumentGroupsComplete(allComplete)
  }, [documents])

  // Calculate group completion percentage
  const calculateGroupCompletion = (groupId: string) => {
    if (!documents) {
      console.log("FundsTransferVerification: Documents not available for group completion calculation")
      return { percent: 0, status: "Loading..." }
    }

    const group = documents.filter((d) => d.group === groupId)

    if (!group || group.length === 0) {
      return { percent: 0, status: "Not Started" }
    }

    const docs = group
    const completed = docs.filter((doc) => {
      return doc.isComplete
    }).length

    const total = docs.length
    const percent = Math.round((completed / total) * 100)

    if (percent === 100) return { percent, status: "Completed" }
    if (percent === 0) return { percent, status: "Not Started" }

    return { percent, status: "In Progress" }
  }

  // Handler functions
  const processFile = async (file: File) => {
    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a valid file type (JPEG, PNG, PDF)")
      return
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB")
      return
    }

    // Runtime type guard for dealId
    if (!dealId || typeof dealId !== "string" || dealId.trim() === "") {
      toast.error("Deal ID is required for upload")
      return
    }

    setUploadedFile(file)
    setIsUploading(true)
    setUploadModalOpen(true) // Show modal to show progress

    try {
      // 1. Get upload URL
      const postUrl = await generateUploadUrl({ dealId: dealId as Id<"deals"> });

      // 2. Upload file
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error(`Upload failed: ${result.statusText}`);
      }

      const responseData = await result.json();
      
      // Runtime type guard for storageId
      if (!responseData.storageId || typeof responseData.storageId !== "string") {
        throw new Error("Invalid response: storageId is missing or not a string");
      }

      // 3. Record upload
      await recordUpload({
        dealId: dealId as Id<"deals">,
        storageId: responseData.storageId as Id<"_storage">,
        fileName: file.name,
        fileType: file.type,
      });

      // Log the upload event
      logEvent({
        type: "upload",
        description: `Funds transfer receipt uploaded: ${file.name}`,
        documentName: file.name,
        documentGroup: "funds_transfer",
      })

      setUploadModalOpen(false)
      setUploadedFile(null)
      toast.success("File uploaded successfully!")
    } catch (error) {
      console.error("Upload failed:", error)
      toast.error("Upload failed. Please try again.")
    } finally {
      setIsUploading(false)
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
    setDragCounter((prev) => {
      const next = prev - 1;
      if (next === 0) setIsDragging(false);
      return next;
    })
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

  // Determine if the component should be disabled
  const isDisabled = !allDocumentGroupsComplete

  // Determine role-specific UI elements

  console.log("FundsTransferVerification: user", user)
  console.log("FundsTransferVerification: userRole", user?.role)
  //TODO: This is a temporary fix to determine the role of the user. We need to improve this.
  // const isBuyer = user?.role === FairLendRole.BUYER || user?.role?.toLowerCase().search('investor') !== -1
  // const isBroker = user?.role === FairLendRole.BROKER || user?.role?.toLowerCase().search('broker') !== -1
  // const isAdmin = user?.role === FairLendRole.ADMIN || user?.role?.toLowerCase().search('admin') !== -1

  // Generate status badge
  const getStatusBadge = () => {
    if (isApproved)
      return (
        <Badge className="border-0 bg-gradient-to-r from-emerald-500 to-green-500 px-3 py-1 text-white shadow-md shadow-emerald-200/50">
          <CheckCircle className="mr-1 h-3 w-3" />
          Approved
        </Badge>
      )
    if (currentUpload && !isApproved)
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
        ) : currentUpload ? (
          <div className="space-y-4">
            <div className="bg-accent/30 border-border rounded-xl border p-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="bg-primary flex h-12 w-12 items-center justify-center rounded-xl shadow-md">
                    <FileText className="text-primary-foreground h-6 w-6" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate font-semibold">{currentUpload.fileName}</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Uploaded{" "}
                    {currentUpload.uploadedAt
                      ? format(new Date(currentUpload.uploadedAt), "MMM d, yyyy 'at' h:mm a")
                      : ""}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {currentUpload.fileType}
                  </p>
                </div>
              </div>
            </div>

            {/* Replace/Update button */}
            {!isApproved && (
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
                   Replace Receipt
                 </Button>
               </div>
            )}
          </div>
        ) : isUploading ? (
          <div className="bg-accent/30 border-border rounded-xl border p-6">
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <div>
                <h3 className="text-foreground mb-1 text-lg font-semibold">Uploading Receipt</h3>
                <p className="text-muted-foreground text-sm">Processing your transfer verification...</p>
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
                  <span>JPEG, PNG</span>
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

      {/* Upload Modal (Progress) */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Uploading Funds Transfer Receipt</DialogTitle>
            <DialogDescription>Please wait while we upload your file.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
             <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
