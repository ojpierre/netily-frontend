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
  { title: "Frequently asked questions", href: "/faqs", text: "Direct answers for common MikroTik, Hotspot, payment, and support tasks." },
  { title: "Affiliate program", href: "/affiliate", text: "Refer an ISP and track your referrals in one place." },
  { title: "Network equipment", href: "/shop", text: "Explore equipment for your next installation." },
]

export const featuredSlugs = ["mpesa-billing", "mikrotik-provisioning", "pppoe-billing", "subscriber-portal", "hotspot-billing", "revenue-reporting"]

type AnswerEngineContent = {
  answer: string
  questions: Array<[string, string]>
}

export const answerEngineContent: Record<string, AnswerEngineContent> = {
  "/features/mpesa-billing": {
    answer: "Internetily connects M-Pesa payments to an ISP subscriber record, then records the receipt and triggers the normal access workflow. It is built for operators who need payment matching, renewal visibility, and a consistent path from a confirmed payment to restored service without checking statements and routers manually.",
    questions: [
      ["How does Internetily match an M-Pesa payment?", "Internetily uses the available account references and payment details to match a receipt to the intended subscriber, then records the result in the billing workflow."],
      ["Does a payment automatically reconnect a subscriber?", "After a payment is confirmed and matched, Internetily requests the subscriber's normal access workflow. The exact restoration depends on the connected router and subscriber service configuration."],
    ],
  },
  "/features/mikrotik-provisioning": {
    answer: "Internetily helps ISP teams connect a MikroTik once, then manage subscriber access, PPPoE profiles, queues, and router-linked operations from the billing workspace. It is designed to reduce repeated RouterOS changes while preserving the operator's control over router credentials, connection status, and provisioning scripts.",
    questions: [
      ["Do I need a public IP address for MikroTik provisioning?", "Not necessarily. Internetily supports a secure router connection path; the exact setup depends on your router, network reachability, and Cloud Controller configuration."],
      ["Can I still use Winbox after connecting a router?", "Yes. The router remains yours to manage. Internetily adds an operational connection for billing and provisioning workflows rather than replacing normal router administration."],
    ],
  },
  "/features/pppoe-billing": {
    answer: "When a PPPoE subscription expires, Internetily can place the session in a restricted renewal network that still reaches the payment page. Once payment is confirmed, the subscriber's normal RADIUS profile and internet access are restored automatically, reducing support calls and manual reconnection work.",
    questions: [
      ["How can an expired PPPoE customer reach the payment page without internet access?", "Internetily uses RADIUS and MikroTik rules to place the expired PPPoE session in a restricted renewal-only network. That network can reach the Internetily payment page and required payment services while normal internet access remains unavailable."],
      ["What happens after the expired PPPoE customer pays?", "After the payment is confirmed, Internetily restores the subscriber's normal RADIUS profile and reconnects the PPPoE service automatically."],
    ],
  },
  "/features/hotspot-billing": {
    answer: "Internetily gives hotspot customers a payment-first path from a branded captive portal to an active Wi-Fi session. Operators can publish packages, take supported payments, see session and revenue activity, and support customer devices such as TVs through the same operational workflow.",
    questions: [
      ["Can a Smart TV buy a hotspot plan?", "A TV plan lets a customer pay from a phone while the TV connects using its MAC address, provided the TV is already on the Wi-Fi network and the operator has configured a TV plan."],
      ["Can operators reply to messages from the hotspot login page?", "Yes. Operators can open Tickets, choose Hotspot Chats, and reply to the customer conversation from the admin workspace."],
    ],
  },
  "/features/tr069-device-management": {
    answer: "Internetily (Netily) includes a hosted TR-069 ACS for ISPs. Customer routers and ONTs that support TR-069 connect to it, appear in the dashboard next to their subscriber, and can be managed remotely: change Wi-Fi, refresh device data, reboot or factory reset, with a log of every task. There is no separate ACS server to run.",
    questions: [
      ["What is TR-069?", "TR-069, also written TR69 and known as CWMP (CPE WAN Management Protocol), is a Broadband Forum standard that lets an ISP manage customer equipment remotely. The customer router or ONT (the CPE) connects to a server called an ACS, which can read its status and send changes."],
      ["What is a TR-069 ACS?", "An ACS (auto-configuration server) is the server customer devices check in with. Internetily hosts the ACS for you, so each ISP only sets the ACS URL and credentials on its CPE."],
      ["Which CPE devices work with Internetily TR-069 management?", "Routers and ONTs with TR-069 enabled can connect. What you can change depends on the model, firmware, and the parameters it exposes, so test one device of each model before rolling out."],
      ["What can I do remotely with TR-069 in Internetily?", "View device status and firmware version, change the Wi-Fi name and password, refresh device data, reboot, and factory reset. Each action is recorded in the device's task history."],
      ["Do I need TR-069 if I already use MikroTik?", "They do different jobs. MikroTik and RADIUS handle subscriber access and billing on your network; TR-069 manages the router or ONT inside the customer's home. Internetily runs both from the same subscriber record."],
    ],
  },
}
