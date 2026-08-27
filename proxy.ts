import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ─────────────────────────────────────────────────────────────────────────────
//  TENANT SUBDOMAIN DETECTION
//  When a visitor hits the root of a tenant subdomain (e.g. bluenet.netily.co.ke)
//  they should land on the admin-panel login page, not the marketing homepage.
// ─────────────────────────────────────────────────────────────────────────────

/** Subdomains that belong to the platform itself, not ISP tenants. */
const RESERVED_SUBDOMAINS = new Set([
  'www', 'api', 'admin', 'app', 'superadmin', 'support', 'dashboard',
  'mail', 'smtp', 'ftp', 'cdn', 'static', 'assets', 'status', 'dev', 'staging',
])

/** Known root / base domains. */
const ROOT_DOMAINS = new Set([
  'netily.co.ke', 'netily.io', 'netily.com', 'localhost',
])

// ─────────────────────────────────────────────────────────────────────────────
//  CUSTOM TENANT DOMAINS
//  ISPs that bring their own domain (e.g. bentrextechnologies.com) instead of
//  using a *.netily.co.ke subdomain. Each entry controls what the bare root "/"
//  resolves to for that specific hostname — this is intentionally per-domain
//  because different ISPs have asked for different default landing behavior.
// ─────────────────────────────────────────────────────────────────────────────

const CUSTOM_TENANT_DOMAIN_HOME: Record<string, string> = {
  'bentrextechnologies.com': '/customer/login',
  'www.bentrextechnologies.com': '/customer/login',
}

function getCustomTenantHome(hostname: string): string | null {
  const host = hostname.split(':')[0].toLowerCase()
  return CUSTOM_TENANT_DOMAIN_HOME[host] || null
}

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

// ─────────────────────────────────────────────────────────────────────────────
//  SEO: X-ROBOTS-TAG
//  Prevent tenant subdomains (*.netily.co.ke) and custom tenant domains from
//  being indexed by search engines. Only the root marketing domain is indexable.
//  This avoids crawl budget waste, duplicate content, and private data leaks.
// ─────────────────────────────────────────────────────────────────────────────

function withNoIndexIfTenant(response: ReturnType<typeof NextResponse.next>, hostname: string) {
  const host = hostname.split(':')[0].toLowerCase()
  const isRootDomain =
    ROOT_DOMAINS.has(host) ||
    host === 'www.netily.co.ke' ||
    host === 'www.netily.io' ||
    host === 'www.netily.com'
  if (!isRootDomain) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet')
  }
  return response
}

// Paths that should pass through untouched even on tenant subdomains
const TENANT_PASSTHROUGH_PREFIXES = [
  '/_next/',
  '/favicon',
  '/robots',
  '/sitemap',
  '/manifest',
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

  if (pathname === '/api/netily-system-payment' || pathname.startsWith('/api/netily-system-payment/')) {
    const upstream = new URL(request.url)
    upstream.protocol = 'https:'
    upstream.host = 'api.netily.co.ke'
    upstream.pathname = pathname.replace(
      /^\/api\/netily-system-payment/,
      '/api/v1/billing/netily-system-payment',
    )
    return NextResponse.rewrite(upstream)
  }

  // ── 1a. Custom tenant domain redirect (e.g. bentrextechnologies.com) ──────
  // Only the bare root "/" is redirected — /admin/login, /customer/login,
  // /api/, static assets etc. all pass through untouched so the ISP's admin
  // can still reach their dashboard by typing the URL manually.
  const customHome = getCustomTenantHome(hostname)
  if (customHome && pathname === '/') {
    return NextResponse.redirect(new URL(customHome, request.url), { status: 302 })
  }

  // ── 1b. Tenant subdomain redirect (runs before any auth check) ────────────
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
    // Passthrough on tenant subdomain — suppress indexing
    return withNoIndexIfTenant(NextResponse.next(), hostname)
  }

  // ── 2. Cookie-based auth tokens ───────────────────────────────────────────
  const userToken = request.cookies.get('access_token')?.value
  const adminToken = request.cookies.get('adminToken')?.value
  const superadminToken = request.cookies.get('superadminToken')?.value
  const supportToken = request.cookies.get('supportToken')?.value

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

  // ── 3b. Platform support console protection ─────────────────────────────
  if (pathname.startsWith('/support')) {
    if (pathname === '/support/login') {
      if (supportToken) {
        return NextResponse.redirect(new URL('/support/dashboard', request.url))
      }
      return NextResponse.next()
    }

    if (!supportToken) {
      const loginUrl = new URL('/support/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // ── 4. Admin routes protection ────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/selfie') {
      if (!superadminToken && !supportToken) {
        const loginUrl = new URL('/support/login', request.url)
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

  return withNoIndexIfTenant(NextResponse.next(), hostname)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|otf|eot)).*)',
  ],
}
