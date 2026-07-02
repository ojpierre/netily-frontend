export type AlternativeSlug =
  | "centipid-billing"
  | "isp-man"
  | "wisp-man"
  | "jasiyo"
  | "pawanet"
  | "lipanet"

export type AlternativePage = {
  slug: AlternativeSlug
  competitor: string
  searchNames: string[]
  headline: string
  metaTitle: string
  metaDescription: string
  intro: string
  bestFor: string
  netilyAngle: string
  keywords: string[]
}

const sharedKeywords = [
  "ISP billing software Kenya",
  "M-Pesa ISP billing automation",
  "MikroTik PPPoE billing software",
  "WISP billing software Kenya",
  "hotspot billing software Kenya",
  "ISP management software Kenya",
  "Netily ISP billing",
]

export const alternativePages: AlternativePage[] = [
  {
    slug: "centipid-billing",
    competitor: "Centipid Billing",
    searchNames: ["Centipid Billing", "Centipid Billing alternative", "Centipid ISP billing"],
    headline: "Centipid Billing alternative for Kenyan and East African ISPs",
    metaTitle: "Centipid Billing Alternative Kenya | Netily ISP Billing",
    metaDescription:
      "Compare Netily as a Centipid Billing alternative for ISPs that need M-Pesa STK Push, MikroTik PPPoE, hotspot billing, staff roles, and local growth workflows.",
    intro:
      "If your team is evaluating Centipid Billing, compare it against Netily on the workflows that matter most to Kenyan ISPs: M-Pesa collection, MikroTik subscriber actions, invoice automation, support visibility, and lead conversion.",
    bestFor:
      "Operators looking for ISP billing software that feels local to Kenya, supports day-to-day M-Pesa habits, and keeps network, billing, and customer work in one dashboard.",
    netilyAngle:
      "Netily focuses on M-Pesa-first billing, PPPoE footprint invoicing, hotspot revenue sharing, dashboard themes, staff role edits, and superadmin tools built around active ISP operations.",
    keywords: ["Centipid Billing alternative", "Centipid Billing Kenya", ...sharedKeywords],
  },
  {
    slug: "isp-man",
    competitor: "ISP Man",
    searchNames: ["ISP Man", "ISPMan", "ISP Man alternative", "ISP Man billing"],
    headline: "ISP Man alternative with M-Pesa, MikroTik, and modern ISP operations",
    metaTitle: "ISP Man Alternative Kenya | Netily ISP Management Software",
    metaDescription:
      "Netily is an ISP Man alternative for Kenyan ISPs that want M-Pesa automation, MikroTik provisioning, hotspot billing, role-based staff access, and growth analytics.",
    intro:
      "Searching for ISP Man usually means you want a practical ISP management system, not another generic CRM. Netily is built for the full ISP workflow from lead capture to payment, provisioning, invoicing, support, and renewal.",
    bestFor:
      "Small and growing ISPs that want local billing automation, clean customer management, and a product that keeps improving around Kenyan operator feedback.",
    netilyAngle:
      "Netily gives you subscriber billing, M-Pesa STK Push, MikroTik PPPoE workflows, hotspot billing, dashboard themes, staff role permissions, support tickets, and lifecycle reminders in one hosted platform.",
    keywords: ["ISP Man alternative", "ISPMan alternative", "ISP Man Kenya", ...sharedKeywords],
  },
  {
    slug: "wisp-man",
    competitor: "Wisp Man",
    searchNames: ["Wisp Man", "WISP Man", "WispMan", "Wisp Man alternative"],
    headline: "Wisp Man alternative for wireless ISPs and hotspot operators",
    metaTitle: "Wisp Man Alternative Kenya | Netily WISP Billing Software",
    metaDescription:
      "Compare Netily as a Wisp Man alternative for WISPs that need MikroTik integration, PPPoE accounting, hotspot billing, M-Pesa payments, and customer reminders.",
    intro:
      "Wireless ISPs need more than basic invoicing. Netily helps WISPs manage PPPoE users, hotspot access, routers, collections, reminders, staff access, and customer support without separate spreadsheets.",
    bestFor:
      "WISPs running MikroTik infrastructure, rural towers, apartment WiFi, campus WiFi, or public hotspot locations where payment status must match network access quickly.",
    netilyAngle:
      "Netily combines WISP billing, M-Pesa payment events, MikroTik-aware subscriber workflows, RADIUS visibility, hotspot sales, and usage-based Netily subscription billing.",
    keywords: ["Wisp Man alternative", "WISP Man alternative", "WISP billing software Kenya", ...sharedKeywords],
  },
  {
    slug: "jasiyo",
    competitor: "Jasiyo",
    searchNames: ["Jasiyo", "Jasiyo alternative", "Jasiyo ISP"],
    headline: "Jasiyo alternative for local ISP billing and subscriber growth",
    metaTitle: "Jasiyo Alternative Kenya | Netily ISP Billing Platform",
    metaDescription:
      "Looking for a Jasiyo alternative? Netily helps Kenyan ISPs automate M-Pesa billing, MikroTik subscriber workflows, hotspot access, leads, staff roles, and reminders.",
    intro:
      "If Jasiyo is on your shortlist, Netily is worth comparing when your priority is a complete ISP operating system: billing, subscribers, network access, staff permissions, support, and growth marketing.",
    bestFor:
      "ISP owners who want a hosted platform with local pricing, practical onboarding, and stronger operational visibility across sales, billing, support, and routers.",
    netilyAngle:
      "Netily is built to help ISPs convert leads, onboard customers, collect through M-Pesa, activate service faster, control staff permissions, and track billing cycles without guesswork.",
    keywords: ["Jasiyo alternative", "Jasiyo ISP billing", "Jasiyo Kenya", ...sharedKeywords],
  },
  {
    slug: "pawanet",
    competitor: "Pawanet",
    searchNames: ["Pawanet", "PawaNet", "Pawanet alternative", "Pawanet ISP"],
    headline: "Pawanet alternative for ISP billing, M-Pesa, and MikroTik operations",
    metaTitle: "Pawanet Alternative Kenya | Netily ISP Billing Software",
    metaDescription:
      "Netily is a Pawanet alternative for ISPs that need M-Pesa billing automation, MikroTik PPPoE workflows, hotspot management, invoice tracking, and staff controls.",
    intro:
      "Pawanet searches often come from ISP owners comparing local tools. Netily gives those operators a modern hosted stack for payments, billing cycles, customer management, support, and network-linked actions.",
    bestFor:
      "ISPs that want to reduce manual payment checks, track recurring invoices better, and use one platform for PPPoE users, hotspot customers, staff roles, and lead follow-up.",
    netilyAngle:
      "Netily adds current-cycle estimates, previous billing breakdowns, role-based admin access, dashboard themes, customer portals, reminders, and clear M-Pesa-first billing flows.",
    keywords: ["Pawanet alternative", "PawaNet alternative", "Pawanet ISP billing", ...sharedKeywords],
  },
  {
    slug: "lipanet",
    competitor: "Lipanet",
    searchNames: ["Lipanet", "LipaNet", "Lipanet alternative", "Lipanet ISP billing"],
    headline: "Lipanet alternative for M-Pesa-first ISP billing in Kenya",
    metaTitle: "Lipanet Alternative Kenya | Netily M-Pesa ISP Billing",
    metaDescription:
      "Compare Netily as a Lipanet alternative for ISPs that need M-Pesa STK Push, MikroTik automation, PPPoE billing, hotspot revenue workflows, and subscriber self-service.",
    intro:
      "If you are searching for Lipanet or LipaNet, you are likely evaluating payment-led internet billing. Netily goes further by connecting payments to subscribers, invoices, routers, reminders, roles, and support.",
    bestFor:
      "Kenyan ISPs that want M-Pesa collection to drive service activation, invoice status, customer communication, and operational reporting from one system.",
    netilyAngle:
      "Netily supports M-Pesa STK Push, PPPoE and hotspot workflows, customer self-service, previous billing cycle breakdowns, dashboard themes, and staff role edits for growing ISP teams.",
    keywords: ["Lipanet alternative", "LipaNet alternative", "Lipanet ISP billing", ...sharedKeywords],
  },
]

export const alternativeFeatureRows = [
  ["M-Pesa billing", "M-Pesa STK Push, receipt tracking, payment reminders, and billing-cycle visibility."],
  ["MikroTik workflows", "PPPoE, hotspot, router-linked subscriber actions, and RADIUS-aware operations."],
  ["Growth operations", "Lead capture, sales follow-up, customer onboarding, and support visibility."],
  ["Team control", "Staff role edits, permission-aware admin pages, and safer delegated operations."],
  ["Operator experience", "Dashboard themes, clearer billing breakdowns, invoice controls, and local Kenyan context."],
]

export function getAlternativePage(slug: string) {
  return alternativePages.find((page) => page.slug === slug)
}
