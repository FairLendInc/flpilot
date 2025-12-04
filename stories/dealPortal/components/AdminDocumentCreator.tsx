"use client"

import React, { useMemo, useState } from "react"

import { useDealStore } from "../store/dealStore"
import { FairLendRole } from "../utils/dealLogic"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FilePlus, Upload } from "lucide-react"

const AdminDocumentCreator = () => {
  const { userRole, documents } = useDealStore()

  // State for the form
  const [documentName, setDocumentName] = useState("")
  const [documentGroup, setDocumentGroup] = useState("")
  const [requiresApproval, setRequiresApproval] = useState(true)
  const [requiresSignature, setRequiresSignature] = useState(false)
  const [requiresSellerSignature, setRequiresSellerSignature] = useState(false)
  const [showUploadInput, setShowUploadInput] = useState(false)

  // Get unique document groups
  const documentGroups = useMemo(() => {
    if (!documents) return []
    const groups = new Set(documents.map((doc: { group: string }) => doc.group))
    return Array.from(groups) as string[]
  }, [documents])

  // Only show for admin users
  if (userRole !== FairLendRole.ADMIN) {
    return null
  }

  const handleCreateDocument = () => {
    // In a real implementation, this would call a method from the context
    // to add the document to the selected group
    alert(`Created document: ${documentName} in group ${documentGroup}`)

    // Reset the form
    setDocumentName("")
    setDocumentGroup("")
    setRequiresApproval(true)
    setRequiresSignature(false)
    setRequiresSellerSignature(false)
    setShowUploadInput(false)
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center">
          <FilePlus className="mr-2" size={20} />
          Create New Document
        </CardTitle>
        <CardDescription>Create and assign new document templates to document groups</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block" htmlFor="documentName">
              Document Name
            </Label>
            <Input
              id="documentName"
              placeholder="Enter document name"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
            />
          </div>

          <div>
            <Label className="mb-2 block" htmlFor="documentGroup">
              Document Group
            </Label>
            <Select value={documentGroup} onValueChange={setDocumentGroup}>
              <SelectTrigger id="documentGroup">
                <SelectValue placeholder="Select document group" />
              </SelectTrigger>
              <SelectContent>
                {documentGroups.map((group) => (
                  <SelectItem key={group} value={group}>
                    {group.charAt(0).toUpperCase() + group.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={requiresApproval}
                id="requiresApproval"
                onCheckedChange={() => setRequiresApproval(!requiresApproval)}
              />
              <Label htmlFor="requiresApproval">Requires lawyer approval</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                checked={requiresSignature}
                id="requiresSignature"
                onCheckedChange={() => setRequiresSignature(!requiresSignature)}
              />
              <Label htmlFor="requiresSignature">Requires buyer signature</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                checked={requiresSellerSignature}
                id="requiresSellerSignature"
                onCheckedChange={() => setRequiresSellerSignature(!requiresSellerSignature)}
              />
              <Label htmlFor="requiresSellerSignature">Requires seller signature</Label>
            </div>
          </div>

          <div className="pt-2">
            <Button
              className="mb-4"
              type="button"
              variant="outline"
              onClick={() => setShowUploadInput(!showUploadInput)}
            >
              <Upload className="mr-1" size={16} />
              {showUploadInput ? "Hide Upload" : "Upload Template"}
            </Button>

            {showUploadInput && (
              <div className="border-muted rounded-md border-2 border-dashed p-6 text-center">
                <Upload className="text-muted-foreground mx-auto mb-2" size={32} />
                <p className="text-muted-foreground mb-2 text-sm">
                  Drag and drop your document template here, or click to browse
                </p>
                <Button size="sm" variant="outline">
                  Choose File
                </Button>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button disabled={!documentName || !documentGroup} onClick={handleCreateDocument}>
              Create Document
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default AdminDocumentCreator
