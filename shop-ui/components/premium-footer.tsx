"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Facebook, Instagram, Mail, MapPin, Phone, Twitter } from "lucide-react"

export function PremiumFooter() {
  const footerLinks = {
    shop: [
      { label: "Routers & Gateways", href: "/shop/catalog?cat=Routers+%26+Gateways" },
      { label: "Switches & PoE", href: "/shop/catalog?cat=Switches+%26+PoE" },
      { label: "Fiber Optics & OLT", href: "/shop/catalog?cat=Fiber+Optics+%26+OLT" },
      { label: "Wireless & Backhaul", href: "/shop/catalog?cat=Wireless+%26+Backhaul" },
      { label: "Tools & Test Equipment", href: "/shop/catalog?cat=Tools+%26+Test+Equipment" },
    ],
    account: [
      { label: "B2B Proforma Quotes", href: "/shop/checkout" },
      { label: "Customer Account", href: "/shop/account/profile" },
      { label: "Orders & Invoices", href: "/shop/account/orders" },
      { label: "Catalog Admin", href: "/shop/admin" },
    ],
    policy: [
      { label: "Shopping Privacy Policy", href: "/shop/policies/privacy" },
      { label: "Cookie Policy", href: "/shop/policies/cookies" },
      { label: "Shipping & Returns", href: "/shop/policies/shipping-returns" },
      { label: "Warranty Policy", href: "/shop/policies/warranty" },
      { label: "Terms of Sale", href: "/shop/policies/terms" },
    ],
  }

  return (
    <footer className="bg-[#06183b] text-white">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
        <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Link href="/shop" className="mb-5 inline-flex">
              <Image
                src="/internetily-white-logo-320.webp"
                alt="Internetily Shop"
                width={510}
                height={156}
                className="h-32 w-auto object-contain"
              />
            </Link>
            <h3 className="mb-4 text-xl font-semibold">Network hardware, sourced with care.</h3>
            <p className="mb-6 text-sm leading-7 text-white/62">
              Subscribe for stock alerts, installation-friendly bundles, firmware notes, and private ISP pricing.
            </p>
            <div className="relative">
              <input
                type="email"
                placeholder="Enter your corporate email"
                className="w-full border-0 border-b border-white/25 bg-transparent py-3 pr-24 text-sm placeholder:text-white/42 focus:border-white focus:outline-none"
              />
              <button className="absolute right-0 top-1/2 -translate-y-1/2 text-xs uppercase tracking-[0.15em] transition hover:opacity-70">
                Subscribe
              </button>
            </div>
            <div className="mt-6 space-y-2 text-sm text-white/68">
              <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> 0100034307</p>
              <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> netilysupport@gmail.com</p>
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Kenya, serving regional ISP projects</p>
            </div>
          </motion.div>

          <FooterColumn title="Hardware" links={footerLinks.shop} delay={0.1} />
          <FooterColumn title="Store" links={footerLinks.account} delay={0.2} />
          <FooterColumn title="Policies" links={footerLinks.policy} delay={0.3} />
        </div>

        <div className="flex flex-col items-center justify-between gap-6 border-t border-white/15 pt-8 md:flex-row">
          <div className="flex items-center gap-8">
            <Link href="/shop" className="flex items-center">
              <Image
                src="/internetily-white-logo-320.webp"
                alt="Internetily Shop"
                width={420}
                height={126}
                className="h-28 w-auto object-contain"
              />
            </Link>
            <div className="flex items-center gap-4">
              <a href="https://instagram.com" className="transition hover:opacity-65" aria-label="Instagram">
                <Instagram className="h-4 w-4 stroke-[1.5]" />
              </a>
              <a href="https://facebook.com" className="transition hover:opacity-65" aria-label="Facebook">
                <Facebook className="h-4 w-4 stroke-[1.5]" />
              </a>
              <a href="https://twitter.com" className="transition hover:opacity-65" aria-label="Twitter">
                <Twitter className="h-4 w-4 stroke-[1.5]" />
              </a>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-white/55">
            <Link href="/shop/policies/privacy" className="transition hover:text-white/85">Privacy</Link>
            <Link href="/shop/policies/terms" className="transition hover:text-white/85">Terms</Link>
            <Link href="/shop/policies/cookies" className="transition hover:text-white/85">Cookies</Link>
            <span>© 2026 Internetily Shop. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  title,
  links,
  delay,
}: {
  title: string
  links: Array<{ label: string; href: string }>
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
    >
      <h4 className="mb-6 text-xs uppercase tracking-[0.2em] text-white/55">{title}</h4>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-sm text-white/78 transition hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}
