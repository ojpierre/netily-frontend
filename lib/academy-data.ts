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
    image: "/academy/internetily-academy-training.webp",
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
    image: "/academy/internetily-academy-training.webp",
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
    image: "/academy/internetily-academy-training.webp",
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
    image: "/academy/internetily-academy-training.webp",
    imageAlt: "ISP growth training with learners reviewing market and customer data",
    seoTitle: "Market Survey and ISP Growth Course | Internetily Academy",
    seoDescription:
      "Learn practical market survey, local marketing, pricing, and lead conversion skills for starting or growing an ISP.",
    keywords: ["ISP market survey course", "ISP marketing course", "start ISP training", "ISP lead generation"],
  },
]

export function getAcademyCourse(slug: string) {
  return academyCourses.find((course) => course.slug === slug)
}

export const academyStats = [
  ["4", "practical courses"],
  ["2h+", "guided lessons"],
  ["KES", "local pricing"],
]
