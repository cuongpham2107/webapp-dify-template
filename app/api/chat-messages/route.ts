import { type NextRequest } from 'next/server'
import { client, getInfo } from '@/app/api/utils/common'
import { hasEnoughCredit, useCredit } from '@/lib/models/credit'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const {
    inputs,
    query,
    files,
    conversation_id: conversationId,
    response_mode: responseMode,
  } = body
  const { user, userInfo } = await getInfo(request)

  const userId = userInfo!.id

  // Check if user has enough credits
  if (userId) {
    const hasCredit = await hasEnoughCredit(userId, 1)

    if (!hasCredit) {
      return new Response(
        JSON.stringify({
          error: 'Insufficient credits',
          message: 'Bạn đã hết credit cho tháng này. Vui lòng liên hệ admin để được cấp thêm credit.',
          code: 'INSUFFICIENT_CREDITS'
        }),
        {
          status: 402, // Payment Required
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Use 1 credit for this chat message
    const creditUsed = await useCredit(userId, 1, 'chat', {
      query,
      conversationId,
      timestamp: new Date().toISOString()
    })

    if (!creditUsed) {
      return new Response(
        JSON.stringify({
          error: 'Credit usage failed',
          message: 'Không thể sử dụng credit. Vui lòng thử lại.',
          code: 'CREDIT_USAGE_FAILED'
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }
  }

  const res = await client.createChatMessage(inputs, query, userId, responseMode, conversationId, files)
  return new Response(res.data as any)
}
