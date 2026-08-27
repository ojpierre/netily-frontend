import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const DEFAULT_PUBLIC_API_BASE = "https://api.netily.co.ke"
const API_VERSION_PATH = "/api/v1"
const LEAD_SUBMIT_PATH = "/core/leads/submit/"
const LEAD_SUBMISSION_TIMEOUT_MS = 25_000

function normalizeBaseUrl(value?: string | null) {
  if (!value) return null
  const trimmed = value.trim().replace(/\/+$/, "")
  if (!trimmed) return null

  try {
    const parsed = new URL(trimmed)
    if (parsed.hostname.includes("_")) {
      return null
    }
  } catch {
    return null
  }

  return trimmed
}

function buildLeadSubmissionUrls() {
  const candidates = [
    normalizeBaseUrl(process.env.API_INTERNAL_URL),
    normalizeBaseUrl(process.env.API_BASE_URL),
    normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL),
    normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL),
    "http://web:8000",
    "http://backend:8000",
    "http://api:8000",
    "http://127.0.0.1:8000",
    DEFAULT_PUBLIC_API_BASE,
  ].filter((value): value is string => Boolean(value))

  return [...new Set(candidates)].map((baseUrl) => {
    const apiBase = baseUrl.endsWith(API_VERSION_PATH)
      ? baseUrl
      : `${baseUrl}${API_VERSION_PATH}`
    return `${apiBase}${LEAD_SUBMIT_PATH}`
  })
}

function shouldTryNextCandidate(statusCode: number) {
  return statusCode === 502 || statusCode === 503 || statusCode === 504
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  let submitted: Record<string, unknown>

  try {
    const payload = await request.json()
    submitted = typeof payload === "object" && payload !== null
      ? payload as Record<string, unknown>
      : {}
  } catch {
    return NextResponse.json(
      { detail: "Invalid lead submission payload.", request_id: requestId },
      { status: 400, headers: { "Cache-Control": "no-store", "X-Request-ID": requestId } },
    )
  }

  const visitorIp =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    ""
  const body = JSON.stringify({
    ...submitted,
    referral_code:
      submitted.referral_code ||
      request.cookies.get("netily_referral_code")?.value ||
      "",
    attribution_token:
      submitted.attribution_token ||
      request.cookies.get("netily_attribution_token")?.value ||
      null,
  })
  const leadSubmissionUrls = buildLeadSubmissionUrls()
  let lastFailure = "No lead submission endpoint configured."

  for (const leadSubmissionUrl of leadSubmissionUrls) {
    try {
      console.info(`[lead-submit:${requestId}] forwarding to ${leadSubmissionUrl}`)

      const upstream = await fetch(leadSubmissionUrl, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-Lead-Proxy": "netily-frontend",
          "X-Request-ID": requestId,
          ...(visitorIp ? { "X-Forwarded-For": visitorIp } : {}),
        },
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(LEAD_SUBMISSION_TIMEOUT_MS),
      })
      const contentType = upstream.headers.get("content-type") || "application/json"
      const responseBody = await upstream.text()

      console.info(
        `[lead-submit:${requestId}] upstream ${leadSubmissionUrl} responded ${upstream.status}`,
      )

      if (shouldTryNextCandidate(upstream.status)) {
        lastFailure = `Upstream ${leadSubmissionUrl} responded ${upstream.status}.`
        continue
      }

      const response = new NextResponse(responseBody, {
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
      lastFailure = error instanceof Error ? error.message : "Unknown upstream error"
      console.error(
        `[lead-submit:${requestId}] upstream ${leadSubmissionUrl} failed: ${lastFailure}`,
      )
    }
  }

  return NextResponse.json(
    { detail: "Lead submission is temporarily unavailable.", request_id: requestId },
    {
      status: 503,
      headers: {
        "Cache-Control": "no-store",
        "X-Request-ID": requestId,
        "X-Lead-Submit-Failure": lastFailure.slice(0, 200),
      },
    },
  )
}
