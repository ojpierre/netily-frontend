import { NextRequest, NextResponse } from "next/server"

const API_BASE =
  process.env.API_INTERNAL_URL?.replace(/\/+$/, "") ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  "https://api.netily.co.ke/api/v1"

export async function GET(request: NextRequest, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params
  const destination = new URL("/", request.url)
  try {
    const response = await fetch(`${API_BASE}/affiliate/r/${encodeURIComponent(code)}/click/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": request.headers.get("user-agent") || "" },
      body: JSON.stringify({
        source: request.nextUrl.searchParams.get("utm_source") || "Direct",
        landing_url: request.url,
        referrer: request.headers.get("referer") || "",
      }),
      cache: "no-store",
    })
    if (response.ok) {
      const data = await response.json()
      const redirect = NextResponse.redirect(destination)
      const options = { maxAge: 60 * 60 * 24 * 30, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/" }
      redirect.cookies.set("netily_referral_code", data.referral_code, options)
      redirect.cookies.set("netily_attribution_token", data.attribution_token, options)
      return redirect
    }
  } catch {
    // Attribution must never prevent the visitor from reaching the site.
  }
  return NextResponse.redirect(destination)
}
