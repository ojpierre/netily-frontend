import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// =====================================================
// AUTHENTICATION DISABLED FOR DEVELOPMENT
// Set ENABLE_AUTH = true to enable route protection
// =====================================================
const ENABLE_AUTH = false

export function middleware(request: NextRequest) {
  // Skip all auth checks if disabled
  if (!ENABLE_AUTH) {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl
  
  // Get tokens from cookies (for now, middleware will be lenient since we use localStorage)
  // In production, tokens should be in httpOnly cookies
  const userToken = request.cookies.get('access_token')?.value
  const adminToken = request.cookies.get('adminToken')?.value

  // Admin routes protection
  if (pathname.startsWith('/admin')) {
    // Allow access to admin login page
    if (pathname === '/admin/login') {
      // Redirect to dashboard if already logged in
      if (adminToken) {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
      return NextResponse.next()
    }

    // Protect all other admin routes
    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // Regular user routes protection
  const publicPaths = ['/login', '/register', '/']
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

  if (!userToken && !isPublicPath && !pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (userToken && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}