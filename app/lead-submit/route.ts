import { NextRequest } from "next/server"

import { POST as submitPublicLead } from "@/app/api/public/core/leads/submit/route"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  return submitPublicLead(request)
}
