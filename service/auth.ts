import { loginUser, authenticateLocalUser } from '@/lib/models/user'
import type { LoginRequest, LoginResponse } from '@/types/auth'

const ASGL_AUTH_API = 'https://id.asgl.net.vn/api/auth/login'

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    try {
      console.log('🔐 Login attempt:', { login: data.login })

      // For local users, authenticate against our database
      const user = await authenticateLocalUser(data.login, data.password)
      console.log('👤 User found:', user ? 'Yes' : 'No')

      if (user) {
        console.log('✅ Local user authenticated:', user.name)
        // Return response in the same format as ASGL API
        return {
          success: true,
          message: 'Login successful (local)',
          error_code: 0,
          data: {
            user: {
              id: user.id, // Keep as string since it's a cuid
              username: user.asgl_id,
              email: user.email,
              full_name: user.name,
              asgl_id: user.asgl_id,
              is_active: 1,
              mobile_phone: '',
              chat_id: null,
              avatar: '', // Empty string instead of null
              portrait: '', // Empty string instead of null
              positions: []
            },
            token: 'local-token-' + Date.now(), // Generate a local token
            application_access_permissions: user.roles?.map(ur => ur.role.name) || [],
            current_company: {
              id: 0,
              code: 'LOCAL',
              name: 'Local System',
              description: 'Local authentication system',
              created_at: null,
              updated_at: null
            }
          }
        }
      }

      console.log('❌ Local auth failed, trying ASGL API...')
      // If local authentication fails, try ASGL API
      const response = await fetch(ASGL_AUTH_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`)

      const apiResult: LoginResponse = await response.json()

      if (!apiResult.success)
        throw new Error(apiResult.message || 'Login failed')

      // Create/update user in local database from ASGL response
      const localUser = await loginUser(apiResult.data.user.asgl_id + '@asgl.net.vn', apiResult.data.user.asgl_id, apiResult.data.user.full_name, data.password)

      if (!localUser) {
        return {
          success: false,
          message: 'Failed to create or update local user',
          error_code: 1,
          data: {
            user: {
              id: '',
              username: '',
              email: '',
              full_name: '',
              asgl_id: '',
              is_active: 0,
              mobile_phone: '',
              chat_id: null,
              avatar: '',
              portrait: '',
              positions: []
            },
            token: '',
            application_access_permissions: [],
            current_company: {
              id: 0,
              code: '',
              name: '',
              description: '',
              created_at: null,
              updated_at: null
            }
          }
        }
      }

      // Construct a valid LoginResponse from localUser and apiResult
      return {
        success: true,
        message: apiResult.message,
        error_code: apiResult.error_code,
        data: {
          user: {
            id: localUser.id,
            username: localUser.asgl_id,
            email: localUser.email,
            full_name: localUser.name,
            asgl_id: localUser.asgl_id,
            is_active: 1,
            mobile_phone: '',
            chat_id: null,
            avatar: '',
            portrait: '',
            positions: []
          },
          token: apiResult.data.token,
          application_access_permissions: localUser.roles?.map(ur => ur.role.name) || [],
          current_company: apiResult.data.current_company
        }
      }
    }
    catch (error) {
      console.error('Login error:', error)
      throw error
    }
  },

  async validateToken(token: string): Promise<boolean> {
    try {
      // You can implement token validation logic here if ASGL provides an endpoint
      // For now, we'll just check if token exists and is not expired
      if (!token)
        return false

      // Decode JWT to check expiration (basic check)
      const payload = JSON.parse(atob(token.split('.')[1]))
      const currentTime = Math.floor(Date.now() / 1000)

      return payload.exp > currentTime
    }
    catch (error) {
      console.error('Token validation error:', error)
      return false
    }
  },
}
