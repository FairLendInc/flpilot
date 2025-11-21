import React from "react"

export default function ChatWindow({ title, currentUserId }: { title?: string; currentUserId?: string }) {
  return (
    <div className="border-muted flex h-[400px] items-center justify-center border-2 border-dashed p-4">
      <p className="text-muted-foreground">Chat Window Mock {title && `- ${title}`}</p>
    </div>
  )
}
