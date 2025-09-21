import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Protected routes that require authentication
const protectedRoutes = ['/admin', '/dataset']

// Admin-only routes that require admin permissions
const adminOnlyRoutes = ['/admin']

// Public routes that don't require authentication
const publicRoutes = ['/auth/login', '/api/auth', '/api/public']

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes and API auth routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public') ||
    pathname.includes('.') // Static files usually have extensions
  ) {
    return NextResponse.next()
  }

  try {
    // Check for valid session
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    })

    if (!token) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Check if route requires protection
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

    if (!isProtectedRoute) {
      return NextResponse.next()
    }

    // Check if route requires admin permissions
    const isAdminRoute = adminOnlyRoutes.some(route => pathname.startsWith(route))

    if (isAdminRoute) {
      // Check for admin privileges
      const isAdmin = token.asgl_id === 'admin' || token.asgl_id === 'superadmin'

      if (!isAdmin) {
        // Redirect to unauthorized page or main dashboard
        const unauthorizedUrl = new URL('/', request.url)
        return NextResponse.redirect(unauthorizedUrl)
      }
    }
    return NextResponse.next()

  } catch (error) {

    // On error, redirect to login
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - vs (Monaco editor assets)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public|vs).*)',
  ],
}
