import { NextRequest } from "next/server"
import { forwardSimulatorRequest } from "../../_proxy"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ checkoutRequestId: string }> },
) {
  const { checkoutRequestId } = await context.params
  return forwardSimulatorRequest(
    request,
    `status/${encodeURIComponent(checkoutRequestId)}/`,
    { method: "GET" },
  )
}
