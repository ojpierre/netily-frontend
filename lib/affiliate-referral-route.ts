import "server-only"

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

const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30
const REFERRAL_CODE_PATTERN = /^[A-Z0-9_-]{4,64}$/

export async function handleAffiliateReferral(request: NextRequest, rawCode: string) {
  const code = rawCode.trim().toUpperCase()
  const destination = new URL("/", PUBLIC_SITE_URL)
  destination.hash = "contact"

  if (!REFERRAL_CODE_PATTERN.test(code)) {
    return NextResponse.redirect(destination)
  }

  destination.searchParams.set("ref", code)

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
        landing_url: new URL(
          `${request.nextUrl.pathname}${request.nextUrl.search}`,
          PUBLIC_SITE_URL,
        ).toString(),
        referrer: request.headers.get("referer") || "",
        attribution_token: existingAttribution,
      }),
      cache: "no-store",
    })

    if (response.ok) {
      const data = await response.json()
      if (
        typeof data.referral_code !== "string" ||
        typeof data.attribution_token !== "string"
      ) {
        throw new Error("Invalid affiliate tracking response")
      }
      const redirect = NextResponse.redirect(destination)
      const options = {
        maxAge: REFERRAL_COOKIE_MAX_AGE,
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
    // Analytics downtime must never block the visitor from reaching the lead form.
  }

  return NextResponse.redirect(destination)
}
