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
      <SidebarGroupLabel>Cuộc trò chuyện</SidebarGroupLabel>
      <SidebarMenu>
        {/* New Chat Button */}
        <SidebarMenuItem>
          <SidebarMenuButton asChild onClick={() => handleChangeCurrent("-1")}>
            <a href="#" className="flex items-center">
              <PlusIcon className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
              <span>New Chat</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>

        {/* Existing Conversations */}
        {conversationList.map((item) => {
          const isCurrent = item.id === currentId
          const ItemIcon
            = isCurrent ? ChatBubbleOvalLeftEllipsisSolidIcon : ChatBubbleOvalLeftEllipsisIcon
          return (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton asChild onClick={() => handleChangeCurrent(item.id)}>
                <a href="#">
                  <ItemIcon
                    className={cn(
                      isCurrent
                        ? 'text-primary-600'
                        : 'text-gray-400 group-hover:text-gray-500',
                      'mr-3 h-5 w-5 flex-shrink-0',
                    )}
                    aria-hidden="true"
                  />
                  <span>{item.name}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
