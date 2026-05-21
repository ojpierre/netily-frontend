import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const DEFAULT_PUBLIC_API_BASE = "https://api.netily.co.ke"
const STATUS_PATH = "/api/v1/core/companies/register/status/"

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
  return trimmed || null
}

function getStatusUrl(searchParams: URLSearchParams) {
  const candidates = [
    normalizeBaseUrl(process.env.API_INTERNAL_URL),
    normalizeBaseUrl(process.env.API_BASE_URL),
    normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL),
    "http://web:8000",
    "http://backend:8000",
    "http://api:8000",
    "http://127.0.0.1:8000",
    DEFAULT_PUBLIC_API_BASE,
  ].filter((value): value is string => Boolean(value))

  const baseUrl = candidates[0] || DEFAULT_PUBLIC_API_BASE
  return `${baseUrl}${STATUS_PATH}?${searchParams.toString()}`
}

export async function GET(request: NextRequest) {
  const companyName = request.nextUrl.searchParams.get("company_name") || ""
  const companyEmail = request.nextUrl.searchParams.get("company_email") || ""

  if (!companyName || !companyEmail) {
    return NextResponse.json(
      { detail: "company_name and company_email are required." },
      { status: 400 },
    )
  }

  const searchParams = new URLSearchParams({
    company_name: companyName,
    company_email: companyEmail,
  })
  const statusUrl = getStatusUrl(searchParams)

  try {
    const upstream = await fetch(statusUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    })

    const text = await upstream.text()
    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "application/json",
        "Cache-Control": "no-store",
      },
    })
  } catch {
    return NextResponse.json(
      { detail: "Registration status lookup failed." },
      { status: 503 },
    )
  }
}
