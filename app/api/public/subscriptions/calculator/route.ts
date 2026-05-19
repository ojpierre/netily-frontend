import { NextRequest, NextResponse } from "next/server"

const REMOTE_API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  "https://api.netily.co.ke/api/v1"

export async function GET(request: NextRequest) {
  const search = request.nextUrl.search || ""

  try {
    const upstream = await fetch(`${REMOTE_API_BASE}/subscriptions/calculator/${search}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    })

    const contentType = upstream.headers.get("content-type") || "application/json"
    const body = await upstream.text()

    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store, max-age=0",
      },
    })
  } catch {
    return NextResponse.json(
      {
        detail: "Calculator service is temporarily unavailable.",
      },
      { status: 502 },
    )
  }
}
