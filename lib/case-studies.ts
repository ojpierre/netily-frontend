export type CaseStudy = {
  slug: string
  region: string
  title: string
  subtitle: string
  metric: string
  metricLabel: string
  image: string
  imageAlt: string
  summary: string
  challenge: string
  approach: string[]
  outcomes: string[]
  seoTitle: string
  seoDescription: string
  keywords: string[]
}

export const caseStudies: CaseStudy[] = [
  {
    slug: "south-african-isp-revenue-growth",
    region: "South Africa",
    title: "South African ISP increased revenue and customers by 10%",
    subtitle: "A regional ISP used Internetily to tighten billing visibility, renewals, support follow-up, and subscriber operations.",
    metric: "10%",
    metricLabel: "revenue and customer growth",
    image: "/case-studies/south-africa-isp-revenue-growth.png",
    imageAlt: "South African ISP operations team reviewing billing and subscriber growth dashboards",
    summary:
      "This example case study shows how a growing ISP can use Internetily to bring billing, support, payments, and customer records into one operating rhythm.",
    challenge:
      "The team had paying customers, new leads, and router work moving in different places. Revenue follow-up was slow, support context was scattered, and management could not quickly see which accounts needed action.",
    approach: [
      "Mapped the active subscriber base into plans, payment status, and renewal workflows.",
      "Connected billing context with support follow-up so every customer record carried the right operational history.",
      "Used dashboard visibility to review growth, collections, overdue accounts, and team activity.",
    ],
    outcomes: [
      "Revenue and customer growth improved by 10% in the example model.",
      "Support teams had clearer context before contacting subscribers.",
      "Management could review billing health without waiting for manual spreadsheets.",
    ],
    seoTitle: "South African ISP Revenue Growth Case Study | Internetily",
    seoDescription:
      "See how a South African ISP could use Internetily to improve revenue, customer growth, billing visibility, renewals, and support follow-up.",
    keywords: ["South African ISP billing", "ISP revenue growth", "ISP billing case study", "WISP billing South Africa"],
  },
  {
    slug: "kenya-estate-hotspot-renewals",
    region: "Kenya",
    title: "Estate WiFi operator reduced renewal friction across hotspot customers",
    subtitle: "An estate and hotspot operator used clearer billing, voucher, support, and customer workflows to make renewals easier.",
    metric: "18%",
    metricLabel: "faster renewal follow-up",
    image: "/case-studies/kenya-estate-hotspot-renewals.png",
    imageAlt: "Estate WiFi support team reviewing hotspot renewals and network access dashboards",
    summary:
      "This example case study shows how managed WiFi and hotspot teams can use Internetily to simplify renewals, vouchers, and support requests.",
    challenge:
      "The operator served estate residents, visitors, and short-term hotspot users. Payments, plan status, and support requests were hard to reconcile quickly during busy periods.",
    approach: [
      "Grouped customers by plan type, expiry state, and support need.",
      "Aligned hotspot vouchers, renewals, and customer self-service into one support-friendly workflow.",
      "Gave the team a clearer operating view for daily renewal follow-up.",
    ],
    outcomes: [
      "Renewal follow-up became 18% faster in the example model.",
      "Support had better context for estate and hotspot customers.",
      "The operator could see active, expired, and renewing customers more clearly.",
    ],
    seoTitle: "Estate WiFi and Hotspot Renewal Case Study | Internetily",
    seoDescription:
      "Explore how an estate WiFi and hotspot operator could use Internetily to improve renewals, billing clarity, vouchers, and customer support.",
    keywords: ["estate WiFi billing", "hotspot billing case study", "WiFi billing system Kenya", "hotspot renewals"],
  },
  {
    slug: "uk-altnet-support-clarity",
    region: "United Kingdom",
    title: "UK altnet improved support clarity and renewal visibility",
    subtitle: "A small altnet team used Internetily-style workflows to bring billing, customer care, renewals, and router operations closer together.",
    metric: "22%",
    metricLabel: "fewer unresolved support loops",
    image: "/case-studies/uk-altnet-support-clarity.png",
    imageAlt: "UK altnet broadband operations team reviewing support and renewal dashboards",
    summary:
      "This example case study shows how altnets and WISPs can reduce support loops when billing, customer records, and network access live together.",
    challenge:
      "The team needed a clearer way to understand which support issues were billing-related, which were access-related, and which required network attention.",
    approach: [
      "Connected customer records with renewal state, support context, and router-facing operations.",
      "Used clearer dashboards to separate payment follow-up from technical support work.",
      "Created a practical workflow for support, billing, and operations teams to review the same customer state.",
    ],
    outcomes: [
      "Unresolved support loops reduced by 22% in the example model.",
      "Renewal visibility improved for billing and support teams.",
      "Customer follow-up became easier to prioritize.",
    ],
    seoTitle: "UK Altnet Support and Billing Clarity Case Study | Internetily",
    seoDescription:
      "See how a UK altnet could use Internetily to improve billing clarity, support response, renewal visibility, and customer operations.",
    keywords: ["UK altnet billing", "WISP billing UK", "ISP support case study", "broadband billing software UK"],
  },
]

export function getCaseStudy(slug: string) {
  return caseStudies.find((study) => study.slug === slug)
}
