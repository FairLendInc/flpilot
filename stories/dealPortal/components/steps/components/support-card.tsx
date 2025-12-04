"use client"

import React from "react"

import { cn } from "@/lib/utils"
import { Avatar, Button } from "@heroui/react";
import { AvatarGroup } from "../../../mocks/AvatarGroup";
import { Icon } from "@iconify/react"

export type SupportCardProps = React.HTMLAttributes<HTMLDivElement>

const SupportCard = React.forwardRef<HTMLDivElement, SupportCardProps>(({ className, ...props }, ref) => (
  <div
    {...props}
    ref={ref}
    className={cn(
      "align-center rounded-large bg-content1 shadow-small my-2 flex shrink-0 items-center justify-center gap-3 self-stretch px-3 py-3",
      className
    )}
  >
    <AvatarGroup className="flex -space-x-2">
      <img 
        className="w-6 h-6 rounded-full border-2 border-white ring-0"
        src="https://i.pravatar.cc/150?u=a042581f4e29026704d" 
        alt="User 1" 
      />
      <img 
        className="w-6 h-6 rounded-full border-2 border-white ring-0"
        src="https://i.pravatar.cc/150?u=a042581f4e29026705d" 
        alt="User 2" 
      />
      <img 
        className="w-6 h-6 rounded-full border-2 border-white ring-0"
        src="https://i.pravatar.cc/150?u=a042581f4e29026706d" 
        alt="User 3" 
      />
    </AvatarGroup>
    <div className="text-tiny text-default-700 line-clamp-2 text-left font-medium">
      Need help with your transaction? Our support team is available.
    </div>
    <Button
      isIconOnly
      className="align-center bg-default-100 flex h-[32px] w-[31px] justify-center rounded-[12px] dark:bg-[#27272A]/[.4]"
      size="sm"
      variant="ghost"
    >
      <Icon className="text-default-400 dark:text-foreground" icon="lucide:message-circle" width={20} />
    </Button>
  </div>
))

SupportCard.displayName = "SupportCard"

export default SupportCard
