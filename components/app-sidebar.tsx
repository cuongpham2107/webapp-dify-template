"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  BookOpen,
  Bot,
  Brain,
  Settings2,
  SquareTerminal,
} from "lucide-react"

import { NavDataset } from "@/components/nav-dataset"
import { NavConversationList } from "@/components/nav-conversation-list"
import { NavUser } from "@/components/nav-user"
import { NavAdmin } from "@/components/nav-admin"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import useConversation from "@/hooks/use-conversation"
import { APP_ID, APP_INFO } from "@/config"
import { useGetState } from "ahooks"
import produce from "immer"
import { useTranslation } from "react-i18next"
import { useEffect, useState } from "react"
import { fetchConversations, fetchAppParams } from "@/service"
import Toast from "@/app/components/base/toast"
import { setLocaleOnClient } from "@/i18n/client"
import { useGlobalSearch } from "@/hooks/use-global-search"
import { GlobalSearch } from "@/app/components/global-search"
import { SearchButton } from "@/app/components/search-button"
import Image from "next/image"


export function AppSidebar({
  onConversationSelect,
  skipInitialization = false,
  isMobile,
  isShowSidebar,
  hideSidebar,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  onConversationSelect?: () => void
  skipInitialization?: boolean
  isMobile?: boolean
  isShowSidebar?: boolean
  hideSidebar?: () => void
}) {
  const router = useRouter()
  const { t } = useTranslation()
  const {
    conversationList,
    setConversationList,
    currConversationId,
    setCurrConversationId,
    newConversationInputs,
    currConversationInfo,
    getConversationIdFromStorage,
    setNewConversationInfo,
    setExistConversationInfo,
  } = useConversation();

  const [conversationIdChangeBecauseOfNew, setConversationIdChangeBecauseOfNew, getConversationIdChangeBecauseOfNew] = useGetState(false)
  const [inited, setInited] = useState<boolean>(false)
  const conversationIntroduction = currConversationInfo?.introduction || ''
  const suggestedQuestions = currConversationInfo?.suggested_questions || []
  const { isSearchOpen, openSearch, closeSearch } = useGlobalSearch()

  // Init conversations and app params
  useEffect(() => {
    if (!APP_ID || inited || skipInitialization) {
      return
    }

    (async () => {
      try {
        const [conversationData, appParams] = await Promise.all([fetchConversations(), fetchAppParams()])

        // Handle current conversation id
        const { data: conversations, error } = conversationData as { data: any[]; error: string }
        if (error) {
          Toast.notify({ type: 'error', message: error })
          throw new Error(error)
        }

        const _conversationId = getConversationIdFromStorage(APP_ID)
        const currentConversation = conversations.find(item => item.id === _conversationId)
        const isNotNewConversation = !!currentConversation

        // Fetch new conversation info
        const { user_input_form, opening_statement: introduction, suggested_questions = [] }: any = appParams
        setLocaleOnClient(APP_INFO.default_language, true)
        setNewConversationInfo({
          name: t('app.chat.newChatDefaultName'),
          introduction,
          suggested_questions
        })

        if (isNotNewConversation) {
          setExistConversationInfo({
            name: currentConversation.name || t('app.chat.newChatDefaultName'),
            introduction,
            suggested_questions
          })
        }

        setConversationList(conversations as any[])

        if (isNotNewConversation)
          setCurrConversationId(_conversationId, APP_ID, false)

        setInited(true)
      }
      catch (e: any) {
        console.error('Failed to initialize sidebar:', e)
      }
    })()

    // Listen for new chat event from Header component
    const handleNewChatEvent = () => {
      handleConversationIdChange('-1')
    }

    document.addEventListener('new-chat-clicked', handleNewChatEvent)

    return () => {
      document.removeEventListener('new-chat-clicked', handleNewChatEvent)
    }
  }, [APP_ID, inited])

  // Listen for conversation name updates
  useEffect(() => {
    if (!inited) return

    const handleConversationNameUpdated = async (e: CustomEvent) => {
      const { id, name } = e.detail

      // Use a callback function with setConversationList to ensure we're using the latest state
      setConversationList(currentList => {
        // Check if the conversation exists in the current list
        const conversationExists = currentList.some(item => item.id === id)

        if (!conversationExists) {
          // If conversation not found, fetch the updated list asynchronously
          fetchConversations().then((response: any) => {
            setConversationList(response.data)
          }).catch(error => {
            console.error('Error fetching conversations:', error)
          })
        }

        return produce(currentList, (draft) => {
          const conversation = draft.find(item => item.id === id)
          if (conversation) {
            conversation.name = name
          } else {
            console.log('Conversation not found in list:', id)
          }
        })
      })
    }

    document.addEventListener('conversation-name-updated', handleConversationNameUpdated as unknown as EventListener)

    return () => {
      document.removeEventListener('conversation-name-updated', handleConversationNameUpdated as unknown as EventListener)
    }
  }, [inited, setConversationList]) // Remove conversationList from dependencies



  const handleConversationIdChange = (id: string) => {
    if (id === '-1') {
      createNewChat()
      setConversationIdChangeBecauseOfNew(true)
      // Ensure localStorage is updated when switching to New Chat
      setCurrConversationId(id, APP_ID, true)
    }
    else {
      setConversationIdChangeBecauseOfNew(false)
      setCurrConversationId(id, APP_ID, true)
    }

    // Dispatch a custom event to notify Main component about conversation change
    const event = new CustomEvent('conversation-id-changed', { detail: { id } })
    document.dispatchEvent(event)

    // Hide sidebar on mobile when conversation is selected
    if (onConversationSelect) {
      onConversationSelect()
    }
  }

  const createNewChat = () => {
    // if new chat is already exist, do not create new chat
    if (conversationList.some(item => item.id === '-1'))
      return

    setConversationList(produce(conversationList, (draft) => {
      draft.unshift({
        id: '-1',
        name: t('app.chat.newChatDefaultName'),
        inputs: newConversationInputs,
        introduction: conversationIntroduction,
        suggested_questions: suggestedQuestions,
      })
    }))
  }

  const renderSidebar = () => {
    if (!APP_ID || !APP_INFO)
      return null

    return (
      <Sidebar variant="inset" {...props} className="bg-[#1c5a91]">
        <SidebarHeader className="bg-[#1c5a91]">
          <SidebarMenu >
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                onClick={(e) => {
                  e.preventDefault()
                  router.push('/')
                }}
                className="hover:bg-white/10 active:bg-white/15 active:scale-95 transition-all duration-150 cursor-pointer"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white text-white backdrop-blur-sm transition-colors">
                  {APP_INFO.logo ? (
                    <Image src={APP_INFO.logo} alt="Logo" width={32} height={32} className="text-white" />
                  ) : (
                    <Brain className="text-white" />
                  )}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight space-y-1 text-white">
                  <span className="truncate font-semibold text-white drop-shadow-sm group-hover:text-sky-50 transition-colors">{APP_INFO?.title || 'ASGL'}</span>
                  <span className="truncate text-xs text-sky-100 drop-shadow-sm group-hover:text-white transition-colors">{APP_INFO?.description || 'Chat AI cho ASGL'}</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="bg-[#1c5a91]">
          {/* Global Search Button - Fixed */}
          <div className="px-2 py-1">
            <SearchButton variant="default" showKeyboardShortcut={true} onSearchOpen={openSearch} />
          </div>
          <NavDataset />
          <NavAdmin />
          {inited && (
            <NavConversationList
              conversationList={conversationList}
              currentId={currConversationId}
              onCurrentIdChange={handleConversationIdChange}
            />
          )}
        </SidebarContent>
        <SidebarFooter className="bg-[#1c5a91]">
          <NavUser />
        </SidebarFooter>
      </Sidebar>
    )
  }

  // Handle both mobile and desktop views
  if (isMobile && isShowSidebar) {
    return (
      <>
        <div className='fixed inset-0 z-50'
          style={{ backgroundColor: 'rgba(35, 56, 118, 0.2)' }}
          onClick={hideSidebar}
        >
          <div className='inline-block' onClick={e => e.stopPropagation()}>
            {renderSidebar()}
          </div>
        </div>
        {/* Global Search Modal */}
        <GlobalSearch isOpen={isSearchOpen} onClose={closeSearch} />
      </>
    )
  }

  // For desktop view or when not showing on mobile
  if (!isMobile) {
    return (
      <>
        {renderSidebar()}
        {/* Global Search Modal */}
        <GlobalSearch isOpen={isSearchOpen} onClose={closeSearch} />
      </>
    )
  }

  // Default case: don't render anything
  return (
    <>
      {/* Global Search Modal */}
      <GlobalSearch isOpen={isSearchOpen} onClose={closeSearch} />
    </>
  )
}
