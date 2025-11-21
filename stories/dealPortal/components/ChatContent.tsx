import React from "react"

import { useDealStore } from "../store/dealStore"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"

export function ChatContent() {
  const { messages, chatInput, setChatInput, sendMessage } = useDealStore()

  return (
    <div className="flex h-[calc(100vh-200px)] flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-2 ${message.sender === "Buyer" ? "justify-end" : ""}`}>
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.sender === "Buyer" ? "bg-primary text-primary-foreground ml-auto" : "bg-muted"
              }`}
            >
              <div className="mb-1 text-xs font-medium">
                {message.sender} · {message.timestamp}
              </div>
              <div className="text-sm">{message.message}</div>
              {message.fileName && (
                <div className="bg-background/20 mt-2 flex items-center gap-2 rounded p-2 text-xs">
                  <FileText className="h-4 w-4" />
                  <span>{message.fileName}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-md border px-3 py-2 text-sm"
            placeholder="Type a message..."
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(chatInput)}
          />
          <Button onClick={() => sendMessage(chatInput)}>Send</Button>
        </div>
      </div>
    </div>
  )
}
