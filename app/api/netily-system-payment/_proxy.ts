import { NextRequest, NextResponse } from "next/server"

const DEFAULT_PUBLIC_API_BASE = "https://api.netily.co.ke"
const API_VERSION_PATH = "/api/v1"
const PROXY_TIMEOUT_MS = 35_000

function normalizeBaseUrl(value?: string | null) {
  if (!value) return null
  const trimmed = value.trim().replace(/\/+$/, "")
  if (!trimmed) return null

  try {
    const parsed = new URL(trimmed)
    if (parsed.hostname.includes("_")) return null
  } catch {
    return null
  }

  return trimmed
}

function buildApiBases() {
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

  return [...new Set(candidates)].map((baseUrl) =>
    baseUrl.endsWith(API_VERSION_PATH) ? baseUrl : `${baseUrl}${API_VERSION_PATH}`,
  )
}

function shouldTryNextCandidate(statusCode: number) {
  return statusCode === 502 || statusCode === 503 || statusCode === 504
}

export async function forwardSimulatorRequest(
  request: NextRequest,
  path: string,
  init: { method: "GET" | "POST"; body?: string },
) {
  const requestId = crypto.randomUUID()
  const token = request.headers.get("X-Netily-System-Payment-Token") || ""
  let lastFailure = "No simulator endpoint configured."

  for (const apiBase of buildApiBases()) {
    const upstreamUrl = `${apiBase}/billing/netily-system-payment/${path}`

    try {
      console.info(`[netily-system-payment:${requestId}] forwarding to ${upstreamUrl}`)

      const upstream = await fetch(upstreamUrl, {
        method: init.method,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-Netily-System-Payment-Token": token,
          "X-Request-ID": requestId,
        },
        body: init.body,
        cache: "no-store",
        signal: AbortSignal.timeout(PROXY_TIMEOUT_MS),
      })
      const contentType = upstream.headers.get("content-type") || "application/json"
      const responseBody = await upstream.text()

      if (shouldTryNextCandidate(upstream.status)) {
        lastFailure = `Upstream ${upstreamUrl} responded ${upstream.status}.`
        continue
      }

      return new NextResponse(responseBody, {
        status: upstream.status,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "no-store, max-age=0",
          "X-Request-ID": requestId,
        },
      })
    } catch (error) {
      lastFailure = error instanceof Error ? error.message : "Unknown upstream error"
      console.error(
        `[netily-system-payment:${requestId}] upstream ${upstreamUrl} failed: ${lastFailure}`,
      )
    }
  }

  return NextResponse.json(
    {
      success: false,
      message: "Netily system payment simulator is temporarily unavailable.",
      request_id: requestId,
    },
    {
      status: 503,
      headers: {
        "Cache-Control": "no-store",
        "X-Request-ID": requestId,
        "X-Netily-System-Payment-Failure": lastFailure.slice(0, 200),
      },
    },
  )
}
