import { NextRequest, NextResponse } from "next/server"
import { forwardSimulatorRequest } from "../_proxy"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    return forwardSimulatorRequest(request, "initiate/", { method: "POST", body })
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid simulator payment request." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    )
  }
}
