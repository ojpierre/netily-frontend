import pages from "./content.json"

export const previewRoot = "/landing-page"
export const previewHref = (path = "") => `${previewRoot}${path}`
export const featurePages = pages.filter((page) => page.path.startsWith("/features/"))
export const solutionPages = pages.filter((page) => page.path.startsWith("/solutions/"))
export const detailPages = pages
export type DetailPage = (typeof pages)[number]

const names: Record<string, string> = {
  "mpesa-billing": "M-Pesa billing", "mikrotik-provisioning": "MikroTik provisioning",
  "pppoe-billing": "PPPoE billing", "hotspot-billing": "Hotspot billing",
  "tr069-device-management": "TR-069 device management", "ip-mac-bindings": "IP / MAC bindings",
  "sms-reminders": "SMS reminders", "vouchers-agents": "Vouchers & agents",
  "fibre-isps": "Fibre ISPs", "rural-wisps": "Rural WISPs", "managed-wifi": "Managed Wi-Fi",
}

export function pageName(path: string) {
  const slug = path.split("/").pop() || ""
  return names[slug] || slug.charAt(0).toUpperCase() + slug.slice(1).replaceAll("-", " ")
}

export const featureGroups = [
  { title: "Get paid on time", slugs: ["mpesa-billing", "payment-reconciliation", "recurring-invoicing", "vouchers-agents"] },
  { title: "Run your network", slugs: ["mikrotik-provisioning", "pppoe-billing", "hotspot-billing", "router-monitoring", "captive-portals", "tr069-device-management", "ip-mac-bindings"] },
  { title: "Support your subscribers", slugs: ["subscriber-management", "subscriber-portal", "support-tickets", "sms-reminders", "customer-wallet"] },
  { title: "See what's working", slugs: ["revenue-reporting", "staff-roles", "customer-referrals", "multi-branch-management"] },
]

export const resources = [
  { title: "ISP guides", href: "/blog", text: "Practical answers for billing, networking, and growing your ISP." },
  { title: "Internetily Academy", href: "/academy", text: "Hands-on courses for you and your team." },
  { title: "Documentation", href: "/docs", text: "Get connected, set up billing, and find your way around." },
  { title: "Affiliate program", href: "/affiliate", text: "Refer an ISP and track your referrals in one place." },
  { title: "Network equipment", href: "/shop", text: "Explore equipment for your next installation." },
]

export const featuredSlugs = ["mpesa-billing", "mikrotik-provisioning", "subscriber-portal", "hotspot-billing", "revenue-reporting", "staff-roles"]
