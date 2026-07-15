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
  hiddenFromPublicIndex?: boolean
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
    competitor: "ISP billing evaluation",
    hiddenFromPublicIndex: true,
    searchNames: ["ISP billing software Kenya", "M-Pesa ISP billing automation", "MikroTik PPPoE billing software"],
    headline: "ISP billing evaluation checklist for Kenyan and East African ISPs",
    metaTitle: "ISP Billing Evaluation Checklist Kenya | Internetily",
    metaDescription:
      "A neutral checklist for ISPs evaluating M-Pesa STK Push, MikroTik PPPoE, hotspot billing, staff roles, and local growth workflows.",
    intro:
      "Use this neutral checklist to review the workflows that matter most to Kenyan ISPs: M-Pesa collection, MikroTik subscriber actions, invoice automation, support visibility, and lead conversion.",
    bestFor:
      "Operators looking for ISP billing software that feels local to Kenya, supports day-to-day M-Pesa habits, and keeps network, billing, and customer work in one dashboard.",
    netilyAngle:
      "Netily focuses on M-Pesa-first billing, PPPoE footprint invoicing, hotspot revenue sharing, dashboard themes, staff role edits, and superadmin tools built around active ISP operations.",
    keywords: ["ISP billing evaluation Kenya", "local ISP billing tool comparison", ...sharedKeywords],
  },
  {
    slug: "isp-man",
    competitor: "ISP management evaluation",
    hiddenFromPublicIndex: true,
    searchNames: ["ISP management software Kenya", "ISP billing software Kenya", "M-Pesa ISP billing automation"],
    headline: "ISP management evaluation checklist with M-Pesa and MikroTik workflows",
    metaTitle: "ISP Management Evaluation Checklist Kenya | Internetily",
    metaDescription:
      "A neutral checklist for Kenyan ISPs that want M-Pesa automation, MikroTik provisioning, hotspot billing, role-based staff access, and growth analytics.",
    intro:
      "A practical ISP management system should go beyond a generic CRM. Internetily is built for the full ISP workflow from lead capture to payment, provisioning, invoicing, support, and renewal.",
    bestFor:
      "Small and growing ISPs that want local billing automation, clean customer management, and a product that keeps improving around Kenyan operator feedback.",
    netilyAngle:
      "Netily gives you subscriber billing, M-Pesa STK Push, MikroTik PPPoE workflows, hotspot billing, dashboard themes, staff role permissions, support tickets, and lifecycle reminders in one hosted platform.",
    keywords: ["ISP management evaluation Kenya", "local ISP billing tool comparison", ...sharedKeywords],
  },
  {
    slug: "wisp-man",
    competitor: "WISP billing evaluation",
    hiddenFromPublicIndex: true,
    searchNames: ["WISP billing software Kenya", "wireless ISP billing software", "hotspot billing software Kenya"],
    headline: "WISP billing evaluation checklist for wireless ISPs and hotspot operators",
    metaTitle: "WISP Billing Evaluation Checklist Kenya | Internetily",
    metaDescription:
      "A neutral checklist for WISPs that need MikroTik integration, PPPoE accounting, hotspot billing, M-Pesa payments, and customer reminders.",
    intro:
      "Wireless ISPs need more than basic invoicing. Netily helps WISPs manage PPPoE users, hotspot access, routers, collections, reminders, staff access, and customer support without separate spreadsheets.",
    bestFor:
      "WISPs running MikroTik infrastructure, rural towers, apartment WiFi, campus WiFi, or public hotspot locations where payment status must match network access quickly.",
    netilyAngle:
      "Netily combines WISP billing, M-Pesa payment events, MikroTik-aware subscriber workflows, RADIUS visibility, hotspot sales, and usage-based Netily subscription billing.",
    keywords: ["WISP billing evaluation Kenya", "wireless ISP billing software Kenya", ...sharedKeywords],
  },
  {
    slug: "jasiyo",
    competitor: "local ISP billing evaluation",
    hiddenFromPublicIndex: true,
    searchNames: ["local ISP billing software", "ISP subscriber growth software", "M-Pesa ISP billing automation"],
    headline: "Local ISP billing evaluation checklist for subscriber growth",
    metaTitle: "Local ISP Billing Evaluation Checklist Kenya | Internetily",
    metaDescription:
      "A neutral checklist for Kenyan ISPs evaluating M-Pesa billing, MikroTik subscriber workflows, hotspot access, leads, staff roles, and reminders.",
    intro:
      "Internetily is worth evaluating when your priority is a complete ISP operating system: billing, subscribers, network access, staff permissions, support, and growth marketing.",
    bestFor:
      "ISP owners who want a hosted platform with local pricing, practical onboarding, and stronger operational visibility across sales, billing, support, and routers.",
    netilyAngle:
      "Netily is built to help ISPs convert leads, onboard customers, collect through M-Pesa, activate service faster, control staff permissions, and track billing cycles without guesswork.",
    keywords: ["local ISP billing evaluation Kenya", "ISP subscriber growth software", ...sharedKeywords],
  },
  {
    slug: "pawanet",
    competitor: "Local ISP billing tools",
    hiddenFromPublicIndex: true,
    searchNames: [
      "ISP billing software Kenya",
      "M-Pesa ISP billing automation",
      "MikroTik PPPoE billing software",
      "Hotspot billing software Kenya",
    ],
    headline: "ISP billing evaluation checklist for local operators",
    metaTitle: "ISP Billing Evaluation Checklist Kenya | Internetily",
    metaDescription:
      "Neutral checklist for Kenyan ISPs evaluating M-Pesa billing automation, MikroTik PPPoE workflows, hotspot management, invoice tracking, and staff controls.",
    intro:
      "Use this page as a neutral checklist when reviewing local ISP billing tools. Internetily, also known as Netily, gives operators a modern hosted stack for payments, billing cycles, customer management, support, and network-linked actions.",
    bestFor:
      "ISPs that want to reduce manual payment checks, track recurring invoices better, and use one platform for PPPoE users, hotspot customers, staff roles, and lead follow-up.",
    netilyAngle:
      "Netily adds current-cycle estimates, previous billing breakdowns, role-based admin access, dashboard themes, customer portals, reminders, and clear M-Pesa-first billing flows.",
    keywords: ["local ISP billing tool comparison", "ISP billing evaluation Kenya", ...sharedKeywords],
  },
  {
    slug: "lipanet",
    competitor: "M-Pesa ISP billing evaluation",
    hiddenFromPublicIndex: true,
    searchNames: ["M-Pesa ISP billing software", "payment-led ISP billing", "MikroTik billing software Kenya"],
    headline: "M-Pesa-first ISP billing evaluation checklist for Kenya",
    metaTitle: "M-Pesa ISP Billing Evaluation Checklist Kenya | Internetily",
    metaDescription:
      "A neutral checklist for ISPs that need M-Pesa STK Push, MikroTik automation, PPPoE billing, hotspot revenue workflows, and subscriber self-service.",
    intro:
      "If you are evaluating payment-led internet billing, Internetily connects payments to subscribers, invoices, routers, reminders, roles, and support.",
    bestFor:
      "Kenyan ISPs that want M-Pesa collection to drive service activation, invoice status, customer communication, and operational reporting from one system.",
    netilyAngle:
      "Netily supports M-Pesa STK Push, PPPoE and hotspot workflows, customer self-service, previous billing cycle breakdowns, dashboard themes, and staff role edits for growing ISP teams.",
    keywords: ["M-Pesa ISP billing evaluation", "payment-led ISP billing Kenya", ...sharedKeywords],
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

export const publicAlternativePages = alternativePages.filter((page) => !page.hiddenFromPublicIndex)
