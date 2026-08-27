import { NextRequest } from "next/server"

import { handleAffiliateReferral } from "@/lib/affiliate-referral-route"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> },
) {
  const { code } = await context.params
  return handleAffiliateReferral(request, code)
}
