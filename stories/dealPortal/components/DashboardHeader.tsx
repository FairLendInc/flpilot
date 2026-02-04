import React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { FileTextIcon } from "lucide-react"
import Link from "next/link"
import { useDealStore } from "../store/dealStore"

export function DashboardHeader({ userRole }: { userRole?: string }) {
  const { currentUser, dealId, dealData } = useDealStore()

  const getUserInitials = (name?: string | null, email?: string | null): string => {
    const base = (name ?? email ?? "").trim()
    if (!base) return "U"
    const parts = base.split(/\s+/).filter(Boolean)
    if (parts.length === 0) return "U"
    const initials = parts.length === 1
      ? (parts[0]?.slice(0, 2) ?? "U")
      : parts.map((p) => p?.[0] ?? "").filter(Boolean).slice(0, 2).join("") || "U"
    return initials.toUpperCase()
  }

  return (
    <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center sm:gap-0">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">Mortgage Portal</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Deal {dealId || "Unknown"} {dealData?.property ? `- ${dealData.property}` : ""}
        </p>
      </div>

      <div className="flex w-full items-center justify-between gap-3 overflow-x-scroll sm:w-auto sm:justify-end sm:gap-6">
          <Link href="/admin/dashboard/docprep">
            <Button variant="outline" size="sm">
              <FileTextIcon className="mr-2 h-4 w-4" />
              Document Prep
            </Button>
          </Link>

        {currentUser && (
          <div className="flex items-center gap-2">
            <Avatar>
              <AvatarImage alt="User" />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getUserInitials(currentUser?.name, currentUser?.email)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-medium sm:text-base">{currentUser?.name}</div>
              <div className="text-muted-foreground text-xs">{currentUser?.role}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
