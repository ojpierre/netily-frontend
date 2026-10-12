import pages from "./content.json"

export const marketingIndexes: Record<string, { title: string; intro: string }> = {
  features: { title: "Everything your ISP runs on. One place.", intro: "Collect payments, manage network access, support your subscribers, and see what is working." },
  solutions: { title: "Built around the network you run.", intro: "From a first hotspot to a growing fibre network. Find the workflow that fits your subscribers." },
  pricing: { title: "Pricing that grows with your subscribers.", intro: "A monthly invoice based on your billable usage. Review the breakdown and pay via M-Pesa or bank transfer." },
  contact: { title: "Let's talk about your ISP.", intro: "A walkthrough starts with your network, your subscribers, and the work you want to simplify." },
  resources: { title: "Practical help for your next step.", intro: "Learn a skill, find a setup guide, or explore the tools for your next installation." },
  integrations: { title: "Connect the tools you already use.", intro: "Bring payments and network access together. We will check the right connection method for your equipment." },
  countries: { title: "Local payments. Connected operations.", intro: "Start with the payment channels, equipment, and support your network needs." },
  "countries/kenya": { title: "ISP billing built for Kenya.", intro: "M-Pesa STK Push. Paybill collections. KSh pricing. Billing and network access, working together." },
}

export const marketingPaths = [...Object.keys(marketingIndexes).map((path) => `/${path}`), ...pages.map((page) => page.path)]

export const marketingHref = (path = "") => path || "/"
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
