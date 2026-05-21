import { NextRequest, NextResponse } from "next/server"

const API_BASE =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://api.netily.co.ke"

const REGISTER_URL = `${API_BASE.replace(/\/+$/, "")}/api/v1/core/companies/register/`

export async function POST(request: NextRequest) {
  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json(
      { detail: "Invalid registration payload." },
      { status: 400 },
    )
  }

  try {
    const upstream = await fetch(REGISTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    })

    const text = await upstream.text()
    const contentType = upstream.headers.get("content-type") || ""

    if (contentType.includes("application/json")) {
      return new NextResponse(text, {
        status: upstream.status,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      })
    }

    return NextResponse.json(
      {
        detail: text || "Registration service returned an unexpected response.",
      },
      {
        status: upstream.status,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    )
  } catch {
    return NextResponse.json(
      {
        detail:
          "Registration service is temporarily unavailable. Please retry in 30-60 seconds.",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    )
  }
}
