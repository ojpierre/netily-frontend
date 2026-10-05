export type AcademyCourse = {
  slug: string
  title: string
  category: string
  level: "Beginner" | "Intermediate"
  duration: string
  price: string
  rating: string
  ratingsCount: number
  summary: string
  outcome: string
  lessons: string[]
  audience: string[]
  status: "Open" | "Popular" | "New"
  image: string
  imageAlt: string
  seoTitle: string
  seoDescription: string
  keywords: string[]
}

export const academyCourses: AcademyCourse[] = [
  {
    slug: "networking-fundamentals-for-isp-teams",
    title: "Networking Fundamentals for ISP Teams",
    category: "Networking foundation",
    level: "Beginner",
    duration: "42 min",
    price: "KES 2,500",
    rating: "",
    ratingsCount: 0,
    summary:
      "Learn the language of real ISP networks: routers, clients, IP addresses, access points, PPPoE, hotspot access, and basic troubleshooting.",
    outcome: "You will understand how customer access moves from the router to billing, support, and daily operations.",
    lessons: [
      "What an ISP actually does",
      "Routers, access points, backhaul, and customer devices",
      "PPPoE, hotspot, static clients, and basic IP planning",
      "Simple troubleshooting steps before escalation",
    ],
    audience: ["New ISP owners", "Support teams", "Technicians in training"],
    status: "Popular",
    image: "/academy/networking-foundations.webp",
    imageAlt: "Instructor teaching networking fundamentals with routers and dashboards",
    seoTitle: "Networking Fundamentals for ISP Teams | Internetily Academy",
    seoDescription:
      "Beginner-friendly ISP networking course covering routers, access points, PPPoE, hotspot access, IP basics, and troubleshooting.",
    keywords: ["ISP networking course", "networking fundamentals", "PPPoE training", "hotspot training"],
  },
  {
    slug: "upstream-backhaul-and-wisp-planning",
    title: "Upstream, Backhaul, and WISP Planning",
    category: "Infrastructure planning",
    level: "Intermediate",
    duration: "55 min",
    price: "KES 3,500",
    rating: "",
    ratingsCount: 0,
    summary:
      "Plan cleaner upstream links, failover paths, wireless backhaul, Starlink backup, tower sites, and customer expansion without overbuilding too early.",
    outcome: "You will know how to ask better questions before buying backhaul, radios, towers, or customer access equipment.",
    lessons: [
      "Choosing upstream providers and backup options",
      "Wireless backhaul basics for WISPs",
      "Capacity planning for small and growing networks",
      "Common rollout mistakes that create support problems",
    ],
    audience: ["WISP operators", "Network planners", "Field technicians"],
    status: "New",
    image: "/academy/wisp-backhaul.webp",
    imageAlt: "Network training workspace for upstream and backhaul planning",
    seoTitle: "Upstream and Backhaul Planning Course | Internetily Academy",
    seoDescription:
      "Practical course for WISP and ISP teams planning upstream providers, wireless backhaul, Starlink backup, capacity, and rollout growth.",
    keywords: ["WISP backhaul course", "upstream planning", "ISP infrastructure training", "Starlink backhaul ISP"],
  },
  {
    slug: "isp-operations-billing-and-support",
    title: "ISP Operations, Billing, and Support",
    category: "ISP operations",
    level: "Beginner",
    duration: "48 min",
    price: "KES 3,000",
    rating: "",
    ratingsCount: 0,
    summary:
      "Build a daily operating rhythm for plans, invoices, renewals, support tickets, customer records, staff roles, and payment follow-up.",
    outcome: "You will leave with a simple operating checklist your team can follow every day.",
    lessons: [
      "How billing cycles and customer states should work",
      "Renewal reminders and support follow-up",
      "Staff roles, permissions, and audit habits",
      "Simple dashboards every ISP owner should review",
    ],
    audience: ["ISP owners", "Billing teams", "Support managers"],
    status: "Popular",
    image: "/academy/isp-operations.webp",
    imageAlt: "ISP operations training for billing and support teams",
    seoTitle: "ISP Operations, Billing, and Support Course | Internetily Academy",
    seoDescription:
      "Learn practical ISP operations for billing cycles, renewals, support, customer records, staff roles, and owner dashboards.",
    keywords: ["ISP operations course", "ISP billing training", "ISP support training", "internet billing course"],
  },
  {
    slug: "market-survey-and-growth-for-isps",
    title: "Market Survey and Growth for ISPs",
    category: "Marketing and growth",
    level: "Beginner",
    duration: "38 min",
    price: "KES 2,500",
    rating: "",
    ratingsCount: 0,
    summary:
      "Learn how to validate an area, price packages, talk to estates, run local campaigns, and convert enquiries into paying subscribers.",
    outcome: "You will have a straightforward market survey and lead follow-up plan for your target area.",
    lessons: [
      "How to survey an estate, town, or hotspot location",
      "Pricing and package questions to answer early",
      "Local marketing channels that work for ISPs",
      "Lead follow-up habits that improve conversion",
    ],
    audience: ["New ISP founders", "Sales teams", "Growth-focused operators"],
    status: "Open",
    image: "/academy/market-survey.webp",
    imageAlt: "ISP growth training with learners reviewing market and customer data",
    seoTitle: "Market Survey and ISP Growth Course | Internetily Academy",
    seoDescription:
      "Learn practical market survey, local marketing, pricing, and lead conversion skills for starting or growing an ISP.",
    keywords: ["ISP market survey course", "ISP marketing course", "start ISP training", "ISP lead generation"],
  },
  {
    slug: "mikrotik-pppoe-and-mpesa",
    title: "MikroTik PPPoE and M-Pesa Setup",
    category: "ISP operations",
    level: "Intermediate",
    duration: "64 min",
    price: "KES 3,500",
    rating: "", ratingsCount: 0,
    summary: "Connect your router, create sensible plans, and follow a customer payment from M-Pesa confirmation to restored internet access.",
    outcome: "Build a repeatable setup checklist and test renewals before your first customer goes live.",
    lessons: ["Prepare the router and RADIUS connection", "Create PPPoE plans and customer credentials", "Connect payments and test confirmations", "Check renewals, expiry, and reconnection"],
    audience: ["ISP technicians", "Network administrators", "Growing WISP teams"],
    status: "New",
    image: "/academy/mikrotik-pppoe.webp",
    imageAlt: "African networking instructor and technicians configuring a MikroTik router",
    seoTitle: "MikroTik PPPoE and M-Pesa Course | Internetily Academy",
    seoDescription: "Learn a practical MikroTik PPPoE setup workflow, customer plans, RADIUS checks, M-Pesa confirmations, and renewal testing.",
    keywords: ["MikroTik PPPoE course", "M-Pesa ISP training", "RADIUS setup", "ISP technician training"]
  },
  {
    slug: "fiber-olt-and-onu-operations",
    title: "Fibre, OLT, and ONU Operations",
    category: "Infrastructure planning",
    level: "Intermediate",
    duration: "58 min",
    price: "KES 3,500",
    rating: "", ratingsCount: 0,
    summary: "Understand the path from your OLT to a customer's ONU, keep a clear port map, and troubleshoot fibre faults without guessing.",
    outcome: "Create a tidy fibre handover checklist covering optical readings, device records, provisioning, and support.",
    lessons: ["Understand OLT ports, splitters, and ONUs", "Plan fibre routes and record installations", "Provision devices and check optical levels", "Troubleshoot faults and prepare for growth"],
    audience: ["Fibre technicians", "FTTH operators", "Support teams"],
    status: "New",
    image: "/academy/fiber-olt.webp",
    imageAlt: "African fibre technicians learning at an OLT and optical patch panel",
    seoTitle: "Fibre OLT and ONU Management Course | Internetily Academy",
    seoDescription: "Practical FTTH training for OLT and ONU operations, fibre planning, optical checks, provisioning, and troubleshooting.",
    keywords: ["OLT training", "ONU management course", "FTTH training Africa", "fibre network operations"]
  },
  {
    slug: "hotspot-wifi-and-captive-portals",
    title: "Hotspot WiFi and Captive Portals",
    category: "Networking foundation",
    level: "Beginner",
    duration: "51 min",
    price: "KES 3,000",
    rating: "", ratingsCount: 0,
    summary: "Set up a hotspot people can use easily. Plan WiFi coverage, choose packages, and test the full payment and reconnect journey.",
    outcome: "Launch with a checklist for coverage, captive portal access, payments, and returning customers.",
    lessons: ["Plan coverage and place access points", "Build clear hotspot plans and vouchers", "Test the captive portal and M-Pesa journey", "Help returning customers reconnect"],
    audience: ["Hotspot owners", "Community WiFi teams", "New technicians"],
    status: "New",
    image: "/academy/hotspot-wifi.webp",
    imageAlt: "African adult learners testing WiFi coverage using a phone and laptop",
    seoTitle: "Hotspot WiFi and Captive Portal Course | Internetily Academy",
    seoDescription: "Learn hotspot coverage planning, WiFi packages, vouchers, captive portal payments, and customer reconnection checks.",
    keywords: ["hotspot WiFi course", "captive portal training", "M-Pesa hotspot setup", "community WiFi Africa"]
  },
]

export function getAcademyCourse(slug: string) {
  return academyCourses.find((course) => course.slug === slug)
}

export const academyStats = [
  ["7", "practical courses"],
  ["5h+", "guided lessons"],
  ["KES", "local pricing"],
]
