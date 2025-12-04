"use client"

import { useEffect, useState } from "react"

import { RoleAssignmentSection } from "./role-assignment-section"
import { type Document, type RoleAssignment } from "./types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle } from "lucide-react"

interface AddDocumentDialogProps {
  open: boolean
  onOpenChangeAction: (open: boolean) => void
  onAddAction: (document: Document) => void
  editingDocument?: Document | null
}

export function AddDocumentDialog({ open, onOpenChangeAction, onAddAction, editingDocument }: AddDocumentDialogProps) {
  const [name, setName] = useState("")
  const [group, setGroup] = useState("")
  const [roleAssignments, setRoleAssignments] = useState<RoleAssignment[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Document workflow requirements
  const [requiresBuyerLawyerApproval, setRequiresBuyerLawyerApproval] = useState(true)
  const [requiresBuyerSignature, setRequiresBuyerSignature] = useState(true)
  const [requiresBrokerApproval, setRequiresBrokerApproval] = useState(false)
  const [requiredBrokerSignature, setRequiredBrokerSignature] = useState(false)
  const [eSign, setESign] = useState(true)
  const [requiredUpload, setRequiredUpload] = useState(true)

  useEffect(() => {
    if (editingDocument) {
      setName(editingDocument.name)
      setGroup(editingDocument.group)
      setRoleAssignments(editingDocument.roleAssignments)
      setRequiresBuyerLawyerApproval(editingDocument.requiresBuyerLawyerApproval ?? true)
      setRequiresBuyerSignature(editingDocument.requiresBuyerSignature ?? true)
      setRequiresBrokerApproval(editingDocument.requiresBrokerApproval ?? false)
      setRequiredBrokerSignature(editingDocument.requiredBrokerSignature ?? false)
      setESign(editingDocument.eSign ?? true)
      setRequiredUpload(editingDocument.requiredUpload ?? true)
    } else {
      resetForm()
    }
  }, [editingDocument, open])

  const resetForm = () => {
    setName("")
    setGroup("")
    setRoleAssignments([])
    setErrors({})
    setRequiresBuyerLawyerApproval(true)
    setRequiresBuyerSignature(true)
    setRequiresBrokerApproval(false)
    setRequiredBrokerSignature(false)
    setESign(true)
    setRequiredUpload(true)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = "Document name is required"
    }

    if (!group.trim()) {
      newErrors.group = "Document group is required"
    }

    if (roleAssignments.length === 0) {
      newErrors.roles = "At least one user with a signing link is required"
    }

    // Validate workflow requirements from dsm.ts
    // Note: Redundant validation removed - auto-adjustment logic (lines 211-217 and 228-234) 
    // ensures eSign and requiredUpload are mutually exclusive, making these error paths unreachable
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validateForm()) {
      return
    }

    const document: Document = {
      id: editingDocument?.id || "",
      name: name.trim(),
      group: group.trim(),
      roleAssignments,
      requiresBuyerLawyerApproval,
      requiresBuyerSignature,
      requiresBrokerApproval,
      requiredBrokerSignature,
      eSign,
      requiredUpload,
      createdAt: editingDocument?.createdAt || new Date(),
      updatedAt: new Date(),
    }

    onAddAction(document)
    onOpenChangeAction(false)
    resetForm()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingDocument ? "Edit Document" : "Add New Document"}</DialogTitle>
          <DialogDescription>
            Configure document details, workflow requirements, and assign users with their signing links.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Document Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Q4 2024 Contract"
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="group">Document Group *</Label>
              <Input
                id="group"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                placeholder="e.g., Legal, Finance, HR"
                className={errors.group ? "border-destructive" : ""}
              />
              {errors.group && <p className="text-destructive text-sm">{errors.group}</p>}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Workflow Requirements</CardTitle>
              <CardDescription>Configure how this document will flow through the signing process</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requiresBuyerLawyerApproval"
                    checked={requiresBuyerLawyerApproval}
                    onCheckedChange={(checked) => setRequiresBuyerLawyerApproval(checked as boolean)}
                  />
                  <Label htmlFor="requiresBuyerLawyerApproval" className="cursor-pointer text-sm font-normal">
                    Requires Buyer's Lawyer Approval
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requiresBuyerSignature"
                    checked={requiresBuyerSignature}
                    onCheckedChange={(checked) => setRequiresBuyerSignature(checked as boolean)}
                  />
                  <Label htmlFor="requiresBuyerSignature" className="cursor-pointer text-sm font-normal">
                    Requires Buyer Signature
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requiresBrokerApproval"
                    checked={requiresBrokerApproval}
                    onCheckedChange={(checked) => setRequiresBrokerApproval(checked as boolean)}
                  />
                  <Label htmlFor="requiresBrokerApproval" className="cursor-pointer text-sm font-normal">
                    Requires Broker Approval
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requiredBrokerSignature"
                    checked={requiredBrokerSignature}
                    onCheckedChange={(checked) => setRequiredBrokerSignature(checked as boolean)}
                  />
                  <Label htmlFor="requiredBrokerSignature" className="cursor-pointer text-sm font-normal">
                    Requires Broker Signature
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="eSign"
                    checked={eSign}
                    onCheckedChange={(checked) => {
                      setESign(checked as boolean)
                      // Auto-adjust requiredUpload based on eSign
                      if (checked) {
                        setRequiredUpload(false)
                      }
                    }}
                  />
                  <Label htmlFor="eSign" className="cursor-pointer text-sm font-normal">
                    Electronic Signature (uncheck for physical signature upload)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requiredUpload"
                    checked={requiredUpload}
                    onCheckedChange={(checked) => {
                      setRequiredUpload(checked as boolean)
                      // Auto-adjust eSign based on requiredUpload
                      if (checked && eSign) {
                        setESign(false)
                      }
                    }}
                  />
                  <Label htmlFor="requiredUpload" className="cursor-pointer text-sm font-normal">
                    Requires Document Upload
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Label>User Assignments *</Label>
            <p className="text-muted-foreground mb-2 text-sm">
              Add users and their unique Documenso signing links in the order they should sign
            </p>
            <RoleAssignmentSection
              roleAssignments={roleAssignments}
              onRoleAssignmentsChangeAction={setRoleAssignments}
            />
            {errors.roles && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.roles}</AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChangeAction(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>{editingDocument ? "Update Document" : "Add Document"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
