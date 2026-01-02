import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// =====================================================
// ROUTE PROTECTION MIDDLEWARE
// Protects admin and dashboard routes
// =====================================================

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get tokens from cookies
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
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Regular user dashboard routes protection
  if (pathname.startsWith('/dashboard')) {
    if (!userToken) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Redirect logged-in users away from login/register pages
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