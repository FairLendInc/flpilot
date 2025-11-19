"use client"

import React, { useState } from "react"

import SignPortal from "./docusign/signPortal"
import { Badge } from "components/ui/badge"
import { Button } from "components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card"
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  Clock,
  FileText,
  X,
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useDealStore } from "../store/dealStore"
import { ActionTypeEnum } from "../utils/dealLogic"

export function DocumentDetailDSM() {
  const {
    dsm: dsm2,
    currentUser: currentUser2,
    selectedDocument: selectedDocument2,
    setSelectedDocument: setSelectedDocument2,
    // getSigningTokenForUser,
    // userRole,
    // refreshDocuments,
    getDocState: getDocState2,
  } = useDealStore()
  
  // Mock functions
  const userRole = "buyer" // Mock role
  const refreshDocuments = () => console.log("Refreshing documents...")
  const getSigningTokenForUser = (docId: number, email: string) => `mock-token-${docId}-${email}`

  // State for full-screen signing modal
  const [isSigningModalOpen, setIsSigningModalOpen] = useState(false)

  const handleESign = () => {
    if (!selectedDocument2) return
    // Refresh Documenso-backed state after completion
    refreshDocuments()
    setIsSigningModalOpen(false)
    alert("Document has been successfully e-signed")
  }

  const handleApprove = () => {
    if (!selectedDocument2) return
    // Refresh Documenso-backed state after completion
    refreshDocuments()
    setIsSigningModalOpen(false)
    alert("Document has been successfully approved")
  }
  // Get dynamic signing URL for current user using the new context method
  const getSigningUrlForCurrentUser = (): string | null => {
    if (!selectedDocument2 || !currentUser2) {
      console.log("getSigningUrlForCurrentUser: Missing required data", {
        selectedDocument2: !!selectedDocument2,
        currentUser2: !!currentUser2,
      })
      return null
    }

    console.log(`getSigningUrlForCurrentUser: Getting signing token for document ${selectedDocument2.id} and user ${currentUser2.email}`)
    return getSigningTokenForUser(selectedDocument2.id, currentUser2.email)
  }

  const signingUrl = getSigningUrlForCurrentUser()
  const EMBEDDED_DOC_URL = signingUrl || "https://app.documenso.com/sign/g23SSsbqSBhIubRicNRDs" // fallback

  if (!selectedDocument2) {
    return (
      <div className="flex h-full flex-col items-center justify-center py-12">
        <FileText className="text-muted-foreground/50 mb-4 h-16 w-16" />
        <h3 className="mb-2 text-lg font-medium">No Document Selected</h3>
        <p className="text-muted-foreground max-w-md text-center">
          Select a document from the list to view its details and take actions.
        </p>
      </div>
    )
  }

  // Check if DSM is available
  if (!dsm2) {
    return (
      <div className="flex h-full flex-col items-center justify-center py-12">
        <FileText className="text-muted-foreground/50 mb-4 h-16 w-16" />
        <h3 className="mb-2 text-lg font-medium">Loading Document Details</h3>
        <p className="text-muted-foreground max-w-md text-center">Document system is initializing...</p>
      </div>
    )
  }

  // const docManager2 = dsm2.getDoc(selectedDocument2.id)
  // Mock docManager
  const docManager2 = dsm2.documents.find(d => d.id === selectedDocument2.id)

  if (!docManager2) {
    //console.log("DocumentDetailDSM: No document manager found for", selectedDocument.id)
    return (
      <div className="flex h-full flex-col items-center justify-center py-12">
        <AlertCircle className="text-destructive mb-4 h-16 w-16" />
        <h3 className="mb-2 text-lg font-medium">Document Not Found</h3>
        <p className="text-muted-foreground max-w-md text-center">Could not load details for this document.</p>
      </div>
    )
  }


  // const documentState2 = dsm2.getDocState(selectedDocument2.id)
  const documentState2 = getDocState2(selectedDocument2.id)
  const nextAction2 = documentState2?.action

  const getStatusIcon = () => {
    switch (documentState2?.action.action) {
      case ActionTypeEnum.COMPLETE:
        return <CheckCircle className="text-success h-5 w-5" />
      case ActionTypeEnum.APPROVE:
        return <CheckCircle className="text-primary h-5 w-5" />
      case ActionTypeEnum.ESIGN:
        return <CheckCircle className="text-primary h-5 w-5" />
      case ActionTypeEnum.UPLOAD:
        return <CheckCircle className="text-primary h-5 w-5" />
      case ActionTypeEnum.VIEW:
        return <Clock className="text-warning h-5 w-5" />
      case ActionTypeEnum.PREPARE:
        return <X className="text-destructive h-5 w-5" />
      default:
        return <AlertTriangle className="text-warning h-5 w-5" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed"
      case "lawyer_approved":
        return "Lawyer Approved"
      case "buyer_signed":
        return "Buyer Signed"
      case "broker_signed":
        return "Broker Signed"
      case "uploaded":
        return "Uploaded"
      case "buyer_lawyer_disputed":
        return "Disputed"
      case "admin_rejected":
        return "Rejected"
      case "not_started":
        return "Not Started"
      default:
        return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    }
  }
  
  return (
    <div className="space-y-4">
      <Button className="flex items-center gap-1" size="sm" variant="ghost" onClick={() => setSelectedDocument2(null)}>
        <ChevronLeft className="h-4 w-4" />
        <span>Back to documents</span>
      </Button>
       <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="text-primary h-5 w-5" />
              {selectedDocument2.name}
            </CardTitle>
            <Badge className="bg-muted/40 text-muted-foreground hover:bg-muted/60 flex items-center gap-1">
              {getStatusIcon()}
              <span>{getStatusLabel(documentState2?.action.action || "")}</span>
            </Badge>
          </div> 
                   {!signingUrl && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <h4 className="text-sm font-medium text-amber-800">No Signing URL Available</h4>
              </div>
              <p className="text-sm text-amber-700">
                Unable to find a signing URL for your user ({currentUser2?.email}). This may be because the document is
                not yet ready for signing or you may not be a recipient for this document.
              </p>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4 p-0">
          {EMBEDDED_DOC_URL && (
            <div className="">

              <Separator />
              <div className="h-[70vh] flex-1 overflow-hidden">
                {EMBEDDED_DOC_URL && (
                  <SignPortal
                    userRole={userRole}
                    signingToken={signingUrl}
                    handleESign={handleESign}
                    handleApprove={handleApprove}
                  />
                )}
              </div>
            </div>
          )}

        </CardContent>

      </Card>
    </div>
  )
}
