"use client"

import React from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, CheckCircle, Clock, FileText } from "lucide-react"
import HorizontalSteps from "./ui/horizontal-steps"
import { useDealStore } from "../store/dealStore"
import { ActionTypeEnum, Document as DocumensoDoc, ActionAssignment } from "../utils/dealLogic"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const actionToTitle = (action: ActionAssignment) => {
  const actionTitle = action.type.toString().replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  const assignedToSplit = action.assignedTo.toString().split("_")
  let assignedTo = (assignedToSplit.length > 1 ? assignedToSplit[1] : assignedToSplit[0])
  if (!assignedTo) {
    return actionTitle
  }
  assignedTo = assignedTo.replace(/^[a-z]/, (l) => l.toUpperCase())
  return `${assignedTo} ${actionTitle}`
}

interface DocumentCardProps {
  document: DocumensoDoc
  isSelected: boolean
  onClick: () => void
}

const DocumentCard = ({
  document,
  onClick,
  isSelected,
}: DocumentCardProps) => {
  // Use dual context hooks during migration
  const { documents, currentUser: currentUser2, getDocState: getDocState2 } = useDealStore()

  // Early return if documents are not available yet
  if (!documents) {
    return (
      <Card className="group overflow-hidden rounded-lg shadow-sm">
        <div className="bg-muted h-1 w-full rounded-t-lg" />
        <CardHeader className="pb-2">
          <CardTitle className="text-md flex items-center gap-2 font-semibold">
            <FileText className="h-4 w-4 flex-shrink-0" />
            <span className="break-words line-clamp-2">Loading...</span>
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  // Get document manager with error handling
  const docManager2 = documents.find((d) => d.id === document.id)

  if (!docManager2) {
    console.warn(`DocumentCard: Document manager not found for document ${document.id}`)
    return null
  }

  // Get document state with error handling
  const docState = getDocState2(document.id)

  if (!docState) {
    console.warn(`DocumentCard: Document state not found for document ${document.id}`)
    return null
  }

  // Use document properties
  const requiredAction = !docManager2.isComplete ? { assignedToEmail: docManager2.assignedTo, type: docManager2.requiredAction } : null
  const isCompleted = docManager2.isComplete

  const hasUserAction = requiredAction?.assignedToEmail?.toLowerCase() === currentUser2?.email?.toLowerCase()

  // Get document steps using signingSteps property, sorted by order
  const steps = document.signingSteps
    ? [...document.signingSteps]
        .sort((a, b) => a.order - b.order)
        .map(s => ({
          assignedToName: s.name || s.email,
          action: String(s.role) === "LAWYER" ? "Review" : "Sign",
          status: s.status
        }))
    : []

  // Calculate current step based on first non-signed step (after sorting)
  const sortedSigningSteps = document.signingSteps
    ? [...document.signingSteps].sort((a, b) => a.order - b.order)
    : []
  const currentStepIndex = sortedSigningSteps.findIndex(s => s.status !== 'SIGNED')
  const currentStep = currentStepIndex === -1 ? steps.length : currentStepIndex

  // Calculate progress (simplified for individual document)
  const hasAction = !isCompleted

  // Get action details from document
  const actionType = docState.action || ActionTypeEnum.NONE
  const assignedToName = docManager2.assignedTo || "Unknown"

  // Generate action text with better logic
  const actionText = hasUserAction ?
    `${actionType}` :
    hasAction ?
      `${actionType} by ${assignedToName}` :
      "Complete"

  const actionTextObject = {
    status: hasUserAction ? "Action Required" : hasAction ? "BLOCKED" : "COMPLETE",
    assignedTo: assignedToName,
    action: actionType,
  }

  return (
    <div
      className="cursor-pointer transition-transform duration-200 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98]"
      onClick={onClick}
    >
      <Card
        className={`group overflow-hidden rounded-lg shadow-sm transition-all hover:shadow-md ${ isSelected ? "ring-2 ring-primary" : ""
        }`}
      >
        <div
          className={`h-1 w-full rounded-t-lg ${
            hasUserAction ? "bg-destructive" :
            !isCompleted && hasAction ? "bg-warning" :
            "bg-success"
          }`}
        />

        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-md flex items-center gap-2 font-semibold">
              <FileText className="h-4 w-4 flex-shrink-0" />
              <span className="break-words line-clamp-2">{document.name}</span>
            </CardTitle>
            {!isCompleted ? (
              hasUserAction ? (
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive">
                  Action Required
                </Badge>
              ) : hasAction ? (
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning">
                  BLOCKED
                </Badge>
              ) : null
            ) : (
              <Badge variant="outline" className="bg-success/10 text-success border-success">
                COMPLETE
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-2 pb-0">
          {steps.length > 0 && (
            <div className="mt-3">
              <HorizontalSteps
                currentStep={currentStep}
                steps={steps.map((step) => ({
                  title: (
                    <>
                      {step.assignedToName}
                      <br />
                      {step.action.toString().charAt(0).toUpperCase() + step.action.toString().slice(1)}
                    </>
                  ),
                }))}
              />
            </div>
          )}
        </CardContent>

        <CardFooter className="w-full flex-col items-start pt-3">
          {!isCompleted && hasAction && (
            <div className="border-content3 mt-2 flex w-full items-center border-t pt-3">
              {hasUserAction ? (
                <Alert
                key={`blocked-${document.id}`}
                className="border-destructive/50 text-destructive [&>svg]:text-destructive"
              >
                <AlertCircle className="h-4 w-4" />
                <div>
                  <AlertDescription className="text-sm">
                    {"Action Required: "}
                    <Badge variant="outline" className="mx-2">
                      {actionTextObject.action.toString().split("_").map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                    </Badge>
                  </AlertDescription>
                </div>
              </Alert>
              ) : (
                <Alert
                key={`blocked-${document.id}`}
                className="border-warning/50 text-warning [&>svg]:text-warning"
              >
                <AlertCircle className="h-4 w-4" />
                <div>
                  <AlertTitle className="text-sm">
                    {"Waiting on: "}
                    <Badge variant="outline" className="mx-2">
                      {actionTextObject.assignedTo}
                    </Badge>
                    </AlertTitle>
                  <AlertDescription className="text-sm">
                    {"Required action: "}
                    <Badge variant="outline" className="mx-2">
                      {actionTextObject.action.toString().split("_").map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                    </Badge>
                  </AlertDescription>
                </div>
              </Alert>
              )
              }
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

export function DocumentListDSM() {
  const {
    documents,
    selectedDocument,
    setSelectedDocument,
    isLoadingDocuments,
    documentsError,
  } = useDealStore()

  // Compute overall progress across all documents
  const completedCount = documents.filter(d => d.isComplete).length
  const totalCount = documents.length
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  // Show loading state
  if (isLoadingDocuments) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="group overflow-hidden rounded-lg shadow-sm">
            <div className="bg-muted h-1 w-full rounded-t-lg" />
            <CardHeader className="pb-2">
              <div className="bg-muted h-4 w-32 rounded" />
            </CardHeader>
            <CardContent className="pt-2 pb-0">
              <div className="bg-muted h-2 w-full rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Show error state
  if (documentsError) {
    return (
      <Card className="group overflow-hidden rounded-lg shadow-sm">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertCircle size={16} />
            Error Loading Documents
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  // Show empty state
  if (!documents || documents.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center py-12">
        <FileText className="text-muted-foreground/50 mb-4 h-16 w-16" />
        <h3 className="mb-2 text-lg font-medium">No Documents</h3>
        <p className="text-muted-foreground max-w-md text-center">
          No documents have been added to this deal yet.
        </p>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in slide-in-from-left-4 duration-200">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Progress
            value={percent}
            className="bg-content3 h-2 flex-1"
            aria-label={`${percent}% complete`}
          />
          <span className="text-muted-foreground text-xs tabular-nums">{percent}%</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onClick={() => setSelectedDocument(doc)}
              isSelected={selectedDocument?.id === doc.id}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
