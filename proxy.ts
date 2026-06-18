import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ─────────────────────────────────────────────────────────────────────────────
//  TENANT SUBDOMAIN DETECTION
//  When a visitor hits the root of a tenant subdomain (e.g. bluenet.netily.co.ke)
//  they should land on the admin-panel login page, not the marketing homepage.
// ─────────────────────────────────────────────────────────────────────────────

/** Subdomains that belong to the platform itself, not ISP tenants. */
const RESERVED_SUBDOMAINS = new Set([
  'www', 'api', 'admin', 'app', 'superadmin', 'dashboard',
  'mail', 'smtp', 'ftp', 'cdn', 'static', 'assets', 'status', 'dev', 'staging',
])

/** Known root / base domains. */
const ROOT_DOMAINS = new Set([
  'netily.co.ke', 'netily.io', 'netily.com', 'localhost',
])

/**
 * Returns the ISP tenant slug from the hostname, or null if the request is on
 * the main domain / a reserved subdomain.
 *
 * bluenet.netily.co.ke  → "bluenet"
 * netily.co.ke          → null
 * bluenet.localhost     → "bluenet"  (local dev)
 * www.netily.co.ke      → null  (reserved)
 */
function getTenantSubdomain(hostname: string): string | null {
  // Strip port (e.g. "bluenet.localhost:3000" → "bluenet.localhost")
  const host = hostname.split(':')[0].toLowerCase()

  // Bare localhost → main domain
  if (host === 'localhost') return null

  // Local dev: something.localhost
  if (host.endsWith('.localhost')) {
    const sub = host.slice(0, host.lastIndexOf('.localhost'))
    return sub && !RESERVED_SUBDOMAINS.has(sub) ? sub : null
  }

  // Production domains
  for (const root of ROOT_DOMAINS) {
    if (host === root) return null                        // bare root
    if (host.endsWith(`.${root}`)) {
      const sub = host.slice(0, host.length - root.length - 1)
      // Guard against nested subdomains (sub.tenant.netily.co.ke)
      if (!sub.includes('.') && !RESERVED_SUBDOMAINS.has(sub)) return sub
      return null
    }
  }

  return null
}

// Paths that should pass through untouched even on tenant subdomains
const TENANT_PASSTHROUGH_PREFIXES = [
  '/_next/',
  '/favicon',
  '/robots',
  '/sitemap',
  '/og-image',
  '/logo',
  '/api/',
  '/admin',     // already the right destination — let auth guard handle it
  '/dashboard',
  '/customer',
  '/portal',
  '/hotspot',
  '/login',
]

// ─────────────────────────────────────────────────────────────────────────────
//  ROUTE PROTECTION PROXY
//  Protects admin, dashboard, and superadmin routes via cookie checks.
// ─────────────────────────────────────────────────────────────────────────────

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') || ''

  // ── 1. Tenant subdomain redirect (runs before any auth check) ─────────────
  const tenantSubdomain = getTenantSubdomain(hostname)
  if (tenantSubdomain) {
    // Let panel routes and static assets through unchanged
    const isPassthrough = TENANT_PASSTHROUGH_PREFIXES.some((p) =>
      pathname.startsWith(p) || pathname === p.replace(/\/$/, '')
    )
    if (!isPassthrough) {
      // Root '/' or any marketing page on a tenant subdomain → admin login
      return NextResponse.redirect(new URL('/admin/login', request.url), { status: 302 })
    }
  }

  // ── 2. Cookie-based auth tokens ───────────────────────────────────────────
  const userToken = request.cookies.get('access_token')?.value
  const adminToken = request.cookies.get('adminToken')?.value
  const superadminToken = request.cookies.get('superadminToken')?.value

  // ── 3. Superadmin routes protection ───────────────────────────────────────
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

  // ── 4. Admin routes protection ────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/selfie') {
      if (!superadminToken) {
        const loginUrl = new URL('/superadmin/login', request.url)
        loginUrl.searchParams.set('from', pathname)
        return NextResponse.redirect(loginUrl)
      }
      return NextResponse.next()
    }

    // Allow access to admin login page (client-side auth validates the cookie)
    if (pathname === '/admin/login') {
      return NextResponse.next()
    }

    // Protect all other admin routes
    if (!adminToken) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // ── 5. Regular user dashboard protection ─────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    if (!userToken) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Redirect already-logged-in users away from login/register
  if (userToken && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|otf|eot)).*)',
  ],
}
