"use client"

import React, { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, RefreshCcw, Trash2 } from "lucide-react"
import { LawyerInviteModal } from "../../mocks/LawyerInviteModal";
import { createLogger } from "../../mocks/logger";
import { toast } from "../../mocks/use-toast";
import { useDealStore } from "../../store/dealStore"

const logger = createLogger("LawyerInvitesPanel")

export function LawyerInvitesPanel({user}: {user: any}) {
  const { dealId, deal } = useDealStore()
  
  const assignedLsoLawyerId: string | undefined = deal?.lawyerId
  const assignedLawyerEmail: string | undefined = deal?.lawyerEmail
  const assignedLawyerPhone: string | undefined = deal?.lawyerPhone
  logger.info("[LawyerInvitesPanel] assignedLsoLawyerId", { assignedLsoLawyerId })
  const [inviteOpen, setInviteOpen] = React.useState(false)
  const [resendErrorByInviteId, setResendErrorByInviteId] = React.useState<Record<string, string>>({})

  // Mock invites query
  // TODO: Implement backend query for invites
  const [invites, setInvites] = useState<any[]>([])
  const [isLoadingInvites, setIsLoadingInvites] = useState(false)
  const [invitesError, setInvitesError] = useState<Error | null>(null)

  const invitesQuery = {
    data: invites,
    isLoading: isLoadingInvites,
    error: invitesError,
    refetch: () => {
      console.log("Refetching invites...")
    }
  }

  // Optional state indicators drawn from deal data and profile lookup
  const emailVerified: boolean | undefined = deal?.lawyerVerifiedEmail
  
  // TODO: Implement profile check
  const profileCheck = {
    data: { hasProfile: !!deal?.lawyerId } // Simplified check based on assigned lawyer existence
  }

  // Mock mutations
  const resendInvite = {
    mutate: (params: { inviteId: string }, options?: any) => {
      console.log("Resending invite", params.inviteId)
      toast({ title: "Invite email sent", description: "We sent a new invite email." })
      if (options?.onSuccess) options.onSuccess()
    },
    isPending: false
  }

  const revokeInvite = {
    mutate: (params: { inviteId: string }, options?: any) => {
      console.log("Revoking invite", params.inviteId)
      setInvites(prev => prev.map(inv => inv.id === params.inviteId ? { ...inv, status: "REVOKED" } : inv))
      toast({ title: "Invite revoked", description: "The invitation can no longer be used." })
      if (options?.onSuccess) options.onSuccess()
    },
    isPending: false
  }

  const updateInvite = {
    mutate: ({ lsoLawyerId, dealId, email, phone }: any, options?: any) => {
      console.log("Updating invite", { lsoLawyerId, dealId, email, phone })
      toast({ title: "Invite updated", description: "Email/phone have been updated." })
      if (options?.onSuccess) options.onSuccess()
    }
  }

  // Check admin authorization once at top-level (never inside loops/conditions)
  // Mock admin auth
  const isAdmin = user?.role === "admin"
  console.log("isAdmin", { isAdmin })

  // Admin remove-lawyer mutation (top-level hook; do not create inside handlers)
  const removeLawyer = {
    mutate: (params: { dealId: string }, options?: any) => {
      console.log("Removing lawyer from deal", params.dealId)
      toast({ title: "Lawyer removed", description: "Access revoked and invites cleared." })
      if (options?.onSuccess) options.onSuccess()
    }
  }

  // Note: We intentionally omit an additional hasProfile query here to keep this panel resilient
  // in contexts/tests where only the invitations list is mocked. We rely on the presence of
  // an assigned LSO lawyer and absence of invites to present the invite UI.

  if (!dealId) {
    return null
  }

  // Only show active invites (PENDING, SENT, BOUNCED)
  const activeInvites = invitesQuery.data?.filter((inv: any) =>
    ["PENDING", "SENT", "BOUNCED"].includes(inv.status)
  )
  const historyInvites = invitesQuery.data?.filter((inv: any) =>
    ["ACCEPTED", "REVOKED"].includes(inv.status)
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lawyer Invitations</CardTitle>
        <CardDescription>View and manage invitations for this deal</CardDescription>
      </CardHeader>
      <CardContent>
        {/* High-level status indicators */}
        {assignedLsoLawyerId && (
          <div className="mb-3 space-y-2">
            {!emailVerified && (
              <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
                The assigned lawyer has not verified their email yet. If they already created an account with this email, ask them to log in.
              </div>
            )}
            {emailVerified && profileCheck.data?.hasProfile === false && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                The lawyer has verified their email but their profile is not completed yet.
              </div>
            )}
            {resendErrorByInviteId.__GENERIC__ && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                {resendErrorByInviteId.__GENERIC__} Please ask the lawyer to log in or use a different email.
              </div>
            )}
          </div>
        )}

        {invitesQuery.isLoading && <div className="text-sm text-muted-foreground">Loading invites…</div>}
        {invitesQuery.error && (
          <div className="text-sm text-destructive">Failed to load invites: {invitesQuery.error?.message}</div>
        )}
        {invitesQuery.data && (activeInvites?.length ?? 0) === 0 && (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              {(historyInvites?.length ?? 0) > 0 ? "No active invites. See history below." : "No invites yet."}
            </div>
            {assignedLsoLawyerId && (
              <div className="rounded-md border p-3">
                <div className="mb-2 text-sm">
                  The assigned lawyer may not have a completed profile. Send them an invite to access this deal.
                </div>
                <Button size="sm" onClick={() => setInviteOpen(true)} data-testid="invite-assigned-lawyer">
                  Invite assigned lawyer
                </Button>
                <LawyerInviteModal
                  open={inviteOpen}
                  onOpenChange={setInviteOpen}
                  defaultEmail={assignedLawyerEmail || ""}
                  defaultPhone={assignedLawyerPhone || ""}
                  onSubmit={async (email: string, phone: string) => {
                    if (!assignedLsoLawyerId || !dealId) return
                    await new Promise<void>((resolve, reject) => {
                      updateInvite.mutate(
                        { lsoLawyerId: assignedLsoLawyerId, dealId, email, phone },
                        {
                          onSuccess: () => resolve(),
                          onError: (err: any) => reject(err),
                        }
                      )
                    })
                  }}
                />
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          {activeInvites?.map((inv) => (
            <div key={inv.id} className="rounded-md border p-3">
              <div className="space-y-3">
                {/* Header info */}
                <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span className="font-medium">{inv.inviteEmail}</span>
                      <Badge variant="outline">{inv.status}</Badge>
                    </div>
                    {/* LSO directory info inline */}
                    {(inv as any).lsoName && (
                      <div className="text-xs text-muted-foreground">
                        Lawyer: {(inv as any).lsoName} · Member ID: {(inv as any).lsoMemberId} · {(inv as any).lsoEmail || "—"} · {(inv as any).lsoPhone || "—"}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Last updated: {new Date((inv.updatedAt as unknown as string) || (inv.createdAt as unknown as string)).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                {/* Action buttons - separated into primary and secondary groups */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {/* Primary actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => resendInvite.mutate({ inviteId: inv.id })}
                      disabled={resendInvite.isPending}
                      className="flex-shrink-0"
                    >
                      <RefreshCcw className="mr-2 h-4 w-4" /> Resend
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => revokeInvite.mutate({ inviteId: inv.id })}
                      disabled={revokeInvite.isPending}
                      className="flex-shrink-0"
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Revoke
                    </Button>
                  </div>
                  
                  {/* Secondary actions */}
                  <div className="flex flex-wrap gap-2">
                    <EmailEditor
                      initialEmail={inv.inviteEmail || ""}
                      onSave={(email) =>
                        updateInvite.mutate({ lsoLawyerId: inv.lsoLawyerId, dealId, email, phone: inv.invitePhone || undefined })
                      }
                    />
                    {/* Admin-only: Remove Lawyer from deal */}
                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeLawyer.mutate({ dealId })}
                        className="flex-shrink-0"
                      >
                        Remove Lawyer
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {(historyInvites?.length ?? 0) > 0 && (
          <div className="mt-6 space-y-2">
            <div className="text-sm font-medium">Invite History</div>
            <div className="space-y-3">
              {historyInvites?.map((inv) => (
                <div key={inv.id} className="flex flex-col gap-2 rounded-md border p-3 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span className="font-medium">{inv.inviteEmail}</span>
                      <Badge variant="outline">{inv.status}</Badge>
                    </div>
                    {(inv as any).lsoName && (
                      <div className="text-xs text-muted-foreground">
                        Lawyer: {(inv as any).lsoName} · Member ID: {(inv as any).lsoMemberId} · {(inv as any).lsoEmail || "—"} · {(inv as any).lsoPhone || "—"}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Last updated: {new Date((inv.updatedAt as unknown as string) || (inv.createdAt as unknown as string)).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function EmailEditor({ initialEmail, onSave }: { initialEmail: string; onSave: (email: string) => void }) {
  const [editing, setEditing] = React.useState(false)
  const [email, setEmail] = React.useState(initialEmail)

  return editing ? (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        onSave(email)
        setEditing(false)
      }}
    >
      <div className="flex items-center gap-2">
        <Label htmlFor="invite-email" className="sr-only">
          Invite email
        </Label>
        <Input id="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Button type="submit" size="sm">
          Save
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    </form>
  ) : (
    <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
      Change Email
    </Button>
  )
}


