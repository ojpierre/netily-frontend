import React from "react"
import type { Metadata } from "next"
import { AffiliateLandingClient } from "./affiliate-landing"

export const metadata: Metadata = {
  title: "Netily Affiliate Program | Earn by Referring ISPs in Kenya & Africa",
  description:
    "Join the Netily Affiliate Program. Refer ISPs, WISPs, and hotspot operators in Kenya and Africa to our billing software and earn recurring commissions via M-Pesa.",
  keywords: [
    "isp affiliate program kenya",
    "isp affiliate program nigeria",
    "earn money referring isps nigeria",
    "earn money referring isps",
    "isp billing software affiliate",
    "mikrotik affiliate program lagos",
    "mikrotik affiliate program",
    "wisp referral program africa",
    "m-pesa hotspot affiliate",
    "best isp affiliate network nairobi",
    "netily affiliate",
    "make money online kenya tech",
    "b2b saas affiliate program africa",
  ],
}

export default function AffiliateLandingPage() {
  return <AffiliateLandingClient />
}
