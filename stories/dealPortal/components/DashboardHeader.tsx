import React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileTextIcon } from "lucide-react"
import Link from "next/link"
import { useDealStore } from "../store/dealStore"

export function DashboardHeader({ userRole }: { userRole?: string }) {
  const { currentUser, setCurrentUser, availableUsers, dealId, dealData } = useDealStore()
  
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

  const handleUserChange = (userEmail: string) => {
    const user = availableUsers.find((u) => u.email === userEmail)
    if (user) {
      setCurrentUser(user)
    }
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
        {/* )} */}

        <div className="flex gap-2">
          {availableUsers.length > 0 ? (
            <Select value={currentUser?.email || ""} onValueChange={handleUserChange}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.map((user, index) => (
                  <SelectItem key={`${user.email}-${index}`} value={user.email}>
                    <div className="flex flex-col">
                      <span className="font-medium">{user.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {user.role} - {user.email}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="text-muted-foreground rounded-md border px-3 py-2 text-sm">
              No users available. Create documents first.
            </div>
          )}
        </div>

        {currentUser && (
          <div className="flex items-center gap-2">
            <Avatar>
              <AvatarImage alt="User" src="" />
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
