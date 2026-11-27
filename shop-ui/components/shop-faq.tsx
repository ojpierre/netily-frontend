"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, MessageCircle, Mail } from "lucide-react"
import { formatShopMoney } from "@/shop-ui/lib/currency"
import { HEADING_FONT, whatsappLink } from "@/shop-ui/lib/shop-helpers"
import { useShopSettings } from "@/shop-ui/lib/use-shop-settings"

interface Faq {
  q: string
  a: string
}

export function useFaqs(): Faq[] {
  const settings = useShopSettings()
  const fee = settings?.default_shipping_fee ?? 0
  const free = settings?.free_shipping_threshold ?? null
  let deliveryExtra = ""
  if (fee > 0) deliveryExtra = ` Delivery starts at ${formatShopMoney(fee)}${free ? `, and is free on orders of ${formatShopMoney(free)} or more` : ""}.`
  else if (free) deliveryExtra = ` Delivery is free on orders of ${formatShopMoney(free)} or more.`

  return [
    {
      q: "How do I pay?",
      a: "Pay by M-Pesa. Place your order, then approve the prompt that arrives on your phone. The full amount is shown at every step of checkout, so nothing is added after you pay.",
    },
    {
      q: "How does delivery work?",
      a: `We prepare your order once stock is confirmed and payment has cleared. Delivery time depends on the item, where it ships from and your destination.${deliveryExtra} Check the packaging on arrival, and keep the box, serial labels and invoice until the equipment is tested.`,
    },
    {
      q: "What warranty do I get?",
      a: "Each product page shows its warranty. Cover follows the manufacturer or supplier terms shown on your invoice. Keep the invoice and the serial number, and send us clear photos or notes when you report a fault.",
    },
    {
      q: "Can I get a quote for a bulk or ISP order?",
      a: "Yes. Send your parts list, or a sketch of your topology, on WhatsApp or by email. We check ports, optics, PoE budget and capacity against what you plan to buy before you pay.",
    },
    {
      q: "Can I return something?",
      a: "Return eligibility depends on the condition of the item, its warranty status and the supplier rules. Hardware that has been installed, configured, opened or damaged may not qualify. Read the shipping and returns policy, or ask us before you order.",
    },
    {
      q: "How do I track my order?",
      a: "Open the Track order page and enter the order reference and tracking details from your confirmation. The status moves from payment to processing, dispatch and delivery.",
    },
  ]
}

export function faqJsonLd(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  }
}

export function ShopFaq() {
  const faqs = useFaqs()
  const settings = useShopSettings()
  const [open, setOpen] = useState<number | null>(0)
  const email = settings?.support_email || "netilysupport@gmail.com"

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqs)) }} />
      <div>
        <h2 className={`${HEADING_FONT} text-3xl font-semibold tracking-tight text-[#17252d]`}>Questions, answered.</h2>
        <p className="mt-3 max-w-sm text-[15px] leading-7 text-[#56656f]">
          Buying for an estate rollout or a single office? Send us your parts list and we will check it before you pay.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
          <a
            href={whatsappLink(settings?.whatsapp_number, "Hi Internetily, I would like a quote for these items:")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0874cf] px-5 text-sm font-semibold text-white outline-none transition hover:bg-[#075faa] focus-visible:ring-2 focus-visible:ring-[#0874cf] focus-visible:ring-offset-2"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Get a quote on WhatsApp
          </a>
          <a
            href={`mailto:${email}?subject=Quote%20request`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#dce4e8] bg-white px-5 text-sm font-semibold text-[#17252d] outline-none transition hover:border-[#0874cf] hover:text-[#0874cf] focus-visible:ring-2 focus-visible:ring-[#0874cf]"
          >
            <Mail className="h-4 w-4" aria-hidden="true" />
            Email us
          </a>
        </div>
        <p className="mt-5 text-sm text-[#56656f]">
          Already ordered?{" "}
          <Link href="/shop/track" className="font-semibold text-[#0874cf] hover:underline">
            Track your order
          </Link>
        </p>
      </div>

      <div className="divide-y divide-[#dce4e8] rounded-xl border border-[#dce4e8] bg-white">
        {faqs.map((f, i) => {
          const isOpen = open === i
          return (
            <div key={f.q}>
              <h3>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${i}`}
                  id={`faq-btn-${i}`}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-semibold text-[#17252d] outline-none transition hover:bg-[#f3f7f8] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0874cf]"
                >
                  {f.q}
                  <ChevronDown className={`h-4 w-4 shrink-0 text-[#56656f] transition-transform motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                </button>
              </h3>
              <div id={`faq-panel-${i}`} role="region" aria-labelledby={`faq-btn-${i}`} hidden={!isOpen}>
                <p className="px-5 pb-5 text-sm leading-7 text-[#56656f]">{f.a}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
