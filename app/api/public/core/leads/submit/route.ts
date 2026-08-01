import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// Public leads always go to the canonical Netily API. Using a runtime internal
// URL here made the form dependent on deployment-specific Docker settings and
// caused production 502s when that setting was stale.
const LEAD_SUBMISSION_URL = "https://api.netily.co.ke/api/v1/core/leads/submit/"

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  try {
    const submitted = await request.json()
    const visitorIp =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-real-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      ""
    const upstream = await fetch(LEAD_SUBMISSION_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Request-ID": requestId,
        ...(visitorIp ? { "X-Forwarded-For": visitorIp } : {}),
      },
      body: JSON.stringify({
        ...submitted,
        referral_code:
          submitted.referral_code ||
          request.cookies.get("netily_referral_code")?.value ||
          "",
        attribution_token: request.cookies.get("netily_attribution_token")?.value || null,
      }),
      cache: "no-store",
    })
    const contentType = upstream.headers.get("content-type") || "application/json"
    const response = new NextResponse(await upstream.text(), {
      status: upstream.status,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store, max-age=0",
        "X-Request-ID": requestId,
      },
    })
    if (upstream.ok) {
      response.cookies.delete("netily_referral_code")
      response.cookies.delete("netily_attribution_token")
    }
    return response
  } catch (error) {
    console.error(`[lead-submit:${requestId}] Upstream lead submission failed`, error)
    return NextResponse.json(
      { detail: "Lead submission is temporarily unavailable.", request_id: requestId },
      {
        status: 502,
        headers: { "Cache-Control": "no-store", "X-Request-ID": requestId },
      },
    )
  }
}
