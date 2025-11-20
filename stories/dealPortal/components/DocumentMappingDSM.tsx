"use client"

import React, { useEffect, useState } from "react"

import HorizontalSteps from "./ui/horizontal-steps"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, AlertTriangle, CheckCircle, ChevronRight, Clock, File, FileText, Upload } from "lucide-react"
import { useDealStore } from "../store/dealStore"
import { ActionTypeEnum, FairLendRole, ActionAssignment, Document as DocumensoDoc } from "../utils/dealLogic"
import { createLogger } from "../mocks/logger";

export interface DocumentCardProps {
  groupId: string
  showActions?: boolean
  groupStatus?: {
    actionNames: string[]
    completedIndex: number
  }
  groupActionSteps?: {
    hasUpload: boolean
    hasApprove: boolean
    hasSign: boolean
  }
}

export type GroupSteps = {
    action: ActionTypeEnum;
    assignedTo: {
      email: string;
      name: string;
    };
    assignedToRole: FairLendRole | undefined;
}

const DocumentCard = ({ groupId, showActions = true }: DocumentCardProps) => {
  const { documents,
    currentUser:currentUser2,
    getGroupStatusForUser:getGroupStatusForUser2,
    setActiveDocumentGroup:setActiveDocumentGroup2,
    setSelectedDocument:setSelectedDocument2,
    hasPendingActions:hasPendingActions2, 
    getDocumentGroupName:getDocumentGroupName2,
    getGroupActionSteps:getGroupActionSteps2 } = useDealStore()
  
  const logger = createLogger("app:DocumentMappingDSM")

  // Initialize state with null-safe defaults
  const [currentStep, setCurrentStep] = useState(0)
  const [groupSteps, setGroupSteps] = useState<GroupSteps[]>([])

  // Update state when documents become available
  React.useEffect(() => {
    if (documents.length > 0) {
      // Mock implementation since dsm might not have getGroupStatus
      // In a real implementation, we would use the store's helper functions
    }
  }, [documents, groupId])

  // Early return if documents are not available yet
  if (!documents) {
    return (
      <Card className="group overflow-hidden rounded-lg shadow-sm">
        <div className="bg-muted h-1 w-full rounded-t-lg" />
        <CardHeader className="pb-2">
          <CardTitle className="text-md flex items-center gap-2 font-semibold">Loading...</CardTitle>
        </CardHeader>
        <CardContent className="pt-2 pb-0">
          <Progress value={0} className="bg-content3 h-2" />
          <div className="text-muted-foreground mt-1 flex justify-between text-xs">
            <span>Loading documents...</span>
            <span>0% Complete</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Use the state variables that were initialized before the early return
  // groupStatusData, currentStep, and groupSteps are already defined above

  const steps = groupSteps.map((step) => ({
    title: step.assignedTo.name + " " + step.action.toString().charAt(0).toUpperCase() + step.action.toString().slice(1),
  }))

  // Get the group from documents
  const group2 = documents.filter((d) => d.group === groupId)

  if (!group2 || group2.length === 0) {
    console.warn(`DocumentMappingDSM: Group ${groupId} not found in documents`)
    return null
  }

  // Add error handling for group status calls
  let groupStatus2, groupStatusForUser
  try {
    // groupStatus2 = dsm2?.getGroupStatus(groupId)
    groupStatusForUser = getGroupStatusForUser2(groupId) || null
  } catch (error) {
    console.error(`DocumentMappingDSM: Error getting group status for ${groupId}:`, error)
    return null
  }
  
  const percent = groupStatusForUser?.percentComplete ?? 0
  const pendingActionsForGroup = groupStatusForUser?.actionsNotAssignedToUser ?? []
  const pendingGroupActionsForUser = groupStatusForUser?.actionsAssignedToUser ?? []
  const groupSteps2 = groupStatusForUser?.groupSteps ?? []
  const groupStepIndex = groupStatusForUser?.groupStepIndex ?? 0


  const docGroupName = getDocumentGroupName2(groupId)
  let pendingAction = groupSteps[currentStep]
  if (!pendingAction) pendingAction = { action: ActionTypeEnum.COMPLETE, assignedTo: { email: "", name: "" }, assignedToRole: undefined }
  const showActionRequired = pendingAction.action !== ActionTypeEnum.COMPLETE

  const currentAction = groupSteps2[groupStepIndex]
  const assignedTo = currentAction?.assignedTo
  
  const hasUserActionsInGroup = assignedTo?.email?.toLowerCase() === currentUser2?.email?.toLowerCase()

  const showWarningBadge = showActionRequired && hasUserActionsInGroup

  return (
    <Card className={`group overflow-hidden rounded-lg shadow-sm transition-shadow hover:shadow-md`}>
      <div
        className={`h-1 w-full rounded-t-lg ${
          showActionRequired ? (showWarningBadge ? "bg-destructive" : "bg-warning") : "bg-success"
        }`}
      />
      <CardHeader className="cursor-pointer pb-2" onClick={() => {
        console.log("CLICKED GROUP", groupId)
        setActiveDocumentGroup2(groupId)
      }}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-md flex items-center gap-2 font-semibold">
            {docGroupName}
          </CardTitle>
          {showActionRequired ? (
            showWarningBadge ? (
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive">
                Action Required
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning">
                BLOCKED
              </Badge>
            )
          ) : (
            <Badge variant="outline" className="bg-success/10 text-success border-success">
              COMPLETE
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent
        onClick={() => setActiveDocumentGroup2(groupId)}
        className="flex cursor-pointer flex-col justify-around pt-2 pb-0 lg:px-2 xl:px-4"
      >
        <Progress value={percent} className="bg-content3 h-2" />
        <div className="text-muted-foreground mt-1 flex justify-between text-xs">
          <span>
            {group2.length} document
            {group2.length !== 1 ? "s" : ""}
          </span>
          <span>{percent}% Complete</span>
        </div>
        <HorizontalSteps currentStep={groupStepIndex} steps={steps} />
      </CardContent>
      {showActions && (
        <CardFooter className="w-full flex-col items-start">
          {showActionRequired && (
            <div className="border-content3 mt-3 w-full space-y-3 border-t pt-3">
              {pendingGroupActionsForUser.length > 0 && (
                <div className="w-full space-y-2">
                  <div className="flex w-full items-center justify-between">
                    <div className="text-destructive flex items-center gap-2 text-sm font-medium">
                      <AlertTriangle size={14} />
                      Your required actions
                    </div>
                    <Badge variant="outline" className="border-destructive text-destructive">
                      {pendingGroupActionsForUser.length}
                    </Badge>
                  </div>
                  <div className="w-full flex flex-col gap-2">
                    {pendingGroupActionsForUser.map((action: ActionAssignment, index: number) => (
                      <Alert key={`you-${index}`} variant="destructive" className="bg-background cursor-pointer z-50" onClick={() => {
                        console.log("CLICKED ACTION", action)
                        // setActiveDocumentGroup2(groupId)
                        setSelectedDocument2(action.doc as DocumensoDoc)
                      }}>
                        <AlertCircle className="h-4 w-4" />
                        <div>
                          <AlertTitle className="text-sm">{action.docName.toString()}</AlertTitle>
                          <AlertDescription className="text-xs">
                            Action: {action.action.toString()}
                          </AlertDescription>
                        </div>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}

              {pendingGroupActionsForUser.length > 0 && pendingActionsForGroup.length > 0 && (
                <Separator className="bg-content3" />
              )}

              {pendingActionsForGroup.length > 0 && (
                <div className="w-full space-y-2">
                  <div className="flex w-full items-center justify-between">
                    <div className="text-warning flex items-center gap-2 text-sm font-medium">
                      <Clock size={14} />
                      Waiting on others
                    </div>
                    <Badge variant="outline" className="border-warning text-warning">
                      {pendingActionsForGroup.length}
                    </Badge>
                  </div>
                  <div className="w-full flex flex-col gap-2">
                    {pendingActionsForGroup.map((action: ActionAssignment, index: number) => (
                      <Alert
                        key={`others-${index}`}
                        className="border-warning/50 text-warning [&>svg]:text-warning cursor-pointer z-50"
                        onClick={() => {
                          console.log("CLICKED ACTION", action)
                          // setActiveDocumentGroup2(groupId)
                          setSelectedDocument2(action.doc as DocumensoDoc)
                        }}
                      >
                        <AlertCircle className="h-4 w-4" />
                        <div>
                          <AlertTitle className="text-sm">{action.docName.toString()}</AlertTitle>
                          <AlertDescription className="text-xs">
                            Action: {action.action.toString()}
                            Waiting on {action.assignedToName.toString()} to {action.action.toString()}
                          </AlertDescription>
                        </div>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  )
}

export function DocumentMappingDSM() {
  const {
    documents,
    getGroupActionSteps: getGroupActionSteps2,
    getGroupStatusForUser: getGroupStatusForUser2,
    isLoadingDocuments: isLoadingDocuments2,
    documentsError: documentsError2,
  } = useDealStore()
  const [documentGroups, setDocumentGroups] = useState<string[]>([])
  //console.log("DocumentMappingDSM: User role:", userRole)

  useEffect(() => {
    // Get all document group IDs from the documents
    if (documents && documents.length > 0) {
      const groups = Array.from(new Set(documents.map((d) => d.group))) as string[]
      setDocumentGroups(groups)
      console.log("DocumentMappingDSM: Loaded document groups:", groups)
    } else {
      console.log("DocumentMappingDSM: No documents available yet")
      setDocumentGroups([])
    }
  }, [documents])

  // Show loading state
  if (isLoadingDocuments2) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="group overflow-hidden rounded-lg shadow-sm">
            <div className="bg-muted h-1 w-full animate-pulse rounded-t-lg" />
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center gap-2 font-semibold">
                <div className="bg-muted h-4 w-32 animate-pulse rounded" />
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2 pb-0">
              <div className="bg-muted h-2 w-full animate-pulse rounded" />
              <div className="mt-1 flex justify-between">
                <div className="bg-muted h-3 w-20 animate-pulse rounded" />
                <div className="bg-muted h-3 w-16 animate-pulse rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Show error state
  if (documentsError2) {
    return (
      <Card className="group overflow-hidden rounded-lg shadow-sm">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertCircle size={16} />
            Error Loading Documents
          </CardTitle>
          <CardDescription>{documentsError2}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // Show empty state if no documents or no groups
  if (!documents || documents.length === 0 || documentGroups.length === 0) {
    console.log("DocumentMappingDSM: Empty state triggered", { documentsCount: documents?.length, documentGroups })
    return (
      <Card className="group overflow-hidden rounded-lg shadow-sm">
        <CardHeader>
          <CardTitle>No Documents Available</CardTitle>
          <CardDescription>
            {isLoadingDocuments2 ? "Document system is initializing..." : "No document groups found for this deal."}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
      {documentGroups.map((groupId, index) => {
        try {
          // Convert the group status to the expected format (with null check)
          // const groupStatus = dsm2.getGroupStatus(groupId)
          // Mock groupStatus
          const groupStatus = { stepList: [] }

          // Derive the groupActionSteps from the group status
          // const actionNames = groupStatus.stepList.map((step) => step.action.toString().toLowerCase())
          const actionNames: string[] = []
          const groupActionSteps = {
            hasUpload: actionNames.some((name) => name.includes("upload")),
            hasApprove: actionNames.some((name) => name.includes("approve")),
            hasSign: actionNames.some((name) => name.includes("sign")),
          }

          return (
            <DocumentCard
              key={`${groupId}-${index}`}
              groupId={groupId}
              groupActionSteps={groupActionSteps}
            />
          )
        } catch (error) {
          console.error("Error rendering document group", groupId, error)
          return (
            <Card key={groupId} className="group overflow-hidden rounded-lg shadow-sm">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <AlertCircle size={16} />
                  Error Loading Group
                </CardTitle>
                <CardDescription>Failed to load {groupId}</CardDescription>
              </CardHeader>
            </Card>
          )
        }
      })}
    </div>
  )
}

export function DocumentProgressList() {
  const {
    documents,
    currentUser: currentUser2,
    getGroupActionSteps: getGroupActionSteps2,
    getGroupStatusForUser: getGroupStatusForUser2,
    isLoadingDocuments: isLoadingDocuments2,
    documentsError: documentsError2,
    setActiveDocumentGroup: setActiveDocumentGroup2,
    setSelectedDocument: setSelectedDocument2,
    setActiveTab: setActiveTab2,
  } = useDealStore()
  const [documentGroups, setDocumentGroups] = useState<string[]>([])

  useEffect(() => {
    const groups = documents?.map((d) => d.group) || []
    // Get all document group IDs from the documents
    if (groups.length > 0) {
      const uniqueGroups = Array.from(new Set(groups)) as string[]
      setDocumentGroups(uniqueGroups)
    } else {
      setDocumentGroups([])
    }
  }, [documents])

  const handleGroupClick = (groupId: string) => {
    if (!documents) {
      console.log("Documents not available for group click:", groupId)
      return
    }

    const group2 = documents.filter((d) => d.group === groupId)
    console.log("GROUP: ", group2)
    if (!group2 || group2.length === 0) return

    // Find the first document in this group that has an action assigned to the current user
    /*
    const userDocument = group2.find((docManager) => {
      const nextAction = docManager.getCurrentAssignment()
      const assignedTo = nextAction?.assignedToEmail || ""
      return assignedTo.toLowerCase() === currentUser2?.email?.toLowerCase()
    })
    */
   // Mock logic
    const userDocument = group2[0]

    if (userDocument) {
      setActiveDocumentGroup2(groupId)

      // Set the active document group and selected document
      setActiveDocumentGroup2(groupId)
      setSelectedDocument2(userDocument)
      // Switch to documents tab to show the detail view
      setActiveTab2("documents")
    }
  }

  return (
    <div className="space-y-2">
      {documentGroups.map((groupId) => {
        const group = documents?.filter((d) => d.group === groupId)
        if (!group) return null

        // Check if any documents in this group have actions assigned to the current user
        /*
        const hasUserAssignments = group.some((docManager) => {
          const nextAction = docManager.getCurrentAssignment()
          const assignedTo = nextAction?.assignedToEmail || ""
          
          console.log("GROUP: ", group)
          console.log("NEXT ACTION", nextAction)
          console.log("NEXT ACTION ASSIGNED TO", assignedTo)
          return assignedTo.toLowerCase() === currentUser2?.email?.toLowerCase()
        })
        */
       // Mock logic
       const hasUserAssignments = true

        if (!hasUserAssignments) return null

        return (
          <Button
            key={groupId}
            variant="ghost"
            className="h-auto w-full justify-start p-3 text-left"
            onClick={() => handleGroupClick(groupId)}
          >
            <div className="flex items-center gap-3">
              <FileText className="text-primary h-5 w-5" />
              <div className="flex-1">
                <div className="text-sm font-medium">{groupId}</div>
                <div className="text-muted-foreground text-xs">
                  {/*
                    group.filter((docManager) => {
                      const nextAction = docManager.getCurrentAssignment()
                      const assignedTo = nextAction?.assignedToEmail || ""
                      
                      return assignedTo.toLowerCase() === currentUser2?.email?.toLowerCase()
                    }).length
                  */ 1}{" "}
                  pending action(s)
                </div>
              </div>
              <ChevronRight className="text-muted-foreground h-4 w-4" />
            </div>
          </Button>
        )
      })}
    </div>
  )
}

export function DocumentActionsList() {

  const {
    currentUser,
    setActiveDocumentGroup: setActiveDocumentGroup2,
    setSelectedDocument: setSelectedDocument2,
    setActiveTab: setActiveTab2,
    getRoleAssignments: getRoleAssignments2,
    documents,
  } = useDealStore()

  const [assignments, setAssignments] = useState<ActionAssignment[]>([])

  // Update when userRole changes or when a document action is completed
  useEffect(() => {
    //console.log("DocumentActionsList: UserRole changed to:", userRole, "updating assignments...")
    // Add a small delay to ensure role is properly updated
    const timeoutId = setTimeout(() => {
      const newAssignments = getRoleAssignments2()
      console.log("NEW ASSIGNMENTS", newAssignments)
      setAssignments(newAssignments)
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [getRoleAssignments2])

  // Poll for changes - this catches any external state updates
  useEffect(() => {
    const getSignature = (arr: ActionAssignment[]) =>
      arr
        .map(a => `${a.docId ?? ""}|${a.action}|${a.assignedToEmail}|${a.completedAt ?? ""}`)
        .sort()
        .join("||")

    const interval = setInterval(() => {
      const currentAssignments = getRoleAssignments2()
      console.log("CURRENT ASSIGNMENTS", currentAssignments)
      // Only update if there's a difference in assignments (compare on serializable signature)
      const prevSig = getSignature(assignments)
      const nextSig = getSignature(currentAssignments)
      if (prevSig !== nextSig) {
        setAssignments(currentAssignments)
      }
    }, 10000) // Check every 10 seconds

    return () => clearInterval(interval)
  }, [getRoleAssignments2, assignments])

  const getActionIcon = (action: string) => {
    switch (action) {
      case "upload":
      case "upload_signed":
        return <Upload className="h-4 w-4" />
      case "sign":
        return <File className="h-4 w-4" />
      case "approve":
        return <CheckCircle className="h-4 w-4" />
      case "prepare":
        return <Clock className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const handleActionClick = (assignment: ActionAssignment) => {
    // Switch to documents tab
    // setActiveTab("documents")
    console.log("ASSIGNMENT", assignment)
    setActiveTab2("documents")

    // Set the active document group
    setActiveDocumentGroup2(assignment.docGroup || null)

    // Get and set the selected document
    if (!documents) {
      console.warn("Documents not available when handling action click.")
      return
    }
    const document2 = documents.find((d) => d.id === assignment.docId)
    console.log("DOCUMENT2", document2)
    if (document2) {
      // setSelectedDocument(document)
      setSelectedDocument2(document2)
    }
  }

  if (assignments.length === 0) {
    return <div className="text-muted-foreground p-4 text-center">No pending actions</div>
  }

  return (
    <div className="space-y-2">
      {assignments.map((assignment, index) => (
        <Card
          key={index}
          className="hover:bg-muted/50 my-2 w-full cursor-pointer py-0 transition-colors"
          onClick={() => handleActionClick(assignment)}
        >
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              {getActionIcon(assignment.action)}
              <div className="flex-1">
                <div className="text-sm font-medium">{assignment.docName}</div>
                <div className="text-muted-foreground text-xs">
                  {assignment.action === ActionTypeEnum.PREPARE ? 'Prepare' : assignment.action.charAt(0).toUpperCase() + assignment.action.slice(1)}
                </div>
              </div>
              <ChevronRight className="text-muted-foreground h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
