import { type NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo } from '@/app/api/utils/common'

export async function POST(request: NextRequest, { params }: {
  params: { conversationId: string }
}) {
  const body = await request.json()
  const {
    auto_generate,
    name,
  } = body
  const { conversationId } = params
  const { user, userInfo } = await getInfo(request)
  const userId = userInfo!.id

  // auto generate name
  const { data } = await client.renameConversation(conversationId, name, userId, auto_generate)
  return NextResponse.json(data)
}
