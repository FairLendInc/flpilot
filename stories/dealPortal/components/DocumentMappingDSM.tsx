"use client"

import React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, CheckSquare, ChevronRight, Clock, File, FileText, Upload } from "lucide-react"
import { useDealStore } from "../store/dealStore"
import { ActionTypeEnum, ActionAssignment, Document as DocumensoDoc } from "../utils/dealLogic"

export function DocumentActionsList() {
  const {
    currentUser: currentUser2,
    getRoleAssignments: getRoleAssignments2,
    documents,
    setSelectedDocument: setSelectedDocument2,
    setActiveTab: setActiveTab2,
  } = useDealStore()

  // Directly call getRoleAssignments2 on each render
  // This ensures the component re-renders when store state changes
  const assignments = getRoleAssignments2()

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
    console.log("ASSIGNMENT", assignment)
    setActiveTab2("documents")

    // Set the selected document directly (no group navigation needed)
    if (assignment.docId) {
      const doc = documents.find((d) => d.id === assignment.docId)
      if (doc) {
        setSelectedDocument2(doc)
      }
    }
  }

  // Early return if no user
  if (!currentUser2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>No user selected</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // Early return if no assignments
  if (assignments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>No pending actions for {currentUser2.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-center text-sm">
            All documents have been completed or are waiting on others.
          </div>
        </CardContent>
      </Card>
    )
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
