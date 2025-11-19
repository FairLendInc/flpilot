import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "components/ui/dialog"

export function LawyerInviteModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Lawyer (Mock)</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p>This is a mock lawyer invite modal.</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
