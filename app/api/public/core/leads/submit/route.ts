import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const REMOTE_API_BASE =
  process.env.API_INTERNAL_URL?.replace(/\/+$/, "") ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  "https://api.netily.co.ke/api/v1"

export async function POST(request: NextRequest) {
  try {
    const submitted = await request.json()
    const upstream = await fetch(`${REMOTE_API_BASE}/core/leads/submit/`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...submitted,
        referral_code: request.cookies.get("netily_referral_code")?.value || "",
        attribution_token: request.cookies.get("netily_attribution_token")?.value || null,
      }),
      cache: "no-store",
    })
    const contentType = upstream.headers.get("content-type") || "application/json"
    return new NextResponse(await upstream.text(), {
      status: upstream.status,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store, max-age=0",
      },
    })
  } catch {
    return NextResponse.json(
      { detail: "Lead submission is temporarily unavailable." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    )
  }
}
