import type { AppInfo } from '@/types/app'
export const APP_ID = `${process.env.NEXT_PUBLIC_APP_ID}`
export const APP_KEY_DATA = `${process.env.NEXT_PUBLIC_APP_KEY_DATA}`
export const API_KEY = `${process.env.NEXT_PUBLIC_APP_KEY}`
export const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`
export const APP_INFO: AppInfo = {
  title: 'Chat AI ASGL',
  description: 'Chat AI ASGL là một chatbot thông minh được phát triển để hỗ trợ tra cứu và tìm hiểu thông tin từ kho tài liệu nội bộ của công ty. Chatbot có khả năng trả lời các câu hỏi, giải đáp thắc mắc và cung cấp thông tin chính xác từ nguồn dữ liệu tài liệu của ASGL.',
  logo: '/images/logo.png',
  copyright: '',
  privacy_policy: '',
  default_language: 'vi',
}

export const isShowPrompt = false
export const promptTemplate = ''

export const API_PREFIX = '/api'

export const LOCALE_COOKIE_NAME = 'locale'

export const DEFAULT_VALUE_MAX_LEN = 48
