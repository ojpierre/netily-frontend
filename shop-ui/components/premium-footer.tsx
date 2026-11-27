"use client"

import Image from "next/image"
import Link from "next/link"
import { Mail, MessageCircle, Phone, Smartphone } from "lucide-react"
import { featuredCategories } from "@/shop-ui/lib/featured-catalog"
import { useShopSettings } from "@/shop-ui/lib/use-shop-settings"
import { categoryHref, HEADING_FONT, whatsappLink } from "@/shop-ui/lib/shop-helpers"

const help = [
  { label: "How to order", href: "/shop/how-to-order" },
  { label: "Track an order", href: "/shop/track" },
  { label: "Shipping and returns", href: "/shop/policies/shipping-returns" },
  { label: "Warranty policy", href: "/shop/policies/warranty" },
  { label: "Terms of sale", href: "/shop/policies/terms" },
  { label: "Privacy policy", href: "/shop/policies/privacy" },
]

export function PremiumFooter() {
  const settings = useShopSettings()
  const email = settings?.support_email || "netilysupport@gmail.com"
  const phone = (settings?.support_phone || "0100034307").replace(/\s/g, "")
  const wa = settings?.whatsapp_number || "254100034307"
  const colTitle = "text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50"
  const linkClass = "text-sm text-white/80 outline-none transition hover:text-white focus-visible:text-white focus-visible:underline"

  return (
    <footer className="bg-[#17252d] text-white">
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Link href="/shop" className="inline-flex">
              <Image src="/internetily-white-logo-320.webp" alt="Internetily Shop" width={510} height={156} className="h-24 w-24 object-contain" />
            </Link>
            <p className={`${HEADING_FONT} mt-5 max-w-xs text-lg font-semibold leading-snug`}>Network equipment, picked by people who run networks.</p>
            <p className="mt-3 max-w-xs text-sm leading-6 text-white/65">
              Routers, fibre, Wi-Fi and power for ISPs, installers, offices and homes across Kenya.
            </p>
            <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/80">
              <Smartphone className="h-3.5 w-3.5 text-[#22a67d]" aria-hidden="true" />
              Pay with M-Pesa at checkout
            </span>
          </div>

          <nav aria-label="Categories">
            <h2 className={colTitle}>Categories</h2>
            <ul className="mt-4 space-y-2.5">
              {featuredCategories.map((c) => (
                <li key={c.slug}>
                  <Link href={categoryHref(c.slug)} className={linkClass}>
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Help">
            <h2 className={colTitle}>Help</h2>
            <ul className="mt-4 space-y-2.5">
              {help.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={linkClass}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className={colTitle}>Talk to us</h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a href={whatsappLink(wa, "Hi Internetily, I have a question about network equipment.")} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-white/85 hover:text-white">
                  <MessageCircle className="h-4 w-4 text-[#22a67d]" aria-hidden="true" />
                  WhatsApp an engineer
                </a>
              </li>
              <li>
                <a href={`tel:${phone}`} className="flex items-center gap-2.5 text-white/85 hover:text-white">
                  <Phone className="h-4 w-4 text-white/50" aria-hidden="true" />
                  {phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${email}?subject=Quote%20request`} className="flex items-center gap-2.5 break-all text-white/85 hover:text-white">
                  <Mail className="h-4 w-4 shrink-0 text-white/50" aria-hidden="true" />
                  {email}
                </a>
              </li>
            </ul>
            <p className="mt-5 text-sm leading-6 text-white/60">Send your parts list for a quote on bulk and ISP orders.</p>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Internetily Shop. Prices in Kenyan shillings.</p>
          <p>
            Running an ISP?{" "}
            <a href="https://netily.co.ke/" className="text-white/80 underline-offset-4 hover:text-white hover:underline">
              Bill it with Internetily
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
