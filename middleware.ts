import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Middleware: Add X-Robots-Tag noindex headers to tenant subdomains
 * 
 * This prevents dynamic tenant captive portals (e.g., yourisp.netily.co.ke) from:
 * - Draining crawl budget
 * - Creating duplicate content penalties
 * - Leaking private tenant data to search engines
 * 
 * The root domain (netily.co.ke) and marketing pages remain fully indexable.
 */
export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || ""
  const isRootDomain = hostname === "netily.co.ke" || hostname === "www.netily.co.ke"
  
  // Allow indexing only on the primary marketing domain
  if (isRootDomain) {
    return NextResponse.next()
  }
  
  // Block all tenant subdomains from search engines
  const response = NextResponse.next()
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet")
  
  return response
}

// Apply middleware to all routes
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
