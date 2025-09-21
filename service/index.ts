import { string } from 'zod'
import type { IOnCompleted, IOnData, IOnError, IOnFile, IOnMessageEnd, IOnMessageReplace, IOnNodeFinished, IOnNodeStarted, IOnThought, IOnWorkflowFinished, IOnWorkflowStarted } from './base'
import { get, post, ssePost } from './base'
import type { Feedbacktype } from '@/types/app'

export const sendChatMessage = async (
  body: Record<string, any>,
  {
    onData,
    onCompleted,
    onThought,
    onFile,
    onError,
    getAbortController,
    onMessageEnd,
    onMessageReplace,
    onWorkflowStarted,
    onNodeStarted,
    onNodeFinished,
    onWorkflowFinished,
  }: {
    onData: IOnData
    onCompleted: IOnCompleted
    onFile: IOnFile
    onThought: IOnThought
    onMessageEnd: IOnMessageEnd
    onMessageReplace: IOnMessageReplace
    onError: IOnError
    getAbortController?: (abortController: AbortController) => void
    onWorkflowStarted: IOnWorkflowStarted
    onNodeStarted: IOnNodeStarted
    onNodeFinished: IOnNodeFinished
    onWorkflowFinished: IOnWorkflowFinished
  },
) => {
  // Check and use credit before sending message
  try {
    const creditResponse = await fetch('/api/credits/use', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: 1,
        action: 'chat',
        metadata: {
          conversationId: body.conversation_id,
          query: body.query?.substring(0, 100) // Store first 100 chars for reference
        }
      })
    })

    const creditData = await creditResponse.json()

    if (!creditData.success) {
      // If credit check fails, call onError with credit error
      onError?.(creditData.message || 'Không đủ credit để thực hiện chat')
      return
    }

    // If credit is successfully used, proceed with chat
    return ssePost('chat-messages', {
      body: {
        ...body,
        response_mode: 'streaming',
      },
    }, {
      onData,
      onCompleted: (data) => {
        // Call original onCompleted
        onCompleted?.(data)
      },
      onThought,
      onFile,
      onError,
      getAbortController,
      onMessageEnd,
      onMessageReplace,
      onNodeStarted,
      onWorkflowStarted,
      onWorkflowFinished,
      onNodeFinished
    })
  } catch (error) {
    console.error('Error checking credit:', error)
    onError?.('Có lỗi xảy ra khi kiểm tra credit')
  }
}

export const fetchConversations = async () => {
  return get('conversations', { params: { limit: 100, first_id: '' } })
}

export const fetchChatList = async (conversationId: string) => {
  return get('messages', { params: { conversation_id: conversationId, limit: 20, last_id: '' } })
}

// init value. wait for server update
export const fetchAppParams = async () => {
  return get('parameters')
}

export const updateFeedback = async ({ url, body }: { url: string; body: Feedbacktype }) => {
  return post(url, { body })
}

export const generationConversationName = async (id: string) => {
  return post(`conversations/${id}/name`, { body: { auto_generate: true } })
}


export const checkDocumentAccess = async (documentIds: string[]) => {
  return post('/document-access', {
    body: { documentIds }
  })
}

export const convertTextToAudio = async (messageId: string, text: string) => {
  return post('/api/text-to-audio', {
    body: {
      message_id: messageId,
      text: text
    }
  }, { needAllResponseContent: true })
}

export const convertAudioToText = async (audioFile: File, userId?: string) => {
  const formData = new FormData()
  formData.append('file', audioFile)
  formData.append('user', userId || `user-${Date.now()}`)

  // Use direct fetch for FormData to avoid JSON serialization
  const response = await fetch('/api/audio-to-text', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}