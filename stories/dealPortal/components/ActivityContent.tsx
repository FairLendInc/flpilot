import React from "react"

import { useDealStore } from "../store/dealStore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Bell, ClipboardList, Eye, FileText, MessageCircle } from "lucide-react"

export function ActivityContent() {
  const { events } = useDealStore()

  return (
    <div className="space-y-4 p-2">
      {events.length === 0 ? (
        <div className="text-muted-foreground py-8 text-center">No activity yet. Actions taken will appear here.</div>
      ) : (
        events.map((event) => (
          <Card key={event.id} className="p-3">
            <div className="flex gap-2">
              <div className="bg-muted rounded-full p-2">
                {event.type === "upload" && <FileText className="h-4 w-4" />}
                {event.type === "approve" && <ClipboardList className="h-4 w-4" />}
                {event.type === "sign" && <FileText className="h-4 w-4" />}
                {event.type === "dispute" && <Bell className="h-4 w-4" />}
                {event.type === "comment" && <MessageCircle className="h-4 w-4" />}
                {event.type === "view" && <Eye className="h-4 w-4" />}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{event.description}</div>
                <div className="text-muted-foreground text-xs">
                  {event.user} · {event.timestamp}
                  {event.ipAddress && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="ml-1 cursor-help">· IP: {event.ipAddress}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>User&apos;s IP Address</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                {event.documentName && (
                  <div className="text-muted-foreground mt-1 text-xs">Document: {event.documentName}</div>
                )}
                {!event.documentName && event.documentGroup && (
                  <div className="text-muted-foreground mt-1 text-xs">Group: {event.documentGroup}</div>
                )}
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  )
}
