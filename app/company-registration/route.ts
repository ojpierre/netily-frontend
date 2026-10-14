import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const DEFAULT_PUBLIC_API_BASE = "https://api.netily.co.ke"
const REGISTER_PATH = "/api/v1/superadmin/tenants/register/"
const REGISTRATION_TIMEOUT_MS = 5 * 60 * 1000

function normalizeBaseUrl(value?: string | null) {
  if (!value) return null
  const trimmed = value.trim().replace(/\/+$/, "")
  try {
    const parsed = new URL(trimmed)
    if (parsed.hostname.includes("_")) {
      return null
    }
  } catch {
    return null
  }
  return trimmed.replace(/\/api\/v1$/i, "") || null
}

function buildCandidateUrls() {
  const candidates = [
    normalizeBaseUrl(process.env.API_INTERNAL_URL),
    normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL),
    normalizeBaseUrl(process.env.API_BASE_URL),
    normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL),
    "http://web:8000",
    "http://backend:8000",
    "http://api:8000",
    "http://127.0.0.1:8000",
    DEFAULT_PUBLIC_API_BASE,
  ].filter((value): value is string => Boolean(value))

  return [...new Set(candidates)].map((baseUrl) => `${baseUrl}${REGISTER_PATH}`)
}

function getRegistrationUrl() {
  const [primaryUrl] = buildCandidateUrls()
  return primaryUrl || `${DEFAULT_PUBLIC_API_BASE}${REGISTER_PATH}`
}

export async function POST(request: NextRequest) {
  const platformToken =
    request.cookies.get("superadminToken")?.value ||
    request.cookies.get("supportToken")?.value

  if (!platformToken) {
    return NextResponse.json(
      { detail: "Sign in to the Superadmin or Support dashboard before registering a tenant." },
      { status: 401 },
    )
  }

  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json(
      { detail: "Invalid registration payload." },
      { status: 400 },
    )
  }

  const requestId = crypto.randomUUID()
  const submitted = typeof payload === "object" && payload !== null ? payload as Record<string, unknown> : {}
  const payloadText = JSON.stringify({
    ...submitted,
    referral_code: submitted.referral_code || request.cookies.get("netily_referral_code")?.value || "",
    attribution_token: submitted.attribution_token || request.cookies.get("netily_attribution_token")?.value || null,
  })
  const registrationUrl = getRegistrationUrl()

  try {
    console.info(`[company-registration:${requestId}] forwarding to ${registrationUrl}`)

    const upstream = await fetch(registrationUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${platformToken}`,
        "X-Registration-Proxy": "netily-frontend",
        "X-Request-ID": requestId,
      },
      body: payloadText,
      cache: "no-store",
      signal: AbortSignal.timeout(REGISTRATION_TIMEOUT_MS),
    })

    const text = await upstream.text()
    const contentType = upstream.headers.get("content-type") || ""

    console.info(
      `[company-registration:${requestId}] upstream ${registrationUrl} responded ${upstream.status}`,
    )

    if (contentType.includes("application/json")) {
      return new NextResponse(text, {
        status: upstream.status,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
          "X-Request-ID": requestId,
        },
      })
    }

    return NextResponse.json(
      {
        detail: text || "Registration service returned an unexpected response.",
        request_id: requestId,
      },
      {
        status: upstream.status,
        headers: {
          "Cache-Control": "no-store",
          "X-Request-ID": requestId,
        },
      },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown upstream error"
    console.error(
      `[company-registration:${requestId}] upstream ${registrationUrl} failed: ${message}`,
    )
  }

  return NextResponse.json(
    {
      detail:
        "Tenant provisioning could not reach the backend service. Please retry once, then share the request ID with support.",
      request_id: requestId,
    },
    {
      status: 503,
      headers: {
        "Cache-Control": "no-store",
        "X-Request-ID": requestId,
      },
    },
  )
}
