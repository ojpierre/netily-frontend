import { NextRequest, NextResponse } from "next/server"

const API_BASE =
  process.env.API_INTERNAL_URL?.replace(/\/+$/, "") ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  "https://api.netily.co.ke/api/v1"
const PUBLIC_SITE_URL = (
  process.env.PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://netily.co.ke"
).replace(/\/+$/, "")

export async function GET(request: NextRequest, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params
  // Never derive a public redirect from the container's internal host
  // (for example 0.0.0.0:3000 behind nginx).
  const destination = new URL("/", PUBLIC_SITE_URL)
  try {
    const visitorIp =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-real-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      ""
    const existingAttribution = request.cookies.get("netily_attribution_token")?.value || null
    const response = await fetch(`${API_BASE}/affiliate/r/${encodeURIComponent(code)}/click/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": request.headers.get("user-agent") || "",
        ...(visitorIp ? { "X-Forwarded-For": visitorIp } : {}),
      },
      body: JSON.stringify({
        source:
          request.nextUrl.searchParams.get("utm_source") ||
          request.nextUrl.searchParams.get("src") ||
          "Direct",
        landing_url: new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, PUBLIC_SITE_URL).toString(),
        referrer: request.headers.get("referer") || "",
        attribution_token: existingAttribution,
      }),
      cache: "no-store",
    })
    if (response.ok) {
      const data = await response.json()
      const redirect = NextResponse.redirect(destination)
      const options = {
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax" as const,
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        path: "/",
      }
      redirect.cookies.set("netily_referral_code", data.referral_code, options)
      redirect.cookies.set("netily_attribution_token", data.attribution_token, options)
      return redirect
    }
  } catch {
    // Attribution must never prevent the visitor from reaching the site.
  }
  return NextResponse.redirect(destination)
}
