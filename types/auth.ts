export type LoginRequest = {
  login: string
  password: string
}

export type LoginResponse = {
  success: boolean
  message: string
  error_code: number
  data: LoginData
}

export type LoginData = {
  token: string
  user: User
  application_access_permissions: string[]
  current_company: Company
}

export type User = {
  id: number
  username: string
  email: string
  full_name: string
  asgl_id: string
  is_active: number
  mobile_phone: string
  chat_id: string | null
  avatar: string
  portrait: string
  positions: Position[]
}

export type Position = {
  id: number
  name: string
  level: Level
  department: Department
}

export type Level = {
  id: number
  name: string
}

export type Department = {
  id: number
  name: string
  short_code: string
  parent_id: number
  tenant_id: number
  level: Level
}

export type Company = {
  id: number
  code: string
  name: string
  description: string | null
  created_at: string | null
  updated_at: string | null
}

// NextAuth session extension
declare module 'next-auth' {
  interface Session {
    user: {
      id: number
      username: string
      email: string
      full_name: string
      asgl_id: string
      avatar: string
      portrait: string
      positions: Position[]
      application_access_permissions: string[]
      current_company: Company
      isLocalUser?: boolean
    }
    token: string
  }

  interface User {
    id: number
    username: string
    email: string
    full_name: string
    asgl_id: string
    avatar: string
    portrait: string
    positions: Position[]
    application_access_permissions: string[]
    current_company: Company
    token: string
    isLocalUser?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: number
    username: string
    email: string
    full_name: string
    asgl_id: string
    avatar: string
    portrait: string
    positions: Position[]
    application_access_permissions: string[]
    current_company: Company
    token: string
    isLocalUser?: boolean
  }
}
