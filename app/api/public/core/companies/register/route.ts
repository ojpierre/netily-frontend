import { NextRequest, NextResponse } from "next/server"

const REMOTE_API_BASE =
  process.env.API_INTERNAL_URL?.replace(/\/+$/, "") ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  "https://api.netily.co.ke/api/v1"

export async function POST(request: NextRequest) {
  try {
    const submitted = await request.json()
    const body = JSON.stringify({
      ...submitted,
      referral_code: submitted.referral_code || request.cookies.get("netily_referral_code")?.value || "",
      attribution_token: submitted.attribution_token || request.cookies.get("netily_attribution_token")?.value || null,
    })
    const upstream = await fetch(`${REMOTE_API_BASE}/core/companies/register/`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body,
      cache: "no-store",
    })

    const contentType = upstream.headers.get("content-type") || "application/json"
    const responseBody = await upstream.text()

    return new NextResponse(responseBody, {
      status: upstream.status,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store, max-age=0",
      },
    })
  } catch {
    return NextResponse.json(
      {
        detail: "Registration service is temporarily unavailable.",
      },
      { status: 502 },
    )
  }
}
