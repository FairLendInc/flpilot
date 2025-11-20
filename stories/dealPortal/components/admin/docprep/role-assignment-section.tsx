"use client"

import { useState } from "react"

import { type RoleAssignment, RoleLabels } from "./types"
import { FairLendRole as RoleType } from "../../../utils/dealLogic"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowUpDown, Link, UserPlus, X } from "lucide-react"

interface RoleAssignmentSectionProps {
  roleAssignments: RoleAssignment[]
  onRoleAssignmentsChangeAction: (assignments: RoleAssignment[]) => void
}

export function RoleAssignmentSection({ roleAssignments, onRoleAssignmentsChangeAction }: RoleAssignmentSectionProps) {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState<RoleType>(RoleType.BUYER)
  const [signingLink, setSigningLink] = useState("")
  const [error, setError] = useState("")

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const getNextSigningOrder = () => {
    if (roleAssignments.length === 0) return 1
    const maxOrder = Math.max(...roleAssignments.map((a) => a.signingOrder))
    return maxOrder + 1
  }

  const addRoleAssignment = () => {
    setError("")

    if (!email.trim() || !name.trim() || !signingLink.trim()) {
      setError("Please fill in all fields")
      return
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address")
      return
    }

    if (!isValidUrl(signingLink)) {
      setError("Please enter a valid signing link URL")
      return
    }

    // Check if user already has a role assigned
    const existingAssignment = roleAssignments.find(
      (assignment) => assignment.userEmail.toLowerCase() === email.toLowerCase()
    )

    if (existingAssignment) {
      setError("This user already has a role assigned")
      return
    }

    const newAssignment: RoleAssignment = {
      userId: Date.now().toString(),
      userEmail: email.trim(),
      userName: name.trim(),
      role,
      signingLink: signingLink.trim(),
      signingOrder: getNextSigningOrder(),
    }

    onRoleAssignmentsChangeAction([...roleAssignments, newAssignment])

    // Reset form
    setEmail("")
    setName("")
    setRole(RoleType.BUYER)
    setSigningLink("")
  }

  const removeRoleAssignment = (userId: string) => {
    const updatedAssignments = roleAssignments.filter((assignment) => assignment.userId !== userId)

    // Reorder remaining assignments
    const reorderedAssignments = updatedAssignments
      .sort((a, b) => a.signingOrder - b.signingOrder)
      .map((assignment, index) => ({
        ...assignment,
        signingOrder: index + 1,
      }))

    onRoleAssignmentsChangeAction(reorderedAssignments)
  }

  const updateRole = (userId: string, newRole: RoleType) => {
    onRoleAssignmentsChangeAction(
      roleAssignments.map((assignment) =>
        assignment.userId === userId ? { ...assignment, role: newRole } : assignment
      )
    )
  }

  const updateSigningOrder = (userId: string, direction: "up" | "down") => {
    const index = roleAssignments.findIndex((a) => a.userId === userId)
    if (index === -1) return

    const newAssignments = [...roleAssignments]
    const currentOrder = newAssignments[index]?.signingOrder

    if (direction === "up" && index > 0) {
      // Swap with previous
      const prevIndex = index - 1
      newAssignments[index]!.signingOrder = newAssignments[prevIndex]!.signingOrder
      newAssignments[prevIndex]!.signingOrder = currentOrder!
    } else if (direction === "down" && index < newAssignments.length - 1) {
      // Swap with next
      const nextIndex = index + 1
      newAssignments[index]!.signingOrder = newAssignments[nextIndex]!.signingOrder
      newAssignments[nextIndex]!.signingOrder = currentOrder!
    }

    // Sort by signing order
    newAssignments.sort((a, b) => a.signingOrder - b.signingOrder)
    onRoleAssignmentsChangeAction(newAssignments)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getRoleBadgeVariant = (role: RoleType) => {
    switch (role) {
      case RoleType.BUYER:
        return "default"
      case RoleType.BUYER_LAWYER:
        return "secondary"
      case RoleType.BROKER:
        return "outline"
      case RoleType.ADMIN:
        return "destructive"
      case RoleType.SYSTEM:
        return "secondary"
      default:
        return "default"
    }
  }

  // Filter out only NONE role from selection, keep SYSTEM for prepare actions
  const availableRoles = Object.entries(RoleLabels)
    .filter(([key]) => key !== RoleType.NONE)
    .map(([key, label]) => ({ value: key as RoleType, label }))

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Input
                placeholder="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
              <Select value={role} onValueChange={(value: RoleType) => setRole(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <Input
                placeholder="Documenso signing link for this user"
                type="url"
                value={signingLink}
                onChange={(e) => setSigningLink(e.target.value)}
                className="flex-1"
              />
              <Button onClick={addRoleAssignment}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </div>
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>
      </Card>

      {roleAssignments.length > 0 && (
        <Card>
          <div className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <Label className="text-sm font-medium">Signing Order</Label>
              <p className="text-muted-foreground text-xs">Users will sign/act in the order shown below</p>
            </div>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {roleAssignments
                  .sort((a, b) => a.signingOrder - b.signingOrder)
                  .map((assignment, index) => (
                    <div key={assignment.userId} className="bg-muted/50 rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col gap-1">
                            <Badge
                              variant="secondary"
                              className="flex h-8 w-8 items-center justify-center rounded-full p-0"
                            >
                              {assignment.signingOrder}
                            </Badge>
                            <div className="flex flex-col gap-0.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => updateSigningOrder(assignment.userId, "up")}
                                disabled={index === 0}
                              >
                                <ArrowUpDown className="h-3 w-3 rotate-180" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => updateSigningOrder(assignment.userId, "down")}
                                disabled={index === roleAssignments.length - 1}
                              >
                                <ArrowUpDown className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{assignment.userName}</p>
                              <Badge variant={getRoleBadgeVariant(assignment.role)}>
                                {RoleLabels[assignment.role]}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground text-sm">{assignment.userEmail}</p>
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-muted-foreground max-w-[300px] truncate text-sm">
                                {assignment.signingLink}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(assignment.signingLink)}
                                title="Copy signing link"
                              >
                                <Link className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={assignment.role}
                            onValueChange={(value: RoleType) => updateRole(assignment.userId, value)}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {availableRoles.map(({ value, label }) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button variant="ghost" size="sm" onClick={() => removeRoleAssignment(assignment.userId)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </div>
        </Card>
      )}
    </div>
  )
}
