import { type NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo, setSession } from '@/app/api/utils/common'

export async function GET(request: NextRequest) {
  const { sessionId, user, userInfo } = await getInfo(request)
  const userId = userInfo!.id
  const { searchParams } = new URL(request.url)
  const conversationId = searchParams.get('conversation_id')
  const { data }: any = await client.getConversationMessages(userId, conversationId as string)
  return NextResponse.json(data, {
    headers: setSession(sessionId),
  })
}
