/**
 * Netily – Next.js Edge Middleware
 * ──────────────────────────────────────────────────────────────────────────────
 * Purpose
 * ───────
 * In a multi-tenant setup every ISP gets a subdomain  (e.g. bluenet.netily.co.ke).
 * When a visitor hits the root of a **tenant** subdomain they should land on the
 * admin panel login page — not the Netily marketing homepage.
 *
 * Rules
 * ─────
 * 1. Bare root domain  (netily.co.ke | localhost:3000)
 *    → Serve the marketing landing page as-is.  No redirect.
 *
 * 2. Reserved/system subdomains (www, api, superadmin, app, cdn …)
 *    → Serve as-is.  No redirect.
 *
 * 3. Tenant subdomain  (anything else, e.g. bluenet.netily.co.ke)
 *    3a. GET /  or  GET /<empty>
 *        → 302 redirect to /admin/login
 *    3b. Any other path under /admin, /dashboard, /customer, /api, etc.
 *        → Pass through unchanged.
 *    3c. Any static asset (_next/*, public/*)
 *        → Pass through unchanged.
 *
 * This runs at the Edge (no Node.js runtime) so it adds <1 ms overhead.
 */

import { NextRequest, NextResponse } from "next/server"

// ── Subdomains that belong to the platform itself, not tenants ────────────────
const RESERVED_SUBDOMAINS = new Set([
  "www",
  "api",
  "admin",
  "app",
  "superadmin",
  "dashboard",
  "mail",
  "smtp",
  "ftp",
  "cdn",
  "static",
  "assets",
  "status",
  "dev",
  "staging",
])

// ── Known root/base domains (extend as you add TLDs) ─────────────────────────
const ROOT_DOMAINS = new Set([
  "netily.co.ke",
  "netily.io",
  "netily.com",
  "localhost",
])

// ── Paths that should always pass through on any subdomain ────────────────────
// (Next.js internals + your public API proxy routes)
const PASSTHROUGH_PREFIXES = [
  "/_next/",
  "/favicon",
  "/robots",
  "/sitemap",
  "/og-image",
  "/logo",
  "/api/",          // internal Next.js API routes
  "/admin",         // ISP admin panel pages – already the right destination
  "/dashboard",     // ISP dashboard pages
  "/customer",      // customer portal pages
  "/portal",        // hotspot / captive-portal pages
  "/hotspot",
  "/login",
]

/**
 * Extract the tenant subdomain (or null) from the hostname.
 *
 * Examples:
 *   bluenet.netily.co.ke  → "bluenet"
 *   netily.co.ke          → null
 *   localhost             → null
 *   bluenet.localhost     → "bluenet"
 *   www.netily.co.ke      → null  (reserved)
 */
function getTenantSubdomain(hostname: string): string | null {
  // Strip port if present (e.g. "bluenet.localhost:3000" → "bluenet.localhost")
  const host = hostname.split(":")[0].toLowerCase()

  // Handle `something.localhost` (local dev)
  if (host === "localhost") return null
  if (host.endsWith(".localhost")) {
    const sub = host.slice(0, host.lastIndexOf(".localhost"))
    return sub && !RESERVED_SUBDOMAINS.has(sub) ? sub : null
  }

  // Handle known production domains
  for (const root of ROOT_DOMAINS) {
    if (host === root) return null                     // bare root – no tenant
    if (host.endsWith(`.${root}`)) {
      const sub = host.slice(0, host.length - root.length - 1)
      // Guard against nested subdomains (e.g. "sub.tenant.netily.co.ke")
      if (!sub.includes(".") && !RESERVED_SUBDOMAINS.has(sub)) {
        return sub
      }
      return null
    }
  }

  return null
}

export function middleware(request: NextRequest) {
  const { pathname, hostname: rawHostname } = request.nextUrl
  const hostname = request.headers.get("host") || rawHostname || ""

  const tenantSubdomain = getTenantSubdomain(hostname)

  // ── Not a tenant subdomain: serve normally ────────────────────────────────
  if (!tenantSubdomain) {
    return NextResponse.next()
  }

  // ── Tenant subdomain: check whether we need to redirect ───────────────────

  // Let static assets and known panel routes pass through unchanged
  for (const prefix of PASSTHROUGH_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      return NextResponse.next()
    }
  }

  // Also pass through exact matches like "/admin" (no trailing slash)
  if (pathname === "/admin" || pathname === "/dashboard") {
    return NextResponse.next()
  }

  // Root path on a tenant subdomain → redirect to the admin login page
  if (pathname === "/" || pathname === "") {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/admin/login"
    return NextResponse.redirect(loginUrl, { status: 302 })
  }

  // Any other path on a tenant subdomain (e.g. /about, /pricing from the
  // marketing site that leaked through) → also redirect to admin/login so
  // the tenant never accidentally sees the Netily marketing pages.
  //
  // If you ever want tenant-specific public pages (e.g. /hotspot captive
  // portal), add those paths to PASSTHROUGH_PREFIXES above.
  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = "/admin/login"
  return NextResponse.redirect(loginUrl, { status: 302 })
}

// ── Tell Next.js which paths to run this middleware on ────────────────────────
// We exclude known static files to avoid unnecessary middleware overhead.
export const config = {
  matcher: [
    /*
     * Run on all paths EXCEPT:
     * - _next/static  (static chunk files)
     * - _next/image   (image optimisation)
     * - favicon.ico, .png, .svg, .jpg, .webp, .ico, .woff, .woff2
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|otf|eot)).*)",
  ],
}
