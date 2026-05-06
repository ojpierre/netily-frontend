import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// =====================================================
// ROUTE PROTECTION PROXY
// Protects admin and dashboard routes
// =====================================================

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get tokens from cookies
  const userToken = request.cookies.get('access_token')?.value
  const adminToken = request.cookies.get('adminToken')?.value
  const superadminToken = request.cookies.get('superadminToken')?.value

  // Superadmin routes protection
  if (pathname.startsWith('/superadmin')) {
    if (pathname === '/superadmin/login') {
      if (superadminToken) {
        return NextResponse.redirect(new URL('/superadmin', request.url))
      }
      return NextResponse.next()
    }

    if (!superadminToken) {
      const loginUrl = new URL('/superadmin/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Admin routes protection
  if (pathname.startsWith('/admin')) {
    // Allow access to admin login and register pages
    if (pathname === '/admin/login' || pathname === '/admin/register') {
      // Do NOT force redirect by cookie presence alone.
      // Cookies can be stale or belong to a non-admin account; client-side auth
      // validation will decide whether to route to /admin or stay on login.
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
