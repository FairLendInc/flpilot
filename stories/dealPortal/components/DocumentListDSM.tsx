"use client"

import React, { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, AlertCircle, CheckCircle, ChevronLeft, Clock, FileText, ShieldCheck, Stamp, HandCoins } from "lucide-react"
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
  // const docManager2 = dsm2.getDoc(document.id)
  // Mock docManager
  const docManager2 = documents.find((d) => d.id === document.id)

  if (!docManager2) {
    console.warn(`DocumentCard: Document manager not found for document ${document.id}`)
    return null
  }

  // Get document state with error handling  
  // const docState = dsm2.getDocState(document.id)
  const docState = getDocState2(document.id)

  if (!docState) {
    console.warn(`DocumentCard: Document state not found for document ${document.id}`)
    return null
  }

  // const requiredAction = docManager2.getCurrentAssignment()
  // const isCompleted = docManager2.isComplete()
  
  // Mock logic
  const requiredAction = docManager2.status === 'pending' ? { assignedToEmail: 'buyer@example.com', type: 'sign' } : null
  const isCompleted = docManager2.status === 'completed'
  
  // const currentUser2 = getCurrentUser2()
  const hasUserAction = requiredAction?.assignedToEmail === currentUser2?.email

  // Get document steps using new DSM methods with null safety
  // const steps = docManager2.getActionList() || []
  // const currentStep = docManager2.getActionIndex() || 0
  
  // Mock steps
  const steps: any[] = []
  const currentStep = 0

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


  // Get status icon and label from document state
  const getStatusIcon = () => {
    if (isCompleted) return <CheckCircle className="text-success h-4 w-4" />
    if (hasUserAction) return <AlertCircle className="text-destructive h-4 w-4" />
    if (hasAction) return <Clock className="text-warning h-4 w-4" />
    return <CheckCircle className="text-success h-4 w-4" />
  }

  const getStatusLabel = () => {
    if (isCompleted) return "COMPLETE"
    if (hasUserAction) return "Action Required"
    if (hasAction) return "BLOCKED"
    return "COMPLETE"
  }

  // These are computed inline in JSX for efficiency

  return (
    <Card
      className={`group overflow-hidden rounded-lg shadow-sm transition-all hover:shadow-md cursor-pointer ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={onClick}
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
                {/* <AlertTitle className="text-sm">{action.docName.toString()}</AlertTitle> */}
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
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  )
}

export function DocumentListDSM() {
  const {
    documents,
    activeDocumentGroup: activeDocumentGroup2,
    setActiveDocumentGroup: setActiveDocumentGroup2,
    selectedDocument: selectedDocument2,
    setSelectedDocument: setSelectedDocument2,
    getDocumentGroupName,
    calculateGroupStatus,
  } = useDealStore()
  
  const [groupDocuments, setGroupDocuments] = useState<any[]>([])

  useEffect(() => {
    if (!activeDocumentGroup2 || !documents) return

    // const group2 = dsm2.getGroup(activeDocumentGroup2)
    const group2 = documents.filter((d) => d.group === activeDocumentGroup2)

    if (group2) {
      const docs = group2.map((doc) => doc)
      setGroupDocuments(docs)
      console.log("DocumentListDSM: Loaded documents for group", activeDocumentGroup2, docs.length)
    } else {
      console.log("DocumentListDSM: No group found for", activeDocumentGroup2)
      setGroupDocuments([])
    }
  }, [documents, activeDocumentGroup2])

  if (!activeDocumentGroup2) {
    return (
      <div className="flex h-full flex-col items-center justify-center py-12">
        <FileText className="text-muted-foreground/50 mb-4 h-16 w-16" />
        <h3 className="mb-2 text-lg font-medium">No Document Group Selected</h3>
        <p className="text-muted-foreground max-w-md text-center">
          Select a document group to view the documents within it.
        </p>
      </div>
    )
  }


  // Small helper to choose an icon per group for visual identity
  const GroupIcon = ({ id }: { id: string }) => {
    switch (id) {
      case "mortgage":
        return <HandCoins className="h-4 w-4" />
      case "closing":
        return <Stamp className="h-4 w-4" />
      case "servicing":
        return <ShieldCheck className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const { percent, status } = calculateGroupStatus(activeDocumentGroup2)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          className="flex items-center gap-1"
          size="sm"
          variant="ghost"
          onClick={() => setActiveDocumentGroup2(null)}
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to groups</span>
        </Button>

        <div className="pr-2">
          <div className="border-content3/40 bg-muted/20 inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 shadow-sm">
            <span className="text-muted-foreground inline-flex items-center gap-2 truncate text-xs font-medium sm:text-sm">
              <GroupIcon id={activeDocumentGroup2} />
              <span className="truncate">{getDocumentGroupName(activeDocumentGroup2 || "")}</span>
            </span>
            <span className="text-muted-foreground/60">•</span>
            <Badge variant="outline" className="h-5 px-2 text-[10px] sm:text-xs">
              {status}
            </Badge>
            <div className="hidden items-center gap-2 sm:flex">
              <div className="bg-content3/40 h-1.5 w-28 overflow-hidden rounded-full">
                <div
                  className={`h-1.5 rounded-full ${percent === 100 ? "bg-success" : percent === 0 ? "bg-muted-foreground/40" : "bg-primary"}`}
                  style={{ width: `${Math.max(2, percent)}%` }}
                />
              </div>
              <span className="text-muted-foreground text-xs tabular-nums">{percent}%</span>
            </div>
          </div>
        </div>
      </div>

      <Card className="bg-background border-none shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {groupDocuments.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {groupDocuments.map((doc) => {
                return (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    onClick={() => setSelectedDocument2(doc)}
                    isSelected={selectedDocument2?.id === doc.id}
                  />
                )
              })}
            </div>
          ) : (
            <div className="flex h-24 flex-col items-center justify-center text-center">
              <FileText className="text-muted-foreground/50 mb-2 h-8 w-8" />
              <p className="text-muted-foreground">No documents in this group.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
