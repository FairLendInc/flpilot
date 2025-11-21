"use client"

import React, { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Mail, Edit, UserPlus, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface LawyerInviteManagementProps {
  dealId: Id<"deals">
  lawyerName?: string
  lawyerEmail?: string
  lawyerLSONumber?: string
}

export function LawyerInviteManagement({ dealId, lawyerName, lawyerEmail, lawyerLSONumber }: LawyerInviteManagementProps) {
  const resendInvite = useMutation(api.deals.resendLawyerInvite)
  const updateEmail = useMutation(api.deals.updateLawyerEmail)
  const selectNewLawyer = useMutation(api.deals.selectNewLawyer)

  const [isResending, setIsResending] = useState(false)
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)
  const [isSelectingNew, setIsSelectingNew] = useState(false)
  
  const [newEmail, setNewEmail] = useState(lawyerEmail || "")
  const [newLawyer, setNewLawyer] = useState({
    name: "",
    email: "",
    lsoNumber: ""
  })
  
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [showNewLawyerDialog, setShowNewLawyerDialog] = useState(false)

  const handleResendInvite = async () => {
    setIsResending(true)
    try {
      await resendInvite({ dealId })
      toast.success("Invitation resent successfully")
    } catch (error) {
      console.error("Failed to resend invite:", error)
      toast.error("Failed to resend invitation")
    } finally {
      setIsResending(false)
    }
  }

  const handleUpdateEmail = async () => {
    if (!newEmail) return
    setIsUpdatingEmail(true)
    try {
      await updateEmail({ dealId, newEmail })
      toast.success("Lawyer email updated successfully")
      setShowEmailDialog(false)
    } catch (error) {
      console.error("Failed to update email:", error)
      toast.error("Failed to update email")
    } finally {
      setIsUpdatingEmail(false)
    }
  }

  const handleSelectNewLawyer = async () => {
    if (!newLawyer.name || !newLawyer.email || !newLawyer.lsoNumber) return
    setIsSelectingNew(true)
    try {
      await selectNewLawyer({ 
        dealId, 
        name: newLawyer.name, 
        email: newLawyer.email, 
        lsoNumber: newLawyer.lsoNumber 
      })
      toast.success("New lawyer selected successfully")
      setShowNewLawyerDialog(false)
    } catch (error) {
      console.error("Failed to select new lawyer:", error)
      toast.error("Failed to select new lawyer")
    } finally {
      setIsSelectingNew(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Lawyer Invitation Status</CardTitle>
          <CardDescription>Manage the invitation for your legal representative</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4 rounded-lg border p-4 bg-muted/30">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium">Invitation Pending</h3>
              <p className="text-sm text-muted-foreground">
                Waiting for lawyer confirmation
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleResendInvite} disabled={isResending}>
              {isResending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
              Resend Invite
            </Button>
          </div>

          <div className="space-y-4">
            <div className="grid gap-1">
              <Label className="text-sm font-medium text-muted-foreground">Lawyer Name</Label>
              <p className="font-medium">{lawyerName || "Not specified"}</p>
            </div>
            
            <div className="grid gap-1">
              <Label className="text-sm font-medium text-muted-foreground">Email Address</Label>
              <div className="flex items-center justify-between">
                <p className="font-medium">{lawyerEmail || "Not specified"}</p>
                <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      <Edit className="mr-2 h-3 w-3" />
                      Change
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Update Lawyer Email</DialogTitle>
                      <DialogDescription>
                        This will revoke the current invitation and send a new one to the updated address.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="email">New Email Address</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          value={newEmail} 
                          onChange={(e) => setNewEmail(e.target.value)} 
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowEmailDialog(false)}>Cancel</Button>
                      <Button onClick={handleUpdateEmail} disabled={isUpdatingEmail}>
                        {isUpdatingEmail ? "Updating..." : "Update Email"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="grid gap-1">
              <Label className="text-sm font-medium text-muted-foreground">LSO Number</Label>
              <p className="font-medium">{lawyerLSONumber || "Not specified"}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t bg-muted/5 px-6 py-4">
          <div className="flex w-full items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Need to choose a different lawyer?
            </p>
            <Dialog open={showNewLawyerDialog} onOpenChange={setShowNewLawyerDialog}>
              <DialogTrigger asChild>
                <Button variant="secondary" size="sm">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Select New Lawyer
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Select New Lawyer</DialogTitle>
                  <DialogDescription>
                    Enter the details of the new lawyer you wish to represent you.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Lawyer Name</Label>
                    <Input 
                      id="name" 
                      value={newLawyer.name} 
                      onChange={(e) => setNewLawyer({...newLawyer, name: e.target.value})} 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="new-email">Email Address</Label>
                    <Input 
                      id="new-email" 
                      type="email" 
                      value={newLawyer.email} 
                      onChange={(e) => setNewLawyer({...newLawyer, email: e.target.value})} 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="lso">LSO Number</Label>
                    <Input 
                      id="lso" 
                      value={newLawyer.lsoNumber} 
                      onChange={(e) => setNewLawyer({...newLawyer, lsoNumber: e.target.value})} 
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowNewLawyerDialog(false)}>Cancel</Button>
                  <Button onClick={handleSelectNewLawyer} disabled={isSelectingNew}>
                    {isSelectingNew ? "Saving..." : "Select Lawyer"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
