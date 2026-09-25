import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Netily Shop Frontend Middleware
 *
 * All pages are made accessible without requiring a live database or backend session,
 * allowing frontend design and flows (Catalog, Checkout, Account, Admin, Orders) to be
 * fully explored and reviewed before the Django backend endpoints are connected.
 */
export function middleware(req: NextRequest) {
  // Pass through all routes seamlessly
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
