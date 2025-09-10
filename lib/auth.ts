import type { NextAuthOptions, User } from "next-auth"
import CredentialsProvider from 'next-auth/providers/credentials'
import { authService } from '@/service/auth'
import type { LoginRequest } from '@/types/auth'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'ASGL Credentials',
      credentials: {
        login: { label: 'Username', type: 'text', placeholder: 'ASGL-XXXXX' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.login || !credentials?.password)
          throw new Error('Missing credentials')

        try {
          const loginData: LoginRequest = {
            login: credentials.login,
            password: credentials.password,
          }

          const response = await authService.login(loginData)

          if (response.success && response.data.user) {
            const { user, token, application_access_permissions, current_company } = response.data

            // For local users, we need to handle roles differently
            const userRoles = Array.isArray(application_access_permissions)
              ? application_access_permissions
              : []

            return {
              id: user.id,
              username: user.username,
              email: user.email || `${user.username}@asgl.net.vn`, // Fallback email
              full_name: user.full_name,
              asgl_id: user.asgl_id,
              avatar: user.avatar,
              portrait: user.portrait,
              positions: user.positions || [],
              application_access_permissions: userRoles,
              current_company,
              token,
              // Add a flag to identify local users
              isLocalUser: token?.startsWith('local-token-') || false,
            }
          }

          return null
        }
        catch (error) {
          console.error('Authentication error:', error)
          throw new Error('Authentication failed')
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      // Persist user data in JWT token
      if (user) {
        token.id = user.id
        token.username = user.username
        token.email = user.email
        token.full_name = user.full_name
        token.asgl_id = user.asgl_id
        token.avatar = user.avatar
        token.portrait = user.portrait
        token.positions = user.positions
        token.application_access_permissions = user.application_access_permissions
        token.current_company = user.current_company
        token.token = user.token
        token.isLocalUser = user.isLocalUser || false
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client
      if (token) {
        session.user = {
          id: token.id,
          username: token.username,
          email: token.email,
          full_name: token.full_name,
          asgl_id: token.asgl_id,
          avatar: token.avatar,
          portrait: token.portrait,
          positions: token.positions,
          application_access_permissions: token.application_access_permissions,
          current_company: token.current_company,
          isLocalUser: token.isLocalUser || false,
        }
        session.token = token.token
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}
