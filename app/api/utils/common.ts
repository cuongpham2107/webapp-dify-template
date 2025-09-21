import { type NextRequest } from 'next/server'
import { ChatClient } from 'dify-client'
import { v4 } from 'uuid'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { API_KEY, API_URL, APP_ID, APP_KEY_DATA } from '@/config'
import { DatasetClient } from '@/service/dataset'
import { DocumentClient } from '@/service/document'
import { userInfo } from 'os'
import { getUserIdByAsglId } from '@/lib/models/user'
const userPrefix = `user_${APP_ID}:`


export const getInfo = async (request: NextRequest) => {
  // Lấy session của user đã đăng nhập
  const session = await getServerSession(authOptions)

  let sessionId: string
  let user: string
  if (session?.user?.id) {
    // Nếu user đã đăng nhập, sử dụng user ID
    sessionId = session.user.id.toString()
    user = userPrefix + session.user.id
  }
  else {
    // Nếu chưa đăng nhập, sử dụng session_id từ cookie hoặc tạo mới
    sessionId = request.cookies.get('session_id')?.value || v4()
    user = userPrefix + sessionId
  }
  return {
    sessionId,
    user,
    isAuthenticated: !!session?.user,
    userInfo: session?.user || null,
  }
}

export const setSession = (sessionId: string) => {
  return { 'Set-Cookie': `session_id=${sessionId}` }
}

export const client = new ChatClient(API_KEY, API_URL || undefined)

export const datasets = new DatasetClient(APP_KEY_DATA, API_URL || undefined)

export const documents = new DocumentClient(APP_KEY_DATA, API_URL || undefined)
