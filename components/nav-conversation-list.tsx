"use client"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { ConversationItem } from "@/types/app"
import {
  ChatBubbleOvalLeftEllipsisIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import { ChatBubbleOvalLeftEllipsisIcon as ChatBubbleOvalLeftEllipsisSolidIcon } from '@heroicons/react/24/solid'
import { cn } from "@/lib/utils"
import { useRouter } from 'next/navigation'

export function NavConversationList({
  conversationList,
  currentId,
  onCurrentIdChange,
}: {
  conversationList: ConversationItem[]
  currentId: string
  onCurrentIdChange: (id: string) => void
}) {
  const route = useRouter()
  const handleChangeCurrent = (id: string) => {
    route.push('/')
    onCurrentIdChange(id)
  }
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel className="text-white/90 font-medium">Cuộc trò chuyện</SidebarGroupLabel>
      <SidebarMenu>
        {/* New Chat Button */}
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={(e) => {
              e.preventDefault()
              handleChangeCurrent("-1")
            }}
            className="text-white/90 hover:text-white hover:bg-white/10 active:text-white active:bg-white/20 active:scale-95 transition-all duration-150 cursor-pointer"
          >
            <PlusIcon className="mr-3 h-5 w-5 flex-shrink-0 text-sky-100" />
            <span>Tạo mới cuộc trò chuyện</span>
          </SidebarMenuButton>
        </SidebarMenuItem>

        {/* Existing Conversations */}
        {conversationList.map((item) => {
          const isCurrent = item.id === currentId
          const ItemIcon
            = isCurrent ? ChatBubbleOvalLeftEllipsisSolidIcon : ChatBubbleOvalLeftEllipsisIcon
          return (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                onClick={(e) => {
                  e.preventDefault()
                  handleChangeCurrent(item.id)
                }}
                className={cn(
                  "text-white/90 hover:text-white active:scale-95 transition-all duration-150 cursor-pointer",
                  isCurrent ? "bg-white/20 text-white hover:bg-white/25 active:bg-white/30" : "hover:bg-white/10 active:bg-white/15"
                )}
              >
                <ItemIcon
                  className={cn(
                    isCurrent
                      ? 'text-white'
                      : 'text-sky-100',
                    'mr-3 h-5 w-5 flex-shrink-0',
                  )}
                  aria-hidden="true"
                />
                <span className={isCurrent ? "text-white font-medium" : "text-white/90"}>{item.name}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
