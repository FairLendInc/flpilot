"use client"

import React, { useState } from "react"

import SignPortal from "./docusign/signPortal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { ActionTypeEnum, Document as DocumensoDoc } from "../utils/dealLogic"

export function DocumentDetailDSM() {
  const {
    documents,
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
  // Return null to trigger fallback to demo document
  const getSigningTokenForUser = (docId: string, email: string) => null

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

    // Check for direct token in document (populated from Documenso recipients)
    if (selectedDocument2.recipientTokens && selectedDocument2.recipientTokens[currentUser2.email]) {
      const token = selectedDocument2.recipientTokens[currentUser2.email]
      console.log(`getSigningUrlForCurrentUser: Found token for user ${currentUser2.email}: ${token}`)
      return `https://app.documenso.com/sign/${token}`
    }

    console.log(`getSigningUrlForCurrentUser: No token found for user ${currentUser2.email}, using fallback`)
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

  // Check if documents are available
  if (!documents) {
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
  const docManager2 = documents.find((d) => d.id === selectedDocument2.id)

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
          {/* Check if current user has already signed */}
          {selectedDocument2.recipientStatus && 
           currentUser2 && 
           selectedDocument2.recipientStatus[currentUser2.email] === 'SIGNED' ? (
            <div className="flex h-[400px] flex-col items-center justify-center space-y-6 bg-gradient-to-b from-background to-muted/20 p-8 text-center">
              <div className="relative">
                <div className="absolute -inset-4 animate-pulse rounded-full bg-success/20 blur-xl" />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-success/10 ring-1 ring-success/20">
                  <CheckCircle className="h-12 w-12 text-success animate-in zoom-in duration-500" />
                </div>
              </div>
              
              <div className="space-y-2 max-w-md animate-in slide-in-from-bottom-4 duration-700 fade-in">
                <h3 className="text-2xl font-bold tracking-tight">You're all set!</h3>
                <p className="text-muted-foreground">
                  You have successfully signed <span className="font-medium text-foreground">{selectedDocument2.name}</span>.
                  We'll notify you when all other parties have completed their actions.
                </p>
              </div>

              <div className="flex gap-3 animate-in slide-in-from-bottom-8 duration-1000 fade-in fill-mode-backwards delay-300">
                <Button variant="outline" className="gap-2">
                  <FileText className="h-4 w-4" />
                  View Document
                </Button>
                <Button variant="default" className="gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Return to Dashboard
                </Button>
              </div>
            </div>
          ) : EMBEDDED_DOC_URL && (
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
