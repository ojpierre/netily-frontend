import type { Metadata } from "next"
import MarketingLayout from "@/components/marketing/layout"
import { faqItems } from "@/lib/faq-data"
import { FaqClient } from "./faq-client"

export const metadata: Metadata = {
  title: "ISP Billing, MikroTik & Hotspot FAQs | Internetily",
  description: "Practical answers about Internetily ISP billing, MikroTik remote access, Hotspot plans, M-Pesa renewals, PPPoE reconnection, customer support and loyalty.",
  alternates: { canonical: "https://netily.co.ke/faqs" },
  keywords: ["ISP billing FAQ", "MikroTik FAQ", "Hotspot billing questions", "PPPoE renewal", "Internetily help", "Netily answers"],
}

export default function FaqPage() {
  const schema = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqItems.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: [item.answer, ...(item.steps || []), item.note || ""].filter(Boolean).join(" ") } })) }
  return <MarketingLayout><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} /><FaqClient /></MarketingLayout>
}
