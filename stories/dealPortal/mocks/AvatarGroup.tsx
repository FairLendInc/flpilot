import React from "react"

export const AvatarGroup = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return <div className={`flex -space-x-2 ${className}`}>{children}</div>
}
