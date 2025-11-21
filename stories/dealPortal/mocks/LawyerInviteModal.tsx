import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface LawyerInviteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultEmail?: string
  defaultPhone?: string
  onSubmit?: (email: string, phone: string) => Promise<void>
}

export function LawyerInviteModal({ open, onOpenChange, defaultEmail, defaultPhone, onSubmit }: LawyerInviteModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Lawyer (Mock)</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p>This is a mock lawyer invite modal.</p>
          {defaultEmail && <p className="text-sm">Email: {defaultEmail}</p>}
          {defaultPhone && <p className="text-sm">Phone: {defaultPhone}</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
