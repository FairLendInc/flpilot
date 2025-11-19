"use client"

import React, { useEffect, useRef, useState } from "react"

import { useDealStore } from "../store/dealStore"
import { FairLendRole } from "../utils/dealLogic"
import { Button } from "components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "components/ui/tooltip"
import { Download, Eye, FilePlus, FileText, Trash2, Upload } from "lucide-react"

// Define shared file type
interface SharedFile {
  id: string
  name: string
  type: string
  size: number
  data: string // Base64 data
  uploadedBy: string
  uploadedAt: Date
}

const SharedDocumentsPanel = () => {
  const { userRole, logEvent } = useDealStore()

  // State for shared files
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([])

  // Load files from localStorage on component mount
  useEffect(() => {
    const savedFiles = localStorage.getItem("sharedFiles")
    if (savedFiles) {
      try {
        // @ts-ignore
        setSharedFiles(JSON.parse(savedFiles))
      } catch (e) {
        console.error("Failed to parse saved files", e)
      }
    }
  }, [])

  // Save files to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("sharedFiles", JSON.stringify(sharedFiles))
  }, [sharedFiles])

  // Create ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle file upload button click
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Process file after selection
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Read file as data URL
    const reader = new FileReader()
    reader.onload = (e) => {
      const fileData = e.target?.result as string

      // Create new shared file object
      const newFile: SharedFile = {
        id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: file.name,
        type: file.type,
        size: file.size,
        data: fileData,
        uploadedBy: roleToDisplayName(userRole as FairLendRole),
        uploadedAt: new Date(),
      }

      // Add to shared files
      setSharedFiles((prev) => [...prev, newFile])

      // Log the upload
      logEvent({
        type: "upload",
        description: `Uploaded shared file: ${file.name}`,
        documentName: file.name,
      })

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }

    reader.readAsDataURL(file)
  }

  // Handle file download
  const handleDownload = (file: SharedFile) => {
    // Create a link element
    const link = document.createElement("a")
    link.href = file.data
    link.download = file.name
    document.body.appendChild(link)

    // Trigger download
    link.click()

    // Clean up
    document.body.removeChild(link)

    // Log the download
    logEvent({
      type: "download",
      description: `Downloaded shared file: ${file.name}`,
      documentName: file.name,
    })
  }

  // Handle file view
  const handleView = (file: SharedFile) => {
    // Open file in new tab
    window.open(file.data, "_blank")

    // Log the view
    logEvent({
      type: "view",
      description: `Viewed shared file: ${file.name}`,
      documentName: file.name,
    })
  }

  // Handle file delete
  const handleDelete = (fileId: string) => {
    const fileToDelete = sharedFiles.find((f) => f.id === fileId)
    if (!fileToDelete) return

    setSharedFiles((prev) => prev.filter((f) => f.id !== fileId))

    // Log the deletion
    logEvent({
      type: "system",
      description: `Deleted shared file: ${fileToDelete.name}`,
      documentName: fileToDelete.name,
    })
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " bytes"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  return (
    <div className="space-y-6">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.xls,.xlsx"
      />

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Shared Workspace</h3>
        <Button size="sm" onClick={handleUploadClick}>
          <FilePlus className="mr-2" size={16} /> Share New File
        </Button>
      </div>

      {sharedFiles.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sharedFiles.map((file) => (
            <Card key={file.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="max-w-[80%] truncate">
                    <CardTitle className="truncate text-base">{file.name}</CardTitle>
                    <CardDescription className="text-xs">Shared by: {file.uploadedBy}</CardDescription>
                  </div>
                  <FileText className="text-muted-foreground" size={18} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground mb-3 flex justify-between text-xs">
                  <span>{formatFileSize(file.size)}</span>
                  <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <Button size="sm" variant="outline" onClick={() => handleView(file)}>
                    <Eye className="mr-1" size={14} /> View
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDownload(file)}>
                    <Download className="mr-1" size={14} /> Download
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end pt-0">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleDelete(file.id)}>
                        <Trash2 size={14} className="text-muted-foreground hover:text-destructive" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Remove file</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Button
          variant="outline"
          className="hover:bg-muted/50 flex w-full flex-col items-center justify-center border-dashed p-8"
          onClick={handleUploadClick}
        >
          <Upload className="text-muted-foreground mb-3" size={32} />
          <p className="text-muted-foreground mb-2 text-center">No shared files yet</p>
          <p className="text-muted-foreground text-center text-sm">Click to share a file with all participants</p>
        </Button>
      )}
    </div>
  )
}

// Helper function to convert role to display name
function roleToDisplayName(role: FairLendRole): string {
  switch (role) {
    case FairLendRole.BROKER:
      return "Broker"
    case FairLendRole.BUYER_LAWYER:
      return "Lawyer"
    case FairLendRole.BUYER:
      return "Buyer"
    case FairLendRole.SYSTEM:
      return "System"
    case FairLendRole.ADMIN:
      return "Admin"
    default:
      return "User"
  }
}

export default SharedDocumentsPanel
