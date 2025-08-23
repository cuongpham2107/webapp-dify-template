import { loginUser, authenticateLocalUser } from '@/lib/models/user'
import type { LoginRequest, LoginResponse } from '@/types/auth'

const ASGL_AUTH_API = 'https://id.asgl.net.vn/api/auth/login'

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      // First, try to authenticate with local database
      const localUser = await authenticateLocalUser(credentials.login, credentials.password)

      if (localUser) {

        // Return response in the same format as ASGL API
        return {
          success: true,
          message: 'Login successful (local)',
          error_code: 0,
          data: {
            user: {
              id: parseInt(localUser.id), // Convert string to number
              username: localUser.asgl_id,
              email: localUser.email,
              full_name: localUser.name,
              asgl_id: localUser.asgl_id,
              is_active: 1,
              mobile_phone: '',
              chat_id: null,
              avatar: '', // Empty string instead of null
              portrait: '', // Empty string instead of null
              positions: []
            },
            token: 'local-token-' + Date.now(), // Generate a local token
            application_access_permissions: localUser.roles?.map(ur => ur.role.name) || [],
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

      // If local authentication fails, try ASGL API
      const response = await fetch(ASGL_AUTH_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`)

      const data: LoginResponse = await response.json()

      if (!data.success)
        throw new Error(data.message || 'Login failed')

      // Create/update user in local database from ASGL response
      await loginUser(data.data.user.asgl_id + '@asgl.net.vn', data.data.user.asgl_id, data.data.user.full_name, credentials.password)

      return data
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
