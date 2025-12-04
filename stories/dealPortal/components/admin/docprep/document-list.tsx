"use client"

import { useState } from "react"

import { type Document, RoleLabels } from "./types"
import { FairLendRole as RoleType } from "../../../utils/dealLogic"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Edit, Link, MoreHorizontal, Trash2, Users } from "lucide-react"

interface DocumentListProps {
  documents: Document[]
  onEditAction: (document: Document) => void
  onDeleteAction: (documentId: string) => void
}

export function DocumentList({ documents, onEditAction, onDeleteAction }: DocumentListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null)

  const handleDeleteClick = (document: Document) => {
    setDocumentToDelete(document)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (documentToDelete) {
      onDeleteAction(documentToDelete.id)
      setDeleteDialogOpen(false)
      setDocumentToDelete(null)
    }
  }

  const getRoleCounts = (document: Document) => {
    const counts: Record<RoleType, number> = {
      [RoleType.BUYER]: 0,
      [RoleType.BUYER_LAWYER]: 0,
      [RoleType.BROKER]: 0,
      [RoleType.ADMIN]: 0,
      [RoleType.LAWYER]: 0,
      [RoleType.SYSTEM]: 0,
      [RoleType.NONE]: 0,
    }

    document.roleAssignments.forEach((assignment) => {
      counts[assignment.role]++
    })

    return counts
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getWorkflowBadges = (document: Document) => {
    const badges = []

    if (document.requiresBuyerLawyerApproval) {
      badges.push({ label: "Lawyer Approval", variant: "secondary" as const })
    }
    if (document.requiresBuyerSignature) {
      badges.push({ label: "Buyer Signature", variant: "default" as const })
    }
    if (document.requiredBrokerSignature) {
      badges.push({ label: "Broker Signature", variant: "outline" as const })
    }
    if (document.eSign) {
      badges.push({ label: "E-Sign", variant: "default" as const })
    } else {
      badges.push({ label: "Physical Sign", variant: "secondary" as const })
    }
    if (document.requiredUpload) {
      badges.push({ label: "Upload Required", variant: "outline" as const })
    }

    return badges
  }

  if (documents.length === 0) {
    return (
      <Card className="p-8">
        <p className="text-muted-foreground text-center">No documents found</p>
      </Card>
    )
  }

  return (
    <>
      <TooltipProvider>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Name</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Workflow</TableHead>
                <TableHead>Users & Links</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((document) => {
                const roleCounts = getRoleCounts(document)
                const workflowBadges = getWorkflowBadges(document)

                return (
                  <TableRow key={document.id}>
                    <TableCell className="font-medium">{document.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{document.group}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {workflowBadges.slice(0, 3).map((badge, index) => (
                          <Badge key={index} variant={badge.variant} className="text-xs">
                            {badge.label}
                          </Badge>
                        ))}
                        {workflowBadges.length > 3 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="secondary" className="cursor-help text-xs">
                                +{workflowBadges.length - 3} more
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="space-y-1">
                                {workflowBadges.slice(3).map((badge, index) => (
                                  <div key={index}>{badge.label}</div>
                                ))}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Users className="mr-2 h-4 w-4" />
                            {document.roleAssignments.length} Users
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-96">
                          <ScrollArea className="h-[300px]">
                            <div className="space-y-3">
                              {document.roleAssignments
                                .sort((a, b) => a.signingOrder - b.signingOrder)
                                .map((assignment) => (
                                  <div key={assignment.userId} className="bg-muted/50 rounded-lg border p-3">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <Badge
                                            variant="secondary"
                                            className="flex h-6 w-6 items-center justify-center rounded-full p-0 text-xs"
                                          >
                                            {assignment.signingOrder}
                                          </Badge>
                                          <p className="text-sm font-medium">{assignment.userName}</p>
                                          <Badge variant="outline" className="text-xs">
                                            {RoleLabels[assignment.role]}
                                          </Badge>
                                        </div>
                                        <p className="text-muted-foreground text-xs">{assignment.userEmail}</p>
                                        <div className="mt-1 flex items-center gap-1">
                                          <span className="text-muted-foreground max-w-[250px] truncate text-xs">
                                            {assignment.signingLink}
                                          </span>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => copyToClipboard(assignment.signingLink)}
                                            className="h-6 w-6 p-0"
                                          >
                                            <Link className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </ScrollArea>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => onEditAction(document)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDeleteClick(document)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </TooltipProvider>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the document "{documentToDelete?.name}" and all its role assignments. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
